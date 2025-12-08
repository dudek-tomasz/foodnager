/**
 * Zod validation schemas for Shopping List endpoints
 */

import { z } from "zod";

// =============================================================================
// REQUEST BODY SCHEMAS
// =============================================================================

/**
 * Schema for POST /api/shopping-list/generate request body
 */
export const generateShoppingListSchema = z.object({
  recipe_id: z.number().int().positive({
    message: "recipe_id must be a positive integer",
  }),
});

export type GenerateShoppingListSchema = z.infer<typeof generateShoppingListSchema>;
