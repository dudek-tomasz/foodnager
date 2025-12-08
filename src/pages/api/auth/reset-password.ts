/**
 * POST /api/auth/reset-password
 *
 * Endpoint for resetting user password using token from email.
 * Following auth-spec.md specifications:
 * - Server-side validation using Zod
 * - Uses authService for business logic
 * - Verifies token from email link
 * - Updates password in Supabase Auth
 *
 * US-001.7: Password recovery functionality
 */

import type { APIRoute } from "astro";
import { authService } from "@/lib/services/auth.service";
import { resetPasswordSchema } from "@/lib/validations/auth.validation";
import { isAuthError } from "@/lib/errors/auth.error";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse request body
    const body = await request.json();

    // Server-side validation using Zod
    const validationResult = resetPasswordSchema.safeParse(body);
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

    const { token, password } = validationResult.data;

    // Reset password using authService
    const authContext = {
      cookies,
      headers: request.headers,
    };

    await authService.resetPassword(token, password, authContext);

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          message: "Hasło zostało zmienione",
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
    console.error("Reset password error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: {
          message: "Wystąpił błąd podczas resetowania hasła",
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
