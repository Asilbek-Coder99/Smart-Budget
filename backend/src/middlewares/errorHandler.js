import { AppError } from '../utils/AppError.js';

/**
 * Handle Prisma-specific errors and convert to AppError
 */
const handlePrismaError = (error) => {
  // Unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.join(', ') || 'field';
    return new AppError(`A record with this ${field} already exists`, 409);
  }
  // Record not found
  if (error.code === 'P2025') {
    return new AppError('Record not found', 404);
  }
  // Foreign key constraint failed
  if (error.code === 'P2003') {
    return new AppError('Related record not found', 400);
  }
  return new AppError('Database operation failed', 500);
};

/**
 * Handle JWT errors
 */
const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);
const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);

/**
 * Global error handling middleware
 * Must be the LAST middleware registered in app.js
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    error = handlePrismaError(err);
  }
  if (err.name === 'PrismaClientValidationError') {
    error = new AppError('Invalid data provided', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  // Validation errors (express-validator)
  if (err.type === 'validation') {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }

  // Development — expose full error
  if (process.env.NODE_ENV === 'development') {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      error: err,
      stack: err.stack,
    });
  }

  // Production — hide internal details from non-operational errors
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  console.error('UNHANDLED ERROR:', err);
  return res.status(500).json({
    success: false,
    message: 'Something went wrong. Please try again later.',
  });
};

export default errorHandler;
