import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import healthRoutes from './routes/healthRoutes.js';
import triageRoutes from './routes/triageRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRoutes);
app.use('/', triageRoutes);

// Must be registered after all routes
app.use(errorHandler);

// Prevent unhandled errors from crashing the AI Service process
process.on('uncaughtException', (err) => {
  logger.error(`[Process] Uncaught Exception in AI Service: ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  logger.error(`[Process] Unhandled Rejection in AI Service: ${msg}`);
});

app.listen(env.PORT, () => {
  logger.info(`MaintainerAI Agent Service running on port ${env.PORT} [${env.NODE_ENV}]`);
});
