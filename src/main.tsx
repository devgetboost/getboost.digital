import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";
import "@/styles/design-system.css";

// Auto-reload once when a stale dynamic import chunk fails (post-deploy cache)
const RELOAD_KEY = "__chunk_reload__";
const isChunkError = (msg?: string) =>
  !!msg && /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError/i.test(msg);
const tryReload = () => {
  if (sessionStorage.getItem(RELOAD_KEY)) return;
  sessionStorage.setItem(RELOAD_KEY, "1");
  window.location.reload();
};
window.addEventListener("error", (e) => { if (isChunkError(e.message)) tryReload(); });
window.addEventListener("unhandledrejection", (e) => {
  const msg = (e.reason && (e.reason.message || String(e.reason))) || "";
  if (isChunkError(msg)) tryReload();
});

// Wave 2A.1: static hosts (Hostinger) serve public/404.html for unknown paths.
// That bootstrap stashes the requested route and redirects to the root, where
// the real entry assets live. Restore the route before the router mounts, so
// the first render is the page the visitor actually requested (/br/* and
// /en/* included). A sessionStorage failure must never block boot.
const SPA_REDIRECT_KEY = "spa:redirect";
try {
  const restoredRoute = sessionStorage.getItem(SPA_REDIRECT_KEY);
  if (restoredRoute) {
    sessionStorage.removeItem(SPA_REDIRECT_KEY);
    window.history.replaceState(window.history.state, "", restoredRoute);
  }
} catch {
  // Private mode / disabled storage: continue with the URL as served.
}

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
