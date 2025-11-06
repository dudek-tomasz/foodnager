/**
 * API Endpoint: /api/recipes/:id
 * 
 * GET - Get recipe by ID
 * PATCH - Update recipe
 * DELETE - Delete recipe
 */

import type { APIContext } from 'astro';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { RecipeService } from '../../../lib/services/recipe.service';
import {
  recipeIdSchema,
  updateRecipeSchema,
} from '../../../lib/validations/recipe.validation';
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
 * GET /api/recipes/:id
 * Gets a single recipe with all ingredients and tags
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

    // Parse and validate recipe ID
    const idValidation = recipeIdSchema.safeParse(context.params.id);

    if (!idValidation.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid recipe ID', undefined, 400);
    }

    const recipeId = idValidation.data;

    // Fetch recipe
    const recipeService = new RecipeService(supabase);
    const recipe = await recipeService.getRecipeById(userId, recipeId);

    return successResponse(recipe, 200);
  } catch (error) {
    console.error('Error in GET /api/recipes/:id:', error);

    if (error instanceof NotFoundError) {
      return errorResponse('NOT_FOUND', 'Recipe not found', undefined, 404);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to fetch recipe', undefined, 500);
  }
}

/**
 * PATCH /api/recipes/:id
 * Updates an existing recipe
 */
export async function PATCH(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    const userId = getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate recipe ID
    const idValidation = recipeIdSchema.safeParse(context.params.id);

    if (!idValidation.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid recipe ID', undefined, 400);
    }

    const recipeId = idValidation.data;

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body', undefined, 400);
    }

    const validationResult = updateRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request body',
        validationResult.error.flatten().fieldErrors,
        400
      );
    }

    const updateDto = validationResult.data;

    // Update recipe
    const recipeService = new RecipeService(supabase);
    const recipe = await recipeService.updateRecipe(userId, recipeId, updateDto);

    return successResponse(recipe, 200);
  } catch (error) {
    console.error('Error in PATCH /api/recipes/:id:', error);

    if (error instanceof NotFoundError) {
      return errorResponse('NOT_FOUND', error.message, undefined, 404);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to update recipe', undefined, 500);
  }
}

/**
 * DELETE /api/recipes/:id
 * Deletes a recipe (cascade deletes ingredients, tags, and cooking history)
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    const userId = getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate recipe ID
    const idValidation = recipeIdSchema.safeParse(context.params.id);

    if (!idValidation.success) {
      return errorResponse('VALIDATION_ERROR', 'Invalid recipe ID', undefined, 400);
    }

    const recipeId = idValidation.data;

    // Delete recipe
    const recipeService = new RecipeService(supabase);
    await recipeService.deleteRecipe(userId, recipeId);

    // Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/recipes/:id:', error);

    if (error instanceof NotFoundError) {
      return errorResponse('NOT_FOUND', 'Recipe not found', undefined, 404);
    }

    return errorResponse('INTERNAL_ERROR', 'Failed to delete recipe', undefined, 500);
  }
}

