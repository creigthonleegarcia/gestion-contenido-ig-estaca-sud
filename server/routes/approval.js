import { Router } from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get approval queue (posts in_review)
router.get('/queue', (req, res) => {
  const posts = db.prepare(`
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color, pl.icon as pillar_icon,
           u.name as creator_name
    FROM posts p
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.status = 'in_review'
    ORDER BY p.scheduled_at ASC, p.created_at ASC
  `).all();

  res.json(posts);
});

// Get approval history
router.get('/history', (req, res) => {
  const history = db.prepare(`
    SELECT a.*, p.title as post_title, p.status as post_status,
           u.name as approver_name, pl.name as pillar_name, pl.color as pillar_color
    FROM approvals a
    JOIN posts p ON a.post_id = p.id
    LEFT JOIN users u ON a.approver_id = u.id
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    ORDER BY a.created_at DESC
    LIMIT 50
  `).all();

  res.json(history);
});

// Helper: Publish post immediately to Instagram / Database
async function publishImmediately(post, norms_checklist) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const META_API_BASE = 'https://graph.facebook.com/v22.0';
  let igMediaId = null;

  if (accessToken && igAccountId && post.media_url && post.media_url.startsWith('https://')) {
    try {
      const caption = `${post.caption || ''}\n\n${post.hashtags || ''}`.trim();
      const containerParams = new URLSearchParams({
        caption,
        access_token: accessToken
      });

      if (post.format === 'reel') {
        containerParams.set('media_type', 'REELS');
        containerParams.set('video_url', post.media_url);
      } else {
        containerParams.set('image_url', post.media_url);
      }

      const containerRes = await fetch(`${META_API_BASE}/${igAccountId}/media`, {
        method: 'POST',
        body: containerParams
      });
      const containerData = await containerRes.json();

      if (!containerData.error && containerData.id) {
        const publishRes = await fetch(`${META_API_BASE}/${igAccountId}/media_publish`, {
          method: 'POST',
          body: new URLSearchParams({
            creation_id: containerData.id,
            access_token: accessToken
          })
        });
        const publishData = await publishRes.json();
        if (publishData.id) igMediaId = publishData.id;
      }
    } catch (err) {
      console.error('Error publicando directamente a Meta:', err.message);
    }
  }

  db.prepare(`
    UPDATE posts 
    SET status = 'published', 
        published_at = CURRENT_TIMESTAMP, 
        ig_media_id = COALESCE(?, ig_media_id),
        norms_checklist = COALESCE(?, norms_checklist), 
        updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(igMediaId, norms_checklist, post.id);
}

// Approve post — with automatic immediate publish if scheduled_at has passed
router.post('/:postId/approve', async (req, res) => {
  const { comments, norms_checklist } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);

  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (post.status !== 'in_review') {
    return res.status(400).json({ error: 'Solo se pueden aprobar posts en revisión' });
  }

  // Create approval audit record
  db.prepare(`
    INSERT INTO approvals (post_id, approver_id, action, comments) VALUES (?, ?, 'approved', ?)
  `).run(req.params.postId, req.user.id, comments || '');

  const now = new Date();
  const scheduledTime = post.scheduled_at ? new Date(post.scheduled_at) : null;
  const isPastOrImmediate = !scheduledTime || scheduledTime <= now;

  let message = 'Post aprobado con éxito';

  if (isPastOrImmediate) {
    // Si la hora programada ya pasó o no se especificó, se publica de inmediato
    await publishImmediately(post, norms_checklist);
    message = 'Post aprobado y publicado de inmediato (la fecha programada ya había vencido)';
    console.log(`🚀 Post ID ${post.id} ("${post.title}") publicado de inmediato tras aprobación`);
  } else {
    // Si la fecha es a futuro, queda en estado 'scheduled' para el cron scheduler
    db.prepare('UPDATE posts SET status = ?, norms_checklist = COALESCE(?, norms_checklist), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run('scheduled', norms_checklist, req.params.postId);
    message = `Post aprobado y programado para el ${scheduledTime.toLocaleString('es-CL')}`;
  }

  const updated = db.prepare(`
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color
    FROM posts p LEFT JOIN pillars pl ON p.pillar_id = pl.id WHERE p.id = ?
  `).get(req.params.postId);

  res.json({ message, post: updated });
});

// Reject / Observe post
router.post('/:postId/reject', (req, res) => {
  const { comments } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);

  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (post.status !== 'in_review') {
    return res.status(400).json({ error: 'Solo se pueden rechazar posts en revisión' });
  }

  if (!comments) {
    return res.status(400).json({ error: 'Debe proporcionar un motivo de rechazo' });
  }

  db.prepare(`
    INSERT INTO approvals (post_id, approver_id, action, comments) VALUES (?, ?, 'rejected', ?)
  `).run(req.params.postId, req.user.id, comments);

  db.prepare('UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('rejected', req.params.postId);

  res.json({ message: 'Post rechazado' });
});

export default router;
