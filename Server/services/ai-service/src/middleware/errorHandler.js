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

  logger.error(`[ErrorHandler] ${error.statusCode} — ${error.message}`);

  res.status(error.statusCode).json({
    error: error.message,
    statusCode: error.statusCode,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};
