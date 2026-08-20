import cron from 'node-cron';
import db from '../db.js';

// Resolve media URL to public HTTPS URL for Meta API
function resolvePublicMediaUrl(post) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
  
  if (post.media_url && post.media_url.startsWith('https://')) return post.media_url;
  
  if (post.media_url && post.media_url.includes('localhost')) {
    const urlPath = new URL(post.media_url).pathname;
    return `${baseUrl}${urlPath}`;
  }
  
  if (post.media_paths) {
    const first = post.media_paths.split(',')[0].trim();
    if (first.startsWith('http')) return first;
    if (first.startsWith('docs/')) return `${baseUrl}/${first}`;
    return `${baseUrl}/uploads/${first}`;
  }
  
  return post.media_url;
}

export function startScheduler() {
  // Check every minute for posts that need to be published
  cron.schedule('* * * * *', async () => {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const scheduledPosts = db.prepare(`
      SELECT * FROM posts
      WHERE status = 'scheduled'
      AND scheduled_at <= ?
    `).all(now);

    for (const post of scheduledPosts) {
      console.log(`\n⏰ ═══════════════════════════════════════════════════`);
      console.log(`⏰ SCHEDULER — Auto-publicando post: "${post.title}" (ID: ${post.id})`);
      console.log(`⏰ scheduled_at: ${post.scheduled_at} | now: ${now}`);

      const accessToken = process.env.META_ACCESS_TOKEN;
      const igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;

      if (!accessToken || !igAccountId) {
        db.prepare(`
          UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
          ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(`demo_${Date.now()}`, post.id);
        console.log(`  ✅ Publicado (modo demo — sin credenciales Meta)`);
        console.log(`⏰ ═══════════════════════════════════════════════════\n`);
        continue;
      }

      const publicMediaUrl = resolvePublicMediaUrl(post);
      console.log(`  📎 media_url original: ${post.media_url}`);
      console.log(`  📎 media_url pública:  ${publicMediaUrl}`);

      try {
        const META_API_BASE = 'https://graph.facebook.com/v22.0';
        const caption = `${post.caption || ''}\n\n${post.hashtags || ''}`.trim();

        const containerParams = new URLSearchParams({
          caption,
          access_token: accessToken
        });

        if (publicMediaUrl) {
          if (post.format === 'reel') {
            containerParams.set('media_type', 'REELS');
            containerParams.set('video_url', publicMediaUrl);
          } else {
            containerParams.set('image_url', publicMediaUrl);
          }
        }

        console.log(`  📤 [Paso 1/2] Creando contenedor en Meta API...`);
        const containerRes = await fetch(`${META_API_BASE}/${igAccountId}/media`, {
          method: 'POST',
          body: containerParams
        });
        const containerData = await containerRes.json();
        console.log(`  ← Container response:`, JSON.stringify(containerData));

        if (containerData.error) throw new Error(containerData.error.message);

        console.log(`  📤 [Paso 2/2] Publicando contenedor ${containerData.id}...`);
        const publishRes = await fetch(`${META_API_BASE}/${igAccountId}/media_publish`, {
          method: 'POST',
          body: new URLSearchParams({
            creation_id: containerData.id,
            access_token: accessToken
          })
        });
        const publishData = await publishRes.json();
        console.log(`  ← Publish response:`, JSON.stringify(publishData));

        if (publishData.error) throw new Error(publishData.error.message);

        db.prepare(`
          UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
          ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(publishData.id, post.id);

        console.log(`  ✅ PUBLICADO EN INSTAGRAM — ig_media_id: ${publishData.id}`);

      } catch (error) {
        console.error(`  ❌ Error publicando post ${post.id} en Meta API:`, error.message);
        db.prepare(`
          UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
          ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(`local_${Date.now()}`, post.id);
        console.log(`  ⚠️ Post ${post.id} marcado como publicado localmente.`);
      }
      
      console.log(`⏰ ═══════════════════════════════════════════════════\n`);
    }
  });

  console.log('⏰ Scheduler de publicaciones iniciado (verifica cada minuto)');
}
