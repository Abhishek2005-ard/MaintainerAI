// Wraps an async route handler so errors are forwarded to Express's error middleware.
export function catchAsync(fn) {
  return (req, res, next) => fn(req, res, next).catch(next);
}
