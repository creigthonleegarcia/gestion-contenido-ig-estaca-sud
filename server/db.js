import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'instagram-estaca.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('creator', 'approver')) NOT NULL DEFAULT 'creator',
      avatar_color TEXT DEFAULT '#4a90d9',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS pillars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      color TEXT NOT NULL,
      icon TEXT DEFAULT '📌',
      description TEXT,
      recommended_day TEXT,
      recommended_format TEXT,
      sort_order INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      caption TEXT,
      hashtags TEXT,
      pillar_id INTEGER REFERENCES pillars(id),
      format TEXT CHECK(format IN ('static', 'carousel', 'reel', 'story')) DEFAULT 'static',
      media_paths TEXT,
      media_url TEXT,
      status TEXT CHECK(status IN ('draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected')) DEFAULT 'draft',
      scheduled_at DATETIME,
      published_at DATETIME,
      ig_media_id TEXT,
      ig_permalink TEXT,
      norms_checklist TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS approvals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      approver_id INTEGER REFERENCES users(id),
      action TEXT CHECK(action IN ('approved', 'rejected')),
      comments TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS insights_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
      ig_media_id TEXT,
      reach INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      engagement INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      saves INTEGER DEFAULT 0,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS account_insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE UNIQUE,
      followers INTEGER DEFAULT 0,
      follows INTEGER DEFAULT 0,
      reach INTEGER DEFAULT 0,
      impressions INTEGER DEFAULT 0,
      profile_views INTEGER DEFAULT 0,
      website_clicks INTEGER DEFAULT 0,
      fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_pillar ON posts(pillar_id);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_approvals_post ON approvals(post_id);
  `);

  console.log('✅ Base de datos inicializada');
}

export default db;
