import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

export const connectDB = async (): Promise<void> => {
  try {
    // If running in development without a local Mongo server, we catch the connection error and proceed with warning
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.MONGO_URI);
    logger.info('🔌 Connected to MongoDB successfully.');
  } catch (error: any) {
    logger.error(`❌ MongoDB connection failed: ${error.message}`);
    logger.warn('⚠️ Server will run with database access disabled or mock fallback.');
  }
};
