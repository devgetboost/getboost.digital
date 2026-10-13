import type { FunnelInputEvent } from './funnel-intelligence';
import { PRODUCTS, type HubProduct } from '../data/products';
import {
  ACTION_STAGE,
  PRODUCT_DEMAND_STAGES,
  type ProductAction,
  type ProductDemandStage,
  type ProductLandingAudit,
} from '../data/product-demand';

/**
 * R20.8 — Product Intelligence V2 (Fases 2, 3, 4, 8, 9, 12, 13, 15, 16, 17).
 *
 * Pure computation over the R20.1 event stream: no DOM, no storage, no
 * network, so every answer can later be recomputed against a warehouse
 * export. Event-proxy semantics inherited from R20.2: counts are event
 * counts, never person counts.
 *
 * Attributing a product from an event follows a documented precedence:
 *   1. `data.product`      — explicit stamp (the strongest signal)
 *   2. `data.action`/`label` suffix on `product_interaction`
 *   3. journey containing the product landing route
 *   4. `path` equal to a product view path
 * Never identity-based.
 */

/**
 * The wire names emitted by `analytics.trackAssessment` (R20.4). Note
 * `assessment_lead_capture` — the dashboard found the earlier `lead_capture`
 * spelling never matched a real event, so product demand silently missed
 * every assessment-captured lead.
 */
const ASSESSMENT_EVENTS = new Set([
  'assessment_start',
  'assessment_progress',
  'assessment_complete',
  'assessment_lead_capture',
  'assessment_result_view',
]);

export interface ProductFunnelStep {
  stage: ProductDemandStage;
  count: number;
  /** Step → previous step conversion, null below a 20-event floor. */
  stepRate: number | null;
}

export interface ProductFunnel {
  slug: string;
  name: string;
  kind: HubProduct['kind'];
  /** Raw counts per official stage (Fase 1). */
  counts: Record<ProductDemandStage, number>;
  steps: ProductFunnelStep[];
  /** Deepest stage reached with at least one event. */
  deepestStage: ProductDemandStage | null;
  /** View → lead conversion, null below the 100-view floor. */
  viewToLead: number | null;
}

const emptyCounts = (): Record<ProductDemandStage, number> => ({
  view: 0,
  interest: 0,
  assessment: 0,
  lead: 0,
  booking: 0,
  meeting: 0,
});

const actionOf = (event: FunnelInputEvent): ProductAction | null => {
  const dataAction = event.data?.['action'];
  if (typeof dataAction === 'string' && dataAction in ACTION_STAGE) {
    return dataAction as ProductAction;
  }
  // `label` suffix fallback for flattened exports: `qook_click`.
  if (typeof event.label === 'string') {
    const suffix = event.label.split('_').pop();
    if (suffix && suffix in ACTION_STAGE) return suffix as ProductAction;
  }
  return null;
};

const productStamp = (event: FunnelInputEvent): string | null => {
  const stamp = event.data?.['product'];
  return typeof stamp === 'string' && stamp.length > 0 ? stamp : null;
};

const journeyProduct = (journey: unknown, routesByPath: Map<string, string>): string | null => {
  if (!Array.isArray(journey)) return null;
  let last: string | null = null;
  for (const step of journey) {
    if (typeof step !== 'string') continue;
    const slug = routesByPath.get(step);
    if (slug) last = slug;
  }
  return last;
};

/**
 * Official product funnel (Fase 8). Bookings and meetings are attributed
 * through the journey (the booking page carries the recorded path history);
 * when a journey is absent the booking stays unattributed rather than being
 * guessed. Assessment opens/completes count toward the `assessment` stage;
 * `assessment_complete` + `lead_capture` also count toward `lead`.
 */
export const getProductFunnel = (
  events: FunnelInputEvent[],
  audits: ProductLandingAudit[],
): Record<string, ProductFunnel> => {
  const routesByPath = new Map<string, string>();
  const bySlug = new Map<string, ProductFunnel>();
  for (const audit of audits) {
    for (const path of audit.viewPaths) routesByPath.set(path, audit.slug);
    bySlug.set(audit.slug, {
      slug: audit.slug,
      name: audit.name,
      kind: audit.kind,
      counts: emptyCounts(),
      steps: [],
      deepestStage: null,
      viewToLead: null,
    });
  }
  const ensure = (slug: string): ProductFunnel | null => {
    if (bySlug.has(slug)) return bySlug.get(slug) as ProductFunnel;
    const product = PRODUCTS.find((p) => p.slug === slug);
    if (!product) return null;
    const created: ProductFunnel = {
      slug,
      name: product.name,
      kind: product.kind,
      counts: emptyCounts(),
      steps: [],
      deepestStage: null,
      viewToLead: null,
    };
    bySlug.set(slug, created);
    return created;
  };

  for (const event of events) {
    // 1. product_interaction carries the taxonomy action.
    if (event.name === 'product_interaction') {
      const slug = productStamp(event) ?? (event.label ? event.label.split('_')[0] : null);
      const funnel = slug ? ensure(slug) : null;
      const action = actionOf(event);
      if (funnel && action) {
        const stage = ACTION_STAGE[action];
        if (stage) funnel.counts[stage] += 1;
        // A click is itself a view of commercial intent.
        if (action === 'click') funnel.counts.interest += 1;
      }
      continue;
    }

    // 2. Journey-attributed conversions (booking/meeting/lead).
    const journeySlug = journeyProduct(event.data?.['journey'], routesByPath);
    if (journeySlug) {
      const funnel = ensure(journeySlug);
      if (funnel) {
        if (event.name === 'schedule_appointment') {
          funnel.counts.booking += 1;
          funnel.counts.meeting += 1;
        }
        if (event.name === 'generate_lead') funnel.counts.lead += 1;
      }
    }

    // 3. Explicit stamps on assessments (assessment_* + lead capture).
    const stamp = productStamp(event);
    if (stamp && (ASSESSMENT_EVENTS.has(event.name) || event.name === 'generate_lead')) {
      const funnel = ensure(stamp);
      if (funnel) {
        // Only assessment lifecycle events open the assessment stage; a bare
        // lead counts downstream only (it may come from any surface).
        if (ASSESSMENT_EVENTS.has(event.name)) funnel.counts.assessment += 1;
        if (event.name === 'assessment_complete' || event.name === 'assessment_lead_capture' || event.name === 'generate_lead') {
          funnel.counts.lead += 1;
        }
      }
    }

    // 4. Landing page views.
    if (event.name === 'page_view' && event.path) {
      const slug = routesByPath.get(event.path);
      const funnel = slug ? ensure(slug) : null;
      if (funnel) funnel.counts.view += 1;
    }
  }

  // Build ordered steps + rates.
  for (const funnel of bySlug.values()) {
    let previous: number | null = null;
    funnel.steps = PRODUCT_DEMAND_STAGES.map((stage) => {
      const count = funnel.counts[stage];
      const stepRate = previous !== null && previous >= 20 && count > 0
        ? Math.round((count / previous) * 1000) / 1000
        : null;
      previous = count;
      return { stage, count, stepRate };
    });
    const reached = [...PRODUCT_DEMAND_STAGES].reverse().find((s) => funnel.counts[s] > 0);
    funnel.deepestStage = reached ?? null;
    if (funnel.counts.view >= 100 && funnel.counts.lead > 0) {
      funnel.viewToLead = Math.round((funnel.counts.lead / funnel.counts.view) * 1000) / 1000;
    }
  }
  return Object.fromEntries(bySlug);
};

// ---------------------------------------------------------------------------
// Fase 3 — product score engine
// ---------------------------------------------------------------------------

export interface ScoreWeights {
  awareness: number;
  interest: number;
  intent: number;
  lead: number;
  commercial: number;
}

/**
 * Documented weights (Fase 3). They sum to 1; awareness and interest are
 * reach signals, intent and lead are depth signals, and commercial weighs
 * the money stages (booking + meeting) most heavily.
 */
export const DEFAULT_SCORE_WEIGHTS: ScoreWeights = {
  awareness: 0.2,
  interest: 0.25,
  intent: 0.2,
  lead: 0.2,
  commercial: 0.15,
};

export interface ProductScoreBreakdown {
  slug: string;
  name: string;
  /** Each sub-score normalized 0–100. */
  awareness: number;
  interest: number;
  intent: number;
  lead: number;
  commercial: number;
  /** Weighted composite 0–100. */
  score: number;
  weights: ScoreWeights;
}

/** Log-scale normalization: raw counts compress so one viral day can't dominate. */
const normalizeLog = (value: number, max: number): number => {
  if (value <= 0 || max <= 0) return 0;
  return Math.round((Math.log10(value + 1) / Math.log10(max + 1)) * 100);
};

export const scoreProductDemand = (
  funnels: Record<string, ProductFunnel>,
  weights: ScoreWeights = DEFAULT_SCORE_WEIGHTS,
): ProductScoreBreakdown[] => {
  const entries = Object.values(funnels);
  const max = (pick: (f: ProductFunnel) => number) =>
    Math.max(0, ...entries.map(pick));

  const maxViews = max((f) => f.counts.view);
  const maxInterest = max((f) => f.counts.interest);
  const maxIntent = max((f) => f.counts.assessment);
  const maxLeads = max((f) => f.counts.lead);
  const maxCommercial = max((f) => f.counts.booking + f.counts.meeting);

  return entries
    .map((f) => {
      const awareness = normalizeLog(f.counts.view, maxViews);
      const interest = normalizeLog(f.counts.interest, maxInterest);
      const intent = normalizeLog(f.counts.assessment, maxIntent);
      const lead = normalizeLog(f.counts.lead, maxLeads);
      const commercial = normalizeLog(f.counts.booking + f.counts.meeting, maxCommercial);
      const score = Math.round(
        (awareness * weights.awareness +
          interest * weights.interest +
          intent * weights.intent +
          lead * weights.lead +
          commercial * weights.commercial) *
          100,
      ) / 100;
      return { slug: f.slug, name: f.name, awareness, interest, intent, lead, commercial, score, weights };
    })
    .sort((a, b) => b.score - a.score || (a.slug < b.slug ? -1 : 1));
};

// ---------------------------------------------------------------------------
// Fase 4 — demand ranking
// ---------------------------------------------------------------------------

export interface DemandRanking {
  topInterest: string | null;
  topLeads: string | null;
  topMeetings: string | null;
  topPotential: string | null;
  topConversion: string | null;
}

const pickMax = (rows: Array<{ slug: string; value: number }>): string | null => {
  const best = rows.reduce<{ slug: string; value: number } | null>((acc, row) => {
    if (acc === null || row.value > acc.value) return row;
    if (row.value < acc.value) return acc;
    return row.slug < acc.slug ? row : acc;
  }, null);
  return best && best.value > 0 ? best.slug : null;
};

/** Immediate answers to the Fase 4 ranking questions. */
export const getDemandRanking = (
  funnels: Record<string, ProductFunnel>,
  scores: ProductScoreBreakdown[],
): DemandRanking => {
  const entries = Object.values(funnels);
  return {
    topInterest: pickMax(entries.map((f) => ({ slug: f.slug, value: f.counts.interest }))),
    topLeads: pickMax(entries.map((f) => ({ slug: f.slug, value: f.counts.lead }))),
    topMeetings: pickMax(entries.map((f) => ({ slug: f.slug, value: f.counts.meeting }))),
    topPotential: pickMax(scores.map((s) => ({ slug: s.slug, value: s.score }))),
    topConversion: pickMax(
      entries.filter((f) => f.viewToLead !== null).map((f) => ({ slug: f.slug, value: f.viewToLead as number })),
    ),
  };
};

// ---------------------------------------------------------------------------
// Fase 9 — product CRO
// ---------------------------------------------------------------------------

export interface ProductCROInsight {
  slug: string;
  name: string;
  /** Stage with the biggest absolute drop before the money stages. */
  leakStage: ProductDemandStage | null;
  /** Where conversion is strongest (deepest stage reached). */
  intentStrength: ProductDemandStage | null;
}

export const getProductCROInsights = (
  funnels: Record<string, ProductFunnel>,
): ProductCROInsight[] =>
  Object.values(funnels).map((f) => {
    const stages = PRODUCT_DEMAND_STAGES;
    let leakStage: ProductDemandStage | null = null;
    for (let i = 1; i < stages.length; i += 1) {
      const prev = f.counts[stages[i - 1]];
      const cur = f.counts[stages[i]];
      if (prev >= 20 && cur < prev) {
        // Compare drop ratio; keep the steepest single leak.
        const drop = (prev - cur) / prev;
        if (!leakStage || drop > 0.99) leakStage = stages[i];
      }
    }
    return {
      slug: f.slug,
      name: f.name,
      leakStage,
      intentStrength: f.deepestStage,
    };
  });

// ---------------------------------------------------------------------------
// Fase 15 — attribution
// ---------------------------------------------------------------------------

export interface ProductAttribution {
  landing: string | null;
  pillar: string | null;
  case: string | null;
  assessment: string | null;
}

/** Real CMS case-detail route (R20.7 PortfolioDetail). */
const CASE_DETAIL_PATH = /^\/portfolio\/([^/?#]+)\/?$/;

/**
 * Fase 15 — which surfaces drive a product, read from the recorded journey:
 * the last landing path, pillar route and case detail path seen before the
 * product route. A case only attributes to a product when the case slug IS
 * the product slug — never a guess. Returns null for surfaces absent from
 * the journey.
 */
export const getProductAttribution = (
  events: FunnelInputEvent[],
  audits: ProductLandingAudit[],
  paths: {
    /** Landing network prefix (R20.6 satellite pages). */
    landingPrefix?: string;
    pillarRoutes: string[];
  },
): Record<string, ProductAttribution> => {
  const productSlugs = new Set(PRODUCTS.map((p) => p.slug));
  const byPath = new Map<string, string>();
  for (const audit of audits) {
    for (const path of audit.viewPaths) byPath.set(path, audit.slug);
  }
  const out: Record<string, ProductAttribution> = {};
  const ensure = (slug: string): ProductAttribution => {
    if (!out[slug]) out[slug] = { landing: null, pillar: null, case: null, assessment: null };
    return out[slug];
  };
  for (const audit of audits) ensure(audit.slug);

  for (const event of events) {
    const journey = event.data?.['journey'];
    if (!Array.isArray(journey)) continue;
    const stamp = productStamp(event) ?? journeyProduct(journey, byPath);
    if (!stamp) continue;
    const entry = ensure(stamp);

    for (const step of journey as string[]) {
      if (paths.pillarRoutes.includes(step)) entry.pillar = step;
      if (paths.landingPrefix && step.startsWith(paths.landingPrefix)) entry.landing = step;
      const caseMatch = step.match(CASE_DETAIL_PATH);
      if (caseMatch && productSlugs.has(caseMatch[1])) entry.case = step;
    }
    const assessment = event.data?.['assessment'];
    if (typeof assessment === 'string' && assessment.length > 0) entry.assessment = assessment;
  }
  return out;
};

// ---------------------------------------------------------------------------
// Fase 16 — demand validation
// ---------------------------------------------------------------------------

export type DemandValidation = 'VALIDATED' | 'PROMISING' | 'EARLY_SIGNAL' | 'NO_SIGNAL';

/**
 * Validation is behavioral and deterministic:
 *  - VALIDATED   — leads AND meetings present (real money signal)
 *  - PROMISING   — leads present (intent proven, revenue pending)
 *  - EARLY_SIGNAL — interest/view without downstream proof
 *  - NO_SIGNAL   — nothing but catalog presence
 */
export const classifyDemand = (f: ProductFunnel): DemandValidation => {
  if (f.counts.lead > 0 && (f.counts.booking > 0 || f.counts.meeting > 0)) return 'VALIDATED';
  if (f.counts.lead > 0) return 'PROMISING';
  if (f.counts.interest > 0 || f.counts.view > 0) return 'EARLY_SIGNAL';
  return 'NO_SIGNAL';
};

// ---------------------------------------------------------------------------
// Fase 17 — opportunity engine
// ---------------------------------------------------------------------------

export type OpportunityType =
  | 'CREATE_LANDING'
  | 'EXPAND_SEO'
  | 'CREATE_CASE'
  | 'EXPAND_ASSESSMENT'
  | 'INVEST_ACQUISITION'
  | 'VALIDATE_MVP';

export interface ProductOpportunity {
  slug: string;
  type: OpportunityType;
  reason: string;
  /** Priority 1 (highest) … 3 (lowest). */
  priority: 1 | 2 | 3;
}

/**
 * Recommendations only. Nothing here executes anything; an operator reads
 * the list and decides. Generation order is deterministic (priority, then
 * slug, then type).
 */
export const getProductOpportunities = (
  funnels: Record<string, ProductFunnel>,
  scores: ProductScoreBreakdown[],
  audits: ProductLandingAudit[],
): ProductOpportunity[] => {
  const out: ProductOpportunity[] = [];
  const scoreOf = (slug: string) => scores.find((s) => s.slug === slug)?.score ?? 0;

  for (const audit of audits) {
    const funnel = funnels[audit.slug];
    if (!funnel) continue;
    const validation = classifyDemand(funnel);
    const score = scoreOf(audit.slug);

    if (audit.landing === 'LANDING_MISSING') {
      out.push({
        slug: audit.slug,
        type: 'CREATE_LANDING',
        reason: `Sem landing e sem procura registada (${validation}) — valida primeiro o que falta.`,
        priority: validation === 'NO_SIGNAL' ? 3 : 2,
      });
      continue;
    }

    if (validation === 'VALIDATED' && score >= 50) {
      out.push({
        slug: audit.slug,
        type: 'INVEST_ACQUISITION',
        reason: `Procura validada (${validation}) com score ${score} — justifica aquisição.`,
        priority: 1,
      });
    }
    if (validation === 'PROMISING') {
      out.push({
        slug: audit.slug,
        type: 'EXPAND_ASSESSMENT',
        reason: `Gera leads mas não reuniões (${validation}) — aprofunda a qualifying.`,
        priority: 2,
      });
      if (score >= 40) {
        out.push({
          slug: audit.slug,
          type: 'EXPAND_SEO',
          reason: `Interesse alto (score ${score}) — amplia a rede de landings.`,
          priority: 2,
        });
      }
    }
    if (validation === 'EARLY_SIGNAL' && score >= 30) {
      out.push({
        slug: audit.slug,
        type: 'VALIDATE_MVP',
        reason: `Sinal inicial (score ${score}) — valida o fit antes de escalar.`,
        priority: 3,
      });
    }
  }

  const typeOrder: OpportunityType[] = [
    'INVEST_ACQUISITION',
    'CREATE_LANDING',
    'EXPAND_SEO',
    'CREATE_CASE',
    'EXPAND_ASSESSMENT',
    'VALIDATE_MVP',
  ];
  return out.sort(
    (a, b) =>
      a.priority - b.priority ||
      a.slug.localeCompare(b.slug) ||
      typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type),
  );
};

// ---------------------------------------------------------------------------
// Fase 12 — dashboard layer (no UI) + Fase 13 CRM readiness
// ---------------------------------------------------------------------------

export interface ProductDashboardRow {
  slug: string;
  name: string;
  demandScore: number;
  interestScore: number;
  leadScore: number;
  meetingScore: number;
  conversionScore: number;
  validation: DemandValidation;
}

/** Rows for R20.12 to render later. No UI shipped here. */
export const getDemandDashboard = (
  funnels: Record<string, ProductFunnel>,
  scores: ProductScoreBreakdown[],
): ProductDashboardRow[] =>
  Object.values(funnels)
    .map((f) => {
      const score = scores.find((s) => s.slug === f.slug);
      return {
        slug: f.slug,
        name: f.name,
        demandScore: score?.score ?? 0,
        interestScore: score?.interest ?? 0,
        leadScore: score?.lead ?? 0,
        meetingScore: score?.commercial ?? 0,
        conversionScore: f.viewToLead ?? 0,
        validation: classifyDemand(f),
      };
    })
    .sort((a, b) => b.demandScore - a.demandScore || (a.slug < b.slug ? -1 : 1));

export interface CrmOpportunitySignal {
  product: string;
  stage: 'INTEREST' | 'LEAD' | 'MEETING';
  /** Engagement score 0–100 to help CRM prioritization. */
  score: number;
  /** ISO date the signal was produced. */
  generatedAt: string;
}

/**
 * Fase 13 — CRM-ready product → lead → pipeline → opportunity shape. Builds
 * the record from product funnel + score; a real CRM integration consumes it.
 */
export const getCrmOpportunitySignals = (
  funnels: Record<string, ProductFunnel>,
  scores: ProductScoreBreakdown[],
): CrmOpportunitySignal[] => {
  const generatedAt = new Date().toISOString();
  const out: CrmOpportunitySignal[] = [];
  for (const f of Object.values(funnels)) {
    const score = scores.find((s) => s.slug === f.slug)?.score ?? 0;
    if (f.counts.meeting > 0) out.push({ product: f.slug, stage: 'MEETING', score, generatedAt });
    else if (f.counts.lead > 0) out.push({ product: f.slug, stage: 'LEAD', score, generatedAt });
    else if (f.counts.interest > 0) out.push({ product: f.slug, stage: 'INTEREST', score, generatedAt });
  }
  return out.sort((a, b) => b.score - a.score || a.product.localeCompare(b.product));
};
