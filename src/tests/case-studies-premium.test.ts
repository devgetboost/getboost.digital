import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CASE_FRAMEWORK,
  assessmentForCase,
  catalogSlugs,
  pillarForCase,
  pillarRoute,
  presentText,
  productForClient,
  productPillars,
  renderableResults,
  ASSESSMENT_FALLBACK,
  PILLAR_ASSESSMENT,
  PILLAR_KEYWORDS,
} from "../data/case-framework";
import { PILLARS, type PillarId } from "../components/pillars/pillarData";
import { PRODUCTS } from "../data/products";
import { ASSESSMENTS, getAssessment } from "../lib/lead-magnets";
import { caseForEvent, caseFromJourney, caseSlugFromPath, getCaseIntelligence, getCaseStats } from "../lib/case-intelligence";
import type { FunnelInputEvent } from "../lib/funnel-intelligence";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const CASES = read("src/pages/CasosSucesso.tsx");
// R20.15 — narratives live in the shared engine; the hub must consume them.
const ENGINE = read("src/data/cases.ts");
const DETAIL = read("src/pages/PortfolioDetail.tsx");
const PORTFOLIO = read("src/pages/Portfolio.tsx");
const FRAMEWORK = read("src/data/case-framework.ts");
const INTELLIGENCE = read("src/lib/case-intelligence.ts");
const APP = read("src/App.tsx");
const appRoutes = [...APP.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]);
const redirectOnly = [...APP.matchAll(/<Route\s+path="([^"]+)"\s+element=\{<Navigate/g)].map((m) => m[1]);

const ASSESSMENT_IDS = ASSESSMENTS.map((a) => a.id);

/**
 * R20.7 — Case Studies Premium guards.
 * Framework integrity, dataset honesty, template sections, schema, SEO,
 * conversion + assessment coverage, tracking, internal linking and the pure
 * case-intelligence layer. CI fails on invented proof or dead links.
 */
describe("R20.7 — case study framework", () => {
  it("declares the official seven-stage framework", () => {
    expect(CASE_FRAMEWORK.map((s) => s.id)).toEqual([
      "contexto",
      "desafio",
      "diagnostico",
      "solucao",
      "implementacao",
      "resultado",
      "proximos-passos",
    ]);
    expect(CASE_FRAMEWORK.every((s) => s.label.length > 0)).toBe(true);
  });

  it("renders CMS results without inventing content", () => {
    expect(renderableResults("+312% MQLs")).toEqual(["+312% MQLs"]);
    expect(renderableResults(["a", "", 3, "b"])).toEqual(["a", "b"]);
    expect(renderableResults({ unexpected: true })).toEqual([]);
    expect(renderableResults(null)).toEqual([]);
    expect(presentText("  texto  ")).toBe("texto");
    expect(presentText("   ")).toBeNull();
    expect(presentText(null)).toBeNull();
  });

  it("derives product → pillar relationships from the pillar dataset", () => {
    const slugs = catalogSlugs();
    expect(slugs.length).toBeGreaterThan(0);
    for (const slug of slugs) {
      const pillars = productPillars(slug);
      for (const pillar of pillars) {
        expect(PILLARS[pillar], `pillar ${pillar}`).toBeTruthy();
        expect(pillarRoute(pillar)).toBe(PILLARS[pillar].route);
      }
    }
    expect(productPillars("nao-existe")).toEqual([]);
  });

  it("matches products by exact client name only (no invented proof links)", () => {
    expect(productForClient("Qook")?.slug).toBe("qook");
    expect(productForClient("motivae")?.slug).toBe("motivae");
    expect(productForClient("Hostify")).toBeNull();
    expect(productForClient("Clientes Diversos")).toBeNull();
    expect(productForClient("")).toBeNull();
    expect(productForClient(null)).toBeNull();
  });
});

describe("R20.7 — contextual assessment mapping", () => {
  it("only maps to real engines from R20.4", () => {
    expect(Object.values(PILLAR_ASSESSMENT)).toEqual([
      "ai-readiness",
      "automation-audit",
      "software-readiness",
      "growth-score",
    ]);
    expect(ASSESSMENT_IDS).toContain(ASSESSMENT_FALLBACK);
    for (const id of [...Object.values(PILLAR_ASSESSMENT), ASSESSMENT_FALLBACK]) {
      expect(ASSESSMENT_IDS, `assessment ${id}`).toContain(id);
    }
  });

  it("routes case evidence to the matching pillar engine", () => {
    expect(assessmentForCase(["Agentes de IA"], ["LLM"])).toBe("ai-readiness");
    expect(assessmentForCase(["Automação de workflows"], ["n8n"])).toBe("automation-audit");
    expect(assessmentForCase(["Desenvolvimento de software"], ["SaaS"])).toBe("software-readiness");
    expect(assessmentForCase(["SEO técnico"], ["Campanhas"])).toBe("growth-score");
  });

  it("falls back to the neutral operations score without evidence", () => {
    expect(assessmentForCase([], [])).toBe(ASSESSMENT_FALLBACK);
    expect(assessmentForCase(["Fotografia"], ["Illustrator"])).toBe(ASSESSMENT_FALLBACK);
    expect(pillarForCase([], [])).toBeNull();
    expect(pillarForCase(["SEO técnico"], [])).toBe("growth");
  });

  it("every pillar declares keyword evidence (no empty rule)", () => {
    for (const pillar of Object.keys(PILLARS) as PillarId[]) {
      expect(PILLAR_KEYWORDS[pillar].length, `keywords ${pillar}`).toBeGreaterThan(0);
    }
  });
});

describe("R20.7 — cases hub (CasosSucesso)", () => {
  it("keeps the six shipped narratives verbatim and premium", () => {
    for (const narrative of [
      "Hostify — do produto ao pipeline",
      "Qook — POS que se vende sozinho",
      "Motivae — plataforma que gera adesão",
      "ProSafe360 — narrativa que vende compliance",
      "Pikto — do editor ao ecossistema",
      "Trackfy — tecnologia acessível para PMEs",
    ]) {
      expect(ENGINE, narrative).toContain(narrative);
    }
    // The hub consumes the engine instead of duplicating copy.
    expect(CASES).toContain("from '@/data/cases'");
    // Presentation upgraded, legacy dark surfaces removed.
    expect(CASES).toContain("gb-surface-page");
    expect(CASES).not.toContain("bg-[#0a0603]");
  });

  it("derives hero stats from the brand registry (no conflicting claims)", () => {
    expect(CASES).toContain("METRICS.projectsDelivered.value");
    expect(CASES).toContain("'90d', v: 'Do briefing ao live'");
    expect(CASES).not.toContain("k: '+40");
  });

  it("links each case to its product route and derived pillars", () => {
    expect(CASES).toContain("productSlugFor(f.to)");
    expect(CASES).toContain("productPillars(productSlug)");
    expect(CASES).toContain("pillarRoute(pillar)");
    const caseTargets = [...ENGINE.matchAll(/to: '(\/[^']+)'/g)].map((m) => m[1]);
    expect(caseTargets.length).toBe(6);
    for (const target of caseTargets) {
      expect(appRoutes, `case target ${target}`).toContain(target);
      expect(redirectOnly, `case target ${target} redirects`).not.toContain(target);
    }
  });

  it("carries schema, scroll tracking and the three-layer conversion", () => {
    expect(CASES).toContain("BreadcrumbList");
    expect(CASES).toContain("'@type': 'WebPage'");
    expect(CASES).toContain('<ScrollDepth location="cases" />');
    expect(CASES).toContain('canonical="/casos-de-sucesso"');
    expect(CASES).toContain("Agendar Diagnóstico");
    expect(CASES).toContain("Falar com Especialista");
    expect(CASES).toContain("analytics.trackAssessment('operations-score'");
    expect(CASES).toContain("openLeadMagnet('operations-score')");
    expect(CASES).toContain("<CommercialAuditModal");
  });

  it("runs on the frozen systems", () => {
    expect(CASES).toContain("import { SectionHeader }");
    expect(CASES).toContain("import { Button }");
    expect(CASES).not.toContain("setInterval");
    expect(CASES).not.toContain("repeat: Infinity");
  });
});

describe("R20.7 — case detail template (PortfolioDetail)", () => {
  it("renders the framework stages in order, conditional on data", () => {
    const order = [
      "01 HERO",
      "02 RESUMO",
      "03 DESAFIO",
      "04 ABORDAGEM",
      "05 ARQUITETURA",
      "06 EXECUÇÃO",
      "07 RESULTADO",
      "08 CTA",
    ];
    const positions = order.map((marker) => {
      const at = DETAIL.indexOf(marker);
      expect(at, `section ${marker} missing`).toBeGreaterThan(-1);
      return at;
    });
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    // Conditional rendering: no stage shows without CMS data.
    expect(DETAIL).toContain("{challenge && (");
    expect(DETAIL).toContain("{strategy && (");
    expect(DETAIL).toContain("{solution && (");
    expect(DETAIL).toContain("resultItems.length > 0 && (");
  });

  it("uses CMS seo fields with visible fallbacks and valid schema", () => {
    expect(DETAIL).toContain("presentText(study.seoTitle) ?? project.title");
    expect(DETAIL).toContain("presentText(study.seoDescription) ?? project.description");
    expect(DETAIL).toContain("canonical={`/portfolio/${project.slug}`}");
    expect(DETAIL).toContain("'@type': 'Article'");
    expect(DETAIL).toContain("'@type': 'BreadcrumbList'");
    expect(DETAIL).toContain("'@type': 'WebPage'");
    expect(DETAIL).toContain("datePublished: project.year || undefined");
  });

  it("carries the three-layer conversion layer", () => {
    expect(DETAIL).toContain('to="/booking"');
    expect(DETAIL).toContain('to="/contact"');
    expect(DETAIL).toContain("openAssessment(`case:${project.slug}`)");
    expect(DETAIL).toContain("assessmentMeta?.cta");
    expect(DETAIL).toContain("openLeadMagnet(assessmentId)");
    expect(DETAIL).toContain("<CommercialAuditModal");
  });

  it("wires internal linking (portfolio → pillar → product → cases hub)", () => {
    expect(DETAIL).toContain('to="/portfolio"');
    expect(DETAIL).toContain('to="/casos-de-sucesso"');
    expect(DETAIL).toContain("to={casePillarHref}");
    expect(DETAIL).toContain("to={caseProduct.to}");
    for (const dest of ["/portfolio", "/casos-de-sucesso", "/booking", "/contact"]) {
      expect(appRoutes, `case link ${dest}`).toContain(dest);
      expect(redirectOnly, `case link ${dest} redirects`).not.toContain(dest);
    }
  });

  it("measures everything (views, per-case scroll, CTAs, assessments)", () => {
    expect(DETAIL).toContain("<ScrollDepth location={`case_${project.slug}`} />");
    expect(DETAIL).toContain("{ case: project.slug }");
    expect(DETAIL).toContain("analytics.trackAssessment(assessmentId");
    expect(DETAIL).toContain("analytics.trackProduct(caseProduct.slug");
  });

  it("keeps the carousel out of the premium template", () => {
    expect(DETAIL).not.toContain("Carousel");
    expect(DETAIL).not.toContain("embla");
    expect(DETAIL).not.toContain("TrendingUp");
  });
});

describe("R20.7 — portfolio hub evolution", () => {
  it("separates cases, products and implementations with anchors", () => {
    expect(PORTFOLIO).toContain('id="casos"');
    expect(PORTFOLIO).toContain('id="produtos"');
    expect(PORTFOLIO).toContain('id="implementacoes"');
    expect(PORTFOLIO).toContain("02B PROOF HUB");
    expect(PORTFOLIO).toContain("proofLanes");
    for (const anchor of ["#casos", "#produtos", "#implementacoes"]) {
      expect(PORTFOLIO, `anchor ${anchor}`).toContain(`anchor: '${anchor}'`);
    }
  });

  it("the proof-hub routes resolve and are tracked", () => {
    expect(PORTFOLIO).toContain("portfolio_hub_${lane.id}");
    for (const dest of ["/casos-de-sucesso", "/produtos"]) {
      expect(appRoutes, `proof lane ${dest}`).toContain(dest);
      expect(redirectOnly, `proof lane ${dest} redirects`).not.toContain(dest);
    }
  });

  it("preserves the R19.3 SEO block byte-identical", () => {
    expect(PORTFOLIO).toContain('canonical="/portfolio"');
    expect(PORTFOLIO).toContain('title={`${t(\'portfolio.title\')} — Marketing Digital`}');
  });
});

describe("R20.7 — case intelligence", () => {
  const events: FunnelInputEvent[] = [
    { name: "page_view", path: "/portfolio/qook" },
    { name: "page_view", path: "/portfolio/qook" },
    { name: "page_view", path: "/portfolio/pikto" },
    { name: "cta_click", category: "case_detail", label: "booking", data: { case: "qook" } },
    { name: "cta_click", category: "case_detail", label: "contact", data: { case: "pikto" } },
    { name: "scroll_depth", category: "scroll", label: "case_qook_100" },
    { name: "scroll_depth", category: "scroll", label: "case_pikto_50" },
    { name: "assessment_start", label: "growth-score_start", data: { source: "case:pikto" } },
    {
      name: "schedule_appointment",
      category: "booking",
      label: "booked",
      data: { journey: ["/portfolio/qook", "/booking"] },
    },
  ];

  it("resolves slugs from paths and journeys", () => {
    expect(caseSlugFromPath("/portfolio/qook")).toBe("qook");
    expect(caseSlugFromPath("/portfolio/qook/")).toBe("qook");
    expect(caseSlugFromPath("/portfolio")).toBeNull();
    expect(caseSlugFromPath("/qook")).toBeNull();
    expect(caseSlugFromPath(undefined)).toBeNull();
    expect(caseFromJourney(["/", "/portfolio/qook", "/booking"])).toBe("qook");
    expect(caseFromJourney(["/booking"])).toBeNull();
    expect(caseFromJourney("nope")).toBeNull();
  });

  it("attributes events by stamp, source, journey then path", () => {
    expect(caseForEvent({ name: "cta_click", data: { case: "qook" } })).toBe("qook");
    expect(caseForEvent({ name: "assessment_start", data: { source: "case:pikto" } })).toBe("pikto");
    expect(caseForEvent({ name: "assessment_start", data: { source: "case_final:pikto" } })).toBe("pikto");
    expect(caseForEvent({ name: "page_view", path: "/portfolio/motivae" })).toBe("motivae");
    expect(caseForEvent({ name: "page_view", path: "/" })).toBeNull();
  });

  it("computes per-case stats deterministically", () => {
    const stats = getCaseStats(events);
    expect(stats.map((s) => s.slug)).toEqual(["pikto", "qook"]);
    const qook = stats.find((s) => s.slug === "qook");
    expect(qook?.views).toBe(2);
    expect(qook?.ctaClicks).toBe(1);
    expect(qook?.maxScroll).toBe(100);
    expect(qook?.meetings).toBe(1);
    expect(qook?.ctr).toBeNull(); // < 100 views: sample too small
    const pikto = stats.find((s) => s.slug === "pikto");
    expect(pikto?.assessments).toBe(1);
    expect(pikto?.maxScroll).toBe(50);
  });

  it("answers the four intelligence questions", () => {
    const report = getCaseIntelligence(events);
    expect(report.topInterest).toBe("qook");
    expect(report.topScroll).toBe("qook");
    expect(report.topMeetings).toBe("qook");
    expect(report.topLeads).toBeNull();
    expect(report.topConversion).toBeNull();
    expect(report.stats).toHaveLength(2);
  });

  it("reports CTR only above the sample floor and is PII-free", () => {
    const heavy: FunnelInputEvent[] = [];
    for (let i = 0; i < 100; i += 1) heavy.push({ name: "page_view", path: "/portfolio/qook" });
    for (let i = 0; i < 10; i += 1) heavy.push({ name: "cta_click", data: { case: "qook" } });
    const stats = getCaseStats(heavy);
    expect(stats[0].ctr).toBe(0.1);
    expect(INTELLIGENCE).toContain("never person counts");
    expect(JSON.stringify(stats)).not.toMatch(/email|phone|name|@/);
  });
});
