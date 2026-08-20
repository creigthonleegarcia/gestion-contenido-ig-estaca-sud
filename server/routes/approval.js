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

// Helper: Resolve media URL to a public HTTPS URL that Meta API can access
function resolvePublicMediaUrl(post) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  
  // If already a public https URL, return as-is
  if (post.media_url && post.media_url.startsWith('https://')) {
    return post.media_url;
  }
  
  // If media_url points to localhost, replace with BASE_URL
  if (post.media_url && post.media_url.includes('localhost')) {
    const urlPath = new URL(post.media_url).pathname;
    return `${baseUrl}${urlPath}`;
  }
  
  // Build from media_paths
  if (post.media_paths) {
    const first = post.media_paths.split(',')[0].trim();
    if (first.startsWith('http')) return first;
    if (first.startsWith('docs/')) return `${baseUrl}/${first}`;
    return `${baseUrl}/uploads/${first}`;
  }
  
  return post.media_url;
}

// Helper: Publish post immediately to Instagram / Database
async function publishImmediately(post, norms_checklist) {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;
  const META_API_BASE = 'https://graph.facebook.com/v22.0';
  let igMediaId = null;

  const publicMediaUrl = resolvePublicMediaUrl(post);
  
  console.log(`\n📋 ═══════════════════════════════════════════════════`);
  console.log(`📋 PUBLICACIÓN INMEDIATA — Post ID: ${post.id}`);
  console.log(`📋 Título: "${post.title}"`);
  console.log(`📋 media_url original: ${post.media_url}`);
  console.log(`📋 media_url pública:  ${publicMediaUrl}`);
  console.log(`📋 Formato: ${post.format}`);
  console.log(`📋 ═══════════════════════════════════════════════════`);

  if (accessToken && igAccountId && publicMediaUrl && publicMediaUrl.startsWith('https://')) {
    try {
      const caption = `${post.caption || ''}\n\n${post.hashtags || ''}`.trim();
      const containerParams = new URLSearchParams({
        caption,
        access_token: accessToken
      });

      if (post.format === 'reel') {
        containerParams.set('media_type', 'REELS');
        containerParams.set('video_url', publicMediaUrl);
      } else {
        containerParams.set('image_url', publicMediaUrl);
      }

      console.log(`📤 [Paso 1/2] Creando contenedor en Meta API...`);
      console.log(`   → Endpoint: ${META_API_BASE}/${igAccountId}/media`);
      console.log(`   → image_url: ${publicMediaUrl}`);
      
      const containerRes = await fetch(`${META_API_BASE}/${igAccountId}/media`, {
        method: 'POST',
        body: containerParams
      });
      const containerData = await containerRes.json();
      
      console.log(`   ← Respuesta container:`, JSON.stringify(containerData));

      if (!containerData.error && containerData.id) {
        console.log(`📤 [Paso 2/2] Publicando contenedor ${containerData.id}...`);
        
        const publishRes = await fetch(`${META_API_BASE}/${igAccountId}/media_publish`, {
          method: 'POST',
          body: new URLSearchParams({
            creation_id: containerData.id,
            access_token: accessToken
          })
        });
        const publishData = await publishRes.json();
        
        console.log(`   ← Respuesta publish:`, JSON.stringify(publishData));
        
        if (publishData.id) {
          igMediaId = publishData.id;
          console.log(`✅ PUBLICADO EN INSTAGRAM — ig_media_id: ${igMediaId}`);
        } else {
          console.error(`❌ Meta API no devolvió ID de publicación:`, publishData);
        }
      } else {
        console.error(`❌ Error creando contenedor en Meta:`, containerData.error?.message || containerData);
      }
    } catch (err) {
      console.error(`❌ Error de red publicando en Meta:`, err.message);
    }
  } else {
    console.log(`⚠️  No se puede publicar en Meta API:`);
    if (!accessToken) console.log(`   - META_ACCESS_TOKEN no configurado`);
    if (!igAccountId) console.log(`   - IG_BUSINESS_ACCOUNT_ID no configurado`);
    if (!publicMediaUrl) console.log(`   - No hay media_url`);
    if (publicMediaUrl && !publicMediaUrl.startsWith('https://')) console.log(`   - media_url no es HTTPS: ${publicMediaUrl}`);
    console.log(`   → Guardando como publicación local`);
    igMediaId = `local_${Date.now()}`;
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
  
  console.log(`💾 Post ${post.id} actualizado en BD → status: published, ig_media_id: ${igMediaId}`);
  console.log(`📋 ═══════════════════════════════════════════════════\n`);
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
