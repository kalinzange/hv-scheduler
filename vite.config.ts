import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Use root base in dev so assets load at localhost; keep GH Pages base for production builds
  base: mode === "production" ? "/hv-scheduler/" : "/",
  build: {
    outDir: "docs",
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
}));
