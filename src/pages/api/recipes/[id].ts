/**
 * API Endpoint: /api/recipes/:id
 * 
 * GET - Get recipe by ID
 * PATCH - Update recipe
 * DELETE - Delete recipe
 */

import type { APIContext } from 'astro';
import { createClient } from '../../../db/supabase.client';
import { RecipeService } from '../../../lib/services/recipe.service';
import {
  recipeIdSchema,
  updateRecipeSchema,
} from '../../../lib/validations/recipe.validation';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';
import { NotFoundError } from '../../../lib/errors';

export const prerender = false;

/**
 * GET /api/recipes/:id
 * Gets a single recipe with all ingredients and tags
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

    // Parse and validate recipe ID
    const idValidation = recipeIdSchema.safeParse(context.params.id);

    if (!idValidation.success) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Invalid recipe ID');
    }

    const recipeId = idValidation.data;

    // Fetch recipe
    const recipeService = new RecipeService(supabase);
    const recipe = await recipeService.getRecipeById(user.id, recipeId);

    return successResponse(200, recipe);
  } catch (error) {
    console.error('Error in GET /api/recipes/:id:', error);

    if (error instanceof NotFoundError) {
      return errorResponse(404, 'NOT_FOUND', 'Recipe not found');
    }

    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to fetch recipe');
  }
}

/**
 * PATCH /api/recipes/:id
 * Updates an existing recipe
 */
export async function PATCH(context: APIContext): Promise<Response> {
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

    // Parse and validate recipe ID
    const idValidation = recipeIdSchema.safeParse(context.params.id);

    if (!idValidation.success) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Invalid recipe ID');
    }

    const recipeId = idValidation.data;

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse(400, 'VALIDATION_ERROR', 'Invalid JSON body');
    }

    const validationResult = updateRecipeSchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        400,
        'VALIDATION_ERROR',
        'Invalid request body',
        validationResult.error.flatten().fieldErrors
      );
    }

    const updateDto = validationResult.data;

    // Update recipe
    const recipeService = new RecipeService(supabase);
    const recipe = await recipeService.updateRecipe(user.id, recipeId, updateDto);

    return successResponse(200, recipe);
  } catch (error) {
    console.error('Error in PATCH /api/recipes/:id:', error);

    if (error instanceof NotFoundError) {
      return errorResponse(404, 'NOT_FOUND', error.message);
    }

    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to update recipe');
  }
}

/**
 * DELETE /api/recipes/:id
 * Deletes a recipe (cascade deletes ingredients, tags, and cooking history)
 */
export async function DELETE(context: APIContext): Promise<Response> {
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

    // Parse and validate recipe ID
    const idValidation = recipeIdSchema.safeParse(context.params.id);

    if (!idValidation.success) {
      return errorResponse(400, 'VALIDATION_ERROR', 'Invalid recipe ID');
    }

    const recipeId = idValidation.data;

    // Delete recipe
    const recipeService = new RecipeService(supabase);
    await recipeService.deleteRecipe(user.id, recipeId);

    // Return 204 No Content
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/recipes/:id:', error);

    if (error instanceof NotFoundError) {
      return errorResponse(404, 'NOT_FOUND', 'Recipe not found');
    }

    return errorResponse(500, 'INTERNAL_ERROR', 'Failed to delete recipe');
  }
}

