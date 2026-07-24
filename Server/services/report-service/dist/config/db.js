import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import { env } from './env.js';
export const connectDB = async () => {
    try {
        mongoose.set('strictQuery', true);
        await mongoose.connect(env.MONGO_URI);
        logger.info('🔌 Connected to MongoDB successfully (Report Service).');
    }
    catch (error) {
        logger.error(`MongoDB connection failed (Report Service): ${error.message}`);
    }
};
