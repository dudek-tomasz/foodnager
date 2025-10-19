/**
 * Products API Endpoint - Single Product Operations
 * 
 * GET /api/products/:id - Get product by ID
 * PATCH /api/products/:id - Update product (or fork if global)
 * DELETE /api/products/:id - Delete product
 */

import type { APIContext } from 'astro';
import { ProductService } from '../../../lib/services/products.service';
import {
  productIdParamSchema,
  updateProductSchema,
} from '../../../lib/validations/products.validation';
import {
  successResponse,
  noContentResponse,
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
 * Helper function to parse and validate product ID from URL params
 * @throws ValidationError if ID is invalid
 */
function parseProductId(context: APIContext): number {
  const idParam = context.params.id;
  
  const validationResult = productIdParamSchema.safeParse(idParam);

  if (!validationResult.success) {
    throw new ValidationError(
      'Invalid product ID',
      { id: validationResult.error.errors.map(e => e.message) }
    );
  }

  return validationResult.data;
}

/**
 * GET /api/products/:id
 * Retrieves a single product by ID
 * User can access global products or their own private products
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    // Authenticate user (TEMPORARY: using default user)
    const userId = getAuthenticatedUser(context);

    // Validate product ID
    const productId = parseProductId(context);

    // Call service
    const productService = new ProductService(context.locals.supabase);
    const product = await productService.getProductById(userId, productId);

    return successResponse(product, 200);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/products/:id
 * Updates a product or creates a fork if it's a global product
 * 
 * Behavior:
 * - Own private product: returns 200 OK with updated product
 * - Global product: returns 201 Created with new forked product + Location header
 * - Other user's product: returns 404 Not Found
 */
export async function PATCH(context: APIContext): Promise<Response> {
  try {
    // Authenticate user (TEMPORARY: using default user)
    const userId = getAuthenticatedUser(context);

    // Validate product ID
    const productId = parseProductId(context);

    // Parse and validate request body
    let body;
    try {
      body = await context.request.json();
    } catch {
      throw new ValidationError('Invalid JSON in request body');
    }

    const validationResult = updateProductSchema.safeParse(body);

    if (!validationResult.success) {
      throw new ValidationError(
        'Invalid request body',
        validationResult.error.flatten().fieldErrors
      );
    }

    // Call service
    const productService = new ProductService(context.locals.supabase);
    const result = await productService.updateProduct(
      userId,
      productId,
      validationResult.data
    );

    // Return different status based on whether it's a fork or update
    if (result.isNewProduct) {
      // Fork: return 201 Created with Location header
      const location = `/api/products/${result.product.id}`;
      return successResponse(result.product, 201, { Location: location });
    } else {
      // Update: return 200 OK
      return successResponse(result.product, 200);
    }
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/products/:id
 * Deletes a user's private product
 * Global products cannot be deleted (returns 403 Forbidden)
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    // Authenticate user (TEMPORARY: using default user)
    const userId = getAuthenticatedUser(context);

    // Validate product ID
    const productId = parseProductId(context);

    // Call service
    const productService = new ProductService(context.locals.supabase);
    await productService.deleteProduct(userId, productId);

    // Return 204 No Content on success
    return noContentResponse();
  } catch (error) {
    return handleError(error);
  }
}

