import { Router } from 'express';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();
router.use(authenticateToken);

const API_BASE = 'https://graph.instagram.com/v22.0';

// Read env vars dynamically (dotenv loads in index.js)
function getMetaConfig() {
  return {
    token: process.env.META_ACCESS_TOKEN,
    igId: process.env.IG_BUSINESS_ACCOUNT_ID,
    isConnected: !!(process.env.META_ACCESS_TOKEN && process.env.IG_BUSINESS_ACCOUNT_ID)
  };
}

// Helper: fetch from Meta Graph API
async function metaFetch(endpoint) {
  try {
    const { token } = getMetaConfig();
    const url = endpoint.includes('?')
      ? `${API_BASE}${endpoint}&access_token=${token}`
      : `${API_BASE}${endpoint}?access_token=${token}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.error) {
      console.error(`Meta API error: ${data.error.message}`);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`Meta API fetch error: ${err.message}`);
    return null;
  }
}

// Dashboard overview — Real data from Meta + local DB
router.get('/overview', async (req, res) => {
  const { igId, isConnected } = getMetaConfig();

  // ── Local DB stats (always available) ──
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

  const pillarDistribution = db.prepare(`
    SELECT pl.name, pl.color, pl.icon, COUNT(p.id) as count
    FROM pillars pl
    LEFT JOIN posts p ON pl.id = p.pillar_id
    GROUP BY pl.id
    ORDER BY pl.sort_order
  `).all();

  const formatDistribution = db.prepare(`
    SELECT format, COUNT(*) as count FROM posts GROUP BY format
  `).all();

  // ── Real Instagram data ──
  let profile = null;
  let recentMedia = [];
  let accountInsights = null;
  let onlineFollowers = null;
  let topPosts = [];

  if (isConnected) {
    // 1. Profile
    profile = await metaFetch(
      `/${igId}?fields=id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url`
    );

    // 2. Recent media (last 25 posts with engagement)
    const mediaData = await metaFetch(
      `/${igId}/media?fields=id,caption,timestamp,media_type,media_url,thumbnail_url,permalink,like_count,comments_count&limit=25`
    );
    if (mediaData?.data) {
      recentMedia = mediaData.data;

      // Fetch insights for top posts (reach, shares, saved)
      const topByLikes = [...recentMedia].sort((a, b) => (b.like_count || 0) - (a.like_count || 0)).slice(0, 5);
      topPosts = await Promise.all(topByLikes.map(async (post) => {
        const insights = await metaFetch(
          `/${post.id}/insights?metric=reach,likes,comments,shares,saved`
        );
        const metrics = {};
        if (insights?.data) {
          insights.data.forEach(m => {
            metrics[m.name] = m.values?.[0]?.value || 0;
          });
        }
        return {
          id: post.id,
          caption: post.caption?.substring(0, 80) || 'Sin título',
          timestamp: post.timestamp,
          media_type: post.media_type,
          media_url: post.media_url,
          permalink: post.permalink,
          like_count: post.like_count || 0,
          comments_count: post.comments_count || 0,
          reach: metrics.reach || 0,
          shares: metrics.shares || 0,
          saved: metrics.saved || 0,
          engagement: (post.like_count || 0) + (post.comments_count || 0) + (metrics.shares || 0) + (metrics.saved || 0)
        };
      }));
    }

    // 3. Account insights (28 days)
    const since = Math.floor(Date.now() / 1000) - (28 * 86400);
    const until = Math.floor(Date.now() / 1000);
    accountInsights = await metaFetch(
      `/${igId}/insights?metric=reach,accounts_engaged&period=day&metric_type=total_value&since=${since}&until=${until}`
    );

    // 4. Online followers (best time to post)
    const since3 = Math.floor(Date.now() / 1000) - (3 * 86400);
    onlineFollowers = await metaFetch(
      `/${igId}/insights?metric=online_followers&period=lifetime&since=${since3}&until=${until}`
    );
  }

  // ── Build response ──
  const latestInsight = {
    followers: profile?.followers_count || 0,
    following: profile?.follows_count || 0,
    media_count: profile?.media_count || 0,
    reach: 0,
    accounts_engaged: 0
  };

  if (accountInsights?.data) {
    accountInsights.data.forEach(metric => {
      if (metric.name === 'reach') latestInsight.reach = metric.total_value?.value || 0;
      if (metric.name === 'accounts_engaged') latestInsight.accounts_engaged = metric.total_value?.value || 0;
    });
  }

  // Parse online followers into best hours
  let bestHours = null;
  if (onlineFollowers?.data?.[0]?.values?.[0]?.value) {
    const hourData = onlineFollowers.data[0].values[0].value;
    bestHours = Object.entries(hourData)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
  }

  // Build account growth from recent media dates
  const accountGrowth = recentMedia.map(m => ({
    date: m.timestamp,
    reach: m.like_count || 0,
    followers: profile?.followers_count || 0
  }));

  res.json({
    isConnected,
    profile: profile ? {
      username: profile.username,
      name: profile.name,
      biography: profile.biography,
      profile_picture_url: profile.profile_picture_url,
      followers_count: profile.followers_count,
      follows_count: profile.follows_count,
      media_count: profile.media_count
    } : null,
    postStats,
    pillarDistribution,
    latestInsight,
    accountGrowth,
    monthlyReach: {
      total_reach: latestInsight.reach,
      total_impressions: latestInsight.accounts_engaged,
      avg_daily_reach: latestInsight.reach > 0 ? Math.round(latestInsight.reach / 28) : 0
    },
    topPosts,
    recentMedia: recentMedia.slice(0, 10),
    bestHours,
    formatDistribution
  });
});

// Recommendations engine — enhanced with real data
router.get('/recommendations', async (req, res) => {
  const recommendations = [];
  const { igId: recIgId, isConnected: recConnected } = getMetaConfig();

  // ── Real-time recommendation: best posting time ──
  if (recConnected) {
    const since = Math.floor(Date.now() / 1000) - (3 * 86400);
    const until = Math.floor(Date.now() / 1000);
    const onlineData = await metaFetch(
      `/${recIgId}/insights?metric=online_followers&period=lifetime&since=${since}&until=${until}`
    );

    if (onlineData?.data?.[0]?.values?.[0]?.value) {
      const hours = onlineData.data[0].values[0].value;
      const sorted = Object.entries(hours)
        .map(([h, c]) => ({ hour: parseInt(h), count: c }))
        .sort((a, b) => b.count - a.count);

      if (sorted.length > 0) {
        const top3 = sorted.slice(0, 3).map(h => `${h.hour}:00`).join(', ');
        const peakHour = sorted[0];
        recommendations.push({
          type: 'timing',
          priority: 'high',
          icon: '⏰',
          title: `Mejor hora para publicar: ${peakHour.hour}:00`,
          description: `Tus seguidores están más activos a las ${top3}. ${peakHour.count} de tus 510 seguidores están conectados a las ${peakHour.hour}:00. Programa tus posts para estas horas.`,
          color: '#007da5',
          realtime: true
        });
      }
    }

    // Engagement rate from recent posts
    const mediaData = await metaFetch(
      `/${recIgId}/media?fields=id,like_count,comments_count,timestamp&limit=10`
    );
    if (mediaData?.data) {
      const posts = mediaData.data;
      const totalEng = posts.reduce((s, p) => s + (p.like_count || 0) + (p.comments_count || 0), 0);
      const avgEng = Math.round(totalEng / posts.length);
      const engRate = ((totalEng / posts.length) / 510 * 100).toFixed(1);

      recommendations.push({
        type: 'engagement',
        priority: engRate < 3 ? 'high' : 'low',
        icon: '📊',
        title: `Tasa de engagement: ${engRate}%`,
        description: `Promedio de ${avgEng} interacciones por post en las últimas ${posts.length} publicaciones. ${engRate < 3 ? 'Está por debajo del 3% recomendado. Prueba con Reels y preguntas en captions.' : 'Buen nivel de interacción. Mantén la consistencia.'}`,
        color: engRate < 3 ? '#e74c3c' : '#318d43',
        realtime: true
      });
    }
  }

  // ── Local DB recommendations ──
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

  const recentPosts = db.prepare(`
    SELECT COUNT(*) as count FROM posts WHERE created_at >= datetime('now', '-7 days')
  `).get();

  if (recentPosts.count < 3) {
    recommendations.push({
      type: 'frequency',
      priority: 'medium',
      icon: '📅',
      title: 'Aumenta la frecuencia',
      description: `Solo ${recentPosts.count} publicaciones esta semana. La estrategia recomienda 3-4 por semana.`,
      color: '#f5a623'
    });
  }

  const pendingReviews = db.prepare(
    "SELECT COUNT(*) as count FROM posts WHERE status = 'in_review'"
  ).get();

  if (pendingReviews.count > 0) {
    recommendations.push({
      type: 'approval',
      priority: 'high',
      icon: '⏳',
      title: 'Posts pendientes de aprobación',
      description: `Hay ${pendingReviews.count} post(s) esperando aprobación.`,
      color: '#e74c3c'
    });
  }

  // Static best-practice tips
  recommendations.push({
    type: 'design',
    priority: 'medium',
    icon: '🎨',
    title: 'Evitar logo en contenido inspiracional',
    description: 'Para Pilar 1 (Inspiración), usa identidad visual sin estampar el logo. La audiencia scrollea más rápido contenido que "huele" a publicidad.',
    color: '#9b59b6'
  });

  recommendations.push({
    type: 'algorithm',
    priority: 'medium',
    icon: '📤',
    title: 'Señal #1: compartidos por DM',
    description: 'Los envíos por DM son la métrica más importante del algoritmo 2026. Crea contenido que la gente quiera compartir.',
    color: '#318d43'
  });

  recommendations.push({
    type: 'warning',
    priority: 'high',
    icon: '⚠️',
    title: 'No usar marcas de agua de otras apps',
    description: 'Instagram reduce el alcance de contenido con logos de TikTok, YouTube o CapCut.',
    color: '#e74c3c'
  });

  res.json(recommendations);
});

export default router;
