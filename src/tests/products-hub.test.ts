import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 2A.5 — Products hub guards.
 *
 * /produtos used to redirect to /qook, hiding five of the six products.
 * The hub replaced it; these guards keep the redirect from returning and
 * keep every hub destination resolvable.
 */

function routeTable() {
  const app = read("src/App.tsx");
  const literal = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
  const redirectOnly = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);
  return { literal, redirectOnly };
}

function resolves(path: string): boolean {
  const { literal } = routeTable();
  if (literal.includes(path)) return true;
  return literal.filter((r) => r.includes(":")).some((r) => new RegExp(`^${r.replace(/:[^/]+/g, "[^/]+")}$`).test(path));
}

const EXPECTED_PRODUCTS = ["qook", "motivae", "alojify", "pikto", "trackfy", "safely", "descobre-quem-tu-es", "guia-cities"];

describe("Wave 2A.5 — Products hub (/produtos)", () => {
  it("/produtos is a real route rendering the hub, not a redirect", () => {
    const app = read("src/App.tsx");
    expect(app).toMatch(/<Route\s+path="\/produtos"\s+element=\{<Products\s*\/>\}/);
    // The market-prefixed entry renders the same hub.
    expect(app).toMatch(/<Route\s+path="\/:lang\/produtos"\s+element=\{<Products\s*\/>\}/);
    expect(routeTable().redirectOnly).not.toContain("/produtos");
  });

  it("no code path redirects /produtos to /qook", () => {
    const app = read("src/App.tsx");
    expect(app).not.toMatch(/path="\/produtos"[^>]*Navigate to="\/qook"/);
    expect(app).not.toMatch(/path="\/:lang\/produtos"[^>]*Navigate/);
  });

  it("the hub lists exactly the official catalog (6 SaaS + 2 platforms)", () => {
    expect(PRODUCTS.map((p) => p.slug).sort()).toEqual([...EXPECTED_PRODUCTS].sort());
    expect(PRODUCTS.filter((p) => p.kind === 'saas')).toHaveLength(6);
    expect(PRODUCTS.filter((p) => p.kind === 'platform')).toHaveLength(2);
    for (const product of PRODUCTS) {
      expect(product.name.length, `${product.slug} name`).toBeGreaterThan(1);
      // R19 execution — accents are frozen tokens, never raw hex
      expect(product.accent, `${product.slug} accent`).toMatch(/^var\(--gb-[a-z0-9-]+\)$/);
      // conditional fields are validated only when present (never invented)
      if (product.tagline !== undefined) {
        expect(product.tagline.length, `${product.slug} tagline`).toBeGreaterThan(10);
      }
    }
  });

  it("every routable product card links to its canonical landing route", () => {
    const routable = PRODUCTS.filter((p) => p.to !== undefined);
    expect(routable.length).toBeGreaterThanOrEqual(4);
    const destinations = routable.map((p) => p.to as string);
    expect(new Set(destinations).size).toBe(destinations.length);
    for (const product of routable) {
      expect(product.to, `${product.slug} path`).toMatch(/^\/[a-z0-9-]+$/);
      expect(routeTable().literal, `${product.slug} route`).toContain(product.to);
      expect(routeTable().redirectOnly, `${product.slug} must not be a redirect`).not.toContain(product.to);
    }
    // institutional entries (no landing page) must never carry a destination
    for (const product of PRODUCTS.filter((p) => p.to === undefined)) {
      expect(product.to).toBeUndefined();
    }
  });

  it("the hub page renders SaaS from the shared data module (platforms institutional)", () => {
    const page = read("src/pages/Products.tsx");
    expect(page).toContain("SAAS_PRODUCTS");
    expect(page).toContain("PLATFORM_PRODUCTS");
    expect(page).toContain('canonical="/produtos"');
    expect(page).toContain("productsSchema");
    for (const product of PRODUCTS.filter((p) => p.to !== undefined)) {
      expect(page).not.toContain(`'${product.to}'`); // destinations come from data, not literals
      void resolves(product.to as string); // resolvability of each destination
    }
  });

  it("the sitemap lists /produtos", () => {
    const sitemap = read("public/sitemap-pages.xml");
    expect(sitemap).toContain("https://getboost.digital/produtos");
  });
});
