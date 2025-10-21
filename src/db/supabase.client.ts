import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { APIContext } from 'astro';

import type { Database } from '../db/database.types.ts';

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

export type SupabaseClient = typeof supabaseClient;

export const DEFAULT_USER_ID = "0bdb5b8e-a145-4d13-9f5c-921c5b8d0db9";

/**
 * Create authenticated Supabase client from Astro context
 */
export function createClient(context: APIContext) {
  const authHeader = context.request.headers.get('Authorization');
  
  if (!authHeader) {
    return supabaseClient;
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}