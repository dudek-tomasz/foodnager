/**
 * API Endpoint: /api/recipes
 * 
 * GET - List recipes with filtering and pagination
 * POST - Create new recipe
 */

import type { APIContext } from 'astro';
import { createClient } from '../../../db/supabase.client';
import { RecipeService } from '../../../lib/services/recipe.service';
import {
  listRecipesQuerySchema,
  createRecipeSchema,
} from '../../../lib/validations/recipe.validation';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';
import { NotFoundError } from '../../../lib/errors';

export const prerender = false;

/**
 * GET /api/recipes
 * Lists recipes with advanced filtering and pagination
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Create Supabase client with user context
    const supabase = createClient(context);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = listRecipesQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return errorResponse(
        422,
        'VALIDATION_ERROR',
        'Invalid query parameters',
        validationResult.error.flatten().fieldErrors
      );
    }

    const query = validationResult.data;

    // Create service and fetch recipes
    const recipeService = new RecipeService(supabase);
    const result = await recipeService.listRecipes(user.id, query);

    return successResponse(200, result);
  } catch (error) {
    console.error('Error in GET /api/recipes:', error);
    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch recipes');
  }
}

/**
 * POST /api/recipes
 * Creates a new recipe with ingredients and tags
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Create Supabase client with user context
    const supabase = createClient(context);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse(401, 'UNAUTHORIZED', 'Authentication required');
    }

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse(400, 'VALIDATION_ERROR', 'Invalid JSON body');
    }

    const validationResult = createRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid request body',
        validationResult.error.flatten().fieldErrors
      );
    }

    const createDto = validationResult.data;

    // Create recipe
    const recipeService = new RecipeService(supabase);
    const recipe = await recipeService.createRecipe(user.id, createDto);

    // Return 201 Created with Location header
    return successResponse(
      201,
      recipe,
      new Headers({
        Location: `/api/recipes/${recipe.id}`,
      })
    );
  } catch (error) {
    console.error('Error in POST /api/recipes:', error);

    if (error instanceof NotFoundError) {
      return errorResponse(404, 'NOT_FOUND', error.message);
    }

    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to create recipe');
  }
}

