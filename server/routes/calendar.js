import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

function getMetaConfig() {
  return {
    token: process.env.META_ACCESS_TOKEN,
    igId: process.env.IG_BUSINESS_ACCOUNT_ID,
    isConnected: !!(process.env.META_ACCESS_TOKEN && process.env.IG_BUSINESS_ACCOUNT_ID)
  };
}

// Get calendar posts for a month (Local DB + Live Instagram Posts)
router.get('/', async (req, res) => {
  const { year, month } = req.query;
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || new Date().getMonth() + 1;

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, '0')}-01`;

  // 1. Local Database scheduled/published posts
  const localPosts = db.prepare(`
    SELECT p.*, pl.name as pillar_name, pl.color as pillar_color, pl.icon as pillar_icon,
           u.name as creator_name
    FROM posts p
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    LEFT JOIN users u ON p.created_by = u.id
    WHERE p.scheduled_at >= ? AND p.scheduled_at < ?
    ORDER BY p.scheduled_at ASC
  `).all(startDate, endDate);

  // 2. Fetch Live Instagram Feed posts from Meta API
  let liveIgPosts = [];
  const { token, igId, isConnected } = getMetaConfig();

  if (isConnected) {
    try {
      const igRes = await fetch(
        `https://graph.instagram.com/v22.0/${igId}/media?fields=id,caption,timestamp,media_type,media_url,thumbnail_url,permalink,like_count,comments_count&limit=100&access_token=${token}`
      );
      const igData = await igRes.json();
      if (igData?.data) {
        igData.data.forEach(item => {
          if (!item.timestamp) return;
          const dt = new Date(item.timestamp);
          const postYear = dt.getFullYear();
          const postMonth = dt.getMonth() + 1;

          // Check if it belongs to the requested month & year
          if (postYear === y && postMonth === m) {
            let fmt = 'static';
            if (item.media_type === 'CAROUSEL_ALBUM') fmt = 'carousel';
            else if (item.media_type === 'VIDEO') fmt = 'reel';

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

            let firstLine = item.caption ? item.caption.split('\n')[0].replace(/[#@].*$/, '').trim() : '';
            if (firstLine.length > 60) firstLine = firstLine.substring(0, 57) + '...';
            const imgUrl = (item.media_type === 'VIDEO' && item.thumbnail_url) ? item.thumbnail_url : (item.media_url || item.thumbnail_url);

            // Format date as YYYY-MM-DD HH:mm for standard matching
            const dateStr = `${postYear}-${String(postMonth).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;

            liveIgPosts.push({
              id: `ig-${item.id}`,
              ig_id: item.id,
              title: firstLine || 'Publicación en Instagram',
              caption: item.caption || '',
              format: fmt,
              media_url: imgUrl,
              permalink: item.permalink,
              scheduled_at: dateStr,
              status: 'published',
              is_live_ig: true,
              pillar_name: pillarName,
              pillar_color: pillarColor,
              like_count: item.like_count || 0
            });
          }
        });
      }
    } catch (e) {
      console.error('Error fetching calendar Instagram posts:', e.message);
    }
  }

  // Combine and sort by scheduled_at ascending
  const allPosts = [...localPosts, ...liveIgPosts].sort((a, b) => {
    return new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime();
  });

  res.json(allPosts);
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
        suggested_time: '18:00'
      });
    }
  }

  res.json({ year: y, month: m, suggestions });
});

export default router;
