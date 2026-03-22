// vite.config.ts
import { defineConfig } from "file:///C:/Users/DELL/Downloads/engagematic/spark-linkedin-ai-main/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/DELL/Downloads/engagematic/spark-linkedin-ai-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///C:/Users/DELL/Downloads/engagematic/spark-linkedin-ai-main/node_modules/lovable-tagger/dist/index.js";
import { compression } from "file:///C:/Users/DELL/Downloads/engagematic/spark-linkedin-ai-main/node_modules/vite-plugin-compression2/dist/index.mjs";
var __vite_injected_original_dirname = "C:\\Users\\DELL\\Downloads\\engagematic\\spark-linkedin-ai-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true
      // Show errors in browser so blank page is debuggable
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Generate gzip compressed assets at build time
    compression({
      algorithm: "gzip",
      threshold: 1024,
      // Only compress files > 1KB
      deleteOriginalAssets: false
    }),
    // Generate brotli compressed assets at build time (smaller than gzip)
    compression({
      algorithm: "brotliCompress",
      threshold: 1024,
      deleteOriginalAssets: false
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    target: "esnext",
    minify: "terser",
    cssMinify: true,
    sourcemap: false,
    // Disable sourcemaps in production for smaller bundles
    rollupOptions: {
      output: {
        // SAFE chunking strategy: Only split truly independent vendor libraries.
        // Do NOT split @radix-ui or React ecosystem — they must share the same React instance.
        manualChunks(id) {
          if (id.includes("node_modules/framer-motion")) {
            return "vendor-framer-motion";
          }
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          if (id.includes("node_modules/date-fns")) {
            return "vendor-date-fns";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]"
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        // Additional safe compression options
        pure_getters: true,
        unsafe_math: true
      },
      mangle: {
        safari10: true
        // Fix Safari 10 issues
      }
    },
    chunkSizeWarningLimit: 600,
    // Enable CSS code splitting for better caching
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-select",
      "@radix-ui/react-toast"
    ]
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERUxMXFxcXERvd25sb2Fkc1xcXFxlbmdhZ2VtYXRpY1xcXFxzcGFyay1saW5rZWRpbi1haS1tYWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERUxMXFxcXERvd25sb2Fkc1xcXFxlbmdhZ2VtYXRpY1xcXFxzcGFyay1saW5rZWRpbi1haS1tYWluXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ERUxML0Rvd25sb2Fkcy9lbmdhZ2VtYXRpYy9zcGFyay1saW5rZWRpbi1haS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IGNvbXByZXNzaW9uIH0gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uMlwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgICBobXI6IHtcclxuICAgICAgb3ZlcmxheTogdHJ1ZSwgLy8gU2hvdyBlcnJvcnMgaW4gYnJvd3NlciBzbyBibGFuayBwYWdlIGlzIGRlYnVnZ2FibGVcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgLy8gR2VuZXJhdGUgZ3ppcCBjb21wcmVzc2VkIGFzc2V0cyBhdCBidWlsZCB0aW1lXHJcbiAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgIGFsZ29yaXRobTogXCJnemlwXCIsXHJcbiAgICAgIHRocmVzaG9sZDogMTAyNCwgLy8gT25seSBjb21wcmVzcyBmaWxlcyA+IDFLQlxyXG4gICAgICBkZWxldGVPcmlnaW5hbEFzc2V0czogZmFsc2UsXHJcbiAgICB9KSxcclxuICAgIC8vIEdlbmVyYXRlIGJyb3RsaSBjb21wcmVzc2VkIGFzc2V0cyBhdCBidWlsZCB0aW1lIChzbWFsbGVyIHRoYW4gZ3ppcClcclxuICAgIGNvbXByZXNzaW9uKHtcclxuICAgICAgYWxnb3JpdGhtOiBcImJyb3RsaUNvbXByZXNzXCIsXHJcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcclxuICAgICAgZGVsZXRlT3JpZ2luYWxBc3NldHM6IGZhbHNlLFxyXG4gICAgfSksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHRhcmdldDogXCJlc25leHRcIixcclxuICAgIG1pbmlmeTogXCJ0ZXJzZXJcIixcclxuICAgIGNzc01pbmlmeTogdHJ1ZSxcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlbWFwcyBpbiBwcm9kdWN0aW9uIGZvciBzbWFsbGVyIGJ1bmRsZXNcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgLy8gU0FGRSBjaHVua2luZyBzdHJhdGVneTogT25seSBzcGxpdCB0cnVseSBpbmRlcGVuZGVudCB2ZW5kb3IgbGlicmFyaWVzLlxyXG4gICAgICAgIC8vIERvIE5PVCBzcGxpdCBAcmFkaXgtdWkgb3IgUmVhY3QgZWNvc3lzdGVtIFx1MjAxNCB0aGV5IG11c3Qgc2hhcmUgdGhlIHNhbWUgUmVhY3QgaW5zdGFuY2UuXHJcbiAgICAgICAgbWFudWFsQ2h1bmtzKGlkKSB7XHJcbiAgICAgICAgICAvLyBTcGxpdCBsYXJnZSwgaW5kZXBlbmRlbnQgdmVuZG9yIGxpYnJhcmllcyBpbnRvIHNlcGFyYXRlIGNodW5rc1xyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzL2ZyYW1lci1tb3Rpb25cIikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLWZyYW1lci1tb3Rpb25cIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlcy9yZWNoYXJ0c1wiKSB8fCBpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlcy9kMy1cIikpIHtcclxuICAgICAgICAgICAgcmV0dXJuIFwidmVuZG9yLWNoYXJ0c1wiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGlkLmluY2x1ZGVzKFwibm9kZV9tb2R1bGVzL2RhdGUtZm5zXCIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1kYXRlLWZuc1wiO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gTGV0IGV2ZXJ5dGhpbmcgZWxzZSAoUmVhY3QsIFJhZGl4LCByb3V0ZXIsIGV0Yy4pIHN0YXkgaW4gdGhlIGRlZmF1bHQgY2h1bmtcclxuICAgICAgICAgIC8vIHRvIGF2b2lkIHRoZSBcImZvcndhcmRSZWYgdW5kZWZpbmVkXCIgUmVhY3Qgc2luZ2xldG9uIGlzc3VlXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiLFxyXG4gICAgICAgIGFzc2V0RmlsZU5hbWVzOiBcImFzc2V0cy9bbmFtZV0tW2hhc2hdW2V4dG5hbWVdXCIsXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgdGVyc2VyT3B0aW9uczoge1xyXG4gICAgICBjb21wcmVzczoge1xyXG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSxcclxuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxyXG4gICAgICAgIHBhc3NlczogMixcclxuICAgICAgICAvLyBBZGRpdGlvbmFsIHNhZmUgY29tcHJlc3Npb24gb3B0aW9uc1xyXG4gICAgICAgIHB1cmVfZ2V0dGVyczogdHJ1ZSxcclxuICAgICAgICB1bnNhZmVfbWF0aDogdHJ1ZSxcclxuICAgICAgfSxcclxuICAgICAgbWFuZ2xlOiB7XHJcbiAgICAgICAgc2FmYXJpMTA6IHRydWUsIC8vIEZpeCBTYWZhcmkgMTAgaXNzdWVzXHJcbiAgICAgIH0sXHJcbiAgICB9LFxyXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXHJcbiAgICAvLyBFbmFibGUgQ1NTIGNvZGUgc3BsaXR0aW5nIGZvciBiZXR0ZXIgY2FjaGluZ1xyXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLFxyXG4gIH0sXHJcbiAgb3B0aW1pemVEZXBzOiB7XHJcbiAgICBpbmNsdWRlOiBbXHJcbiAgICAgIFwicmVhY3RcIixcclxuICAgICAgXCJyZWFjdC1kb21cIixcclxuICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCIsXHJcbiAgICAgIFwibHVjaWRlLXJlYWN0XCIsXHJcbiAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZ1wiLFxyXG4gICAgICBcIkByYWRpeC11aS9yZWFjdC1zZWxlY3RcIixcclxuICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9hc3RcIixcclxuICAgIF0sXHJcbiAgfSxcclxufSkpO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRXLFNBQVMsb0JBQW9CO0FBQ3pZLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsU0FBUyxtQkFBbUI7QUFKNUIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUE7QUFBQSxJQUNYO0FBQUEsRUFDRjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUE7QUFBQSxJQUUxQyxZQUFZO0FBQUEsTUFDVixXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUE7QUFBQSxNQUNYLHNCQUFzQjtBQUFBLElBQ3hCLENBQUM7QUFBQTtBQUFBLElBRUQsWUFBWTtBQUFBLE1BQ1YsV0FBVztBQUFBLE1BQ1gsV0FBVztBQUFBLE1BQ1gsc0JBQXNCO0FBQUEsSUFDeEIsQ0FBQztBQUFBLEVBQ0gsRUFBRSxPQUFPLE9BQU87QUFBQSxFQUNoQixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDTCxRQUFRO0FBQUEsSUFDUixRQUFRO0FBQUEsSUFDUixXQUFXO0FBQUEsSUFDWCxXQUFXO0FBQUE7QUFBQSxJQUNYLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQTtBQUFBO0FBQUEsUUFHTixhQUFhLElBQUk7QUFFZixjQUFJLEdBQUcsU0FBUyw0QkFBNEIsR0FBRztBQUM3QyxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxjQUFJLEdBQUcsU0FBUyx1QkFBdUIsS0FBSyxHQUFHLFNBQVMsa0JBQWtCLEdBQUc7QUFDM0UsbUJBQU87QUFBQSxVQUNUO0FBQ0EsY0FBSSxHQUFHLFNBQVMsdUJBQXVCLEdBQUc7QUFDeEMsbUJBQU87QUFBQSxVQUNUO0FBQUEsUUFHRjtBQUFBLFFBQ0EsZ0JBQWdCO0FBQUEsUUFDaEIsZ0JBQWdCO0FBQUEsTUFDbEI7QUFBQSxJQUNGO0FBQUEsSUFDQSxlQUFlO0FBQUEsTUFDYixVQUFVO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxlQUFlO0FBQUEsUUFDZixRQUFRO0FBQUE7QUFBQSxRQUVSLGNBQWM7QUFBQSxRQUNkLGFBQWE7QUFBQSxNQUNmO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixVQUFVO0FBQUE7QUFBQSxNQUNaO0FBQUEsSUFDRjtBQUFBLElBQ0EsdUJBQXVCO0FBQUE7QUFBQSxJQUV2QixjQUFjO0FBQUEsRUFDaEI7QUFBQSxFQUNBLGNBQWM7QUFBQSxJQUNaLFNBQVM7QUFBQSxNQUNQO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFDRixFQUFFOyIsCiAgIm5hbWVzIjogW10KfQo=
