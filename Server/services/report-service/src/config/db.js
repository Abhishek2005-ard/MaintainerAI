import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Connect to MongoDB with fallback to local instance, ensuring service never crashes on startup
export async function connectDB() {
  const localFallbackUri = 'mongodb://127.0.0.1:27017/maintainer_ai_reports';

  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    logger.info('🔌 Connected to MongoDB successfully (Report Service)');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`Primary MongoDB connection failed: ${message}`);
    
    if (env.MONGO_URI !== localFallbackUri) {
      logger.info('Attempting fallback to local MongoDB...');
      try {
        await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 3000 });
        logger.info('🔌 Connected to Local MongoDB successfully (Report Service)');
        return;
      } catch (fallbackErr) {
        logger.error(`Local MongoDB fallback failed: ${fallbackErr.message}`);
      }
    }
    
    logger.warn('Report Service will proceed without database persistence.');
  }
}
