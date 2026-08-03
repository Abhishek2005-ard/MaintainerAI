import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
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
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis, isRedisConnected } from '../services/shared/redisClient.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);

// Upstream microservice URLs
const AI_SERVICE_URL     = process.env.AI_SERVICE_URL     || 'http://127.0.0.1:8002';
const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://127.0.0.1:8003';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://127.0.0.1:8004';

// Express middleware
app.use(cors());
app.use(morgan('dev'));

// Rate limiting middleware
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  handler: (_req, res) => {
    res.status(429).json({
      error: 'Too Many Requests',
      message: 'API rate limit exceeded. Please try again later.',
    });
  },
});

app.use('/api/', apiLimiter);

// Log gateway errors to file
function logGatewayError(req, err) {
  const logMsg = `[${new Date().toISOString()}] GATEWAY PROXY ERROR ${req.method} ${req.originalUrl} - ${err.message}\nStack: ${err.stack}\n\n`;
  try {
    fs.appendFileSync(path.resolve(process.cwd(), '../error.log'), logMsg);
  } catch (fsErr) {
    console.error('Failed to write gateway error to log file:', fsErr.message);
  }
}

// Proxy requests to AI Service
app.use('/api/triage', proxy(AI_SERVICE_URL, {
  timeout: 120000,
  proxyErrorHandler: (err, res, next) => {
    logGatewayError(res.req || {}, err);
    res.status(503).json({ error: `AI Service unavailable: ${err.message}` });
  }
}));

// Proxy requests to GitHub Service
app.use('/api/github', proxy(GITHUB_SERVICE_URL, {
  timeout: 120000,
  proxyErrorHandler: (err, res, next) => {
    logGatewayError(res.req || {}, err);
    res.status(503).json({ error: `GitHub Service unavailable: ${err.message}` });
  }
}));

// Proxy requests to Report Service
app.use('/api/reports', proxy(REPORT_SERVICE_URL, {
  timeout: 120000,
  proxyReqPathResolver: (req) => {
    const rawPath = req.url;
    if (rawPath.startsWith('/reports')) {
      return rawPath;
    }
    return '/reports' + (rawPath === '/' ? '' : rawPath);
  },
  proxyErrorHandler: (err, res, next) => {
    logGatewayError(res.req || {}, err);
    res.status(503).json({ error: `Report Service unavailable: ${err.message}` });
  }
}));

// Global error handler
app.use((err, req, res, next) => {
  const logMsg = `[${new Date().toISOString()}] GATEWAY ERROR ${req.method} ${req.originalUrl} - ${err.message}\nStack: ${err.stack}\n\n`;
  try {
    fs.appendFileSync(path.resolve(process.cwd(), '../error.log'), logMsg);
  } catch (fsErr) {
    console.error('Failed to write gateway error to log file:', fsErr.message);
  }
  res.status(504).json({ error: err.message || 'Gateway Proxy Error' });
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    service:  'MaintainerAI API Gateway',
    status:   'ok',
    redis:    isRedisConnected() ? 'connected' : 'disconnected/degraded',
    upstream: {
      aiService:     AI_SERVICE_URL,
      githubService: GITHUB_SERVICE_URL,
      reportService: REPORT_SERVICE_URL,
    },
    timestamp: new Date().toISOString(),
  });
});

// Process safety error handlers
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] UNCAUGHT EXCEPTION in Gateway:`, err.message);
  logGatewayError({ method: 'PROCESS', originalUrl: 'uncaughtException' }, err);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error(`[${new Date().toISOString()}] UNHANDLED REJECTION in Gateway:`, err.message);
  logGatewayError({ method: 'PROCESS', originalUrl: 'unhandledRejection' }, err);
});

// Start gateway server
app.listen(PORT, () => {
  console.log(`\n MaintainerAI API Gateway — http://localhost:${PORT}\n`);
  console.log(`  /api/triage  →  AI Service     (${AI_SERVICE_URL})`);
  console.log(`  /api/github  →  GitHub Service  (${GITHUB_SERVICE_URL})`);
  console.log(`  /api/reports →  Report Service  (${REPORT_SERVICE_URL})\n`);
});
