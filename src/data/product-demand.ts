import { PRODUCTS, type HubProduct } from './products';
import { LANDINGS } from './landings';
import { PILLARS, type PillarId } from '@/components/pillars/pillarData';

/**
 * R20.8 — Product Demand Generation · data layer (Fases 1, 5, 6, 10, 11, 14).
 *
 * Everything here is DERIVED from existing registries (catalog, pillars,
 * landing network, R20.4 engines). No product, claim, metric or route is
 * invented: a product without a landing route stays institutional, and a
 * dossier field without a source stays `null` (reported as a content gap).
 */

// ---------------------------------------------------------------------------
// Fase 1 — official demand framework
// ---------------------------------------------------------------------------

/** Produto → View → Interest → Assessment → Lead → Booking → Meeting. */
export const PRODUCT_DEMAND_STAGES = [
  'view',
  'interest',
  'assessment',
  'lead',
  'booking',
  'meeting',
] as const;

export type ProductDemandStage = (typeof PRODUCT_DEMAND_STAGES)[number];

/**
 * Fase 7 — official product taxonomy. These are the `product_*` event names
 * the brief specifies; the wire format keeps the R20.1 `product_interaction`
 * event (never renamed) and carries the suffix as `data.action`, matching the
 * established `category_action_location` convention.
 */
export const PRODUCT_TAXONOMY = {
  view: 'product_view',
  click: 'product_click',
  interest: 'product_interest',
  assessment: 'product_assessment',
  waitlist: 'product_waitlist',
  lead: 'product_lead',
  booking: 'product_booking',
} as const;

export type ProductAction = keyof typeof PRODUCT_TAXONOMY;

/** Which demand stage each taxonomy action feeds (pure mapping). */
export const ACTION_STAGE: Record<ProductAction, ProductDemandStage | null> = {
  view: 'view',
  click: null,
  interest: 'interest',
  assessment: 'assessment',
  waitlist: 'interest',
  lead: 'lead',
  booking: 'booking',
};

// ---------------------------------------------------------------------------
// Fase 5 — product landing audit
// ---------------------------------------------------------------------------

export type LandingAudit = 'LANDING_EXISTS' | 'LANDING_PARTIAL' | 'LANDING_MISSING';

export interface ProductLandingAudit {
  slug: string;
  name: string;
  kind: HubProduct['kind'];
  landing: LandingAudit;
  /** Real route, or null when the product is institutional-only. */
  route: string | null;
  /** page_view paths that count as demand views for this product. */
  viewPaths: string[];
  /** Case narratives pointing at this product (R20.7 CasosSucesso). */
  caseSlugs: string[];
}

const MARKET_PREFIXES = ['', '/br', '/en', '/es'];

export const productViewPaths = (product: HubProduct): string[] =>
  product.to ? MARKET_PREFIXES.map((prefix) => `${prefix}${product.to}`) : [];

/**
 * Classification is derived, never declared:
 *  - LANDING_EXISTS   — catalog `to` resolves to a real route
 *  - LANDING_PARTIAL  — routable product without full demand instrumentation
 *  - LANDING_MISSING  — institutional-only (no landing page by design)
 */
export const getProductLandingAudit = (
  resolvableRoutes: string[],
  caseNarratives: { slug: string; to?: string }[] = [],
): ProductLandingAudit[] => {
  const routes = new Set(resolvableRoutes);
  return PRODUCTS.map((product) => {
    const route = product.to && routes.has(product.to) ? product.to : null;
    const caseSlugs = caseNarratives
      .filter((entry) => entry.to && entry.to.replace(/^\//, '') === product.slug)
      .map((entry) => entry.slug);
    return {
      slug: product.slug,
      name: product.name,
      kind: product.kind,
      landing: route ? 'LANDING_EXISTS' : 'LANDING_MISSING',
      route,
      viewPaths: route ? productViewPaths(product) : [],
      caseSlugs,
    };
  });
};

// ---------------------------------------------------------------------------
// Fase 6 — waitlist engine
// ---------------------------------------------------------------------------

export interface WaitlistProduct {
  slug: string;
  name: string;
  kind: HubProduct['kind'];
  /** Why the product is waitlist-eligible (derived, never assumed). */
  reason: 'NO_LANDING' | 'NO_ASSESSMENT';
  accent: string;
}

/**
 * Waitlist eligibility follows the Fase 6 rule: a product without a landing
 * page captures interest as a waitlist instead of a fake page. Products that
 * already have a landing page are NOT waitlist candidates.
 */
export const getWaitlistProducts = (): WaitlistProduct[] =>
  PRODUCTS.filter((product) => !product.to).map((product) => ({
    slug: product.slug,
    name: product.name,
    kind: product.kind,
    reason: 'NO_LANDING' as const,
    accent: product.accent,
  }));

// ---------------------------------------------------------------------------
// Fase 10 — product → assessment mapping
// ---------------------------------------------------------------------------

/**
 * The brief asks for six product-specific instruments (Restaurant Readiness,
 * Personal Growth Assessment, …). Those do not exist in the R20.4 engine, and
 * authoring six new assessments is content creation, not demand generation —
 * so each product maps to the CLOSEST REAL engine instead. The mapping is a
 * single editable record: when brand-authored product instruments land, only
 * `assessmentId` changes here.
 */
export const PRODUCT_ASSESSMENT: Record<string, { assessmentId: string; rationale: string }> = {
  qook: {
    assessmentId: 'operations-score',
    rationale: 'Operação de restaurante (POS, mesas, pedidos) é o Tema central do Operations Score.',
  },
  motivae: {
    assessmentId: 'growth-score',
    rationale: 'Retenção de talento é crescimento de equipa; Growth Score mede a maturidade de aquisição/retenção.',
  },
  alojify: {
    assessmentId: 'operations-score',
    rationale: 'Gestão de alojamento é operação (disponibilidade, limpeza, ocupação).',
  },
  pikto: {
    assessmentId: 'software-readiness',
    rationale: 'Pikto é um produto SaaS de criação; Software Readiness mede a maturidade para o adotar.',
  },
  trackfy: {
    assessmentId: 'automation-audit',
    rationale: 'Rastreamento de frota é integração de dados e automação de operações.',
  },
  safely: {
    assessmentId: 'operations-score',
    rationale: 'Segurança operacional e compliance apoiam-se em processos e operação.',
  },
  'descobre-quem-tu-es': {
    assessmentId: 'operations-score',
    rationale: 'Plataforma institucional — mede a maturidade operacional de quem a procura.',
  },
  'guia-cities': {
    assessmentId: 'growth-score',
    rationale: 'Guia de cidades é um canal de growth (aquisição e conversão de tráfego).',
  },
};

export const assessmentForProduct = (slug: string): string | null =>
  PRODUCT_ASSESSMENT[slug]?.assessmentId ?? null;

// ---------------------------------------------------------------------------
// Fase 11 — positioning dossiers
// ---------------------------------------------------------------------------

export interface ProductDossier {
  slug: string;
  name: string;
  /** Ideal customer profile. Only from the catalog `category`. */
  icp: string | null;
  /** Market context. Only from the catalog `category`. */
  market: string | null;
  /** Value proposition. From the catalog `tagline` — never authored here. */
  value: string | null;
  /** Supporting problem copy. From the catalog `description`. */
  problem: string | null;
  /** Lifecycle state. From the catalog `status`. */
  state: string | null;
  /** Primary channel — derived from what exists (landing / waitlist / case). */
  channel: 'landing' | 'case' | 'waitlist';
  /** Fields the catalog cannot answer yet (content gap, not invention). */
  missingFields: string[];
}

/**
 * Dossier fields come exclusively from the catalog record. A product whose
 * entry only carries slug/name/accent reports the missing fields instead of
 * receiving invented positioning.
 */
export const buildProductDossier = (audit: ProductLandingAudit): ProductDossier => {
  const product = PRODUCTS.find((p) => p.slug === audit.slug) as HubProduct;
  const missingFields: string[] = [];
  if (!product.category) missingFields.push('icp', 'market');
  if (!product.tagline) missingFields.push('value');
  if (!product.description) missingFields.push('problem');
  if (!product.status) missingFields.push('state');
  const channel: ProductDossier['channel'] = audit.route
    ? audit.landing === 'LANDING_EXISTS'
      ? 'landing'
      : 'waitlist'
    : audit.caseSlugs.length > 0
      ? 'case'
      : 'waitlist';
  return {
    slug: product.slug,
    name: product.name,
    icp: product.category ?? null,
    market: product.category ?? null,
    value: product.tagline ?? null,
    problem: product.description ?? null,
    state: product.status ?? null,
    channel,
    missingFields,
  };
};

export const getProductDossiers = (
  audits: ProductLandingAudit[],
): ProductDossier[] => audits.map(buildProductDossier);

// ---------------------------------------------------------------------------
// Fase 14 — product network
// ---------------------------------------------------------------------------

export interface ProductNetworkNode {
  slug: string;
  name: string;
  route: string | null;
  pillars: PillarId[];
  cases: string[];
  landings: string[];
  assessment: string | null;
}

/** Product → Case → Pilar → Landing → Assessment (all derived). */
export const getProductNetwork = (caseNarratives: { slug: string; to?: string }[]): ProductNetworkNode[] =>
  PRODUCTS.map((product) => {
    const pillars = (Object.keys(PILLARS) as PillarId[]).filter((pillar) =>
      PILLARS[pillar].products.includes(product.slug),
    );
    const cases = caseNarratives
      .filter((entry) => entry.to && entry.to.replace(/^\//, '') === product.slug)
      .map((entry) => entry.slug);
    const landings = LANDINGS.filter((landing) => landing.products.includes(product.slug)).map(
      (landing) => landing.slug,
    );
    return {
      slug: product.slug,
      name: product.name,
      route: product.to ?? null,
      pillars,
      cases,
      landings,
      assessment: assessmentForProduct(product.slug),
    };
  });

/** Products referenced by each pillar (reverse view of the network). */
export const getPillarProductNetwork = (): Record<PillarId, string[]> => {
  const out = {} as Record<PillarId, string[]>;
  for (const pillar of Object.keys(PILLARS) as PillarId[]) {
    out[pillar] = [...PILLARS[pillar].products];
  }
  return out;
};
