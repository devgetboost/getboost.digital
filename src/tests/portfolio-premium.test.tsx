import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const PAGE = read("src/pages/Portfolio.tsx");
const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

/**
 * R19.3 — Portfolio rescue guards.
 * Proof page, not gallery: light premium hero, authority strip, storytelling
 * grid (no horizontal hijack), own-products spotlight, execution chain, Why
 * Getboost, and conversion throughout. SEO block, routes, case data and
 * tracking architecture untouched.
 */
describe("R19.3 — portfolio rescue", () => {
  it("renders the frozen sections in order", () => {
    const markers = [
      "01 HERO", "02 AUTHORITY", "03 CASES", "04 PRODUCTS",
      "05 EXECUTION", "06 WHY", "07 MID CTA", "08 FINAL CTA",
    ];
    const positions = markers.map((marker) => {
      const at = PAGE.indexOf(marker);
      expect(at, `section ${marker} missing`).toBeGreaterThan(-1);
      return at;
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("the legacy hero and carousel are gone", () => {
    expect(PAGE).not.toContain("PageHero");
    expect(PAGE).not.toContain("heroStrategy");
    expect(PAGE).not.toContain("ScrollXCarousel");
    expect(PAGE).not.toContain("CardHoverReveal");
    expect(PAGE).not.toContain("bg-[#0a0603]");
  });

  it("keeps the SEO block byte-identical (no SEO changes)", () => {
    expect(PAGE).toContain('title={`${t(\'portfolio.title\')} — Marketing Digital`}');
    expect(PAGE).toContain('description={t(\'portfolioPage.heroSubtitle\')}');
    expect(PAGE).toContain('canonical="/portfolio"');
  });

  it("conversion exists in hero, mid-page and final CTA (all tracked)", () => {
    expect(PAGE).toContain("<CommercialAuditModal");
    const bookings = [...PAGE.matchAll(/analytics\.trackClick\('portfolio', '([^']+)'/g)].map((m) => m[1]);
    expect(bookings).toContain("portfolio_booking");
    expect(bookings).toContain("portfolio_mid_booking");
    expect(bookings).toContain("portfolio_final_booking");
    expect(bookings).toContain("portfolio_final_contact");
  });

  it("every CTA destination resolves to a canonical route", () => {
    // Market-aware consts (bookingHref/contactHref) + the case-detail template.
    expect(PAGE).toContain("const bookingHref = `${prefix}/booking`");
    expect(PAGE).toContain("const contactHref = `${prefix}/contact`");
    expect(PAGE).toContain("`/portfolio/${project.slug}`");
    for (const dest of ["/booking", "/contact", "/portfolio"]) {
      expect(appRoutes, `portfolio CTA ${dest} unresolved`).toContain(dest);
      expect(redirectOnly, `portfolio CTA ${dest} is a redirect`).not.toContain(dest);
    }
    // every remaining literal destination must also resolve
    const literals = [
      ...[...PAGE.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...PAGE.matchAll(/to="(\/[^"]+)"/g)].map((m) => m[1]),
    ].filter((value) => value.startsWith("/"));
    for (const dest of literals) {
      expect(appRoutes, `portfolio CTA ${dest} unresolved`).toContain(dest);
      expect(redirectOnly, `portfolio CTA ${dest} is a redirect`).not.toContain(dest);
    }
  });

  it("case cards answer categoria → stack → caso (no invented fields)", () => {
    expect(PAGE).toContain("{project.category}");
    expect(PAGE).toContain("{project.technologies");
    expect(PAGE).toContain("`/portfolio/${project.slug}`");
    expect(PAGE).toContain("Ver resultado");
  });

  it("filters derive from real case data with the gb-chip system", () => {
    expect(PAGE).toContain("Array.from(new Set(projects.map((p) => p.category)))");
    expect(PAGE).toContain("gb-chip");
    expect(PAGE).toContain('aria-pressed={filter === f}');
  });

  it("products spotlight and execution chain reuse approved data (spans only)", () => {
    expect(PAGE).toMatch(/PRODUCTS\.(filter\(.*\)\.?map\(|map\()/);
    expect(PAGE).toContain("{product.category}");
    expect(PAGE).toContain("{product.status}");
    const execution = PAGE.slice(PAGE.indexOf("05 EXECUTION"), PAGE.indexOf("06 WHY"));
    expect(execution).not.toContain("<Link");
    const why = PAGE.slice(PAGE.indexOf("06 WHY"), PAGE.indexOf("07 MID CTA"));
    expect(why).not.toContain("<Link");
  });

  it("runs on the frozen systems (no new animation or style categories)", () => {
    expect(PAGE).toContain("import { SectionHeader }");
    expect(PAGE).toContain("import { Button }");
    expect(PAGE).toContain("import { MiniFlow }");
    expect(PAGE).toContain("gb-card-lift");
    expect(PAGE).toContain("gb-link-more");
    expect(PAGE).toContain("reduceMotion ? undefined");
    expect(PAGE).not.toContain("setInterval");
  });
});
