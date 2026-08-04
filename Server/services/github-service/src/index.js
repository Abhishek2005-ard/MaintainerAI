import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import authRoutes from './routes/authRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import issueRoutes from './routes/issueRoutes.js';

const app = express();

app.use(cors());

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use('/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/repos', repoRoutes);
app.use('/issues', issueRoutes);

app.get('/health', (_req, res) => {
  res.json({
    service: 'MaintainerAI GitHub Microservice',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

process.on('uncaughtException', (err) => {
  logger.error(`[Process] Uncaught Exception in GitHub Service: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.error(`[Process] Unhandled Rejection in GitHub Service: ${msg}`);
});

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    logger.info(`🚀 GitHub Service running on port ${env.PORT}`);
  });
}

start();

