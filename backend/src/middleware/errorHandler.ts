import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

/**
 * Global error handler middleware
 * Ensures all errors return a consistent JSON format
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // If response already sent, delegate to Express default error handler
  if (res.headersSent) {
    return next(error);
  }

  // Determine status code
  const statusCode = error.statusCode || 500;
  
  // Determine error code
  let errorCode = error.code || 'INTERNAL_ERROR';
  
  // Map common error types to codes
  if (error.name === 'ValidationError') {
    errorCode = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError') {
    errorCode = 'UNAUTHORIZED';
  } else if (error.name === 'ForbiddenError') {
    errorCode = 'FORBIDDEN';
  } else if (error.name === 'NotFoundError') {
    errorCode = 'NOT_FOUND';
  }

  // Prepare error message
  const message = error.message || 'An unexpected error occurred';

  // Log error for debugging (in production, use proper logging)
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    statusCode,
    errorCode
  });

  // Send consistent error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
      ...(error.details && { details: error.details })
    }
  });
}

/**
 * Async error wrapper for route handlers
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create a custom error with status code and error code
 */
export function createApiError(
  message: string,
  statusCode: number = 500,
  code: string = 'INTERNAL_ERROR',
  details?: any
): ApiError {
  const error: ApiError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
} 