/**
 * Virtual Fridge API Endpoint - Single Item Operations
 * 
 * GET /api/fridge/:id - Get fridge item by ID
 * PATCH /api/fridge/:id - Update fridge item
 * DELETE /api/fridge/:id - Delete fridge item
 * 
 * Following auth implementation:
 * - Uses context.locals.user from middleware
 * - Creates supabase instance per request
 */

import type { APIContext } from 'astro';
import { FridgeService } from '../../../lib/services/fridge.service';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import {
  fridgeItemIdSchema,
  updateFridgeItemSchema,
} from '../../../lib/validations/fridge.validation';
import {
  successResponse,
  noContentResponse,
  handleError,
} from '../../../lib/utils/api-response';
import { ValidationError, UnauthorizedError } from '../../../lib/errors';

// Disable pre-rendering for API routes
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
 * Helper function to parse and validate fridge item ID from URL params
 * @throws ValidationError if ID is invalid
 */
function parseFridgeItemId(context: APIContext): number {
  const idParam = context.params.id;
  
  const validationResult = fridgeItemIdSchema.safeParse(idParam);

  if (!validationResult.success) {
    throw new ValidationError(
      'Invalid item ID',
      { id: validationResult.error.errors.map(e => e.message) }
    );
  }

  return validationResult.data;
}

/**
 * GET /api/fridge/:id
 * Retrieves a single fridge item by ID
 * User can only access their own fridge items
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

    // Validate item ID
    const itemId = parseFridgeItemId(context);

    // Call service
    const fridgeService = new FridgeService(supabase);
    const item = await fridgeService.getFridgeItemById(userId, itemId);

    return successResponse(item, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/fridge/:id
 * Updates a fridge item (quantity, unit, expiry_date)
 * Cannot update product_id - user must delete and create new item instead
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

    // Validate item ID
    const itemId = parseFridgeItemId(context);

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const validationResult = updateFridgeItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        validationResult.error.flatten().fieldErrors
      );
    }

    // Call service
    const fridgeService = new FridgeService(supabase);
    const item = await fridgeService.updateFridgeItem(
      userId,
      itemId,
      validationResult.data
    );

    return successResponse(item, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/fridge/:id
 * Deletes a fridge item
 * Returns 204 No Content on success
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

    // Validate item ID
    const itemId = parseFridgeItemId(context);

    // Call service
    const fridgeService = new FridgeService(supabase);
    await fridgeService.deleteFridgeItem(userId, itemId);

    // Return 204 No Content on success
    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}

