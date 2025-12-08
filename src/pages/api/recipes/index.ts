/**
 * API Endpoint: /api/recipes
 *
 * GET - List recipes with filtering and pagination
 * POST - Create new recipe
 */

import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { RecipeService } from "../../../lib/services/recipe.service";
import { listRecipesQuerySchema, createRecipeSchema } from "../../../lib/validations/recipe.validation";
import { successResponse, errorResponse } from "../../../lib/utils/api-response";
import { NotFoundError, UnauthorizedError } from "../../../lib/errors";

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
 * GET /api/recipes
 * Lists recipes with advanced filtering and pagination
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    const userId = getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = listRecipesQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid query parameters",
        validationResult.error.flatten().fieldErrors,
        422
      );
    }

    const query = validationResult.data;

    // Create service and fetch recipes
    const recipeService = new RecipeService(supabase);
    const result = await recipeService.listRecipes(userId, query);

    return successResponse(result, 200);
  } catch (error) {
    console.error("Error in GET /api/recipes:", error);
    return errorResponse("INTERNAL_ERROR", "Failed to fetch recipes", undefined, 500);
  }
}

/**
 * POST /api/recipes
 * Creates a new recipe with ingredients and tags
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

    const validationResult = createRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        validationResult.error.flatten().fieldErrors,
        400
      );
    }

    const createDto = validationResult.data;

    // Create recipe
    const recipeService = new RecipeService(supabase);
    const recipe = await recipeService.createRecipe(userId, createDto);

    // Return 201 Created with Location header
    return successResponse(recipe, 201, {
      Location: `/api/recipes/${recipe.id}`,
    });
  } catch (error) {
    console.error("Error in POST /api/recipes:", error);

    if (error instanceof NotFoundError) {
      return errorResponse("NOT_FOUND", error.message, undefined, 404);
    }

    return errorResponse("INTERNAL_ERROR", "Failed to create recipe", undefined, 500);
  }
}
