// @ts-check
/* global URL */
import { defineConfig } from "astro/config";
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
  },
  adapter: cloudflare({
    mode: "directory",
    platformProxy: {
      enabled: true,
    },
  }),
});
