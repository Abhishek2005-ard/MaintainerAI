import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import reportRoutes from './routes/reportRoutes.js';

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use(reportRoutes);

app.get('/health', (_req, res) => {
  res.json({
    service:   'MaintainerAI Report Service',
    status:    'ok',
    timestamp: new Date().toISOString(),
  });
});

// ── Error handling (must come last) ──────────────────────────────────────────
app.use(errorHandler);

// Prevent unhandled errors from crashing the Report Service process
process.on('uncaughtException', (err) => {
  logger.error(`[Process] Uncaught Exception in Report Service: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.error(`[Process] Unhandled Rejection in Report Service: ${msg}`);
});

async function start() {
  await connectDB();
  app.listen(env.PORT, () =>
    logger.info(`Report Service running on port ${env.PORT} [${env.NODE_ENV}]`),
  );
}

start();
