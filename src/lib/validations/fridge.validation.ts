/**
 * Zod validation schemas for Virtual Fridge endpoints
 */

import { z } from 'zod';
import { isValidISODate } from '../utils/date.utils';

// =============================================================================
// QUERY PARAMETERS SCHEMAS
// =============================================================================

/**
 * Schema for GET /api/fridge query parameters
 */
export const listFridgeQuerySchema = z.object({
  expired: z.enum(['yes', 'no', 'all']).default('all'),
  expiring_soon: z.coerce.number().int().nonnegative().optional(),
  search: z.string().trim().optional(),
  sort: z.enum(['name', 'quantity', 'expiry_date', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(1000).default(20),
});

export type ListFridgeQuerySchema = z.infer<typeof listFridgeQuerySchema>;

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Custom refinement for ISO date validation
 */
const isoDateString = z.string().refine((val) => isValidISODate(val), {
  message: 'expiry_date must be a valid ISO date (YYYY-MM-DD)',
});

/**
 * Schema for POST /api/fridge request body
 */
export const createFridgeItemSchema = z.object({
  product_id: z.number().int().positive({
    message: 'product_id must be a positive integer',
  }),
  quantity: z.number().nonnegative({
    message: 'quantity must be greater than or equal to 0',
  }),
  unit_id: z.number().int().positive({
    message: 'unit_id must be a positive integer',
  }),
  expiry_date: z.union([isoDateString, z.null()]).optional(),
});

export type CreateFridgeItemSchema = z.infer<typeof createFridgeItemSchema>;

/**
 * Schema for PATCH /api/fridge/:id request body
 */
export const updateFridgeItemSchema = z
  .object({
    quantity: z.number().nonnegative({
      message: 'quantity must be greater than or equal to 0',
    }).optional(),
    unit_id: z.number().int().positive({
      message: 'unit_id must be a positive integer',
    }).optional(),
    expiry_date: z.union([isoDateString, z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  });

export type UpdateFridgeItemSchema = z.infer<typeof updateFridgeItemSchema>;

// =============================================================================
// URL PARAMETERS SCHEMAS
// =============================================================================

/**
 * Schema for :id parameter in URL
 */
export const fridgeItemIdSchema = z.coerce.number().int().positive({
  message: 'Invalid item ID',
});

export type FridgeItemIdSchema = z.infer<typeof fridgeItemIdSchema>;

