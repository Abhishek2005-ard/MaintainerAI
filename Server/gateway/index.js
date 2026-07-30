import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import proxy from 'express-http-proxy';

const app  = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// ── Upstream service URLs (override via .env in production) ──────────────────
const AI_SERVICE_URL     = process.env.AI_SERVICE_URL     || 'http://127.0.0.1:8002';
const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://127.0.0.1:8003';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://127.0.0.1:8004';

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(morgan('dev'));   // request logging

// ── Proxy Routes ─────────────────────────────────────────────────────────────

// AI Service  —  issue triage, LangGraph workflow
app.use('/api/triage', proxy(AI_SERVICE_URL));

// GitHub Service  —  repo management, issue & label operations
app.use('/api/github', proxy(GITHUB_SERVICE_URL));

// Report Service  —  triage reports, dashboard stats, weekly digest
app.use('/api/reports', proxy(REPORT_SERVICE_URL));

// Global Error Handler for Gateway
app.use((err, req, res, next) => {
  const logMsg = `[${new Date().toISOString()}] GATEWAY ERROR ${req.method} ${req.originalUrl} - ${err.message}\nStack: ${err.stack}\n\n`;
  try {
    fs.appendFileSync(path.resolve(process.cwd(), '../error.log'), logMsg);
  } catch (fsErr) {
    console.error('Failed to write gateway error to log file:', fsErr.message);
  }
  res.status(504).json({ error: err.message || 'Gateway Proxy Error' });
});

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    service:  'MaintainerAI API Gateway',
    status:   'ok',
    upstream: {
      aiService:     AI_SERVICE_URL,
      githubService: GITHUB_SERVICE_URL,
      reportService: REPORT_SERVICE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n MaintainerAI API Gateway — http://localhost:${PORT}\n`);
  console.log(`  /api/triage  →  AI Service     (${AI_SERVICE_URL})`);
  console.log(`  /api/github  →  GitHub Service  (${GITHUB_SERVICE_URL})`);
  console.log(`  /api/reports →  Report Service  (${REPORT_SERVICE_URL})\n`);
});
