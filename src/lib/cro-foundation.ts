/**
 * R20.3 — CRO Foundation.
 *
 * Pure intelligence over R20.2 aggregates: leak severity, CTA/pillar/
 * product performance, form hypotheses, quick-win recommendations,
 * experiment scaffolding and a composite conversion score. No DOM, no
 * storage, no network, no PII — recommendations are strings only, never
 * automatic changes (brief: "Apenas recomendações").
 */

import {
  detectLeaks,
  getFormStats,
  getFunnelStats,
  getPillarStats,
  getScrollStats,
  getTopCTAs,
  getTopJourneys,
  getTopPages,
  getTopProducts,
  type FormStats,
  type FunnelInputEvent,
  type FunnelLeak,
  type PillarId,
  type PillarStats,
  type RankedItem,
} from './funnel-intelligence';
import { PRODUCTS } from '../data/products';

// ---------------------------------------------------------------------------
// Leak severity (Fase 2)
// ---------------------------------------------------------------------------

export type LeakSeverity = 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';

export interface ClassifiedLeak extends FunnelLeak {
  severity: LeakSeverity;
}

/**
 * Severity by step conversion rate. Null rate (no denominator traffic)
 * means no proven loss → BAIXO. Thresholds documented in
 * docs/cro-foundation.md.
 */
export const classifyLeak = (leak: FunnelLeak): LeakSeverity => {
  if (leak.rate === null) return 'BAIXO';
  if (leak.rate < 0.1) return 'CRÍTICO';
  if (leak.rate < 0.25) return 'ALTO';
  if (leak.rate < 0.5) return 'MÉDIO';
  return 'BAIXO';
};

/** All stage leaks classified, biggest loss first. */
export const getTopLeaks = (events: FunnelInputEvent[]): ClassifiedLeak[] =>
  detectLeaks(getFunnelStats(events)).map((leak) => ({ ...leak, severity: classifyLeak(leak) }));

// ---------------------------------------------------------------------------
// CTA performance (Fase 3)
// ---------------------------------------------------------------------------

export interface CTAPerformance {
  key: string;
  clicks: number;
  isIntent: boolean;
  isBookingCTA: boolean;
  /** 0–100 heuristic: click share (60) + intent (25) + booking CTA (15). */
  score: number;
}

const BOOKING_CTA_HINTS = ['booking', 'contact', 'demo', 'audit'];

export const getCTAPerformance = (events: FunnelInputEvent[]): CTAPerformance[] => {
  const ranked = getTopCTAs(events);
  const max = ranked[0]?.count ?? 0;
  return ranked
    .map(({ key, count }) => {
      const label = key.split('.').slice(1).join('.');
      const isIntent = label === 'audit_open';
      const isBookingCTA = BOOKING_CTA_HINTS.some((hint) => label.includes(hint));
      const score =
        Math.round(((max > 0 ? count / max : 0) * 60 + (isIntent ? 25 : 0) + (isBookingCTA ? 15 : 0)) * 10) / 10;
      return { key, clicks: count, isIntent, isBookingCTA, score };
    })
    .sort((a, b) => b.score - a.score || (a.key < b.key ? -1 : 1));
};

/** Highest score (ties: most clicks, then alpha). Null without CTAs. */
export const getBestCTA = (events: FunnelInputEvent[]): CTAPerformance | null => {
  const ranked = getCTAPerformance(events);
  return ranked[0] ?? null;
};

/** Lowest score among observed CTAs. Null without CTAs. */
export const getWorstCTA = (events: FunnelInputEvent[]): CTAPerformance | null => {
  const ranked = getCTAPerformance(events);
  return ranked[ranked.length - 1] ?? null;
};

/**
 * Page conversion contribution: share of converting journeys that touched
 * the page. Journey-level (not CTA-level — no identity join exists).
 */
export const getPageContribution = (journeys: string[][], page: string): number | null => {
  if (journeys.length === 0) return null;
  const touched = journeys.filter((journey) =>
    journey.some((step) => step === page || step.endsWith(`/${page.replace(/^\//, '')}`)),
  ).length;
  return touched / journeys.length;
};

// ---------------------------------------------------------------------------
// Pillar CRO (Fase 6)
// ---------------------------------------------------------------------------

export interface PillarRanking extends PillarStats {
  /** ctaClicks/views — null without views. */
  ctaRate: number | null;
  /** intents/views — null without views. */
  bookingRate: number | null;
  /** conversions/views — null without views. */
  submitRate: number | null;
  isWinner: boolean;
  isWeakest: boolean;
}

/** Pillars ordered by conversions, then CTA clicks, then views, then alpha. */
export const getPillarRanking = (
  events: FunnelInputEvent[],
  conversionJourneys: string[][] = [],
): PillarRanking[] => {
  const stats = getPillarStats(events, conversionJourneys);
  const rate = (numerator: number, denominator: number): number | null =>
    denominator > 0 ? numerator / denominator : null;
  const ranked = (Object.keys(stats) as PillarId[])
    .map((pillar) => {
      const s = stats[pillar];
      return {
        ...s,
        ctaRate: rate(s.ctaClicks, s.views),
        bookingRate: rate(s.intents, s.views),
        submitRate: rate(s.conversions, s.views),
        isWinner: false,
        isWeakest: false,
      };
    })
    .sort(
      (a, b) =>
        b.conversions - a.conversions ||
        b.ctaClicks - a.ctaClicks ||
        b.views - a.views ||
        (a.pillar < b.pillar ? -1 : 1),
    );
  if (ranked.length > 0) {
    ranked[0].isWinner = true;
    ranked[ranked.length - 1].isWeakest = true;
  }
  return ranked;
};

/** Pillar with most conversions (tie-breaks per ranking). Null without pillars. */
export const getBestPillar = (
  events: FunnelInputEvent[],
  conversionJourneys: string[][] = [],
): PillarRanking | null => getPillarRanking(events, conversionJourneys)[0] ?? null;

// ---------------------------------------------------------------------------
// Product CRO (Fase 7)
// ---------------------------------------------------------------------------

export interface ProductStats {
  slug: string;
  name: string;
  kind: 'saas' | 'platform';
  /** page_view on the landing route (0 for institutional platforms). */
  views: number;
  clicks: number;
  /** 'interest' action volume (0 until wired — counter reserved). */
  interest: number;
  /** Share of converting journeys touching the product page. */
  bookingContribution: number | null;
}

/** Per-product rollup across the official catalog (R19.8 registry). */
export const getProductStats = (
  events: FunnelInputEvent[],
  conversionJourneys: string[][] = [],
): ProductStats[] => {
  const viewsByPath = new Map<string, number>();
  for (const event of events) {
    if (event.name === 'page_view' && event.path) {
      viewsByPath.set(event.path, (viewsByPath.get(event.path) ?? 0) + 1);
    }
  }
  const clicksByProduct = new Map<string, number>();
  const interestByProduct = new Map<string, number>();
  for (const event of events) {
    if (event.name !== 'product_interaction') continue;
    const product = String(event.data?.['product'] ?? '');
    // Prefer the explicit action; fall back to the label suffix
    // (`{slug}_click`) for exports that flatten the payload.
    const labelAction = typeof event.label === 'string' && /_(click|interest|view)$/.test(event.label)
      ? event.label.split('_').pop()
      : '';
    const action = String(event.data?.['action'] ?? labelAction);
    if (action === 'click') clicksByProduct.set(product, (clicksByProduct.get(product) ?? 0) + 1);
    if (action === 'interest') interestByProduct.set(product, (interestByProduct.get(product) ?? 0) + 1);
  }
  return PRODUCTS.map((product) => {
    const paths = product.to ? [product.to, `/br${product.to}`, `/en${product.to}`] : [];
    const views = paths.reduce((sum, path) => sum + (viewsByPath.get(path) ?? 0), 0);
    const touching = conversionJourneys.filter((journey) =>
      paths.some((path) => journey.includes(path)),
    ).length;
    return {
      slug: product.slug,
      name: product.name,
      kind: product.kind,
      views,
      clicks: clicksByProduct.get(product.slug) ?? 0,
      interest: interestByProduct.get(product.slug) ?? 0,
      bookingContribution: conversionJourneys.length > 0 ? touching / conversionJourneys.length : null,
    };
  }).sort((a, b) => b.clicks - a.clicks || b.views - a.views || (a.slug < b.slug ? -1 : 1));
};

// ---------------------------------------------------------------------------
// Form CRO + hypotheses (Fase 4)
// ---------------------------------------------------------------------------

export interface FormHypothesis {
  form: string;
  trigger: string;
  hypothesis: string;
}

/**
 * Rule-based hypotheses from lifecycle stats (starting points for human
 * review, not diagnoses). Deterministic and ordered by severity.
 */
export const getFormHypotheses = (stats: FormStats): FormHypothesis[] => {
  const out: FormHypothesis[] = [];
  if (stats.starts === 0) {
    out.push({
      form: stats.form,
      trigger: 'no-starts',
      hypothesis: `Sem inícios registados em ${stats.form}: o CTA que leva ao formulário pode estar invisível ou o formulário pode não estar a ser alcançado.`,
    });
    return out;
  }
  if ((stats.abandonRate ?? 0) > 0.4) {
    out.push({
      form: stats.form,
      trigger: 'high-abandon',
      hypothesis: `Abandono de ${Math.round((stats.abandonRate ?? 0) * 100)}% em ${stats.form}: reduzir campos, partir em passos ou reforçar prova junto ao submit.`,
    });
  }
  if ((stats.completionRate ?? 1) < 0.3) {
    out.push({
      form: stats.form,
      trigger: 'low-completion',
      hypothesis: `Conclusão de ${Math.round((stats.completionRate ?? 0) * 100)}% em ${stats.form}: fricção entre início e sucesso — rever validações e mensagens de erro.`,
    });
  }
  if (stats.errors > 0) {
    out.push({
      form: stats.form,
      trigger: 'validation-errors',
      hypothesis: `${stats.errors} submissões com erro em ${stats.form}: clarificar formato esperado antes do submit (exemplos, máscaras, hints).`,
    });
  }
  if (out.length === 0) {
    out.push({
      form: stats.form,
      trigger: 'healthy',
      hypothesis: `${stats.form} sem sinais de fricção anormal: manter e monitorizar deriva semanal.`,
    });
  }
  return out;
};

// ---------------------------------------------------------------------------
// Scroll CRO (Fase 5)
// ---------------------------------------------------------------------------

export interface ScrollInsight {
  location: string;
  consumed: number | null; // p100/p25 — null without p25 data
  weakestZone: string | null;
  /** Human-readable implication for CTA placement. */
  implication: string;
}

/** Consumed share + weakest zone per location, with placement implications. */
export const getScrollInsights = (events: FunnelInputEvent[]): ScrollInsight[] =>
  getScrollStats(events).map((stats) => {
    const consumed = stats.p25 > 0 ? stats.p100 / stats.p25 : null;
    const implication =
      stats.weakestZone === null
        ? 'Sem dados de profundidade suficientes para esta localização.'
        : `A maior quebra está em ${stats.weakestZone}: CTAs abaixo dessa zona ficam invisíveis — mover ou repetir a conversão acima dela.`;
    return {
      location: stats.location,
      consumed,
      weakestZone: stats.weakestZone,
      implication,
    };
  });

// ---------------------------------------------------------------------------
// Quick wins (Fase 8)
// ---------------------------------------------------------------------------

export interface QuickWin {
  area: 'funnel' | 'form' | 'scroll' | 'pillar' | 'product' | 'cta';
  finding: string;
  recommendation: string;
  /** 1–5. */
  impact: number;
  /** 1–5. */
  effort: number;
  /** impact/effort — higher first. */
  priority: number;
}

/**
 * Prioritized recommendations (strings only — never automatic changes).
 * Ordered by priority desc, then impact desc, then area alpha.
 */
export const getQuickWins = (input: {
  events: FunnelInputEvent[];
  journeys?: string[][];
}): QuickWin[] => {
  const { events, journeys = [] } = input;
  const wins: QuickWin[] = [];
  const push = (
    area: QuickWin['area'],
    finding: string,
    recommendation: string,
    impact: number,
    effort: number,
  ): void => {
    wins.push({ area, finding, recommendation, impact, effort, priority: impact / effort });
  };

  for (const leak of getTopLeaks(events)) {
    if (leak.loss === 0) continue;
    const guidance: Record<string, string> = {
      'views→cta': 'Reforçar ou repetir o CTA principal acima da dobra na página de maior tráfego.',
      'cta→intent': 'Aproximar a auditoria gratuita do CTA clicado (mesma secção, mesmo contexto).',
      'intent→start': 'Reduzir o passo entre intenção e formulário: pré-preencher contexto sempre que possível.',
      'start→submit': 'Reduzir fricção do formulário: menos campos, validação inline, progresso visível.',
      'submit→success': 'Rever erros de submissão e timeouts: cada falha aqui é um lead perdido à porta.',
    };
    push(
      'funnel',
      `Maior perda em ${leak.from}→${leak.to} (${leak.loss}, severidade ${leak.severity}).`,
      guidance[`${leak.from}→${leak.to}`] ?? `Investigar a transição ${leak.from}→${leak.to}.`,
      leak.severity === 'CRÍTICO' ? 5 : leak.severity === 'ALTO' ? 4 : 3,
      2,
    );
    break; // only the single biggest leak becomes a quick win
  }

  for (const form of ['booking', 'contact'] as const) {
    for (const hypothesis of getFormHypotheses(getFormStats(events, form))) {
      if (hypothesis.trigger === 'healthy' || hypothesis.trigger === 'no-starts') continue;
      push('form', hypothesis.hypothesis, 'Aplicar a hipótese acima como próxima experiência draft.', 4, 3);
    }
  }

  return wins
    .sort((a, b) => b.priority - a.priority || b.impact - a.impact || (a.area < b.area ? -1 : 1))
    .slice(0, 5);
};

// ---------------------------------------------------------------------------
// Conversion score (Fase 10)
// ---------------------------------------------------------------------------

export interface ConversionScore {
  /** 0–100 composite. */
  score: number;
  components: {
    ctaRate: number | null;
    intentRate: number | null;
    submitRate: number | null;
    scrollCompletion: number | null;
    journeyQuality: number | null;
  };
  /** How many of the 5 components had data. */
  coverage: number;
}

/**
 * Composite 0–100: ctaRate 25 + intentRate 20 + submitRate 25 +
 * scrollCompletion 15 + journeyQuality 15. Missing components are
 * excluded and weights renormalized. See docs/cro-foundation.md.
 */
export const getConversionScore = (input: {
  events: FunnelInputEvent[];
  journeys?: string[][];
}): ConversionScore => {
  const { events, journeys = [] } = input;
  const views = events.filter((e) => e.name === 'page_view').length;
  const ctas = events.filter((e) => e.name === 'cta_click').length;
  const intents = events.filter((e) => e.name === 'cta_click' && e.label === 'audit_open').length;
  const successes =
    events.filter((e) => e.name === 'form_submission').length +
    events.filter((e) => e.name === 'schedule_appointment').length;

  const ctaRate = views > 0 ? Math.min(1, ctas / views) : null;
  const intentRate = ctas > 0 ? Math.min(1, intents / ctas) : null;
  const submitRate = views > 0 ? Math.min(1, successes / views) : null;

  let scrollCompletion: number | null = null;
  {
    let p25 = 0;
    let p100 = 0;
    for (const e of events) {
      if (e.name !== 'scroll_depth' || !e.label) continue;
      if (e.label.endsWith('_25')) p25 += 1;
      if (e.label.endsWith('_100')) p100 += 1;
    }
    if (p25 > 0) scrollCompletion = Math.min(1, p100 / p25);
  }

  // Journey quality: share of converting journeys that touched a pillar
  // (pillar-led paths convert with context — the quality signal).
  let journeyQuality: number | null = null;
  if (journeys.length > 0) {
    const withPillar = journeys.filter((j) =>
      j.some((step) => /agentes-ia|integracoes-erp-crm|desenvolvimento-software|marketing-digital/.test(step)),
    ).length;
    journeyQuality = withPillar / journeys.length;
  }

  const weighted: Array<[number | null, number]> = [
    [ctaRate, 25],
    [intentRate, 20],
    [submitRate, 25],
    [scrollCompletion, 15],
    [journeyQuality, 15],
  ];
  const available = weighted.filter(([value]) => value !== null) as Array<[number, number]>;
  const totalWeight = available.reduce((sum, [, weight]) => sum + weight, 0);
  const score =
    totalWeight > 0
      ? Math.round((available.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight) * 100)
      : 0;
  return {
    score,
    components: { ctaRate, intentRate, submitRate, scrollCompletion, journeyQuality },
    coverage: available.length,
  };
};

// ---------------------------------------------------------------------------
// Experiment framework (Fase 9 — structure only, never executes tests)
// ---------------------------------------------------------------------------

export type ExperimentStatus = 'draft' | 'running' | 'decided';

export interface ExperimentVariant {
  id: 'A' | 'B';
  description: string;
}

export interface Experiment {
  id: string;
  hypothesis: string;
  page: string;
  primaryMetric: 'ctaRate' | 'submitRate' | 'completionRate' | 'scrollCompletion';
  variants: [ExperimentVariant, ExperimentVariant];
  status: ExperimentStatus;
  winner?: 'A' | 'B';
  evidence?: string;
}

/** Create a draft A/B test. Throws on anything but exactly two variants. */
export const createExperiment = (
  id: string,
  hypothesis: string,
  page: string,
  primaryMetric: Experiment['primaryMetric'],
  variantA: string,
  variantB: string,
): Experiment => ({
  id,
  hypothesis,
  page,
  primaryMetric,
  variants: [
    { id: 'A', description: variantA },
    { id: 'B', description: variantB },
  ],
  status: 'draft',
});

/** Record a decision immutably (original untouched). Throws on unknown winner. */
export const decideExperiment = (
  experiment: Experiment,
  winner: 'A' | 'B',
  evidence: string,
): Experiment => {
  if (winner !== 'A' && winner !== 'B') throw new Error(`unknown winner: ${winner}`);
  return { ...experiment, status: 'decided', winner, evidence };
};

/** Turn the top quick win into a draft experiment (human approves before running). */
export const suggestExperiment = (win: QuickWin, page: string): Experiment =>
  createExperiment(
    `exp-${win.area}-${Date.now().toString(36)}`,
    win.finding,
    page,
    win.area === 'scroll' ? 'scrollCompletion' : win.area === 'form' ? 'completionRate' : 'ctaRate',
    `Controlo (estado atual): ${win.finding}`,
    `Variante: ${win.recommendation}`,
  );

// ---------------------------------------------------------------------------
// Re-exports for a single intelligence entrypoint (Fase 11)
// ---------------------------------------------------------------------------

export {
  detectLeaks,
  getFormStats,
  getFunnelStats,
  getPillarStats,
  getScrollStats,
  getTopCTAs,
  getTopJourneys,
  getTopPages,
  getTopProducts,
} from './funnel-intelligence';
