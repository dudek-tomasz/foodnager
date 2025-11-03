/**
 * API Endpoint: /api/recipes/generate
 * 
 * POST - Generate recipe directly with AI based on selected products
 * 
 * Differs from search-by-fridge:
 * - Goes directly to AI (no hierarchical search)
 * - User selects specific products (not limited to fridge)
 * - Supports cuisine preference
 * - Optional saving to database
 */

import type { APIContext } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { AIRecipeService } from '../../../lib/services/ai-recipe.service';
import { GenerateRecipeSchema } from '../../../lib/validations/recipe-discovery.validation';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';
import { NotFoundError, UnauthorizedError } from '../../../lib/errors';

export const prerender = false;

/**
 * Helper function to get authenticated user from request
 * @throws UnauthorizedError if user is not authenticated
 */
function getAuthenticatedUser(context: APIContext): string {
  const user = context.locals.user;
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  return user.id;
}

/**
 * POST /api/recipes/generate
 * 
 * Generate recipe with AI based on selected products
 * 
 * Request body:
 * {
 *   "product_ids": [1, 5, 10], // required, 1-20 products
 *   "preferences": { // optional
 *     "cuisine": "Italian",
 *     "max_cooking_time": 45,
 *     "difficulty": "easy",
 *     "dietary_restrictions": ["vegetarian"]
 *   },
 *   "save_to_recipes": true // optional, default true
 * }
 * 
 * Response: 201 Created
 * {
 *   "recipe": RecipeDTO
 * }
 * 
 * Errors:
 * - 401 UNAUTHORIZED - Missing or invalid authentication
 * - 400 VALIDATION_ERROR - Invalid request body
 * - 404 NOT_FOUND - Product not found or not accessible
 * - 500 INTERNAL_ERROR - AI service error or server error
 * - 503 SERVICE_UNAVAILABLE - AI service not configured
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
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body', undefined, 400);
    }

    const validationResult = GenerateRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request body',
        validationResult.error.flatten().fieldErrors,
        400
      );
    }

    const generateDto = validationResult.data;

    // Create service and generate recipe
    const aiRecipeService = new AIRecipeService(supabase);
    
    try {
      const result = await aiRecipeService.generateRecipe(userId, generateDto);
      
      // Return 201 Created
      return successResponse(result, 201);
      
    } catch (error: any) {
      // Handle specific AI service errors
      if (error.message?.includes('not configured')) {
        return errorResponse(
          'SERVICE_UNAVAILABLE',
          'AI service is not configured. Please contact support.',
          undefined,
          503
        );
      }

      if (error.message?.includes('timed out')) {
        return errorResponse(
          'TIMEOUT',
          'AI service request timed out. Please try again.',
          undefined,
          504
        );
      }

      throw error; // Re-throw to be caught by outer catch
    }
    
  } catch (error) {
    console.error('Error in POST /api/recipes/generate:', error);

    // Handle specific error types
    if (error instanceof NotFoundError) {
      return errorResponse('NOT_FOUND', error.message, undefined, 404);
    }

    // Generic server error
    return errorResponse(
      'INTERNAL_ERROR',
      'Failed to generate recipe',
      undefined,
      500
    );
  }
}

