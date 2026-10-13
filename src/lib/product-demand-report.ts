import type { FunnelInputEvent } from './funnel-intelligence';
import { PILLARS, type PillarId } from '@/components/pillars/pillarData';
import { PRODUCTS } from '../data/products';
import {
  getProductLandingAudit,
  getProductNetwork,
  getProductDossiers,
  getWaitlistProducts,
  type ProductLandingAudit,
} from '../data/product-demand';
import {
  classifyDemand,
  getCrmOpportunitySignals,
  getDemandDashboard,
  getDemandRanking,
  getProductAttribution,
  getProductCROInsights,
  getProductFunnel,
  getProductOpportunities,
  scoreProductDemand,
  type DemandRanking,
  type ProductAttribution,
  type ProductDashboardRow,
  type DemandValidation,
  type ProductScoreBreakdown,
} from './product-intelligence';
import { getWaitlistStats, type WaitlistStats } from './product-waitlist';

/**
 * R20.8 — Product Demand Report: the one call that answers the Fase approval
 * questions (qual produto gera mais procura, leads, reuniões, converte,
 * justifica investimento, precisa de validação, merece landing, merece
 * campanhas). Pure computation: given an event stream plus the real route
 * table, it returns every answer. An operator reads it; nothing executes.
 */

export interface ProductDemandReport {
  /** Fase 5 — landing classification per product. */
  audits: ProductLandingAudit[];
  /** Fase 8 — funnel per product. */
  funnels: Record<string, ReturnType<typeof getProductFunnel>[string]>;
  /** Fase 3 — composite 0–100 with sub-scores and weights. */
  scores: ProductScoreBreakdown[];
  /** Fase 4 — rankings. */
  ranking: DemandRanking;
  /** Fase 9 — CRO leaks and intent strength. */
  cro: ReturnType<typeof getProductCROInsights>;
  /** Fase 15 — surface attribution. */
  attribution: Record<string, ProductAttribution>;
  /** Fase 16 — behavioral validation class per product. */
  validation: Record<string, DemandValidation>;
  /** Fase 17 — recommendations (never executed). */
  opportunities: ReturnType<typeof getProductOpportunities>;
  /** Fase 12 — dashboard rows for R20.12. */
  dashboard: ProductDashboardRow[];
  /** Fase 13 — CRM-ready signals. */
  crm: ReturnType<typeof getCrmOpportunitySignals>;
  /** Fase 6 — waitlist funnel per waitlist-eligible product. */
  waitlists: WaitlistStats[];
  /** Fase 14 — product → case/pillar/landing/assessment network. */
  network: ReturnType<typeof getProductNetwork>;
  /** Fase 11 — positioning dossiers + their content gaps. */
  dossiers: ReturnType<typeof getProductDossiers>;
}

const PILLAR_ROUTES = (Object.keys(PILLARS) as PillarId[]).map((p) => PILLARS[p].route);

/**
 * Route table used when the caller injects none. The catalog only declares
 * `to` when a real landing route exists (R19.8 contract), so the catalog is
 * itself the default authority; pass the live route table to verify against
 * the router.
 */
const defaultRoutes = () => PRODUCTS.filter((p) => p.to).map((p) => p.to as string);
export const buildProductDemandReport = (
  events: FunnelInputEvent[],
  resolvableRoutes: string[] = defaultRoutes(),
  caseNarratives: { slug: string; to?: string }[] = [],
): ProductDemandReport => {
  const audits = getProductLandingAudit(resolvableRoutes, caseNarratives);
  const funnels = getProductFunnel(events, audits);
  const scores = scoreProductDemand(funnels);
  const ranking = getDemandRanking(funnels, scores);
  const cro = getProductCROInsights(funnels);
  const attribution = getProductAttribution(events, audits, { pillarRoutes: PILLAR_ROUTES });
  const validation = Object.fromEntries(
    Object.values(funnels).map((f) => [f.slug, classifyDemand(f)]),
  );
  const opportunities = getProductOpportunities(funnels, scores, audits);
  const dashboard = getDemandDashboard(funnels, scores);
  const crm = getCrmOpportunitySignals(funnels, scores);
  const waitlists = getWaitlistStats(events);
  const network = getProductNetwork(caseNarratives);
  const dossiers = getProductDossiers(audits);

  return {
    audits,
    funnels,
    scores,
    ranking,
    cro,
    attribution,
    validation,
    opportunities,
    dashboard,
    crm,
    waitlists,
    network,
    dossiers,
  };
};

/**
 * Approval-question shortcuts. Each returns the winning product or null,
 * so the answer is one line at the call site.
 */
export const getDemandAnswers = (report: ProductDemandReport) => ({
  /**
   * Qual produto gera mais procura? Null when the top score is 0 — an empty
   * stream must never crown a product with no observed demand.
   */
  topDemand: (report.dashboard[0]?.demandScore ?? 0) > 0 ? report.dashboard[0].slug : null,
  /** Qual produto gera mais leads? */
  topLeads: report.ranking.topLeads,
  /** Qual produto gera mais reuniões? */
  topMeetings: report.ranking.topMeetings,
  /** Qual produto converte melhor? */
  topConversion: report.ranking.topConversion,
  /** Qual produto justifica investimento? */
  topInvestment: report.opportunities.find((o) => o.type === 'INVEST_ACQUISITION')?.slug ?? null,
  /** Quais produtos precisam de validação? */
  needValidation: Object.entries(report.validation)
    .filter(([, v]) => v === 'NO_SIGNAL' || v === 'EARLY_SIGNAL')
    .map(([slug]) => slug),
  /** Quais produtos merecem landing dedicada? */
  needLanding: report.audits.filter((a) => a.landing === 'LANDING_MISSING').map((a) => a.slug),
  /** Quais produtos merecem campanhas futuras? */
  campaignReady: report.opportunities.filter((o) => o.type === 'INVEST_ACQUISITION').map((o) => o.slug),
});

/** Waitlist candidates (Fase 6) — the products with no landing page. */
export const getWaitlistCandidates = () => getWaitlistProducts();
