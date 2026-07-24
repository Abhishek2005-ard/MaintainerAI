import { logger } from '../utils/logger.js';
export const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger.error(`[ErrorHandler] ${statusCode} — ${message}`);
    res.status(statusCode).json({ error: message, statusCode });
};
