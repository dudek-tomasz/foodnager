/**
 * Custom error classes for Foodnager API
 * 
 * These error classes are used throughout the application to provide
 * consistent error handling and responses.
 */

/**
 * Base API Error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 401 Unauthorized - Authentication required or invalid token
 */
export class UnauthorizedError extends ApiError {
  constructor(message = 'Authentication required', details?: Record<string, unknown>) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

/**
 * 403 Forbidden - User doesn't have permission to access resource
 */
export class ForbiddenError extends ApiError {
  constructor(message = 'Access forbidden', details?: Record<string, unknown>) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

/**
 * 404 Not Found - Resource doesn't exist or user doesn't have access
 */
export class NotFoundError extends ApiError {
  constructor(message = 'Resource not found', details?: Record<string, unknown>) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

/**
 * 409 Conflict - Resource already exists (e.g., duplicate name)
 */
export class ConflictError extends ApiError {
  constructor(message = 'Resource conflict', details?: Record<string, unknown>) {
    super(message, 409, 'CONFLICT', details);
  }
}

/**
 * 422 Unprocessable Entity - Validation error
 */
export class ValidationError extends ApiError {
  constructor(message = 'Validation error', details?: Record<string, unknown>) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

/**
 * 400 Bad Request - Insufficient ingredients in fridge to cook recipe
 */
export class InsufficientIngredientsError extends ApiError {
  constructor(message = 'Not enough ingredients in fridge to cook this recipe', details?: Record<string, unknown>) {
    super(message, 400, 'INSUFFICIENT_INGREDIENTS', details);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalError extends ApiError {
  constructor(message = 'Internal server error', details?: Record<string, unknown>) {
    super(message, 500, 'INTERNAL_ERROR', details);
  }
}

