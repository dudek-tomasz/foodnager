/**
 * AIResponseValidator
 *
 * Validates AI-generated recipe responses using Zod schemas
 * Ensures the AI output matches expected structure
 */

/* eslint-disable no-console */
// Console logs are intentional for debugging AI response validation

import { z } from "zod";

/**
 * Schema for AI-generated ingredient
 */
const AIIngredientSchema = z.object({
  product_name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

/**
 * Schema for source reference (URL to culinary blog/site)
 */
const AISourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

/**
 * Schema for single AI-generated recipe
 */
export const AIRecipeSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  instructions: z.string().min(10),
  cooking_time: z.number().int().positive().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  ingredients: z.array(AIIngredientSchema).min(1),
  tags: z.array(z.string()).optional().default([]),
  sources: z.array(AISourceSchema).optional().default([]),
});

/**
 * Schema for AI response with multiple recipes
 */
export const AIRecipesResponseSchema = z.object({
  recipes: z.array(AIRecipeSchema).min(1).max(10),
});

/**
 * Type for AI-generated recipe
 */
export type AIRecipe = z.infer<typeof AIRecipeSchema>;

/**
 * Type for AI response with multiple recipes
 */
export type AIRecipesResponse = z.infer<typeof AIRecipesResponseSchema>;

/**
 * Type for AI-generated ingredient
 */
export type AIIngredient = z.infer<typeof AIIngredientSchema>;

/**
 * AIResponseValidator class
 */
export class AIResponseValidator {
  /**
   * Validate AI response (single recipe - deprecated, use validateMultiple)
   *
   * @param response - Raw response from AI (should be JSON)
   * @returns Validated AIRecipe
   * @throws ZodError if validation fails
   */
  validate(response: unknown): AIRecipe {
    try {
      return AIRecipeSchema.parse(response);
    } catch (error) {
      console.error("AI response validation failed:", error);
      throw new Error("Generated recipe does not match expected format");
    }
  }

  /**
   * Validate AI response with multiple recipes
   *
   * @param response - Raw response from AI (should be JSON with recipes array)
   * @returns Validated array of AIRecipe
   * @throws ZodError if validation fails
   */
  validateMultiple(response: unknown): AIRecipe[] {
    try {
      const validated = AIRecipesResponseSchema.parse(response);
      console.log(`✅ [AI Validator] Successfully validated ${validated.recipes.length} recipes`);
      return validated.recipes;
    } catch (error) {
      console.error("❌ [AI Validator] Validation failed:", error);
      throw new Error("Generated recipes do not match expected format");
    }
  }

  /**
   * Safe validation that returns result object
   *
   * @param response - Raw response from AI
   * @returns Result object with success flag and data or error
   */
  safeParse(response: unknown): z.SafeParseReturnType<unknown, AIRecipe> {
    return AIRecipeSchema.safeParse(response);
  }
}

/**
 * Export singleton instance
 */
export const aiResponseValidator = new AIResponseValidator();
