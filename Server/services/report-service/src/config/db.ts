import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Connect to MongoDB. Exits process on failure so misconfiguration is caught early.
export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected (Report Service)');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`MongoDB connection failed: ${message}`);
    process.exit(1);
  }
}
