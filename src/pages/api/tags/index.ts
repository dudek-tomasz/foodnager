/**
 * Tags Dictionary API Endpoint
 *
 * GET /api/tags - List all tags (with optional search)
 * POST /api/tags - Create a new tag
 *
 * Tags are global recipe categories that help users organize and filter recipes.
 * Data is cached due to infrequent changes.
 */

import type { APIContext } from "astro";
import { TagsService } from "../../../lib/services/tags.service";
import type { TagsListResponseDTO } from "../../../types";
import { successResponse, errorResponse, handleError } from "../../../lib/utils/api-response";
import { cache, CACHE_KEYS, CACHE_TTL } from "../../../lib/utils/cache";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { listTagsQuerySchema, createTagSchema } from "../../../lib/validations/tags.validation";
import { ZodError } from "zod";
import { ConflictError, UnauthorizedError } from "../../../lib/errors";

// Disable pre-rendering for API routes
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
 * GET /api/tags
 * Lists all available tags, optionally filtered by search term
 *
 * Features:
 * - Aggressive caching (10 minutes TTL)
 * - Optional case-insensitive search
 * - No pagination (small dataset, typically 20-50 tags)
 * - Sorted alphabetically by name
 * - Returns X-Cache header (HIT/MISS) for monitoring
 *
 * Query Parameters:
 * - search (optional): Filter tags by name (case-insensitive)
 *
 * @returns TagsListResponseDTO with all matching tags
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    // Note: Even though tags are global, we require authentication
    getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const search = url.searchParams.get("search") || undefined;

    const validatedQuery = listTagsQuerySchema.parse({ search });

    // Build cache key based on search parameter
    const cacheKey = validatedQuery.search ? CACHE_KEYS.TAGS_SEARCH(validatedQuery.search) : CACHE_KEYS.TAGS_ALL;

    // Try cache first
    const cached = await cache.get<TagsListResponseDTO>(cacheKey);

    if (cached) {
      // Cache HIT - return cached data immediately
      return successResponse(cached, 200, {
        "X-Cache": "HIT",
      });
    }

    // Cache MISS - fetch from database
    const tagsService = new TagsService(supabase);
    const tags = await tagsService.listTags(validatedQuery.search);

    const response: TagsListResponseDTO = {
      data: tags,
    };

    // Cache the result for future requests
    await cache.set(cacheKey, response, CACHE_TTL.TAGS);

    // Return response with cache MISS header
    return successResponse(response, 200, {
      "X-Cache": "MISS",
    });
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid query parameters", { errors: error.errors }, 422);
    }

    return handleError(error);
  }
}

/**
 * POST /api/tags
 * Creates a new tag in the system
 *
 * Features:
 * - Community-driven: any authenticated user can create tags
 * - Case-insensitive uniqueness check
 * - Automatic lowercase normalization
 * - Cache invalidation after creation
 * - Returns Location header with new resource URL
 *
 * Request Body:
 * - name (required): Tag name (2-50 chars, will be normalized to lowercase)
 *
 * @returns Created TagDTO with 201 status
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // Parse and validate request body
    const body = await context.request.json();
    const validatedData = createTagSchema.parse(body);

    // Create tag
    const tagsService = new TagsService(supabase);
    const tag = await tagsService.createTag(validatedData.name);

    // Invalidate all tag caches (both 'all' and all search caches)
    await cache.deletePattern("tags:*");

    // Return created tag with Location header
    return successResponse(tag, 201, {
      Location: `/api/tags/${tag.id}`,
    });
  } catch (error) {
    // Handle conflict error (duplicate tag name)
    if (error instanceof ConflictError) {
      return errorResponse("CONFLICT", error.message, error.details, 409);
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return errorResponse("VALIDATION_ERROR", "Invalid request data", { errors: error.errors }, 400);
    }

    return handleError(error);
  }
}
