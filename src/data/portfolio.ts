export type Project = {
  id: string;
  title: string;
  category: 'branding' | 'web' | 'strategy';
  description: string;
  image: string;
  tags: string[];
  year: string;
  client: string;
  results: string;
};

export const projects: Project[] = [
  {
    id: 'kasccab-website',
    title: 'Kasccab — Engenharia e Construção',
    category: 'web',
    description: 'Plataforma digital moderna e robusta para empresa de engenharia e construção civil. Inclui página institucional completa, sistema de orçamentos inteligente com formulários dinâmicos, módulo de agendamentos, gestão de clientes e fornecedores, área "Trabalhe Conosco" com vagas dinâmicas e candidaturas, e admin avançado centralizando todas as operações num único painel.',
    image: '/images/portfolio/kasccab.jpg',
    tags: ['Web Design', 'Admin Dashboard', 'Formulários Dinâmicos', 'Gestão de Clientes', 'UX/UI'],
    year: '2025',
    client: 'Kasccab — Engenharia e Construção',
    results: 'Website de nova geração com ecossistema administrativo completo, posicionando a Kasccab como referência digital no setor da construção civil.',
  },
];
