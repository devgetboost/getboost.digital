import type { FunnelInputEvent } from './funnel-intelligence';
import { LANDINGS } from '../data/landings';
import { PILLARS, type PillarId } from '@/components/pillars/pillarData';
import { PRODUCTS } from '../data/products';
import type { LeadSignals } from '../data/crm-contract';

/**
 * R20.9 — Lead Signal Engine (Fase 2).
 *
 * Unifies the R20.x signals into one record per lead unit. A "lead unit" is
 * a conversion event that carries a recorded journey (`data.journey` —
 * visited paths only, per R20.1). That is the ONLY population a CRM
 * qualification may score: people who left no contact and no journey cannot
 * be qualified, and inventing an identity to do so would violate the
 * zero-PII rule.
 *
 * Lead identity is a deterministic hash of the path signature. Same journey
 * → same id; no cookies, no fingerprinting, no identity.
 */

const PILLAR_ROUTES = new Set((Object.keys(PILLARS) as PillarId[]).map((p) => PILLARS[p].route));
const LANDING_PATHS = new Set(LANDINGS.map((landing) => `/${landing.slug}`));
const PRODUCT_PATHS = new Map<string, string>();
for (const product of PRODUCTS) {
  if (!product.to) continue;
  for (const prefix of ['', '/br', '/en', '/es']) PRODUCT_PATHS.set(`${prefix}${product.to}`, product.slug);
}

const CASE_PATH = /^\/portfolio\/([^/?#]+)\/?$/;

/** Stable, dependency-free 32-bit hash rendered as base36 (paths only). */
export const hashJourney = (journey: string[]): string => {
  const signature = journey.join('>');
  let hash = 2166136261;
  for (let i = 0; i < signature.length; i += 1) {
    hash ^= signature.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
};

export const leadIdFor = (journey: string[]): string => `lead_${hashJourney(journey)}`;

const emptySignals = (): LeadSignals => ({
  landingViews: [],
  caseViews: [],
  pillarViews: [],
  productViews: [],
  productInterest: [],
  assessmentId: null,
  assessmentScore: null,
  assessmentTier: null,
  leadCaptured: false,
  booked: false,
  contacted: false,
  depth: 0,
});

const pushUnique = (list: string[], value: string) => {
  if (!list.includes(value)) list.push(value);
};

/** True when the event represents a captured lead (the scoreable population). */
export const isLeadEvent = (event: FunnelInputEvent): boolean => {
  if (!Array.isArray(event.data?.['journey'])) return false;
  if (event.name === 'generate_lead' || event.name === 'schedule_appointment') return true;
  if (event.name === 'whatsapp_click') return true;
  if (event.name === 'form_submission') return true;
  const label = typeof event.label === 'string' ? event.label : '';
  return label.endsWith('_lead_capture') || event.name === 'assessment_lead_capture';
};

const addPathSignals = (signals: LeadSignals, path: string) => {
  if (LANDING_PATHS.has(path)) pushUnique(signals.landingViews, path);
  if (PILLAR_ROUTES.has(path)) pushUnique(signals.pillarViews, path);
  const caseMatch = path.match(CASE_PATH);
  if (caseMatch) pushUnique(signals.caseViews, path);
  const product = PRODUCT_PATHS.get(path);
  if (product) {
    pushUnique(signals.productViews, path);
    pushUnique(signals.productInterest, product);
  }
};

const asNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

/** Builds the signal record for one journey + its conversion event. */
export const buildLeadSignals = (event: FunnelInputEvent): LeadSignals => {
  const signals = emptySignals();
  const journey = (event.data?.['journey'] as string[]).filter((s) => typeof s === 'string');

  // Explicitly stamped interest is recorded FIRST so it outranks products
  // merely mentioned on a visited landing when fits tie (Fase 9).
  const stamped = event.data?.['product'];
  if (typeof stamped === 'string' && stamped.length > 0) pushUnique(signals.productInterest, stamped);

  for (const path of journey) addPathSignals(signals, path);

  const assessment = event.data?.['assessment'];
  if (typeof assessment === 'string' && assessment.length > 0) signals.assessmentId = assessment;
  signals.assessmentScore = asNumber(event.data?.['score']);
  const tier = event.data?.['tier'];
  if (typeof tier === 'string' && tier.length > 0) signals.assessmentTier = tier;

  const label = typeof event.label === 'string' ? event.label : '';
  signals.leadCaptured =
    event.name === 'generate_lead' ||
    event.name === 'assessment_lead_capture' ||
    label.endsWith('_lead_capture');
  signals.booked = event.name === 'schedule_appointment' || event.category === 'booking';
  signals.contacted =
    event.name === 'whatsapp_click' ||
    event.category === 'contact' ||
    (event.name === 'form_submission' && String(event.category).startsWith('contact'));

  const distinct = new Set<string>([
    ...signals.landingViews,
    ...signals.caseViews,
    ...signals.pillarViews,
    ...signals.productViews,
  ]);
  signals.depth = distinct.size;
  return signals;
};

export interface LeadUnit {
  leadId: string;
  source: string;
  journey: string[];
  signals: LeadSignals;
  /** The conversion event that produced this lead unit. */
  event: FunnelInputEvent;
}

/**
 * Collapses the event stream into lead units. Multiple conversions in the
 * same journey collapse into one unit and merge their signals, so a lead who
 * books after capturing an assessment is a single lead, not two.
 */
export const getLeadUnits = (events: FunnelInputEvent[]): LeadUnit[] => {
  const units = new Map<string, LeadUnit>();
  for (const event of events) {
    if (!isLeadEvent(event)) continue;
    const journey = (event.data?.['journey'] as string[]).filter((s) => typeof s === 'string');
    const leadId = leadIdFor(journey);
    const existing = units.get(leadId);
    if (!existing) {
      units.set(leadId, {
        leadId,
        source: String(event.category ?? event.name ?? 'unknown'),
        journey,
        signals: buildLeadSignals(event),
        event,
      });
      continue;
    }
    // Merge the later conversion into the existing unit.
    const merged = buildLeadSignals(event);
    const signals = existing.signals;
    for (const key of ['landingViews', 'caseViews', 'pillarViews', 'productViews', 'productInterest'] as const) {
      for (const value of merged[key]) pushUnique(signals[key], value);
    }
    signals.assessmentId = signals.assessmentId ?? merged.assessmentId;
    signals.assessmentScore = signals.assessmentScore ?? merged.assessmentScore;
    signals.assessmentTier = signals.assessmentTier ?? merged.assessmentTier;
    signals.leadCaptured = signals.leadCaptured || merged.leadCaptured;
    signals.booked = signals.booked || merged.booked;
    signals.contacted = signals.contacted || merged.contacted;
    signals.depth = new Set([
      ...signals.landingViews,
      ...signals.caseViews,
      ...signals.pillarViews,
      ...signals.productViews,
    ]).size;
  }
  return [...units.values()].sort((a, b) => (a.leadId < b.leadId ? -1 : a.leadId > b.leadId ? 1 : 0));
};
