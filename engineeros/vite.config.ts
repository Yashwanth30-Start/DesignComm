import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// EngineerOS — local-first PWA. Everything (including the SQLite WASM engine)
// is precached so the app boots with zero network.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      manifest: {
        name: "EngineerOS",
        short_name: "EngineerOS",
        description:
          "Local-first second brain, daily manager, mentor and learning platform for construction engineering.",
        theme_color: "#05070A",
        background_color: "#05070A",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any"
          },
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,wasm,woff2}"],
        // sql-wasm.wasm is ~1.2 MB; keep headroom.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: "/index.html"
      }
    })
  ],
  build: {
    target: "es2020"
  }
});
