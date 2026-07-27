import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

// Wraps an async route handler so errors are forwarded to Express's error middleware.
export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next);
}
