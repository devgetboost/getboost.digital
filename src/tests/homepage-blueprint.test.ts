import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const SRC = read("src/pages/Index.tsx");
const APP = read("src/App.tsx");

/**
 * Wave 3C — homepage blueprint guards.
 *
 * The homepage renders the frozen nine sections in order
 * (GETBOOST_2027_DESIGN_FREEZE_V1), on the Wave 3A design system, with
 * no autoplay and no dark hero. CI fails on reorder, removal, or the
 * return of carousel/dark patterns.
 */

/** Section markers in frozen order, as written in the page source. */
const FROZEN_SECTIONS = [
  "01 HERO",
  "02 PROOF BAR",
  "03 BUSINESS SYSTEMS",
  "04 FOUR PILLARS",
  "05 CASE STUDIES",
  "06 PRODUCTS",
  "07 METHOD",
  "08 INSIGHTS",
  "09 FINAL CTA",
];

const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

describe("Wave 3C — homepage blueprint", () => {
  it("renders the nine frozen sections in the frozen order", () => {
    const positions = FROZEN_SECTIONS.map((marker) => {
      const at = SRC.indexOf(marker);
      expect(at, `section ${marker} missing from the homepage`).toBeGreaterThan(-1);
      return at;
    });
    const sorted = [...positions].sort((a, b) => a - b);
    expect(positions).toEqual(sorted);
  });

  it("runs on the Wave 3A design system", () => {
    expect(SRC).toContain("import { SectionHeader } from '@/components/ui/section-header'");
    expect(SRC).toContain("import { Button } from '@/components/ui/button'");
    for (const cls of [
      "gb-surface-page",
      "gb-surface-subtle",
      "gb-surface-section",
      "gb-surface-card",
      "gb-surface-card-elevated",
      "gb-surface-pillar-card",
      "gb-cta-band",
      "gb-container",
      "gb-eyebrow",
      "gb-text-display",
    ]) {
      expect(SRC, `homepage must use ${cls}`).toContain(cls);
    }
    // SectionHeader drives the content sections
    expect((SRC.match(/<SectionHeader/g) ?? []).length).toBeGreaterThanOrEqual(5);
  });

  it("gives all four pillars their own colour identity", () => {
    const dataBlock = SRC.slice(SRC.indexOf("const pillars"), SRC.indexOf("const systems"));
    for (const id of ["ai", "automation", "software", "growth"]) {
      expect(dataBlock, `pillar ${id} missing from the data`).toContain(`id: '${id}'`);
    }
    // accents are token-driven via the pillar id, never hardcoded hexes
    expect(SRC).toContain("--gb-pillar");
    for (const facet of ["base", "tint", "strong", "border"]) {
      expect(SRC, `pillar facet ${facet}`).toContain(`var(--gb-\${pillar.id}-${facet})`);
    }
    expect(SRC).not.toMatch(/var\(--gb-[a-z]+-#/);
  });

  it("has no autoplay carousel and no dark hero", () => {
    // autoplay patterns from the retired hero/showcase
    expect(SRC).not.toContain("setInterval");
    expect(SRC).not.toContain("<AnimatePresence");
    expect(SRC).not.toContain("animate-marquee");
    expect(SRC).not.toContain("TypewriterPhrases");
    expect(SRC).not.toContain("ProductsShowcase");
    // the hero is light, not the retired dark shell
    const hero = SRC.slice(SRC.indexOf("01 HERO"), SRC.indexOf("02 PROOF BAR"));
    expect(hero).not.toContain("#0a0603");
    expect(hero).not.toContain("#120906");
    expect(hero).toContain("gb-surface-page");
  });

  it("products remain proof — all six link to their canonical landings", () => {
    expect(SRC).toContain("import { PRODUCTS } from '@/data/products'");
    expect(SRC).toContain("PRODUCTS.map(");
    for (const product of PRODUCTS) {
      expect(appRoutes, `product route ${product.to}`).toContain(product.to);
      expect(redirectOnly, `product route ${product.to} is a redirect`).not.toContain(product.to);
    }
  });

  it("keeps the commercial conversion mechanics wired", () => {
    expect(SRC).toContain("<CommercialAuditModal");
    expect(SRC).toContain("<ConsultantContactForm");
    expect(SRC).toContain("Auditoria grátis 7 min");
    expect(SRC).toContain("Falar com um consultor");
  });

  it("keeps the SEO architecture unchanged", () => {
    const seo = SRC.slice(SRC.indexOf("<SEO"), SRC.indexOf("/>", SRC.indexOf("<SEO")));
    expect(seo).toContain('title="Getboost Digital — Agentes IA, Growth e Software que geram clientes"');
    expect(seo).toContain('canonical="/"');
    expect(seo).toContain("jsonLd={organizationSchema}");
  });

  it("every literal homepage CTA resolves to a canonical route", () => {
    const literals = [
      ...[...SRC.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...SRC.matchAll(/to="(\/[^"]+)"/g)].map((m) => m[1]),
    ].filter((value) => value.startsWith("/") && !value.includes("${"));
    expect(literals.length).toBeGreaterThanOrEqual(8);
    for (const dest of literals) {
      expect(appRoutes, `homepage CTA ${dest} unresolved`).toContain(dest);
      expect(redirectOnly, `homepage CTA ${dest} is a redirect`).not.toContain(dest);
    }
    // the four retired pillar destinations can never return
    for (const broken of ["/marketing-digital", "/servicos", "/servicos/desenvolvimento-saas", "/servicos/integracoes-erp-crm"]) {
      expect(literals).not.toContain(broken);
    }
  });
});
