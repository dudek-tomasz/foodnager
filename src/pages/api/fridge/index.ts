/**
 * Virtual Fridge API Endpoint - List and Create
 * 
 * GET /api/fridge - List all fridge items with filtering and sorting
 * POST /api/fridge - Add new item to fridge
 */

import type { APIContext } from 'astro';
import { FridgeService } from '../../../lib/services/fridge.service';
import {
  listFridgeQuerySchema,
  createFridgeItemSchema,
} from '../../../lib/validations/fridge.validation';
import {
  successResponse,
  errorResponse,
  handleError,
} from '../../../lib/utils/api-response';
import { ValidationError } from '../../../lib/errors';
import { DEFAULT_USER_ID } from '../../../db/supabase.client';

// Disable pre-rendering for API routes
export const prerender = false;

// TODO: Restore authentication after auth system is implemented
/**
 * Helper function to get authenticated user from request
 * @throws UnauthorizedError if user is not authenticated
 */
// async function getAuthenticatedUser(context: APIContext): Promise<string> {
//   const supabase = context.locals.supabase;
//   
//   const { data: { user }, error } = await supabase.auth.getUser();
//
//   if (error || !user) {
//     throw new UnauthorizedError('Authentication required');
//   }
//
//   return user.id;
// }

/**
 * TEMPORARY: Returns default user ID for development
 * TODO: Replace with real authentication
 */
function getAuthenticatedUser(_context: APIContext): string {
  return DEFAULT_USER_ID;
}

/**
 * GET /api/fridge
 * Lists fridge items for the authenticated user
 * Supports filtering by expiry status, expiring soon threshold, search, sorting, and pagination
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Authenticate user (TEMPORARY: using default user)
    const userId = getAuthenticatedUser(context);

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      expired: url.searchParams.get('expired') || undefined,
      expiring_soon: url.searchParams.get('expiring_soon') || undefined,
      search: url.searchParams.get('search') || undefined,
      sort: url.searchParams.get('sort') || undefined,
      order: url.searchParams.get('order') || undefined,
      page: url.searchParams.get('page') || undefined,
      limit: url.searchParams.get('limit') || undefined,
    };

    const validationResult = listFridgeQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid query parameters',
        validationResult.error.flatten().fieldErrors
      );
    }

    // Call service
    const fridgeService = new FridgeService(context.locals.supabase);
    const result = await fridgeService.listFridgeItems(userId, validationResult.data);

    return successResponse(result, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/fridge
 * Adds a new item to the authenticated user's fridge
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
      throw new ValidationError('Invalid JSON in request body');
    }

    const validationResult = createFridgeItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        validationResult.error.flatten().fieldErrors
      );
    }

    // Call service
    const fridgeService = new FridgeService(context.locals.supabase);
    const item = await fridgeService.addItemToFridge(userId, validationResult.data);

    // Return 201 Created with Location header
    const location = `/api/fridge/${item.id}`;
    
    return successResponse(item, 201, { Location: location });
  } catch (error) {
    return handleError(error);
  }
}

