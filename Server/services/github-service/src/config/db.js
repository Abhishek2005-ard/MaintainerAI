import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';

let _connected = false;

export function isConnected() {
  return _connected && mongoose.connection.readyState === 1;
}

export const connectDB = async () => {
  mongoose.set('strictQuery', true);
  mongoose.set('bufferCommands', false);

  try {
    await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    _connected = true;
    logger.info('🔌 Connected to MongoDB Atlas successfully (GitHub Service).');

    mongoose.connection.on('disconnected', () => {
      _connected = false;
      logger.warn('MongoDB disconnected (GitHub Service).');
    });
    mongoose.connection.on('reconnected', () => {
      _connected = true;
      logger.info('MongoDB reconnected (GitHub Service).');
    });
  } catch (error) {
    _connected = false;
    logger.error(`MongoDB connection failed: ${error.message}`);
    logger.error('Check that GITHUB_MONGO_URI in .env is correct and your Atlas IP whitelist includes your IP.');
    setTimeout(connectDB, 5000);
  }
};

