/**
 * Getboost 2027 — R19.8 · Official product catalog (Single Source of Truth).
 *
 * SAAS (6): Qook, Motivae, Alojify, Pikto, Trackfy, Safely.
 * PLATFORMS (2): Descobre Quem Tu És, Guia Cities.
 *
 * A catalog entry links (`to`) ONLY when a real landing route exists.
 * Entries without `to` are institutional-only: every consumer renders them
 * as non-clickable representation (span), never as a link — the release
 * gate fails CI on any dead product link.
 *
 * Documented exceptions (live surfaces bound to real landing pages and
 * intentionally NOT migrated here): the /hostify and /prosafe360 routes
 * and their landing components stay served and indexed but are delisted
 * from every navigation surface; DemoRequest's local product map,
 * investorProjects and the sitemap demo block keep their slugs because
 * they address those same live routes. A full landing-content rebrand
 * (copy inside HostifyLanding/Prosafe360Landing) is a brand-owner
 * content task, not a code migration.
 */

export type ProductKind = 'saas' | 'platform';

export interface HubProduct {
  slug: string;
  name: string;
  kind: ProductKind;
  /** Canonical landing route. ABSENT when no page exists (institutional-only). */
  to?: string;
  /**
   * Brand accent for the card (visual assignment, not a product fact).
   * R19 execution — must be a frozen token reference, never a raw hex:
   * the pillar hue the product's own landing ships, or ink for
   * institutional (route-less) entries.
   */
  accent: string;
  /** One-line positioning. Present only when supported by product copy. */
  tagline?: string;
  /** Short supporting copy. Present only when supported by product copy. */
  description?: string;
  /** Category label. Present only when supported by product copy. */
  category?: string;
  /** Lifecycle status. Present only when supported by the project. */
  status?: string;
}

export const PRODUCTS: HubProduct[] = [
  {
    slug: 'qook',
    name: 'Qook',
    kind: 'saas',
    to: '/qook',
    accent: 'var(--gb-automation-base)',
    tagline: 'O sistema all-in-one para restauração moderna',
    description:
      'POS, self-order, KDS, pagamentos e menu digital — tudo numa plataforma pensada para restaurantes que querem servir mais em menos tempo.',
    category: 'Business Management',
    status: 'Em Produção',
  },
  {
    slug: 'motivae',
    name: 'Motivae',
    kind: 'saas',
    to: '/motivae',
    accent: 'var(--gb-ai-base)',
    tagline: 'Plataforma de benefícios e engagement de equipas',
    description:
      'Motiva, reconhece e retém talento com uma plataforma pensada para RH modernos.',
    category: 'Productivity',
    status: 'Em Produção',
  },
  {
    slug: 'alojify',
    name: 'Alojify',
    kind: 'saas',
    accent: 'var(--gb-ink-primary)',
  },
  {
    slug: 'pikto',
    name: 'Pikto',
    kind: 'saas',
    to: '/pikto',
    accent: 'var(--gb-software-base)',
    tagline: 'Criatividade visual assistida por IA',
    description:
      'Gera imagens, mockups e conteúdos visuais consistentes com a tua marca em minutos, não em dias.',
    category: 'SaaS',
    status: 'Em Produção',
  },
  {
    slug: 'trackfy',
    name: 'Trackfy',
    kind: 'saas',
    to: '/trackfy',
    accent: 'var(--gb-automation-base)',
    tagline: 'Rastreamento e operações em tempo real',
    description:
      'Acompanha frota, equipas e activos com dashboards claros e alertas accionáveis.',
    category: 'Operations',
    status: 'Em Produção',
  },
  {
    slug: 'safely',
    name: 'Safely',
    kind: 'saas',
    accent: 'var(--gb-ink-primary)',
  },
  {
    slug: 'descobre-quem-tu-es',
    name: 'Descobre Quem Tu És',
    kind: 'platform',
    accent: 'var(--gb-ai-base)',
  },
  {
    slug: 'guia-cities',
    name: 'Guia Cities',
    kind: 'platform',
    accent: 'var(--gb-automation-base)',
  },
];

/** Routable catalog entries (have a landing page). */
export const ROUTABLE_PRODUCTS = PRODUCTS.filter((p) => p.to !== undefined);

/** SaaS products (the "produtos próprios" trust count). */
export const SAAS_PRODUCTS = PRODUCTS.filter((p) => p.kind === 'saas');

/** Institutional platforms (representation only, no link). */
export const PLATFORM_PRODUCTS = PRODUCTS.filter((p) => p.kind === 'platform');
