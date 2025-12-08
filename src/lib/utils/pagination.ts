/**
 * Pagination utilities for Foodnager API
 *
 * Provides helper functions for calculating pagination metadata
 * and building paginated responses.
 */

import type { PaginationMetaDTO } from "../../types";

/**
 * Default pagination values
 */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * Calculates pagination metadata based on current page, limit, and total count
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @param total - Total number of items available
 * @returns Pagination metadata object
 *
 * @example
 * const meta = calculatePaginationMeta(2, 20, 150);
 * // Returns: { page: 2, limit: 20, total: 150, total_pages: 8 }
 */
export function calculatePaginationMeta(page: number, limit: number, total: number): PaginationMetaDTO {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    total_pages: totalPages,
  };
}

/**
 * Calculates SQL OFFSET value from page number and limit
 *
 * @param page - Current page number (1-indexed)
 * @param limit - Number of items per page
 * @returns OFFSET value for SQL query
 *
 * @example
 * const offset = calculateOffset(3, 20);
 * // Returns: 40 (skip first 40 items to get page 3)
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Validates and normalizes pagination parameters
 * Ensures page and limit are within acceptable ranges
 *
 * @param page - Requested page number
 * @param limit - Requested items per page
 * @returns Normalized page and limit values
 * @throws Error if values are out of acceptable range
 *
 * @example
 * const { page, limit } = normalizePaginationParams(0, 200);
 * // Returns: { page: 1, limit: 100 } (normalized to valid ranges)
 */
export function normalizePaginationParams(page?: number, limit?: number): { page: number; limit: number } {
  const normalizedPage = Math.max(page ?? PAGINATION_DEFAULTS.PAGE, 1);
  const normalizedLimit = Math.min(Math.max(limit ?? PAGINATION_DEFAULTS.LIMIT, 1), PAGINATION_DEFAULTS.MAX_LIMIT);

  return {
    page: normalizedPage,
    limit: normalizedLimit,
  };
}
