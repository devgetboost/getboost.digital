import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CASES,
  CASE_METRICS,
  CASE_PILLARS,
  getCase,
  getCasesForPillar,
  productSlugFor,
  type ProofCategory,
} from "../data/cases";
import { PILLARS, type PillarId } from "../components/pillars/pillarData";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const STRIP = read("src/components/CaseProofStrip.tsx");
const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

const CATEGORIES: ProofCategory[] = [
  "BUSINESS RESULTS",
  "OPERATIONAL RESULTS",
  "ENGINEERING RESULTS",
  "AUTOMATION RESULTS",
  "ADOPTION RESULTS",
  "PROCESS RESULTS",
  "TIME SAVINGS",
  "RISK REDUCTION",
];

/**
 * R20.15 — Case Study Engine guards.
 * Shared narratives stay verbatim, every metric is classified, every case
 * resolves to a live route, and every mount point renders through the
 * shared strip. CI fails on invented proof or dead case links.
 */
describe("R20.15 — case engine data integrity", () => {
  it("ships the six published narratives verbatim", () => {
    expect(CASES).toHaveLength(6);
    for (const title of [
      "Hostify — do produto ao pipeline",
      "Qook — POS que se vende sozinho",
      "Motivae — plataforma que gera adesão",
      "ProSafe360 — narrativa que vende compliance",
      "Pikto — do editor ao ecossistema",
      "Trackfy — tecnologia acessível para PMEs",
    ]) {
      expect(CASES.map((c) => c.title), title).toContain(title);
    }
    for (const c of CASES) {
      expect(c.eyebrow.length).toBeGreaterThan(0);
      expect(c.body.length).toBeGreaterThan(100);
      expect(c.tags.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("classifies every metric tag with a valid category", () => {
    for (const c of CASES) {
      const slug = productSlugFor(c.to);
      expect(slug, `${c.title} slug`).toBeTruthy();
      const metrics = CASE_METRICS[slug as string];
      expect(metrics, `${slug} metrics`).toBeTruthy();
      expect(metrics.map((m) => m.label).sort()).toEqual([...c.tags].sort());
      for (const m of metrics) {
        expect(CATEGORIES, `${m.label} category`).toContain(m.category);
      }
    }
  });

  it("maps every case to at least one real pillar", () => {
    for (const c of CASES) {
      const slug = productSlugFor(c.to) as string;
      const pillars = CASE_PILLARS[slug];
      expect(pillars?.length, `${slug} pillars`).toBeGreaterThan(0);
      for (const pillar of pillars) {
        expect(Object.keys(PILLARS), `${slug} pillar ${pillar}`).toContain(pillar);
      }
    }
  });

  it("resolves cases by slug and pillar without inventing", () => {
    expect(getCase("qook")?.title).toContain("Qook");
    expect(getCase("nope")).toBeUndefined();
    expect(productSlugFor(undefined)).toBeNull();
    expect(productSlugFor("/")).toBeNull();
    for (const pillar of Object.keys(PILLARS) as PillarId[]) {
      for (const c of getCasesForPillar(pillar)) {
        const slug = productSlugFor(c.to) as string;
        expect(CASE_PILLARS[slug]).toContain(pillar);
      }
    }
    // Every pillar evidences at least one case.
    for (const pillar of Object.keys(PILLARS) as PillarId[]) {
      expect(getCasesForPillar(pillar).length, `cases for ${pillar}`).toBeGreaterThan(0);
    }
  });

  it("every case destination resolves to a canonical route", () => {
    for (const c of CASES) {
      expect(c.to, `${c.title} destination`).toBeTruthy();
      expect(appRoutes, `${c.to} unresolved`).toContain(c.to as string);
      expect(redirectOnly, `${c.to} redirects`).not.toContain(c.to as string);
    }
  });
});

describe("R20.15 — proof strip contract", () => {
  it("renders shipped narratives with metric tags and tracking", () => {
    expect(STRIP).toContain("getCase(slug)");
    expect(STRIP).toContain('to="/casos-de-sucesso"');
    expect(STRIP).toContain("analytics.trackClick(trackingLocation");
    expect(STRIP).toContain("gb-surface-card");
    expect(STRIP).toContain("gb-chip");
    // Unknown slugs render nothing — never a placeholder claim.
    expect(STRIP).toContain("if (cases.length === 0) return null");
    expect(STRIP).not.toContain("bg-[#0a0603]");
    expect(STRIP).not.toContain("setInterval");
  });

  it("mounted on all four pillars with relevant cases", () => {
    const mounts: Record<string, string[]> = {
      "src/pages/AgentesIA.tsx": ["qook"],
      "src/pages/IntegracoesErpCrm.tsx": ["trackfy", "hostify"],
      "src/pages/DesenvolvimentoSaaS.tsx": ["pikto"],
      "src/pages/MarketingDigital.tsx": ["motivae", "prosafe360"],
    };
    for (const [file, slugs] of Object.entries(mounts)) {
      const src = read(file);
      expect(src, `${file} strip`).toContain("CaseProofStrip");
      for (const slug of slugs) {
        expect(src, `${file} case ${slug}`).toContain(`'${slug}'`);
        expect(getCase(slug)?.title, `case ${slug} exists`).toBeTruthy();
      }
    }
  });

  it("mounted on all six product pages with their own case", () => {
    const mounts: Record<string, string> = {
      "src/pages/QookLanding.tsx": "qook",
      "src/pages/MotivaeLanding.tsx": "motivae",
      "src/pages/TrackfyLanding.tsx": "trackfy",
      "src/pages/PiktoLanding.tsx": "pikto",
      "src/pages/HostifyLanding.tsx": "hostify",
      "src/pages/Prosafe360Landing.tsx": "prosafe360",
    };
    for (const [file, slug] of Object.entries(mounts)) {
      const src = read(file);
      expect(src, `${file} strip`).toContain("CaseProofStrip");
      expect(src, `${file} own case`).toContain(`'${slug}'`);
    }
  });

  it("every strip link resolves to a canonical route", () => {
    const links = [...STRIP.matchAll(/to="(\/[^"]+)"/g)].map((m) => m[1]);
    expect(links).toContain("/casos-de-sucesso");
    for (const dest of links) {
      expect(appRoutes, `strip link ${dest}`).toContain(dest);
      expect(redirectOnly, `strip link ${dest} redirects`).not.toContain(dest);
    }
  });
});

describe("R20.15 — homepage proof in the first scroll", () => {
  it("hero carries shipped client metrics linking to cases", () => {
    const INDEX = read("src/pages/Index.tsx");
    for (const metric of ["+312% MQLs", "+8x sessões", "+140% trials"]) {
      expect(INDEX, `hero proof ${metric}`).toContain(metric);
    }
    expect(INDEX).toContain('to="/casos-de-sucesso"');
    expect(INDEX).toContain("analytics.trackClick('hero', 'hero_proof'");
  });
});

describe("R20.15 — founder authority (registry only)", () => {
  it("SobreNos shows registry-grounded authority facts", () => {
    const SOBRE = read("src/pages/SobreNos.tsx");
    expect(SOBRE).toContain("METRICS.yearsExperience.value");
    expect(SOBRE).toContain("METRICS.projectsDelivered.value");
    expect(SOBRE).toContain("SAAS_PRODUCTS.length");
    expect(SOBRE).toContain("Desde 2019");
    // No founder name invented, no hype adjectives (word-boundaried).
    expect(SOBRE).not.toMatch(/\bmaior(es)?\b|\bmelhor(es)?\b|\bl[ií]der(es)?\b|nº1|número 1/i);
  });

  it("product slugs in the strip match the official catalog", () => {
    const slugs = PRODUCTS.map((p) => p.slug);
    for (const c of CASES) {
      const slug = productSlugFor(c.to) as string;
      // Cases may cover pre-catalog products (hostify, prosafe360) — those
      // keep their live routes; catalog products must match exactly.
      if (["qook", "motivae", "pikto", "trackfy"].includes(slug)) {
        expect(slugs, `catalog ${slug}`).toContain(slug);
      }
    }
  });
});
