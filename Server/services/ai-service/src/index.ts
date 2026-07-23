import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import triageRoutes from './routes/triageRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', triageRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({
    service: 'MaintainerAI Agent Service',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Error Handler
app.use(errorHandler);

// Listen
app.listen(env.PORT, () => {
  logger.info(`🚀 Agent Service running on port ${env.PORT}`);
});
