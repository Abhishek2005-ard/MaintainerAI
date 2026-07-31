import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Connect to MongoDB Atlas — configured via REPORT_MONGO_URI in .env
export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    logger.info('🔌 Connected to MongoDB Atlas successfully (Report Service).');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`MongoDB connection failed: ${message}`);
    logger.error('Check that REPORT_MONGO_URI in .env is correct and your Atlas IP whitelist includes your IP.');
    // Don't crash — service will proceed but DB operations will fail gracefully
  }
}

