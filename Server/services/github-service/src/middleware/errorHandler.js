import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import fs from 'fs';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || error.status || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  logger.error(`Error: ${error.message}`);
  if (error.stack) {
    logger.debug(error.stack);
  }

  // Write error to a log file on disk so we can diagnose issues
  try {
    const logMsg = `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${error.statusCode} - ${error.message}\nStack: ${error.stack}\n\n`;
    fs.appendFileSync('c:/Users/Admin/Desktop/MaintainerAI/Server/error.log', logMsg);
  } catch (fsErr) {
    logger.error(`Failed to write to error.log: ${fsErr.message}`);
  }

  const response = {
    error: error.message,
    statusCode: error.statusCode,
    ...(env.NODE_ENV === 'development' && { stack: error.stack }),
  };

  res.status(error.statusCode).json(response);
};
