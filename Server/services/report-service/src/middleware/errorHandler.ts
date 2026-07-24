import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';

export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`[ErrorHandler] ${statusCode} — ${message}`);
  res.status(statusCode).json({ error: message, statusCode });
};
