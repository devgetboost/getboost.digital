import {
  STAGE_BY_TIER,
  type CrmStage,
  type LeadScoreBreakdown,
  type LeadScoreWeights,
  type LeadSignals,
  type OpportunityClass,
  type ProductFit,
  type QualificationTier,
} from '../data/crm-contract';
import { PILLARS, type PillarId } from '@/components/pillars/pillarData';
import { getProductNetwork } from '../data/product-demand';
import { LANDINGS } from '../data/landings';
import type { LeadUnit } from './lead-signals';
import type { ProductScoreBreakdown } from './product-intelligence';

/**
 * R20.9 — Lead Score Engine (Fases 3, 4, 9).
 *
 * Every component is an explicit, auditable rule over observed signals.
 * No machine learning, no opaque weighting, no hidden inputs: the same
 * signals always produce the same score, and every rule that fired is
 * reported in the audit trail.
 */

export const DEFAULT_LEAD_WEIGHTS: LeadScoreWeights = {
  interest: 0.2,
  intent: 0.3,
  engagement: 0.15,
  product: 0.15,
  demand: 0.2,
};

/** Depth needed to max each engagement sub-score. */
const DEPTH_CEILING = 5;
const clamp = (value: number): number => Math.max(0, Math.min(100, Math.round(value)));

/**
 * Fase 3 — composite lead score 0–100.
 *   interest   — how much of the funnel the lead walked (landing/case/pillar)
 *   intent     — assessment completion and the score it produced
 *   engagement — surface depth and journey length
 *   product    — strength of the product fit
 *   demand     — how much real demand that product carries (R20.8)
 */
export const getLeadScore = (
  lead: LeadUnit,
  fit: ProductFit | null,
  demand: ProductScoreBreakdown | null,
  weights: LeadScoreWeights = DEFAULT_LEAD_WEIGHTS,
): LeadScoreBreakdown => {
  const s = lead.signals;

  // Interest: explicit surfaces visited (not raw path length).
  const surfaces = s.landingViews.length + s.caseViews.length + s.pillarViews.length;
  const interest = clamp((surfaces / DEPTH_CEILING) * 100);

  // Intent: assessment completion is the strongest intent proof available;
  // the engine's own percentage refines it. Bookings are intent too.
  let intent = 0;
  if (s.assessmentId) intent = 40;
  if (s.assessmentScore !== null) intent += clamp(s.assessmentScore * 0.4);
  if (s.assessmentTier === 'avancado') intent += 10;
  if (s.booked) intent = Math.max(intent, 80);
  intent = clamp(intent);

  // Engagement: distinct surfaces plus journey length, saturating.
  const engagement = clamp(((s.depth / DEPTH_CEILING) * 0.7 + (Math.min(lead.journey.length, DEPTH_CEILING * 2) / (DEPTH_CEILING * 2)) * 0.3) * 100);

  // Product: fit strength from the rule engine.
  const product = clamp(fit?.fit ?? 0);

  // Demand: the product's R20.8 demand score, zero when unknown.
  const demandScore = demand?.score ?? 0;

  const score =
    Math.round(
      (interest * weights.interest +
        intent * weights.intent +
        engagement * weights.engagement +
        product * weights.product +
        demandScore * weights.demand) *
        100,
    ) / 100;

  return { leadId: lead.leadId, interest, intent, engagement, product, demand: demandScore, score, weights };
};

// ---------------------------------------------------------------------------
// Fase 9 — product fit engine (explicit rules, no ML)
// ---------------------------------------------------------------------------

export interface FitRule {
  id: string;
  /** Points contributed when the rule fires. */
  points: number;
  /** Evaluated against the lead's signals. */
  test: (lead: LeadUnit, network: ReturnType<typeof getProductNetwork>) => boolean;
  reason: string;
}

/**
 * Rules are ordered strongest-first; each firing rule contributes its points
 * and appends its reason. Cap at 100 so the fit stays a 0–100 score.
 */
export const FIT_RULES: FitRule[] = [
  {
    id: 'product_route',
    points: 40,
    // Scoped: only counts when the viewed route belongs to THIS product.
    test: (lead, network) => {
      const slug = productSlugFromNetwork(lead);
      if (!slug) return false;
      const node = network.find((n) => n.slug === slug);
      if (!node?.route) return false;
      return lead.signals.productViews.some((path) => path === node.route || path.endsWith(node.route as string));
    },
    reason: 'Visitou a landing do próprio produto',
  },
  {
    id: 'assessment_match',
    points: 35,
    test: (lead, network) => {
      const assessment = lead.signals.assessmentId;
      if (!assessment) return false;
      return network.some((n) => n.assessment === assessment);
    },
    reason: 'Assessment executado corresponde ao motor do produto',
  },
  {
    id: 'pillar_match',
    points: 25,
    test: (lead, network) => {
      const slug = productSlugFromNetwork(lead);
      if (!slug) return false;
      const node = network.find((n) => n.slug === slug);
      if (!node) return false;
      return node.pillars.some((pillar) => PILLARS[pillar].route && lead.signals.pillarViews.includes(PILLARS[pillar].route));
    },
    reason: 'Visitou um pilar que entrega o produto',
  },
  {
    id: 'landing_match',
    points: 20,
    test: (lead, network) => {
      const slug = productSlugFromNetwork(lead);
      if (!slug) return false;
      const node = network.find((n) => n.slug === slug);
      if (!node || node.landings.length === 0) return false;
      return lead.signals.landingViews.some((path) =>
        node.landings.some((landingSlug) => path === `/${landingSlug}`),
      );
    },
    reason: 'Visitou uma landing de intenção do produto',
  },
  {
    id: 'case_match',
    points: 15,
    test: (lead, network) => {
      const slug = productSlugFromNetwork(lead);
      if (!slug) return false;
      const node = network.find((n) => n.slug === slug);
      if (!node) return false;
      return lead.signals.caseViews.some((path) => path === `/portfolio/${slug}`);
    },
    reason: 'Leu o case study do produto',
  },
  {
    id: 'interest_only',
    points: 10,
    test: (lead, network) => {
      const slug = productSlugFromNetwork(lead);
      return slug !== null && network.some((n) => n.slug === slug);
    },
    reason: 'Interesse declarado no produto',
  },
];

/** Single candidate product from the signals (viewed or stamped interest). */
const productSlugFromNetwork = (lead: LeadUnit): string | null => {
  const stamped = lead.signals.productInterest[0];
  if (stamped) return stamped;
  const network = getProductNetwork([]);
  for (const path of lead.signals.productViews) {
    const match = network.find((n) => n.route && (path === n.route || path.endsWith(n.route)));
    if (match) return match.slug;
  }
  return null;
};

const candidateSlugs = (lead: LeadUnit): string[] => {
  const out = new Set<string>(lead.signals.productInterest);
  const network = getProductNetwork([]);
  for (const path of lead.signals.productViews) {
    const match = network.find((n) => n.route && (path === n.route || path.endsWith(n.route)));
    if (match) out.add(match.slug);
  }
  for (const path of lead.signals.caseViews) {
    const match = path.match(/^\/portfolio\/([^/?#]+)\/?$/);
    if (match && network.some((n) => n.slug === match[1])) out.add(match[1]);
  }
  for (const path of lead.signals.landingViews) {
    const slug = path.replace(/^\//, '');
    const landing = LANDINGS.find((l) => l.slug === slug);
    if (landing) for (const product of landing.products) out.add(product);
  }
  return [...out];
};

/** Ranked product fits for one lead (Fase 9). Empty when no product signal. */
export const getProductFit = (lead: LeadUnit): ProductFit[] => {
  const network = getProductNetwork([]);
  const bySlug = new Map(network.map((n) => [n.slug, n]));
  return candidateSlugs(lead)
    .map((slug) => {
      const node = bySlug.get(slug);
      let fit = 0;
      const reasons: string[] = [];
      for (const rule of FIT_RULES) {
        // Each rule is evaluated against a lead narrowed to this candidate,
        // so a rule can never fire for a product the lead did not touch.
        const scoped: LeadUnit = {
          ...lead,
          signals: { ...lead.signals, productInterest: [slug] },
        };
        if (rule.test(scoped, network)) {
          fit += rule.points;
          reasons.push(rule.reason);
        }
      }
      return { slug, name: node?.name ?? slug, fit: clamp(fit), reasons };
    })
    .sort((a, b) => {
      if (b.fit !== a.fit) return b.fit - a.fit;
      // Tie-break on signal provenance: an explicitly stamped product
      // outranks one only inferred from a landing (stamps come first).
      const rankA = lead.signals.productInterest.indexOf(a.slug);
      const rankB = lead.signals.productInterest.indexOf(b.slug);
      if (rankA !== rankB) {
        const norm = (value: number) => (value === -1 ? Number.MAX_SAFE_INTEGER : value);
        return norm(rankA) - norm(rankB);
      }
      return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0;
    });
};

export const getBestProductFit = (lead: LeadUnit): ProductFit | null =>
  getProductFit(lead)[0] ?? null;

// ---------------------------------------------------------------------------
// Fase 4 — qualification tiers
// ---------------------------------------------------------------------------

export interface QualificationRule {
  id: string;
  tier: QualificationTier;
  /** First matching rule wins — order below is the priority order. */
  test: (score: LeadScoreBreakdown, signals: LeadSignals) => boolean;
  reason: string;
}

/**
 * Transparent tiering (Fase 4). Rules are evaluated in order; the first
 * match decides. Every rule carries the reason it exists.
 */
export const QUALIFICATION_RULES: QualificationRule[] = [
  {
    id: 'hot_booked_qualified',
    tier: 'HOT',
    // Intent-based, not composite-based: a booked meeting with strong intent
    // is hot regardless of how much product demand data exists yet.
    test: (score, signals) => signals.booked && score.intent >= 70,
    reason: 'Agendou reunião com intenção comprovada',
  },
  {
    id: 'hot_advanced_assessment',
    tier: 'HOT',
    test: (_score, signals) => signals.assessmentTier === 'avancado' && signals.assessmentScore !== null && signals.assessmentScore >= 70,
    reason: 'Assessment avançado (≥70%) com resultado concreto',
  },
  {
    id: 'warm_assessment',
    tier: 'WARM',
    test: (score, signals) => Boolean(signals.assessmentId) && score.score >= 35,
    reason: 'Completou assessment com intenção acima do mínimo',
  },
  {
    id: 'warm_engaged',
    tier: 'WARM',
    test: (score, signals) => signals.leadCaptured && signals.depth >= 2 && score.score >= 25,
    reason: 'Lead capturado com profundidade de navegação',
  },
  {
    id: 'nurture_captured',
    tier: 'NURTURE',
    test: (_score, signals) => signals.leadCaptured,
    reason: 'Capturou contacto sem sinal de intenção suficiente',
  },
  {
    id: 'nurture_interest',
    tier: 'NURTURE',
    test: () => true,
    reason: 'Sem sinais adicionais — nutrição de base',
  },
];

export const getQualification = (
  score: LeadScoreBreakdown,
  signals: LeadSignals,
): { tier: QualificationTier; rule: string; reason: string } => {
  for (const rule of QUALIFICATION_RULES) {
    if (rule.test(score, signals)) {
      return { tier: rule.tier, rule: rule.id, reason: rule.reason };
    }
  }
  return { tier: 'NURTURE', rule: 'nurture_interest', reason: QUALIFICATION_RULES[QUALIFICATION_RULES.length - 1].reason };
};

export const stageForTier = (tier: QualificationTier): CrmStage => STAGE_BY_TIER[tier];

// ---------------------------------------------------------------------------
// Fase 10 — opportunity classification
// ---------------------------------------------------------------------------

/**
 * Behavioral opportunity class (Fase 10). Ordered rules, first match wins.
 * No estimation: every class traces to an observed signal.
 */
export const getOpportunityClass = (
  score: LeadScoreBreakdown,
  signals: LeadSignals,
): { opportunity: OpportunityClass; reason: string } => {
  if (signals.booked && score.intent >= 80) return { opportunity: 'OPPORTUNITY', reason: 'Reunião agendada com intenção forte' };
  if (signals.booked) return { opportunity: 'QUALIFIED', reason: 'Reunião agendada' };
  if (signals.contacted) return { opportunity: 'QUALIFIED', reason: 'Contacto direto iniciado' };
  if (signals.assessmentTier === 'avancado' || (signals.assessmentScore ?? 0) >= 70) {
    return { opportunity: 'PROMISING', reason: 'Resultado de assessment elevado' };
  }
  if (signals.leadCaptured && signals.assessmentId) return { opportunity: 'PROMISING', reason: 'Lead com assessment concluído' };
  if (signals.leadCaptured) return { opportunity: 'EARLY', reason: 'Lead capturado sem assessment' };
  if (signals.depth > 0 || signals.productInterest.length > 0) return { opportunity: 'EARLY', reason: 'Interesse sem captura' };
  return { opportunity: 'NO_SIGNAL', reason: 'Sem sinais observados' };
};

/**
 * Fase 15 — recommended next action. A recommendation only: nothing here
 * sends, books or emails anything.
 */
export const getFollowUpAction = (
  tier: QualificationTier,
  opportunity: OpportunityClass,
  signals: LeadSignals,
): FollowUpAction => {
  if (opportunity === 'OPPORTUNITY' || opportunity === 'QUALIFIED') {
    return signals.booked ? 'SEND_PROPOSAL' : 'BOOK_CALL';
  }
  if (tier === 'HOT') return 'BOOK_CALL';
  if (tier === 'WARM') return signals.booked ? 'SEND_PROPOSAL' : 'BOOK_CALL';
  if (tier === 'COLD' || tier === 'NURTURE') return 'NURTURE';
  return 'WAIT';
};

export const PILLAR_IDS = Object.keys(PILLARS) as PillarId[];
