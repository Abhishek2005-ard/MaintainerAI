import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
export const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('[Auth] Rejected request: missing token');
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, env.JWT_SECRET);
        if (decoded.role !== 'admin' && decoded.role !== 'system') {
            logger.warn(`[Auth] Rejected request: insufficient role "${decoded.role}"`);
            return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
        }
        next();
    }
    catch (err) {
        logger.warn(`[Auth] Token verification failed: ${err.message}`);
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
};
