/**
 * Validation schemas for Products API endpoints
 * 
 * Zod schemas for validating request parameters, query strings, and bodies
 * for all product-related endpoints.
 */

import { z } from 'zod';

/**
 * Schema for product ID parameter (used in GET/PATCH/DELETE /api/products/:id)
 * Coerces string to number and validates it's a positive integer
 */
export const productIdParamSchema = z.coerce
  .number({
    required_error: 'Product ID is required',
    invalid_type_error: 'Product ID must be a number',
  })
  .int('Product ID must be an integer')
  .positive('Product ID must be positive');

/**
 * Schema for listing products query parameters (GET /api/products)
 */
export const listProductsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .optional()
    .describe('Search term for filtering products by name'),
  
  scope: z
    .enum(['global', 'private', 'all'])
    .optional()
    .default('all')
    .describe('Filter by product scope: global (user_id IS NULL), private (user_id = current user), or all'),
  
  page: z.coerce
    .number()
    .int()
    .min(1, 'Page must be at least 1')
    .optional()
    .default(1)
    .describe('Page number for pagination (1-indexed)'),
  
  limit: z.coerce
    .number()
    .int()
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit cannot exceed 100')
    .optional()
    .default(20)
    .describe('Number of items per page'),
});

/**
 * Inferred TypeScript type from listProductsQuerySchema
 */
export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;

/**
 * Schema for creating a new product (POST /api/products)
 * Name is required, trimmed, and must be between 1-255 characters
 */
export const createProductSchema = z.object({
  name: z
    .string({
      required_error: 'Product name is required',
      invalid_type_error: 'Product name must be a string',
    })
    .trim()
    .min(1, 'Product name cannot be empty')
    .max(255, 'Product name cannot exceed 255 characters')
    .describe('Name of the product'),
});

/**
 * Inferred TypeScript type from createProductSchema
 */
export type CreateProductInput = z.infer<typeof createProductSchema>;

/**
 * Schema for updating an existing product (PATCH /api/products/:id)
 * All fields are optional, but at least one field must be provided
 */
export const updateProductSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Product name cannot be empty')
      .max(255, 'Product name cannot exceed 255 characters')
      .optional()
      .describe('New name for the product'),
  })
  .refine(
    (data) => Object.keys(data).length > 0 && data.name !== undefined,
    {
      message: 'At least one field is required for update',
    }
  );

/**
 * Inferred TypeScript type from updateProductSchema
 */
export type UpdateProductInput = z.infer<typeof updateProductSchema>;

