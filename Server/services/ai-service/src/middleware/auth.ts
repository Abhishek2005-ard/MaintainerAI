import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// Verify the M2M JWT — only admin/system roles are allowed through
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('[Auth] Request rejected: missing or malformed Authorization header.');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: string };

    if (decoded.role !== 'admin' && decoded.role !== 'system') {
      logger.warn(`[Auth] Request rejected: insufficient role "${decoded.role}".`);
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }

    next();
  } catch (err: any) {
    logger.warn(`[Auth] Token verification failed: ${err.message}`);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
