import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 2A.2 — homepage CTA guard (kept current by Wave 3C).
 *
 * Every destination the homepage links to must (a) exist as a route in the
 * route map and (b) be a *canonical* route — one that renders a real page,
 * not a `<Navigate>` redirect hop and not a catch-all. Route drift fails
 * here, in CI, before it ships.
 */

/** Every string literal used as a homepage CTA destination in Index.tsx. */
function homepageCtaHrefs(): string[] {
  const src = read("src/pages/Index.tsx");
  const dataHrefs = [...src.matchAll(/href:\s*['"]([^'"]+)['"]/g)].map((m) => m[1]);
  const linkTos = [...src.matchAll(/\bto=\{?['"]([^'"]+)['"]/g)].map((m) => m[1]);
  return [...new Set([...dataHrefs, ...linkTos])];
}

interface RouteTable {
  /** Every literal path declared in the router. */
  literal: string[];
  /** Paths whose element is a `<Navigate>` — they resolve, but redirect. */
  redirectOnly: string[];
}

function routeTable(): RouteTable {
  const app = read("src/App.tsx");
  const literal = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
  const redirectOnly = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);
  return { literal, redirectOnly };
}

function routePattern(route: string): RegExp {
  return new RegExp(`^${route.replace(/:[^/]+/g, "[^/]+")}$`);
}

/** True when the path renders through the router (directly or dynamically). */
function resolves(path: string): boolean {
  const { literal } = routeTable();
  if (literal.includes(path)) return true;
  return literal.filter((r) => r.includes(":")).some((r) => routePattern(r).test(path));
}

/**
 * True when the path renders a real page. A redirect-only route (e.g.
 * `/solucoes/qook` → `/qook`) resolves but is not canonical: linking to it
 * costs a redirect hop and hides the true destination.
 */
function isCanonical(path: string): boolean {
  const { literal, redirectOnly } = routeTable();
  if (redirectOnly.includes(path)) return false;
  if (literal.includes(path)) return true;
  return literal
    .filter((r) => r.includes(":") && !redirectOnly.includes(r))
    .some((r) => routePattern(r).test(path));
}

describe("Wave 2A.2 — homepage CTA destinations", () => {
  it("extracts the full CTA set from the homepage", () => {
    // Wave 3C blueprint: 4 pillar destinations + work/insights/products/
    // blog/resources links. A silently-broken extraction fails here.
    const hrefs = homepageCtaHrefs();
    expect(hrefs.length).toBeGreaterThanOrEqual(8);
    expect(hrefs.every((h) => h.startsWith("/"))).toBe(true);
  });

  it("every homepage CTA resolves to a real route", () => {
    const unresolved = homepageCtaHrefs().filter((href) => !resolves(href));
    expect(unresolved).toEqual([]);
  });

  it("every homepage CTA points to a canonical route (no redirect hops)", () => {
    const nonCanonical = homepageCtaHrefs().filter((href) => !isCanonical(href));
    expect(nonCanonical).toEqual([]);
  });

  it("no homepage CTA uses a legacy or malformed path", () => {
    const legacy = homepageCtaHrefs().filter((href) =>
      /^\/servicos(\/|$)/.test(href) ||
      /^\/services(\/|$)/.test(href) ||
      !/^\/[a-z0-9][a-z0-9\-/]*$/.test(href),
    );
    expect(legacy).toEqual([]);
  });

  it("the four pillar CTAs point at their canonical destinations", () => {
    const hrefs = homepageCtaHrefs();
    for (const target of [
      "/agentes-ia", // IA
      "/solucoes/integracoes-erp-crm", // Automação
      "/solucoes/desenvolvimento-software", // Software
      "/solucoes/marketing-digital", // Growth
    ]) {
      expect(hrefs).toContain(target);
    }
    // The four previously-broken targets must not return.
    for (const broken of [
      "/marketing-digital",
      "/servicos",
      "/servicos/desenvolvimento-saas",
      "/servicos/integracoes-erp-crm",
    ]) {
      expect(hrefs).not.toContain(broken);
    }
  });
});
