import type { FunnelInputEvent } from './funnel-intelligence';
import {
  CRM_STAGES,
  STAGE_ORDER,
  type CrmLeadRecord,
  type CrmStage,
  type FollowUpAction,
  type LeadSignals,
  type OpportunityClass,
  type ProductFit,
  type QualificationTier,
} from '../data/crm-contract';
import { getProductLandingAudit, getProductNetwork } from '../data/product-demand';
import { PRODUCTS } from '../data/products';
import { ASSESSMENTS } from '../lib/lead-magnets';
import { getLeadUnits, type LeadUnit } from './lead-signals';
import {
  DEFAULT_LEAD_WEIGHTS,
  getBestProductFit,
  getFollowUpAction,
  getLeadScore,
  getOpportunityClass,
  getProductFit,
  getQualification,
  stageForTier,
} from './lead-score';
import type { LeadScoreWeights } from '../data/crm-contract';
import type { ProductScoreBreakdown } from './product-intelligence';

/**
 * R20.9 — CRM Qualification (Fases 5, 6, 7, 12, 13, 14, 17).
 *
 * Consumes the R20.1 event stream and produces canonical lead records.
 * Pure computation — no CRM integration, no automation, no email, no
 * public UX. Every number traces back to an observed signal.
 */

const ROUTES = PRODUCTS.filter((p) => p.to).map((p) => p.to as string);

export interface BuildOptions {
  /** Per-product demand scores from R20.8; absent products score 0. */
  demandScores?: ProductScoreBreakdown[];
  weights?: LeadScoreWeights;
  resolvableRoutes?: string[];
}

const demandIndex = (scores: ProductScoreBreakdown[] = []): Map<string, ProductScoreBreakdown> =>
  new Map(scores.map((score) => [score.slug, score]));

/** Builds the canonical CRM record for one lead unit. */
export const toCrmRecord = (lead: LeadUnit, demand: Map<string, ProductScoreBreakdown>, weights?: LeadScoreWeights): CrmLeadRecord => {
  const fits = getProductFit(lead);
  const best = fits[0] ?? null;
  const score = getLeadScore(lead, best, (best && demand.get(best.slug)) || null, weights);
  const qualification = getQualification(score, lead.signals);
  const opportunity = getOpportunityClass(score, lead.signals);
  return {
    leadId: lead.leadId,
    source: lead.source,
    product: best && best.fit > 0 ? best.slug : null,
    qualification: qualification.tier,
    opportunity: opportunity.opportunity,
    stage: stageForTier(qualification.tier),
    score,
    productFits: fits,
    signals: lead.signals,
    recommendedAction: getFollowUpAction(qualification.tier, opportunity.opportunity, lead.signals),
    journey: lead.journey,
  };
};

/** Fase 17 helper — the full qualification pass over an event stream. */
export const buildCrmRecords = (events: FunnelInputEvent[], options: BuildOptions = {}): CrmLeadRecord[] => {
  const demand = demandIndex(options.demandScores);
  const weights = options.weights ?? DEFAULT_LEAD_WEIGHTS;
  return getLeadUnits(events).map((lead) => toCrmRecord(lead, demand, weights));
};

// ---------------------------------------------------------------------------
// Fase 5 — product qualification
// ---------------------------------------------------------------------------

/**
 * Fase 5 — per-product qualification. Each lead counts ONCE, under its
 * best-fit product (ties broken by signal provenance), so the totals stay
 * additive: summing `leads` never exceeds the number of leads.
 */
export interface ProductQualification {
  slug: string;
  name: string;
  leads: number;
  qualified: number;
  opportunities: number;
  /** Average composite lead score for this product. */
  averageScore: number;
  /** Of this product's leads, how many are real opportunities. */
  opportunityRate: number | null;
}

export const getProductQualification = (records: CrmLeadRecord[]): ProductQualification[] => {
  const audits = getProductLandingAudit(ROUTES);
  const network = getProductNetwork([]);
  const rows = new Map<string, { leads: number; qualified: number; opportunities: number; total: number }>();
  for (const record of records) {
    if (!record.product) continue;
    const row = rows.get(record.product) ?? { leads: 0, qualified: 0, opportunities: 0, total: 0 };
    row.leads += 1;
    if (record.qualification === 'HOT' || record.qualification === 'WARM') row.qualified += 1;
    if (record.opportunity === 'OPPORTUNITY' || record.opportunity === 'QUALIFIED') row.opportunities += 1;
    row.total += record.score.score;
    rows.set(record.product, row);
  }
  return audits.map((audit) => {
    const node = network.find((n) => n.slug === audit.slug);
    const row = rows.get(audit.slug) ?? { leads: 0, qualified: 0, opportunities: 0, total: 0 };
    return {
      slug: audit.slug,
      name: node?.name ?? audit.name,
      leads: row.leads,
      qualified: row.qualified,
      opportunities: row.opportunities,
      averageScore: row.leads > 0 ? Math.round((row.total / row.leads) * 100) / 100 : 0,
      opportunityRate: row.leads >= 5 && row.opportunities > 0
        ? Math.round((row.opportunities / row.leads) * 1000) / 1000
        : null,
    };
  }).sort((a, b) => b.opportunities - a.opportunities || b.leads - a.leads || (a.slug < b.slug ? -1 : 1));
};

// ---------------------------------------------------------------------------
// Fase 6 — assessment qualification
// ---------------------------------------------------------------------------

export interface AssessmentQualification {
  assessmentId: string;
  category: string;
  leads: number;
  hot: number;
  warm: number;
  nurture: number;
  averageScore: number;
  opportunityRate: number | null;
}

export const getAssessmentQualification = (records: CrmLeadRecord[]): AssessmentQualification[] => {
  const rows = new Map<string, { hot: number; warm: number; nurture: number; total: number }>();
  for (const record of records) {
    const id = record.signals.assessmentId;
    if (!id) continue;
    const row = rows.get(id) ?? { hot: 0, warm: 0, nurture: 0, total: 0 };
    if (record.qualification === 'HOT') row.hot += 1;
    else if (record.qualification === 'WARM') row.warm += 1;
    else row.nurture += 1;
    row.total += record.score.score;
    rows.set(id, row);
  }
  return ASSESSMENTS.filter((assessment) => rows.has(assessment.id)).map((assessment) => {
    const row = rows.get(assessment.id) as { hot: number; warm: number; nurture: number; total: number };
    const leads = row.hot + row.warm + row.nurture;
    const opportunities = row.hot + row.warm;
    return {
      assessmentId: assessment.id,
      category: assessment.category,
      leads,
      hot: row.hot,
      warm: row.warm,
      nurture: row.nurture,
      averageScore: leads > 0 ? Math.round((row.total / leads) * 100) / 100 : 0,
      opportunityRate: leads >= 5 && opportunities > 0
        ? Math.round((opportunities / leads) * 1000) / 1000
        : null,
    };
  }).sort((a, b) => b.leads - a.leads || (a.assessmentId < b.assessmentId ? -1 : 1));
};

// ---------------------------------------------------------------------------
// Fase 7 + 12 — pipeline structure and analytics
// ---------------------------------------------------------------------------

export interface PipelineStats {
  leads: number;
  qualified: number;
  opportunities: number;
  /** opportunities / leads, null below 5 leads (sample too small). */
  conversionRate: number | null;
  byTier: Record<QualificationTier, number>;
  byOpportunity: Record<OpportunityClass, number>;
  byStage: Record<CrmStage, number>;
  /** Lead count per best-fit product. */
  productDistribution: Record<string, number>;
  /** Lead count per recommended action. */
  byAction: Record<FollowUpAction, number>;
}

const emptyDistribution = <T extends string>(keys: readonly T[]): Record<T, number> =>
  keys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {} as Record<T, number>);

export const getPipelineStats = (records: CrmLeadRecord[]): PipelineStats => {
  const byTier = emptyDistribution<QualificationTier>(['HOT', 'WARM', 'COLD', 'NURTURE']);
  const byOpportunity = emptyDistribution<OpportunityClass>(['NO_SIGNAL', 'EARLY', 'PROMISING', 'QUALIFIED', 'OPPORTUNITY']);
  const byStage = emptyDistribution<CrmStage>(CRM_STAGES);
  const byAction = emptyDistribution<FollowUpAction>(['BOOK_CALL', 'SEND_PROPOSAL', 'NURTURE', 'WAIT']);
  const productDistribution: Record<string, number> = {};

  for (const record of records) {
    byTier[record.qualification] += 1;
    byOpportunity[record.opportunity] += 1;
    byStage[record.stage] += 1;
    byAction[record.recommendedAction] += 1;
    if (record.product) productDistribution[record.product] = (productDistribution[record.product] ?? 0) + 1;
  }
  const leads = records.length;
  const qualified = byTier.HOT + byTier.WARM;
  const opportunities = byOpportunity.QUALIFIED + byOpportunity.OPPORTUNITY;
  return {
    leads,
    qualified,
    opportunities,
    conversionRate: leads >= 5 && opportunities > 0
      ? Math.round((opportunities / leads) * 1000) / 1000
      : null,
    byTier,
    byOpportunity,
    byStage,
    productDistribution,
    byAction,
  };
};

// ---------------------------------------------------------------------------
// Fase 13 — attribution chain
// ---------------------------------------------------------------------------

export interface LeadAttribution {
  landing: string | null;
  case: string | null;
  pillar: string | null;
  assessment: string | null;
  product: string | null;
}

/** Landing → case → pillar → assessment → lead → qualification (preserved). */
export const getLeadAttribution = (records: CrmLeadRecord[]): Record<string, LeadAttribution> => {
  const out: Record<string, LeadAttribution> = {};
  for (const record of records) {
    out[record.leadId] = {
      landing: record.signals.landingViews[0] ?? null,
      case: record.signals.caseViews[0] ?? null,
      pillar: record.signals.pillarViews[0] ?? null,
      assessment: record.signals.assessmentId,
      product: record.product,
    };
  }
  return out;
};

// ---------------------------------------------------------------------------
// Fase 14 — priority queue
// ---------------------------------------------------------------------------

const TIER_RANK: Record<QualificationTier, number> = { HOT: 0, WARM: 1, COLD: 2, NURTURE: 3 };
const OPPORTUNITY_RANK: Record<OpportunityClass, number> = {
  OPPORTUNITY: 0,
  QUALIFIED: 1,
  PROMISING: 2,
  EARLY: 3,
  NO_SIGNAL: 4,
};

/**
 * Fase 14 — deterministic ordering: score desc → opportunity class →
 * tier → leadId asc. Ties never reorder between runs.
 */
export const getPriorityQueue = (records: CrmLeadRecord[]): CrmLeadRecord[] =>
  [...records].sort(
    (a, b) =>
      b.score.score - a.score.score ||
      OPPORTUNITY_RANK[a.opportunity] - OPPORTUNITY_RANK[b.opportunity] ||
      TIER_RANK[a.qualification] - TIER_RANK[b.qualification] ||
      (a.leadId < b.leadId ? -1 : a.leadId > b.leadId ? 1 : 0),
  );

/** Fase 17 helper — top opportunities for the queue. */
export const getTopOpportunities = (records: CrmLeadRecord[], limit = 10): CrmLeadRecord[] =>
  getPriorityQueue(records)
    .filter((record) => record.opportunity === 'OPPORTUNITY' || record.opportunity === 'QUALIFIED')
    .slice(0, limit);

/** Pipeline stage progression helper (Fase 7) — counts per stage, ordered. */
export const getPipelineStages = (records: CrmLeadRecord[]): Array<{ stage: CrmStage; count: number; order: number }> =>
  CRM_STAGES.map((stage) => ({
    stage,
    count: records.filter((record) => record.stage === stage).length,
    order: STAGE_ORDER[stage],
  })).sort((a, b) => a.order - b.order);

export type { LeadSignals, ProductFit, CrmLeadRecord };
