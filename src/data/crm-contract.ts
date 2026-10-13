/**
 * R20.9 — CRM Data Contract (Fases 1, 11).
 *
 * Canonical, CRM-agnostic shape for lead → qualified lead → opportunity →
 * proposal → customer. No external CRM is integrated: this contract is what
 * a future integration must satisfy. Every field is either a pseudonymous
 * identifier derived from visited paths, or an aggregate — never contact
 * data, never a free-text message, never anything from a form body.
 */

// ---------------------------------------------------------------------------
// Fase 1 — official CRM model
// ---------------------------------------------------------------------------

/** Lead → Qualified Lead → Opportunity → Proposal → Customer. */
export const CRM_STAGES = ['LEAD', 'QUALIFIED', 'OPPORTUNITY', 'PROPOSAL', 'CUSTOMER'] as const;

export type CrmStage = (typeof CRM_STAGES)[number];

/** Stage each qualification tier can enter (documented transition map). */
export const STAGE_BY_TIER: Record<QualificationTier, CrmStage> = {
  HOT: 'OPPORTUNITY',
  WARM: 'QUALIFIED',
  COLD: 'LEAD',
  NURTURE: 'LEAD',
};

export const STAGE_ORDER: Record<CrmStage, number> = {
  LEAD: 0,
  QUALIFIED: 1,
  OPPORTUNITY: 2,
  PROPOSAL: 3,
  CUSTOMER: 4,
};

// ---------------------------------------------------------------------------
// Fase 4 / 10 — states
// ---------------------------------------------------------------------------

export type QualificationTier = 'HOT' | 'WARM' | 'COLD' | 'NURTURE';

export const QUALIFICATION_TIERS: QualificationTier[] = ['HOT', 'WARM', 'COLD', 'NURTURE'];

export type OpportunityClass = 'NO_SIGNAL' | 'EARLY' | 'PROMISING' | 'QUALIFIED' | 'OPPORTUNITY';

export const OPPORTUNITY_CLASSES: OpportunityClass[] = [
  'NO_SIGNAL',
  'EARLY',
  'PROMISING',
  'QUALIFIED',
  'OPPORTUNITY',
];

/** Fase 15 — recommended next action. A recommendation, never an action. */
export type FollowUpAction = 'BOOK_CALL' | 'SEND_PROPOSAL' | 'NURTURE' | 'WAIT';

export const FOLLOW_UP_ACTIONS: FollowUpAction[] = ['BOOK_CALL', 'SEND_PROPOSAL', 'NURTURE', 'WAIT'];

// ---------------------------------------------------------------------------
// Fase 11 — canonical record
// ---------------------------------------------------------------------------

export interface LeadSignals {
  /** Landing-network paths visited (R20.6 satellite + pillar landings). */
  landingViews: string[];
  /** Case detail paths visited (R20.7). */
  caseViews: string[];
  /** Pillar routes visited. */
  pillarViews: string[];
  /** Product landing routes visited. */
  productViews: string[];
  /** Product slugs this lead interacted with (view or stamped interest). */
  productInterest: string[];
  /** Assessment engine that captured the lead, when it came from one. */
  assessmentId: string | null;
  /** Assessment percentage 0–100 as reported by the R20.4 engine. */
  assessmentScore: number | null;
  /** R20.4 tier (basico | intermedio | avancado). */
  assessmentTier: string | null;
  /** Lead capture happened. */
  leadCaptured: boolean;
  /** Booking / appointment happened. */
  booked: boolean;
  /** Contact or WhatsApp conversion happened. */
  contacted: boolean;
  /** Distinct surfaces touched. */
  depth: number;
}

export interface LeadScoreBreakdown {
  leadId: string;
  /** Five normalized 0–100 components (Fase 3). */
  interest: number;
  intent: number;
  engagement: number;
  product: number;
  demand: number;
  /** Weighted composite 0–100. */
  score: number;
  weights: LeadScoreWeights;
}

export interface LeadScoreWeights {
  interest: number;
  intent: number;
  engagement: number;
  product: number;
  demand: number;
}

export interface ProductFit {
  slug: string;
  name: string;
  /** Fit strength 0–100 from explicit rules (no ML). */
  fit: number;
  /** Every rule that fired, in order — the audit trail. */
  reasons: string[];
}

export interface CrmLeadRecord {
  /**
   * Pseudonymous, deterministic id derived from the visited-path signature
   * (`lead_<hash>`). Same journey → same id; no identity, no PII.
   */
  leadId: string;
  /** Conversion surface that produced the lead (booking, contact, …). */
  source: string;
  /** Best-fit product slug, or null when no product signal exists. */
  product: string | null;
  qualification: QualificationTier;
  opportunity: OpportunityClass;
  stage: CrmStage;
  score: LeadScoreBreakdown;
  productFits: ProductFit[];
  signals: LeadSignals;
  recommendedAction: FollowUpAction;
  /** Full visited-path chain (paths only, never query strings or PII). */
  journey: string[];
}

/**
 * Fase 16 quality gate — the contract rejects anything that looks like
 * personal data or an opaque score. Used by CI and by any future exporter.
 */
const FORBIDDEN_KEYS = [
  'email', 'e-mail', 'emailaddress', 'phone', 'tel', 'telephone',
  'contact', 'message', 'cpf', 'nif', 'address', 'birthday', 'firstname', 'lastname',
];

/** Canonical top-level shape of a CRM lead record (Fase 11). */
export const CRM_RECORD_KEYS = [
  'leadId',
  'source',
  'product',
  'qualification',
  'opportunity',
  'stage',
  'score',
  'productFits',
  'signals',
  'recommendedAction',
  'journey',
] as const;

export const validateCrmRecord = (record: CrmLeadRecord): string[] => {
  const problems: string[] = [];
  // Contract shape: only canonical fields, nothing smuggled in.
  for (const key of Object.keys(record)) {
    if ((CRM_RECORD_KEYS as readonly string[]).includes(key)) continue;
    problems.push(
      FORBIDDEN_KEYS.includes(key)
        ? `forbidden field in record: ${key}`
        : `non-contract field: ${key}`,
    );
  }
  for (const key of CRM_RECORD_KEYS) {
    if (!(key in record)) problems.push(`missing contract field: ${key}`);
  }
  if (!/^lead_[a-z0-9]+$/.test(record.leadId)) problems.push('leadId must be lead_<hash>');
  if (record.score.score < 0 || record.score.score > 100) problems.push('score out of 0–100');
  for (const field of ['interest', 'intent', 'engagement', 'product', 'demand'] as const) {
    const value = record.score[field];
    if (value < 0 || value > 100) problems.push(`${field} out of 0–100`);
  }
  if (Object.values(record.score.weights).reduce((a, b) => a + b, 0) < 0.999) {
    problems.push('weights must sum to 1');
  }
  if (!QUALIFICATION_TIERS.includes(record.qualification)) problems.push('unknown qualification tier');
  if (!OPPORTUNITY_CLASSES.includes(record.opportunity)) problems.push('unknown opportunity class');
  if (!FOLLOW_UP_ACTIONS.includes(record.recommendedAction)) problems.push('unknown follow-up action');
  if (!CRM_STAGES.includes(record.stage)) problems.push('unknown stage');
  if (record.stage !== STAGE_BY_TIER[record.qualification]) problems.push('stage/tier mismatch');
  for (const step of record.journey) {
    if (/[?#]/.test(step)) problems.push(`journey step carries a query string: ${step}`);
  }
  const serialized = JSON.stringify(record).toLowerCase();
  for (const key of FORBIDDEN_KEYS) {
    if (serialized.includes(`"${key}":`)) problems.push(`forbidden field in record: ${key}`);
  }
  // No hidden scoring: every score component must be reachable from signals.
  if (record.score.intent > 0 && !record.signals.assessmentId && !record.signals.booked) {
    problems.push('intent score without an assessment or booking signal');
  }
  return problems;
};
