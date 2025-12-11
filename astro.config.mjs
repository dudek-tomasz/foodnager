// @ts-check
/* global URL */
import { defineConfig } from "astro/config";
import { fileURLToPath } from "url";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        "react-dom/server": "react-dom/server.edge",
      },
    },
    ssr: {
      noExternal: ["react-dom/server.edge"], // Nie próbuj używać zwykłego Node.js server
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
    // mode: "directory",
    mode: "server", // <- wymusza nodejs_compat
    nodejs_compat: true, // masz to już włączone
    platformProxy: {
      enabled: true,
    },
    alias: {
      "react-dom/server": "react-dom/server.edge",
    },
  }),
});
