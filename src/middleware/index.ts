/**
 * Authentication Middleware
 * 
 * Handles session management, user authentication, and route protection.
 * Following auth-spec.md and supabase-auth.mdc best practices:
 * - Uses @supabase/ssr for proper SSR support
 * - Checks user session on every request
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users away from auth pages
 * - Populates Astro.locals with user and session data
 */

import { defineMiddleware } from 'astro:middleware';
import { createSupabaseServerInstance } from '../db/supabase.client.ts';

// ============================================================================
// Route Configuration
// ============================================================================

/**
 * Public paths that don't require authentication
 * Includes auth pages and API endpoints
 */
const PUBLIC_PATHS = [
  // Auth pages (server-rendered)
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  
  // Auth API endpoints
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify',
  '/api/auth/session',
  '/api/auth/test', // Test endpoint
];

/**
 * Auth-only paths (redirect authenticated users away)
 * Users should not see these pages when logged in
 */
const AUTH_ONLY_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
];

// ============================================================================
// Middleware
// ============================================================================

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, request, redirect, locals } = context;
  const pathname = url.pathname;

  // Create Supabase server instance with proper cookie management
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // IMPORTANT: Always get user session first before any other operations
  // This ensures cookies are properly set/refreshed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get session for additional data
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Populate locals with user and session data
  if (user && session) {
    locals.user = {
      id: user.id,
      email: user.email!,
    };
    locals.session = session;
  } else {
    locals.user = null;
    locals.session = null;
  }

  // ============================================================================
  // Route Protection Logic
  // ============================================================================

  // If user is logged in and tries to access auth-only pages → redirect to /fridge
  if (user && AUTH_ONLY_PATHS.some(path => pathname.startsWith(path))) {
    return redirect('/fridge');
  }

  // If path is public → allow access
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return next();
  }

  // If path is protected and user not logged in → redirect to /login with return URL
  if (!user) {
    const redirectUrl = encodeURIComponent(pathname);
    return redirect(`/login?redirect=${redirectUrl}`);
  }

  // MVP: Email verification is OPTIONAL
  // User can access the app without verifying email
  // In future, can add:
  // if (user && !user.email_confirmed_at) {
  //   return redirect('/verify-email');
  // }

  // Continue to the requested page
  return next();
});

