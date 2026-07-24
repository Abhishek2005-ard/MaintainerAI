import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
// Global error handler — must be registered last in the middleware chain
export const errorHandler = (err, req, res, _next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        error = new ApiError(statusCode, error.message || 'Internal Server Error', false, err.stack);
    }
    const apiError = error;
    logger.error(`[ErrorHandler] ${apiError.statusCode} — ${apiError.message}`);
    res.status(apiError.statusCode).json({
        error: apiError.message,
        statusCode: apiError.statusCode,
        ...(env.NODE_ENV === 'development' && { stack: apiError.stack }),
    });
};
