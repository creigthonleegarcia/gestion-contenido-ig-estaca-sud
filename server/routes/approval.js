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

// Approve post
router.post('/:postId/approve', requireRole('approver'), (req, res) => {
  const { comments, norms_checklist } = req.body;
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);

  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (post.status !== 'in_review') {
    return res.status(400).json({ error: 'Solo se pueden aprobar posts en revisión' });
  }

  // Create approval record
  db.prepare(`
    INSERT INTO approvals (post_id, approver_id, action, comments) VALUES (?, ?, 'approved', ?)
  `).run(req.params.postId, req.user.id, comments);

  // Update post status: if has scheduled_at → scheduled, otherwise approved
  const newStatus = post.scheduled_at ? 'scheduled' : 'approved';
  db.prepare('UPDATE posts SET status = ?, norms_checklist = COALESCE(?, norms_checklist), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, norms_checklist, req.params.postId);

  const updated = db.prepare(`
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color
    FROM posts p LEFT JOIN pillars pl ON p.pillar_id = pl.id WHERE p.id = ?
  `).get(req.params.postId);

  res.json({ message: 'Post aprobado', post: updated });
});

// Reject post
router.post('/:postId/reject', requireRole('approver'), (req, res) => {
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
