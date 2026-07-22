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
// Initialize Mongoose DB Connection
connectDB();
// Global Middleware
app.use(cors());
// Webhooks require raw parsing or JSON depending on verification structure
app.use(express.json());
// Routes
app.use('/auth', authRoutes);
app.use('/webhook', webhookRoutes);
app.use('/repos', repoRoutes);
app.use('/issues', issueRoutes);
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        service: 'MaintainerAI GitHub Microservice',
        status: 'active',
        timestamp: new Date().toISOString()
    });
});
// Global Error Handler
app.use(errorHandler);
// Listen
app.listen(env.PORT, () => {
    logger.info(`🚀 GitHub Service running on port ${env.PORT}`);
});
