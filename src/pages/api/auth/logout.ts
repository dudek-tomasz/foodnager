/**
 * POST /api/auth/logout
 * 
 * Endpoint for user logout.
 * Following auth-spec.md specifications:
 * - Uses authService for business logic
 * - Clears session cookies via Supabase SSR
 * - Proper error handling
 * - Returns 200 on success (no user data in response)
 */

import type { APIRoute } from 'astro';
import { authService } from '@/lib/services/auth.service';
import { isAuthError } from '@/lib/errors/auth.error';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create auth context
    const authContext = {
      cookies,
      headers: request.headers,
    };

    // Logout using authService (clears session and cookies)
    await authService.logout(authContext);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: 'Wylogowano pomyślnie',
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    // Handle AuthError
    if (isAuthError(error)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: error.message,
            code: error.code,
          },
        }),
        {
          status: error.statusCode,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Handle unexpected errors
    console.error('Logout error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Wystąpił błąd podczas wylogowania',
          code: 'INTERNAL_ERROR',
        },
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

