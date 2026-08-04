import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, _next) {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message    = err instanceof Error   ? err.message    : 'Internal Server Error';

  logger.error(`${req.method} ${req.path} → ${statusCode}: ${message}`);
  res.status(statusCode).json({ error: message });
}

