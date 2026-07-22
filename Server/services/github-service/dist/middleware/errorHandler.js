import { logger } from '../utils/logger.js';
export const errorHandler = (err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    if (err.stack) {
        logger.debug(err.stack);
    }
    const statusCode = err.status || err.statusCode || 500;
    res.status(statusCode).json({
        error: err.message || 'Internal Server Error',
        statusCode
    });
};
