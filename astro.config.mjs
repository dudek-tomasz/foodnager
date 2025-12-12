// @ts-check
/* global URL */
import { defineConfig, envField } from "astro/config";
import { fileURLToPath } from "url";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  env: {
    schema: {
      // Supabase
      SUPABASE_URL: envField.string({ context: "server", access: "secret" }),
      SUPABASE_KEY: envField.string({ context: "server", access: "secret" }),
      
      // OpenRouter (AI)
      OPENROUTER_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      OPENROUTER_API_URL: envField.string({ context: "server", access: "secret", optional: true, default: "https://openrouter.ai/api/v1/chat/completions" }),
      OPENROUTER_MODEL: envField.string({ context: "server", access: "secret", optional: true, default: "anthropic/claude-3-haiku" }),
      TIER3_TIMEOUT_MS: envField.number({ context: "server", access: "secret", optional: true, default: 30000 }),
      
      // External Recipe API (optional)
      EXTERNAL_RECIPE_API_KEY: envField.string({ context: "server", access: "secret", optional: true }),
      EXTERNAL_RECIPE_API_URL: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      hmr: {
        timeout: 120000, // zwiększ timeout HMR do 2 minut
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom"],
      exclude: ["tw-animate-css", "msw", "@mswjs/interceptors"],
    },
    ssr: {
      external: ["node:buffer", "node:crypto"],
    },
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
    runtime: {
      mode: "local",
      type: "pages",
    },
  }),
});
