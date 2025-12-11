// @ts-check
/* global URL, process */
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// Warunkowa konfiguracja dla dev vs build (workaround dla React 19 + Cloudflare)
// W dev mode (NODE_ENV !== 'production') nie używamy aliasu react-dom/server
const isDevelopment = process.env.NODE_ENV !== "production";

export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        // W dev mode nie używamy aliasu (unikamy "require is not defined")
        // W build mode aliasujemy do .edge (unikamy "MessageChannel is not defined" na Cloudflare)
        ...(isDevelopment ? {} : { "react-dom/server": "react-dom/server.edge" }),
      },
    },
    // W build mode zapewniamy, że react-dom/server.edge jest inline bundlowane
    // zgodnie z wymaganiami Cloudflare Workers (wszystko musi być zbundlowane)
    ssr: isDevelopment
      ? undefined
      : {
          noExternal: true,
          external: [],
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
    platformProxy: {
      enabled: true,
    },
    sessionKVBindingName: "SESSION",
  }),
});
