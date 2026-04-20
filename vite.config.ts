import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Env vars with these prefixes are inlined into the client bundle (public).
  // Server-only secrets must use different names (e.g. ADMIN_*, FN_*, SA_*)
  // or live only in functions/.env — never add a broad prefix like "API_".
  envPrefix: ["FIREBASE_", "GOOGLE_", "APP_", "CLOUD_FUNCTION_"],
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
