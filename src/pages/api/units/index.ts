/**
 * Units Dictionary API Endpoint
 * 
 * GET /api/units - List all measurement units
 * 
 * This is a simple dictionary endpoint that returns all available
 * measurement units in the system. Data is global (not user-specific)
 * and heavily cached due to infrequent changes.
 */

import type { APIContext } from 'astro';
import { UnitsService } from '../../../lib/services/units.service';
import type { UnitsListResponseDTO } from '../../../types';
import {
  successResponse,
  errorResponse,
  handleError,
} from '../../../lib/utils/api-response';
import { cache, CACHE_KEYS, CACHE_TTL } from '../../../lib/utils/cache';
import { createSupabaseServerInstance } from '../../../db/supabase.client';
import { UnauthorizedError } from '../../../lib/errors';

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
 * GET /api/units
 * Lists all available measurement units
 * 
 * Features:
 * - Aggressive caching (1 hour TTL)
 * - No pagination (small dataset)
 * - Sorted alphabetically by name
 * - Returns X-Cache header (HIT/MISS) for monitoring
 * 
 * @returns UnitsListResponseDTO with all units
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Authenticate user
    // Note: Even though units are global, we require authentication
    getAuthenticatedUser(context);

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies: context.cookies,
      headers: context.request.headers,
    });

    // TEMPORARY: Clear cache to fix RLS issue
    await cache.delete(CACHE_KEYS.UNITS_ALL);

    // Try cache first
    const cached = await cache.get<UnitsListResponseDTO>(CACHE_KEYS.UNITS_ALL);
    
    if (cached) {
      // Cache HIT - return cached data immediately
      return successResponse(cached, 200, {
        'X-Cache': 'HIT',
      });
    }

    // Cache MISS - fetch from database
    const unitsService = new UnitsService(supabase);
    const units = await unitsService.listUnits();

    const response: UnitsListResponseDTO = {
      data: units,
    };

    // Cache the result for future requests
    await cache.set(CACHE_KEYS.UNITS_ALL, response, CACHE_TTL.UNITS);

    // Return response with cache MISS header
    return successResponse(response, 200, {
      'X-Cache': 'MISS',
    });
  } catch (error) {
    return handleError(error);
  }
}

