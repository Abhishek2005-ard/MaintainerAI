import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const ALLOWED_ROLES = new Set(['admin', 'system']);

// Verifies the Bearer JWT and ensures the caller has an allowed role.
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Auth rejected: missing or malformed token');
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const token   = authHeader.slice(7); // strip "Bearer "
    const decoded = jwt.verify(token, env.JWT_SECRET);

    if (!ALLOWED_ROLES.has(decoded.role)) {
      logger.warn(`Auth rejected: insufficient role "${decoded.role}"`);
      res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn(`Auth rejected: token verification failed — ${message}`);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
