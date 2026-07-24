import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

// Signs a short-lived system token for M2M calls to the github-service
export const signSystemToken = (): string => {
  return jwt.sign(
    { id: 'system-agent', role: 'admin' },
    env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};
