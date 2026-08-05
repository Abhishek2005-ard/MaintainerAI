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
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis, isRedisConnected } from '../services/shared/redisClient.js';

import jwt from 'jsonwebtoken';

const app = express();
const PORT = parseInt(process.env.PORT || '8000', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

const AI_SERVICE_URL     = process.env.AI_SERVICE_URL     || 'http://127.0.0.1:8002';
const GITHUB_SERVICE_URL = process.env.GITHUB_SERVICE_URL || 'http://127.0.0.1:8003';
const REPORT_SERVICE_URL = process.env.REPORT_SERVICE_URL || 'http://127.0.0.1:8004';

const corsOrigin = process.env.CORS_ORIGIN || 'https://maintainerai.vercel.app';
app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(morgan('dev'));

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

function logGatewayError(req, err) {
  console.error(`[${new Date().toISOString()}] GATEWAY PROXY ERROR ${req.method || 'UNKNOWN'} ${req.originalUrl || 'UNKNOWN'} - ${err.message}`);
  if (err.stack) {
    console.error(err.stack);
  }
}

// Optional JWT verification middleware for protected API endpoints
const verifyJwtToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or malformed Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token.' });
  }
};

app.use('/api/triage', proxy(AI_SERVICE_URL, {
  timeout: 120000,
  proxyErrorHandler: (err, res, next) => {
    logGatewayError(res.req || {}, err);
    res.status(503).json({ error: `AI Service unavailable: ${err.message}` });
  }
}));

app.use('/api/github', proxy(GITHUB_SERVICE_URL, {
  timeout: 120000,
  proxyErrorHandler: (err, res, next) => {
    logGatewayError(res.req || {}, err);
    res.status(503).json({ error: `GitHub Service unavailable: ${err.message}` });
  }
}));

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

app.use((err, req, res, next) => {
  logGatewayError(req, err);
  res.status(504).json({ error: err.message || 'Gateway Proxy Error' });
});

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

process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] UNCAUGHT EXCEPTION in Gateway:`, err.message);
  logGatewayError({ method: 'PROCESS', originalUrl: 'uncaughtException' }, err);
});

process.on('unhandledRejection', (reason) => {
  const err = reason instanceof Error ? reason : new Error(String(reason));
  console.error(`[${new Date().toISOString()}] UNHANDLED REJECTION in Gateway:`, err.message);
  logGatewayError({ method: 'PROCESS', originalUrl: 'unhandledRejection' }, err);
});

app.listen(PORT, () => {
  console.log(`\n MaintainerAI API Gateway — http://localhost:${PORT}\n`);
  console.log(`  /api/triage  →  AI Service     (${AI_SERVICE_URL})`);
  console.log(`  /api/github  →  GitHub Service  (${GITHUB_SERVICE_URL})`);
  console.log(`  /api/reports →  Report Service  (${REPORT_SERVICE_URL})\n`);
});

