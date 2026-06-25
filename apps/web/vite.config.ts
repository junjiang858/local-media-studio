import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const crossOriginIsolationHeaders = {
  "Cross-Origin-Embedder-Policy": "require-corp",
  "Cross-Origin-Opener-Policy": "same-origin",
};

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 1200,
  },
  optimizeDeps: {
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
  },
  plugins: [react(), tailwindcss()],
  preview: {
    headers: crossOriginIsolationHeaders,
  },
  resolve: {
    alias: {
      "@obscura/shared": path.resolve(__dirname, "../../packages/shared/src"),
      "@obscura/media-core": path.resolve(__dirname, "../../packages/media-core/src"),
    },
  },
  server: {
    headers: crossOriginIsolationHeaders,
  },
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.{test,spec}.{ts,tsx}", "test/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
