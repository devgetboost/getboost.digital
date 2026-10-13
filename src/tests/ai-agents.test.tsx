import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const PAGE = read("src/pages/AgentesIA.tsx");
const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

/**
 * R19.2 — AI Agents premium product page guards.
 * Eleven bespoke sections on the frozen systems; SEO byte-identical;
 * no new routes; proof and copy reused from approved sources.
 */
describe("R19.2 — AI Agents premium page", () => {
  it("renders the eleven frozen sections in order", () => {
    const markers = [
      "01 HERO", "02 PROBLEMA", "03 COMO FUNCIONA", "04 CAPACIDADES",
      "05 CASOS DE USO", "06 INTEGRAÇÕES", "07 RESULTADOS", "08 WHY GETBOOST",
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
    expect(PAGE).toContain('title="Agentic AI — Agentes de IA Autónomos | Getboost Digital"');
    expect(PAGE).toContain('description="Agentes de inteligência artificial que compreendem o teu negócio, resolvem problemas complexos e executam tarefas de forma autónoma, 24/7."');
    expect(PAGE).toContain('canonical="/agentes-ia"');
  });

  it("every CTA destination resolves to a canonical route", () => {
    // Market-aware expressions (bookingHref, ternaries) + literals.
    expect(PAGE).toContain("const bookingHref = i18n.language === 'pt' ? '/booking'");
    const literals = [
      ...[...PAGE.matchAll(/href:\s*'([^']+)'/g)].map((m) => m[1]),
      ...[...PAGE.matchAll(/to="(\/[^"]+)"/g)].map((m) => m[1]),
      ...[...PAGE.matchAll(/`\/\$\{i18n\.language\}([^`]+)`/g)].map((m) => m[1]),
      "/booking",
    ].filter((value) => value.startsWith("/"));
    expect(literals.length).toBeGreaterThanOrEqual(4);
    for (const dest of literals) {
      expect(appRoutes, `AI CTA ${dest} unresolved`).toContain(dest);
      expect(redirectOnly, `AI CTA ${dest} is a redirect`).not.toContain(dest);
    }
  });

  it("keeps conversion mechanics and tracking wired", () => {
    expect(PAGE).toContain("<CommercialAuditModal");
    expect(PAGE).toContain("analytics.trackClick('ai_hero'");
    expect(PAGE).toContain("analytics.trackClick('ai_cta'");
    expect(PAGE).toContain("Agendar Diagnóstico");
  });

  it("reuses approved proof and products (no invented metrics)", () => {
    expect(PAGE).toContain("AI.proof.map(");
    expect(PAGE).toContain("<CountUp value={p.k} />");
    expect(PAGE).toContain("PRODUCTS.filter((p) => AI.products.includes(p.slug))");
    // no hardcoded metric claims on the page
    expect(PAGE).not.toMatch(/\+[0-9]{2,}%/);
  });

  it("runs on the frozen systems (no new animation or style categories)", () => {
    expect(PAGE).toContain("import { SectionHeader }");
    expect(PAGE).toContain("import { Button }");
    expect(PAGE).toContain("import { MiniFlow }");
    expect(PAGE).toContain("gb-card-lift");
    expect(PAGE).toContain("gb-icon-chip");
    expect(PAGE).toContain("reduceMotion ? undefined");
    expect(PAGE).not.toContain("setInterval");
  });
});
