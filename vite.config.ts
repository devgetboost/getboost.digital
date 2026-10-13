import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 3080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // R20.11 — vendor chunking. The critical path is dominated by long-lived
    // dependencies (motion, react, supabase, ui primitives). Splitting them
    // out of the entry chunk buys two real wins with no UX change: browsers
    // download them in parallel with the app code, and they keep their cache
    // across deploys instead of invalidating on every first-party edit.
    // Measured with scripts/audit-critical-path.mjs before and after.
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          const rest = id.split("node_modules/").pop() ?? "";
          const parts = rest.split("/");
          const pkg = parts[0];
          if (pkg.startsWith("@")) return `vendor-${pkg.slice(1)}-${parts[1]}`;
          if (["framer-motion", "motion-dom", "motion-utils"].includes(pkg)) return "vendor-motion";
          if (["react", "react-dom", "react-router", "react-router-dom", "scheduler"].includes(pkg)) {
            return "vendor-react";
          }
          if (["i18next", "react-i18next", "html-parse-stringify"].includes(pkg)) return "vendor-i18n";
          if (["sonner", "clsx", "tailwind-merge", "class-variance-authority", "lucide-react"].includes(pkg)) {
            return "vendor-ui";
          }
          // No catch-all on purpose: forcing every remaining dependency into
          // one chunk would make a single lazy route (a chart page, a tool)
          // download the union of all of them. Anything unlisted stays with
          // its importer, which keeps per-route payloads honest.
          return undefined;
        },
      },
    },
    // The entry is large by design (homepage + shared UI). Above the default
    // 500 kB warning so real regressions stay visible without noise.
    chunkSizeWarningLimit: 700,
  },
}));
