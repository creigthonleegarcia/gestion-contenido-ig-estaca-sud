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

  console.log('✅ Pilares y usuarios inicializados');
}
