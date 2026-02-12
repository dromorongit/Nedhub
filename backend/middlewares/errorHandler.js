/**
 * Error Handler Middleware
 */

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[ErrorHandler] Error occurred:`, err);

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = 'Validation failed';
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (err.name === 'MongoError' && err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry';
  } else if (err.message?.includes('PAYMENT_INITIATION_FAILED')) {
    statusCode = 502;
    errorCode = 'PAYMENT_GATEWAY_ERROR';
    message = 'Payment gateway error - please try again';
  } else if (err.message?.includes('HUBTEL_ERROR')) {
    statusCode = 502;
    errorCode = 'HUBTEL_API_ERROR';
    message = 'Payment provider error - please try again';
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'An unexpected error occurred';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    code: errorCode,
    ...(process.env.NODE_ENV !== 'production' && { 
      details: err.details || err.stack 
    })
  });
};

/**
 * Not found handler for undefined routes
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl
  });
};

/**
 * Async handler wrapper to catch async errors
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler
};
