/**
 * API Endpoint: /api/recipes/search-by-fridge
 * 
 * POST - Search recipes based on fridge contents with hierarchical search
 * 
 * Implements 3-tier search strategy:
 * - Tier 1: User's own recipes
 * - Tier 2: External API (to be implemented)
 * - Tier 3: AI generation (to be implemented)
 */

import type { APIContext } from 'astro';
import { createClient, DEFAULT_USER_ID } from '../../../db/supabase.client';
import { RecipeDiscoveryService } from '../../../lib/services/recipe-discovery.service';
import { SearchRecipesByFridgeSchema } from '../../../lib/validations/recipe-discovery.validation';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';
import { NotFoundError, ValidationError } from '../../../lib/errors';

export const prerender = false;

// TODO: Restore authentication after auth system is implemented
/**
 * Helper function to get authenticated user from request
 * @throws UnauthorizedError if user is not authenticated
 */
function getAuthenticatedUser(_context: APIContext): string {
  return DEFAULT_USER_ID;
}

/**
 * POST /api/recipes/search-by-fridge
 * 
 * Searches for recipes based on available fridge items
 * 
 * Request body:
 * {
 *   "use_all_fridge_items": boolean,
 *   "custom_product_ids": number[] (optional, required if use_all_fridge_items = false),
 *   "max_results": number (optional, default 10, range 1-50),
 *   "preferences": {
 *     "max_cooking_time": number (optional),
 *     "difficulty": "easy" | "medium" | "hard" (optional),
 *     "dietary_restrictions": string[] (optional)
 *   }
 * }
 * 
 * Response: 200 OK
 * {
 *   "results": [
 *     {
 *       "recipe": RecipeSummaryDTO,
 *       "match_score": number (0.0 - 1.0),
 *       "available_ingredients": AvailableIngredientDTO[],
 *       "missing_ingredients": AvailableIngredientDTO[]
 *     }
 *   ],
 *   "search_metadata": {
 *     "source": "user_recipes" | "external_api" | "ai_generated",
 *     "total_results": number,
 *     "search_duration_ms": number
 *   }
 * }
 * 
 * Errors:
 * - 422 VALIDATION_ERROR - Invalid request body or query parameters
 * - 404 NOT_FOUND - Specified products not found in fridge
 * - 500 INTERNAL_ERROR - Server error
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Authenticate user (TEMPORARY: using default user)
    const userId = getAuthenticatedUser(context);

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body', undefined, 422);
    }

    const validationResult = SearchRecipesByFridgeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request body',
        validationResult.error.flatten().fieldErrors,
        422
      );
    }

    const searchDto = validationResult.data;

    // Create service and search recipes
    const discoveryService = new RecipeDiscoveryService(context.locals.supabase);
    const result = await discoveryService.searchByFridge(userId, searchDto);

    return successResponse(result, 200);
    
  } catch (error) {
    console.error('Error in POST /api/recipes/search-by-fridge:', error);

    // Handle specific error types
    if (error instanceof ValidationError) {
      return errorResponse('VALIDATION_ERROR', error.message, undefined, 422);
    }

    if (error instanceof NotFoundError) {
      return errorResponse('NOT_FOUND', error.message, undefined, 404);
    }

    // Generic server error
    return errorResponse('INTERNAL_ERROR', 'Failed to search recipes', undefined, 500);
  }
}

