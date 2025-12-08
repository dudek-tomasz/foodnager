/**
 * Virtual Fridge API Endpoint - List and Create
 *
 * GET /api/fridge - List all fridge items with filtering and sorting
 * POST /api/fridge - Add new item to fridge
 *
 * Following auth implementation:
 * - Uses context.locals.user from middleware
 * - Creates supabase instance per request using createSupabaseServerInstance
 * - Protected endpoint (middleware ensures user is authenticated)
 */

import type { APIContext } from "astro";
import { FridgeService } from "../../../lib/services/fridge.service";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { listFridgeQuerySchema, createFridgeItemSchema } from "../../../lib/validations/fridge.validation";
import { successResponse, handleError } from "../../../lib/utils/api-response";
import { ValidationError, UnauthorizedError } from "../../../lib/errors";

// Disable pre-rendering for API routes
export const prerender = false;

/**
 * Helper function to get authenticated user from request
 * Uses context.locals.user populated by middleware
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
 * GET /api/fridge
 * Lists fridge items for the authenticated user
 * Supports filtering by expiry status, expiring soon threshold, search, sorting, and pagination
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Authenticate user (from middleware via context.locals.user)
    const userId = getAuthenticatedUser(context);

    // Create Supabase instance for this request
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      expired: url.searchParams.get("expired") || undefined,
      expiring_soon: url.searchParams.get("expiring_soon") || undefined,
      search: url.searchParams.get("search") || undefined,
      sort: url.searchParams.get("sort") || undefined,
      order: url.searchParams.get("order") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = listFridgeQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      throw new ValidationError("Invalid query parameters", validationResult.error.flatten().fieldErrors);
    }

    // Call service with supabase instance
    const fridgeService = new FridgeService(supabase);
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
    // Authenticate user (from middleware via context.locals.user)
    const userId = getAuthenticatedUser(context);

    // Create Supabase instance for this request
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      throw new ValidationError("Invalid JSON in request body");
    }

    const validationResult = createFridgeItemSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid request body", validationResult.error.flatten().fieldErrors);
    }

    // Call service with supabase instance
    const fridgeService = new FridgeService(supabase);
    const item = await fridgeService.addItemToFridge(userId, validationResult.data);

    // Return 201 Created with Location header
    const location = `/api/fridge/${item.id}`;

    return successResponse(item, 201, { Location: location });
  } catch (error) {
    return handleError(error);
  }
}
