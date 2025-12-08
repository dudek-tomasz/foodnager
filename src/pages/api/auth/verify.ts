/**
 * GET /api/auth/verify
 *
 * Endpoint for email verification callback from Supabase.
 * This is called when user clicks verification link in email.
 *
 * Following auth-spec.md:
 * - MVP: Email verification is OPTIONAL - user can login without clicking
 * - This endpoint just confirms the email for user's record
 * - Redirects to /login with success message
 *
 * US-001.3: Email confirmation (optional for MVP)
 */

import type { APIRoute } from "astro";
import { authService } from "@/lib/services/auth.service";
import { isAuthError } from "@/lib/errors/auth.error";

export const prerender = false;

export const GET: APIRoute = async ({ url, request, cookies }) => {
  try {
    // Get token from URL query params
    // Supabase sends token in different formats
    const token = url.searchParams.get("token") || url.searchParams.get("token_hash");

    if (!token) {
      // No token provided - redirect to login with error
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login?error=invalid_verification_link",
        },
      });
    }

    // Verify email using authService
    const authContext = {
      cookies,
      headers: request.headers,
    };

    await authService.verifyEmail(token, authContext);

    // Success! Redirect to login with verified flag
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?verified=true",
      },
    });
  } catch (error) {
    // Handle AuthError
    if (isAuthError(error)) {
      console.error("Email verification error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/login?error=verification_failed",
        },
      });
    }

    // Handle unexpected errors
    console.error("Unexpected verification error:", error);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/login?error=verification_failed",
      },
    });
  }
};
