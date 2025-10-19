/**
 * API Endpoint: /api/cooking-history
 * 
 * GET - List cooking history with filtering and pagination
 * POST - Create cooking history entry and update fridge automatically
 */

import type { APIContext } from 'astro';
import { createClient } from '../../../db/supabase.client';
import { CookingHistoryService } from '../../../lib/services/cooking-history.service';
import {
  ListCookingHistoryQuerySchema,
  CreateCookingHistorySchema,
} from '../../../lib/validations/cooking-history.validation';
import { successResponse, errorResponse } from '../../../lib/utils/api-response';
import { NotFoundError, InsufficientIngredientsError } from '../../../lib/errors';

export const prerender = false;

/**
 * GET /api/cooking-history
 * Lists cooking history with optional filtering by recipe, date range, and pagination
 * 
 * Query Parameters:
 * - recipe_id (optional): Filter by specific recipe
 * - from_date (optional): Start date (YYYY-MM-DD)
 * - to_date (optional): End date (YYYY-MM-DD)
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 20, max: 100)
 * 
 * Returns:
 * - 200: List of cooking history entries with pagination
 * - 401: Not authenticated
 * - 422: Invalid query parameters
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
      return errorResponse('UNAUTHORIZED', 'Authentication required', undefined, 401);
    }

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = ListCookingHistoryQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        validationResult.error.flatten().fieldErrors,
        422
      );
    }

    const query = validationResult.data;

    // Create service and fetch cooking history
    const cookingHistoryService = new CookingHistoryService(supabase);
    const result = await cookingHistoryService.listCookingHistory(user.id, query);

    return successResponse(result, 200);
  } catch (error) {
    console.error('Error in GET /api/cooking-history:', error);
    return errorResponse('INTERNAL_ERROR', 'Failed to fetch cooking history', undefined, 500);
  }
}

/**
 * POST /api/cooking-history
 * Creates a cooking history entry and automatically updates fridge quantities
 * 
 * This endpoint:
 * 1. Validates recipe exists and belongs to user
 * 2. Checks sufficient ingredients in fridge
 * 3. Records cooking event with before/after fridge snapshots
 * 4. Deducts ingredients from fridge using FIFO strategy
 * 5. Returns comprehensive result with state changes
 * 
 * Request Body:
 * - recipe_id (required): ID of the recipe that was cooked
 * 
 * Returns:
 * - 201: Cooking history entry created, fridge updated
 * - 400: Insufficient ingredients or invalid request
 * - 401: Not authenticated
 * - 404: Recipe not found or doesn't belong to user
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
      return errorResponse('UNAUTHORIZED', 'Authentication required', undefined, 401);
    }

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      return errorResponse('VALIDATION_ERROR', 'Invalid JSON body', undefined, 400);
    }

    const validationResult = CreateCookingHistorySchema.safeParse(body);

    if (!validationResult.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid request body',
        validationResult.error.flatten().fieldErrors,
        400
      );
    }

    const { recipe_id } = validationResult.data;

    // Create cooking history entry (handles fridge update atomically)
    const cookingHistoryService = new CookingHistoryService(supabase);
    const result = await cookingHistoryService.createCookingHistoryEntry(user.id, recipe_id);

    // Return 201 Created with Location header
    return successResponse(
      result,
      201,
      { Location: `/api/cooking-history/${result.id}` }
    );
  } catch (error) {
    console.error('Error in POST /api/cooking-history:', error);

    // Handle known error types
    if (error instanceof NotFoundError) {
      return errorResponse('NOT_FOUND', error.message, undefined, 404);
    }

    if (error instanceof InsufficientIngredientsError) {
      return errorResponse(
        'INSUFFICIENT_INGREDIENTS',
        error.message,
        error.details,
        400
      );
    }

    // Generic error fallback
    return errorResponse('INTERNAL_ERROR', 'Failed to record cooking event', undefined, 500);
  }
}

