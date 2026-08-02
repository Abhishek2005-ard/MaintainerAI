import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

// Route Imports
import authRoutes from './routes/authRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import repoRoutes from './routes/repoRoutes.js';
import issueRoutes from './routes/issueRoutes.js';

const app = express();

// Global Middleware
app.use(cors());

// Store the raw request body buffer so webhook signature verification can
// compute the HMAC against the exact bytes GitHub sent (not re-serialized JSON).
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// Routes
app.use('/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/repos', repoRoutes);
app.use('/issues', issueRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    service: 'MaintainerAI GitHub Microservice',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use(errorHandler);

// Prevent unhandled errors from crashing the GitHub Service process
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
