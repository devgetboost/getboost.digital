import type { CrmLeadRecord, CrmStage } from '../data/crm-contract';
import { CRM_STAGES, STAGE_ORDER } from '../data/crm-contract';
import {
  PRIORITY_ORDER,
  SALES_PRIORITIES,
  buildProductPlaybooks,
  type ProductPlaybook,
  type SalesAction,
  type SalesPriority,
  type SalesModelStage,
} from '../data/sales-model';
import { PRODUCTS } from '../data/products';
import type { ProductScoreBreakdown } from './product-intelligence';
import {
  ACTION_RULES,
  buildSalesRecommendations,
  getHotLeadScore,
  getNextBestAction,
  getProposalReadiness,
  isNurtureCandidate,
  type SalesRecommendation,
} from './sales-actions';

/**
 * R20.10 — Sales Intelligence (Fases 4, 6, 7, 13, 15, 17).
 *
 * Ranking, per-product commercial intelligence, pipeline readiness, sales
 * analytics and the R20.12 dashboard feeds. Pure computation over R20.9
 * records — no UI, no execution, no external service.
 */

// ---------------------------------------------------------------------------
// Fase 4 — opportunity prioritization
// ---------------------------------------------------------------------------

export interface PrioritizedLead {
  leadId: string;
  priority: SalesPriority;
  /** Composite lead score (R20.9). */
  score: number;
  intent: number;
  fit: number;
  /** Hot-lead engine points (Fase 8). */
  hotPoints: number;
  booked: boolean;
  assessed: boolean;
  product: string | null;
  action: SalesAction;
  order: number;
}

export interface PriorityBand {
  id: string;
  priority: SalesPriority;
  test: (lead: Omit<PrioritizedLead, 'priority' | 'order'>) => boolean;
  reason: string;
}

/**
 * Deterministic bands over observable facts (Fase 4): lead score, intent,
 * booking, assessment and product fit. No ML, no learned weights.
 */
export const PRIORITY_BANDS: PriorityBand[] = [
  {
    id: 'highest_booked',
    priority: 'HIGHEST',
    test: (lead) => lead.booked && (lead.score >= 45 || lead.intent >= 70),
    reason: 'Reunião agendada com intenção comprovada',
  },
  {
    id: 'highest_hot',
    priority: 'HIGHEST',
    test: (lead) => lead.hotPoints >= 65,
    reason: 'Hot-lead points ≥ 65',
  },
  {
    id: 'high_assessment',
    priority: 'HIGH',
    test: (lead) => lead.assessed && lead.score >= 35,
    reason: 'Assessment concluído com score ≥ 35',
  },
  {
    id: 'high_fit',
    priority: 'HIGH',
    test: (lead) => lead.fit >= 60 && lead.score >= 30,
    reason: 'Product fit forte (≥ 60) com score ≥ 30',
  },
  {
    id: 'medium_interest',
    priority: 'MEDIUM',
    test: (lead) => lead.score >= 15 || lead.assessed,
    reason: 'Interesse acima do piso de score',
  },
  {
    id: 'low_signal',
    priority: 'LOW',
    test: () => true,
    reason: 'Sinal residual — manter em observação',
  },
];

const toPrioritized = (record: CrmLeadRecord): Omit<PrioritizedLead, 'priority' | 'order'> => ({
  leadId: record.leadId,
  score: record.score.score,
  intent: record.score.intent,
  fit: record.productFits[0]?.fit ?? 0,
  hotPoints: getHotLeadScore(record).points,
  booked: record.signals.booked,
  assessed: Boolean(record.signals.assessmentId),
  product: record.product,
  action: getNextBestAction(record).action,
});

/**
 * Fase 4 ranking. Ties break deterministically (score → intent → hot points
 * → leadId), so the order never shifts between runs.
 */
export const prioritizeOpportunities = (records: CrmLeadRecord[]): PrioritizedLead[] => {
  const scored = records.map((record) => {
    const base = toPrioritized(record);
    const band = PRIORITY_BANDS.find((candidate) => candidate.test(base));
    return { ...base, priority: band?.priority ?? 'LOW', reason: band?.reason ?? 'Sem sinal' };
  });
  const sorted = [...scored].sort(
    (a, b) =>
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] ||
      b.score - a.score ||
      b.intent - a.intent ||
      b.hotPoints - a.hotPoints ||
      (a.leadId < b.leadId ? -1 : a.leadId > b.leadId ? 1 : 0),
  );
  return sorted.map((lead, index) => ({
    leadId: lead.leadId,
    priority: lead.priority,
    score: lead.score,
    intent: lead.intent,
    fit: lead.fit,
    hotPoints: lead.hotPoints,
    booked: lead.booked,
    assessed: lead.assessed,
    product: lead.product,
    action: lead.action,
    order: index + 1,
  }));
};

// ---------------------------------------------------------------------------
// Fase 6 — product sales intelligence
// ---------------------------------------------------------------------------

export interface ProductSalesRow {
  slug: string;
  name: string;
  /** Leads attributed to this product (best fit). */
  volume: number;
  /** Hot/WARM qualified leads. */
  qualified: number;
  opportunities: number;
  /** R20.8 demand score (0 when no demand data exists yet). */
  demand: number;
  /** Average composite lead score for this product's leads. */
  averageScore: number;
  /** Recommended commercial actions for this product's leads. */
  actions: Record<SalesAction, number>;
  playbook: ProductPlaybook | null;
}

/** Volume · demand · qualification · opportunity per product (Fase 6). */
export const getProductSalesIntelligence = (
  records: CrmLeadRecord[],
  demandScores: ProductScoreBreakdown[] = [],
  caseNarratives: { slug: string; to?: string }[] = [],
): ProductSalesRow[] => {
  const playbooks = new Map(buildProductPlaybooks(caseNarratives).map((p) => [p.slug, p]));
  const demand = new Map(demandScores.map((score) => [score.slug, score.score]));
  const emptyActions = (): Record<SalesAction, number> => ({ BOOK_CALL: 0, SEND_PROPOSAL: 0, NURTURE: 0, WAIT: 0 });

  return PRODUCTS.map((product) => {
    const leads = records.filter((record) => record.product === product.slug);
    const actions = emptyActions();
    let total = 0;
    for (const record of leads) {
      actions[getNextBestAction(record).action] += 1;
      total += record.score.score;
    }
    return {
      slug: product.slug,
      name: product.name,
      volume: leads.length,
      qualified: leads.filter((r) => r.qualification === 'HOT' || r.qualification === 'WARM').length,
      opportunities: leads.filter((r) => r.opportunity === 'OPPORTUNITY' || r.opportunity === 'QUALIFIED').length,
      demand: demand.get(product.slug) ?? 0,
      averageScore: leads.length > 0 ? Math.round((total / leads.length) * 100) / 100 : 0,
      actions,
      playbook: playbooks.get(product.slug) ?? null,
    };
  }).sort((a, b) => b.opportunities - a.opportunities || b.volume - a.volume || (a.slug < b.slug ? -1 : 1));
};

// ---------------------------------------------------------------------------
// Fase 7 — pipeline readiness
// ---------------------------------------------------------------------------

export interface PipelineReadiness {
  model: readonly SalesModelStage[];
  /** Lead count per CRM stage (Fase 7 structure). */
  stages: Array<{ stage: CrmStage; count: number; order: number }>;
  /** Stage with the biggest drop — where the pipeline leaks. */
  leakStage: CrmStage | null;
  /** Leads ready to progress, per stage. */
  readyToProgress: number;
}

export const getPipelineReadiness = (records: CrmLeadRecord[]): PipelineReadiness => {
  const stages = CRM_STAGES.map((stage) => ({
    stage,
    count: records.filter((record) => record.stage === stage).length,
    order: STAGE_ORDER[stage],
  })).sort((a, b) => a.order - b.order);

  let leakStage: CrmStage | null = null;
  let worst = 0;
  for (let i = 1; i < stages.length; i += 1) {
    const drop = stages[i - 1].count - stages[i].count;
    if (drop > worst) {
      worst = drop;
      leakStage = stages[i].stage;
    }
  }
  return {
    model: ['LEAD', 'QUALIFIED', 'OPPORTUNITY', 'SALES_ACTION', 'PIPELINE_STAGE'],
    stages,
    leakStage,
    readyToProgress: records.filter((record) => getProposalReadiness(record).ready).length,
  };
};

// ---------------------------------------------------------------------------
// Fase 13 — sales analytics
// ---------------------------------------------------------------------------

export interface SalesAnalytics {
  leads: number;
  recommendedCalls: number;
  recommendedProposals: number;
  nurtureLeads: number;
  waitingLeads: number;
  hotLeads: number;
  /** Opportunity class distribution. */
  opportunityDistribution: Record<string, number>;
  priorityDistribution: Record<SalesPriority, number>;
  /** Share of leads with a commercial action (everything except WAIT). */
  actionCoverage: number | null;
}

export const getSalesAnalytics = (
  records: CrmLeadRecord[],
  recommendations: SalesRecommendation[] = buildSalesRecommendations(records),
  priorities: PrioritizedLead[] = prioritizeOpportunities(records),
): SalesAnalytics => {
  const count = (action: SalesAction) => recommendations.filter((r) => r.action === action).length;
  const recommendedCalls = count('BOOK_CALL');
  const recommendedProposals = count('SEND_PROPOSAL');
  const nurtureLeads = count('NURTURE');
  const waitingLeads = count('WAIT');
  const hotLeads = records.filter((record) => getHotLeadScore(record).points >= 65).length;

  const opportunityDistribution: Record<string, number> = {};
  for (const record of records) {
    opportunityDistribution[record.opportunity] = (opportunityDistribution[record.opportunity] ?? 0) + 1;
  }
  const priorityDistribution = SALES_PRIORITIES.reduce(
    (acc, priority) => ({ ...acc, [priority]: priorities.filter((p) => p.priority === priority).length }),
    {} as Record<SalesPriority, number>,
  );
  const leads = records.length;
  return {
    leads,
    recommendedCalls,
    recommendedProposals,
    nurtureLeads,
    waitingLeads,
    hotLeads,
    opportunityDistribution,
    priorityDistribution,
    actionCoverage: leads > 0
      ? Math.round(((leads - waitingLeads) / leads) * 1000) / 1000
      : null,
  };
};

// ---------------------------------------------------------------------------
// Fase 15 — helpers
// ---------------------------------------------------------------------------

/** Top opportunities to work, highest priority first. */
export const getTopSalesOpportunities = (records: CrmLeadRecord[], limit = 10): PrioritizedLead[] =>
  prioritizeOpportunities(records).slice(0, limit);

/** Fase 10 — leads that pass every proposal gate (no proposal is generated). */
export const getProposalCandidates = (records: CrmLeadRecord[]) =>
  records
    .filter((record) => getProposalReadiness(record).ready)
    .sort((a, b) => b.score.score - a.score.score || (a.leadId < b.leadId ? -1 : 1));

/** Fase 9 — nurture candidates. */
export const getNurtureCandidates = (records: CrmLeadRecord[]) =>
  records
    .filter(isNurtureCandidate)
    .sort((a, b) => b.score.score - a.score.score || (a.leadId < b.leadId ? -1 : 1));

/** One-shot summary for the operator: answers every Fase approval question. */
export const getSalesSummary = (
  records: CrmLeadRecord[],
  demandScores: ProductScoreBreakdown[] = [],
) => {
  const recommendations = buildSalesRecommendations(records);
  const priorities = prioritizeOpportunities(records);
  const products = getProductSalesIntelligence(records, demandScores);
  const analytics = getSalesAnalytics(records, recommendations, priorities);
  return {
    analytics,
    priorities,
    recommendations,
    products,
    pipeline: getPipelineReadiness(records),
    answers: {
      /** Que lead contactar primeiro? */
      contactFirst: priorities.find((p) => p.priority === 'HIGHEST')?.leadId ?? null,
      /** Que lead precisa de proposta? */
      needsProposal: getProposalCandidates(records)[0]?.leadId ?? null,
      /** Que lead deve entrar em nurture? */
      needsNurture: getNurtureCandidates(records)[0]?.leadId ?? null,
      /** Que produto gera melhores oportunidades? */
      bestProduct: products.find((p) => p.opportunities > 0)?.slug ?? null,
      /** Que produto gera apenas curiosidade? */
      curiosityOnly: products.find((p) => p.volume > 0 && p.opportunities === 0)?.slug ?? null,
      /** Que pipeline potencial existe? */
      potentialPipeline: analytics.recommendedCalls + analytics.recommendedProposals,
      /** Qual a próxima ação recomendada? (most urgent lead) */
      nextAction: recommendations.length > 0 ? recommendations[0].action : null,
      /** Porque foi recomendada? */
      nextActionReason: recommendations.length > 0 ? recommendations[0].reason : null,
    },
  };
};

// ---------------------------------------------------------------------------
// Fase 17 — R20.12 dashboard feeds (data only, no UI)
// ---------------------------------------------------------------------------

export interface SalesDashboardRow {
  leadId: string;
  /** Deterministic position in the priority queue (1 = act first). */
  order: number;
  priority: SalesPriority;
  score: number;
  action: SalesAction;
  rule: string;
  product: string | null;
  booked: boolean;
  /** ISO timestamp of the snapshot. */
  generatedAt: string;
}

export const buildSalesDashboardRows = (records: CrmLeadRecord[]): SalesDashboardRow[] => {
  const generatedAt = new Date().toISOString();
  const recommendations = new Map(buildSalesRecommendations(records).map((r) => [r.leadId, r]));
  return prioritizeOpportunities(records).map((lead) => {
    const recommendation = recommendations.get(lead.leadId) as SalesRecommendation;
    return {
      leadId: lead.leadId,
      order: lead.order,
      priority: lead.priority,
      score: lead.score,
      action: recommendation.action,
      rule: recommendation.rule,
      product: lead.product,
      booked: lead.booked,
      generatedAt,
    };
  });
};

export type { SalesRecommendation };
export { ACTION_RULES };
