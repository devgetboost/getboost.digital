import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

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

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
