import type { PillarId } from '@/components/pillars/pillarData';

/**
 * R20.15 — Case Study Engine · single source of truth.
 *
 * The six narratives below are shipped content, moved verbatim from
 * `src/pages/CasosSucesso.tsx` (R20.7) — titles, bodies, tags and
 * destinations byte-identical. Only the classification around them is new:
 * every metric tag gets a proof category and every case gets its pillars,
 * so any page can mount relevant proof without inventing anything.
 */

export interface CaseStudy {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
  to?: string;
}

export const CASES: CaseStudy[] = [
  {
    eyebrow: 'Hospitality · SaaS PMS',
    title: 'Hostify — do produto ao pipeline',
    tags: ['+312% MQLs em 6 meses', 'Onboarding -40% tempo', 'CAC pago -28%', 'Landing modular'],
    body: 'Reposicionámos a Hostify de um PMS técnico para uma plataforma comercial. Nova narrativa, landing modular por persona (host, gestor de propriedades, cadeia), tracking end-to-end e sequências de nurturing. Em seis meses, o pipeline qualificado triplicou e o custo por lead pago caiu quase um terço.',
    to: '/hostify',
  },
  {
    eyebrow: 'Food & Beverage · POS',
    title: 'Qook — POS que se vende sozinho',
    tags: ['Roteiro de demo IA', 'Página multi-vertical', 'Time-to-demo -55%', 'Onboarding self-serve'],
    body: 'Desenhámos uma landing multi-vertical (restauração, take-away, food-trucks) com agendamento inteligente de demo e um agente de IA que qualifica em tempo real. O time-to-demo caiu para metade e o comercial passou a receber apenas leads com fit real.',
    to: '/qook',
  },
  {
    eyebrow: 'RH & Engagement',
    title: 'Motivae — plataforma que gera adesão',
    tags: ['+8x sessões orgânicas', 'Content engine mensal', 'SEO técnico completo', 'Casos por indústria'],
    body: 'Construímos a presença digital da Motivae de raiz: arquitectura de informação, SEO técnico, engine de conteúdo mensal e páginas de caso por indústria. A pesquisa orgânica passou a ser o principal canal de aquisição, com custo marginal por lead.',
    to: '/motivae',
  },
  {
    eyebrow: 'Segurança · SaaS B2B',
    title: 'ProSafe360 — narrativa que vende compliance',
    tags: ['ICP redefinido', 'Demo agendada em 2 clicks', 'Ciclo de venda -35%', 'Materiais comerciais'],
    body: 'Redefinimos o ICP, reescrevemos a proposta de valor e reconstruímos o funil de aquisição. Comerciais passaram a entrar em reuniões com leads já educados sobre normas ISO, DUER e obrigações legais — o ciclo de venda encurtou em mais de um terço.',
    to: '/prosafe360',
  },
  {
    eyebrow: 'Design & Print · SaaS',
    title: 'Pikto — do editor ao ecossistema',
    tags: ['Storytelling de produto', 'Roadmap comunicado', 'Comunidade activa', '+140% trials'],
    body: 'Ajudámos a Pikto a comunicar o salto de editor gráfico para ecossistema criativo. Storytelling de produto, roadmap público, comunidade em torno de casos reais e campanhas coordenadas de lançamento — mais do que dobrou o número de trials qualificados.',
    to: '/pikto',
  },
  {
    eyebrow: 'Logística & Frota',
    title: 'Trackfy — tecnologia acessível para PMEs',
    tags: ['Reposicionamento para PMEs', 'Calculadora de ROI', 'Nurturing por vertical', 'Time-to-value -50%'],
    body: 'Trazemos a Trackfy do universo enterprise para PMEs de transporte e distribuição. Nova mensagem, calculadora de ROI pública, sequências por vertical (frota ligeira, pesada, distribuição urbana) e onboarding assistido — reduzindo o time-to-value para metade.',
    to: '/trackfy',
  },
];

export type ProofCategory =
  | 'BUSINESS RESULTS'
  | 'OPERATIONAL RESULTS'
  | 'ENGINEERING RESULTS'
  | 'AUTOMATION RESULTS'
  | 'ADOPTION RESULTS'
  | 'PROCESS RESULTS'
  | 'TIME SAVINGS'
  | 'RISK REDUCTION';

export interface CaseMetric {
  label: string;
  category: ProofCategory;
}

/** Metric classification per case slug — labels reuse the shipped tags. */
export const CASE_METRICS: Record<string, CaseMetric[]> = {
  hostify: [
    { label: '+312% MQLs em 6 meses', category: 'BUSINESS RESULTS' },
    { label: 'Onboarding -40% tempo', category: 'TIME SAVINGS' },
    { label: 'CAC pago -28%', category: 'BUSINESS RESULTS' },
    { label: 'Landing modular', category: 'PROCESS RESULTS' },
  ],
  qook: [
    { label: 'Roteiro de demo IA', category: 'AUTOMATION RESULTS' },
    { label: 'Página multi-vertical', category: 'PROCESS RESULTS' },
    { label: 'Time-to-demo -55%', category: 'TIME SAVINGS' },
    { label: 'Onboarding self-serve', category: 'ADOPTION RESULTS' },
  ],
  motivae: [
    { label: '+8x sessões orgânicas', category: 'BUSINESS RESULTS' },
    { label: 'Content engine mensal', category: 'PROCESS RESULTS' },
    { label: 'SEO técnico completo', category: 'ENGINEERING RESULTS' },
    { label: 'Casos por indústria', category: 'PROCESS RESULTS' },
  ],
  prosafe360: [
    { label: 'ICP redefinido', category: 'PROCESS RESULTS' },
    { label: 'Demo agendada em 2 clicks', category: 'ADOPTION RESULTS' },
    { label: 'Ciclo de venda -35%', category: 'TIME SAVINGS' },
    { label: 'Materiais comerciais', category: 'PROCESS RESULTS' },
  ],
  pikto: [
    { label: 'Storytelling de produto', category: 'PROCESS RESULTS' },
    { label: 'Roadmap comunicado', category: 'PROCESS RESULTS' },
    { label: 'Comunidade activa', category: 'ADOPTION RESULTS' },
    { label: '+140% trials', category: 'BUSINESS RESULTS' },
  ],
  trackfy: [
    { label: 'Reposicionamento para PMEs', category: 'PROCESS RESULTS' },
    { label: 'Calculadora de ROI', category: 'PROCESS RESULTS' },
    { label: 'Nurturing por vertical', category: 'AUTOMATION RESULTS' },
    { label: 'Time-to-value -50%', category: 'TIME SAVINGS' },
  ],
};

/** Pillars each case evidences — derived from its destination + themes. */
export const CASE_PILLARS: Record<string, PillarId[]> = {
  hostify: ['automation', 'growth'],
  qook: ['ai', 'automation'],
  motivae: ['growth'],
  prosafe360: ['growth'],
  pikto: ['software', 'growth'],
  trackfy: ['automation', 'software'],
};

/** Product slug per case (derived from its `to` destination — never invented). */
export const productSlugFor = (to?: string): string | null => {
  if (!to) return null;
  const slug = to.replace(/^\//, '');
  return slug.length > 0 ? slug : null;
};

export const getCase = (slug: string): CaseStudy | undefined =>
  CASES.find((c) => productSlugFor(c.to) === slug);

export const getCasesForPillar = (pillar: PillarId): CaseStudy[] =>
  CASES.filter((c) => {
    const slug = productSlugFor(c.to);
    return slug !== null && (CASE_PILLARS[slug] ?? []).includes(pillar);
  });
