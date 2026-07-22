/**
 * Custom Application Error class
 * Extends the native Error to add statusCode and operational flag
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Distinguish from programmer errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper — eliminates try/catch in every controller
 * Usage: router.get('/', catchAsync(async (req, res) => { ... }))
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
