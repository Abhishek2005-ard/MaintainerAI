import { verifyToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    logger.warn(`Failed token verification: ${err.message}`);
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};
