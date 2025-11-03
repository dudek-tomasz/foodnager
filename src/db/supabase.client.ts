/**
 * Supabase Client Configuration
 * 
 * This file provides two types of clients:
 * 1. Server client with SSR support (@supabase/ssr) - for auth and protected routes
 * 2. Browser client (@supabase/supabase-js) - for client-side operations
 * 
 * IMPORTANT: Use createSupabaseServerInstance for auth-related operations
 */

import type { AstroCookies } from 'astro';
import { createServerClient, type CookieOptionsWithName } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// ============================================================================
// Server-side Client with SSR Support (for Auth)
// ============================================================================

/**
 * Cookie options for Supabase auth
 * Following security best practices from auth-spec.md
 */
export const cookieOptions: CookieOptionsWithName = {
  path: '/',
  secure: import.meta.env.PROD, // HTTPS only in production
  httpOnly: true,
  sameSite: 'lax',
};

/**
 * Parse Cookie header into array of name-value pairs
 */
function parseCookieHeader(cookieHeader: string): { name: string; value: string }[] {
  return cookieHeader.split(';').map((cookie) => {
    const [name, ...rest] = cookie.trim().split('=');
    return { name, value: rest.join('=') };
  });
}

/**
 * Create Supabase server instance with SSR support
 * USE THIS for all auth-related operations and protected routes
 * 
 * @param context - Object containing Astro cookies and request headers
 * @returns Supabase client with proper cookie management
 */
export const createSupabaseServerInstance = (context: {
  headers: Headers;
  cookies: AstroCookies;
}) => {
  const supabase = createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return parseCookieHeader(context.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  return supabase;
};

// ============================================================================
// Browser Client (Legacy - for non-auth operations)
// ============================================================================

/**
 * Legacy browser client
 * @deprecated Use createSupabaseServerInstance for auth operations
 * Only use for public data fetching
 */
export const supabaseClient = createSupabaseClient<Database>(
  supabaseUrl, 
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export type SupabaseClient = typeof supabaseClient;

/**
 * @deprecated Will be removed after full auth migration
 * Use auth.uid() in RLS policies instead
 */
export const DEFAULT_USER_ID = "0bdb5b8e-a145-4d13-9f5c-921c5b8d0db9";