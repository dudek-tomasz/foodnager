/**
 * GET /api/auth/test
 * 
 * Simple test endpoint to verify auth integration is working
 * Returns current user info and session status
 */

import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  const session = locals.session;

  return new Response(
    JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      auth_status: {
        is_authenticated: !!user,
        user: user
          ? {
              id: user.id,
              email: user.email,
            }
          : null,
        session: session
          ? {
              expires_at: session.expires_at,
              expires_in: session.expires_in,
            }
          : null,
      },
      middleware_status: 'OK',
      message: user
        ? `✅ Authenticated as ${user.email}`
        : '❌ Not authenticated - please login at /login',
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};

