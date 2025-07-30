/**
 * Standardized API response utilities
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  const response = {
    success: true,
    message,
    ...(data && { data })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default: 500)
 * @param {Object} details - Additional error details (optional)
 */
export const sendError = (res, message = 'Internal server error', statusCode = 500, details = null) => {
  const response = {
    success: false,
    message,
    ...(details && { details })
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} res - Express response object
 * @param {Array|Object} errors - Validation errors
 * @param {string} message - Error message
 */
export const sendValidationError = (res, errors, message = 'Validation failed') => {
  return sendError(res, message, 400, { errors });
};

/**
 * Send not found response
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name (e.g., 'User', 'Project')
 */
export const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404);
};

/**
 * Send unauthorized response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
export const sendUnauthorized = (res, message = 'Access denied') => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response
 * @param {Object} res - Express response object
 * @param {string} message - Custom message
 */
export const sendForbidden = (res, message = 'Insufficient permissions') => {
  return sendError(res, message, 403);
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Object} data - Paginated data with items and pagination info
 * @param {string} message - Success message
 */
export const sendPaginatedResponse = (res, data, message = 'Data retrieved successfully') => {
  return sendSuccess(res, data, message);
};

/**
 * Handle async controller errors
 * @param {Function} fn - Async controller function
 * @returns {Function} Express middleware function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Global error handler middleware
 * @param {Error} error - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (error, req, res, next) => {
  console.error('Global error handler:', error);

  // Default error
  let message = 'Internal server error';
  let statusCode = 500;
  let details = null;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    message = 'Validation failed';
    statusCode = 400;
    details = error.details;
  } else if (error.name === 'UnauthorizedError') {
    message = 'Unauthorized access';
    statusCode = 401;
  } else if (error.name === 'ForbiddenError') {
    message = 'Access forbidden';
    statusCode = 403;
  } else if (error.name === 'NotFoundError') {
    message = 'Resource not found';
    statusCode = 404;
  } else if (error.message) {
    message = error.message;
  }

  // Send error response
  sendError(res, message, statusCode, details);
};
