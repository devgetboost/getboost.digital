import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 2A.6 — route integrity.
 *
 * CI fails on: a sitemap URL with no route, a sitemap URL that only redirects,
 * duplicate sitemap entries, a footer link to a redirect-only or legacy path,
 * legacy hreflang tags, or drift between the router and the documented
 * redirect inventory.
 */

const SITEMAP_INDEX = "sitemap.xml";
const URLSET_FILES = [
  "sitemap-pages.xml",
  "sitemap-services.xml",
  "sitemap-blog.xml",
  "sitemap-portfolio.xml",
  "sitemap-resources.xml",
  "sitemap-demo.xml",
];
const SITEMAP_FILES = [SITEMAP_INDEX, ...URLSET_FILES];

function routeTable() {
  const app = read("src/App.tsx");
  const literal = [...app.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
  const redirectOnly = [...app.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);
  return { literal, redirectOnly };
}

/** Strips origin, query and market prefix so /br/solucoes resolves like /solucoes. */
function toBarePath(url: string): string {
  const path = url.replace(/^https?:\/\/[^/]+/, "");
  return path.split("?")[0].replace(/^\/(br|en)(?=\/|$)/, "") || "/";
}

function resolves(path: string): boolean {
  const { literal } = routeTable();
  if (literal.includes(path)) return true;
  return literal.filter((r) => r.includes(":")).some((r) => new RegExp(`^${r.replace(/:[^/]+/g, "[^/]+")}$`).test(path));
}

/** Footer destinations (the pt branch of each localised ternary). */
function footerDestinations(): string[] {
  const footer = read("src/components/Footer.tsx");
  const dests: string[] = [];
  for (const [, expr] of footer.matchAll(/to=\{([^}]+)\}/g)) {
    // Only concrete string literals; template branches (/${i18n.language}…)
    // are market duplicates of the same path.
    for (const [, value] of expr.matchAll(/'([^']+)'/g)) {
      if (value.startsWith("/")) dests.push(value);
    }
    for (const [, value] of expr.matchAll(/"([^"]+)"/g)) {
      if (value.startsWith("/")) dests.push(value);
    }
  }
  // plain to="/path" forms
  for (const [, value] of footer.matchAll(/to="(\/[^"]+)"/g)) dests.push(value);
  return dests;
}

describe("Wave 2A.6 — route integrity", () => {
  it("the sitemap index only references sitemap files that exist", () => {
    const content = read(`public/${SITEMAP_INDEX}`);
    const children = [...content.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(children).toHaveLength(URLSET_FILES.length);
    for (const child of children) {
      expect(child.endsWith(".xml"), `${child} is not a sitemap file`).toBe(true);
      const file = child.split("/").pop()!;
      expect(existsSync(join(root, "public", file)), `${file} missing in public/`).toBe(true);
    }
  });

  it("every sitemap URL maps to a real route", () => {
    const broken: string[] = [];
    for (const file of URLSET_FILES) {
      const content = read(`public/${file}`);
      const urls = [...content.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      for (const url of urls) {
        if (!resolves(toBarePath(url))) broken.push(`${file}: ${url}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("no sitemap URL points at a redirect-only route", () => {
    const { redirectOnly } = routeTable();
    const offenders: string[] = [];
    for (const file of URLSET_FILES) {
      const content = read(`public/${file}`);
      for (const url of [...content.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])) {
        if (redirectOnly.includes(toBarePath(url))) offenders.push(`${file}: ${url}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no sitemap contains duplicate URLs", () => {
    for (const file of SITEMAP_FILES) {
      const urls = [...read(`public/${file}`).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
      expect(new Set(urls).size, `${file} has duplicate <loc> entries`).toBe(urls.length);
    }
  });

  it("every sitemap hreflang alternate also maps to a real route", () => {
    const broken: string[] = [];
    for (const file of SITEMAP_FILES) {
      const content = read(`public/${file}`);
      for (const [, href] of content.matchAll(/<xhtml:link rel="alternate" hreflang="[^"]+" href="([^"]+)"/g)) {
        if (!resolves(toBarePath(href))) broken.push(`${file}: ${href}`);
      }
    }
    expect(broken).toEqual([]);
  });

  it("sitemaps only carry market-model hreflang tags", () => {
    for (const file of SITEMAP_FILES) {
      const content = read(`public/${file}`);
      const tags = [...content.matchAll(/hreflang="([^"]+)"/g)].map((m) => m[1]);
      for (const tag of tags) {
        expect(["pt-PT", "pt-BR", "en", "x-default"], `${file} hreflang=${tag}`).toContain(tag);
      }
    }
  });

  it("every footer link resolves to a canonical, non-redirect route", () => {
    const { literal, redirectOnly } = routeTable();
    const dests = footerDestinations();
    expect(dests.length).toBeGreaterThan(10);
    for (const dest of dests) {
      expect(dest, `footer legacy path: ${dest}`).not.toMatch(/^\/(services|servicos)(\/|$)/);
      if (dest === "/") continue;
      const bare = toBarePath(dest);
      // footer destinations are always bare paths
      expect(literal.includes(dest) || literal.includes(bare), `footer dest unresolved: ${dest}`).toBe(true);
      expect(redirectOnly.includes(dest), `footer dest is a redirect: ${dest}`).toBe(false);
    }
  });

  it("the router and the redirect inventory doc stay in sync", () => {
    const routerRedirects = routeTable()
      .redirectOnly.filter((r) => !r.includes(":lang"))
      .sort();
    const doc = read("docs/redirect-inventory.md");
    const documented = new Set<string>();
    for (const line of doc.split("\n")) {
      if (!line.startsWith("|")) continue;
      // Only the first column (the legacy route) counts — never the
      // destination or classification columns.
      const cells = line.split("|").map((c) => c.trim());
      const first = cells[1]?.match(/^`(\/[^`]+)`$/);
      if (first) documented.add(first[1]);
    }
    for (const route of routerRedirects) {
      expect(documented.has(route), `redirect route ${route} missing from the inventory`).toBe(true);
    }
    for (const route of documented) {
      expect(routerRedirects, `inventory route ${route} is not a router redirect`).toContain(route);
    }
  });

  it("DemoRequest advertises only market-model alternates", () => {
    const demo = read("src/pages/DemoRequest.tsx");
    const alternates = demo.slice(demo.indexOf("demoAlternates"));
    expect(alternates).not.toMatch(/\{\s*lang:\s*'es'/);
    expect(alternates).toMatch(/\{\s*lang:\s*'pt-PT'/);
    expect(alternates).toMatch(/\{\s*lang:\s*'en'/);
  });
});
