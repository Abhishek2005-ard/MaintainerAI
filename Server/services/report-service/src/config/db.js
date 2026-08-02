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
  // Disable Mongoose operation buffering so queries fail fast with 503 if DB is unreachable
  mongoose.set('bufferCommands', false);

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
    _connected = false;
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`MongoDB connection failed: ${message}`);
    logger.error('Check that REPORT_MONGO_URI in .env is correct and your Atlas IP whitelist includes your IP.');
    // Schedule background retry after 5 seconds so temporary startup issues resolve automatically
    setTimeout(connectDB, 5000);
  }
}

