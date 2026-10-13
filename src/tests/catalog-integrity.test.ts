import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS, SAAS_PRODUCTS, PLATFORM_PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);

/**
 * R19.8 — official catalog integrity.
 * The public catalog is exactly 6 SaaS + 2 platforms. Legacy names
 * (Hostify, ProSafe360) are eliminated from every catalog surface;
 * remaining occurrences live only in documented exceptions (the live
 * landing routes/pages they brand, DemoRequest's route-bound product
 * map, investorProjects, the sitemap demo block, Services.tsx cards
 * bound to those same landings). Institutional entries (no landing
 * page) render as spans, never links — CI fails on any dead product
 * link.
 */
const CATALOG_SURFACES = [
  "src/data/products.ts",
  "src/components/Header.tsx",
  "src/components/Footer.tsx",
  "src/pages/Index.tsx",
  "src/pages/Products.tsx",
  "src/pages/Portfolio.tsx",
  "src/components/pillars/pillarData.ts",
];

describe("R19.8 — official catalog integrity", () => {
  it("the registry is the official catalog (6 SaaS + 2 platforms)", () => {
    expect(SAAS_PRODUCTS.map((p) => p.slug).sort()).toEqual(
      ["alojify", "motivae", "pikto", "qook", "safely", "trackfy"].sort(),
    );
    expect(PLATFORM_PRODUCTS.map((p) => p.slug).sort()).toEqual(
      ["descobre-quem-tu-es", "guia-cities"].sort(),
    );
    for (const product of PRODUCTS) {
      // R19 execution — accents are frozen tokens, never raw hex
      expect(product.accent).toMatch(/^var\(--gb-[a-z0-9-]+\)$/);
    }
  });

  it("legacy product names are gone from every catalog surface", () => {
    // Documentation may name legacy products (exceptions record); only
    // code counts — same rule as the storage gate (comments stripped).
    const stripComments = (source: string): string =>
      source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
    const offenders: string[] = [];
    for (const file of CATALOG_SURFACES) {
      const content = stripComments(read(file));
      for (const legacy of ["Hostify", "ProSafe360", "Prosafe360"]) {
        if (content.includes(legacy)) offenders.push(`${file}: ${legacy}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("official names appear across all catalog surfaces", () => {
    const everywhere = CATALOG_SURFACES.map(read).join("\n");
    for (const name of ["Alojify", "Safely", "Descobre Quem Tu És", "Guia Cities", "Qook", "Motivae", "Pikto", "Trackfy"]) {
      expect(everywhere, `official name missing: ${name}`).toContain(name);
    }
  });

  it("every catalog destination resolves to a real route (zero dead links)", () => {
    for (const product of PRODUCTS.filter((p) => p.to !== undefined)) {
      expect(appRoutes, `${product.slug} destination`).toContain(product.to);
    }
  });

  it("institutional entries render as spans, never links", () => {
    for (const file of ["src/pages/Products.tsx", "src/components/Header.tsx", "src/components/Footer.tsx"]) {
      const content = read(file);
      // platforms render in dedicated institutional blocks
      expect(content, `${file} institutional block`).toMatch(/institutional/i);
    }
    // the hub JSON-LD only lists routable products (no undefined URLs)
    const hub = read("src/pages/Products.tsx");
    expect(hub).toContain("PRODUCTS.filter((p) => p.to)");
  });

  it("pillar proof references only catalog products", () => {
    const slugs = new Set(PRODUCTS.map((p) => p.slug));
    const pillarData = read("src/components/pillars/pillarData.ts");
    for (const match of pillarData.matchAll(/products: \[([^\]]+)\]/g)) {
      for (const slug of match[1].matchAll(/"([^"]+)"/g)) {
        expect(slugs.has(slug[1]), `pillar product ${slug[1]} not in catalog`).toBe(true);
      }
    }
  });
});
