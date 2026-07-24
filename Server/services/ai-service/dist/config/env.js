import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';
dotenv.config();
export const env = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '8002', 10),
    GITHUB_SERVICE_URL: process.env.GITHUB_SERVICE_URL || 'http://localhost:8003',
    REPORT_SERVICE_URL: process.env.REPORT_SERVICE_URL || 'http://localhost:8004',
    JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
};
// Warn dev if no LLM key is set — agent will fall back to rule-based analysis
if (!env.GEMINI_API_KEY && !env.OPENAI_API_KEY) {
    logger.warn('[Config] No LLM API key found. Set GEMINI_API_KEY or OPENAI_API_KEY in .env');
}
// Warn if default JWT secret is used in production
if (env.JWT_SECRET === 'super_secret_jwt_key_2026' && env.NODE_ENV === 'production') {
    logger.warn('[Config] Default JWT_SECRET detected in production. Change it immediately.');
}
