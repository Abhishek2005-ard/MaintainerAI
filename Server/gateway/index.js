import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import proxy from 'express-http-proxy';

const app  = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// ── Upstream service URLs (override via .env in production) ──────────────────
const AI_SERVICE_URL     = process.env.AI_SERVICE_URL     || 'http://localhost:8002';
const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://localhost:8003';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://localhost:8004';

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
