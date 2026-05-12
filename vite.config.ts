import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },
      // Proxy sitemap/robots/GSC verification files to backend in dev
      "^/sitemap.*\\.xml": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/robots.txt": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "^/google.+\\.html": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
