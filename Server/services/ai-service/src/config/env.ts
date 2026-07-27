import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV:           process.env.NODE_ENV            || 'development',
  PORT:               parseInt(process.env.AI_SERVICE_PORT || '8002', 10),
  GITHUB_SERVICE_URL: process.env.GITHUB_SERVICE_URL  || 'http://localhost:8003',
  REPORT_SERVICE_URL: process.env.REPORT_SERVICE_URL  || 'http://localhost:8004',
  JWT_SECRET:         process.env.JWT_SECRET           || 'super_secret_jwt_key_2026',
  GEMINI_API_KEY:     process.env.GEMINI_API_KEY       || '',
  OPENAI_API_KEY:     process.env.OPENAI_API_KEY       || '',
};
