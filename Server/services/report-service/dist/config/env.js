import dotenv from 'dotenv';
dotenv.config();
export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '8004', 10),
    MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/maintainer_ai_reports',
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
};
