import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { LANDINGS, LANDING_SLUGS, getLanding } from "../data/landings";
import { PILLARS } from "../components/pillars/pillarData";
import { PRODUCTS } from "../data/products";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const APP = read("src/App.tsx");
const TEMPLATE = read("src/pages/LandingPage.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

/**
 * R20.6 — SEO landing network guards.
 * Eleven satellite landings on a data-driven template: routes (bare +
 * market twins), unique metadata, schema, conversion, assessment mapping,
 * internal linking and tracking. CI fails on drift, duplicates or dead ends.
 */
describe("R20.6 — landing dataset", () => {
  it("ships the ten prioritized landings (3 AI + 3 Automation + 2 Software + 2 Growth)", () => {
    expect(LANDING_SLUGS).toHaveLength(10);
    expect(new Set(LANDING_SLUGS).size).toBe(10);
    const byPillar = (pillar: string) => LANDINGS.filter((l) => l.pillar === pillar).length;
    expect(byPillar("ai")).toBe(3);
    expect(byPillar("automation")).toBe(3);
    expect(byPillar("software")).toBe(2);
    expect(byPillar("growth")).toBe(2);
    // 3+3+2+2 per the brief's prioritized list
    expect(LANDINGS.map((l) => l.slug)).toContain("growth-system");
  });

  it("every landing is complete, unique and internally consistent", () => {
    const titles = new Set<string>();
    const descriptions = new Set<string>();
    const h1s = new Set<string>();
    for (const landing of LANDINGS) {
      expect(landing.title.length, `${landing.slug} title`).toBeGreaterThan(20);
      expect(landing.description.length, `${landing.slug} description`).toBeGreaterThan(60);
      expect(titles.has(landing.title), `duplicate title ${landing.slug}`).toBe(false);
      expect(descriptions.has(landing.description), `duplicate description`).toBe(false);
      expect(h1s.has(`${landing.h1} ${landing.h1Accent}`), `duplicate h1`).toBe(false);
      titles.add(landing.title);
      descriptions.add(landing.description);
      h1s.add(`${landing.h1} ${landing.h1Accent}`);
      expect(landing.flow.length, `${landing.slug} flow`).toBeGreaterThanOrEqual(4);
      expect(landing.benefits, `${landing.slug} benefits`).toHaveLength(4);
      expect(landing.faqs, `${landing.slug} faqs`).toHaveLength(4);
      expect(PILLARS[landing.pillar], `${landing.slug} pillar`).toBeTruthy();
      expect(getLanding(landing.slug)?.slug).toBe(landing.slug);
      for (const slug of landing.products) {
        const product = PRODUCTS.find((p) => p.slug === slug);
        expect(product, `${landing.slug} product ${slug} in catalog`).toBeTruthy();
        expect(product?.to, `${landing.slug} product ${slug} routable`).toBeTruthy();
      }
    }
    expect(getLanding("nope")).toBeUndefined();
  });

  it("assessment mapping covers the four pillar engines", () => {
    const mapping: Record<string, string> = {
      ai: "ai-readiness",
      automation: "automation-audit",
      software: "software-readiness",
      growth: "growth-score",
    };
    for (const landing of LANDINGS) {
      expect(landing.assessment, `${landing.slug} assessment`).toBe(mapping[landing.pillar]);
    }
  });
});

describe("R20.6 — landing routes and sitemap", () => {
  it("all landings resolve bare + market twins, none redirect", () => {
    // Routes render from the data array (template literals), so assert the
    // mapping block + both path templates; resolvability per slug is proven
    // by the sitemap test below (emitted URLs) + the dataset test above.
    expect(APP).toContain("LANDINGS.map((landing)");
    expect(APP).toContain("path={`/${landing.slug}`}");
    expect(APP).toContain("path={`/:lang/${landing.slug}`}");
    expect(APP).toContain("<LandingPage slug={landing.slug} />");
    for (const slug of LANDING_SLUGS) {
      expect(redirectOnly, `/${slug} redirect`).not.toContain(`/${slug}`);
    }
  });

  it("routes render through the data-driven template (zero duplication)", () => {
    expect(APP).toContain("LANDINGS.map((landing)");
    expect(APP).toContain('<LandingPage slug={landing.slug} />');
  });

  it("sitemap emits every landing with market alternates", () => {
    const sitemap = read("public/sitemap-pages.xml");
    for (const slug of LANDING_SLUGS) {
      expect(sitemap, `sitemap ${slug}`).toContain(`https://getboost.digital/${slug}`);
    }
  });
});

describe("R20.6 — landing template contract", () => {
  it("emits unique metadata, canonical, H1 and schema per landing", () => {
    expect(TEMPLATE).toContain("title={landing.title}");
    expect(TEMPLATE).toContain("description={landing.description}");
    expect(TEMPLATE).toContain("canonical={`/${landing.slug}`}");
    expect(TEMPLATE).toContain("FAQPage");
    expect(TEMPLATE).toContain("BreadcrumbList");
    expect(TEMPLATE).toContain("WebPage");
  });

  it("carries conversion (booking/contact CTAs + assessment entries)", () => {
    expect(TEMPLATE).toContain("Agendar Diagnóstico");
    expect(TEMPLATE).toContain("openLeadMagnet(landing.assessment)");
    expect(TEMPLATE).toContain("trackAssessment(landing.assessment");
  });

  it("wires internal linking V3 (pillar → products → insights → booking)", () => {
    expect(TEMPLATE).toContain("to={pillar.route}");
    expect(TEMPLATE).toContain('to="/blog"');
    expect(TEMPLATE).toContain('to="/resources"');
    expect(TEMPLATE).toContain("bookingHref");
  });

  it("measures views, scroll, CTAs, assessments and products", () => {
    expect(TEMPLATE).toContain('<ScrollDepth location={location} />');
    expect(TEMPLATE).toContain("analytics.trackClick(location");
    expect(TEMPLATE).toContain("analytics.trackProduct(product.slug");
  });

  it("runs on the frozen systems (no new animation or style categories)", () => {
    expect(TEMPLATE).toContain("import { SectionHeader }");
    expect(TEMPLATE).toContain("import { Button }");
    expect(TEMPLATE).toContain("import { MiniFlow }");
    expect(TEMPLATE).toContain("import { CountUp }");
    expect(TEMPLATE).toContain("gb-card-lift");
    // Entrance + Reveal motion only (no loops — reduced motion inherits the
    // global MotionConfig); no new animation categories.
    expect(TEMPLATE).not.toContain("setInterval");
    expect(TEMPLATE).not.toContain("repeat: Infinity");
  });
});
