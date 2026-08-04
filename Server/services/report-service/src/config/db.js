import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let _connected = false;

export function isConnected() {
  return _connected && mongoose.connection.readyState === 1;
}

export async function connectDB() {
  mongoose.set('bufferCommands', false);

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    _connected = true;
    logger.info('🔌 Connected to MongoDB Atlas successfully (Report Service).');

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
    setTimeout(connectDB, 5000);
  }
}


