import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const PAGE = read("src/pages/DesenvolvimentoSaaS.tsx");
const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

/**
 * R19.6 — Software premium product page guards.
 * Eleven bespoke sections on the frozen systems; SEO byte-identical;
 * blue pillar identity; no new routes; proof and copy reused.
 */
describe("R19.6 — software premium page", () => {
  it("renders the eleven frozen sections in order", () => {
    const markers = [
      "01 HERO", "02 PROBLEMA", "03 COMO CONSTRUÍMOS", "04 O QUE CONSTRUÍMOS",
      "05 JORNADAS", "06 ARQUITETURA", "07 RESULTADOS", "08 WHY GETBOOST",
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
    expect(PAGE).toContain('title="Desenvolvimento SaaS — Plataformas Multi-Tenant e Produtos Digitais | Getboost Digital"');
    expect(PAGE).toContain('description="Construímos plataformas SaaS multi-tenant escaláveis: MVP, billing, IA integrada e operação pronta para SLA."');
    expect(PAGE).toContain('canonical="/solucoes/desenvolvimento-software"');
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
      expect(appRoutes, `software CTA ${dest} unresolved`).toContain(dest);
      expect(redirectOnly, `software CTA ${dest} is a redirect`).not.toContain(dest);
    }
  });

  it("the anchor CTA targets an existing section id", () => {
    expect(PAGE).toContain('href="#prova"');
    expect(PAGE).toContain('id="prova"');
  });

  it("keeps conversion mechanics and tracking wired", () => {
    expect(PAGE).toContain("<CommercialAuditModal");
    expect(PAGE).toContain("analytics.trackClick('software_hero'");
    expect(PAGE).toContain("analytics.trackClick('software_cta'");
    expect(PAGE).toContain("Agendar Diagnóstico");
  });

  it("reuses approved proof and products (no invented metrics or products)", () => {
    expect(PAGE).toContain("SOFTWARE.proof.map(");
    expect(PAGE).toContain("<CountUp value={p.k} />");
    expect(PAGE).toContain("PRODUCTS.filter((p) => SOFTWARE.products.includes(p.slug))");
    expect(PAGE).not.toMatch(/\+[0-9]{2,}%/);
    for (const invented of ["Alojify", "Voya", "Safely"]) {
      expect(PAGE, `invented product ${invented}`).not.toContain(invented);
    }
  });

  it("runs on the frozen systems with the blue pillar identity", () => {
    expect(PAGE).toContain("import { SectionHeader }");
    expect(PAGE).toContain("import { Button }");
    expect(PAGE).toContain("import { MiniFlow }");
    expect(PAGE).toContain("gb-card-lift");
    expect(PAGE).toContain("gb-icon-chip");
    expect(PAGE).toContain("--gb-software-");
    expect(PAGE).toContain("reduceMotion ? undefined");
    expect(PAGE).not.toContain("setInterval");
    // blue only — no other pillar hex may appear
    for (const hex of ["#7c3aed", "#0d9488", "#16a34a"]) {
      expect(PAGE, `non-blue pillar hex ${hex}`).not.toContain(hex);
    }
  });
});
