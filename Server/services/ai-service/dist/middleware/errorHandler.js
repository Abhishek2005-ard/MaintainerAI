import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
export const errorHandler = (err, req, res, next) => {
    let error = err;
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || error.status || 500;
        const message = error.message || 'Internal Server Error';
        error = new ApiError(statusCode, message, false, err.stack);
    }
    const apiError = error;
    logger.error(`Error: ${apiError.message}`);
    if (apiError.stack) {
        logger.debug(apiError.stack);
    }
    const response = {
        error: apiError.message,
        statusCode: apiError.statusCode,
        ...(env.NODE_ENV === 'development' && { stack: apiError.stack }),
    };
    res.status(apiError.statusCode).json(response);
};
