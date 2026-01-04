/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Create a 400 Bad Request error
 */
export const badRequest = (message = 'Bad Request') => {
  return new ApiError(message, 400);
};

/**
 * Create a 401 Unauthorized error
 */
export const unauthorized = (message = 'Unauthorized') => {
  return new ApiError(message, 401);
};

/**
 * Create a 403 Forbidden error
 */
export const forbidden = (message = 'Forbidden') => {
  return new ApiError(message, 403);
};

/**
 * Create a 404 Not Found error
 */
export const notFound = (message = 'Not Found') => {
  return new ApiError(message, 404);
};

/**
 * Create a 413 Payload Too Large error
 */
export const payloadTooLarge = (message = 'Payload Too Large') => {
  return new ApiError(message, 413);
};

/**
 * Create a 429 Too Many Requests error
 */
export const tooManyRequests = (message = 'Too Many Requests') => {
  return new ApiError(message, 429);
};

/**
 * Create a 500 Internal Server Error
 */
export const internalError = (message = 'Internal Server Error') => {
  return new ApiError(message, 500);
};
