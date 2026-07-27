import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// Global Express error handler — must be registered last with app.use()
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message    = err instanceof Error   ? err.message    : 'Internal Server Error';

  logger.error(`${req.method} ${req.path} → ${statusCode}: ${message}`);
  res.status(statusCode).json({ error: message });
}
