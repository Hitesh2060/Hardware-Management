import ApiError from '../utils/ApiError.js';
import { env } from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Converts any thrown error (ApiError, Prisma error, JWT error, or unknown)
 * into a consistent JSON response. Must be registered LAST in app.js.
 */
export const errorMiddleware = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || mapKnownErrorToStatus(error);
    const message = error.message || 'Something went wrong';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  logger.error(`${req.method} ${req.originalUrl} -> ${err.message}`, { stack: err.stack });

  return res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    errors: error.errors,
    stack: env.nodeEnv === 'development' ? error.stack : undefined,
  });
};

function mapKnownErrorToStatus(error) {
  // Prisma known request errors (unique constraint, FK violation, not found, etc.)
  if (error.code === 'P2002') return 409; // unique constraint violation
  if (error.code === 'P2003') return 409; // FK constraint violation
  if (error.code === 'P2025') return 404; // record not found
  if (error.name === 'JsonWebTokenError') return 401;
  if (error.name === 'TokenExpiredError') return 401;
  return 500;
}

/** 404 handler for unmatched routes — register right before errorMiddleware. */
export const notFoundMiddleware = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
