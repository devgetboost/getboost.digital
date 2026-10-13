import { describe, expect, it } from "vitest";
import {
  OPPORTUNITY_STAGES,
  attributeRevenue,
  caseFromJourney,
  checkRevenueQuality,
  getCommercialFunnel,
  getExecutiveScorecard,
  getRevenueTotals,
  getSourceRoi,
  normalizeOpportunity,
  revenueByCampaign,
  revenueByLandingPage,
  revenueByMedium,
  revenueByProduct,
  revenueByCaseStudy,
  revenueByChannel,
  revenueByService,
  revenueBySource,
  serviceForLanding,
  stampCaseInterest,
  sliceRevenueBy,
  type RevenueOpportunity,
} from "../lib/revenue-attribution";
import type { CrmLeadRecord } from "../data/crm-contract";

const opp = (over: Partial<RevenueOpportunity> = {}): RevenueOpportunity => ({
  opportunity_id: "opp-1",
  lead_id: "lead_abc",
  crm_id: null,
  source: "google",
  medium: "cpc",
  campaign: "q1",
  landing_page: "/ai-agentes-imobiliario",
  service_interest: null,
  product_interest: "qook",
  case_interest: null,
  proposal_value: 5000,
  won_value: 4500,
  close_date: "2026-09-15",
  status: "won",
  ...over,
});

const lead = (over: Partial<CrmLeadRecord> = {}): CrmLeadRecord => ({
  leadId: "lead_abc",
  source: "booking",
  product: "qook",
  qualification: "HOT",
  opportunity: "OPPORTUNITY",
  stage: "OPPORTUNITY",
  score: { leadId: "lead_abc", interest: 80, intent: 90, engagement: 70, product: 85, demand: 60, score: 79, weights: { interest: 0.2, intent: 0.3, engagement: 0.15, product: 0.15, demand: 0.2 } },
  productFits: [],
  signals: {
    landingViews: ["/ai-agentes-imobiliario"],
    caseViews: [],
    pillarViews: ["/agentes-ia"],
    productViews: ["/qook"],
    productInterest: ["qook"],
    assessmentId: "ai-readiness",
    assessmentScore: 82,
    assessmentTier: "avancado",
    leadCaptured: true,
    booked: true,
    contacted: false,
    depth: 4,
  },
  recommendedAction: "SEND_PROPOSAL",
  journey: ["/", "/ai-agentes-imobiliario", "/agentes-ia", "/qook", "/booking"],
  ...over,
});

/**
 * R20.18 — Revenue Attribution Engine guards.
 * Model validation, first/last/multi-touch math, slices, funnel, ROI
 * honesty (no spend → no ROI), scorecard and quality gates. CI fails on
 * invented money or unattributed revenue.
 */
describe("R20.18 — revenue data model", () => {
  it("declares the five commercial stages", () => {
    expect(OPPORTUNITY_STAGES).toEqual(["open", "proposal_sent", "negotiation", "won", "lost"]);
  });

  it("normalises valid rows and rejects invalid ones without repair", () => {
    expect(normalizeOpportunity({ opportunity_id: "x", status: "won", won_value: 100, close_date: "2026-01-01" })?.status).toBe("won");
    expect(normalizeOpportunity({ opportunity_id: "", status: "open" })).toBeNull();
    expect(normalizeOpportunity({ opportunity_id: "x", status: "maybe" as never })).toBeNull();
    // Won without facts is rejected, not defaulted.
    expect(normalizeOpportunity({ opportunity_id: "x", status: "won" })).toBeNull();
    expect(normalizeOpportunity({ opportunity_id: "x", status: "won", won_value: -5, close_date: "2026-01-01" })).toBeNull();
    // Sources are normalised, never dropped silently into a bucket.
    expect(normalizeOpportunity({ opportunity_id: "x", status: "open", source: "  Google " })?.source).toBe("google");
    expect(normalizeOpportunity({ opportunity_id: "x", status: "open" })?.source).toBe("unknown");
  });
});

describe("R20.18 — attribution logic", () => {
  it("computes first/last/multi-touch from the journey", () => {
    const attribution = attributeRevenue(opp(), lead());
    expect(attribution.opportunity_id).toBe("opp-1");
    expect(attribution.first_page).toBe("/");
    expect(attribution.first_source).toBe("google");
    expect(attribution.last_source).toBe("/booking");
    expect(attribution.meeting_source).toBe("/booking");
    expect(attribution.revenue_source).toBe("google");
    expect(attribution.multi_touch).toEqual(["/", "/ai-agentes-imobiliario", "/agentes-ia", "/qook", "/booking"]);
  });

  it("reports nulls instead of guessing without a lead", () => {
    const attribution = attributeRevenue(opp(), null);
    expect(attribution.first_page).toBe("/ai-agentes-imobiliario");
    expect(attribution.last_source).toBe("google");
    expect(attribution.meeting_source).toBeNull();
    expect(attribution.multi_touch).toEqual([]);
  });

  it("meeting source is null without a booking step", () => {
    const noBooking = lead({ journey: ["/", "/qook"], signals: { ...lead().signals, booked: false } });
    expect(attributeRevenue(opp(), noBooking).meeting_source).toBeNull();
  });
});

describe("R20.18 — revenue slices", () => {
  const rows = [
    opp(),
    opp({ opportunity_id: "opp-2", source: "linkedin", medium: "social", campaign: "q1", landing_page: "/agentes-ia", product_interest: "pikto", proposal_value: 3000, won_value: 3000, close_date: "2026-08-20", status: "won" }),
    opp({ opportunity_id: "opp-3", source: "google", status: "lost", proposal_value: 2000, won_value: null, close_date: "2026-08-01" }),
    opp({ opportunity_id: "opp-4", source: "direct", status: "proposal_sent", proposal_value: 8000, won_value: null, close_date: null }),
  ];

  it("slices by source, medium, campaign, landing, product and service", () => {
    expect(revenueBySource(rows).find((s) => s.key === "google")).toMatchObject({ won: 4500, deals: 1, lost: 1 });
    expect(revenueByMedium(rows).find((s) => s.key === "cpc")?.won).toBe(4500);
    expect(revenueByCampaign(rows).find((s) => s.key === "q1")?.won).toBe(7500);
    expect(revenueByLandingPage(rows).find((s) => s.key === "/ai-agentes-imobiliario")?.deals).toBe(1);
    expect(revenueByProduct(rows).find((s) => s.key === "qook")?.won).toBe(4500);
    expect(revenueByService(rows).find((s) => s.key === "AI")?.won).toBe(7500);
  });

  it("maps landing slugs to services with a pillar fallback", () => {
    expect(serviceForLanding("/automacao-whatsapp")).toBe("WhatsApp");
    expect(serviceForLanding("/integracao-erp")).toBe("ERP");
    expect(serviceForLanding("/desenvolvimento-saas")).toBe("SaaS");
    expect(serviceForLanding("/agentes-ia")).toBe("AI");
    expect(serviceForLanding("/solucoes/marketing-digital")).toBe("Growth");
    expect(serviceForLanding(null)).toBeNull();
    expect(serviceForLanding("/pagina-qualquer")).toBeNull();
  });

  it("totals pipeline, won, average deal and win rate", () => {
    expect(getRevenueTotals(rows)).toMatchObject({
      pipeline: 18000,
      won: 7500,
      lost: 1,
      deals: 2,
      proposals: 3,
      averageDeal: 3750,
      winRate: 0.667,
    });
    expect(getRevenueTotals([])).toMatchObject({ pipeline: 0, won: 0, averageDeal: null, winRate: null });
  });

  it("supports arbitrary dimensions without inventing buckets", () => {
    const byMonth = sliceRevenueBy(rows, (o) => o.close_date?.slice(0, 7) ?? null);
    expect(byMonth.find((s) => s.key === "2026-09")?.won).toBe(4500);
    expect(byMonth.find((s) => s.key === "unknown")?.pipeline).toBeGreaterThan(0);
  });
});

describe("R20.18 — commercial funnel", () => {
  it("counts eight stages with floored conversion rates", () => {
    const leads = [lead(), lead({ leadId: "lead_cold", qualification: "NURTURE", opportunity: "EARLY", signals: { ...lead().signals, booked: false, assessmentId: null } })];
    const funnel = getCommercialFunnel(120, leads, [
      opp(),
      opp({ opportunity_id: "opp-2", status: "proposal_sent", proposal_value: 1000, won_value: null }),
    ]);
    expect(funnel.steps.map((s) => s.stage)).toEqual([
      "Visitors", "Leads", "Qualified", "Meetings", "Proposals", "Negotiations", "Won", "Lost",
    ]);
    expect(funnel).toMatchObject({ visitors: 120, leads: 2, qualified: 1, meetings: 1, proposals: 2, negotiations: 1, won: 1, lost: 0 });
    // The floor applies to the previous stage: only the Leads step clears
    // it (120 visitors); everything downstream is null — no fake precision.
    expect(funnel.steps[1].rate).toBeCloseTo(0.017, 3);
    for (const step of funnel.steps.slice(2)) expect(step.rate).toBeNull();
  });

  it("computes rates above the sample floor", () => {
    const leads = Array.from({ length: 10 }, (_, i) => lead({ leadId: `lead_${i}` }));
    const funnel = getCommercialFunnel(100, leads, [opp()]);
    expect(funnel.steps[1].rate).toBe(0.1);
  });
});

describe("R20.18 — source ROI honesty", () => {
  const rows = [
    opp(),
    opp({ opportunity_id: "opp-2", source: "linkedin", medium: "social", won_value: 3000, status: "won" }),
  ];

  it("ranks sources by revenue and only computes ROI with spend", () => {
    const without = getSourceRoi(rows);
    expect(without[0].source).toBe("google");
    expect(without.every((r) => r.roi === null && r.spend === null)).toBe(true);
    const withSpend = getSourceRoi(rows, { google: 1500, linkedin: 1000 });
    expect(withSpend.find((r) => r.source === "google")).toMatchObject({ roi: 3, spend: 1500 });
    expect(withSpend.find((r) => r.source === "linkedin")).toMatchObject({ roi: 3, spend: 1000 });
  });
});

describe("R20.18 — executive scorecard", () => {
  it("answers the ten KPIs with nulls where data is absent", () => {
    const scorecard = getExecutiveScorecard({ traffic: 100, leads: [lead()], opportunities: [opp()] });
    expect(scorecard).toMatchObject({
      traffic: 100, leads: 1, meetings: 1, proposals: 1, wonDeals: 1,
      pipeline: 5000, revenue: 4500, averageDeal: 4500, winRate: 1,
      topSource: "google", topProduct: "qook", topService: "AI",
      revenueGrowth: null,
    });
    const growth = getExecutiveScorecard({ traffic: 0, leads: [], opportunities: [opp()], previousRevenue: 3000 });
    expect(growth.revenueGrowth).toBe(0.5);
  });
});

describe("R20.18 — data quality gates", () => {
  it("flags every defect class with row-level detail", () => {
    const dup = opp({ opportunity_id: "dup", status: "open", proposal_value: null, won_value: null, close_date: null });
    const rows = [
      dup,
      { ...dup },
      opp({ opportunity_id: "nosrc", status: "won", source: "", won_value: 10, close_date: "2026-01-01" }),
      opp({ opportunity_id: "nolead", status: "proposal_sent", lead_id: null, proposal_value: 10, won_value: null }),
      opp({ opportunity_id: "noval", status: "proposal_sent", proposal_value: null, won_value: null }),
    ];
    const issues = checkRevenueQuality(
      rows,
      rows.map((o) => ({ opportunity_id: o.opportunity_id, lead_id: o.lead_id, stage: o.status as never, value: null })),
      ["lead_abc"],
    );
    const codes = issues.map((i) => i.code);
    expect(checkRevenueQuality(
      [opp({ opportunity_id: "nowb", status: "open", proposal_value: null, won_value: null, close_date: null })],
      [],
      [],
    ).map((i) => i.code)).not.toContain("MISSING_WRITEBACK"); // no ledger imported: no noise
    expect(checkRevenueQuality(
      [opp({ opportunity_id: "nowb", status: "open", proposal_value: null, won_value: null, close_date: null })],
      [{ opportunity_id: "other", lead_id: null, stage: "open", value: null }],
      [],
    ).map((i) => i.code)).toContain("MISSING_WRITEBACK");
    expect(codes).toContain("DUPLICATE_OPPORTUNITY");
    expect(codes).toContain("REVENUE_WITHOUT_SOURCE");
    expect(codes).toContain("PROPOSAL_WITHOUT_LEAD");
    expect(codes).toContain("MISSING_VALUE");
    for (const issue of issues) {
      expect(issue.opportunity_id).toBeTruthy();
      expect(issue.detail.length).toBeGreaterThan(5);
    }
  });

  it("detects customers without browser attribution", () => {
    const issues = checkRevenueQuality(
      [opp({ opportunity_id: "ghost", status: "won", lead_id: "lead_xyz" })],
      [{ opportunity_id: "ghost", lead_id: "lead_xyz", stage: "won", value: 4500 }],
      ["lead_abc"],
    );
    expect(issues.map((i) => i.code)).toContain("CUSTOMER_WITHOUT_ATTRIBUTION");
    expect(issues.map((i) => i.code)).not.toContain("MISSING_WRITEBACK");
  });

  it("is clean on an empty import", () => {
    expect(checkRevenueQuality([], [])).toEqual([]);
  });
});

describe("R20.18 — case study + channel attribution", () => {
  const rows = [
    opp({ opportunity_id: "case-1", case_interest: "Qook — POS que se vende sozinho", won_value: 1200, status: "won", close_date: "2026-09-01" }),
    // case-2 is stamped the way the dashboard pipeline does it: no row value,
    // so the journey decides.
    stampCaseInterest(
      opp({ opportunity_id: "case-2", case_interest: null, landing_page: "/hostify", won_value: 800, status: "won", close_date: "2026-09-02" }),
      ["/", "/hostify", "/booking"],
    ),
  ];

  it("credits a case only when the journey reached its destination page", () => {
    expect(caseFromJourney(["/", "/qook", "/booking"])).toBe("Qook — POS que se vende sozinho");
    expect(caseFromJourney(["/", "/hostify"])).toBe("Hostify — do produto ao pipeline");
    expect(caseFromJourney(["/", "/agentes-ia"])).toBeNull();
    expect(caseFromJourney([])).toBeNull();
  });

  it("stamps the row value first and the journey second", () => {
    const imported = opp({ opportunity_id: "case-3", case_interest: "Importado" });
    expect(stampCaseInterest(imported, ["/", "/qook"]).case_interest).toBe("Importado");
    const derived = opp({ opportunity_id: "case-4", case_interest: null });
    expect(stampCaseInterest(derived, ["/", "/pikto"]).case_interest).toBe("Pikto — do editor ao ecossistema");
    expect(stampCaseInterest(derived, []).case_interest).toBeNull();
  });

  it("slices revenue by case study and channel", () => {
    const byCase = revenueByCaseStudy(rows);
    expect(byCase.find((s) => s.key === "Qook — POS que se vende sozinho")?.won).toBe(1200);
    expect(byCase.find((s) => s.key === "Hostify — do produto ao pipeline")?.won).toBe(800);
    const byChannel = revenueByChannel(rows);
    expect(byChannel.every((s) => s.key.includes("/"))).toBe(true);
    expect(byChannel.find((s) => s.key === "google / cpc")?.won).toBe(2000);
  });
});

describe("R20.18 — lost revenue", () => {
  it("values what left the table without touching won revenue", () => {
    const rows = [
      opp({ opportunity_id: "l1", status: "lost", proposal_value: 4000, won_value: null, close_date: "2026-08-01" }),
      opp({ opportunity_id: "l2", status: "lost", proposal_value: 1000, won_value: null, close_date: "2026-08-02" }),
      opp({ opportunity_id: "w1", status: "won" }),
    ];
    const totals = getRevenueTotals(rows);
    expect(totals).toMatchObject({ lost: 2, lostValue: 5000, won: 4500, deals: 1, winRate: 0.333 });
    const slices = revenueBySource(rows);
    expect(slices.find((s) => s.key === "google")).toMatchObject({ lost: 2, lostValue: 5000, won: 4500 });
  });
});

describe("R20.18 — executive scorecard case KPI", () => {
  it("names the top case only from won revenue", () => {
    const scorecard = getExecutiveScorecard({
      traffic: 10,
      leads: [lead()],
      opportunities: [opp({ case_interest: "Trackfy — tecnologia acessível para PMEs", won_value: 900, status: "won", close_date: "2026-09-03" })],
    });
    expect(scorecard.topCase).toBe("Trackfy — tecnologia acessível para PMEs");
    expect(scorecard.topService).toBe("AI");
  });
});
