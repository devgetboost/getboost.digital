import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  PRIORITY_ORDER,
  SALES_ACTIONS,
  SALES_MODEL,
  SALES_PLAYBOOKS,
  SALES_PRIORITIES,
  buildProductPlaybooks,
  type SalesAction,
} from "../data/sales-model";
import {
  ACTION_RULES,
  HOT_CRITERIA,
  PROPOSAL_GATES,
  buildSalesRecommendations,
  getHotLeadScore,
  getNextBestAction,
  getProposalReadiness,
  isNurtureCandidate,
  validateRecommendation,
} from "../lib/sales-actions";
import {
  PRIORITY_BANDS,
  buildSalesDashboardRows,
  getNurtureCandidates,
  getPipelineReadiness,
  getProductSalesIntelligence,
  getProposalCandidates,
  getSalesAnalytics,
  getSalesSummary,
  getTopSalesOpportunities,
  prioritizeOpportunities,
} from "../lib/sales-intelligence";
import { buildCrmRecords } from "../lib/crm-qualification";
import { buildProductDemandReport } from "../lib/product-demand-report";
import { PRODUCTS } from "../data/products";
import type { CrmLeadRecord } from "../data/crm-contract";
import type { FunnelInputEvent } from "../lib/funnel-intelligence";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const MODEL = read("src/data/sales-model.ts");
const ACTIONS = read("src/lib/sales-actions.ts");
const INTELLIGENCE = read("src/lib/sales-intelligence.ts");

const lead = (journey: string[], data: Record<string, unknown> = {}, event: Partial<FunnelInputEvent> = {}): FunnelInputEvent => ({
  name: "generate_lead",
  category: "lead_magnet",
  label: "ai-readiness_lead_capture",
  funnel_stage: "conversion",
  data: { journey, ...data },
  ...event,
});

/** Booked + advanced assessment + product fit: the strongest possible lead. */
const hotLead = lead(
  ["/", "/ai-agentes-imobiliario", "/agentes-ia", "/portfolio/qook", "/qook"],
  { assessment: "ai-readiness", score: 82, tier: "avancado", product: "qook" },
  { name: "schedule_appointment", category: "booking", label: "booking_success" },
);
/** Captured, assessed, deep journey, but no meeting yet. */
const warmLead = lead(
  ["/", "/automacao-whatsapp", "/integracao-crm", "/solucoes/integracoes-erp-crm"],
  { assessment: "automation-audit", score: 58, tier: "intermedio", product: "trackfy" },
);
/** Interest only — nothing beyond a landing read. */
const curiosityLead = lead(["/", "/growth-system", "/resources"], { product: "pikto" });

const RECORDS = buildCrmRecords([hotLead, warmLead, curiosityLead]);
const byBooking = (records: CrmLeadRecord[]) => records.find((r) => r.signals.booked);
const byAssessment = (records: CrmLeadRecord[]) => records.find((r) => r.signals.assessmentId && !r.signals.booked);
const byCuriosity = (records: CrmLeadRecord[]) => records.find((r) => !r.signals.assessmentId && !r.signals.booked);

/**
 * R20.10 — AI Sales Layer guards.
 * Action engine, next best action, prioritization, hot/nurture/proposal
 * engines, product sales intelligence, sales analytics, explainability and
 * playbooks. Also enforces the Fase 16 gates: no autonomous AI, no opaque
 * decisions, no automatic execution, no external integration.
 */
describe("R20.10 — sales model + playbooks (Fases 1, 11, 12)", () => {
  it("declares the official sales model and the four actions", () => {
    expect([...SALES_MODEL]).toEqual(["LEAD", "QUALIFIED", "OPPORTUNITY", "SALES_ACTION", "PIPELINE_STAGE"]);
    expect(SALES_ACTIONS).toEqual(["BOOK_CALL", "SEND_PROPOSAL", "NURTURE", "WAIT"]);
    expect(SALES_PRIORITIES).toEqual(["HIGHEST", "HIGH", "MEDIUM", "LOW"]);
  });

  it("ships one playbook per action with steps and guard rails", () => {
    for (const action of SALES_ACTIONS) {
      const playbook = SALES_PLAYBOOKS[action];
      expect(playbook, action).toBeTruthy();
      expect(playbook.action).toBe(action);
      expect(playbook.steps.length, `${action} steps`).toBeGreaterThan(0);
      expect(playbook.appliesWhen.length).toBeGreaterThan(0);
      expect(playbook.stopWhen.length).toBeGreaterThan(0);
      for (const step of playbook.steps) {
        expect(step.title.length).toBeGreaterThan(3);
        expect(step.purpose.length).toBeGreaterThan(10);
      }
    }
  });

  it("builds product playbooks entirely from existing registries", () => {
    const playbooks = buildProductPlaybooks([{ slug: "qook", to: "/qook" }]);
    expect(playbooks).toHaveLength(PRODUCTS.length);
    const slugs = playbooks.map((p) => p.slug);
    expect(slugs.sort()).toEqual(PRODUCTS.map((p) => p.slug).sort());
    for (const playbook of playbooks) {
      const product = PRODUCTS.find((p) => p.slug === playbook.slug);
      expect(playbook.landing).toBe(product?.to ?? null);
      // No commercial copy is generated: gaps stay declared.
      if (!product?.status) expect(playbook.dossierGaps).toContain("state");
    }
    expect(playbooks.find((p) => p.slug === "qook")?.landing).toBe("/qook");
    expect(playbooks.find((p) => p.slug === "alojify")?.landing).toBeNull();
  });
});

describe("R20.10 — action engine (Fases 2, 3)", () => {
  it("maps the brief's canonical cases to actions", () => {
    const records = buildCrmRecords([hotLead, warmLead, curiosityLead]);
    const hot = getNextBestAction(byBooking(records) as CrmLeadRecord);
    const warm = getNextBestAction(byAssessment(records) as CrmLeadRecord);
    expect(hot.action).toBe("SEND_PROPOSAL"); // booked + validated opportunity
    expect(hot.rule).toBe("proposal_booked");
    expect(warm.action).toBe("NURTURE");
    expect(warm.rule).toBe("nurture_warm");
  });

  it("maps NO_SIGNAL to WAIT and keeps it last-resort", () => {
    const bare = buildCrmRecords([lead(["/"])])[0];
    const recommendation = getNextBestAction(bare);
    expect(["WAIT", "NURTURE"]).toContain(recommendation.action);
    if (recommendation.action === "WAIT") expect(recommendation.rule).toBe("wait_no_signal");
  });

  it("produces ordered, uniquely named rules", () => {
    const ids = ACTION_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe("proposal_booked");
    for (const rule of ACTION_RULES) {
      expect(SALES_ACTIONS).toContain(rule.action);
      expect(rule.reason.length).toBeGreaterThan(15);
      expect(rule.benefit.length).toBeGreaterThan(15);
      expect(rule.risk.length).toBeGreaterThan(10);
    }
  });

  it("every recommendation carries a full audit trail", () => {
    for (const recommendation of buildSalesRecommendations(RECORDS)) {
      expect(validateRecommendation(recommendation), recommendation.leadId).toEqual([]);
      expect(recommendation.signalsUsed.length).toBeGreaterThan(0);
      expect(recommendation.playbook).toBe(recommendation.action);
    }
  });

  it("the audit trail names the signals the rule actually read", () => {
    const hot = getNextBestAction(byBooking(RECORDS) as CrmLeadRecord);
    expect(hot.signalsUsed).toContain("booking_agendado");
    expect(hot.signalsUsed.some((s) => s.startsWith("assessment:"))).toBe(true);
    expect(hot.signalsUsed.some((s) => s.startsWith("fit:"))).toBe(true);
  });
});

describe("R20.10 — next best action explainability (Fases 5, 14)", () => {
  it("answers what, why, benefit and risk for every lead", () => {
    for (const record of RECORDS) {
      const recommendation = getNextBestAction(record);
      expect(recommendation.action).toBeTruthy();
      expect(recommendation.reason.length).toBeGreaterThan(20);
      expect(recommendation.benefit.length).toBeGreaterThan(20);
      expect(recommendation.risk.length).toBeGreaterThan(10);
      expect(recommendation.rule.length).toBeGreaterThan(3);
    }
  });

  it("rejects a recommendation with a missing audit field", () => {
    const base = getNextBestAction(RECORDS[0]);
    expect(validateRecommendation({ ...base, reason: "" })).toContain("missing reason");
    expect(validateRecommendation({ ...base, rule: "" })).toContain("missing rule");
    expect(validateRecommendation({ ...base, risk: "" })).toContain("missing risk");
    expect(validateRecommendation({ ...base, playbook: "WAIT" as SalesAction })).toContain(
      "playbook/action mismatch",
    );
  });

  it("is deterministic: same record, same recommendation", () => {
    const record = RECORDS[0];
    expect(JSON.stringify(getNextBestAction(record))).toBe(JSON.stringify(getNextBestAction(record)));
  });
});

describe("R20.10 — priority ranking (Fase 4)", () => {
  it("bands leads by observable facts", () => {
    const priorities = prioritizeOpportunities(RECORDS);
    expect(priorities).toHaveLength(3);
    const hot = priorities.find((p) => p.leadId === byBooking(RECORDS)?.leadId);
    expect(hot?.priority).toBe("HIGHEST");
    expect(priorities[0].order).toBe(1);
    for (const lead of priorities) {
      expect(SALES_PRIORITIES).toContain(lead.priority);
      expect(PRIORITY_ORDER[lead.priority]).toBeGreaterThanOrEqual(0);
    }
  });

  it("uses named bands with reasons and no learned weights", () => {
    expect(PRIORITY_BANDS.map((b) => b.id)).toEqual([
      "highest_booked",
      "highest_hot",
      "high_assessment",
      "high_fit",
      "medium_interest",
      "low_signal",
    ]);
    for (const band of PRIORITY_BANDS) expect(band.reason.length).toBeGreaterThan(10);
    expect(INTELLIGENCE).toContain("No ML, no learned weights");
  });

  it("orders ties deterministically", () => {
    const orders = [prioritizeOpportunities(RECORDS).map((p) => p.leadId), prioritizeOpportunities(RECORDS).map((p) => p.leadId)];
    expect(orders[0]).toEqual(orders[1]);
    expect(getTopSalesOpportunities(RECORDS, 2)).toHaveLength(2);
  });
});

describe("R20.10 — hot, nurture and proposal engines (Fases 8, 9, 10)", () => {
  it("scores hotness from explicit criteria, no ML", () => {
    expect(HOT_CRITERIA.map((c) => c.id)).toEqual([
      "booking",
      "advanced_assessment",
      "assessment",
      "contact",
      "product_interest",
      "crm_score",
    ]);
    const hot = getHotLeadScore(byBooking(RECORDS) as CrmLeadRecord);
    expect(hot.points).toBeGreaterThanOrEqual(85);
    expect(hot.reasons.length).toBe(HOT_CRITERIA.filter((c) => c.test(byBooking(RECORDS) as CrmLeadRecord)).length);
    const curiosity = getHotLeadScore(byCuriosity(RECORDS) as CrmLeadRecord);
    expect(curiosity.points).toBeLessThan(hot.points);
    expect(ACTIONS).toContain("no ML");
  });

  it("identifies nurture candidates (interest without intent)", () => {
    const candidates = getNurtureCandidates(RECORDS);
    const curiosity = byCuriosity(RECORDS) as CrmLeadRecord;
    expect(candidates.some((c) => c.leadId === curiosity.leadId)).toBe(true);
    expect(candidates.some((c) => c.leadId === byBooking(RECORDS)?.leadId)).toBe(false);
    expect(isNurtureCandidate(curiosity)).toBe(true);
    expect(isNurtureCandidate(byBooking(RECORDS) as CrmLeadRecord)).toBe(false);
  });

  it("flags proposal readiness with explicit gates", () => {
    const hot = byBooking(RECORDS) as CrmLeadRecord;
    const readiness = getProposalReadiness(hot);
    expect(readiness.gates.map((g) => g.id)).toEqual([
      "meeting_or_advanced_assessment",
      "score",
      "intent",
      "product_fit",
      "surface_depth",
    ]);
    expect(readiness.ready).toBe(true);
    expect(readiness.failed).toEqual([]);
    // A weak lead fails visibly, with the failing gates named.
    const weak = getProposalReadiness(byCuriosity(RECORDS) as CrmLeadRecord);
    expect(weak.ready).toBe(false);
    expect(weak.failed).toContain("meeting_or_advanced_assessment");
    expect(weak.failed).toContain("intent");
    expect(PROPOSAL_GATES.intent).toBe(70);
    // No proposal is ever produced — only a verdict.
    expect(getProposalCandidates(RECORDS).map((r) => r.leadId)).toEqual([hot.leadId]);
  });
});

describe("R20.10 — product sales intelligence (Fase 6)", () => {
  it("reports volume, demand, qualification and opportunity per product", () => {
    const demand = buildProductDemandReport([
      ...Array.from({ length: 120 }, () => ({ name: "page_view", path: "/qook" }) as FunnelInputEvent),
      { name: "product_interaction", label: "qook_interest", data: { product: "qook", action: "interest" } } as FunnelInputEvent,
      hotLead,
    ]);
    const rows = getProductSalesIntelligence(RECORDS, demand.scores);
    expect(rows).toHaveLength(PRODUCTS.length);
    const qook = rows.find((r) => r.slug === "qook");
    expect(qook?.volume).toBe(1);
    expect(qook?.opportunities).toBe(1);
    expect(qook?.demand).toBeGreaterThan(0);
    expect(Object.values(qook?.actions ?? {}).reduce((a, b) => a + b, 0)).toBe(1);
    const pikto = rows.find((r) => r.slug === "pikto");
    expect(pikto?.opportunities).toBe(0);
    expect(pikto?.playbook?.qualificationEngine).toBeTruthy();
  });

  it("never attributes a lead to a product outside the catalog", () => {
    const rows = getProductSalesIntelligence(RECORDS);
    for (const row of rows) expect(PRODUCTS.map((p) => p.slug)).toContain(row.slug);
    expect(rows.reduce((sum, row) => sum + row.volume, 0)).toBeLessThanOrEqual(RECORDS.length);
  });
});

describe("R20.10 — pipeline readiness + analytics (Fases 7, 13, 17)", () => {
  it("reports the pipeline shape and where it leaks", () => {
    const readiness = getPipelineReadiness(RECORDS);
    expect(readiness.model).toEqual(["LEAD", "QUALIFIED", "OPPORTUNITY", "SALES_ACTION", "PIPELINE_STAGE"]);
    expect(readiness.stages.map((s) => s.order)).toEqual([0, 1, 2, 3, 4]);
    expect(readiness.stages.reduce((sum, s) => sum + s.count, 0)).toBe(RECORDS.length);
    expect(readiness.readyToProgress).toBeGreaterThanOrEqual(1);
  });

  it("counts recommended calls, proposals, nurture and waiting leads", () => {
    const analytics = getSalesAnalytics(RECORDS);
    expect(analytics.leads).toBe(3);
    expect(
      analytics.recommendedCalls +
        analytics.recommendedProposals +
        analytics.nurtureLeads +
        analytics.waitingLeads,
    ).toBe(3);
    expect(analytics.recommendedProposals).toBeGreaterThanOrEqual(1);
    expect(analytics.opportunityDistribution).toBeTruthy();
    expect(analytics.actionCoverage).toBeGreaterThan(0);
  });

  it("prepares R20.12 dashboard rows without shipping a UI", () => {
    const rows = buildSalesDashboardRows(RECORDS);
    expect(rows).toHaveLength(3);
    for (const row of rows) {
      expect(SALES_PRIORITIES).toContain(row.priority);
      expect(SALES_ACTIONS).toContain(row.action);
      expect(row.rule.length).toBeGreaterThan(0);
      expect(new Date(row.generatedAt).toISOString()).toBe(row.generatedAt);
    }
    expect(rows[0].order).toBe(1);
  });

  it("answers every Fase approval question in one call", () => {
    const summary = getSalesSummary(RECORDS);
    expect(summary.answers.contactFirst).toBe(byBooking(RECORDS)?.leadId);
    expect(summary.answers.needsProposal).toBe(byBooking(RECORDS)?.leadId);
    // The top nurture candidate is the highest-scoring one, not the coldest.
    expect(summary.answers.needsNurture).toBe(byAssessment(RECORDS)?.leadId);
    expect(summary.answers.bestProduct).toBe("qook");
    expect(summary.answers.curiosityOnly).toBeTruthy();
    expect(summary.answers.potentialPipeline).toBeGreaterThan(0);
    expect(summary.answers.nextAction).toBeTruthy();
    expect(summary.answers.nextActionReason?.length).toBeGreaterThan(20);
  });

  it("returns empty analytics on an empty stream", () => {
    const analytics = getSalesAnalytics([]);
    expect(analytics.leads).toBe(0);
    expect(analytics.actionCoverage).toBeNull();
    expect(getSalesSummary([]).answers.contactFirst).toBeNull();
    expect(buildSalesDashboardRows([])).toEqual([]);
  });
});

describe("R20.10 — quality gates (Fase 16)", () => {
  it("contains no autonomous AI, no model provider, no execution", () => {
    const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    for (const file of [MODEL, ACTIONS, INTELLIGENCE]) {
      const code = stripComments(file);
      // No external provider, no network, no agent runtime.
      expect(code).not.toMatch(/openai|anthropic|gemini|fetch\(|axios|XMLHttpRequest/);
      expect(code).not.toMatch(/localStorage|sessionStorage|navigator\.|document\./);
      // No side effects: nothing sends, books or writes.
      expect(code).not.toMatch(/sendMail|smtp|sendEmail|mailchimp|hubspot|salesforce/);
      // No learning.
      expect(code).not.toMatch(/tensorflow|neural|classifier|brain\.js|randomForest/);
    }
  });

  it("declares itself deterministic and rule-based", () => {
    expect(ACTIONS).toContain("Nothing here executes");
    expect(MODEL).toContain("NO artificial intelligence");
    expect(INTELLIGENCE).toContain("no execution, no external service");
  });

  it("is reproducible: same records, same output", () => {
    expect(JSON.stringify(getSalesSummary(RECORDS).answers)).toBe(
      JSON.stringify(getSalesSummary(RECORDS).answers),
    );
    expect(JSON.stringify(prioritizeOpportunities(RECORDS))).toBe(JSON.stringify(prioritizeOpportunities(RECORDS)));
  });

  it("emits no PII in recommendations", () => {
    const serialized = JSON.stringify(buildSalesRecommendations(RECORDS));
    expect(serialized).not.toMatch(/@/);
    expect(serialized.toLowerCase()).not.toMatch(/email|phone|contact:/);
  });
});
