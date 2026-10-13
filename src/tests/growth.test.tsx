import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const PAGE = read("src/pages/MarketingDigital.tsx");
const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

/**
 * R19.7 — Growth premium product page guards.
 * Eleven bespoke sections on the frozen systems; SEO byte-identical;
 * green pillar identity; no new routes; proof and copy reused.
 */
describe("R19.7 — growth premium page", () => {
  it("renders the eleven frozen sections in order", () => {
    const markers = [
      "01 HERO", "02 PROBLEMA", "03 COMO FUNCIONA", "04 ALAVANCAS",
      "05 JORNADAS", "06 ECOSSISTEMA", "07 RESULTADOS", "08 WHY GETBOOST",
      "09 TIMELINE", "10 PROVA", "11 FINAL CTA",
    ];
    const positions = markers.map((marker) => {
      const at = PAGE.indexOf(marker);
      expect(at, `section ${marker} missing`).toBeGreaterThan(-1);
      return at;
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("keeps the SEO block byte-identical (no SEO changes)", () => {
    expect(PAGE).toContain('title="Marketing Digital — Estratégia Integrada e Receita Previsível | Getboost Digital"');
    expect(PAGE).toContain('description="Marketing digital ponta a ponta: estratégia, aquisição multi-canal, retenção, analytics e otimização contínua. Menos táticas soltas, mais receita mensurável."');
    expect(PAGE).toContain('canonical="/solucoes/marketing-digital"');
  });

  it("every CTA destination resolves to a canonical route", () => {
    expect(PAGE).toContain("const bookingHref = i18n.language === 'pt' ? '/booking'");
    const literals = [
      ...[...PAGE.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...PAGE.matchAll(/to="(\/[^"]+)"/g)].map((m) => m[1]),
      ...[...PAGE.matchAll(/`\/\$\{i18n\.language\}([^`]+)`/g)].map((m) => m[1]),
      "/booking",
    ].filter((value) => value.startsWith("/"));
    expect(literals.length).toBeGreaterThanOrEqual(4);
    for (const dest of literals) {
      expect(appRoutes, `growth CTA ${dest} unresolved`).toContain(dest);
      expect(redirectOnly, `growth CTA ${dest} is a redirect`).not.toContain(dest);
    }
  });

  it("the anchor CTA targets an existing section id", () => {
    expect(PAGE).toContain('href="#estrategia"');
    expect(PAGE).toContain('id="estrategia"');
  });

  it("keeps conversion mechanics and tracking wired", () => {
    expect(PAGE).toContain("<CommercialAuditModal");
    expect(PAGE).toContain("analytics.trackClick('growth_hero'");
    expect(PAGE).toContain("analytics.trackClick('growth_cta'");
    expect(PAGE).toContain("Agendar Diagnóstico");
  });

  it("reuses approved proof and products (no invented metrics)", () => {
    expect(PAGE).toContain("GROWTH.proof.map(");
    expect(PAGE).toContain("<CountUp value={p.k} />");
    expect(PAGE).toContain("PRODUCTS.filter((p) => GROWTH.products.includes(p.slug))");
    // the brief's metric examples must come from the system data, not page literals
    expect(PAGE).not.toContain('"+300%"');
    expect(PAGE).not.toContain('"5x"');
  });

  it("runs on the frozen systems with the green pillar identity", () => {
    expect(PAGE).toContain("import { SectionHeader }");
    expect(PAGE).toContain("import { Button }");
    expect(PAGE).toContain("import { MiniFlow }");
    expect(PAGE).toContain("gb-card-lift");
    expect(PAGE).toContain("gb-icon-chip");
    expect(PAGE).toContain("--gb-growth-");
    expect(PAGE).toContain("reduceMotion ? undefined");
    expect(PAGE).not.toContain("setInterval");
    // green only — no other pillar hex may appear
    for (const hex of ["#7c3aed", "#0d9488", "#2563eb"]) {
      expect(PAGE, `non-green pillar hex ${hex}`).not.toContain(hex);
    }
  });
});
