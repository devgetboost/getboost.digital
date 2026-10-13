import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  ACTION_STAGE,
  PRODUCT_ASSESSMENT,
  PRODUCT_DEMAND_STAGES,
  PRODUCT_TAXONOMY,
  assessmentForProduct,
  buildProductDossier,
  getProductDossiers,
  getProductLandingAudit,
  getProductNetwork,
  getWaitlistProducts,
  productViewPaths,
} from "../data/product-demand";
import { PRODUCTS, SAAS_PRODUCTS, PLATFORM_PRODUCTS } from "../data/products";
import { ASSESSMENTS, getAssessment } from "../lib/lead-magnets";
import { LANDINGS } from "../data/landings";
import {
  DEFAULT_SCORE_WEIGHTS,
  classifyDemand,
  getDemandDashboard,
  getDemandRanking,
  getProductAttribution,
  getProductCROInsights,
  getProductFunnel,
  getProductOpportunities,
  getCrmOpportunitySignals,
  scoreProductDemand,
  type ProductFunnel,
} from "../lib/product-intelligence";
import { getWaitlistBacklog, getWaitlistStats, waitlistPayload, waitlistStage } from "../lib/product-waitlist";
import { buildProductDemandReport, getDemandAnswers } from "../lib/product-demand-report";
import type { FunnelInputEvent } from "../lib/funnel-intelligence";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const ANALYTICS = read("src/lib/analytics.ts");
const INTELLIGENCE = read("src/lib/product-intelligence.ts");

const ROUTES = PRODUCTS.filter((p) => p.to).map((p) => p.to as string);
const ASSESSMENT_IDS = ASSESSMENTS.map((a) => a.id);
const ALL_SLUGS = PRODUCTS.map((p) => p.slug);

/**
 * R20.8 — Product Demand Generation guards.
 * Framework, landing audit, taxonomy, funnels, score engine, rankings, CRO,
 * waitlist, validation, opportunities, attribution, dashboard + CRM layer,
 * and the network/dossier integrity of the Authority layer. CI fails on
 * invented products, dead routes or phantom demand.
 */
describe("R20.8 — demand framework + taxonomy (Fases 1, 7)", () => {
  it("declares the official journey in order", () => {
    expect([...PRODUCT_DEMAND_STAGES]).toEqual([
      "view", "interest", "assessment", "lead", "booking", "meeting",
    ]);
  });

  it("declares the seven product_* taxonomy names", () => {
    expect(Object.keys(PRODUCT_TAXONOMY).sort()).toEqual(
      ["assessment", "booking", "click", "interest", "lead", "view", "waitlist"].sort(),
    );
    expect(Object.values(PRODUCT_TAXONOMY)).toContain("product_view");
    expect(Object.values(PRODUCT_TAXONOMY)).toContain("product_waitlist");
    expect(Object.values(PRODUCT_TAXONOMY)).toContain("product_booking");
  });

  it("maps every taxonomy action onto a stage (or explicitly none)", () => {
    for (const action of Object.keys(PRODUCT_TAXONOMY)) {
      expect(ACTION_STAGE).toHaveProperty(action);
    }
    expect(ACTION_STAGE.click).toBeNull();
    expect(ACTION_STAGE.booking).toBe("booking");
  });

  it("analytics keeps the existing event and widens the action union", () => {
    // Never renamed: same wire event, additive actions only.
    expect(ANALYTICS).toContain("name: 'product_interaction'");
    expect(ANALYTICS).toContain("trackProduct: (product: string, action: ProductAction, location: string)");
    expect(ANALYTICS).toContain("trackWaitlist:");
    expect(ANALYTICS).toContain("trackProductDemand:");
    expect(ANALYTICS).toContain("action: 'waitlist'");
  });
});

describe("R20.8 — product landing audit (Fase 5)", () => {
  const audits = getProductLandingAudit(ROUTES);

  it("classifies every catalog product", () => {
    expect(audits.map((a) => a.slug).sort()).toEqual([...ALL_SLUGS].sort());
    const exists = audits.filter((a) => a.landing === "LANDING_EXISTS");
    const missing = audits.filter((a) => a.landing === "LANDING_MISSING");
    expect(exists.length).toBe(4);
    expect(missing.length).toBe(4);
    expect(exists.every((a) => a.route !== null)).toBe(true);
    // Institutional-only products never gain a route here (R19.8 contract).
    for (const audit of missing) expect(audit.route).toBeNull();
  });

  it("never invents a route for a product without a landing page", () => {
    const withoutLanding = PRODUCTS.filter((p) => !p.to).map((p) => p.slug);
    for (const slug of withoutLanding) {
      const audit = audits.find((a) => a.slug === slug);
      expect(audit?.route, `${slug} route`).toBeNull();
      expect(audit?.viewPaths).toEqual([]);
    }
  });

  it("counts market twins as view paths for routable products", () => {
    const qook = PRODUCTS.find((p) => p.slug === "qook") as (typeof PRODUCTS)[number];
    expect(productViewPaths(qook)).toEqual(["/qook", "/br/qook", "/en/qook", "/es/qook"]);
    const alojify = PRODUCTS.find((p) => p.slug === "alojify") as (typeof PRODUCTS)[number];
    expect(productViewPaths(alojify)).toEqual([]);
  });

  it("marks a product missing when its route does not resolve", () => {
    const audits2 = getProductLandingAudit(ROUTES.filter((r) => r !== "/pikto"));
    expect(audits2.find((a) => a.slug === "pikto")?.landing).toBe("LANDING_MISSING");
  });
});

describe("R20.8 — waitlist engine (Fase 6)", () => {
  it("covers exactly the products without a landing page", () => {
    const waitlist = getWaitlistProducts();
    expect(waitlist.map((w) => w.slug).sort()).toEqual(
      ["alojify", "descobre-quem-tu-es", "guia-cities", "safely"].sort(),
    );
    expect(waitlist.every((w) => w.reason === "NO_LANDING")).toBe(true);
    // No waitlist candidate may also have a landing page.
    for (const candidate of waitlist) {
      expect(PRODUCTS.find((p) => p.slug === candidate.slug)?.to).toBeUndefined();
    }
  });

  it("walks the flow interest → waitlist → lead → future product", () => {
    expect(waitlistStage({ interest: 0, joined: 0, captured: 0, available: false })).toBe("NOT_JOINED");
    expect(waitlistStage({ interest: 3, joined: 0, captured: 0, available: false })).toBe("NOT_JOINED");
    expect(waitlistStage({ interest: 3, joined: 1, captured: 0, available: false })).toBe("WAITLISTED");
    expect(waitlistStage({ interest: 3, joined: 1, captured: 1, available: false })).toBe("CAPTURED");
    expect(waitlistStage({ interest: 0, joined: 0, captured: 0, available: true })).toBe("AVAILABLE");
  });

  it("emits PII-free tracking payloads", () => {
    const payload = waitlistPayload("alojify", "waitlist", "products_hub");
    expect(payload).toEqual({ product: "alojify", stage: "waitlist", location: "products_hub" });
    expect(JSON.stringify(payload)).not.toMatch(/email|phone|@/);
  });

  it("computes the waitlist funnel and backlog from events", () => {
    const events: FunnelInputEvent[] = [
      { name: "product_interaction", label: "alojify_click", data: { product: "alojify", action: "click" } },
      { name: "product_interaction", label: "alojify_waitlist", data: { product: "alojify", action: "waitlist" } },
      { name: "generate_lead", label: "waitlist", data: { product: "alojify" } },
      { name: "product_interaction", label: "safely_click", data: { product: "safely", action: "click" } },
    ];
    const stats = getWaitlistStats(events);
    const alojify = stats.find((s) => s.product.slug === "alojify");
    expect(alojify?.interest).toBe(1);
    expect(alojify?.joined).toBe(1);
    expect(alojify?.captured).toBe(1);
    expect(alojify?.stage).toBe("CAPTURED");
    expect(alojify?.joinRate).toBeNull(); // below the 20-interest floor
    const safely = stats.find((s) => s.product.slug === "safely");
    expect(safely?.stage).toBe("NOT_JOINED");
    // Backlog = no signal at all; safely already shows interest, so it leaves
    // the backlog without having joined.
    expect(getWaitlistBacklog(stats).map((s) => s.product.slug).sort()).toEqual(
      ["descobre-quem-tu-es", "guia-cities"].sort(),
    );
  });
});

describe("R20.8 — product assessment mapping (Fase 10)", () => {
  it("maps products only to real R20.4 engines", () => {
    expect(Object.keys(PRODUCT_ASSESSMENT).sort()).toEqual([...ALL_SLUGS].sort());
    for (const [slug, entry] of Object.entries(PRODUCT_ASSESSMENT)) {
      expect(ASSESSMENT_IDS, `${slug} engine`).toContain(entry.assessmentId);
      expect(getAssessment(entry.assessmentId), `${slug} engine resolves`).toBeTruthy();
      expect(entry.rationale.length, `${slug} rationale`).toBeGreaterThan(10);
      expect(assessmentForProduct(slug)).toBe(entry.assessmentId);
    }
    expect(assessmentForProduct("nao-existe")).toBeNull();
  });
});

describe("R20.8 — product funnel + score engine (Fases 2, 3, 8)", () => {
  const events: FunnelInputEvent[] = [
    { name: "page_view", path: "/qook" },
    { name: "page_view", path: "/qook" },
    { name: "page_view", path: "/br/qook" },
    { name: "product_interaction", label: "qook_click", data: { product: "qook", action: "click" } },
    { name: "product_interaction", label: "qook_interest", data: { product: "qook", action: "interest" } },
    { name: "product_interaction", label: "pikto_click", data: { product: "pikto", action: "click" } },
    { name: "assessment_start", label: "operations-score_start", data: { product: "qook" } },
    { name: "assessment_complete", label: "operations-score_complete", data: { product: "qook" } },
    { name: "generate_lead", label: "lead", data: { product: "qook" } },
    { name: "schedule_appointment", label: "booked", data: { journey: ["/qook", "/booking"] } },
  ];

  it("counts every official stage per product", () => {
    const funnels = getProductFunnel(events, getProductLandingAudit(ROUTES));
    const qook = funnels.qook as ProductFunnel;
    expect(qook.counts.view).toBe(3);
    expect(qook.counts.interest).toBe(2); // explicit interest + click
    expect(qook.counts.assessment).toBe(2);
    expect(qook.counts.lead).toBe(2); // assessment_complete + generate_lead
    expect(qook.counts.booking).toBe(1);
    expect(qook.counts.meeting).toBe(1);
    expect(qook.deepestStage).toBe("meeting");
    expect(qook.steps.map((s) => s.stage)).toEqual([...PRODUCT_DEMAND_STAGES]);
  });

  it("never reports demand for a product outside the catalog", () => {
    const funnels = getProductFunnel(
      [{ name: "product_interaction", label: "ghost_click", data: { product: "ghost", action: "click" } }],
      getProductLandingAudit(ROUTES),
    );
    expect(Object.keys(funnels).sort()).toEqual([...ALL_SLUGS].sort());
  });

  it("produces a 0–100 composite from the documented weights", () => {
    const funnels = getProductFunnel(events, getProductLandingAudit(ROUTES));
    const scores = scoreProductDemand(funnels);
    expect(scores.map((s) => s.slug)).toContain("qook");
    const qook = scores.find((s) => s.slug === "qook");
    expect(qook?.score).toBeGreaterThan(0);
    expect(qook?.score).toBeLessThanOrEqual(100);
    for (const score of scores) {
      for (const field of ["awareness", "interest", "intent", "lead", "commercial"] as const) {
        expect(score[field]).toBeGreaterThanOrEqual(0);
        expect(score[field]).toBeLessThanOrEqual(100);
      }
    }
    // Weights are documented and sum to 1.
    const total = Object.values(DEFAULT_SCORE_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
    expect(INTELLIGENCE).toContain("DEFAULT_SCORE_WEIGHTS");
  });

  it("gives zero-scoring products zero composite", () => {
    const funnels = getProductFunnel([], getProductLandingAudit(ROUTES));
    const scores = scoreProductDemand(funnels);
    expect(scores.every((s) => s.score === 0)).toBe(true);
  });
});

describe("R20.8 — ranking, CRO, validation, opportunities (Fases 4, 9, 16, 17)", () => {
  const events: FunnelInputEvent[] = [
    ...Array.from({ length: 120 }, () => ({ name: "page_view", path: "/qook" }) as FunnelInputEvent),
    ...Array.from({ length: 40 }, () => ({
      name: "product_interaction",
      label: "qook_interest",
      data: { product: "qook", action: "interest" },
    }) as FunnelInputEvent),
    { name: "generate_lead", label: "lead", data: { product: "qook" } },
    { name: "schedule_appointment", label: "booked", data: { journey: ["/qook", "/booking"] } },
    { name: "product_interaction", label: "pikto_click", data: { product: "pikto", action: "click" } },
  ];
  const audits = getProductLandingAudit(ROUTES);
  const funnels = getProductFunnel(events, audits);
  const scores = scoreProductDemand(funnels);

  it("ranks interest, leads, meetings, potential and conversion", () => {
    const ranking = getDemandRanking(funnels, scores);
    expect(ranking.topInterest).toBe("qook");
    expect(ranking.topLeads).toBe("qook");
    expect(ranking.topMeetings).toBe("qook");
    expect(ranking.topPotential).toBe("qook");
    expect(ranking.topConversion).toBe("qook");
  });

  it("classifies demand from behavior, not from catalog presence", () => {
    expect(classifyDemand(funnels.qook as ProductFunnel)).toBe("VALIDATED");
    expect(classifyDemand({
      ...(funnels.pikto as ProductFunnel),
      counts: { view: 10, interest: 5, assessment: 0, lead: 1, booking: 0, meeting: 0 },
    })).toBe("PROMISING");
    expect(classifyDemand({
      ...(funnels.pikto as ProductFunnel),
      counts: { view: 10, interest: 5, assessment: 0, lead: 0, booking: 0, meeting: 0 },
    })).toBe("EARLY_SIGNAL");
    expect(classifyDemand({
      ...(funnels.pikto as ProductFunnel),
      counts: { view: 0, interest: 0, assessment: 0, lead: 0, booking: 0, meeting: 0 },
    })).toBe("NO_SIGNAL");
  });

  it("flags leaks and intent strength per product", () => {
    const cro = getProductCROInsights(funnels);
    const qook = cro.find((c) => c.slug === "qook");
    expect(qook?.intentStrength).toBe("meeting");
    expect(cro).toHaveLength(ALL_SLUGS.length);
  });

  it("recommends without executing", () => {
    const opportunities = getProductOpportunities(funnels, scores, audits);
    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities.some((o) => o.type === "INVEST_ACQUISITION" && o.slug === "qook")).toBe(true);
    // Products with no landing surface always get a landing recommendation.
    const missing = audits.filter((a) => a.landing === "LANDING_MISSING").map((a) => a.slug);
    for (const slug of missing) {
      expect(opportunities.some((o) => o.slug === slug && o.type === "CREATE_LANDING"), slug).toBe(true);
    }
    for (const opportunity of opportunities) {
      expect(ALL_SLUGS).toContain(opportunity.slug);
      expect([1, 2, 3]).toContain(opportunity.priority);
      expect(opportunity.reason.length).toBeGreaterThan(10);
    }
    // Deterministic order.
    expect(getProductOpportunities(funnels, scores, audits)).toEqual(opportunities);
  });
});

describe("R20.8 — attribution (Fase 15)", () => {
  it("resolves the surfaces that drove a product from the journey", () => {
    const audits = getProductLandingAudit(ROUTES);
    const events: FunnelInputEvent[] = [
      {
        name: "generate_lead",
        label: "lead",
        data: {
          product: "motivae",
          assessment: "growth-score",
          journey: ["/growth-system", "/solucoes/marketing-digital", "/portfolio/motivae", "/motivae"],
        },
      },
    ];
    const attribution = getProductAttribution(events, audits, {
      landingPrefix: "/growth-system",
      pillarRoutes: ["/solucoes/marketing-digital"],
    });
    expect(attribution.motivae.landing).toBe("/growth-system");
    expect(attribution.motivae.pillar).toBe("/solucoes/marketing-digital");
    expect(attribution.motivae.case).toBe("/portfolio/motivae");
    expect(attribution.motivae.assessment).toBe("growth-score");
  });

  it("never attributes a case to an unrelated product", () => {
    const audits = getProductLandingAudit(ROUTES);
    const events: FunnelInputEvent[] = [
      {
        name: "generate_lead",
        label: "lead",
        data: { product: "pikto", journey: ["/portfolio/hostify", "/pikto"] },
      },
    ];
    const attribution = getProductAttribution(events, audits, { pillarRoutes: [] });
    expect(attribution.pikto.case).toBeNull();
    expect(attribution.pikto.landing).toBeNull();
  });
});

describe("R20.8 — dashboard + CRM layer (Fases 12, 13)", () => {
  const audits = getProductLandingAudit(ROUTES);
  const funnels = getProductFunnel([
    { name: "page_view", path: "/qook" },
    { name: "product_interaction", label: "qook_interest", data: { product: "qook", action: "interest" } },
    { name: "generate_lead", label: "lead", data: { product: "qook" } },
  ], audits);
  const scores = scoreProductDemand(funnels);

  it("produces dashboard rows for every product, no UI", () => {
    const dashboard = getDemandDashboard(funnels, scores);
    expect(dashboard).toHaveLength(ALL_SLUGS.length);
    for (const row of dashboard) {
      expect(row.demandScore).toBeGreaterThanOrEqual(0);
      expect(row.conversionScore).toBeGreaterThanOrEqual(0);
      expect(["VALIDATED", "PROMISING", "EARLY_SIGNAL", "NO_SIGNAL"]).toContain(row.validation);
    }
    expect(dashboard[0].slug).toBe("qook");
  });

  it("produces CRM-ready product → lead → pipeline signals", () => {
    const crm = getCrmOpportunitySignals(funnels, scores);
    expect(crm).toHaveLength(1);
    expect(crm[0]).toMatchObject({ product: "qook", stage: "LEAD" });
    expect(crm[0].score).toBeGreaterThan(0);
    expect(new Date(crm[0].generatedAt).toISOString()).toBe(crm[0].generatedAt);
    expect(JSON.stringify(crm)).not.toMatch(/email|phone|@/);
  });
});

describe("R20.8 — network + dossiers (Fases 11, 14)", () => {
  const audits = getProductLandingAudit(ROUTES);
  const caseNarratives = [
    { slug: "qook", to: "/qook" },
    { slug: "trackfy", to: "/trackfy" },
  ];
  const network = getProductNetwork(caseNarratives);

  it("connects each product to real cases, pillars, landings and engines", () => {
    expect(network.map((n) => n.slug).sort()).toEqual([...ALL_SLUGS].sort());
    for (const node of network) {
      expect(SAAS_PRODUCTS.map((p) => p.slug).concat(PLATFORM_PRODUCTS.map((p) => p.slug))).toContain(node.slug);
      if (node.route) expect(ROUTES).toContain(node.route);
      for (const landing of node.landings) {
        expect(LANDINGS.map((l) => l.slug)).toContain(landing);
      }
      if (node.assessment) expect(ASSESSMENT_IDS).toContain(node.assessment);
    }
    expect(network.find((n) => n.slug === "qook")?.cases).toEqual(["qook"]);
    expect(network.find((n) => n.slug === "qook")?.pillars.length).toBeGreaterThan(0);
  });

  it("dossiers never invent positioning the catalog cannot support", () => {
    const dossiers = getProductDossiers(audits);
    expect(dossiers).toHaveLength(ALL_SLUGS.length);
    const alojify = dossiers.find((d) => d.slug === "alojify");
    expect(alojify?.value).toBeNull();
    expect(alojify?.missingFields).toContain("value");
    expect(alojify?.channel).toBe("waitlist");
    const qook = dossiers.find((d) => d.slug === "qook");
    expect(qook?.value).toBe(PRODUCTS.find((p) => p.slug === "qook")?.tagline);
    expect(qook?.missingFields).toEqual([]);
    expect(qook?.channel).toBe("landing");
    // Every dossier field traces back to the catalog record.
    for (const dossier of dossiers) {
      const product = PRODUCTS.find((p) => p.slug === dossier.slug) as (typeof PRODUCTS)[number];
      expect(dossier.value).toBe(product.tagline ?? null);
      expect(dossier.problem).toBe(product.description ?? null);
      expect(dossier.state).toBe(product.status ?? null);
    }
  });

  it("buildProductDossier reports every unsupported field", () => {
    const audit = audits.find((a) => a.slug === "guia-cities") as (typeof audits)[number];
    const dossier = buildProductDossier(audit);
    expect(dossier.missingFields).toEqual(expect.arrayContaining(["icp", "market", "value", "problem", "state"]));
  });
});

describe("R20.8 — demand report (approval questions)", () => {
  const events: FunnelInputEvent[] = [
    ...Array.from({ length: 120 }, () => ({ name: "page_view", path: "/qook" }) as FunnelInputEvent),
    { name: "product_interaction", label: "qook_interest", data: { product: "qook", action: "interest" } },
    { name: "generate_lead", label: "lead", data: { product: "qook" } },
    { name: "schedule_appointment", label: "booked", data: { journey: ["/qook", "/booking"] } },
  ];

  it("answers every Fase question in one call", () => {
    const report = buildProductDemandReport(events);
    const answers = getDemandAnswers(report);
    expect(report.audits).toHaveLength(ALL_SLUGS.length);
    expect(report.dashboard).toHaveLength(ALL_SLUGS.length);
    expect(report.waitlists).toHaveLength(4);
    expect(answers.topLeads).toBe("qook");
    expect(answers.topMeetings).toBe("qook");
    expect(answers.needLanding.sort()).toEqual(
      ["alojify", "descobre-quem-tu-es", "guia-cities", "safely"].sort(),
    );
    expect(answers.needValidation.length).toBeGreaterThan(0);
    for (const slug of [...answers.needLanding, ...answers.needValidation]) {
      expect(ALL_SLUGS).toContain(slug);
    }
  });

  it("stays pure: identical input yields identical output", () => {
    const a = buildProductDemandReport(events);
    const b = buildProductDemandReport(events);
    expect(JSON.stringify(a.scores)).toBe(JSON.stringify(b.scores));
    expect(JSON.stringify(a.opportunities)).toBe(JSON.stringify(b.opportunities));
    expect(INTELLIGENCE).toContain("no DOM, no storage");
  });

  it("reports zero demand for the whole catalog on an empty stream", () => {
    const report = buildProductDemandReport([]);
    const answers = getDemandAnswers(report);
    expect(report.scores.every((s) => s.score === 0)).toBe(true);
    // No demand observed must never crown a product.
    expect(answers.topDemand).toBeNull();
    expect(answers.topLeads).toBeNull();
    expect(answers.topMeetings).toBeNull();
    expect(answers.topConversion).toBeNull();
    expect(answers.topInvestment).toBeNull();
    expect(answers.campaignReady).toEqual([]);
    expect(report.crm).toEqual([]);
    // Everything is still flagged as needing validation.
    expect(answers.needValidation).toHaveLength(ALL_SLUGS.length);
  });
});
