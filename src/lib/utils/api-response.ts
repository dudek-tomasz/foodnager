/**
 * API Response utilities for Foodnager API
 *
 * Provides helper functions for creating consistent HTTP responses
 * with proper headers and error formatting.
 */

/* eslint-disable no-console */
// Console logs are intentional for debugging API responses

import type { ErrorResponseDTO } from "../../types";
import { ApiError } from "../errors";

/**
 * Creates a successful JSON response
 *
 * @param data - The data to return in response body
 * @param status - HTTP status code (default: 200)
 * @param headers - Additional headers to include
 * @returns Response object with JSON body
 */
export function successResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

/**
 * Creates a no-content response (typically for DELETE operations)
 *
 * @param headers - Additional headers to include
 * @returns Response object with 204 status and no body
 */
export function noContentResponse(headers: Record<string, string> = {}): Response {
  return new Response(null, {
    status: 204,
    headers,
  });
}

/**
 * Creates an error response with standard format
 *
 * @param code - Error code (e.g., 'VALIDATION_ERROR')
 * @param message - Human-readable error message
 * @param details - Additional error details
 * @param status - HTTP status code (default: 500)
 * @returns Response object with error JSON body
 */
export function errorResponse(
  code: string,
  message: string,
  details?: Record<string, unknown>,
  status = 500
): Response {
  const errorBody: ErrorResponseDTO = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/**
 * Converts ApiError instance to HTTP Response
 *
 * @param error - ApiError instance
 * @returns Response object with error details
 */
export function apiErrorToResponse(error: ApiError): Response {
  return errorResponse(error.code, error.message, error.details, error.statusCode);
}

/**
 * Handles any error and converts it to appropriate HTTP Response
 * Logs unexpected errors for debugging
 *
 * @param error - Any error (ApiError or generic Error)
 * @returns Response object with error details
 */
export function handleError(error: unknown): Response {
  // Handle known ApiError instances
  if (error instanceof ApiError) {
    return apiErrorToResponse(error);
  }

  // Handle unexpected errors
  console.error("Unexpected error:", error);

  return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", undefined, 500);
}
