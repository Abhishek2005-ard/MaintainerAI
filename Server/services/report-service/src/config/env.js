import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
  NODE_ENV:   process.env.NODE_ENV               || 'development',
  PORT:       parseInt(process.env.REPORT_SERVICE_PORT || '8004', 10),
  MONGO_URI:  process.env.REPORT_MONGO_URI        || 'mongodb://127.0.0.1:27017/maintainer_ai_reports',
  JWT_SECRET: process.env.JWT_SECRET              || 'super_secret_jwt_key_2026',
};

