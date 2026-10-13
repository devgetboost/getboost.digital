import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  CRM_STAGES,
  FOLLOW_UP_ACTIONS,
  OPPORTUNITY_CLASSES,
  QUALIFICATION_TIERS,
  STAGE_BY_TIER,
  validateCrmRecord,
  type CrmLeadRecord,
} from "../data/crm-contract";
import { buildLeadSignals, getLeadUnits, hashJourney, isLeadEvent, leadIdFor } from "../lib/lead-signals";
import {
  DEFAULT_LEAD_WEIGHTS,
  FIT_RULES,
  QUALIFICATION_RULES,
  getFollowUpAction,
  getLeadScore,
  getOpportunityClass,
  getProductFit,
  getQualification,
} from "../lib/lead-score";
import {
  buildCrmRecords,
  getAssessmentQualification,
  getLeadAttribution,
  getPipelineStages,
  getPipelineStats,
  getPriorityQueue,
  getProductQualification,
  getTopOpportunities,
  toCrmRecord,
} from "../lib/crm-qualification";
import { buildProductDemandReport } from "../lib/product-demand-report";
import type { FunnelInputEvent } from "../lib/funnel-intelligence";
import type { LeadUnit } from "../lib/lead-signals";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const SIGNALS = read("src/lib/lead-signals.ts");
const SCORE = read("src/lib/lead-score.ts");
const QUALIFICATION = read("src/lib/crm-qualification.ts");
const MODAL = read("src/components/LeadMagnetModal.tsx");

/** A lead event factory: paths + conversion payload, nothing else. */
const lead = (journey: string[], data: Record<string, unknown> = {}, event: Partial<FunnelInputEvent> = {}): FunnelInputEvent => ({
  name: "generate_lead",
  category: "lead_magnet",
  label: "ai-readiness_lead_capture",
  funnel_stage: "conversion",
  data: { journey, ...data },
  ...event,
});

const hotLead: FunnelInputEvent = lead(
  ["/", "/ai-agentes-imobiliario", "/agentes-ia", "/portfolio/qook", "/qook"],
  { assessment: "ai-readiness", score: 82, tier: "avancado", product: "qook" },
  { name: "schedule_appointment", category: "booking", label: "booking_success" },
);

const warmLead: FunnelInputEvent = lead(
  ["/", "/automacao-whatsapp", "/integracao-crm"],
  { assessment: "automation-audit", score: 55, tier: "intermedio", product: "trackfy" },
);

const nurtureLead: FunnelInputEvent = lead(["/", "/blog"], { product: "pikto" });

/**
 * R20.9 — CRM Qualification guards.
 * Model, signals, scoring, tiering, product fit, opportunity classification,
 * pipeline analytics, priority queue, CRM contract and the quality gates
 * (no PII, no hidden scoring, no ML). CI fails on any regression.
 */
describe("R20.9 — CRM model + data contract (Fases 1, 11)", () => {
  it("declares the official pipeline stages", () => {
    expect([...CRM_STAGES]).toEqual(["LEAD", "QUALIFIED", "OPPORTUNITY", "PROPOSAL", "CUSTOMER"]);
    expect(QUALIFICATION_TIERS).toEqual(["HOT", "WARM", "COLD", "NURTURE"]);
    expect(OPPORTUNITY_CLASSES).toEqual(["NO_SIGNAL", "EARLY", "PROMISING", "QUALIFIED", "OPPORTUNITY"]);
    expect(FOLLOW_UP_ACTIONS).toEqual(["BOOK_CALL", "SEND_PROPOSAL", "NURTURE", "WAIT"]);
    expect(STAGE_BY_TIER.HOT).toBe("OPPORTUNITY");
    expect(STAGE_BY_TIER.WARM).toBe("QUALIFIED");
    expect(STAGE_BY_TIER.NURTURE).toBe("LEAD");
  });

  it("rejects malformed or PII-bearing records (Fase 16)", () => {
    const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);
    expect(records.length).toBe(3);
    for (const record of records) {
      expect(validateCrmRecord(record), record.leadId).toEqual([]);
    }
    const [first] = records;
    expect(validateCrmRecord({ ...first, leadId: "user-42" })).toContain("leadId must be lead_<hash>");
    expect(validateCrmRecord({ ...first, score: { ...first.score, score: 140 } })).toContain("score out of 0–100");
    expect(validateCrmRecord({ ...first, journey: ["/qook?utm=x"] })).toContain(
      "journey step carries a query string: /qook?utm=x",
    );
    const smuggled = { ...first, email: "lead@example.com" } as unknown as CrmLeadRecord;
    expect(validateCrmRecord(smuggled)).toContain("forbidden field in record: email");
    const hidden = { ...first, score: { ...first.score, intent: 90 } } as CrmLeadRecord;
    hidden.signals = { ...first.signals, assessmentId: null };
    expect(validateCrmRecord(hidden)).toContain("intent score without an assessment or booking signal");
  });
});

describe("R20.9 — lead signal engine (Fase 2)", () => {
  it("only scores leads that left a journey (no identity invention)", () => {
    expect(isLeadEvent(lead(["/"]))).toBe(true);
    expect(isLeadEvent({ name: "page_view", path: "/" })).toBe(false);
    expect(isLeadEvent({ name: "scroll_depth", label: "homepage_50" })).toBe(false);
    expect(isLeadEvent({ name: "product_interaction", data: { product: "qook" } })).toBe(false);
    expect(SIGNALS).toContain("the ONLY population a CRM");
  });

  it("extracts every documented signal from the journey", () => {
    const signals = buildLeadSignals(hotLead);
    expect(signals.landingViews).toContain("/ai-agentes-imobiliario");
    expect(signals.pillarViews).toContain("/agentes-ia");
    expect(signals.caseViews).toContain("/portfolio/qook");
    expect(signals.productViews).toContain("/qook");
    expect(signals.productInterest).toContain("qook");
    expect(signals.assessmentId).toBe("ai-readiness");
    expect(signals.assessmentScore).toBe(82);
    expect(signals.assessmentTier).toBe("avancado");
    expect(signals.booked).toBe(true);
    expect(signals.leadCaptured).toBe(false); // booking, not a capture event
    expect(signals.depth).toBe(4);
  });

  it("identifies leads by a deterministic pseudonymous path hash", () => {
    const journey = ["/", "/qook"];
    expect(leadIdFor(journey)).toBe(`lead_${hashJourney(journey)}`);
    expect(leadIdFor(journey)).toBe(leadIdFor([...journey]));
    expect(leadIdFor(journey)).not.toBe(leadIdFor(["/", "/pikto"]));
    expect(leadIdFor(journey)).not.toContain("@");
  });

  it("collapses multiple conversions in one journey into a single lead", () => {
    const journey = ["/", "/ai-agentes-clinicas"];
    const units = getLeadUnits([
      lead(journey, { assessment: "ai-readiness", score: 70, tier: "avancado" }),
      lead(journey, { product: "motivae" }, { name: "schedule_appointment", category: "booking" }),
    ]);
    expect(units.length).toBe(1);
    expect(units[0].signals.booked).toBe(true);
    expect(units[0].signals.leadCaptured).toBe(true);
    expect(units[0].signals.assessmentId).toBe("ai-readiness");
  });

  it("the lead capture now carries the journey (end-to-end attribution)", () => {
    expect(MODAL).toContain("journey: getJourney()");
  });
});

describe("R20.9 — lead score engine (Fase 3)", () => {
  it("weights sum to 1 and every component stays in 0–100", () => {
    const total = Object.values(DEFAULT_LEAD_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 5);
    const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);
    for (const record of records) {
      for (const field of ["interest", "intent", "engagement", "product", "demand"] as const) {
        expect(record.score[field]).toBeGreaterThanOrEqual(0);
        expect(record.score[field]).toBeLessThanOrEqual(100);
      }
      expect(record.score.score).toBeGreaterThanOrEqual(0);
      expect(record.score.score).toBeLessThanOrEqual(100);
    }
  });

  it("ranks a hot lead above a nurture lead", () => {
    const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);
    const byId = new Map(records.map((r) => [r.leadId, r]));
    const hot = records.find((r) => r.signals.booked);
    const nurture = records.find((r) => !r.signals.assessmentId);
    expect(hot && nurture && hot.score.score > nurture.score.score).toBe(true);
    expect(byId.size).toBe(3);
  });

  it("integrates the R20.8 demand score", () => {
    const events = [
      ...Array.from({ length: 100 }, () => ({ name: "page_view", path: "/qook" }) as FunnelInputEvent),
      { name: "product_interaction", label: "qook_interest", data: { product: "qook", action: "interest" } } as FunnelInputEvent,
      { name: "generate_lead", label: "lead", data: { product: "qook" } } as FunnelInputEvent,
      hotLead,
    ];
    const demand = buildProductDemandReport(events);
    const withDemand = buildCrmRecords(events, { demandScores: demand.scores });
    const withoutDemand = buildCrmRecords(events);
    const hotWith = withDemand.find((r) => r.signals.booked);
    const hotWithout = withoutDemand.find((r) => r.signals.booked);
    expect(hotWith?.score.demand).toBeGreaterThan(0);
    expect(hotWithout?.score.demand).toBe(0);
    expect(hotWith && hotWithout && hotWith.score.score > hotWithout.score.score).toBe(true);
  });
});

describe("R20.9 — qualification tiers (Fase 4)", () => {
  it("applies transparent, ordered rules", () => {
    expect(QUALIFICATION_RULES.every((rule) => rule.reason.length > 10)).toBe(true);
    const ids = QUALIFICATION_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("classifies the sample leads into the right tiers", () => {
    const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);
    const hot = records.find((r) => r.signals.booked);
    const warm = records.find((r) => r.signals.assessmentId === "automation-audit");
    const nurture = records.find((r) => !r.signals.assessmentId);
    expect(hot?.qualification).toBe("HOT");
    expect(warm?.qualification).toBe("WARM");
    expect(nurture?.qualification).toBe("NURTURE");
    for (const record of records) expect(record.stage).toBe(STAGE_BY_TIER[record.qualification]);
  });

  it("returns the deciding rule and its reason", () => {
    const record = buildCrmRecords([hotLead])[0];
    const decision = getQualification(record.score, record.signals);
    expect(decision.rule.length).toBeGreaterThan(0);
    expect(decision.reason.length).toBeGreaterThan(10);
    expect(decision.tier).toBe(record.qualification);
  });
});

describe("R20.9 — product fit engine (Fase 9)", () => {
  it("uses explicit rules with points and reasons (no ML)", () => {
    expect(FIT_RULES.length).toBeGreaterThanOrEqual(5);
    for (const rule of FIT_RULES) {
      expect(rule.points).toBeGreaterThan(0);
      expect(rule.reason.length).toBeGreaterThan(5);
    }
    expect(SCORE).toContain("no ML");
  });

  it("matches the product the lead actually touched", () => {
    const record = buildCrmRecords([hotLead])[0];
    expect(record.productFits[0].slug).toBe("qook");
    expect(record.productFits[0].fit).toBeGreaterThan(0);
    expect(record.productFits[0].reasons.length).toBeGreaterThan(0);
    // Every fired rule carries its audit reason.
    for (const fit of record.productFits) {
      expect(fit.reasons.length).toBeLessThanOrEqual(FIT_RULES.length);
    }
  });

  it("never boosts a product the lead did not touch", () => {
    // Views Qook but also reads an AI landing that lists Motivae.
    const unit: LeadUnit = getLeadUnits([hotLead])[0];
    const fits = getProductFit(unit);
    const pikto = fits.find((f) => f.slug === "pikto");
    expect(pikto).toBeUndefined();
  });

  it("returns no fit when there is no product signal", () => {
    const unit = getLeadUnits([lead(["/", "/blog"])])[0];
    expect(getProductFit(unit)).toEqual([]);
  });
});

describe("R20.9 — opportunity engine (Fases 10, 15)", () => {
  it("derives the class from observed behavior only", () => {
    const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);
    const hot = records.find((r) => r.signals.booked);
    const warm = records.find((r) => r.signals.assessmentId === "automation-audit");
    const nurture = records.find((r) => !r.signals.assessmentId);
    expect(hot?.opportunity).toBe("OPPORTUNITY");
    expect(warm?.opportunity).toBe("PROMISING");
    expect(nurture?.opportunity).toBe("EARLY");
    for (const record of records) expect(OPPORTUNITY_CLASSES).toContain(record.opportunity);
  });

  it("never estimates a class without signals", () => {
    const bare = toCrmRecord(getLeadUnits([lead(["/"])])[0], new Map());
    expect(bare.opportunity).toBe("EARLY");
    const noSignal = getOpportunityClass(
      { leadId: "lead_x", interest: 0, intent: 0, engagement: 0, product: 0, demand: 0, score: 0, weights: DEFAULT_LEAD_WEIGHTS },
      {
        landingViews: [], caseViews: [], pillarViews: [], productViews: [], productInterest: [],
        assessmentId: null, assessmentScore: null, assessmentTier: null,
        leadCaptured: false, booked: false, contacted: false, depth: 0,
      },
    );
    expect(noSignal.opportunity).toBe("NO_SIGNAL");
  });

  it("recommends an action and never performs one", () => {
    const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);
    for (const record of records) {
      expect(FOLLOW_UP_ACTIONS).toContain(record.recommendedAction);
    }
    const hot = records.find((r) => r.signals.booked);
    const nurture = records.find((r) => !r.signals.assessmentId);
    expect(hot?.recommendedAction).toBe("SEND_PROPOSAL");
    expect(nurture?.recommendedAction).toBe("NURTURE");
    expect(getFollowUpAction("WARM", "PROMISING", { booked: false } as never)).toBe("BOOK_CALL");
    expect(getFollowUpAction("NURTURE", "NO_SIGNAL", { booked: false } as never)).toBe("NURTURE");
    expect(SCORE).toContain("recommendation only");
  });
});

describe("R20.9 — pipeline analytics + priority queue (Fases 12, 14)", () => {
  const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);

  it("counts leads, qualified, opportunities and distribution", () => {
    const stats = getPipelineStats(records);
    expect(stats.leads).toBe(3);
    expect(stats.qualified).toBe(2); // HOT + WARM
    expect(stats.opportunities).toBe(1);
    expect(stats.conversionRate).toBeNull(); // below the 5-lead floor
    expect(stats.productDistribution.qook).toBeGreaterThan(0);
    expect(Object.values(stats.byStage).reduce((a, b) => a + b, 0)).toBe(3);
    expect(Object.values(stats.byAction).reduce((a, b) => a + b, 0)).toBe(3);
  });

  it("computes the conversion rate above the sample floor", () => {
    const many = Array.from({ length: 6 }, (_, i) => lead([`/p${i}`], {}, i === 0 ? { name: "schedule_appointment", category: "booking" } : {}));
    const stats = getPipelineStats(buildCrmRecords(many));
    expect(stats.leads).toBe(6);
    expect(stats.opportunities).toBeGreaterThan(0);
    expect(stats.conversionRate).toBeGreaterThan(0);
  });

  it("orders the queue deterministically", () => {
    const queue = getPriorityQueue(records);
    expect(queue).toHaveLength(3);
    expect(queue[0].signals.booked).toBe(true);
    expect(getPriorityQueue(records).map((r) => r.leadId)).toEqual(queue.map((r) => r.leadId));
    const scores = queue.map((r) => r.score.score);
    expect([...scores].sort((a, b) => b - a)).toEqual(scores);
  });

  it("exposes top opportunities and ordered pipeline stages", () => {
    expect(getTopOpportunities(records, 5)).toHaveLength(1);
    const stages = getPipelineStages(records);
    expect(stages.map((s) => s.stage)).toEqual([...CRM_STAGES]);
    expect(stages.map((s) => s.order)).toEqual([...stages.map((s) => s.order)].sort((a, b) => a - b));
  });

  it("qualifies products and assessments (Fases 5, 6)", () => {
    const products = getProductQualification(records);
    expect(products.length).toBe(8);
    // Each lead counts once, under its BEST-fit product: the warm lead's
    // journey also mentions Qook (both automation landings list it), but the
    // explicit `product: trackfy` stamp breaks the tie by provenance.
    expect(products.find((p) => p.slug === "qook")?.leads).toBe(1);
    expect(products.find((p) => p.slug === "qook")?.opportunities).toBe(1);
    expect(products.find((p) => p.slug === "trackfy")?.leads).toBe(1);
    expect(products.find((p) => p.slug === "trackfy")?.opportunities).toBe(0);
    expect(products.filter((p) => p.leads === 0).length).toBe(5);
    const assessments = getAssessmentQualification(records);
    expect(assessments.map((a) => a.assessmentId).sort()).toEqual(["ai-readiness", "automation-audit"]);
    expect(assessments.find((a) => a.assessmentId === "ai-readiness")?.hot).toBe(1);
  });

  it("preserves the attribution chain end-to-end (Fase 13)", () => {
    const attribution = getLeadAttribution(records);
    for (const record of records) {
      const chain = attribution[record.leadId];
      expect(chain).toBeTruthy();
      expect(chain.assessment).toBe(record.signals.assessmentId);
      expect(chain.product).toBe(record.product);
    }
    const hot = records.find((r) => r.signals.booked);
    const chain = hot ? attribution[hot.leadId] : null;
    expect(chain?.landing).toBe("/ai-agentes-imobiliario");
    expect(chain?.case).toBe("/portfolio/qook");
    expect(chain?.pillar).toBe("/agentes-ia");
  });

  it("returns empty analytics for an empty stream", () => {
    const stats = getPipelineStats([]);
    expect(stats.leads).toBe(0);
    expect(stats.qualified).toBe(0);
    expect(stats.conversionRate).toBeNull();
    expect(getPriorityQueue([])).toEqual([]);
    expect(getLeadAttribution([])).toEqual({});
  });
});

describe("R20.9 — quality gates (Fase 16)", () => {
  const records = buildCrmRecords([hotLead, warmLead, nurtureLead]);

  it("emits no PII anywhere in the qualification output", () => {
    const serialized = JSON.stringify({ records, stats: getPipelineStats(records), queue: getPriorityQueue(records) });
    expect(serialized).not.toMatch(/@/);
    expect(serialized.toLowerCase()).not.toMatch(/email|phone|contact@|nif|cpf/);
    for (const record of records) {
      for (const step of record.journey) {
        expect(step).not.toContain("?");
        expect(step).not.toContain("#");
      }
    }
  });

  it("stays pure: no DOM, storage, network or learning", () => {
    // Comments are excluded: the modules DOCUMENT the absence of ML, so the
    // gate must inspect code, not prose.
    const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const file of [SIGNALS, SCORE, QUALIFICATION]) {
      const code = stripComments(file);
      expect(code).not.toMatch(/\bfetch\(|localStorage|sessionStorage|XMLHttpRequest|navigator\./);
      expect(code).not.toMatch(/machine learning|neural|tensorflow|classifier|brain\.js/i);
    }
    expect(QUALIFICATION).not.toContain("import { supabase");
  });

  it("is reproducible: same stream → same records", () => {
    const events = [hotLead, warmLead, nurtureLead];
    expect(JSON.stringify(buildCrmRecords(events))).toBe(JSON.stringify(buildCrmRecords(events)));
  });
});
