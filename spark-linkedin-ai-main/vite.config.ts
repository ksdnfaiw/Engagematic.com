import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { compression } from "vite-plugin-compression2";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true, // Show errors in browser so blank page is debuggable
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Generate gzip compressed assets at build time
    compression({
      algorithm: "gzip",
      threshold: 1024, // Only compress files > 1KB
      deleteOriginalAssets: false,
    }),
    // Generate brotli compressed assets at build time (smaller than gzip)
    compression({
      algorithm: "brotliCompress",
      threshold: 1024,
      deleteOriginalAssets: false,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "terser",
    cssMinify: true,
    sourcemap: false, // Disable sourcemaps in production for smaller bundles
    rollupOptions: {
      output: {
        // SAFE chunking strategy: Only split truly independent vendor libraries.
        // Do NOT split @radix-ui or React ecosystem — they must share the same React instance.
        manualChunks(id) {
          // Split large, independent vendor libraries into separate chunks
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer-motion";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/date-fns")) {
            return "vendor-date-fns";
          }
          // Let everything else (React, Radix, router, etc.) stay in the default chunk
          // to avoid the "forwardRef undefined" React singleton issue
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        // Additional safe compression options
        pure_getters: true,
        unsafe_math: true,
      },
      mangle: {
        safari10: true, // Fix Safari 10 issues
      },
    },
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting for better caching
    cssCodeSplit: true,
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-toast",
    ],
  },
}));
