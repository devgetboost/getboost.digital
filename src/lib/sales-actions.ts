import type { CrmLeadRecord, LeadSignals } from '../data/crm-contract';
import { SALES_PLAYBOOKS, type SalesAction } from '../data/sales-model';

/**
 * R20.10 — Action Engine (Fases 2, 3, 5, 14).
 *
 * Consumes the R20.9 CRM qualification output and answers "what should we do
 * next, and why?". Every recommendation is produced by ONE named rule and
 * ships its own audit trail: the rule, the signals it read, the score it saw,
 * the reason, the benefit and the risk of ignoring it.
 *
 * Nothing here executes. No email, no outreach, no CRM write, no agent.
 */

export interface SalesRecommendation {
  leadId: string;
  action: SalesAction;
  /** The rule that decided — the single source of the decision. */
  rule: string;
  /** Human-readable justification (Fase 3). */
  reason: string;
  /** Every signal the rule read, named (Fase 14 explainability). */
  signalsUsed: string[];
  /** The lead score the rule saw, for context. */
  score: number;
  /** What acting on this can gain (Fase 5). */
  benefit: string;
  /** What ignoring this costs (Fase 5). */
  risk: string;
  /** The playbook the sales team follows — guidance, not execution. */
  playbook: SalesAction;
}

// ---------------------------------------------------------------------------
// Signal readers — each returns the signals it actually observed
// ---------------------------------------------------------------------------

const readBooking = (s: LeadSignals): string[] => (s.booked ? ['booking_agendado'] : []);
const readContact = (s: LeadSignals): string[] => (s.contacted ? ['contacto_directo'] : []);
const readAssessment = (s: LeadSignals): string[] =>
  s.assessmentId
    ? [
        `assessment:${s.assessmentId}`,
        ...(s.assessmentScore !== null ? [`assessment_score:${s.assessmentScore}`] : []),
        ...(s.assessmentTier ? [`assessment_tier:${s.assessmentTier}`] : []),
      ]
    : [];
const readInterest = (record: CrmLeadRecord): string[] => [
  ...record.signals.productInterest.map((slug) => `product:${slug}`),
  ...record.signals.landingViews.map((path) => `landing:${path}`),
  ...record.signals.caseViews.map((path) => `case:${path}`),
];
const readFit = (record: CrmLeadRecord): string[] =>
  record.productFits.filter((fit) => fit.fit > 0).map((fit) => `fit:${fit.slug}=${fit.fit}`);
const readDepth = (s: LeadSignals): string[] => (s.depth > 0 ? [`surface_depth:${s.depth}`] : []);

// ---------------------------------------------------------------------------
// Fase 10 — proposal readiness (explicit thresholds)
// ---------------------------------------------------------------------------

export interface ProposalReadiness {
  ready: boolean;
  /** Individual gates and whether each passed. */
  gates: Array<{ id: string; passed: boolean; value: string }>;
  failed: string[];
}

export const PROPOSAL_GATES = {
  score: 45,
  intent: 70,
  fit: 40,
  surfaces: 2,
} as const;

/**
 * A proposal is ready when the lead has commercial intent (meeting or
 * advanced assessment), a product fit, some depth and a composite score.
 * No automatic proposal is ever produced — this is a readiness verdict.
 */
export const getProposalReadiness = (record: CrmLeadRecord): ProposalReadiness => {
  const bestFit = record.productFits[0]?.fit ?? 0;
  const gates = [
    { id: 'meeting_or_advanced_assessment', passed: record.signals.booked || record.signals.assessmentTier === 'avancado', value: record.signals.booked ? 'reunião agendada' : `tier ${record.signals.assessmentTier ?? 'nenhum'}` },
    { id: 'score', passed: record.score.score >= PROPOSAL_GATES.score, value: String(record.score.score) },
    { id: 'intent', passed: record.score.intent >= PROPOSAL_GATES.intent, value: String(record.score.intent) },
    { id: 'product_fit', passed: bestFit >= PROPOSAL_GATES.fit, value: String(bestFit) },
    { id: 'surface_depth', passed: record.signals.depth >= PROPOSAL_GATES.surfaces, value: String(record.signals.depth) },
  ];
  const failed = gates.filter((gate) => !gate.passed).map((gate) => gate.id);
  return { ready: failed.length === 0, gates, failed };
};

// ---------------------------------------------------------------------------
// Fase 8 — hot lead engine (explicit points, no ML)
// ---------------------------------------------------------------------------

export interface HotLeadScore {
  leadId: string;
  points: number;
  reasons: string[];
}

export interface HotCriterion {
  id: string;
  points: number;
  test: (record: CrmLeadRecord) => boolean;
  reason: string;
}

/** Fase 8 criteria: booking, assessment, product interest and CRM score. */
export const HOT_CRITERIA: HotCriterion[] = [
  { id: 'booking', points: 40, test: (r) => r.signals.booked, reason: 'Reunião agendada' },
  { id: 'advanced_assessment', points: 25, test: (r) => r.signals.assessmentTier === 'avancado', reason: 'Assessment avançado' },
  { id: 'assessment', points: 15, test: (r) => Boolean(r.signals.assessmentId), reason: 'Assessment concluído' },
  { id: 'contact', points: 10, test: (r) => r.signals.contacted, reason: 'Contacto directo' },
  { id: 'product_interest', points: 10, test: (r) => r.signals.productInterest.length > 0, reason: 'Interesse em produto' },
  { id: 'crm_score', points: 20, test: (r) => r.score.score >= 50, reason: 'Score CRM ≥ 50' },
];

/** Points-based hotness. No learning, no weighting beyond these constants. */
export const getHotLeadScore = (record: CrmLeadRecord): HotLeadScore => {
  const reasons: string[] = [];
  let points = 0;
  for (const criterion of HOT_CRITERIA) {
    if (criterion.test(record)) {
      points += criterion.points;
      reasons.push(criterion.reason);
    }
  }
  return { leadId: record.leadId, points, reasons };
};

// ---------------------------------------------------------------------------
// Fase 9 — nurture engine
// ---------------------------------------------------------------------------

/**
 * A nurture candidate showed interest but not enough intent to justify
 * commercial time: no meeting, no advanced assessment, below the intent
 * threshold. Recommendation only — the engine sends nothing.
 */
export const isNurtureCandidate = (record: CrmLeadRecord): boolean =>
  !record.signals.booked &&
  record.signals.assessmentTier !== 'avancado' &&
  record.score.intent < PROPOSAL_GATES.intent &&
  (record.signals.productInterest.length > 0 || record.signals.depth > 0 || record.signals.leadCaptured);

// ---------------------------------------------------------------------------
// Fase 2 + 3 — the action engine
// ---------------------------------------------------------------------------

export interface ActionRule {
  id: string;
  action: SalesAction;
  /** Reads the signals it uses, so the audit trail is generated, not written. */
  test: (record: CrmLeadRecord) => boolean;
  read: (record: CrmLeadRecord) => string[];
  reason: string;
  benefit: string;
  risk: string;
}

/**
 * Ordered rules, first match wins (Fase 2). The brief's canonical mapping —
 * HOT → BOOK_CALL, WARM → NURTURE, QUALIFIED → SEND_PROPOSAL, NO_SIGNAL →
 * WAIT — is expressed here, with proposal readiness taking precedence
 * because a booked meeting always outranks the generic tier.
 */
export const ACTION_RULES: ActionRule[] = [
  {
    id: 'proposal_booked',
    action: 'SEND_PROPOSAL',
    test: (record) => record.signals.booked && record.opportunity === 'OPPORTUNITY',
    read: (record) => [...readBooking(record.signals), ...readFit(record), ...readAssessment(record.signals)],
    reason: 'Reunião realizada com oportunidade validada — a conversa já aconteceu, falta a oferta.',
    benefit: 'O lead já investiu tempo; a proposta fecha o que a reunião abriu.',
    risk: 'Ignorar um lead que agendou desperdiça o maior sinal de intenção existente.',
  },
  {
    id: 'proposal_ready',
    action: 'SEND_PROPOSAL',
    test: (record) => getProposalReadiness(record).ready,
    read: (record) => [...readFit(record), ...readAssessment(record.signals), ...readDepth(record.signals), ...readBooking(record.signals), ...readContact(record.signals)],
    reason: 'Score, intenção, fit e profundidade passam nos thresholds de proposta.',
    benefit: 'Todos os gates comerciais estão satisfeitos — proposta é o próximo passo natural.',
    risk: 'Um lead pronto para proposta perde-se se a oferta não for preparada a tempo.',
  },
  {
    id: 'book_call_hot',
    action: 'BOOK_CALL',
    test: (record) => record.qualification === 'HOT',
    read: (record) => [...readBooking(record.signals), ...readAssessment(record.signals), ...readInterest(record)],
    reason: 'Lead HOT: intenção comprovada e reunião ainda não agendada.',
    benefit: 'Converte intenção em conversa enquanto o sinal está quente.',
    risk: 'Intenção quente arrefece — leads HOT sem contacto caem para nurture.',
  },
  {
    id: 'wait_no_signal',
    action: 'WAIT',
    test: (record) => record.opportunity === 'NO_SIGNAL',
    read: (record) => [...readDepth(record.signals)],
    reason: 'Sem captura, sem intenção e sem produto — não há base para contacto comercial.',
    benefit: 'Protege o tempo comercial para leads com sinal real.',
    risk: 'Nenhum: um lead sem sinal não perde valor por não ser contactado.',
  },
  {
    id: 'nurture_warm',
    action: 'NURTURE',
    test: (record) => record.qualification === 'WARM',
    read: (record) => [...readInterest(record), ...readAssessment(record.signals)],
    reason: 'Lead WARM: interesse real, intenção ainda insuficiente para uma reunião.',
    benefit: 'Mantém o lead perto e converte quando o sinal subir.',
    risk: 'Sem nutrição o interesse decai e o lead sai do funil.',
  },
  {
    id: 'nurture_interest',
    action: 'NURTURE',
    test: () => true,
    read: (record) => [...readInterest(record), ...readDepth(record.signals)],
    reason: 'Há interesse mas nenhum sinal comercial suficiente.',
    benefit: 'Baixo custo, mantém a marca presente.',
    risk: 'Baixo — o lead ainda não demonstrou intenção de compra.',
  },
];

const buildRecommendation = (record: CrmLeadRecord, rule: ActionRule): SalesRecommendation => ({
  leadId: record.leadId,
  action: rule.action,
  rule: rule.id,
  reason: rule.reason,
  signalsUsed: rule.read(record),
  score: record.score.score,
  benefit: rule.benefit,
  risk: rule.risk,
  playbook: rule.action,
});

/** Fase 15 — next best action for a single lead, fully explained. */
export const getNextBestAction = (record: CrmLeadRecord): SalesRecommendation => {
  const rule = ACTION_RULES.find((candidate) => candidate.test(record));
  if (!rule) {
    const fallback = ACTION_RULES[ACTION_RULES.length - 1];
    return buildRecommendation(record, fallback);
  }
  return buildRecommendation(record, rule);
};

/** The whole book of recommendations, in input order. */
export const buildSalesRecommendations = (records: CrmLeadRecord[]): SalesRecommendation[] =>
  records.map(getNextBestAction);

/** Explainability guard (Fase 14): a recommendation without its trail is a bug. */
export const validateRecommendation = (recommendation: SalesRecommendation): string[] => {
  const problems: string[] = [];
  if (!recommendation.rule) problems.push('missing rule');
  if (!recommendation.reason) problems.push('missing reason');
  if (!recommendation.benefit) problems.push('missing benefit');
  if (!recommendation.risk) problems.push('missing risk');
  if (!Array.isArray(recommendation.signalsUsed)) problems.push('signalsUsed must be a list');
  if (!(SALES_PLAYBOOKS[recommendation.action])) problems.push(`no playbook for ${recommendation.action}`);
  if (recommendation.playbook !== recommendation.action) problems.push('playbook/action mismatch');
  if (recommendation.score < 0 || recommendation.score > 100) problems.push('score out of range');
  return problems;
};
