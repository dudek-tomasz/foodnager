/**
 * Products API Endpoint - List and Create
 *
 * GET /api/products - List all products (global + user's private)
 * POST /api/products - Create new private product
 */

import type { APIContext } from "astro";
import { ProductService } from "../../lib/services/products.service";
import { listProductsQuerySchema, createProductSchema } from "../../lib/validations/products.validation";
import { successResponse, handleError } from "../../lib/utils/api-response";
import { ValidationError, UnauthorizedError } from "../../lib/errors";
import { createSupabaseServerInstance } from "../../db/supabase.client";

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
 * GET /api/products
 * Lists products available to the authenticated user
 * Supports search, scope filtering, and pagination
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

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      search: url.searchParams.get("search") || undefined,
      scope: url.searchParams.get("scope") || undefined,
      page: url.searchParams.get("page") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    const validationResult = listProductsQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      throw new ValidationError("Invalid query parameters", validationResult.error.flatten().fieldErrors);
    }

    // Call service
    const productService = new ProductService(supabase);
    const result = await productService.listProducts(userId, validationResult.data);

    return successResponse(result, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/products
 * Creates a new private product for the authenticated user
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
      throw new ValidationError("Invalid JSON in request body");
    }

    const validationResult = createProductSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError("Invalid request body", validationResult.error.flatten().fieldErrors);
    }

    // Call service
    const productService = new ProductService(supabase);
    const product = await productService.createProduct(userId, validationResult.data);

    // Return 201 Created with Location header
    const location = `/api/products/${product.id}`;

    return successResponse(product, 201, { Location: location });
  } catch (error) {
    return handleError(error);
  }
}
