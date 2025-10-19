/**
 * Validation schemas for Cooking History endpoints
 * 
 * Validates:
 * - Query parameters for listing cooking history (GET)
 * - Request body for creating cooking history entry (POST)
 */

import { z } from 'zod';

/**
 * Validation schema for GET /api/cooking-history query parameters
 * 
 * Validates:
 * - recipe_id: optional positive integer
 * - from_date: optional ISO date string (YYYY-MM-DD)
 * - to_date: optional ISO date string (YYYY-MM-DD)
 * - page: positive integer, default 1
 * - limit: positive integer between 1-100, default 20
 * 
 * Custom validation: from_date must be before or equal to to_date
 */
export const ListCookingHistoryQuerySchema = z.object({
  recipe_id: z.coerce.number().int().positive().optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, use YYYY-MM-DD').optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format, use YYYY-MM-DD').optional(),
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1).max(100, 'Limit cannot exceed 100').default(20)
}).refine(
  (data) => {
    if (data.from_date && data.to_date) {
      return new Date(data.from_date) <= new Date(data.to_date);
    }
    return true;
  },
  {
    message: 'from_date must be before or equal to to_date',
    path: ['from_date']
  }
);

/**
 * Validation schema for POST /api/cooking-history request body
 * 
 * Validates:
 * - recipe_id: required positive integer
 */
export const CreateCookingHistorySchema = z.object({
  recipe_id: z.number().int().positive('recipe_id must be a positive integer')
});

/**
 * Type exports for use in handlers
 */
export type ListCookingHistoryQuery = z.infer<typeof ListCookingHistoryQuerySchema>;
export type CreateCookingHistoryRequest = z.infer<typeof CreateCookingHistorySchema>;

