/// <reference types="astro/client" />

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './db/database.types.ts';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  
  // External Recipe API (Tier 2)
  readonly EXTERNAL_RECIPE_API_URL?: string;
  readonly EXTERNAL_RECIPE_API_KEY?: string;
  
  // OpenRouter AI Service (Tier 3)
  readonly OPENROUTER_API_URL?: string;
  readonly OPENROUTER_API_KEY?: string;
  readonly OPENROUTER_MODEL?: string;
  
  // Recipe Discovery Thresholds
  readonly RECIPE_MATCH_THRESHOLD?: string;
  readonly TIER1_TIMEOUT_MS?: string;
  readonly TIER2_TIMEOUT_MS?: string;
  readonly TIER3_TIMEOUT_MS?: string;
  
  // AI Rate Limiting
  readonly AI_RATE_LIMIT_PER_MINUTE?: string;
  readonly AI_RATE_LIMIT_PER_DAY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
