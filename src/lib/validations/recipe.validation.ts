/**
 * Zod validation schemas for Recipe endpoints
 */

import { z } from 'zod';

// =============================================================================
// QUERY PARAMETERS SCHEMAS
// =============================================================================

/**
 * Schema for GET /api/recipes query parameters
 * Supports full-text search, filtering by source, difficulty, tags, cooking time
 */
export const listRecipesQuerySchema = z.object({
  search: z.string().trim().optional(),
  source: z.enum(['user', 'api', 'ai']).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  // Tags come as comma-separated string, transform to array of numbers
  tags: z
    .string()
    .transform((val) => {
      if (!val || val.trim() === '') return undefined;
      return val.split(',').map((id) => {
        const num = parseInt(id.trim(), 10);
        if (isNaN(num)) throw new Error('Invalid tag ID');
        return num;
      });
    })
    .optional(),
  max_cooking_time: z.coerce.number().int().positive().optional(),
  sort: z.enum(['title', 'cooking_time', 'difficulty', 'created_at']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListRecipesQuerySchema = z.infer<typeof listRecipesQuerySchema>;

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for recipe ingredient (nested in create/update)
 */
export const recipeIngredientSchema = z.object({
  product_id: z.number().int().positive({
    message: 'product_id must be a positive integer',
  }),
  quantity: z.number().positive({
    message: 'quantity must be positive',
  }),
  unit_id: z.number().int().positive({
    message: 'unit_id must be a positive integer',
  }),
});

/**
 * Schema for POST /api/recipes request body
 */
export const createRecipeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { message: 'title is required' })
      .max(255, { message: 'title cannot exceed 255 characters' }),
    description: z.string().trim().nullable().optional(),
    instructions: z.string().trim().min(1, { message: 'instructions are required' }),
    cooking_time: z
      .number()
      .int()
      .positive({ message: 'cooking_time must be positive' })
      .nullable()
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
    ingredients: z
      .array(recipeIngredientSchema)
      .min(1, { message: 'at least one ingredient is required' }),
    tag_ids: z.array(z.number().int().positive()).optional(),
  })
  .refine(
    (data) => {
      // Check for duplicate products in ingredients
      const productIds = data.ingredients.map((i) => i.product_id);
      return new Set(productIds).size === productIds.length;
    },
    { message: 'Duplicate products in ingredients are not allowed' }
  );

export type CreateRecipeSchema = z.infer<typeof createRecipeSchema>;

/**
 * Schema for PATCH /api/recipes/:id request body
 * All fields are optional, but at least one is required
 */
export const updateRecipeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { message: 'title cannot be empty' })
      .max(255, { message: 'title cannot exceed 255 characters' })
      .optional(),
    description: z.string().trim().nullable().optional(),
    instructions: z.string().trim().min(1, { message: 'instructions cannot be empty' }).optional(),
    cooking_time: z
      .number()
      .int()
      .positive({ message: 'cooking_time must be positive' })
      .nullable()
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
    ingredients: z
      .array(recipeIngredientSchema)
      .min(1, { message: 'at least one ingredient is required' })
      .optional(),
    tag_ids: z.array(z.number().int().positive()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required for update',
  })
  .refine(
    (data) => {
      // Check for duplicate products in ingredients (if ingredients provided)
      if (data.ingredients) {
        const productIds = data.ingredients.map((i) => i.product_id);
        return new Set(productIds).size === productIds.length;
      }
      return true;
    },
    { message: 'Duplicate products in ingredients are not allowed' }
  );

export type UpdateRecipeSchema = z.infer<typeof updateRecipeSchema>;

// =============================================================================
// URL PARAMETERS SCHEMAS
// =============================================================================

/**
 * Schema for :id parameter in URL
 */
export const recipeIdSchema = z.coerce.number().int().positive({
  message: 'Invalid recipe ID',
});

export type RecipeIdSchema = z.infer<typeof recipeIdSchema>;

