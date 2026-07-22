import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '8003', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/maintainer_ai_github',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_jwt_key_2026',
  
  GITHUB_APP_ID: process.env.GITHUB_APP_ID || '',
  GITHUB_PRIVATE_KEY: (process.env.GITHUB_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
  GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
  GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET || '',
};
