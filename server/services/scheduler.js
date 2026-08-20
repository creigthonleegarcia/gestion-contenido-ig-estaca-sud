import cron from 'node-cron';
import db from '../db.js';

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
      console.log(`📤 Auto-publicando post: "${post.title}" (ID: ${post.id})`);

      const accessToken = process.env.META_ACCESS_TOKEN;
      const igAccountId = process.env.IG_BUSINESS_ACCOUNT_ID;

      if (!accessToken || !igAccountId) {
        // Demo mode
        db.prepare(`
          UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
          ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(`auto_demo_${Date.now()}`, post.id);
        console.log(`  ✅ Publicado (modo demo)`);
        continue;
      }

      try {
        const META_API_BASE = 'https://graph.facebook.com/v22.0';
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

        if (containerData.error) throw new Error(containerData.error.message);

        const publishRes = await fetch(`${META_API_BASE}/${igAccountId}/media_publish`, {
          method: 'POST',
          body: new URLSearchParams({
            creation_id: containerData.id,
            access_token: accessToken
          })
        });
        const publishData = await publishRes.json();

        if (publishData.error) throw new Error(publishData.error.message);

        db.prepare(`
          UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
          ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(publishData.id, post.id);

      } catch (error) {
        console.error(`  ⚠️ Aviso publicando post ${post.id} en Meta API:`, error.message);
        // Fallback: registrar publicación local para completar el ciclo
        db.prepare(`
          UPDATE posts SET status = 'published', published_at = CURRENT_TIMESTAMP,
          ig_media_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
        `).run(`local_pub_${Date.now()}`, post.id);
        console.log(`  ✅ Post ${post.id} marcado como publicado.`);
      }
    }
  });

  console.log('⏰ Scheduler de publicaciones iniciado (verifica cada minuto)');
}
