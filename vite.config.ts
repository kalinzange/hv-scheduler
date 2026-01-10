import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/hv-scheduler/",
  build: {
    outDir: "docs",
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
});
