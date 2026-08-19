import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// List all pillars
router.get('/', (req, res) => {
  const pillars = db.prepare('SELECT * FROM pillars ORDER BY sort_order').all();
  res.json(pillars);
});

// Get single pillar
router.get('/:id', (req, res) => {
  const pillar = db.prepare('SELECT * FROM pillars WHERE id = ?').get(req.params.id);
  if (!pillar) return res.status(404).json({ error: 'Pilar no encontrado' });
  res.json(pillar);
});

// Create pillar
router.post('/', (req, res) => {
  const { name, slug, color, icon, description, recommended_day, recommended_format } = req.body;
  if (!name || !slug || !color) {
    return res.status(400).json({ error: 'Nombre, slug y color son requeridos' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as max FROM pillars').get();
  const sort_order = (maxOrder.max || 0) + 1;

  const result = db.prepare(`
    INSERT INTO pillars (name, slug, color, icon, description, recommended_day, recommended_format, sort_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(name, slug, color, icon || '📌', description, recommended_day, recommended_format, sort_order);

  const pillar = db.prepare('SELECT * FROM pillars WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(pillar);
});

// Update pillar
router.put('/:id', (req, res) => {
  const { name, color, icon, description, recommended_day, recommended_format, active } = req.body;

  db.prepare(`
    UPDATE pillars SET name = COALESCE(?, name), color = COALESCE(?, color),
    icon = COALESCE(?, icon), description = COALESCE(?, description),
    recommended_day = COALESCE(?, recommended_day), recommended_format = COALESCE(?, recommended_format),
    active = COALESCE(?, active)
    WHERE id = ?
  `).run(name, color, icon, description, recommended_day, recommended_format, active, req.params.id);

  const pillar = db.prepare('SELECT * FROM pillars WHERE id = ?').get(req.params.id);
  res.json(pillar);
});

// Get pillar stats
router.get('/:id/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT
      COUNT(*) as total_posts,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as in_review
    FROM posts WHERE pillar_id = ?
  `).get(req.params.id);

  const insights = db.prepare(`
    SELECT
      COALESCE(AVG(ic.reach), 0) as avg_reach,
      COALESCE(AVG(ic.engagement), 0) as avg_engagement,
      COALESCE(SUM(ic.likes), 0) as total_likes
    FROM insights_cache ic
    JOIN posts p ON ic.post_id = p.id
    WHERE p.pillar_id = ?
  `).get(req.params.id);

  res.json({ ...stats, ...insights });
});

export default router;
