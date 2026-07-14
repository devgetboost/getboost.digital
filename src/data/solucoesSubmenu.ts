// Whitelist e metadados dos itens do submenu "Soluções".
// Cada entrada gera uma página em /solucoes/<slug>.
// A entrada `desenvolvimento-saas` aponta para a página existente
// (ServiceDetail com o slug `desenvolvimento-software`).

export type SolucaoSubmenuItem = {
  slug: string;
  title: string;
  group: 'Marketing & Growth' | 'Software Engineering' | 'Automação & IA';
  /** Se definido, o link do menu aponta para este destino em vez de /solucoes/<slug>. */
  href?: string;
};

export const SOLUCOES_SUBMENU: SolucaoSubmenuItem[] = [
  // Marketing & Growth
  { slug: 'branding-identidade', title: 'Branding', group: 'Marketing & Growth' },
  { slug: 'marketing-digital', title: 'Marketing Digital', group: 'Marketing & Growth' },
  { slug: 'gestao-redes-sociais', title: 'Gestão de Redes Sociais', group: 'Marketing & Growth' },
  { slug: 'copywriting-conteudo', title: 'Copywriting & Conteúdo', group: 'Marketing & Growth' },
  { slug: 'seo-geo-webmcp', title: 'SEO, GEO e WebMCP', group: 'Marketing & Growth' },
  { slug: 'paid-media', title: 'Paid Media', group: 'Marketing & Growth' },
  { slug: 'email-marketing', title: 'Email Marketing', group: 'Marketing & Growth' },
  { slug: 'funis-vendas', title: 'Funis de Vendas', group: 'Marketing & Growth' },
  { slug: 'landing-pages', title: 'Landing Pages', group: 'Marketing & Growth' },
  { slug: 'video-fotografia', title: 'Vídeo e Fotografia', group: 'Marketing & Growth' },
  // Software Engineering
  { slug: 'desenvolvimento-web', title: 'Desenvolvimento Web', group: 'Software Engineering' },
  { slug: 'desenvolvimento-mobile', title: 'Desenvolvimento Mobile', group: 'Software Engineering' },
  {
    slug: 'desenvolvimento-saas',
    title: 'Desenvolvimento Software',
    group: 'Software Engineering',
    // Aponta para a página existente (ServiceDetail carrega `desenvolvimento-software`).
    href: '/solucoes/desenvolvimento-software',
  },
  { slug: 'sistemas-gestao-pmes', title: 'Sistemas de Gestão para PMEs', group: 'Software Engineering' },
  { slug: 'integracoes-erp-crm', title: 'Integrações com ERPs/CRMs', group: 'Software Engineering' },
  { slug: 'ux-ui-design', title: 'UX/UI Design', group: 'Software Engineering' },
  { slug: 'mvp-30-dias', title: 'MVP em 30 dias', group: 'Software Engineering' },
  // Automação & IA
  { slug: 'agentes-ia', title: 'Agentic AI', group: 'Automação & IA' },
  { slug: 'bots-whatsapp-ia', title: 'WhatsApp & Conversational AI', group: 'Automação & IA' },
  { slug: 'crm-sales-intelligence', title: 'CRM & Sales Intelligence', group: 'Automação & IA', href: '/crm-sales-intelligence' },
];

export const SOLUCOES_SUBMENU_MAP: Record<string, SolucaoSubmenuItem> = Object.fromEntries(
  SOLUCOES_SUBMENU.map((i) => [i.slug, i]),
);

/** Slugs cuja rota /solucoes/<slug> deve renderizar a página placeholder (todos exceto os que têm href externo). */
export const SOLUCOES_PLACEHOLDER_SLUGS = new Set(
  SOLUCOES_SUBMENU.filter((i) => !i.href).map((i) => i.slug),
);
