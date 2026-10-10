import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (relPath: string) => readFileSync(join(root, relPath), "utf-8");

/** Deep links that must render the SPA on direct navigation (Wave 2A.1 matrix). */
const REQUIRED_DEEP_LINKS = [
  "/",
  "/solucoes",
  "/agentes-ia",
  "/blog",
  "/portfolio",
  "/resources",
  "/br",
  "/en",
];

/**
 * Wave 2A.1 — SPA deep-link fallback.
 *
 * Production/staging deploy on Hostinger (Apache/LiteSpeed) per
 * docs/environment.md, so the primary mechanism is public/.htaccess; the
 * portable public/404.html bootstrap covers hosts/contexts where the rewrite
 * cannot run. These guards fail if either layer — or the main.tsx restore that
 * makes the bootstrap work end-to-end — regresses.
 */
describe("Wave 2A.1 — SPA deep-link fallback", () => {
  it("ships the Apache/LiteSpeed rewrite for the detected host", () => {
    expect(existsSync(join(root, "public/.htaccess"))).toBe(true);

    const htaccess = read("public/.htaccess");
    expect(htaccess).toContain("RewriteEngine On");
    // Real files/directories must be served untouched (hashed assets, sitemaps,
    // robots.txt) — otherwise the rewrite shadows the build output.
    expect(htaccess).toMatch(/%\{REQUEST_FILENAME\}\s+-f/);
    expect(htaccess).toMatch(/%\{REQUEST_FILENAME\}\s+-d/);
    // Unknown paths fall through to the SPA shell.
    expect(htaccess).toMatch(/RewriteRule\s+\^\s+index\.html/);
    // Bootstrap fallback when mod_rewrite is unavailable.
    expect(htaccess).toContain("ErrorDocument 404 /404.html");
  });

  it("ships a portable 404 bootstrap that preserves the requested route", () => {
    expect(existsSync(join(root, "public/404.html"))).toBe(true);

    const bootstrap = read("public/404.html");
    expect(bootstrap).toMatch(/sessionStorage\.setItem\(\s*["']spa:redirect["']/);
    expect(bootstrap).toMatch(/location\.pathname\s*\+\s*[\w.]*location\.search\s*\+\s*[\w.]*location\.hash/);
    expect(bootstrap).toMatch(/location\.replace\(\s*["']\/["']\s*\)/);
    // The redirect hop must never be indexed or shared as a 404 page.
    expect(bootstrap).toMatch(/name=["']robots["']\s+content=["'][^"']*noindex/);
  });

  it("restores the captured route before React mounts", () => {
    const main = read("src/main.tsx");
    // The key lives in a named constant shared by every call site.
    expect(main).toMatch(/const SPA_REDIRECT_KEY = "spa:redirect"/);
    expect(main).toMatch(/sessionStorage\.getItem\(SPA_REDIRECT_KEY\)/);
    expect(main).toMatch(/sessionStorage\.removeItem\(SPA_REDIRECT_KEY\)/);
    expect(main).toMatch(/history\.replaceState/);
    // The restore must run before the render call — the router reads location
    // once at mount, so a later restore would render the wrong route.
    expect(main.indexOf("replaceState")).toBeLessThan(main.indexOf("createRoot(document.getElementById"));
    // The bootstrap and the app must agree on the sessionStorage key.
    expect(bootstrapKeyMatches("public/404.html", main)).toBe(true);
  });

  it("builds with root-absolute assets so host rewrites resolve them", () => {
    const vite = read("vite.config.ts");
    // No `base` override => Vite's default "/" — required by the rewrite rule
    // and by the 404 bootstrap redirecting to the root.
    expect(vite).not.toMatch(/\bbase\s*:/);
  });

  it.each(REQUIRED_DEEP_LINKS)(
    "%s resolves to a route the SPA can render on direct navigation",
    (deepLink) => {
      const app = read("src/App.tsx");
      const literalRoutes = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);

      if (deepLink === "/") {
        expect(literalRoutes).toContain("/");
        return;
      }
      if (deepLink === "/br" || deepLink === "/en") {
        // Market-prefixed entries render through the /:lang wrapper.
        expect(literalRoutes).toContain("/:lang");
        return;
      }
      expect(literalRoutes).toContain(deepLink);
    },
  );
});

/** The bootstrap and the app must agree on the sessionStorage key. */
function bootstrapKeyMatches(bootstrapPath: string, mainSource: string): boolean {
  const m = mainSource.match(/const SPA_REDIRECT_KEY = "([^"]+)"/);
  if (!m) return false;
  return read(bootstrapPath).includes(`sessionStorage.setItem("${m[1]}"`);
}
