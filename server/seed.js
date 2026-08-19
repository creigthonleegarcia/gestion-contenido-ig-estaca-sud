import bcrypt from 'bcryptjs';
import db from './db.js';

export function seedDatabase() {
  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count > 0) {
    console.log('ℹ️  Base de datos ya tiene datos, omitiendo seed');
    return;
  }

  // Seed users
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?)
  `).run('Creador de Contenido', 'creador@estaca.cl', hashedPassword, 'creator', '#4a90d9');

  db.prepare(`
    INSERT INTO users (name, email, password_hash, role, avatar_color) VALUES (?, ?, ?, ?, ?)
  `).run('Presidente de Estaca', 'aprobador@estaca.cl', hashedPassword, 'approver', '#34c759');

  // Seed pillars (4 pilares del PDF estratégico)
  const pillars = [
    {
      name: 'Inspiración Doctrinal',
      slug: 'inspiracion',
      color: '#4a90d9',
      icon: '📖',
      description: 'Pasajes de las Escrituras, citas de Autoridades Generales, reflexiones de Ven Sígueme. Diseño limpio, legible y solemne.',
      recommended_day: 'monday',
      recommended_format: 'static',
      sort_order: 1
    },
    {
      name: 'Información y Agenda',
      slug: 'informacion',
      color: '#34c759',
      icon: '📋',
      description: 'Calendarios mensuales, conferencias de estaca, devocionales JAS, capacitaciones, horarios de viajes al templo. Carruseles e Historias Destacadas.',
      recommended_day: 'friday',
      recommended_format: 'carousel',
      sort_order: 2
    },
    {
      name: 'SirveAhora / Servicio',
      slug: 'servicio',
      color: '#f5a623',
      icon: '🤝',
      description: 'Proyectos de voluntariado con Municipalidades, ONG locales. Jornadas de limpieza, donaciones, proyectos ambientales. Sin tono proselitista.',
      recommended_day: 'wednesday',
      recommended_format: 'reel',
      sort_order: 3
    },
    {
      name: 'Historias y Pioneros',
      slug: 'historias',
      color: '#9b59b6',
      icon: '🌟',
      description: 'Relatos de miembros pioneros de la Región de Coquimbo, experiencias de jóvenes misioneros, cronistas juveniles. Video vertical 9:16.',
      recommended_day: 'saturday',
      recommended_format: 'reel',
      sort_order: 4
    }
  ];

  const insertPillar = db.prepare(`
    INSERT INTO pillars (name, slug, color, icon, description, recommended_day, recommended_format, sort_order)
    VALUES (@name, @slug, @color, @icon, @description, @recommended_day, @recommended_format, @sort_order)
  `);

  for (const pillar of pillars) {
    insertPillar.run(pillar);
  }

  // Seed sample posts
  const samplePosts = [
    {
      title: 'Paz en el Salvador',
      caption: '"Venid a mí todos los que estáis trabajados y cargados, y yo os haré descansar." — Mateo 11:28\n\nEn medio de los desafíos de la vida, el Salvador nos invita a encontrar paz en Él.',
      hashtags: '#VenSígueme #EstacaLaSerena #PazEnCristo #SUD',
      pillar_id: 1,
      format: 'static',
      status: 'published',
      scheduled_at: '2026-08-11 09:00:00',
      published_at: '2026-08-11 09:00:00',
      created_by: 1
    },
    {
      title: 'Conferencia de Estaca - Agosto',
      caption: '📅 Conferencia de Estaca\n📍 Centro de Reuniones La Serena\n🕐 Sábado 23 de agosto, 16:00 hrs\n👔 Vestimenta dominical\n\n¡Los esperamos a todos!',
      hashtags: '#EstacaLaSerena #ConferenciaDeEstaca #SUD',
      pillar_id: 2,
      format: 'carousel',
      status: 'in_review',
      scheduled_at: '2026-08-20 10:00:00',
      created_by: 1
    },
    {
      title: 'Jornada de Limpieza Playa La Herradura',
      caption: '🤝 Este sábado nos unimos a SirveAhora para limpiar la Playa La Herradura junto a la Municipalidad de Coquimbo.\n\n📍 Punto de encuentro: Estacionamiento Playa La Herradura\n🕘 09:00 hrs\n🧤 Traer guantes y bolsas',
      hashtags: '#SirveAhora #JustServe #ServicioComunitario #LaSerena',
      pillar_id: 3,
      format: 'reel',
      status: 'draft',
      scheduled_at: '2026-08-27 08:00:00',
      created_by: 1
    },
    {
      title: 'Pioneros del Valle de Elqui',
      caption: '🌟 Conoce la historia de la familia Cortés, primeros miembros de la Iglesia en Vicuña. Su fe y dedicación abrieron el camino para la obra en el Valle de Elqui.\n\n#SigamosEscribiendoLaHistoria',
      hashtags: '#PionerosChile #Centenario #EstacaLaSerena #ValleDeElqui',
      pillar_id: 4,
      format: 'reel',
      status: 'approved',
      scheduled_at: '2026-08-30 17:00:00',
      created_by: 1
    }
  ];

  const insertPost = db.prepare(`
    INSERT INTO posts (title, caption, hashtags, pillar_id, format, status, scheduled_at, published_at, created_by)
    VALUES (@title, @caption, @hashtags, @pillar_id, @format, @status, @scheduled_at, @published_at, @created_by)
  `);

  for (const post of samplePosts) {
    insertPost.run({ ...post, published_at: post.published_at || null });
  }

  // Seed demo account insights (last 30 days)
  const insertInsight = db.prepare(`
    INSERT INTO account_insights (date, followers, follows, reach, impressions, profile_views, website_clicks)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  let followers = 342;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const dailyGain = Math.floor(Math.random() * 8) - 1;
    followers += dailyGain;
    const reach = Math.floor(Math.random() * 300) + 150;
    const impressions = reach + Math.floor(Math.random() * 200);
    const profileViews = Math.floor(Math.random() * 30) + 5;
    const websiteClicks = Math.floor(Math.random() * 10);
    insertInsight.run(dateStr, followers, 180, reach, impressions, profileViews, websiteClicks);
  }

  // Seed demo post insights
  const insertPostInsight = db.prepare(`
    INSERT INTO insights_cache (post_id, reach, impressions, engagement, likes, comments_count, shares, saves)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertPostInsight.run(1, 287, 412, 45, 32, 5, 4, 4);

  console.log('✅ Datos iniciales insertados');
}
