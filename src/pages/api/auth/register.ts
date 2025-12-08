/**
 * POST /api/auth/register
 *
 * Endpoint for user registration with email and password.
 * Following auth-spec.md specifications:
 * - Server-side validation using Zod
 * - Uses authService for business logic
 * - Sends verification email (optional for MVP - user can login without clicking)
 * - Proper error handling and status codes
 *
 * MVP: Email verification is OPTIONAL - user can login without verification
 */

import type { APIRoute } from "astro";
import { authService } from "@/lib/services/auth.service";
import { registerSchema } from "@/lib/validations/auth.validation";
import { isAuthError } from "@/lib/errors/auth.error";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Server-side validation using Zod
    const validationResult = registerSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Nieprawidłowe dane wejściowe",
            code: "VALIDATION_ERROR",
            details: validationResult.error.errors.map((err) => ({
              field: err.path.join("."),
              message: err.message,
            })),
          },
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Attempt registration using authService
    const authContext = {
      cookies,
      headers: request.headers,
    };

    const { user } = await authService.register(email, password, authContext);

    // Success response
    // MVP: User can login without email verification
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Konto utworzone! Możesz się teraz zalogować.",
          user: {
            id: user.id,
            email: user.email,
          },
          // Optional: mention email verification
          emailVerification: {
            required: false, // MVP: not required
            sent: true,
            message: "Sprawdź swoją skrzynkę email aby potwierdzić adres (opcjonalne).",
          },
        },
      }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
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
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle unexpected errors
    console.error("Registration error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
          code: "INTERNAL_ERROR",
        },
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};
