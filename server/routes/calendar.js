import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Get calendar posts for a month
router.get('/', (req, res) => {
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, '0')}-01`;

  const posts = db.prepare(`
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color, pl.icon as pillar_icon,
           u.name as creator_name
    FROM posts p
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.scheduled_at >= ? AND p.scheduled_at < ?
    ORDER BY p.scheduled_at ASC
  `).all(startDate, endDate);

  res.json(posts);
});

// Generate monthly template
router.post('/generate', (req, res) => {
  const { year, month } = req.body;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 2; // Next month by default

  const pillars = db.prepare('SELECT * FROM pillars WHERE active = 1 ORDER BY sort_order').all();
  const pillarMap = {};
  for (const p of pillars) {
    if (p.recommended_day) pillarMap[p.recommended_day] = p;
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const suggestions = [];
  const daysInMonth = new Date(y, m, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(y, m - 1, day);
    const dayName = dayNames[date.getDay()];
    const pillar = pillarMap[dayName];

    if (pillar) {
      suggestions.push({
        date: `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        day_name: dayName,
        pillar_id: pillar.id,
        pillar_name: pillar.name,
        pillar_color: pillar.color,
        pillar_icon: pillar.icon,
        recommended_format: pillar.recommended_format,
        suggested_time: '09:00'
      });
    }
  }

  res.json({ year: y, month: m, suggestions });
});

export default router;
