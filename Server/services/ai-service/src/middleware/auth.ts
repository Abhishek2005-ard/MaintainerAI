import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('Unauthorized M2M request: Token missing.');
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;
    // Check if the role is admin or system
    if (decoded.role !== 'admin' && decoded.role !== 'system') {
      logger.warn('Unauthorized M2M request: Invalid role.');
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  } catch (err: any) {
    logger.warn(`Failed M2M token verification: ${err.message}`);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
