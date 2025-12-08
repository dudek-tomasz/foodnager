/**
 * API Endpoint: /api/shopping-list/generate
 *
 * POST - Generate shopping list based on recipe and user's fridge contents
 *
 * Compares recipe ingredients with available products in user's fridge
 * and returns a list of missing items needed to prepare the recipe.
 */

import type { APIContext } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { ShoppingListService } from "../../../lib/services/shopping-list.service";
import { generateShoppingListSchema } from "../../../lib/validations/shopping-list.validation";
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
 * POST /api/shopping-list/generate
 *
 * Generate shopping list for a recipe
 *
 * Request body:
 * {
 *   "recipe_id": 1 // required, positive integer
 * }
 *
 * Response: 200 OK
 * {
 *   "recipe": {
 *     "id": 1,
 *     "title": "Tomato Soup"
 *   },
 *   "missing_ingredients": [
 *     {
 *       "product": { "id": 15, "name": "Onion" },
 *       "required_quantity": 2,
 *       "available_quantity": 0,
 *       "missing_quantity": 2,
 *       "unit": { "id": 1, "name": "piece", "abbreviation": "pc" }
 *     }
 *   ],
 *   "total_items": 1
 * }
 *
 * Errors:
 * - 401 UNAUTHORIZED - Missing or invalid authentication
 * - 400 VALIDATION_ERROR - Invalid request body
 * - 404 NOT_FOUND - Recipe not found or doesn't belong to user
 * - 500 INTERNAL_ERROR - Server error
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

    const validationResult = generateShoppingListSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        "Invalid request body",
        validationResult.error.flatten().fieldErrors,
        400
      );
    }

    const { recipe_id } = validationResult.data;

    // Create service and generate shopping list
    const shoppingListService = new ShoppingListService(supabase);
    const result = await shoppingListService.generateShoppingList(userId, recipe_id);

    // Return 200 OK with shopping list
    return successResponse(result, 200);
  } catch (error) {
    console.error("Error in POST /api/shopping-list/generate:", error);

    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse("NOT_FOUND", error.message, undefined, 404);
    }

    // Generic server error
    return errorResponse("INTERNAL_ERROR", "Failed to generate shopping list", undefined, 500);
  }
}
