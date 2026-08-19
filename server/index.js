import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './db.js';
import { seedDatabase } from './seed.js';
import { startScheduler } from './services/scheduler.js';

import authRoutes from './routes/auth.js';
import pillarsRoutes from './routes/pillars.js';
import postsRoutes from './routes/posts.js';
import approvalRoutes from './routes/approval.js';
import calendarRoutes from './routes/calendar.js';
import insightsRoutes from './routes/insights.js';
import publishRoutes from './routes/publish.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pillars', pillarsRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/approval', approvalRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/publish', publishRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Initialize
initDatabase();
seedDatabase();
startScheduler();

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor Instagram Estaca La Serena`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api\n`);
});
