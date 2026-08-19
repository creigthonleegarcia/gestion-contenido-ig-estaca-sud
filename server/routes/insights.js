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
        const imgUrl = (post.media_type === 'VIDEO' && post.thumbnail_url) ? post.thumbnail_url : (post.media_url || post.thumbnail_url);
        const cleanCaption = post.caption ? post.caption.split('\n')[0].replace(/[#@].*$/, '').trim() : 'Publicación en Instagram';
        return {
          id: post.id,
          caption: cleanCaption || 'Publicación en Instagram',
          timestamp: post.timestamp,
          media_type: post.media_type,
          media_url: imgUrl,
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

// Helper: Fetch AI Strategic Recommendations from OpenAI
async function getAIRecommendations(context) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  try {
    const prompt = `Eres el asesor estratégico de Inteligencia Artificial para el Consejo de Comunicaciones de la Estaca La Serena (La Iglesia de Jesucristo de los Santos de los Últimos Días).
Analiza las siguientes métricas y contexto en tiempo real de la cuenta @estacalaserena:
- Seguidores reales: ${context.followers || 510}
- Alcance últimos 28 días: ${context.reach || 206} cuentas
- Cuentas con interacción: ${context.engaged || 22}
- Hora pico de audiencia online: 18:00 hrs (conurbación La Serena / Coquimbo)
- Pilares doctrinales: 1. Inspiración (40%), 2. Servicio/SirveAhora (25%), 3. Información/Agenda (20%), 4. Historias/Pioneros (15%).
- Publicaciones recientes destacadas: ${context.recentPosts?.slice(0, 3).map(p => `"${p.caption}" (likes: ${p.like_count}, shares: ${p.shares})`).join('; ') || 'Variadas'}

Genera exactamente entre 3 y 4 recomendaciones y mejoras estratégicas dinámicas, altamente accionables y específicas para elevar el alcance orgánico, retención y conexión espiritual de los miembros y amigos de la Iglesia.
Responde ÚNICAMENTE un objeto JSON válido con la clave "recommendations" que contenga un array de objetos con el siguiente esquema:
{
  "recommendations": [
    {
      "type": "algorithm" | "timing" | "pillar" | "content" | "community",
      "priority": "alta" | "media",
      "title": "Título corto y directo (máx 45 caracteres)",
      "description": "Explicación concisa y perspicaz del porqué (máx 140 caracteres)",
      "tip": "Tip accionable para el creador de contenido (máx 130 caracteres)",
      "color": "#007da5" | "#318d43" | "#d45311" | "#7c3aed" | "#db2777",
      "ai": true
    }
  ]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 800
      })
    });

    const data = await response.json();
    const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
    if (parsed.recommendations && Array.isArray(parsed.recommendations)) {
      return parsed.recommendations;
    }
  } catch (err) {
    console.error('Error generating OpenAI recommendations:', err.message);
  }
  return null;
}

// Recommendations engine — Enhanced with dynamic OpenAI intelligence
router.get('/recommendations', async (req, res) => {
  const { igId: recIgId, isConnected: recConnected } = getMetaConfig();

  // 1. Gather live context for AI
  let followers = 510;
  let reach = 0;
  let engaged = 0;
  let recentMediaList = [];

  if (recConnected) {
    const prof = await metaFetch(`/${recIgId}?fields=followers_count`);
    if (prof?.followers_count) followers = prof.followers_count;

    const since = Math.floor(Date.now() / 1000) - (28 * 86400);
    const until = Math.floor(Date.now() / 1000);
    const ins = await metaFetch(`/${recIgId}/insights?metric=reach,accounts_engaged&period=day&metric_type=total_value&since=${since}&until=${until}`);
    if (ins?.data) {
      ins.data.forEach(m => {
        if (m.name === 'reach') reach = m.total_value?.value || 0;
        if (m.name === 'accounts_engaged') engaged = m.total_value?.value || 0;
      });
    }

    const media = await metaFetch(`/${recIgId}/media?fields=id,caption,like_count,timestamp&limit=5`);
    if (media?.data) recentMediaList = media.data;
  }

  // 2. Try OpenAI Dynamic AI Recommendations
  const aiRecs = await getAIRecommendations({
    followers,
    reach,
    engaged,
    recentPosts: recentMediaList
  });

  if (aiRecs && aiRecs.length > 0) {
    return res.json(aiRecs);
  }

  // 3. Fallback to Local Algorithmic Recommendations
  const recommendations = [];

  // Best posting time
  recommendations.push({
    type: 'timing',
    priority: 'alta',
    title: 'Publicar a las 17:45 hrs (Pico 18:00)',
    description: 'El mayor volumen de seguidores está online a las 18:00 hrs. Publicar 15 min antes optimiza la indexación inicial.',
    tip: 'Programa en el calendario a las 17:45 hrs para captar a los miembros apenas abran la aplicación.',
    color: '#007da5',
    ai: false
  });

  // Pillar 1 rule
  recommendations.push({
    type: 'design',
    priority: 'media',
    title: 'Evitar logo en contenido inspiracional',
    description: 'Para Pilar 1 (Inspiración), usa tipografía limpia sin estampar el logo institucional.',
    tip: 'El contenido sin apariencia publicitaria tiene un 40% más de retención y envíos por DM.',
    color: '#318d43',
    ai: false
  });

  // Algorithm 2026 rule
  recommendations.push({
    type: 'algorithm',
    priority: 'alta',
    title: 'Métrica #1: Compartidos por DM',
    description: 'El algoritmo de Instagram 2026 prioriza los envíos por mensaje privado por encima de los likes.',
    tip: 'Diseña carruseles con citas o invitaciones que un miembro quiera compartir con un amigo o familiar.',
    color: '#d45311',
    ai: false
  });

  // Frequency
  recommendations.push({
    type: 'frequency',
    priority: 'media',
    title: 'Ritmo constante: 3-4 posts semanales',
    description: 'Mantener un flujo regular asegura presencia continua en el feed de la conurbación.',
    tip: 'Distribuye 2 posts inspiracionales, 1 de actividad y 1 de historia o testimonio a la semana.',
    color: '#7c3aed',
    ai: false
  });

  res.json(recommendations);
});

export default router;
