/**
 * Validation schemas for Tags API endpoints
 * 
 * Zod schemas for validating request parameters, query strings, and bodies
 * for all tag-related endpoints.
 */

import { z } from 'zod';

/**
 * Schema for listing tags query parameters (GET /api/tags)
 */
export const listTagsQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(50, 'Search query too long (max 50 characters)')
    .optional()
    .describe('Search term for filtering tags by name (case-insensitive)'),
});

/**
 * Inferred TypeScript type from listTagsQuerySchema
 */
export type ListTagsQueryInput = z.infer<typeof listTagsQuerySchema>;

/**
 * Schema for creating a new tag (POST /api/tags)
 * Name is required, trimmed, normalized to lowercase, and must be between 2-50 characters
 */
export const createTagSchema = z.object({
  name: z
    .string({
      required_error: 'Tag name is required',
      invalid_type_error: 'Tag name must be a string',
    })
    .trim()
    .min(2, 'Tag name must be at least 2 characters')
    .max(50, 'Tag name too long (max 50 characters)')
    .transform(val => val.toLowerCase())
    .describe('Name of the tag (will be normalized to lowercase)'),
});

/**
 * Inferred TypeScript type from createTagSchema
 */
export type CreateTagInput = z.infer<typeof createTagSchema>;

