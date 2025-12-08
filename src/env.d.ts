/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Session } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      /**
       * Supabase client instance (legacy)
       * @deprecated Use createSupabaseServerInstance instead
       */
      supabase?: SupabaseClient<Database>;

      /**
       * Current authenticated user
       * Available after middleware processes the request
       */
      user: {
        id: string;
        email: string;
      } | null;

      /**
       * Current session
       * Available after middleware processes the request
       */
      session: Session | null;
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
  readonly OPENROUTER_TEMPERATURE?: string;
  readonly OPENROUTER_MAX_TOKENS?: string;
  readonly OPENROUTER_TOP_P?: string;
  readonly OPENROUTER_FREQUENCY_PENALTY?: string;
  readonly OPENROUTER_PRESENCE_PENALTY?: string;

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
