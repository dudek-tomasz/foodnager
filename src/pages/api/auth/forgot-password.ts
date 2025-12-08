/**
 * POST /api/auth/forgot-password
 *
 * Endpoint for sending password reset email.
 * Following auth-spec.md specifications:
 * - Server-side validation using Zod
 * - Uses authService for business logic
 * - Always returns success (security best practice - don't reveal if email exists)
 * - Supabase sends email with reset link
 *
 * US-001.7: Password recovery functionality
 */

import type { APIRoute } from "astro";
import { authService } from "@/lib/services/auth.service";
import { forgotPasswordSchema } from "@/lib/validations/auth.validation";
import { isAuthError } from "@/lib/errors/auth.error";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Server-side validation using Zod
    const validationResult = forgotPasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          error: {
            message: "Nieprawidłowy format email",
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

    const { email } = validationResult.data;

    // Send password reset email using authService
    const authContext = {
      cookies,
      headers: request.headers,
    };

    await authService.forgotPassword(email, authContext);

    // Always return success (don't reveal if email exists - security)
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcje resetowania hasła.",
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    // Handle AuthError
    if (isAuthError(error)) {
      // Even for errors, return generic message (security)
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            message: "Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcje resetowania hasła.",
          },
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Handle unexpected errors
    console.error("Forgot password error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "Wystąpił błąd podczas wysyłania linku resetującego",
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
