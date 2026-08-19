import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|mp4|mov|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  }
});

const router = Router();
router.use(authenticateToken);

// List posts with filters
router.get('/', (req, res) => {
  const { status, pillar_id, format, page = 1, limit = 20 } = req.query;
  let query = `
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color, pl.icon as pillar_icon,
           u.name as creator_name
    FROM posts p
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (pillar_id) { query += ' AND p.pillar_id = ?'; params.push(pillar_id); }
  if (format) { query += ' AND p.format = ?'; params.push(format); }

  query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), (Number(page) - 1) * Number(limit));

  const posts = db.prepare(query).all(...params);

  const countQuery = query.replace(/SELECT .* FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*$/, '');
  const total = db.prepare(countQuery).get(...params.slice(0, -2));

  res.json({ posts, total: total?.total || posts.length, page: Number(page), limit: Number(limit) });
});

// Get single post
router.get('/:id', (req, res) => {
  const post = db.prepare(`
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color, pl.icon as pillar_icon,
           u.name as creator_name
    FROM posts p
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!post) return res.status(404).json({ error: 'Post no encontrado' });

  const approvals = db.prepare(`
    SELECT a.*, u.name as approver_name
    FROM approvals a
    LEFT JOIN users u ON a.approver_id = u.id
    WHERE a.post_id = ?
    ORDER BY a.created_at DESC
  `).all(req.params.id);

  const insights = db.prepare('SELECT * FROM insights_cache WHERE post_id = ?').get(req.params.id);

  res.json({ ...post, approvals, insights });
});

// Create post
router.post('/', upload.array('media', 10), (req, res) => {
  const { title, caption, hashtags, pillar_id, format, scheduled_at, norms_checklist } = req.body;

  if (!title) return res.status(400).json({ error: 'Título requerido' });

  const mediaPaths = req.files ? req.files.map(f => f.filename).join(',') : null;
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  const mediaUrl = req.files?.length ? `${baseUrl}/uploads/${req.files[0].filename}` : null;

  const result = db.prepare(`
    INSERT INTO posts (title, caption, hashtags, pillar_id, format, media_paths, media_url, scheduled_at, norms_checklist, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, caption, hashtags, pillar_id || null, format || 'static', mediaPaths, mediaUrl, scheduled_at || null, norms_checklist, req.user.id);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(post);
});

// Update post
router.put('/:id', upload.array('media', 10), (req, res) => {
  const existing = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Post no encontrado' });

  if (existing.status === 'published') {
    return res.status(400).json({ error: 'No se puede editar un post publicado' });
  }

  const { title, caption, hashtags, pillar_id, format, scheduled_at, norms_checklist, status } = req.body;

  let mediaPaths = existing.media_paths;
  let mediaUrl = existing.media_url;
  if (req.files?.length) {
    mediaPaths = req.files.map(f => f.filename).join(',');
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    mediaUrl = `${baseUrl}/uploads/${req.files[0].filename}`;
  }

  db.prepare(`
    UPDATE posts SET
      title = COALESCE(?, title), caption = COALESCE(?, caption),
      hashtags = COALESCE(?, hashtags), pillar_id = COALESCE(?, pillar_id),
      format = COALESCE(?, format), media_paths = COALESCE(?, media_paths),
      media_url = COALESCE(?, media_url), scheduled_at = COALESCE(?, scheduled_at),
      norms_checklist = COALESCE(?, norms_checklist), status = COALESCE(?, status),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, caption, hashtags, pillar_id, format, mediaPaths, mediaUrl, scheduled_at, norms_checklist, status, req.params.id);

  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  res.json(post);
});

// Submit for review
router.post('/:id/submit', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (post.status !== 'draft' && post.status !== 'rejected') {
    return res.status(400).json({ error: 'Solo borradores o rechazados pueden enviarse a revisión' });
  }

  db.prepare('UPDATE posts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('in_review', req.params.id);

  res.json({ message: 'Post enviado a revisión' });
});

// Delete post
router.delete('/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (post.status === 'published') {
    return res.status(400).json({ error: 'No se puede eliminar un post publicado' });
  }

  db.prepare('DELETE FROM posts WHERE id = ?').run(req.params.id);
  res.json({ message: 'Post eliminado' });
});

export default router;
