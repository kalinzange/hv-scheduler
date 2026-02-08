import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Use root base in dev so assets load at localhost; keep GH Pages base for production builds
  base: mode === "production" ? "/hv-scheduler/" : "/",
  build: {
    outDir: "docs",
    rollupOptions: {
      output: {
        manualChunks: {
          // Firebase bundle
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          // Lucide icons
          icons: ["lucide-react"],
          // Html2canvas (already lazy-loaded but split anyway)
          html2canvas: ["html2canvas"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
}));
