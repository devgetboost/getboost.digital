import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  EMPTY_DATASET,
  buildDashboardData,
  getAlerts,
  getExecutiveView,
  getInsights,
  getLeadMagnetView,
  getLeadSources,
  getMarketingView,
  getSeoView,
  getTopPerformers,
  parseDataset,
} from "../lib/dashboard-data";
import { buildCrmRecords } from "../lib/crm-qualification";
import { buildProductDemandReport } from "../lib/product-demand-report";
import { LANDINGS } from "../data/landings";
import { ASSESSMENTS } from "../lib/lead-magnets";
import type { FunnelInputEvent } from "../lib/funnel-intelligence";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const readIfExists = (rel: string): string | null => (existsSync(join(root, rel)) ? read(rel) : null);
const PAGE = read("src/pages/Dashboard.tsx");
const APP = read("src/App.tsx");
const DATA = read("src/lib/dashboard-data.ts");

/** A small but complete dataset: views, landing, product, assessment, lead, meeting. */
const SAMPLE: FunnelInputEvent[] = [
  { name: "page_view", path: "/" },
  { name: "page_view", path: "/ai-agentes-imobiliario" },
  { name: "page_view", path: "/qook" },
  { name: "page_view", path: "/qook" },
  { name: "page_view", path: "/agentes-ia" },
  { name: "cta_click", category: "hero", label: "booking" },
  { name: "product_interaction", category: "products", label: "qook_click", data: { product: "qook", action: "click" } },
  { name: "scroll_depth", category: "scroll", label: "case_qook_100" },
  { name: "cta_click", category: "case_detail", label: "booking", data: { case: "qook" } },
  { name: "assessment_start", category: "lead_magnet", label: "ai-readiness_start" },
  { name: "assessment_complete", category: "lead_magnet", label: "ai-readiness_complete" },
  {
    name: "assessment_lead_capture",
    category: "lead_magnet",
    label: "ai-readiness_lead_capture",
    data: {
      assessment: "ai-readiness",
      score: 82,
      tier: "avancado",
      product: "qook",
      journey: ["/", "/ai-agentes-imobiliario", "/agentes-ia", "/qook"],
    },
  },
  {
    name: "schedule_appointment",
    category: "booking",
    label: "booking_success",
    data: { journey: ["/", "/ai-agentes-imobiliario", "/agentes-ia", "/qook", "/booking"] },
  },
];

const data = buildDashboardData({ events: SAMPLE, generatedAt: '2026-01-01T00:00:00.000Z', source: 'test' });
const empty = buildDashboardData(EMPTY_DATASET);

/**
 * R20.12 — Revenue Dashboard guards.
 * Dataset parsing, every panel, rankings, top performers, alerts, insights,
 * the internal route and its lazy boundary. The overriding gate: the
 * dashboard must never invent a number.
 */
describe("R20.12 — dataset handling", () => {
  it("accepts an array, {events} and {data} exports", () => {
    expect(parseDataset(JSON.stringify(SAMPLE))?.events).toHaveLength(SAMPLE.length);
    expect(parseDataset(JSON.stringify({ events: SAMPLE }))?.events).toHaveLength(SAMPLE.length);
    expect(parseDataset(JSON.stringify({ data: SAMPLE }))?.events).toHaveLength(SAMPLE.length);
  });

  it("rejects malformed input instead of guessing", () => {
    expect(parseDataset("not json")).toBeNull();
    expect(parseDataset('{"foo":1}')).toBeNull();
    expect(parseDataset('[{"no":"name"}]')?.events).toEqual([]);
    expect(parseDataset('[]')?.events).toEqual([]);
  });
});

describe("R20.12 — executive view (Fase 2)", () => {
  it("counts only what the dataset contains", () => {
    const kpis = Object.fromEntries(data.executive.kpis.map((kpi) => [kpi.key, kpi.value]));
    expect(kpis.traffic).toBe(5);
    expect(kpis.interesse).toBe(1);
    expect(kpis.leads).toBe(2);
    expect(kpis['oportunidades']).toBe(1);
    expect(kpis['reuniões']).toBe(1);
    for (const kpi of data.executive.kpis) {
      expect(Number.isFinite(kpi.value), kpi.key).toBe(true);
    }
  });

  it("reports zeros on an empty dataset", () => {
    for (const kpi of empty.executive.kpis) expect(kpi.value).toBe(0);
    expect(empty.executive.topPages).toEqual([]);
    expect(empty.executive.topAssessments).toEqual([]);
  });
});

describe("R20.12 — marketing view (Fase 3)", () => {
  it("reports funnel, landings and scroll", () => {
    expect(data.marketing.traffic).toBe(5);
    expect(data.marketing.funnel.ctaClicks).toBe(2);
    const landing = data.marketing.landings.find((row) => row.slug === "ai-agentes-imobiliario");
    expect(landing?.views).toBe(1);
    // Both lead units (capture + booking) passed through this landing.
    expect(landing?.leads).toBe(2);
    expect(data.marketing.scroll[0].location).toBe("case_qook");
    // Every landing in the network is listed, even with zero views.
    expect(data.marketing.landings).toHaveLength(LANDINGS.length);
  });
});

describe("R20.12 — lead magnet view (Fase 4)", () => {
  it("lists every engine with real counts and rates", () => {
    expect(data.leadMagnets.rows).toHaveLength(ASSESSMENTS.length);
    const ai = data.leadMagnets.rows.find((row) => row.id === "ai-readiness");
    expect(ai?.starts).toBe(1);
    expect(ai?.completes).toBe(1);
    expect(ai?.captures).toBe(1);
    expect(ai?.completionRate).toBe(1);
    const untouched = data.leadMagnets.rows.find((row) => row.id === "growth-score");
    expect(untouched?.starts).toBe(0);
    expect(untouched?.completionRate).toBeNull();
  });
});

describe("R20.12 — SEO view (Fase 5)", () => {
  it("measures coverage of the real landing network", () => {
    expect(data.seo.total).toBe(LANDINGS.length);
    expect(data.seo.covered).toBe(1);
    expect(data.seo.coverageRate).toBeCloseTo(0.1, 3);
    expect(data.seo.clusters.length).toBeGreaterThan(0);
    expect(data.seo.topLandings[0].views).toBeGreaterThan(0);
  });

  it("never claims coverage without data", () => {
    expect(empty.seo.covered).toBe(0);
    expect(empty.seo.coverageRate).toBe(0);
  });
});

describe("R20.12 — products, CRM and sales (Fases 7, 8, 9)", () => {
  it("shows a row per product with its validation class", () => {
    expect(data.products).toHaveLength(8);
    const qook = data.products.find((row) => row.slug === "qook");
    expect(qook?.demandScore).toBeGreaterThan(0);
    for (const row of data.products) {
      expect(["VALIDATED", "PROMISING", "EARLY_SIGNAL", "NO_SIGNAL"]).toContain(row.validation);
    }
  });

  it("shows CRM distribution", () => {
    expect(data.crm.leads).toBe(2);
    expect(data.crm.qualified).toBeGreaterThan(0);
    expect(Object.values(data.crm.byTier).reduce((a, b) => a + b, 0)).toBe(data.crm.leads);
    expect(data.crm.conversionRate).toBeNull(); // below the 5-lead floor
  });

  it("shows the recommended sales actions", () => {
    const total = data.revenue.salesActions.reduce((sum, row) => sum + row.count, 0);
    expect(total).toBe(data.crm.leads);
    expect(data.revenue.salesActions.map((row) => row.action)).toEqual([
      "BOOK_CALL", "SEND_PROPOSAL", "NURTURE", "WAIT",
    ]);
    expect(data.revenue.potentialPipeline).toBe(
      data.sales.recommendedCalls + data.sales.recommendedProposals,
    );
  });
});

describe("R20.12 — top performers (Fase 11)", () => {
  it("names the leader of each surface or null", () => {
    expect(data.performers.landing?.slug).toBe("ai-agentes-imobiliario");
    expect(data.performers.product?.slug).toBe("qook");
    expect(data.performers.assessment?.id).toBe("ai-readiness");
    expect(data.performers.caseStudy?.slug).toBe("qook");
    for (const value of Object.values(data.performers)) {
      if (value !== null) expect(value.value).toBeGreaterThan(0);
    }
  });

  it("returns all-null performers with no data", () => {
    for (const value of Object.values(empty.performers)) expect(value).toBeNull();
  });
});

describe("R20.12 — alert engine (Fase 12)", () => {
  it("explains the empty state without inventing problems", () => {
    expect(empty.alerts).toHaveLength(1);
    expect(empty.alerts[0].id).toBe("no-data");
    expect(empty.alerts[0].severity).toBe("INFO");
    expect(empty.alerts[0].evidence.length).toBeGreaterThan(5);
  });

  it("every alert carries measured evidence", () => {
    for (const alert of data.alerts) {
      expect(alert.evidence.length, alert.id).toBeGreaterThan(5);
      expect(alert.detail.length, alert.id).toBeGreaterThan(10);
      expect(["CRITICAL", "WARNING", "INFO"]).toContain(alert.severity);
    }
    // Products with no signal at all are surfaced, not hidden.
    expect(data.alerts.some((alert) => alert.id === "no-demand")).toBe(true);
  });

  it("flags qualified leads with zero opportunities", () => {
    const noMeetings = SAMPLE.filter((event) => event.name !== "schedule_appointment");
    const records = buildCrmRecords(noMeetings);
    const alerts = getAlerts({
      events: noMeetings,
      pipeline: buildDashboardData({ events: noMeetings, generatedAt: '', source: 't' }).crm,
      demand: buildProductDemandReport(noMeetings),
      sales: buildDashboardData({ events: noMeetings, generatedAt: '', source: 't' }).sales,
      seo: buildDashboardData({ events: noMeetings, generatedAt: '', source: 't' }).seo,
    });
    expect(records.length).toBeGreaterThan(0);
    expect(alerts.some((alert) => alert.id === "no-opportunities")).toBe(true);
  });
});

describe("R20.12 — executive insights (Fase 13)", () => {
  it("derives insights from the data with evidence", () => {
    expect(data.insights.length).toBeGreaterThan(0);
    for (const insight of data.insights) {
      expect(insight.evidence.length, insight.id).toBeGreaterThan(3);
      expect(insight.detail.length, insight.id).toBeGreaterThan(10);
    }
    expect(data.insights.some((insight) => insight.id === "top-landing")).toBe(true);
    expect(data.insights.some((insight) => insight.id === "biggest-opportunity")).toBe(true);
  });

  it("says so plainly when there is nothing to analyse", () => {
    expect(empty.insights).toHaveLength(1);
    expect(empty.insights[0].id).toBe("no-data");
  });

  it("identifies the bottleneck when leads do not convert", () => {
    const noMeetings = SAMPLE.filter((event) => event.name !== "schedule_appointment");
    const insights = getInsights({
      events: noMeetings,
      executive: empty.executive,
      marketing: empty.marketing,
      cases: empty.cases,
      demand: buildProductDemandReport(noMeetings),
      pipeline: buildDashboardData({ events: noMeetings, generatedAt: '', source: 't' }).crm,
      sales: buildDashboardData({ events: noMeetings, generatedAt: '', source: 't' }).sales,
    });
    expect(insights.some((insight) => insight.id === "bottleneck-opportunity")).toBe(true);
  });
});

describe("R20.17 — lead sources (attribution visibility)", () => {
  const convert = (utms?: Record<string, string>): FunnelInputEvent[] => [
    { name: "generate_lead", category: "booking", label: "booking_form_success", data: utms ? { utms } : {} },
  ];

  it("groups conversions by UTM source and medium", () => {
    const events: FunnelInputEvent[] = [
      ...convert({ utm_source: "google", utm_medium: "cpc", utm_campaign: "q1" }),
      ...convert({ utm_source: "google", utm_medium: "cpc", utm_campaign: "q1" }),
      ...convert({ utm_source: "linkedin", utm_medium: "social" }),
    ];
    expect(getLeadSources(events)).toEqual([
      { source: "google", medium: "cpc", conversions: 2 },
      { source: "linkedin", medium: "social", conversions: 1 },
    ]);
  });

  it("counts schedule_appointment and assessment_lead_capture too", () => {
    const events: FunnelInputEvent[] = [
      { name: "schedule_appointment", category: "booking", label: "booking_success", data: { utms: { utm_source: "direct", utm_medium: "none" } } },
      { name: "assessment_lead_capture", category: "lead_magnet", label: "ai-readiness_lead_capture", data: { utms: { utm_source: "direct", utm_medium: "none" } } },
      { name: "page_view", path: "/" },
    ];
    expect(getLeadSources(events)).toEqual([{ source: "direct", medium: "none", conversions: 2 }]);
  });

  it("labels conversions without UTMs as unknown instead of guessing", () => {
    expect(getLeadSources(convert(undefined))).toEqual([{ source: "unknown", medium: "unknown", conversions: 1 }]);
    expect(getLeadSources([])).toEqual([]);
  });

  it("exposes sources on the executive view and dashboard", () => {
    const data = buildDashboardData({
      events: [
        { name: "generate_lead", category: "booking", label: "x", data: { utms: { utm_source: "google", utm_medium: "cpc" } } },
      ],
      generatedAt: "",
      source: "test",
    });
    expect(data.executive.leadSources).toEqual([{ source: "google", medium: "cpc", conversions: 1 }]);
    expect(PAGE).toContain("Origens de leads");
  });

  it("guide downloads fire a conversion event", () => {
    expect(read("src/pages/BrandingGuide.tsx")).toContain("analytics.trackClick('branding_guide', 'guide_download', 'conversion')");
  });
});

describe("R20.18 — revenue attribution on the dashboard", () => {
  /** Events that produce exactly one lead unit (journey = the visited paths). */
  const journeyEvents: FunnelInputEvent[] = [
    { name: "page_view", path: "/ai-agentes-imobiliario" },
    { name: "page_view", path: "/qook" },
    {
      name: "assessment_lead_capture",
      category: "lead_magnet",
      label: "ai-readiness_lead_capture",
      data: {
        assessment: "ai-readiness",
        score: 82,
        tier: "avancado",
        product: "qook",
        journey: ["/ai-agentes-imobiliario", "/qook", "/booking"],
      },
    },
    {
      name: "schedule_appointment",
      category: "booking",
      label: "booking_success",
      data: { journey: ["/ai-agentes-imobiliario", "/qook", "/booking"] },
    },
  ];
  /** Pseudonymous browser leadId for that journey (deterministic signature). */
  const LEAD_ID = "lead_180pwnw";

  const build = (opportunities: unknown[], revenue_events?: unknown[]) =>
    buildDashboardData({
      events: journeyEvents,
      generatedAt: "",
      source: "test",
      opportunities,
      revenue_events,
    } as never);

  it("keeps revenue null without a CRM import", () => {
    const data = buildDashboardData({ events: journeyEvents, generatedAt: "", source: "test" });
    expect(data.revenue.attribution).toBeNull();
    expect(PAGE).toContain("RevenueAttributionPanels");
  });

  it("parses opportunities[] from the pasted export and computes the slices", () => {
    const data = build([
      {
        opportunity_id: "opp-1",
        lead_id: LEAD_ID,
        source: "google",
        medium: "cpc",
        campaign: "q1",
        landing_page: "/ai-agentes-imobiliario",
        product_interest: "qook",
        proposal_value: 5000,
        won_value: 4500,
        close_date: "2026-09-15",
        status: "won",
      },
      { opportunity_id: "opp-2", lead_id: null, source: "direct", proposal_value: 2000, status: "proposal_sent" },
    ]);
    const view = data.revenue.attribution!;
    expect(view.opportunities).toHaveLength(2);
    expect(view.totals).toMatchObject({ pipeline: 7000, won: 4500, deals: 1, proposals: 2, averageDeal: 4500 });
    expect(view.bySource.find((s) => s.key === "google")?.won).toBe(4500);
    expect(view.byProduct.find((s) => s.key === "qook")?.won).toBe(4500);
    expect(view.byService.find((s) => s.key === "AI")?.won).toBe(4500);
    expect(view.byChannel.find((s) => s.key === "google / cpc")?.won).toBe(4500);
    expect(view.byLandingPage.find((s) => s.key === "/ai-agentes-imobiliario")?.won).toBe(4500);
    expect(view.scorecard).toMatchObject({
      traffic: 2, leads: 1, meetings: 1, proposals: 2, wonDeals: 1, revenue: 4500,
      topSource: "google", topProduct: "qook", topService: "AI",
    });
    expect(view.funnel.steps.map((s) => s.stage)).toContain("Negotiations");
    expect(view.funnel).toMatchObject({ visitors: 2, leads: 1, meetings: 1, proposals: 2, negotiations: 1, won: 1 });
  });

  it("stamps the case study from the lead journey", () => {
    const data = build([
      {
        opportunity_id: "opp-1",
        lead_id: LEAD_ID,
        source: "google",
        won_value: 1200,
        close_date: "2026-09-15",
        status: "won",
      },
    ]);
    expect(data.revenue.attribution!.byCaseStudy.map((s) => s.key)).toEqual(["Qook — POS que se vende sozinho"]);
  });

  it("drops invalid rows instead of repairing them", () => {
    const data = build([
      { opportunity_id: "bad", status: "won" }, // no value/date
      { opportunity_id: "ok", source: "direct", status: "open" },
      { no_opportunity_id: true, status: "open" },
    ]);
    expect(data.revenue.attribution!.opportunities).toHaveLength(1);
  });

  it("flags missing writebacks when a ledger is imported", () => {
    const clean = build(
      [{ opportunity_id: "opp-1", lead_id: LEAD_ID, source: "google", won_value: 10, close_date: "2026-09-15", status: "won" }],
      [{ opportunity_id: "opp-1", lead_id: LEAD_ID, stage: "won", value: 10 }],
    );
    expect(clean.revenue.attribution!.quality).toEqual([]);

    const dirty = build(
      [{ opportunity_id: "opp-1", lead_id: LEAD_ID, source: "google", won_value: 10, close_date: "2026-09-15", status: "won" }],
      [{ opportunity_id: "other", lead_id: null, stage: "won", value: 10 }],
    );
    expect(dirty.revenue.attribution!.quality.map((i) => i.code)).toContain("MISSING_WRITEBACK");
  });
});
