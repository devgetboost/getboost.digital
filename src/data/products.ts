/**
 * Getboost 2027 — Wave 2A.5 · Products hub data.
 *
 * The six marketed products and their canonical landing routes. This list
 * feeds the /produtos hub (src/pages/Products.tsx) and its guards; the
 * product landing pages themselves are untouched.
 *
 * `to` must stay the canonical route of each landing — the nav "Produtos"
 * entry used to redirect /produtos to the first product (/qook); the hub
 * replaced that so every product has an equal entry point.
 */

export interface HubProduct {
  slug: string;
  name: string;
  /** One-line positioning, mirroring the header mega-menu. */
  tagline: string;
  /** Short supporting copy for the hub card. */
  description: string;
  /** Canonical landing route. Must exist in the route map. */
  to: string;
  /** Brand accent for the card. */
  accent: string;
}

export const PRODUCTS: HubProduct[] = [
  {
    slug: 'qook',
    name: 'Qook',
    tagline: 'O sistema all-in-one para restauração moderna',
    description:
      'POS, self-order, KDS, pagamentos e menu digital — tudo numa plataforma pensada para restaurantes que querem servir mais em menos tempo.',
    to: '/qook',
    accent: '#FF1C00',
  },
  {
    slug: 'hostify',
    name: 'Hostify PMS',
    tagline: 'Gestão inteligente para alojamento local',
    description:
      'Automatiza reservas, canais, check-ins, comunicação com hóspedes e limpeza. Uma plataforma que devolve horas ao dia de quem opera.',
    to: '/hostify',
    accent: '#03A63C',
  },
  {
    slug: 'motivae',
    name: 'Motivae',
    tagline: 'Plataforma de benefícios e engagement de equipas',
    description:
      'Motiva, reconhece e retém talento com uma plataforma pensada para RH modernos.',
    to: '/motivae',
    accent: '#F6137E',
  },
  {
    slug: 'pikto',
    name: 'Pikto',
    tagline: 'Criatividade visual assistida por IA',
    description:
      'Gera imagens, mockups e conteúdos visuais consistentes com a tua marca em minutos, não em dias.',
    to: '/pikto',
    accent: '#056CF2',
  },
  {
    slug: 'trackfy',
    name: 'Trackfy',
    tagline: 'Rastreamento e operações em tempo real',
    description:
      'Acompanha frota, equipas e ativos com dashboards claros e alertas accionáveis.',
    to: '/trackfy',
    accent: '#003264',
  },
  {
    slug: 'prosafe360',
    name: 'ProSafe360',
    tagline: 'Segurança e compliance em obra, em tempo real',
    description:
      'Gestão integrada de segurança, formação e auditorias para empresas de construção que não podem falhar.',
    to: '/prosafe360',
    accent: '#4A99F9',
  },
];
