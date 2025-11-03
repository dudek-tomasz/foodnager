/**
 * POST /api/auth/login
 * 
 * Endpoint for user login with email and password.
 * Following auth-spec.md specifications:
 * - Server-side validation using Zod
 * - Uses authService for business logic
 * - Proper error handling and status codes
 * - Sets session cookies via Supabase SSR
 * 
 * MVP: Email verification is optional - user can login without verification
 */

import type { APIRoute } from 'astro';
import { authService } from '@/lib/services/auth.service';
import { loginSchema } from '@/lib/validations/auth.validation';
import { isAuthError } from '@/lib/errors/auth.error';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Server-side validation using Zod
    const validationResult = loginSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: 'Nieprawidłowe dane wejściowe',
            code: 'VALIDATION_ERROR',
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt login using authService
    const authContext = {
      cookies,
      headers: request.headers,
    };

    const { user, session } = await authService.login(email, password, authContext);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
          },
          session: {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at,
          },
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
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: 'Wystąpił błąd podczas logowania. Spróbuj ponownie.',
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

