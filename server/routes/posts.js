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

function getMetaConfig() {
  return {
    token: process.env.META_ACCESS_TOKEN,
    igId: process.env.IG_BUSINESS_ACCOUNT_ID,
    isConnected: !!(process.env.META_ACCESS_TOKEN && process.env.IG_BUSINESS_ACCOUNT_ID)
  };
}

// List posts: Merges Local DB (In Review, Drafts, Scheduled) + Live Instagram Feed Posts
router.get('/', async (req, res) => {
  const { status, pillar_id, format } = req.query;

  // 1. Fetch local posts
  let query = `
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color, pl.icon as pillar_icon,
           u.name as creator_name
    FROM posts p
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (status && status !== 'live_ig') { query += ' AND p.status = ?'; params.push(status); }
  if (pillar_id) { query += ' AND p.pillar_id = ?'; params.push(pillar_id); }
  if (format) { query += ' AND p.format = ?'; params.push(format); }

  let localPosts = db.prepare(query).all(...params);

  // 2. Fetch Live Instagram Feed posts from Meta API
  let liveIgPosts = [];
  const { token, igId, isConnected } = getMetaConfig();

  if (isConnected && (!status || status === 'published' || status === 'live_ig')) {
    try {
      const igRes = await fetch(
        `https://graph.instagram.com/v22.0/${igId}/media?fields=id,caption,timestamp,media_type,media_url,thumbnail_url,permalink,like_count,comments_count&limit=25&access_token=${token}`
      );
      const igData = await igRes.json();
      if (igData?.data) {
        liveIgPosts = igData.data.map(item => {
          let fmt = 'static';
          if (item.media_type === 'CAROUSEL_ALBUM') fmt = 'carousel';
          else if (item.media_type === 'VIDEO') fmt = 'reel';

          // Guess pillar from caption keywords
          let pillarName = 'En Vivo en Instagram';
          let pillarColor = '#007da5';
          const capLower = (item.caption || '').toLowerCase();
          if (capLower.includes('templo') || capLower.includes('fe') || capLower.includes('jesucrist') || capLower.includes('paz')) {
            pillarName = 'Inspiración Doctrinal';
            pillarColor = '#007da5';
          } else if (capLower.includes('servicio') || capLower.includes('ayuda') || capLower.includes('manos')) {
            pillarName = 'Servicio / SirveAhora';
            pillarColor = '#318d43';
          } else if (capLower.includes('conferencia') || capLower.includes('actividad') || capLower.includes('viernes')) {
            pillarName = 'Información y Agenda';
            pillarColor = '#d45311';
          } else if (capLower.includes('jóvenes') || capLower.includes('mujeres') || capLower.includes('historia')) {
            pillarName = 'Historias y Pioneros';
            pillarColor = '#7c3aed';
          }

          const firstLine = item.caption ? item.caption.split('\n')[0].replace(/[#@].*$/, '').trim() : '';

          const imgUrl = (item.media_type === 'VIDEO' && item.thumbnail_url) ? item.thumbnail_url : (item.media_url || item.thumbnail_url);

          return {
            id: `ig-${item.id}`,
            ig_id: item.id,
            title: firstLine || 'Publicación en Feed de Instagram',
            caption: item.caption || '',
            hashtags: item.caption?.match(/#[a-zA-Z0-9_]+/g)?.join(' ') || '',
            format: fmt,
            media_paths: null,
            media_url: imgUrl,
            permalink: item.permalink,
            scheduled_at: item.timestamp,
            created_at: item.timestamp,
            status: 'published',
            is_live_ig: true,
            like_count: item.like_count || 0,
            comments_count: item.comments_count || 0,
            pillar_name: pillarName,
            pillar_color: pillarColor,
            creator_name: '@estacalaserena'
          };
        });

        // Filter live IG posts if format or pillar was requested
        if (format) {
          liveIgPosts = liveIgPosts.filter(p => p.format === format);
        }
      }
    } catch (e) {
      console.error('Error fetching live Instagram posts:', e.message);
    }
  }

  // If user only wanted local status like draft/in_review, don't append IG posts
  let allPosts = [];
  if (status === 'draft' || status === 'in_review' || status === 'rejected' || status === 'scheduled') {
    allPosts = [...localPosts];
  } else if (status === 'live_ig') {
    allPosts = [...liveIgPosts];
  } else {
    // Merge both
    allPosts = [...localPosts, ...liveIgPosts];
  }

  // 3. Custom Ordering Requirement:
  // 1st: "in_review" (En revisión)
  // 2nd: "scheduled" / "approved" / "published" (Ya en IG o listos para salir)
  // 3rd: "draft" / "rejected" (Borradores / Observados)
  const statusPriority = {
    in_review: 1,
    scheduled: 2,
    approved: 2,
    published: 3,
    rejected: 4,
    draft: 5
  };

  allPosts.sort((a, b) => {
    const pA = statusPriority[a.status] || 99;
    const pB = statusPriority[b.status] || 99;
    if (pA !== pB) return pA - pB;

    // Inside same group, newer date first
    const dateA = new Date(a.scheduled_at || a.created_at || 0).getTime();
    const dateB = new Date(b.scheduled_at || b.created_at || 0).getTime();
    return dateB - dateA;
  });

  res.json({
    posts: allPosts,
    total: allPosts.length,
    counts: {
      in_review: allPosts.filter(p => p.status === 'in_review').length,
      published: allPosts.filter(p => p.status === 'published').length,
      scheduled: allPosts.filter(p => p.status === 'scheduled').length,
      drafts: allPosts.filter(p => p.status === 'draft').length
    }
  });
});

// Get single post
router.get('/:id', (req, res) => {
  if (String(req.params.id).startsWith('ig-')) {
    return res.status(404).json({ error: 'Post de Instagram en vivo (no editable en base de datos local)' });
  }

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
