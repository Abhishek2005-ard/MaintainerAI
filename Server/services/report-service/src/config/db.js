import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

// Track whether Mongoose successfully connected
let _connected = false;

/** Returns true only after a successful mongoose.connect() call. */
export function isConnected() {
  return _connected && mongoose.connection.readyState === 1;
}

// Connect to MongoDB Atlas — configured via REPORT_MONGO_URI in .env
export async function connectDB() {
  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    _connected = true;
    logger.info('🔌 Connected to MongoDB Atlas successfully (Report Service).');

    // Reset flag if we lose the connection later
    mongoose.connection.on('disconnected', () => {
      _connected = false;
      logger.warn('MongoDB disconnected.');
    });
    mongoose.connection.on('reconnected', () => {
      _connected = true;
      logger.info('MongoDB reconnected.');
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`MongoDB connection failed: ${message}`);
    logger.error('Check that REPORT_MONGO_URI in .env is correct and your Atlas IP whitelist includes your IP.');
    // Don't crash — service will proceed but DB operations will fail with a clear 503
  }
}

