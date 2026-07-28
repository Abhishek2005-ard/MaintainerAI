import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

export const connectDB = async () => {
  const localFallbackUri = 'mongodb://127.0.0.1:27017/maintainer_ai_github';
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 4000 });
    logger.info('🔌 Connected to MongoDB successfully (GitHub Service).');
  } catch (error) {
    logger.error(`Primary MongoDB connection failed: ${error.message}`);
    
    if (env.MONGO_URI !== localFallbackUri) {
      logger.info('Attempting fallback to local MongoDB...');
      try {
        await mongoose.connect(localFallbackUri, { serverSelectionTimeoutMS: 3000 });
        logger.info('🔌 Connected to Local MongoDB successfully (GitHub Service).');
        return;
      } catch (fallbackErr) {
        logger.error(`Local MongoDB fallback failed: ${fallbackErr.message}`);
      }
    }

    logger.warn('GitHub Service will proceed with mock database access.');
  }
};
