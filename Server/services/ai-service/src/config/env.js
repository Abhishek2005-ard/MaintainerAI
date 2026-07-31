import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Look for .env in current cwd, or parent directories (e.g. Server/.env)
const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}

export const env = {
  NODE_ENV:           process.env.NODE_ENV            || 'development',
  PORT:               parseInt(process.env.AI_SERVICE_PORT || '8002', 10),
  GITHUB_SERVICE_URL: process.env.GITHUB_SERVICE_URL  || 'http://127.0.0.1:8003',
  REPORT_SERVICE_URL: process.env.REPORT_SERVICE_URL  || 'http://127.0.0.1:8004',
  JWT_SECRET:         process.env.JWT_SECRET           || 'super_secret_jwt_key_2026',
  GEMINI_API_KEY:     process.env.GEMINI_API_KEY       || '',
  OPENAI_API_KEY:     process.env.OPENAI_API_KEY       || '',
  // MongoDB URI for LangGraph persistent checkpointer (stores triage workflow state)
  AI_MONGO_URI:       process.env.AI_MONGO_URI         || 'mongodb://127.0.0.1:27017/maintainer_ai_langgraph',
};
