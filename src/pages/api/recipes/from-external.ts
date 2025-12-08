/**
 * API Endpoint: /api/recipes/from-external
 *
 * POST - Save external recipe with product/unit names (not IDs)
 * This endpoint is used when user wants to save an external recipe to their collection
 */

import type { APIContext } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ExternalRecipeMapper } from "../../../lib/mappers/external-recipe-mapper";
import { successResponse, errorResponse } from "../../../lib/utils/api-response";
import { UnauthorizedError } from "../../../lib/errors";

export const prerender = false;

/**
 * Helper function to get authenticated user from request
 * @throws UnauthorizedError if user is not authenticated
 */
function getAuthenticatedUser(context: APIContext): string {
  const user = context.locals.user;
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
  return user.id;
}

/**
 * Schema for external recipe request body
 * Accepts product_name and unit_name instead of IDs
 */
const externalRecipeSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { message: "title is required" })
    .max(255, { message: "title cannot exceed 255 characters" }),
  description: z.string().trim().nullable().optional(),
  instructions: z.string().trim().min(1, { message: "instructions are required" }),
  cooking_time: z.number().int().positive({ message: "cooking_time must be positive" }).nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  ingredients: z
    .array(
      z.object({
        product_name: z.string().trim().min(1, { message: "product_name is required" }),
        quantity: z.number().positive({ message: "quantity must be positive" }),
        unit_name: z.string().trim().min(1, { message: "unit_name is required" }),
      })
    )
    .min(1, { message: "at least one ingredient is required" }),
  tags: z.array(z.string().trim()).optional(),
  // Optional metadata for external recipes
  external_id: z.string().optional(),
  image_url: z.string().url().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  // Optional sources array (for AI-generated recipes)
  sources: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        url: z.string().url(),
      })
    )
    .optional(),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ExternalRecipeSchema = z.infer<typeof externalRecipeSchema>;

/**
 * POST /api/recipes/from-external
 * Saves external recipe with product/unit names
 * Automatically resolves product and unit names to IDs, creating them if needed
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    const userId = getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse("VALIDATION_ERROR", "Invalid JSON body", undefined, 400);
    }

    const validationResult = externalRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        validationResult.error.flatten().fieldErrors,
        400
      );
    }

    const externalRecipe = validationResult.data;

    // Use ExternalRecipeMapper to map and save
    const mapper = new ExternalRecipeMapper(supabase);

    // Transform to ExternalRecipe format expected by mapper
    const recipeToMap = {
      id: externalRecipe.external_id || `temp-${Date.now()}`,
      title: externalRecipe.title,
      description: externalRecipe.description ?? undefined,
      instructions: externalRecipe.instructions,
      cooking_time: externalRecipe.cooking_time ?? undefined,
      difficulty: externalRecipe.difficulty ?? "medium",
      ingredients: externalRecipe.ingredients.map((ing) => ({
        name: ing.product_name,
        quantity: ing.quantity,
        unit: ing.unit_name,
      })),
      tags: externalRecipe.tags ?? [],
      image_url: externalRecipe.image_url ?? undefined,
      source_url: externalRecipe.source_url ?? undefined,
      sources: externalRecipe.sources ?? undefined,
    };

    // Map and save (this will resolve names to IDs and create missing products/units)
    const savedRecipe = await mapper.mapAndSave(recipeToMap, userId);

    // Return 201 Created with Location header
    return successResponse(savedRecipe, 201, {
      Location: `/api/recipes/${savedRecipe.id}`,
    });
  } catch (error) {
    console.error("Error in POST /api/recipes/from-external:", error);

    if (error instanceof UnauthorizedError) {
      return errorResponse("UNAUTHORIZED", error.message, undefined, 401);
    }

    return errorResponse("INTERNAL_ERROR", "Failed to save external recipe", undefined, 500);
  }
}
