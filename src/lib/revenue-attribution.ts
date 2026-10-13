import { pillarForPath } from './funnel-intelligence';
import { CASES, type CaseStudy } from '../data/cases';
import type { CrmLeadRecord } from '../data/crm-contract';

/**
 * R20.18 — Revenue Attribution Engine.
 *
 * Pure computation: turns imported CRM rows (opportunities + revenue
 * ledger) plus browser lead records into first/last/multi-touch revenue
 * attribution. No DOM, no storage, no network — runs in CI and, later,
 * against warehouse exports.
 *
 * Linkage contract: an opportunity carries `lead_ref`, the browser
 * pseudonymous `leadId` (`lead_<hash>`), stamped at capture time. Rows
 * without a matching lead are reported as unattributed, never guessed.
 * (Capture paths stamping `metadata.lead_ref` is a documented integration
 * step, not yet implemented — see the R20.18 report.)
 */

export type OpportunityStage = 'open' | 'proposal_sent' | 'negotiation' | 'won' | 'lost';

export const OPPORTUNITY_STAGES: OpportunityStage[] = ['open', 'proposal_sent', 'negotiation', 'won', 'lost'];

/** Canonical lead entity (Phase 2). Browser identity stays pseudonymous. */
export interface RevenueLead {
  lead_id: string;
  source: string;
  medium: string;
  campaign: string;
  landing_page: string | null;
  service_interest: string | null;
  product_interest: string | null;
  /** Case narrative that touched this opportunity (title or null). */
  case_interest: string | null;
}

/** Canonical opportunity entity (Phase 2). Money only from won rows. */
export interface RevenueOpportunity {
  opportunity_id: string;
  /** Browser leadId for attribution linkage (null = unattributed). */
  lead_id: string | null;
  /** CRM/database uuid once the operator creates it. */
  crm_id: string | null;
  source: string;
  medium: string;
  campaign: string;
  landing_page: string | null;
  service_interest: string | null;
  product_interest: string | null;
  /** Case narrative that touched this opportunity (title or null). */
  case_interest: string | null;
  proposal_value: number | null;
  won_value: number | null;
  close_date: string | null;
  status: OpportunityStage;
}

/** Canonical ledger row (Phase 2). Append-only; won rows carry value. */
export interface RevenueEvent {
  opportunity_id: string;
  lead_id: string | null;
  stage: OpportunityStage;
  value: number | null;
  occurred_at?: string;
}

/** All three models per customer (Phase 4). Nulls where data is absent. */
export interface RevenueAttribution {
  opportunity_id: string;
  first_page: string | null;
  first_source: string;
  last_source: string;
  meeting_source: string | null;
  revenue_source: string;
  multi_touch: string[];
}

/** Import row: what the operator pastes from the CRM export. */
export interface CrmExportRow {
  opportunity_id: string;
  lead_id?: string | null;
  crm_id?: string | null;
  source?: string;
  medium?: string;
  campaign?: string;
  landing_page?: string | null;
  service_interest?: string | null;
  product_interest?: string | null;
  case_interest?: string | null;
  proposal_value?: number | null;
  won_value?: number | null;
  close_date?: string | null;
  status: OpportunityStage;
}

const cleanSource = (value: unknown, fallback = 'unknown'): string => {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim().toLowerCase().slice(0, 60);
  return trimmed.length > 0 ? trimmed : fallback;
};

const cleanMoney = (value: unknown): number | null => {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100) / 100;
};

/** Normalises an import row; invalid rows are rejected, never repaired. */
export const normalizeOpportunity = (row: CrmExportRow): RevenueOpportunity | null => {
  if (!row || typeof row.opportunity_id !== 'string' || row.opportunity_id.length === 0) return null;
  if (!OPPORTUNITY_STAGES.includes(row.status)) return null;
  if (row.status === 'won' && (cleanMoney(row.won_value) === null || !row.close_date)) return null;
  return {
    opportunity_id: row.opportunity_id,
    lead_id: typeof row.lead_id === 'string' && row.lead_id.length > 0 ? row.lead_id : null,
    crm_id: typeof row.crm_id === 'string' && row.crm_id.length > 0 ? row.crm_id : null,
    source: cleanSource(row.source),
    medium: cleanSource(row.medium),
    campaign: cleanSource(row.campaign),
    landing_page: typeof row.landing_page === 'string' && row.landing_page ? row.landing_page : null,
    service_interest: typeof row.service_interest === 'string' && row.service_interest ? row.service_interest : null,
    product_interest: typeof row.product_interest === 'string' && row.product_interest ? row.product_interest : null,
    case_interest: typeof row.case_interest === 'string' && row.case_interest ? row.case_interest.slice(0, 80) : null,
    proposal_value: cleanMoney(row.proposal_value),
    won_value: cleanMoney(row.won_value),
    close_date: typeof row.close_date === 'string' ? row.close_date : null,
    status: row.status,
  };
};

/** First/last/multi-touch attribution for one opportunity + lead pair. */
export const attributeRevenue = (
  opportunity: RevenueOpportunity,
  lead: CrmLeadRecord | null,
): RevenueAttribution => {
  const journey = lead?.journey.filter((s) => typeof s === 'string') ?? [];
  const touches = [...new Set(journey)];
  // Meeting source: last touch at or before the booking step; without a
  // booking step in the journey we report null instead of guessing.
  const bookingIndex = journey.findIndex((step) => step === '/booking' || step.startsWith('/booking?'));
  const meeting_source =
    bookingIndex > 0 ? touches.filter((t) => journey.indexOf(t) <= bookingIndex).pop() ?? null : null;
  return {
    opportunity_id: opportunity.opportunity_id,
    first_page: journey[0] ?? opportunity.landing_page,
    first_source: cleanSource(opportunity.source),
    last_source: cleanSource(touches[touches.length - 1] ?? opportunity.source),
    meeting_source,
    revenue_source: cleanSource(opportunity.source),
    multi_touch: touches,
  };
};

// ---------------------------------------------------------------------------
// Aggregations (Phases 5, 7, 8, 9)
// ---------------------------------------------------------------------------

export interface RevenueSlice {
  key: string;
  label: string;
  pipeline: number;
  won: number;
  deals: number;
  /** Lost deal count. */
  lost: number;
  /** Value of the lost proposals — what left the table. */
  lostValue: number;
}

const emptySlice = (key: string, label: string): RevenueSlice => ({
  key, label, pipeline: 0, won: 0, deals: 0, lost: 0, lostValue: 0,
});

const addOpportunity = (slice: RevenueSlice, opportunity: RevenueOpportunity): void => {
  const value = opportunity.proposal_value ?? opportunity.won_value ?? 0;
  slice.pipeline += value;
  if (opportunity.status === 'won') {
    slice.won += opportunity.won_value ?? 0;
    slice.deals += 1;
  }
  if (opportunity.status === 'lost') {
    slice.lost += 1;
    slice.lostValue += value;
  }
};

const rankSlices = (rows: Map<string, RevenueSlice>): RevenueSlice[] =>
  [...rows.values()].sort((a, b) => b.won - a.won || b.pipeline - a.pipeline || a.key.localeCompare(b.key));

/** Generic slicer: group opportunities by any string dimension. */
export const sliceRevenueBy = (
  opportunities: RevenueOpportunity[],
  pick: (opportunity: RevenueOpportunity) => string | null,
  label: (key: string) => string = (key) => key,
): RevenueSlice[] => {
  const rows = new Map<string, RevenueSlice>();
  for (const opportunity of opportunities) {
    const key = pick(opportunity) ?? 'unknown';
    if (!rows.has(key)) rows.set(key, emptySlice(key, label(key)));
    addOpportunity(rows.get(key) as RevenueSlice, opportunity);
  }
  return rankSlices(rows);
};

export const revenueBySource = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.source);

export const revenueByMedium = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.medium);

export const revenueByCampaign = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.campaign);

export const revenueByLandingPage = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.landing_page);

export const revenueByProduct = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.product_interest);

/** Service rollup: explicit landing→service map, pillar fallback, else unknown. */
const LANDING_SERVICE: Record<string, string> = {
  'automacao-whatsapp': 'WhatsApp',
  'integracao-crm': 'CRM',
  'integracao-erp': 'ERP',
  'ai-agentes-imobiliario': 'AI',
  'ai-agentes-clinicas': 'AI',
  'ai-agentes-restauracao': 'AI',
  'desenvolvimento-saas': 'SaaS',
  'software-gestao': 'Software',
  'growth-system': 'Growth',
  'geracao-leads': 'Growth',
};

const PILLAR_SERVICE: Record<string, string> = {
  ai: 'AI',
  automation: 'Automation',
  software: 'Software',
  growth: 'Growth',
};

export const serviceForLanding = (landingPage: string | null): string | null => {
  if (!landingPage) return null;
  const slug = landingPage.replace(/^\//, '').split('/').pop() ?? '';
  if (LANDING_SERVICE[slug]) return LANDING_SERVICE[slug];
  const pillar = pillarForPath(landingPage.startsWith('/') ? landingPage : `/${landingPage}`);
  return pillar ? PILLAR_SERVICE[pillar] : null;
};

export const revenueByService = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.service_interest ?? serviceForLanding(o.landing_page));

export const revenueByChannel = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => `${o.source} / ${o.medium}`);

/**
 * Case narrative per shipped case, keyed by the product page the case links
 * to. A case is credited only when the journey reached that page — never
 * inferred from sector or product name.
 */
const CASE_BY_DESTINATION: Record<string, string> = Object.fromEntries(
  CASES.filter((c): c is CaseStudy & { to: string } => typeof c.to === 'string').map((c) => [c.to, c.title]),
);

/** Case narrative reached in a journey (last touch wins), null when none. */
export const caseFromJourney = (journey: string[]): string | null => {
  for (let i = journey.length - 1; i >= 0; i -= 1) {
    const step = journey[i];
    if (typeof step !== 'string') continue;
    const clean = step.split('?')[0].replace(/\/+$/, '');
    if (CASE_BY_DESTINATION[clean]) return CASE_BY_DESTINATION[clean];
  }
  return null;
};

/**
 * Stamps the case narrative on an opportunity: the imported row wins when the
 * operator filled it, otherwise the journey decides. Never guesses.
 */
export const stampCaseInterest = (
  opportunity: RevenueOpportunity,
  journey: string[] = [],
): RevenueOpportunity =>
  opportunity.case_interest !== null
    ? opportunity
    : { ...opportunity, case_interest: caseFromJourney(journey) };

export const revenueByCaseStudy = (opportunities: RevenueOpportunity[]): RevenueSlice[] =>
  sliceRevenueBy(opportunities, (o) => o.case_interest);

export interface RevenueTotals {
  pipeline: number;
  won: number;
  /** Lost deal count. */
  lost: number;
  /** Value of the lost proposals. */
  lostValue: number;
  deals: number;
  proposals: number;
  averageDeal: number | null;
  winRate: number | null;
}

/** Pipeline value, won revenue, average deal and win rate (Phase 5/10). */
export const getRevenueTotals = (opportunities: RevenueOpportunity[]): RevenueTotals => {
  let pipeline = 0;
  let won = 0;
  let lost = 0;
  let lostValue = 0;
  let deals = 0;
  let proposals = 0;
  for (const o of opportunities) {
    const value = o.proposal_value ?? o.won_value ?? 0;
    pipeline += value;
    if (o.status === 'won') {
      won += o.won_value ?? 0;
      deals += 1;
    }
    if (o.status === 'lost') {
      lost += 1;
      lostValue += value;
    }
    if (o.status === 'proposal_sent' || o.status === 'negotiation' || o.status === 'won') proposals += 1;
  }
  const decided = deals + lost;
  return {
    pipeline: Math.round(pipeline * 100) / 100,
    won: Math.round(won * 100) / 100,
    lost,
    lostValue: Math.round(lostValue * 100) / 100,
    deals,
    proposals,
    averageDeal: deals > 0 ? Math.round((won / deals) * 100) / 100 : null,
    winRate: decided > 0 ? Math.round((deals / decided) * 1000) / 1000 : null,
  };
};

// ---------------------------------------------------------------------------
// Commercial funnel (Phase 6)
// ---------------------------------------------------------------------------

export interface CommercialFunnelStep {
  stage: string;
  count: number;
  /** Conversion vs the previous stage; null below a 5-lead floor. */
  rate: number | null;
}

export interface CommercialFunnel {
  visitors: number;
  leads: number;
  qualified: number;
  meetings: number;
  proposals: number;
  negotiations: number;
  won: number;
  lost: number;
  steps: CommercialFunnelStep[];
}

/**
 * Full-funnel counts. Browser stages come from lead records + page views;
 * commercial stages come from imported opportunities. Rate floors keep small
 * samples honest.
 */
export const getCommercialFunnel = (
  visitors: number,
  leads: CrmLeadRecord[],
  opportunities: RevenueOpportunity[],
): CommercialFunnel => {
  const qualified = leads.filter((l) => l.qualification === 'HOT' || l.qualification === 'WARM').length;
  const meetings = leads.filter((l) => l.signals.booked).length;
  const proposals = opportunities.filter((o) => o.status === 'proposal_sent' || o.status === 'negotiation' || o.status === 'won').length;
  const negotiations = opportunities.filter((o) => o.status === 'negotiation' || o.status === 'won').length;
  const won = opportunities.filter((o) => o.status === 'won').length;
  const lost = opportunities.filter((o) => o.status === 'lost').length;
  const counts: Array<[string, number]> = [
    ['Visitors', visitors],
    ['Leads', leads.length],
    ['Qualified', qualified],
    ['Meetings', meetings],
    ['Proposals', proposals],
    ['Negotiations', negotiations],
    ['Won', won],
    ['Lost', lost],
  ];
  let previous: number | null = null;
  const steps = counts.map(([stage, count]) => {
    const rate =
      previous !== null && previous >= 5 && count > 0
        ? Math.round((count / previous) * 1000) / 1000
        : null;
    previous = stage === 'Lost' ? previous : count;
    return { stage, count, rate };
  });
  return { visitors, leads: leads.length, qualified, meetings, proposals, negotiations, won, lost, steps };
};

// ---------------------------------------------------------------------------
// ROI (Phase 9) — revenue share always; ROI multiples only with spend
// ---------------------------------------------------------------------------

export interface SourceRoi {
  source: string;
  revenue: number;
  deals: number;
  spend: number | null;
  /** Revenue multiple; null without spend — never estimated. */
  roi: number | null;
}

export const getSourceRoi = (
  opportunities: RevenueOpportunity[],
  spendBySource: Record<string, number> = {},
): SourceRoi[] => {
  const rows = new Map<string, { revenue: number; deals: number }>();
  for (const o of opportunities) {
    if (o.status !== 'won') continue;
    const row = rows.get(o.source) ?? { revenue: 0, deals: 0 };
    row.revenue += o.won_value ?? 0;
    row.deals += 1;
    rows.set(o.source, row);
  }
  return [...rows.entries()]
    .map(([source, row]) => {
      const spend = typeof spendBySource[source] === 'number' ? spendBySource[source] : null;
      return {
        source,
        revenue: Math.round(row.revenue * 100) / 100,
        deals: row.deals,
        spend,
        roi: spend !== null && spend > 0 ? Math.round((row.revenue / spend) * 100) / 100 : null,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || a.source.localeCompare(b.source));
};

// ---------------------------------------------------------------------------
// Executive scorecard (Phase 10)
// ---------------------------------------------------------------------------

export interface ExecutiveScorecard {
  traffic: number;
  leads: number;
  meetings: number;
  proposals: number;
  wonDeals: number;
  pipeline: number;
  revenue: number;
  averageDeal: number | null;
  winRate: number | null;
  topSource: string | null;
  topProduct: string | null;
  topService: string | null;
  topCase: string | null;
  revenueGrowth: number | null;
}

export const getExecutiveScorecard = (
  input: {
    traffic: number;
    leads: CrmLeadRecord[];
    opportunities: RevenueOpportunity[];
    previousRevenue?: number;
  },
): ExecutiveScorecard => {
  const totals = getRevenueTotals(input.opportunities);
  const meetings = input.leads.filter((l) => l.signals.booked).length;
  const bySource = revenueBySource(input.opportunities);
  const byProduct = revenueByProduct(input.opportunities);
  const byService = revenueByService(input.opportunities);
  const byCase = revenueByCaseStudy(input.opportunities);
  return {
    traffic: input.traffic,
    leads: input.leads.length,
    meetings,
    proposals: totals.proposals,
    wonDeals: totals.deals,
    pipeline: totals.pipeline,
    revenue: totals.won,
    averageDeal: totals.averageDeal,
    winRate: totals.winRate,
    topSource: bySource.find((s) => s.won > 0)?.key ?? null,
    topProduct: byProduct.find((s) => s.won > 0)?.key ?? null,
    topService: byService.find((s) => s.won > 0)?.key ?? null,
    topCase: byCase.find((s) => s.won > 0)?.key ?? null,
    revenueGrowth:
      typeof input.previousRevenue === 'number' && input.previousRevenue > 0
        ? Math.round(((totals.won - input.previousRevenue) / input.previousRevenue) * 1000) / 1000
        : null,
  };
};

// ---------------------------------------------------------------------------
// Data quality gates (Phase 11)
// ---------------------------------------------------------------------------

export interface DataQualityIssue {
  code:
    | 'DUPLICATE_OPPORTUNITY'
    | 'REVENUE_WITHOUT_SOURCE'
    | 'PROPOSAL_WITHOUT_LEAD'
    | 'CUSTOMER_WITHOUT_ATTRIBUTION'
    | 'ORPHAN_STAGE'
    | 'MISSING_VALUE'
    | 'MISSING_WRITEBACK';
  opportunity_id: string | null;
  detail: string;
}

/**
 * Every issue names the row and the rule. No auto-repair: the operator
 * fixes the CRM, never the analytics layer.
 */
export const checkRevenueQuality = (
  opportunities: RevenueOpportunity[],
  events: RevenueEvent[],
  knownLeadIds: string[] = [],
): DataQualityIssue[] => {
  const issues: DataQualityIssue[] = [];
  const seen = new Set<string>();
  // The ledger check only runs when ledger rows were imported; otherwise
  // every row would flag and drown the real issues.
  const checkLedger = events.length > 0;
  for (const o of opportunities) {
    if (seen.has(o.opportunity_id)) {
      issues.push({ code: 'DUPLICATE_OPPORTUNITY', opportunity_id: o.opportunity_id, detail: 'opportunity_id appears more than once in the import' });
    }
    seen.add(o.opportunity_id);
    if ((o.status === 'won' || o.status === 'proposal_sent' || o.status === 'negotiation') && !o.lead_id) {
      issues.push({ code: 'PROPOSAL_WITHOUT_LEAD', opportunity_id: o.opportunity_id, detail: `${o.status} without a linked lead_id` });
    }
    if (o.status === 'won' && (o.source === 'unknown' || !o.source)) {
      issues.push({ code: 'REVENUE_WITHOUT_SOURCE', opportunity_id: o.opportunity_id, detail: 'won revenue without a source' });
    }
    if (o.status === 'won' && knownLeadIds.length > 0 && o.lead_id && !knownLeadIds.includes(o.lead_id)) {
      issues.push({ code: 'CUSTOMER_WITHOUT_ATTRIBUTION', opportunity_id: o.opportunity_id, detail: 'won lead has no matching browser journey' });
    }
    if (!OPPORTUNITY_STAGES.includes(o.status)) {
      issues.push({ code: 'ORPHAN_STAGE', opportunity_id: o.opportunity_id, detail: `unknown stage ${o.status}` });
    }
    if ((o.status === 'proposal_sent' || o.status === 'negotiation') && o.proposal_value === null) {
      issues.push({ code: 'MISSING_VALUE', opportunity_id: o.opportunity_id, detail: `${o.status} without a proposal_value` });
    }
    const hasEvent = !checkLedger || events.some((e) => e.opportunity_id === o.opportunity_id && e.stage === o.status);
    if (!hasEvent) {
      issues.push({ code: 'MISSING_WRITEBACK', opportunity_id: o.opportunity_id, detail: `stage ${o.status} has no ledger event (writeback missing)` });
    }
  }
  return issues.sort((a, b) => a.code.localeCompare(b.code) || (a.opportunity_id ?? '').localeCompare(b.opportunity_id ?? ''));
};
