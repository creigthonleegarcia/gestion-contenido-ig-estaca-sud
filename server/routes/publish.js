import { Router } from 'express';
import db from '../db.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const META_API_BASE = 'https://graph.facebook.com/v22.0';

// Publish a post to Instagram
router.post('/:postId', requireRole('approver'), async (req, res) => {
  const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(req.params.postId);

  if (!post) return res.status(404).json({ error: 'Post no encontrado' });
  if (post.status !== 'approved' && post.status !== 'scheduled') {
    return res.status(400).json({ error: 'Solo se pueden publicar posts aprobados o programados' });
  }

  const accessToken = process.env.META_ACCESS_TOKEN;
  const igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;

  if (!accessToken || !igAccountId) {
    // Demo mode: simulate publishing
    db.prepare(`
      UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
      ig_media_id = ?, ig_permalink = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(`demo_${Date.now()}`, `https://instagram.com/p/demo_${Date.now()}`, req.params.postId);

    return res.json({
      message: 'Post publicado (modo demo - sin token de Meta configurado)',
      demo: true
    });
  }

  try {
    // Step 1: Create media container
    const caption = `${post.caption || ''}\n\n${post.hashtags || ''}`.trim();
    const containerParams = new URLSearchParams({
      caption,
      access_token: accessToken
    });

    if (post.media_url) {
      if (post.format === 'reel') {
        containerParams.set('media_type', 'REELS');
        containerParams.set('video_url', post.media_url);
      } else {
        containerParams.set('image_url', post.media_url);
      }
    }

    const containerRes = await fetch(`${META_API_BASE}/${igAccountId}/media`, {
      method: 'POST',
      body: containerParams
    });
    const containerData = await containerRes.json();

    if (containerData.error) {
      throw new Error(containerData.error.message);
    }

    // Step 2: Publish the container
    const publishRes = await fetch(`${META_API_BASE}/${igAccountId}/media_publish`, {
      method: 'POST',
      body: new URLSearchParams({
        creation_id: containerData.id,
        access_token: accessToken
      })
    });
    const publishData = await publishRes.json();

    if (publishData.error) {
      throw new Error(publishData.error.message);
    }

    // Update post in DB
    db.prepare(`
      UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
      ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(publishData.id, req.params.postId);

    res.json({ message: 'Post publicado en Instagram', ig_media_id: publishData.id });
  } catch (error) {
    console.error('Error publicando en Instagram:', error);
    res.status(500).json({ error: `Error al publicar: ${error.message}` });
  }
});

// Check Meta API connection status
router.get('/status', (req, res) => {
  const configured = !!(process.env.META_ACCESS_TOKEN && process.env.IG_BUSINESS_ACCOUNT_ID);
  res.json({
    configured,
    ig_account_id: configured ? process.env.IG_BUSINESS_ACCOUNT_ID : null,
    message: configured
      ? 'Conexión con Meta Graph API configurada'
      : 'Modo demo: configura META_ACCESS_TOKEN e IG_BUSINESS_ACCOUNT_ID en .env'
  });
});

export default router;
