/**
 * Validation schemas for Recipe Discovery & AI Integration endpoints
 *
 * This file contains Zod schemas for validating requests to:
 * - POST /api/recipes/search-by-fridge
 * - POST /api/recipes/generate
 */

import { z } from "zod";

// =============================================================================
// SEARCH BY FRIDGE VALIDATION
// =============================================================================

/**
 * Schema for search preferences
 */
export const SearchRecipePreferencesSchema = z
  .object({
    max_cooking_time: z.number().int().positive().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    dietary_restrictions: z.array(z.string().trim()).optional(),
  })
  .optional();

/**
 * Schema for search-by-fridge request body
 *
 * Validation rules:
 * - use_all_fridge_items is required
 * - If use_all_fridge_items is false, custom_product_ids must be provided
 * - max_results must be between 1 and 50
 * - source determines which tier to search (user, api, ai, or all for hierarchical)
 */
export const SearchRecipesByFridgeSchema = z
  .object({
    use_all_fridge_items: z.boolean(),
    custom_product_ids: z.array(z.number().int().positive()).optional(),
    max_results: z.number().int().min(1).max(50).default(10),
    preferences: SearchRecipePreferencesSchema,
    source: z.enum(["user", "api", "ai", "all"]).default("all"),
  })
  .refine(
    (data) => {
      // If not using all fridge items, custom_product_ids must be provided
      if (!data.use_all_fridge_items && (!data.custom_product_ids || data.custom_product_ids.length === 0)) {
        return false;
      }
      return true;
    },
    {
      message: "custom_product_ids is required and must not be empty when use_all_fridge_items is false",
    }
  );

// =============================================================================
// GENERATE RECIPE VALIDATION
// =============================================================================

/**
 * Schema for recipe generation preferences
 */
export const GenerateRecipePreferencesSchema = z
  .object({
    cuisine: z.string().trim().max(50).optional(),
    max_cooking_time: z.number().int().positive().optional(),
    difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    dietary_restrictions: z.array(z.string().trim()).optional(),
  })
  .optional();

/**
 * Schema for generate recipe request body
 *
 * Validation rules:
 * - product_ids is required with 1-20 products (practical limit for AI)
 * - save_to_recipes defaults to false (user must explicitly save)
 */
export const GenerateRecipeSchema = z.object({
  product_ids: z.array(z.number().int().positive()).min(1).max(20),
  preferences: GenerateRecipePreferencesSchema,
  save_to_recipes: z.boolean().default(false),
});

// =============================================================================
// TYPE EXPORTS (inferred from schemas)
// =============================================================================

export type SearchRecipesByFridgeInput = z.infer<typeof SearchRecipesByFridgeSchema>;
export type GenerateRecipeInput = z.infer<typeof GenerateRecipeSchema>;
