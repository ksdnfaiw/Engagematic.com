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
    },
    proxy: {
      // Forward all /api/* requests to the Express backend
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
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
        // Do NOT split @radix-ui or React ecosystem - they must share the same React instance.
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERUxMXFxcXERvd25sb2Fkc1xcXFxlbmdhZ2VtYXRpY1xcXFxzcGFyay1saW5rZWRpbi1haS1tYWluXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxERUxMXFxcXERvd25sb2Fkc1xcXFxlbmdhZ2VtYXRpY1xcXFxzcGFyay1saW5rZWRpbi1haS1tYWluXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9ERUxML0Rvd25sb2Fkcy9lbmdhZ2VtYXRpYy9zcGFyay1saW5rZWRpbi1haS1tYWluL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuaW1wb3J0IHsgY29tcG9uZW50VGFnZ2VyIH0gZnJvbSBcImxvdmFibGUtdGFnZ2VyXCI7XHJcbmltcG9ydCB7IGNvbXByZXNzaW9uIH0gZnJvbSBcInZpdGUtcGx1Z2luLWNvbXByZXNzaW9uMlwiO1xyXG5cclxuLy8gaHR0cHM6Ly92aXRlanMuZGV2L2NvbmZpZy9cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4gKHtcclxuICBzZXJ2ZXI6IHtcclxuICAgIGhvc3Q6IFwiOjpcIixcclxuICAgIHBvcnQ6IDgwODAsXHJcbiAgICBobXI6IHtcclxuICAgICAgb3ZlcmxheTogdHJ1ZSwgLy8gU2hvdyBlcnJvcnMgaW4gYnJvd3NlciBzbyBibGFuayBwYWdlIGlzIGRlYnVnZ2FibGVcclxuICAgIH0sXHJcbiAgICBwcm94eToge1xyXG4gICAgICAvLyBGb3J3YXJkIGFsbCAvYXBpLyogcmVxdWVzdHMgdG8gdGhlIEV4cHJlc3MgYmFja2VuZFxyXG4gICAgICBcIi9hcGlcIjoge1xyXG4gICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjUwMDBcIixcclxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXHJcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbHVnaW5zOiBbXHJcbiAgICByZWFjdCgpLFxyXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxyXG4gICAgLy8gR2VuZXJhdGUgZ3ppcCBjb21wcmVzc2VkIGFzc2V0cyBhdCBidWlsZCB0aW1lXHJcbiAgICBjb21wcmVzc2lvbih7XHJcbiAgICAgIGFsZ29yaXRobTogXCJnemlwXCIsXHJcbiAgICAgIHRocmVzaG9sZDogMTAyNCwgLy8gT25seSBjb21wcmVzcyBmaWxlcyA+IDFLQlxyXG4gICAgICBkZWxldGVPcmlnaW5hbEFzc2V0czogZmFsc2UsXHJcbiAgICB9KSxcclxuICAgIC8vIEdlbmVyYXRlIGJyb3RsaSBjb21wcmVzc2VkIGFzc2V0cyBhdCBidWlsZCB0aW1lIChzbWFsbGVyIHRoYW4gZ3ppcClcclxuICAgIGNvbXByZXNzaW9uKHtcclxuICAgICAgYWxnb3JpdGhtOiBcImJyb3RsaUNvbXByZXNzXCIsXHJcbiAgICAgIHRocmVzaG9sZDogMTAyNCxcclxuICAgICAgZGVsZXRlT3JpZ2luYWxBc3NldHM6IGZhbHNlLFxyXG4gICAgfSksXHJcbiAgXS5maWx0ZXIoQm9vbGVhbiksXHJcbiAgcmVzb2x2ZToge1xyXG4gICAgYWxpYXM6IHtcclxuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXHJcbiAgICB9LFxyXG4gIH0sXHJcbiAgYnVpbGQ6IHtcclxuICAgIHRhcmdldDogXCJlc25leHRcIixcclxuICAgIG1pbmlmeTogXCJ0ZXJzZXJcIixcclxuICAgIGNzc01pbmlmeTogdHJ1ZSxcclxuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERpc2FibGUgc291cmNlbWFwcyBpbiBwcm9kdWN0aW9uIGZvciBzbWFsbGVyIGJ1bmRsZXNcclxuICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgb3V0cHV0OiB7XHJcbiAgICAgICAgLy8gU0FGRSBjaHVua2luZyBzdHJhdGVneTogT25seSBzcGxpdCB0cnVseSBpbmRlcGVuZGVudCB2ZW5kb3IgbGlicmFyaWVzLlxyXG4gICAgICAgIC8vIERvIE5PVCBzcGxpdCBAcmFkaXgtdWkgb3IgUmVhY3QgZWNvc3lzdGVtIC0gdGhleSBtdXN0IHNoYXJlIHRoZSBzYW1lIFJlYWN0IGluc3RhbmNlLlxyXG4gICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xyXG4gICAgICAgICAgLy8gU3BsaXQgbGFyZ2UsIGluZGVwZW5kZW50IHZlbmRvciBsaWJyYXJpZXMgaW50byBzZXBhcmF0ZSBjaHVua3NcclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlcy9mcmFtZXItbW90aW9uXCIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1mcmFtZXItbW90aW9uXCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXMvcmVjaGFydHNcIikgfHwgaWQuaW5jbHVkZXMoXCJub2RlX21vZHVsZXMvZDMtXCIpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBcInZlbmRvci1jaGFydHNcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmIChpZC5pbmNsdWRlcyhcIm5vZGVfbW9kdWxlcy9kYXRlLWZuc1wiKSkge1xyXG4gICAgICAgICAgICByZXR1cm4gXCJ2ZW5kb3ItZGF0ZS1mbnNcIjtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIExldCBldmVyeXRoaW5nIGVsc2UgKFJlYWN0LCBSYWRpeCwgcm91dGVyLCBldGMuKSBzdGF5IGluIHRoZSBkZWZhdWx0IGNodW5rXHJcbiAgICAgICAgICAvLyB0byBhdm9pZCB0aGUgXCJmb3J3YXJkUmVmIHVuZGVmaW5lZFwiIFJlYWN0IHNpbmdsZXRvbiBpc3N1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2h1bmtGaWxlTmFtZXM6IFwiYXNzZXRzL1tuYW1lXS1baGFzaF0uanNcIixcclxuICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXVtleHRuYW1lXVwiLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIHRlcnNlck9wdGlvbnM6IHtcclxuICAgICAgY29tcHJlc3M6IHtcclxuICAgICAgICBkcm9wX2NvbnNvbGU6IHRydWUsXHJcbiAgICAgICAgZHJvcF9kZWJ1Z2dlcjogdHJ1ZSxcclxuICAgICAgICBwYXNzZXM6IDIsXHJcbiAgICAgICAgLy8gQWRkaXRpb25hbCBzYWZlIGNvbXByZXNzaW9uIG9wdGlvbnNcclxuICAgICAgICBwdXJlX2dldHRlcnM6IHRydWUsXHJcbiAgICAgICAgdW5zYWZlX21hdGg6IHRydWUsXHJcbiAgICAgIH0sXHJcbiAgICAgIG1hbmdsZToge1xyXG4gICAgICAgIHNhZmFyaTEwOiB0cnVlLCAvLyBGaXggU2FmYXJpIDEwIGlzc3Vlc1xyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogNjAwLFxyXG4gICAgLy8gRW5hYmxlIENTUyBjb2RlIHNwbGl0dGluZyBmb3IgYmV0dGVyIGNhY2hpbmdcclxuICAgIGNzc0NvZGVTcGxpdDogdHJ1ZSxcclxuICB9LFxyXG4gIG9wdGltaXplRGVwczoge1xyXG4gICAgaW5jbHVkZTogW1xyXG4gICAgICBcInJlYWN0XCIsXHJcbiAgICAgIFwicmVhY3QtZG9tXCIsXHJcbiAgICAgIFwicmVhY3Qtcm91dGVyLWRvbVwiLFxyXG4gICAgICBcImx1Y2lkZS1yZWFjdFwiLFxyXG4gICAgICBcIkByYWRpeC11aS9yZWFjdC1kaWFsb2dcIixcclxuICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXHJcbiAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXRvYXN0XCIsXHJcbiAgICBdLFxyXG4gIH0sXHJcbn0pKTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE0VyxTQUFTLG9CQUFvQjtBQUN6WSxPQUFPLFdBQVc7QUFDbEIsT0FBTyxVQUFVO0FBQ2pCLFNBQVMsdUJBQXVCO0FBQ2hDLFNBQVMsbUJBQW1CO0FBSjVCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxPQUFPO0FBQUEsRUFDekMsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sS0FBSztBQUFBLE1BQ0gsU0FBUztBQUFBO0FBQUEsSUFDWDtBQUFBLElBQ0EsT0FBTztBQUFBO0FBQUEsTUFFTCxRQUFRO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixTQUFTLGlCQUFpQixnQkFBZ0I7QUFBQTtBQUFBLElBRTFDLFlBQVk7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLFdBQVc7QUFBQTtBQUFBLE1BQ1gsc0JBQXNCO0FBQUEsSUFDeEIsQ0FBQztBQUFBO0FBQUEsSUFFRCxZQUFZO0FBQUEsTUFDVixXQUFXO0FBQUEsTUFDWCxXQUFXO0FBQUEsTUFDWCxzQkFBc0I7QUFBQSxJQUN4QixDQUFDO0FBQUEsRUFDSCxFQUFFLE9BQU8sT0FBTztBQUFBLEVBQ2hCLFNBQVM7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNMLEtBQUssS0FBSyxRQUFRLGtDQUFXLE9BQU87QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLFdBQVc7QUFBQSxJQUNYLFdBQVc7QUFBQTtBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBO0FBQUE7QUFBQSxRQUdOLGFBQWEsSUFBSTtBQUVmLGNBQUksR0FBRyxTQUFTLDRCQUE0QixHQUFHO0FBQzdDLG1CQUFPO0FBQUEsVUFDVDtBQUNBLGNBQUksR0FBRyxTQUFTLHVCQUF1QixLQUFLLEdBQUcsU0FBUyxrQkFBa0IsR0FBRztBQUMzRSxtQkFBTztBQUFBLFVBQ1Q7QUFDQSxjQUFJLEdBQUcsU0FBUyx1QkFBdUIsR0FBRztBQUN4QyxtQkFBTztBQUFBLFVBQ1Q7QUFBQSxRQUdGO0FBQUEsUUFDQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLGVBQWU7QUFBQSxRQUNmLFFBQVE7QUFBQTtBQUFBLFFBRVIsY0FBYztBQUFBLFFBQ2QsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLFVBQVU7QUFBQTtBQUFBLE1BQ1o7QUFBQSxJQUNGO0FBQUEsSUFDQSx1QkFBdUI7QUFBQTtBQUFBLElBRXZCLGNBQWM7QUFBQSxFQUNoQjtBQUFBLEVBQ0EsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLEVBQUU7IiwKICAibmFtZXMiOiBbXQp9Cg==
