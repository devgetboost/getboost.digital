import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * Wave 3E — P1 gap closure guards.
 *
 * Products hub migrated to the design system; WORK (/work) and INSIGHTS
 * (/insights) hubs added; Services card links canonicalised. CI fails on
 * hub routes disappearing, the hub regressing off-system, nav pointing at
 * the old proxies, or placeholder links returning.
 */

const APP = read("src/App.tsx");
const HEADER = read("src/components/Header.tsx");
const PRODUCTS_PAGE = read("src/pages/Products.tsx");
const SERVICES = read("src/pages/Services.tsx");

const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

const navBlock = HEADER.slice(
  HEADER.indexOf("const navItems"),
  HEADER.indexOf("];", HEADER.indexOf("const navItems")),
);
const navPaths = [...navBlock.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]);

describe("Wave 3E — hubs + products migration + services cleanup", () => {
  it("the WORK and INSIGHTS hubs exist as real routes", () => {
    for (const hub of ["work", "insights"]) {
      expect(appRoutes, `${hub} route`).toContain(`/${hub}`);
      expect(appRoutes, `/:lang/${hub} route`).toContain(`/:lang/${hub}`);
      expect(redirectOnly, `/${hub} must render a page`).not.toContain(`/${hub}`);
    }
    expect(APP).toMatch(/path="\/work"\s+element=\{<Work\s*\/>\}/);
    expect(APP).toMatch(/path="\/insights"\s+element=\{<Insights\s*\/>\}/);
  });

  it("navigation points at the new hubs", () => {
    expect(navPaths).toContain("/work");
    expect(navPaths).toContain("/insights");
    // the pre-3E proxies are no longer the primary destinations
    expect(navPaths).not.toContain("/portfolio");
    expect(navPaths).not.toContain("/resources");
  });

  it("the products hub runs on the design system", () => {
    expect((PRODUCTS_PAGE.match(/gb-[a-z-]+/g) ?? []).length).toBeGreaterThanOrEqual(10);
    expect(PRODUCTS_PAGE).toContain("import { SectionHeader }");
    expect(PRODUCTS_PAGE).toContain("<SectionHeader");
    expect(PRODUCTS_PAGE).toContain("import { Button }");
    expect(PRODUCTS_PAGE).toContain("<Button");
    // legacy dark hero and bespoke chrome removed
    expect(PRODUCTS_PAGE).not.toContain("#0a0603");
    expect(PRODUCTS_PAGE).not.toContain("#120906");
  });

  it("the products hub remains SEO-valid", () => {
    expect(PRODUCTS_PAGE).toContain('canonical="/produtos"');
    expect(PRODUCTS_PAGE).toContain("productsSchema");
    expect(PRODUCTS_PAGE).toContain("ItemList");
    // data and routes unchanged
    expect(PRODUCTS_PAGE).toContain("import { PRODUCTS } from '@/data/products'");
  });

  it("the hubs keep the frozen blueprint structure", () => {
    const work = read("src/pages/Work.tsx");
    const insights = read("src/pages/Insights.tsx");
    // WORK: Hero → Portfolio → Case Studies → Proof → CTA
    for (const marker of ["HERO", "PORTFOLIO", "Casos", "Prova", "CTA"]) {
      expect(work, `WORK section ${marker}`).toContain(marker);
    }
    expect(work).toContain('canonical="/work"');
    // INSIGHTS: Hero → Blog → Resources → Podcast → Academy → Webinars → Tools → CTA
    for (const marker of ["HERO", "Blog", "Recursos", "Podcast", "Academy", "Webinars", "TOOLS", "CTA"]) {
      expect(insights, `INSIGHTS section ${marker}`).toContain(marker);
    }
    expect(insights).toContain('canonical="/insights"');
    for (const page of [work, insights]) {
      expect(page).toContain("gb-surface-page");
      expect(page).toContain("gb-cta-band");
      expect(page).toContain("<SectionHeader");
      expect(page).toContain("<h1");
    }
  });

  it("existing content surfaces stay canonical", () => {
    for (const route of ["/portfolio", "/casos-de-sucesso", "/blog", "/resources", "/podcast", "/academy", "/webinars"]) {
      expect(appRoutes, `existing surface ${route}`).toContain(route);
      expect(redirectOnly, `existing surface ${route} must not redirect`).not.toContain(route);
    }
  });

  it("services product cards use canonical routes — no '#' and no redirects", () => {
    expect(SERVICES).not.toMatch(/to=\{[^}]*'#[^}]*\}/);
    expect(SERVICES).not.toContain("'/solucoes/hostify'");
    expect(SERVICES).toContain("PRODUCTS.find(");
    // every product key in the services list maps to a real product route
    const keys = [...SERVICES.matchAll(/key: '([a-z0-9]+)'/g)].map((m) => m[1]);
    const productSlugs = PRODUCTS.map((p) => p.slug);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(productSlugs, `services product ${key} has no product route`).toContain(key);
    }
  });

  it("the sitemap lists the new hubs", () => {
    const sitemap = read("public/sitemap-pages.xml");
    expect(sitemap).toContain("https://getboost.digital/work");
    expect(sitemap).toContain("https://getboost.digital/insights");
  });
});
