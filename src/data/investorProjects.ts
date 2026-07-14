import { ChefHat, Hotel, Brain, MapPin, HardHat, Clock } from 'lucide-react';

export interface InvestorProject {
  slug: string;
  name: string;
  subtitle: string;
  tagline: string;
  icon: typeof ChefHat;
  color: string;
  status: string;
  statusLabel: string;
  description: string[];
  features: string[];
  market: {
    size: string;
    growth: string;
    trends: string[];
    potential: string;
  };
  business: {
    revenue: string;
    pricing: string;
    scalability: string;
    audience: string;
  };
  roadmap: { phase: string; items: string[] }[];
  investment: {
    ticketMin: string;
    returns: string[];
    allocation: string[];
  };
}

export const investorProjects: InvestorProject[] = [
  {
    slug: 'qook',
    name: 'Qook',
    subtitle: 'Gestão de Restaurantes (Brasil)',
    tagline: 'Plataforma SaaS completa para gestão de restaurantes, cafés e dark kitchens no mercado brasileiro.',
    icon: ChefHat,
    color: 'from-orange-500 to-red-500',
    status: 'development',
    statusLabel: 'Em desenvolvimento',
    description: [
      'O Qook é uma plataforma de gestão integrada para o setor de food service no Brasil, abrangendo restaurantes, cafés, bares e dark kitchens.',
      'O sistema centraliza gestão de pedidos, controlo de stock, cardápio digital, gestão de mesas, relatórios financeiros e integração com plataformas de delivery.',
      'O problema que resolve: restaurantes brasileiros dependem de múltiplas ferramentas desconectadas, gerando ineficiência, desperdício e falta de visibilidade sobre o negócio.',
    ],
    features: ['Gestão de pedidos e mesas', 'Cardápio digital com QR Code', 'Controlo de stock e custos', 'Relatórios financeiros em tempo real', 'Integração com iFood, Rappi e Uber Eats', 'App para garçons e cozinha'],
    market: {
      size: 'O mercado de food service no Brasil fatura mais de R$ 200 mil milhões por ano, com mais de 1 milhão de estabelecimentos.',
      growth: 'Crescimento de 12-15% ao ano na digitalização do setor, acelerado pela pandemia.',
      trends: ['Digitalização de cardápios', 'Crescimento de dark kitchens', 'Automação de pedidos', 'Integração com marketplaces de delivery'],
      potential: 'Menos de 20% dos restaurantes no Brasil utilizam software de gestão — oportunidade massiva de penetração.',
    },
    business: {
      revenue: 'Subscrição mensal SaaS com planos escalonados por funcionalidades e número de estabelecimentos.',
      pricing: 'Planos de R$ 99 a R$ 499/mês por estabelecimento, com opção enterprise para cadeias.',
      scalability: 'Modelo 100% cloud, sem necessidade de hardware. Escalável para toda a América Latina.',
      audience: 'Restaurantes independentes, cadeias de fast-food, dark kitchens e cafés no Brasil.',
    },
    roadmap: [
      { phase: 'Q3 2026', items: ['Finalização do MVP', 'Testes com 10 restaurantes piloto'] },
      { phase: 'Q4 2026', items: ['Lançamento beta público', 'Integração iFood'] },
      { phase: 'Q1 2027', items: ['Lançamento comercial', 'Onboarding de 100 clientes'] },
      { phase: 'Q2-Q4 2027', items: ['Expansão para São Paulo e Rio', 'IA para previsão de demanda', 'App mobile nativo'] },
    ],
    investment: {
      ticketMin: '€5.000',
      returns: ['Equity no projeto Qook', 'Acesso ao pitch deck completo', 'Relatórios trimestrais de progresso', 'Participação em decisões estratégicas (tickets >€25k)'],
      allocation: ['40% Desenvolvimento de produto', '25% Marketing e aquisição de clientes', '20% Operações e infraestrutura', '15% Reserva estratégica'],
    },
  },
  {
    slug: 'hostify',
    name: 'Hostify',
    subtitle: 'Gestão de Alojamentos e Pousadas (Brasil)',
    tagline: 'A solução definitiva para digitalizar a gestão de pousadas e hotéis. Hostify: Automação e eficiência para o mercado de alojamento no Brasil.',
    icon: Hotel,
    color: 'from-blue-500 to-cyan-500',
    status: 'beta',
    statusLabel: 'Beta inicial',
    description: [
      'O Hostify é um SaaS de gestão hoteleira focado em alojamentos de pequena e média dimensão no Brasil — pousadas, hostels, hotéis boutique e alojamentos locais.',
      'Oferece gestão de reservas, channel manager, check-in digital, housekeeping, faturação e relatórios de ocupação numa única plataforma.',
      'O problema: a grande maioria dos alojamentos brasileiros ainda utiliza planilhas ou cadernos para gerir reservas, perdendo receita e eficiência.',
    ],
    features: ['Gestão de reservas centralizada', 'Channel manager (Booking, Airbnb, Expedia)', 'Check-in/check-out digital', 'Gestão de housekeeping', 'Motor de reservas próprio', 'Relatórios de ocupação e receita'],
    market: {
      size: 'Mais de 30.000 pousadas e 10.000 hotéis no Brasil, maioritariamente sem digitalização.',
      growth: 'Turismo doméstico brasileiro cresceu 25% pós-pandemia, impulsionando a procura por soluções digitais.',
      trends: ['Crescimento do turismo de experiência', 'Reservas diretas vs. OTAs', 'Automação de operações', 'Sustentabilidade e eco-turismo'],
      potential: 'Mercado fragmentado com baixa penetração tecnológica — condições ideais para um SaaS vertical.',
    },
    business: {
      revenue: 'Subscrição mensal com planos baseados no número de quartos e funcionalidades.',
      pricing: 'De R$ 149 a R$ 699/mês, com comissão opcional sobre reservas diretas.',
      scalability: 'Expansível para Portugal, Espanha e toda a América Latina.',
      audience: 'Pousadas, hotéis boutique, hostels e alojamentos locais com 5 a 100 quartos.',
    },
    roadmap: [
      { phase: 'Q3 2026', items: ['Beta fechada com 5 pousadas', 'Integração Booking.com'] },
      { phase: 'Q4 2026', items: ['Integração Airbnb', 'Motor de reservas próprio'] },
      { phase: 'Q1 2027', items: ['Lançamento público', 'Onboarding de 50 propriedades'] },
      { phase: 'Q2-Q4 2027', items: ['Expansão para Portugal', 'IA para pricing dinâmico', 'App mobile'] },
    ],
    investment: {
      ticketMin: '€5.000',
      returns: ['Equity no projeto Hostify', 'Acesso ao pitch deck completo', 'Relatórios trimestrais', 'Advisory board (tickets >€25k)'],
      allocation: ['35% Desenvolvimento de produto', '30% Marketing e parcerias', '20% Operações', '15% Reserva estratégica'],
    },
  },
  {
    slug: 'motivae',
    name: 'Motivae',
    subtitle: 'Personal Coach com IA (Global)',
    tagline: 'App de produtividade e desenvolvimento pessoal com inteligência artificial, multilíngue e com potencial global.',
    icon: Brain,
    color: 'from-purple-500 to-pink-500',
    status: 'mvp-advanced',
    statusLabel: 'MVP avançado',
    description: [
      'O Motivae é uma aplicação de coaching pessoal com IA que ajuda utilizadores a definir objetivos, criar hábitos, gerir tempo e desenvolver competências — tudo com orientação personalizada.',
      'Utiliza modelos de linguagem avançados para criar planos de ação personalizados, check-ins diários e feedback contínuo.',
      'O problema: as pessoas querem melhorar mas não têm acesso a coaching personalizado e acessível. O Motivae democratiza o acesso ao desenvolvimento pessoal.',
    ],
    features: ['Coach de IA personalizado', 'Planos de ação e metas', 'Tracking de hábitos', 'Journaling com IA', 'Check-ins diários inteligentes', 'Conteúdo multilíngue (PT/EN/ES)'],
    market: {
      size: 'O mercado global de wellness e self-improvement vale mais de $50 mil milhões.',
      growth: 'Apps de produtividade e bem-estar crescem 20% ao ano.',
      trends: ['IA conversacional', 'Saúde mental digital', 'Gamificação do desenvolvimento pessoal', 'Micro-learning'],
      potential: 'Produto digital escalável globalmente, sem limitações geográficas. Mercado ávido por soluções com IA.',
    },
    business: {
      revenue: 'Modelo freemium com subscrição premium mensal/anual.',
      pricing: 'Gratuito com funcionalidades básicas. Premium: €4,99/mês ou €39,99/ano.',
      scalability: 'Produto 100% digital, sem custos marginais por utilizador. Escalável globalmente.',
      audience: 'Profissionais 25-45 anos, empreendedores, estudantes universitários — mercado global.',
    },
    roadmap: [
      { phase: 'Q3 2026', items: ['Lançamento beta público', 'Coach de IA v1'] },
      { phase: 'Q4 2026', items: ['Lançamento nas app stores', 'Programa de referral'] },
      { phase: 'Q1 2027', items: ['Expansão para mercado EN/ES', 'Parcerias com influencers'] },
      { phase: 'Q2-Q4 2027', items: ['IA coach de voz', 'Comunidade integrada', 'Versão B2B para empresas'] },
    ],
    investment: {
      ticketMin: '€3.000',
      returns: ['Equity no projeto Motivae', 'Acesso ao pitch deck', 'Updates mensais de produto', 'Early access a funcionalidades'],
      allocation: ['45% Desenvolvimento de produto e IA', '30% Marketing e growth', '15% Infraestrutura cloud', '10% Reserva'],
    },
  },
  {
    slug: 'trackfy',
    name: 'Trackfy',
    subtitle: 'Rastreamento de Veículos',
    tagline: 'SaaS para rastreamento GPS de veículos pessoais e empresariais em tempo real.',
    icon: MapPin,
    color: 'from-green-500 to-emerald-500',
    status: 'mvp',
    statusLabel: 'MVP funcional',
    description: [
      'O Trackfy é uma plataforma de rastreamento veicular que permite monitorizar frotas e veículos pessoais em tempo real via GPS.',
      'Oferece geolocalização, histórico de rotas, alertas de velocidade, cercas virtuais, relatórios de utilização e integração com hardware GPS de baixo custo.',
      'O problema: soluções de rastreamento existentes são caras, complexas e desenhadas para grandes frotas. O Trackfy democratiza o acesso.',
    ],
    features: ['Rastreamento GPS em tempo real', 'Histórico de rotas', 'Cercas virtuais (geofencing)', 'Alertas de velocidade e comportamento', 'Relatórios de utilização e consumo', 'Dashboard web e app mobile'],
    market: {
      size: 'O mercado global de fleet management vale $25 mil milhões, com forte crescimento no segmento SMB.',
      growth: 'Crescimento de 15% ao ano, impulsionado por IoT e veículos conectados.',
      trends: ['IoT e dispositivos conectados', 'Seguros baseados em telemetria', 'Sustentabilidade e otimização de rotas', 'Veículos elétricos'],
      potential: 'Segmento de pequenas frotas e veículos pessoais ainda pouco servido por soluções acessíveis.',
    },
    business: {
      revenue: 'Subscrição mensal por veículo + venda de hardware GPS.',
      pricing: '€9,99/mês por veículo. Hardware GPS a partir de €49.',
      scalability: 'Modelo escalável com receita recorrente. Hardware de baixo custo permite rápida adopção.',
      audience: 'Pequenas empresas com frotas (3-50 veículos), motoristas particulares, pais de condutores jovens.',
    },
    roadmap: [
      { phase: 'Q3 2026', items: ['Parcerias com fornecedores de hardware', 'Beta com 50 utilizadores'] },
      { phase: 'Q4 2026', items: ['Lançamento comercial', 'App mobile iOS e Android'] },
      { phase: 'Q1 2027', items: ['Integração com seguradoras', '500 veículos ativos'] },
      { phase: 'Q2-Q4 2027', items: ['IA para otimização de rotas', 'Expansão europeia', 'Telemetria avançada'] },
    ],
    investment: {
      ticketMin: '€5.000',
      returns: ['Equity no projeto Trackfy', 'Pitch deck completo', 'Relatórios trimestrais', 'Direito a advisory (tickets >€20k)'],
      allocation: ['35% Desenvolvimento de produto', '25% Hardware e IoT', '25% Marketing e vendas', '15% Operações'],
    },
  },
  {
    slug: 'prosafe360',
    name: 'ProSafe360',
    subtitle: 'Segurança do Trabalho',
    tagline: 'SaaS para gestão de segurança do trabalho, saúde ocupacional e conformidade legal em empresas.',
    icon: HardHat,
    color: 'from-amber-500 to-yellow-500',
    status: 'development',
    statusLabel: 'Em desenvolvimento',
    description: [
      'O ProSafe360 é uma plataforma de gestão de segurança e saúde no trabalho (SST) que digitaliza processos de prevenção, formação, auditorias e conformidade legal.',
      'Permite gerir riscos, registar incidentes, planear formações, acompanhar EPIs e gerar relatórios para entidades reguladoras.',
      'O problema: empresas gastam milhares de horas em processos manuais de SST e ainda assim falham em auditorias por falta de documentação adequada.',
    ],
    features: ['Avaliação e gestão de riscos', 'Registo de incidentes e quase-acidentes', 'Gestão de EPIs e equipamentos', 'Planeamento de formações', 'Auditorias e checklists digitais', 'Relatórios para conformidade legal'],
    market: {
      size: 'Mercado global de EHS software estimado em $2,5 mil milhões.',
      growth: 'Crescimento de 10-12% ao ano, impulsionado por regulamentação mais exigente.',
      trends: ['Digitalização de processos de compliance', 'Wearables e IoT para segurança', 'IA para previsão de acidentes', 'ESG e sustentabilidade'],
      potential: 'PMEs representam 90% das empresas mas menos de 15% utilizam software de SST dedicado.',
    },
    business: {
      revenue: 'Subscrição mensal baseada no número de trabalhadores e módulos contratados.',
      pricing: 'A partir de €99/mês (até 25 trabalhadores). Enterprise sob consulta.',
      scalability: 'Adaptável a diferentes legislações. Expansível para Brasil, Espanha e mercado lusófono.',
      audience: 'PMEs industriais, construção civil, logística, hospitais e empresas com requisitos regulatórios.',
    },
    roadmap: [
      { phase: 'Q4 2026', items: ['MVP com módulos core', 'Testes com 5 empresas piloto'] },
      { phase: 'Q1 2027', items: ['Lançamento beta', 'Módulo de formações'] },
      { phase: 'Q2 2027', items: ['Lançamento comercial', 'Conformidade com legislação PT'] },
      { phase: 'Q3-Q4 2027', items: ['Expansão para Brasil', 'IA para previsão de riscos', 'Integração com wearables'] },
    ],
    investment: {
      ticketMin: '€5.000',
      returns: ['Equity no projeto ProSafe360', 'Pitch deck e business plan', 'Relatórios trimestrais', 'Acesso a advisory board (tickets >€25k)'],
      allocation: ['40% Desenvolvimento de produto', '25% Compliance e certificações', '20% Marketing B2B', '15% Operações e reserva'],
    },
  },
  {
    slug: 'pikto',
    name: 'Pikto',
    subtitle: 'Gestão de Ponto e RH',
    tagline: 'Plataforma SaaS para controlo de ponto de funcionários, gestão de presenças e recursos humanos.',
    icon: Clock,
    color: 'from-indigo-500 to-violet-500',
    status: 'development',
    statusLabel: 'Em desenvolvimento',
    description: [
      'O Pikto é uma plataforma de gestão de ponto e recursos humanos que digitaliza o controlo de presenças, horários e gestão de equipas.',
      'Oferece registo de ponto digital (app, QR code, biométrico), gestão de turnos, banco de horas, relatórios de assiduidade e integração com processamento salarial.',
      'O problema: a maioria das PMEs ainda utiliza folhas de ponto manuais ou sistemas ultrapassados, gerando erros, fraude e desperdício de tempo administrativo.',
    ],
    features: ['Registo de ponto digital (app/QR/biométrico)', 'Gestão de turnos e escalas', 'Banco de horas automático', 'Relatórios de assiduidade', 'Gestão de férias e ausências', 'Integração com processamento salarial'],
    market: {
      size: 'O mercado global de HR Tech vale mais de $30 mil milhões, com o segmento de workforce management a crescer rapidamente.',
      growth: 'Crescimento de 10-14% ao ano, impulsionado pela digitalização de PMEs e regulamentação laboral.',
      trends: ['Trabalho remoto e híbrido', 'Automação de processos de RH', 'Apps mobile para colaboradores', 'Compliance laboral digital'],
      potential: 'Mais de 80% das PMEs ainda não utilizam software dedicado de gestão de ponto — enorme oportunidade de penetração.',
    },
    business: {
      revenue: 'Subscrição mensal baseada no número de colaboradores.',
      pricing: 'A partir de €49/mês (até 25 colaboradores). Planos enterprise sob consulta.',
      scalability: 'Modelo 100% cloud, escalável globalmente. Adaptável a diferentes legislações laborais.',
      audience: 'PMEs de todos os setores, empresas de construção, restauração, retalho e serviços com equipas distribuídas.',
    },
    roadmap: [
      { phase: 'Q4 2026', items: ['MVP com módulos core', 'Testes com 5 empresas piloto'] },
      { phase: 'Q1 2027', items: ['Lançamento beta', 'App mobile para colaboradores'] },
      { phase: 'Q2 2027', items: ['Lançamento comercial', 'Integração com ERP/contabilidade'] },
      { phase: 'Q3-Q4 2027', items: ['Expansão para Brasil', 'IA para otimização de escalas', 'Módulo de avaliação de desempenho'] },
    ],
    investment: {
      ticketMin: '€5.000',
      returns: ['Equity no projeto Pikto', 'Pitch deck e business plan', 'Relatórios trimestrais', 'Acesso a advisory board (tickets >€25k)'],
      allocation: ['40% Desenvolvimento de produto', '25% Marketing e vendas', '20% Operações e infraestrutura', '15% Reserva estratégica'],
    },
  },
];
