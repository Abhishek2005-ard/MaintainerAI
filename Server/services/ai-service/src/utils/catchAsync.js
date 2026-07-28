// Wraps an async route handler so thrown errors are forwarded to Express's error handler
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
