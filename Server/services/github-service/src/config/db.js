import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info('🔌 Connected to MongoDB Atlas successfully (GitHub Service).');
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.error('Check that GITHUB_MONGO_URI in .env is correct and your Atlas IP whitelist includes your IP.');
    // Don't crash — service will proceed but DB operations will fail gracefully
  }
};
