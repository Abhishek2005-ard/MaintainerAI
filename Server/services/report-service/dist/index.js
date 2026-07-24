import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';
import reportRoutes from './routes/reportRoutes.js';
const app = express();
connectDB();
app.use(cors());
app.use(express.json());
app.use(reportRoutes);
app.get('/health', (_req, res) => {
    res.status(200).json({
        service: 'MaintainerAI Report Service',
        status: 'active',
        timestamp: new Date().toISOString(),
    });
});
app.use(errorHandler);
app.listen(env.PORT, () => {
    logger.info(`🚀 MaintainerAI Report Service running on port ${env.PORT} [${env.NODE_ENV}]`);
});
