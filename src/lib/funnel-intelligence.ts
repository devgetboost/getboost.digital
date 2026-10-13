/**
 * R20.2 — Funnel Intelligence.
 *
 * Pure functions over R20.1 analytics events. No DOM, no storage, no
 * network, no PII: every function takes plain event/journey arrays and
 * returns plain aggregates, so the layer is trivially testable and can
 * later run against a BigQuery export with zero changes.
 *
 * Official funnel model V1 (see docs/funnel-intelligence.md):
 *   VISIT → PAGE → PILLAR → CTA → BOOKING/CONTACT → SUBMIT
 *
 * Identity limitation: the site runs without user ids or cookies, so all
 * rates are EVENT-based proxies (counts of events, not of people). Every
 * rate documents this; see "Limitações" in the doc.
 */

/** Minimal shape consumed by every helper (superset-compatible with R20.1 events). */
export interface FunnelInputEvent {
  name: string;
  category?: string;
  label?: string;
  path?: string;
  funnel_stage?: string;
  data?: Record<string, unknown>;
  at?: string;
}

export type PillarId = 'ai' | 'automation' | 'software' | 'growth';

const PILLAR_BY_PATH: Array<{ pillar: PillarId; match: RegExp }> = [
  { pillar: 'ai', match: /^(\/(br|en))?\/agentes-ia/ },
  { pillar: 'automation', match: /\/solucoes\/integracoes-erp-crm/ },
  { pillar: 'software', match: /\/solucoes\/desenvolvimento-software/ },
  { pillar: 'growth', match: /\/solucoes\/marketing-digital/ },
];

/** ScrollDepth location ids per pillar (R20.1 wiring). */
const PILLAR_BY_LOCATION: Record<string, PillarId> = {
  ai_agents: 'ai',
  automation: 'automation',
  software: 'software',
  growth: 'growth',
};

/** CTA category prefixes per pillar (R20.1 wiring: ai_hero, ai_cta, …). */
const PILLAR_BY_CTA_PREFIX: Array<{ pillar: PillarId; prefix: string }> = [
  { pillar: 'ai', prefix: 'ai_' },
  { pillar: 'automation', prefix: 'automation_' },
  { pillar: 'software', prefix: 'software_' },
  { pillar: 'growth', prefix: 'growth_' },
];

/** Resolve the pillar for a page path, or null outside pillar pages. */
export const pillarForPath = (path: string | undefined): PillarId | null => {
  if (!path) return null;
  const clean = path.split('?')[0];
  for (const { pillar, match } of PILLAR_BY_PATH) {
    if (match.test(clean)) return pillar;
  }
  return null;
};

// ---------------------------------------------------------------------------
// Attribution (Fase 2)
// ---------------------------------------------------------------------------

export interface JourneyAttribution {
  /** First page of the session ("de onde vêm"). */
  origin: string;
  /** Last page before conversion. */
  lastPage: string;
  /** Last pillar touched, if any. */
  lastPillar: PillarId | null;
  /** Whether any step touched a pillar page. */
  pillarTouched: boolean;
  /** Number of steps. */
  length: number;
}

/** Attribute a journey (array of paths) to origin/pillar/endpoint. Paths only — never PII. */
export const attributeJourney = (steps: string[]): JourneyAttribution => {
  const clean = steps.filter((s) => typeof s === 'string');
  let lastPillar: PillarId | null = null;
  let pillarTouched = false;
  for (const step of clean) {
    const pillar = pillarForPath(step);
    if (pillar) {
      pillarTouched = true;
      lastPillar = pillar;
    }
  }
  return {
    origin: clean[0] ?? 'direct',
    lastPage: clean[clean.length - 1] ?? 'direct',
    lastPillar,
    pillarTouched,
    length: clean.length,
  };
};

/** Pull conversion journeys out of success payloads (data.journey, R20.1). */
export const extractJourneys = (events: FunnelInputEvent[]): string[][] => {
  const out: string[][] = [];
  for (const event of events) {
    const journey = event.data?.['journey'];
    if (Array.isArray(journey) && journey.every((s) => typeof s === 'string')) {
      out.push(journey as string[]);
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// Rankings (Fases 3, 8, 10)
// ---------------------------------------------------------------------------

export interface RankedItem {
  key: string;
  count: number;
}

/** Frequency ranking, ties broken alphabetically for determinism. */
export const rankBy = (items: string[]): RankedItem[] => {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
};

/** Top pages by page_view volume. Key: path. */
export const getTopPages = (events: FunnelInputEvent[]): RankedItem[] =>
  rankBy(
    events.filter((e) => e.name === 'page_view' && e.path).map((e) => e.path as string),
  );

/** Top CTAs by click volume (cta_click incl. audit_open intent). Key: category.label. */
export const getTopCTAs = (events: FunnelInputEvent[]): RankedItem[] =>
  rankBy(
    events
      .filter((e) => e.name === 'cta_click' && e.category && e.label)
      .map((e) => `${e.category}.${e.label}`),
  );

/** Top products by interaction volume. Key: product slug. */
export const getTopProducts = (events: FunnelInputEvent[]): RankedItem[] =>
  rankBy(
    events
      .filter((e) => e.name === 'product_interaction')
      .map((e) => String((e.data?.['product'] ?? e.label ?? 'unknown'))),
  );

/** Top conversion journeys by frequency. Key: `a → b → c`. */
export const getTopJourneys = (journeys: string[][]): RankedItem[] =>
  rankBy(journeys.filter((j) => j.length > 0).map((j) => j.join(' → ')));

// ---------------------------------------------------------------------------
// Funnel stats + leak detection (Fases 1, 6)
// ---------------------------------------------------------------------------

export interface FunnelStats {
  views: number;
  ctaClicks: number;
  intents: number; // audit_open
  formStarts: number;
  submits: number;
  successes: number;
}

/** Event-count funnel (proxy — no user identity, see limitations). */
export const getFunnelStats = (events: FunnelInputEvent[]): FunnelStats => {
  const has = (name: string, match?: (e: FunnelInputEvent) => boolean): number =>
    events.filter((e) => e.name === name && (!match || match(e))).length;
  return {
    views: has('page_view'),
    ctaClicks: has('cta_click'),
    intents: has('cta_click', (e) => e.label === 'audit_open'),
    formStarts: has('form_step', (e) => e.label?.endsWith('_start') ?? false),
    submits: has('form_step', (e) => e.label?.endsWith('_submit') ?? false),
    successes: has('form_submission') + has('schedule_appointment'),
  };
};

export interface FunnelLeak {
  from: string;
  to: string;
  /** to/from ratio, null when the denominator is zero. */
  rate: number | null;
  /** Absolute loss (from − to). */
  loss: number;
}

/**
 * Stage-to-stage losses, sorted by absolute loss desc — the biggest
 * opportunity first. Stages: views → cta → intent → start → submit → success.
 */
export const detectLeaks = (stats: FunnelStats): FunnelLeak[] => {
  const stages: Array<[string, number]> = [
    ['views', stats.views],
    ['cta', stats.ctaClicks],
    ['intent', stats.intents],
    ['start', stats.formStarts],
    ['submit', stats.submits],
    ['success', stats.successes],
  ];
  return stages
    .slice(0, -1)
    .map(([from, fromCount], i) => {
      const [to, toCount] = stages[i + 1];
      return {
        from,
        to,
        rate: fromCount > 0 ? toCount / fromCount : null,
        loss: Math.max(0, fromCount - toCount),
      };
    })
    .sort((a, b) => b.loss - a.loss);
};

// ---------------------------------------------------------------------------
// Form intelligence (Fase 7)
// ---------------------------------------------------------------------------

export interface FormStats {
  form: string;
  starts: number;
  submits: number;
  successes: number;
  abandons: number;
  errors: number;
  /** successes/starts — null without starts. Proxy (no identity). */
  completionRate: number | null;
  /** abandons/starts — null without starts. Proxy (no identity). */
  abandonRate: number | null;
}

const isFormEvent = (form: string) => (e: FunnelInputEvent): boolean =>
  e.category === form ||
  e.label === `${form}_start` ||
  e.label === `${form}_submit` ||
  (typeof e.label === 'string' && e.label.startsWith(`${form}_`) && e.name === 'form_step');

/** Per-form start/completion/abandon from lifecycle + conversion events. */
export const getFormStats = (events: FunnelInputEvent[], form: string): FormStats => {
  const relevant = events.filter(isFormEvent(form));
  const count = (predicate: (e: FunnelInputEvent) => boolean): number =>
    relevant.filter(predicate).length;
  const starts = count((e) => e.name === 'form_step' && (e.label?.endsWith('_start') ?? false));
  const submits = count((e) => e.name === 'form_step' && (e.label?.endsWith('_submit') ?? false));
  const successes = count(
    (e) =>
      (e.name === 'form_submission' || e.name === 'schedule_appointment') &&
      (e.label?.includes('success') ?? false),
  );
  const abandons = count((e) => e.name === 'form_step' && (e.label?.endsWith('_abandon') ?? false));
  const errors = count(
    (e) => e.name === 'form_submission' && (e.label?.includes('error') ?? false),
  );
  return {
    form,
    starts,
    submits,
    successes,
    abandons,
    errors,
    completionRate: starts > 0 ? successes / starts : null,
    abandonRate: starts > 0 ? abandons / starts : null,
  };
};

// ---------------------------------------------------------------------------
// Scroll intelligence (Fase 9)
// ---------------------------------------------------------------------------

export interface ScrollStats {
  location: string;
  p25: number;
  p50: number;
  p75: number;
  p100: number;
  /** Largest inter-threshold drop, e.g. "50→75". Null without data. */
  weakestZone: string | null;
}

/** Per-location depth distribution + weakest zone from scroll_depth events. */
export const getScrollStats = (events: FunnelInputEvent[]): ScrollStats[] => {
  const byLocation = new Map<string, { p25: number; p50: number; p75: number; p100: number }>();
  for (const event of events) {
    if (event.name !== 'scroll_depth' || !event.label) continue;
    const match = event.label.match(/^(.*)_(\d+)$/);
    if (!match) continue;
    const [, location, depth] = match;
    const stats = byLocation.get(location) ?? { p25: 0, p50: 0, p75: 0, p100: 0 };
    if (depth === '25') stats.p25 += 1;
    else if (depth === '50') stats.p50 += 1;
    else if (depth === '75') stats.p75 += 1;
    else if (depth === '100') stats.p100 += 1;
    byLocation.set(location, stats);
  }
  return [...byLocation.entries()]
    .map(([location, counts]) => {
      const pairs: Array<[string, number, number]> = [
        ['25→50', counts.p25, counts.p50],
        ['50→75', counts.p50, counts.p75],
        ['75→100', counts.p75, counts.p100],
      ];
      let weakestZone: string | null = null;
      let weakestLoss = 0;
      for (const [zone, from, to] of pairs) {
        const loss = from - to;
        if (from > 0 && loss > weakestLoss) {
          weakestLoss = loss;
          weakestZone = zone;
        }
      }
      return { location, ...counts, weakestZone };
    })
    .sort((a, b) => a.location.localeCompare(b.location));
};

// ---------------------------------------------------------------------------
// Pillar performance (Fase 4)
// ---------------------------------------------------------------------------

export interface PillarStats {
  pillar: PillarId;
  views: number;
  depth50: number;
  depth100: number;
  ctaClicks: number;
  intents: number;
  /** Conversions whose journey touched the pillar. */
  conversions: number;
}

/** Per-pillar rollup across views, depth, CTAs, intent and attributed conversions. */
export const getPillarStats = (
  events: FunnelInputEvent[],
  conversionJourneys: string[][] = [],
): Record<PillarId, PillarStats> => {
  const pillars: PillarId[] = ['ai', 'automation', 'software', 'growth'];
  const attributed = conversionJourneys.map(attributeJourney);
  const result = {} as Record<PillarId, PillarStats>;
  for (const pillar of pillars) {
    const views = events.filter(
      (e) => e.name === 'page_view' && pillarForPath(e.path) === pillar,
    ).length;
    const depth = (threshold: string): number =>
      events.filter(
        (e) =>
          e.name === 'scroll_depth' &&
          e.label?.endsWith(`_${threshold}`) &&
          Object.entries(PILLAR_BY_LOCATION).some(
            ([location, mapped]) => mapped === pillar && e.label?.startsWith(`${location}_`),
          ),
      ).length;
    const prefix = PILLAR_BY_CTA_PREFIX.find((p) => p.pillar === pillar)?.prefix ?? '';
    const ctaClicks = events.filter(
      (e) =>
        e.name === 'cta_click' &&
        e.label !== 'audit_open' &&
        (e.category ?? '').startsWith(prefix),
    ).length;
    const intents = events.filter(
      (e) =>
        e.name === 'cta_click' &&
        e.label === 'audit_open' &&
        Object.entries(PILLAR_BY_LOCATION).some(
          ([location, mapped]) => mapped === pillar && e.category === location,
        ),
    ).length;
    const conversions = attributed.filter((a) => a.lastPillar === pillar).length;
    result[pillar] = {
      pillar,
      views,
      depth50: depth('50'),
      depth100: depth('100'),
      ctaClicks,
      intents,
      // A conversion counts for the pillar last touched in its journey.
      conversions,
    };
  }
  return result;
};

// ---------------------------------------------------------------------------
// Assessment funnel (R20.4)
// ---------------------------------------------------------------------------

export interface AssessmentStats {
  assessment: string;
  starts: number;
  completes: number;
  leads: number;
  results: number;
  /** completes/starts — null without starts. */
  completionRate: number | null;
  /** leads/completes — null without completes. */
  captureRate: number | null;
}

/**
 * Per-assessment funnel from the R20.4 lifecycle events. Which assessment
 * generates most leads? Most meetings downstream? Best quality (tier mix
 * is readable from lead_capture payloads server-side).
 */
export const getAssessmentStats = (
  events: FunnelInputEvent[],
  assessment: string,
): AssessmentStats => {
  const mine = (suffix: string): number =>
    events.filter(
      (e) => e.category === 'lead_magnet' && e.label === `${assessment}_${suffix}`,
    ).length;
  const starts = mine('start');
  const completes = mine('complete');
  const leads = mine('lead_capture');
  const results = mine('result_view');
  return {
    assessment,
    starts,
    completes,
    leads,
    results,
    completionRate: starts > 0 ? completes / starts : null,
    captureRate: completes > 0 ? leads / completes : null,
  };
};

// ---------------------------------------------------------------------------
// Debug report (Fase 12)
// ---------------------------------------------------------------------------

export interface IntelligenceReport {
  generatedAt: string;
  events: number;
  topPage: RankedItem | null;
  topCta: RankedItem | null;
  topJourney: RankedItem | null;
  topProduct: RankedItem | null;
  funnel: FunnelStats;
  biggestLeak: FunnelLeak | null;
}

/** One-shot rolling report for the debug console (internal use only). */
export const getIntelligenceReport = (
  events: FunnelInputEvent[],
  journeys?: string[][],
): IntelligenceReport => {
  const funnel = getFunnelStats(events);
  const leaks = detectLeaks(funnel);
  const topJourneys = getTopJourneys(journeys ?? extractJourneys(events));
  return {
    generatedAt: new Date().toISOString(),
    events: events.length,
    topPage: getTopPages(events)[0] ?? null,
    topCta: getTopCTAs(events)[0] ?? null,
    topJourney: topJourneys[0] ?? null,
    topProduct: getTopProducts(events)[0] ?? null,
    funnel,
    biggestLeak: leaks[0] ?? null,
  };
};
