import type { FunnelInputEvent } from './funnel-intelligence';
import {
  getAssessmentStats,
  getFunnelStats,
  getIntelligenceReport,
  getScrollStats,
  getTopCTAs,
  getTopPages,
  type RankedItem,
} from './funnel-intelligence';
import { getCaseIntelligence, type CaseIntelligenceReport } from './case-intelligence';
import { buildProductDemandReport, getDemandAnswers, type ProductDemandReport } from './product-demand-report';
import { buildCrmRecords, getPipelineStats, getPipelineStages, type PipelineStats } from './crm-qualification';
import {
  normalizeOpportunity,
  getRevenueTotals,
  revenueBySource,
  revenueByProduct,
  revenueByService,
  revenueByCaseStudy,
  revenueByChannel,
  revenueByLandingPage,
  revenueByCampaign,
  revenueByMedium,
  stampCaseInterest,
  getCommercialFunnel,
  getExecutiveScorecard,
  checkRevenueQuality,
  type CrmExportRow,
  type RevenueEvent,
  type RevenueOpportunity,
} from './revenue-attribution';
import { getSalesSummary, type SalesAnalytics } from './sales-intelligence';
import { LANDINGS } from '../data/landings';
import { ASSESSMENTS } from './lead-magnets';
import { PILLARS, type PillarId } from '@/components/pillars/pillarData';
import type { CrmLeadRecord } from '../data/crm-contract';

/**
 * R20.12 — Revenue Dashboard data layer.
 *
 * ONE dataset in, every view out. The layer is pure computation over the
 * R20.1 event stream — no fetch, no storage, no backend, no invention. When
 * the dataset is empty every panel reports zero or null and the UI shows an
 * explicit empty state; nothing is ever backfilled with a plausible number.
 *
 * The dashboard reads an EXPORTED dataset (GA4/GTM/warehouse export pasted
 * by the operator). The browser's own event buffer is session-scoped and far
 * too small to be a business record — pretending otherwise would be the one
 * unacceptable failure mode for a revenue surface.
 */

export interface DashboardDataset {
  events: FunnelInputEvent[];
  generatedAt: string;
  /** Where the data came from, shown in the UI for provenance. */
  source: string;
  /** R20.18 — imported CRM opportunity rows (export paste, optional). */
  opportunities?: CrmExportRow[];
  /** R20.18 — imported ledger rows (export paste, optional). */
  revenue_events?: RevenueEvent[];
}

export const EMPTY_DATASET: DashboardDataset = {
  events: [],
  generatedAt: '',
  source: '',
};

/** Accepts a JSON export: a bare array, {events:[]}, or {data:[]}. */
export const parseDataset = (raw: string, source = 'import'): DashboardDataset | null => {
  try {
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.events) ? parsed.events : Array.isArray(parsed?.data) ? parsed.data : null;
    if (!list) return null;
    const events = list.filter(
      (event): event is FunnelInputEvent =>
        Boolean(event) && typeof event === 'object' && typeof (event as FunnelInputEvent).name === 'string',
    );
    const rawOpps = !Array.isArray(parsed) && Array.isArray((parsed as { opportunities?: unknown })?.opportunities)
      ? (parsed as { opportunities: unknown[] }).opportunities
      : [];
    const opportunities = rawOpps.filter(
      (row): row is CrmExportRow =>
        Boolean(row) && typeof row === 'object' && typeof (row as CrmExportRow).opportunity_id === 'string',
    );
    const rawEvents = !Array.isArray(parsed) && Array.isArray((parsed as { revenue_events?: unknown })?.revenue_events)
      ? (parsed as { revenue_events: unknown[] }).revenue_events
      : [];
    const revenue_events = rawEvents.filter(
      (row): row is RevenueEvent =>
        Boolean(row) && typeof row === 'object' && typeof (row as RevenueEvent).opportunity_id === 'string',
    );
    return { events, generatedAt: new Date().toISOString(), source, opportunities, revenue_events };
  } catch {
    return null;
  }
};

const rate = (numerator: number, denominator: number, floor = 1): number | null =>
  denominator >= floor && numerator > 0 ? Math.round((numerator / denominator) * 1000) / 1000 : null;

const top = (rows: RankedItem[]): RankedItem | null => rows[0] ?? null;

// ---------------------------------------------------------------------------
// Fase 2 — executive
// ---------------------------------------------------------------------------

export interface Kpi {
  key: string;
  label: string;
  value: number;
  /** Display helper: percentages carry their unit, counts do not. */
  format: 'count' | 'percent' | 'score';
}

export interface ExecutiveView {
  kpis: Kpi[];
  topPages: RankedItem[];
  topCtas: RankedItem[];
  topProducts: Array<{ slug: string; name: string; value: number }>;
  topAssessments: Array<{ id: string; label: string; value: number }>;
  /** R20.17 — conversions broken down by UTM source/medium. */
  leadSources: Array<{ source: string; medium: string; conversions: number }>;
}

const assessmentLabel = (id: string): string =>
  ASSESSMENTS.find((assessment) => assessment.id === id)?.category ?? id;

/** R20.17 — groups conversion events by their stamped UTMs. */
export const getLeadSources = (
  events: FunnelInputEvent[],
): Array<{ source: string; medium: string; conversions: number }> => {
  const counts = new Map<string, number>();
  for (const event of events) {
    if (event.name !== 'generate_lead' && event.name !== 'schedule_appointment' && event.name !== 'assessment_lead_capture') {
      continue;
    }
    const utms = (event.data?.['utms'] ?? {}) as Record<string, unknown>;
    const source = typeof utms['utm_source'] === 'string' && utms['utm_source'] ? utms['utm_source'] : 'unknown';
    const medium = typeof utms['utm_medium'] === 'string' && utms['utm_medium'] ? utms['utm_medium'] : 'unknown';
    counts.set(JSON.stringify([source, medium]), (counts.get(JSON.stringify([source, medium])) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, conversions]) => {
      const [source, medium] = JSON.parse(key) as [string, string];
      return { source, medium, conversions };
    })
    .sort((a, b) => b.conversions - a.conversions || a.source.localeCompare(b.source));
};

export const getExecutiveView = (
  events: FunnelInputEvent[],
  demand: ProductDemandReport,
  crm: { pipeline: PipelineStats },
): ExecutiveView => {
  const funnel = getFunnelStats(events);
  const views = funnel.views;
  const meetings = events.filter((event) => event.name === 'schedule_appointment').length;
  const leads = crm.pipeline.leads;
  return {
    kpis: [
      { key: 'traffic', label: 'Tráfego', value: views, format: 'count' },
      { key: 'interesse', label: 'Interesse', value: events.filter((e) => e.name === 'product_interaction').length, format: 'count' },
      { key: 'leads', label: 'Leads', value: leads, format: 'count' },
      { key: 'qualificados', label: 'Qualificados', value: crm.pipeline.qualified, format: 'count' },
      { key: 'oportunidades', label: 'Oportunidades', value: crm.pipeline.opportunities, format: 'count' },
      { key: 'reuniões', label: 'Reuniões', value: meetings, format: 'count' },
    ],
    topPages: getTopPages(events).slice(0, 8),
    topCtas: getTopCTAs(events).slice(0, 8),
    topProducts: demand.dashboard.slice(0, 8).map((row) => ({ slug: row.slug, name: row.name, value: row.demandScore })),
    topAssessments: demand.crm.slice(0, 8).map((row) => ({ id: row.product, label: assessmentLabel(row.product), value: row.score })),
    leadSources: getLeadSources(events),
  };
};

// ---------------------------------------------------------------------------
// Fase 3 — marketing (R20.1 / R20.2 / R20.3)
// ---------------------------------------------------------------------------

export interface MarketingView {
  traffic: number;
  funnel: ReturnType<typeof getFunnelStats>;
  topCtas: RankedItem[];
  landings: Array<{ slug: string; views: number; leads: number }>;
  scroll: ReturnType<typeof getScrollStats>;
}

export const getMarketingView = (events: FunnelInputEvent[], records: CrmLeadRecord[]): MarketingView => {
  const landingPaths = new Set(LANDINGS.map((landing) => `/${landing.slug}`));
  const viewsBySlug = new Map<string, number>();
  for (const event of events) {
    if (event.name !== 'page_view' || !event.path) continue;
    if (!landingPaths.has(event.path)) continue;
    viewsBySlug.set(event.path.replace(/^\//, ''), (viewsBySlug.get(event.path.replace(/^\//, '')) ?? 0) + 1);
  }
  const leadsByLanding = new Map<string, number>();
  for (const record of records) {
    for (const path of record.signals.landingViews) {
      const slug = path.replace(/^\//, '');
      leadsByLanding.set(slug, (leadsByLanding.get(slug) ?? 0) + 1);
    }
  }
  return {
    traffic: events.filter((event) => event.name === 'page_view').length,
    funnel: getFunnelStats(events),
    topCtas: getTopCTAs(events).slice(0, 10),
    landings: LANDINGS.map((landing) => ({
      slug: landing.slug,
      views: viewsBySlug.get(landing.slug) ?? 0,
      leads: leadsByLanding.get(landing.slug) ?? 0,
    })).sort((a, b) => b.views - a.views || a.slug.localeCompare(b.slug)),
    scroll: getScrollStats(events).slice(0, 10),
  };
};

// ---------------------------------------------------------------------------
// Fase 4 — lead magnets (R20.4)
// ---------------------------------------------------------------------------

export interface LeadMagnetView {
  rows: Array<{
    id: string;
    category: string;
    starts: number;
    completes: number;
    captures: number;
    completionRate: number | null;
    captureRate: number | null;
  }>;
}

export const getLeadMagnetView = (events: FunnelInputEvent[]): LeadMagnetView => ({
  rows: ASSESSMENTS.map((assessment) => {
    const stats = getAssessmentStats(events, assessment.id);
    return {
      id: assessment.id,
      category: assessment.category,
      starts: stats.starts,
      completes: stats.completes,
      captures: stats.leads,
      completionRate: rate(stats.completes, stats.starts, 1),
      captureRate: rate(stats.leads, stats.completes, 1),
    };
  }).sort((a, b) => b.starts - a.starts || a.id.localeCompare(b.id)),
});

// ---------------------------------------------------------------------------
// Fase 5 — SEO network (R20.5 / R20.6)
// ---------------------------------------------------------------------------

export interface SeoView {
  /** Landings with at least one observed view. */
  covered: number;
  total: number;
  coverageRate: number | null;
  /** Views per cluster (from the landing dataset, never invented). */
  clusters: Array<{ cluster: string; landings: number; views: number }>;
  topLandings: Array<{ slug: string; views: number; leads: number }>;
}

export const getSeoView = (events: FunnelInputEvent[], marketing: MarketingView): SeoView => {
  const viewsBySlug = new Map(marketing.landings.map((row) => [row.slug, row.views]));
  const covered = marketing.landings.filter((row) => row.views > 0).length;
  const clusterViews = new Map<string, number>();
  for (const landing of LANDINGS) {
    const views = viewsBySlug.get(landing.slug) ?? 0;
    clusterViews.set(landing.cluster, (clusterViews.get(landing.cluster) ?? 0) + views);
  }
  const counts = new Map<string, number>();
  for (const landing of LANDINGS) counts.set(landing.cluster, (counts.get(landing.cluster) ?? 0) + 1);
  return {
    covered,
    total: LANDINGS.length,
    coverageRate: LANDINGS.length > 0 ? Math.round((covered / LANDINGS.length) * 1000) / 1000 : null,
    clusters: [...counts.entries()]
      .map(([cluster, landingCount]) => ({ cluster, landings: landingCount, views: clusterViews.get(cluster) ?? 0 }))
      .sort((a, b) => b.views - a.views || a.cluster.localeCompare(b.cluster)),
    topLandings: marketing.landings.slice(0, 8),
  };
};

// ---------------------------------------------------------------------------
// Fase 6 — cases (R20.7)
// ---------------------------------------------------------------------------

export type CaseView = CaseIntelligenceReport;

export const getCaseView = (events: FunnelInputEvent[]): CaseView => getCaseIntelligence(events);

// ---------------------------------------------------------------------------
// Fases 7, 8, 9, 10 — products, CRM, sales, revenue
// ---------------------------------------------------------------------------

export type ProductView = ProductDemandReport['dashboard'];
export type CrmView = PipelineStats;
export type SalesView = SalesAnalytics;

export interface RevenueView {
  opportunities: number;
  pipelineStages: Array<{ stage: string; count: number }>;
  products: Array<{ slug: string; name: string; opportunities: number; demand: number }>;
  salesActions: Array<{ action: string; count: number }>;
  /** Leads the model says are commercially reachable. */
  potentialPipeline: number;
  /** R20.18 — revenue intelligence from imported CRM rows (null without data). */
  attribution: {
    opportunities: RevenueOpportunity[];
    totals: ReturnType<typeof getRevenueTotals>;
    bySource: ReturnType<typeof revenueBySource>;
    byMedium: ReturnType<typeof revenueByMedium>;
    byCampaign: ReturnType<typeof revenueByCampaign>;
    byLandingPage: ReturnType<typeof revenueByLandingPage>;
    byProduct: ReturnType<typeof revenueByProduct>;
    byService: ReturnType<typeof revenueByService>;
    byCaseStudy: ReturnType<typeof revenueByCaseStudy>;
    byChannel: ReturnType<typeof revenueByChannel>;
    funnel: ReturnType<typeof getCommercialFunnel>;
    scorecard: ReturnType<typeof getExecutiveScorecard>;
    quality: ReturnType<typeof checkRevenueQuality>;
  } | null;
}

export const getRevenueView = (
  demand: ProductDemandReport,
  pipeline: PipelineStats,
  sales: SalesAnalytics,
  stages: Array<{ stage: string; count: number }>,
  attribution?: RevenueView['attribution'],
): RevenueView => ({
  opportunities: pipeline.opportunities,
  pipelineStages: stages,
  products: demand.dashboard.map((row) => ({
    slug: row.slug,
    name: row.name,
    opportunities: demand.funnels[row.slug]?.counts.lead ?? 0,
    demand: row.demandScore,
  })),
  salesActions: Object.entries(sales).length >= 0
    ? [
        { action: 'BOOK_CALL', count: sales.recommendedCalls },
        { action: 'SEND_PROPOSAL', count: sales.recommendedProposals },
        { action: 'NURTURE', count: sales.nurtureLeads },
        { action: 'WAIT', count: sales.waitingLeads },
      ]
    : [],
  potentialPipeline: sales.recommendedCalls + sales.recommendedProposals,
  attribution: attribution ?? null,
});

/**
 * R20.18 — builds revenue intelligence from imported CRM rows. Pure:
 * invalid rows are dropped by normalizeOpportunity, quality issues reported.
 */
export const getRevenueAttribution = (
  dataset: DashboardDataset,
  traffic: number,
  leads: CrmLeadRecord[],
): NonNullable<RevenueView['attribution']> => {
  const journeys = new Map(leads.map((l) => [l.leadId, l.journey]));
  const opportunities = (dataset.opportunities ?? [])
    .map(normalizeOpportunity)
    .filter((o): o is RevenueOpportunity => o !== null)
    .map((o) => stampCaseInterest(o, o.lead_id ? journeys.get(o.lead_id) ?? [] : []));
  const knownLeadIds = leads.map((l) => l.leadId);
  return {
    opportunities,
    totals: getRevenueTotals(opportunities),
    bySource: revenueBySource(opportunities),
    byMedium: revenueByMedium(opportunities),
    byCampaign: revenueByCampaign(opportunities),
    byLandingPage: revenueByLandingPage(opportunities),
    byProduct: revenueByProduct(opportunities),
    byService: revenueByService(opportunities),
    byCaseStudy: revenueByCaseStudy(opportunities),
    byChannel: revenueByChannel(opportunities),
    funnel: getCommercialFunnel(traffic, leads, opportunities),
    scorecard: getExecutiveScorecard({ traffic, leads, opportunities }),
    quality: checkRevenueQuality(opportunities, dataset.revenue_events ?? [], knownLeadIds),
  };
};

// ---------------------------------------------------------------------------
// Fase 11 — top performers
// ---------------------------------------------------------------------------

export interface TopPerformers {
  product: { slug: string; label: string; value: number } | null;
  landing: { slug: string; label: string; value: number } | null;
  cta: { key: string; label: string; value: number } | null;
  assessment: { id: string; label: string; value: number } | null;
  caseStudy: { slug: string; label: string; value: number } | null;
  opportunity: { slug: string; label: string; value: number } | null;
}

export const getTopPerformers = (
  events: FunnelInputEvent[],
  marketing: MarketingView,
  leadMagnets: LeadMagnetView,
  cases: CaseView,
  demand: ProductDemandReport,
): TopPerformers => {
  const topPage = top(getTopPages(events));
  const topCta = top(getTopCTAs(events));
  const topLanding = marketing.landings.find((row) => row.views > 0);
  const topAssessment = leadMagnets.rows.find((row) => row.starts > 0);
  const topCase = cases.stats.find((stat) => stat.ctaClicks > 0 || stat.views > 0);
  const topProduct = demand.dashboard.find((row) => row.demandScore > 0);
  const topOpportunity = demand.funnels
    ? Object.values(demand.funnels)
        .filter((funnel) => funnel.counts.lead > 0)
        .sort((a, b) => b.counts.lead - a.counts.lead || a.slug.localeCompare(b.slug))[0]
    : undefined;
  return {
    product: topProduct ? { slug: topProduct.slug, label: topProduct.name, value: topProduct.demandScore } : null,
    landing: topLanding ? { slug: topLanding.slug, label: topLanding.slug, value: topLanding.views } : null,
    cta: topCta ? { key: topCta.key, label: topCta.key, value: topCta.count } : null,
    assessment: topAssessment ? { id: topAssessment.id, label: topAssessment.category, value: topAssessment.starts } : null,
    // Report the metric that actually earned the top spot — a case chosen for
    // engagement but shown with zero views would read as a broken number.
    caseStudy: topCase
      ? {
        slug: topCase.slug,
        label: topCase.slug,
        value: Math.max(topCase.views, topCase.ctaClicks, topCase.leads, topCase.maxScroll),
      }
      : null,
    opportunity: topOpportunity ? { slug: topOpportunity.slug, label: topOpportunity.name, value: topOpportunity.counts.lead } : null,
  };
};

// ---------------------------------------------------------------------------
// Fase 12 — alert engine
// ---------------------------------------------------------------------------

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface DashboardAlert {
  id: string;
  severity: AlertSeverity;
  title: string;
  detail: string;
  /** The measured numbers behind the alert — no alert without evidence. */
  evidence: string;
}

export const getAlerts = (input: {
  events: FunnelInputEvent[];
  pipeline: PipelineStats;
  demand: ProductDemandReport;
  sales: SalesAnalytics;
  seo: SeoView;
}): DashboardAlert[] => {
  const alerts: DashboardAlert[] = [];
  const { events, pipeline, demand, sales, seo } = input;

  if (events.length === 0) {
    alerts.push({
      id: 'no-data',
      severity: 'INFO',
      title: 'Sem dados carregados',
      detail: 'Importe uma exportação de eventos (GA4/GTM) para o dashboard calcular os indicadores.',
      evidence: '0 eventos no conjunto carregado',
    });
    return alerts;
  }
  if (pipeline.leads === 0) {
    alerts.push({
      id: 'no-leads',
      severity: 'CRITICAL',
      title: 'Nenhum lead qualificado',
      detail: 'O funil gera tráfego mas nenhuma captura com journey registado.',
      evidence: `${events.filter((e) => e.name === 'page_view').length} page_view · 0 generate_lead`,
    });
  }
  if (pipeline.leads >= 5 && pipeline.conversionRate !== null && pipeline.conversionRate < 0.2) {
    alerts.push({
      id: 'low-conversion',
      severity: 'WARNING',
      title: 'Conversão baixa para o volume de leads',
      detail: 'Menos de 20 % dos leads chegam a oportunidade.',
      evidence: `${pipeline.opportunities}/${pipeline.leads} = ${Math.round((pipeline.conversionRate ?? 0) * 100)}%`,
    });
  }
  if (pipeline.qualified > 0 && pipeline.opportunities === 0) {
    alerts.push({
      id: 'no-opportunities',
      severity: 'CRITICAL',
      title: 'Leads qualificados sem oportunidade',
      detail: 'Existem leads HOT/WARM mas nenhuma reunião ou contacto directo.',
      evidence: `${pipeline.qualified} qualificados · 0 oportunidades`,
    });
  }
  const silentProducts = demand.dashboard.filter((row) => row.validation === 'NO_SIGNAL');
  if (silentProducts.length > 0) {
    alerts.push({
      id: 'no-demand',
      severity: 'WARNING',
      title: `${silentProducts.length} produto(s) sem sinal de procura`,
      detail: silentProducts.map((row) => row.name).join(', '),
      evidence: 'validação NO_SIGNAL em todos',
    });
  }
  if (seo.coverageRate !== null && seo.coverageRate < 0.5) {
    alerts.push({
      id: 'low-seo-coverage',
      severity: 'INFO',
      title: 'Cobertura orgânica parcial',
      detail: 'Menos de metade da rede de landings registou visitas.',
      evidence: `${seo.covered}/${seo.total} landings com views`,
    });
  }
  if (sales.waitingLeads > pipeline.leads / 2 && pipeline.leads > 0) {
    alerts.push({
      id: 'mostly-waiting',
      severity: 'INFO',
      title: 'Maioria dos leads em espera',
      detail: 'O motor de vendas recomenda esperar — o funil precisa de mais sinal, não de mais contacto.',
      evidence: `${sales.waitingLeads} WAIT de ${pipeline.leads} leads`,
    });
  }

  const rank = { CRITICAL: 0, WARNING: 1, INFO: 2 };
  return alerts.sort((a, b) => rank[a.severity] - rank[b.severity] || a.id.localeCompare(b.id));
};

// ---------------------------------------------------------------------------
// Fase 13 — executive insights
// ---------------------------------------------------------------------------

export interface Insight {
  id: string;
  title: string;
  detail: string;
  evidence: string;
}

export const getInsights = (input: {
  events: FunnelInputEvent[];
  executive: ExecutiveView;
  marketing: MarketingView;
  cases: CaseView;
  demand: ProductDemandReport;
  pipeline: PipelineStats;
  sales: SalesAnalytics,
}): Insight[] => {
  const insights: Insight[] = [];
  const { events, executive, marketing, cases, demand, pipeline, sales } = input;

  if (events.length === 0) {
    insights.push({
      id: 'no-data',
      title: 'Sem dados para gerar insights',
      detail: 'Carregue uma exportação de eventos para gerar os insights automáticos.',
      evidence: '0 eventos',
    });
    return insights;
  }

  const topLanding = marketing.landings[0];
  if (topLanding && topLanding.views > 0) {
    insights.push({
      id: 'top-landing',
      title: `Maior entrada de procura: /${topLanding.slug}`,
      detail:
        topLanding.leads > 0
          ? 'É também a landing que mais origina leads — manter como prioritária.'
          : 'Gera tráfego mas ainda não origina leads — candidata a teste de conversão.',
      evidence: `${topLanding.views} views · ${topLanding.leads} leads`,
    });
  }

  const topCase = cases.stats.find((stat) => stat.ctaClicks > 0);
  if (topCase) {
    insights.push({
      id: 'top-case',
      title: `Case com mais interação: ${topCase.slug}`,
      detail: 'A prova social está a gerar intenção — vale continuar o nurture.',
      evidence: `${topCase.ctaClicks} cliques · scroll ${topCase.maxScroll}% · ${topCase.leads} leads`,
    });
  }

  const leadProduct = demand.dashboard.find((row) => row.validation === 'VALIDATED' || row.leadScore > 0);
  if (leadProduct) {
    insights.push({
      id: 'top-product',
      title: `Produto com mais pipeline: ${leadProduct.name}`,
      detail: `Classificação de procura: ${leadProduct.validation}.`,
      evidence: `score ${leadProduct.demandScore} · ${leadProduct.leadScore} leads`,
    });
  }

  const biggest = demand.crm.find((row) => row.stage === 'MEETING');
  if (biggest) {
    insights.push({
      id: 'biggest-opportunity',
      title: `Maior oportunidade: ${biggest.product}`,
      detail: 'Já existe reunião atribuída — próximo passo recomendado é proposta.',
      evidence: `score de procura ${biggest.score}`,
    });
  }

  if (pipeline.leads > 0 && pipeline.opportunities === 0) {
    insights.push({
      id: 'bottleneck-opportunity',
      title: 'Maior gargalo: leads sem oportunidade',
      detail: 'A captura funciona, a reunião não. Rever CTA de booking nas páginas de maior tráfego.',
      evidence: `${pipeline.qualified} qualificados · 0 oportunidades`,
    });
  }

  if (sales.nurtureLeads > sales.recommendedCalls + sales.recommendedProposals && sales.nurtureLeads > 0) {
    insights.push({
      id: 'bottleneck-nurture',
      title: 'Maior gargalo: excesso de nurture',
      detail: 'A maioria dos leads não tem intenção suficiente — o problema está a montante, na aquisição.',
      evidence: `${sales.nurtureLeads} nurture vs ${sales.recommendedCalls + sales.recommendedProposals} ações comerciais`,
    });
  }

  const pillarViews = new Map<PillarId, number>();
  for (const event of events) {
    if (event.name !== 'page_view' || !event.path) continue;
    for (const pillar of Object.keys(PILLARS) as PillarId[]) {
      if (event.path === PILLARS[pillar].route) pillarViews.set(pillar, (pillarViews.get(pillar) ?? 0) + 1);
    }
  }
  const topPillar = [...pillarViews.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topPillar && topPillar[1] > 0) {
    insights.push({
      id: 'top-pillar',
      title: `Pilar com mais tráfego: ${PILLARS[topPillar[0]].name}`,
      detail: 'O pilar lidera a entrada de procura — vale confirmar se converte em oportunidade.',
      evidence: `${topPillar[1]} page_view`,
    });
  }

  void executive;
  return insights;
};

// ---------------------------------------------------------------------------
// Fase 1/10 — the composed dashboard
// ---------------------------------------------------------------------------

export interface DashboardData {
  dataset: DashboardDataset;
  executive: ExecutiveView;
  marketing: MarketingView;
  leadMagnets: LeadMagnetView;
  seo: SeoView;
  cases: CaseView;
  products: ProductView;
  crm: CrmView;
  sales: SalesView;
  revenue: RevenueView;
  performers: TopPerformers;
  alerts: DashboardAlert[];
  insights: Insight[];
  answers: ReturnType<typeof getDemandAnswers>;
  funnelReport: ReturnType<typeof getIntelligenceReport>;
}

/** The single entry point every panel reads from. */
export const buildDashboardData = (dataset: DashboardDataset): DashboardData => {
  const events = dataset.events;
  const demand = buildProductDemandReport(events);
  const records: CrmLeadRecord[] = buildCrmRecords(events, { demandScores: demand.scores });
  const pipeline = getPipelineStats(records);
  const summary = getSalesSummary(records, demand.scores);
  const marketing = getMarketingView(events, records);
  const leadMagnets = getLeadMagnetView(events);
  const seo = getSeoView(events, marketing);
  const cases = getCaseView(events);
  const executive = getExecutiveView(events, demand, { pipeline });

  return {
    dataset,
    executive,
    marketing,
    leadMagnets,
    seo,
    cases,
    products: demand.dashboard,
    crm: pipeline,
    sales: summary.analytics,
    revenue: getRevenueView(
      demand,
      pipeline,
      summary.analytics,
      getPipelineStages(records).map((s) => ({ stage: s.stage, count: s.count })),
      // R20.18 — revenue intelligence only exists when a CRM export was imported.
      (dataset.opportunities?.length ?? 0) > 0
        ? getRevenueAttribution(dataset, events.filter((e) => e.name === 'page_view').length, records)
        : undefined,
    ),
    performers: getTopPerformers(events, marketing, leadMagnets, cases, demand),
    alerts: getAlerts({ events, pipeline, demand, sales: summary.analytics, seo }),
    insights: getInsights({ events, executive, marketing, cases, demand, pipeline, sales: summary.analytics }),
    answers: getDemandAnswers(demand),
    funnelReport: getIntelligenceReport(events),
  };
};
