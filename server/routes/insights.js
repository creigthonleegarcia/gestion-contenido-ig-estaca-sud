import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

// Dashboard overview
router.get('/overview', (req, res) => {
  // Post stats
  const postStats = db.prepare(`
    SELECT
      COUNT(*) as total_posts,
      SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
      SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
      SUM(CASE WHEN status = 'in_review' THEN 1 ELSE 0 END) as pending_review,
      SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as drafts,
      SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
    FROM posts
  `).get();

  // Pillar distribution
  const pillarDistribution = db.prepare(`
    SELECT pl.name, pl.color, pl.icon, COUNT(p.id) as count
    FROM pillars pl
    LEFT JOIN posts p ON pl.id = p.pillar_id
    GROUP BY pl.id
    ORDER BY pl.sort_order
  `).all();

  // Latest account insights
  const latestInsight = db.prepare(
    'SELECT * FROM account_insights ORDER BY date DESC LIMIT 1'
  ).get();

  // Account growth (last 30 days)
  const accountGrowth = db.prepare(
    'SELECT * FROM account_insights ORDER BY date DESC LIMIT 30'
  ).all().reverse();

  // This month engagement summary
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyReach = db.prepare(`
    SELECT COALESCE(SUM(reach), 0) as total_reach,
           COALESCE(SUM(impressions), 0) as total_impressions,
           COALESCE(AVG(reach), 0) as avg_daily_reach
    FROM account_insights
    WHERE date LIKE ?
  `).get(`${currentMonth}%`);

  // Top performing posts
  const topPosts = db.prepare(`
    SELECT p.title, p.format, pl.name as pillar_name, pl.color as pillar_color,
           ic.reach, ic.engagement, ic.likes, ic.shares, ic.saves
    FROM insights_cache ic
    JOIN posts p ON ic.post_id = p.id
    LEFT JOIN pillars pl ON p.pillar_id = pl.id
    ORDER BY ic.engagement DESC
    LIMIT 5
  `).all();

  // Format distribution
  const formatDistribution = db.prepare(`
    SELECT format, COUNT(*) as count
    FROM posts
    GROUP BY format
  `).all();

  res.json({
    postStats,
    pillarDistribution,
    latestInsight,
    accountGrowth,
    monthlyReach,
    topPosts,
    formatDistribution
  });
});

// Recommendations engine
router.get('/recommendations', (req, res) => {
  const recommendations = [];

  // Check pillar balance
  const pillarCounts = db.prepare(`
    SELECT pl.name, pl.color, COUNT(p.id) as count
    FROM pillars pl LEFT JOIN posts p ON pl.id = p.pillar_id AND p.status IN ('published', 'scheduled')
    GROUP BY pl.id ORDER BY count ASC
  `).all();

  if (pillarCounts.length > 0) {
    const min = pillarCounts[0];
    const max = pillarCounts[pillarCounts.length - 1];
    if (max.count > 0 && min.count < max.count * 0.5) {
      recommendations.push({
        type: 'balance',
        priority: 'high',
        icon: '⚖️',
        title: 'Equilibra los pilares',
        description: `El pilar "${min.name}" tiene pocas publicaciones (${min.count}) comparado con "${max.name}" (${max.count}). Considera crear más contenido de ${min.name}.`,
        color: min.color
      });
    }
  }

  // Check posting frequency
  const recentPosts = db.prepare(`
    SELECT COUNT(*) as count FROM posts
    WHERE created_at >= datetime('now', '-7 days')
  `).get();

  if (recentPosts.count < 3) {
    recommendations.push({
      type: 'frequency',
      priority: 'medium',
      icon: '📅',
      title: 'Aumenta la frecuencia',
      description: `Solo ${recentPosts.count} publicaciones esta semana. La estrategia recomienda 3-4 por semana para mantener el alcance orgánico.`,
      color: '#f5a623'
    });
  }

  // Check pending reviews
  const pendingReviews = db.prepare(
    "SELECT COUNT(*) as count FROM posts WHERE status = 'in_review'"
  ).get();

  if (pendingReviews.count > 0) {
    recommendations.push({
      type: 'approval',
      priority: 'high',
      icon: '⏳',
      title: 'Posts pendientes de aprobación',
      description: `Hay ${pendingReviews.count} post(s) esperando aprobación. Aprobarlos a tiempo mejora la consistencia del calendario.`,
      color: '#e74c3c'
    });
  }

  // Engagement tips based on data
  const avgEngagement = db.prepare(`
    SELECT AVG(engagement) as avg FROM insights_cache
  `).get();

  if (avgEngagement.avg !== null) {
    recommendations.push({
      type: 'insight',
      priority: 'low',
      icon: '💡',
      title: 'Tip de engagement',
      description: 'Los Reels con subtítulos y formato 9:16 generan hasta 3x más alcance. Prioriza video vertical para los pilares de Servicio e Historias.',
      color: '#4a90d9'
    });
  }

  // Logo/Branding recommendations from research
  recommendations.push({
    type: 'design',
    priority: 'medium',
    icon: '🎨',
    title: 'Evitar logo en contenido inspiracional',
    description: 'El algoritmo NO penaliza tu logo propio (confirmado por Adam Mosseri), pero la audiencia scrollea más rápido contenido que "huele" a publicidad. Para Pilar 1 (Inspiración), usa identidad visual (colores/tipografía) sin estampar el logo. El nombre de usuario ya identifica la cuenta.',
    color: '#9b59b6'
  });

  // Watermark warning
  recommendations.push({
    type: 'warning',
    priority: 'high',
    icon: '⚠️',
    title: 'Nunca usar marcas de agua de otras apps',
    description: 'Instagram reduce activamente el alcance de contenido con logos de TikTok, YouTube o CapCut. Siempre sube contenido original sin marcas de agua de terceros.',
    color: '#e74c3c'
  });

  // DM shares as #1 signal
  recommendations.push({
    type: 'algorithm',
    priority: 'medium',
    icon: '📤',
    title: 'Señal #1 del algoritmo: compartidos por DM',
    description: 'En 2026, los envíos por DM son la métrica más importante del algoritmo de Instagram. Crea contenido que las personas quieran compartir con amigos y familia — versículos, momentos inspiradores y datos útiles de la estaca.',
    color: '#34c759'
  });

  // Logo usage guide by pillar
  recommendations.push({
    type: 'guide',
    priority: 'low',
    icon: '📋',
    title: 'Guía de uso de logo por pilar',
    description: 'Inspiración: SIN logo (máx autenticidad). Servicio/SirveAhora: logo sutil como firma (será reposteado). Información/Agenda: logo aceptable (credibilidad institucional). Historias/Pioneros: SIN logo (protagonista es la persona).',
    color: '#f5a623'
  });

  res.json(recommendations);
});

export default router;
