/**
 * R20.6 — SEO landing network dataset (single source of truth).
 *
 * Ten high-intent satellite pages (3 AI + 3 Automation + 2 Software +
 * 2 Growth). NOTE on selection: no prior keyword-research
 * artifact exists in the repo, so the list follows the brief's explicit
 * prioritized slugs verbatim — recorded here as the de-facto opportunity
 * set. Every entry resolves a specific segment problem (never generic,
 * never duplicated); all proof/metrics come from the pillar dataset.
 *
 * Copy rules: segment-specific, concise, zero invented metrics/clients.
 * Products referenced must have landing routes (catalog `to`).
 */

export type LandingPillar = 'ai' | 'automation' | 'software' | 'growth';

export interface LandingFaq {
  q: string;
  a: string;
}

export interface LandingBenefit {
  title: string;
  desc: string;
}

export interface Landing {
  slug: string;
  pillar: LandingPillar;
  /** Target search intent (documented target, not a ranking guarantee). */
  keyword: string;
  intent: string;
  cluster: string;
  /** Page <title> WITHOUT the brand suffix (SEO component appends it). */
  title: string;
  description: string;
  h1: string;
  h1Accent: string;
  sub: string;
  chips: [string, string, string];
  /** Lead-magnet assessment id (R20.4 engine). */
  assessment: string;
  problemTitle: string;
  problemPoints: [string, string, string, string];
  solutionTitle: string;
  solutionPoints: [string, string, string, string];
  flow: string[];
  benefits: [LandingBenefit, LandingBenefit, LandingBenefit, LandingBenefit];
  faqs: [LandingFaq, LandingFaq, LandingFaq, LandingFaq];
  /** Product slugs with landing routes (proof layer). */
  products: string[];
}

export const LANDINGS: Landing[] = [
  {
    slug: 'ai-agentes-imobiliario',
    pillar: 'ai',
    keyword: 'ai agents para imobiliárias',
    intent: 'Automatizar atendimento e qualificação de leads imobiliários',
    cluster: 'AI Agents por setor',
    title: 'AI Agents para Imobiliárias — Atendimento e Qualificação 24/7',
    description:
      'AI Agents que atendem interessados, qualificam leads e agendam visitas para imobiliárias — mesmo fora de horas. Diagnóstico gratuito.',
    h1: 'AI Agents para',
    h1Accent: 'imobiliárias',
    sub: 'Automatize atendimento, qualificação e acompanhamento de leads imobiliários com inteligência artificial.',
    chips: ['Qualificação 24/7', 'Agendamento de visitas', 'Follow-up automático'],
    assessment: 'ai-readiness',
    problemTitle: 'Leads imobiliários não esperam pelo horário de expediente',
    problemPoints: [
      'Pedidos ao fim de semana respondidos na segunda-feira',
      'Curiosos e compradores misturados na mesma caixa de entrada',
      'Visitas por agendar e follow-ups esquecidos',
      'Angariadores presos ao telefone em vez de fechar',
    ],
    solutionTitle: 'Um operador digital dedicado ao teu portefólio',
    solutionPoints: [
      'Atende no site, WhatsApp e redes a qualquer hora',
      'Qualifica por tipologia, zona, orçamento e urgência',
      'Agenda visitas diretamente na agenda dos angariadores',
      'Recupera leads frios com follow-up automático',
    ],
    flow: ['Visitante', 'AI Agent', 'Qualificação', 'Visita', 'Proposta'],
    benefits: [
      { title: 'Resposta imediata', desc: 'Cada pedido recebe resposta em segundos, a qualquer hora.' },
      { title: 'Leads qualificadas', desc: 'Só chegam à equipa oportunidades com fit real.' },
      { title: 'Agenda cheia', desc: 'Visitas marcadas sem telefonemas nem emails.' },
      { title: 'Follow-up total', desc: 'Nenhum interessado cai no esquecimento.' },
    ],
    faqs: [
      {
        q: 'O que é um AI Agent para imobiliárias?',
        a: 'É um assistente de IA que conversa com interessados, percebe o que procuram (tipologia, zona, orçamento), qualifica a oportunidade e agenda visitas automaticamente.',
      },
      {
        q: 'Quanto tempo demora a implementar?',
        a: 'A primeira versão entra em produção em semanas: ligamos o agente aos teus canais, treinamos com o teu portefólio e integramos a agenda da equipa.',
      },
      {
        q: 'Integra com o nosso CRM?',
        a: 'Sim. O agente regista cada conversa, qualificação e visita no teu CRM, sem trabalho manual.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos, onde mapeamos o teu funil atual e desenhamos o operador ideal.',
      },
    ],
    products: ['motivae', 'trackfy'],
  },
  {
    slug: 'ai-agentes-clinicas',
    pillar: 'ai',
    keyword: 'ai agents para clínicas',
    intent: 'Automatizar marcações, confirmações e atendimento de clínicas',
    cluster: 'AI Agents por setor',
    title: 'AI Agents para Clínicas — Marcações e Confirmações Automáticas',
    description:
      'AI Agents que marcam consultas, confirmam presenças e respondem a dúvidas frequentes de clínicas — 24/7. Diagnóstico gratuito.',
    h1: 'AI Agents para',
    h1Accent: 'clínicas',
    sub: 'Marcações, confirmações e atendimento ao paciente sem sobrecarregar a receção.',
    chips: ['Marcações 24/7', 'Confirmações automáticas', 'Zero faltas evitáveis'],
    assessment: 'ai-readiness',
    problemTitle: 'A receção não consegue estar em todo o lado',
    problemPoints: [
      'Chamadas perdidas em horas de pico e ao almoço',
      'Faltas que podiam ser evitadas com um lembrete',
      'Dúvidas repetidas (horários, preços, preparos) a ocupar a linha',
      'Reagendamentos tratados por telefone, um a um',
    ],
    solutionTitle: 'Uma receção digital que nunca fecha',
    solutionPoints: [
      'Marca consultas por site, WhatsApp e redes',
      'Confirma e relembra automaticamente antes da consulta',
      'Responde a dúvidas frequentes com base na tua informação',
      'Reagenda sem intervenção da equipa',
    ],
    flow: ['Paciente', 'AI Agent', 'Triagem', 'Marcação', 'Confirmação'],
    benefits: [
      { title: 'Menos faltas', desc: 'Confirmações e lembretes automáticos reduzem no-shows.' },
      { title: 'Receção livre', desc: 'A equipa foca-se em quem está presente, não no telefone.' },
      { title: 'Marcação 24/7', desc: 'Pacientes marcam à noite, ao fim de semana e feriados.' },
      { title: 'Dados organizados', desc: 'Cada interação fica registada e pesquisável.' },
    ],
    faqs: [
      {
        q: 'O agente substitui a rececionista?',
        a: 'Não — liberta-a. O AI Agent trata marcações, confirmações e dúvidas frequentes; a equipa foca-se no atendimento presencial.',
      },
      {
        q: 'Funciona com o nosso software de gestão?',
        a: 'Sim. Integramos agenda, ficha de paciente e lembretes com o sistema que já usam.',
      },
      {
        q: 'E dados de saúde — é seguro?',
        a: 'O agente opera com acessos mínimos, dados isolados e registos auditáveis, em conformidade com o RGPD.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos, onde mapeamos o fluxo atual da clínica.',
      },
    ],
    products: ['motivae', 'trackfy'],
  },
  {
    slug: 'ai-agentes-restauracao',
    pillar: 'ai',
    keyword: 'ai agents para restauração',
    intent: 'Automatizar reservas, pedidos e atendimento de restaurantes',
    cluster: 'AI Agents por setor',
    title: 'AI Agents para Restauração — Reservas e Pedidos Automáticos',
    description:
      'AI Agents que gerem reservas, respondem a dúvidas e captam pedidos para restaurantes — mesmo nas horas de pico. Diagnóstico gratuito.',
    h1: 'AI Agents para',
    h1Accent: 'restauração',
    sub: 'Reservas, pedidos e atendimento tratados sozinhos — a equipa foca-se na sala.',
    chips: ['Reservas 24/7', 'Resposta em picos', 'Menos no-shows'],
    assessment: 'ai-readiness',
    problemTitle: 'Nas horas de pico ninguém atende o telefone',
    problemPoints: [
      'Reservas perdidas quando a sala está cheia',
      'As mesmas perguntas (horário, ementa, estacionamento) todos os dias',
      'No-shows sem confirmação prévia',
      'Pedidos de take-away dispersos por várias apps',
    ],
    solutionTitle: 'Um maître digital incansável',
    solutionPoints: [
      'Aceita reservas por site, WhatsApp e redes a qualquer hora',
      'Responde a dúvidas frequentes com a tua ementa e horários',
      'Confirma reservas e reduz faltas automaticamente',
      'Centraliza pedidos de take-away num só fluxo',
    ],
    flow: ['Cliente', 'AI Agent', 'Reserva', 'Confirmação', 'Mesa cheia'],
    benefits: [
      { title: 'Sala cheia', desc: 'Reservas captadas mesmo nos picos de movimento.' },
      { title: 'Zero chamadas perdidas', desc: 'O agente atende quando a equipa não pode.' },
      { title: 'Menos faltas', desc: 'Confirmações automáticas antes de cada reserva.' },
      { title: 'Equipa focada', desc: 'Menos telefone, mais hospitalidade.' },
    ],
    faqs: [
      {
        q: 'Substitui as plataformas de reservas?',
        a: 'Complementa-as: captas reservas diretas sem comissões, mantendo os outros canais.',
      },
      {
        q: 'Conhece a nossa ementa e horários?',
        a: 'Sim — treinamos o agente com a tua informação, que podes atualizar quando quiseres.',
      },
      {
        q: 'Funciona para take-away?',
        a: 'Sim. O agente recebe pedidos, confirma e organiza-os para a cozinha.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos, onde mapeamos reservas e atendimento atuais.',
      },
    ],
    products: ['qook', 'motivae'],
  },
  {
    slug: 'automacao-whatsapp',
    pillar: 'automation',
    keyword: 'automação whatsapp empresas',
    intent: 'Automatizar atendimento e processos via WhatsApp',
    cluster: 'Automação por canal',
    title: 'Automação de WhatsApp para Empresas — Atendimento e Vendas 24/7',
    description:
      'Transformamos o WhatsApp num canal de vendas e atendimento automático: respostas imediatas, qualificação e integração com CRM. Diagnóstico gratuito.',
    h1: 'Automação de',
    h1Accent: 'WhatsApp',
    sub: 'O canal onde os teus clientes já estão — a trabalhar por ti, 24 horas por dia.',
    chips: ['Resposta imediata', 'Integrado com CRM', 'Vendas no chat'],
    assessment: 'automation-audit',
    problemTitle: 'O WhatsApp da empresa é uma caixa negra',
    problemPoints: [
      'Mensagens respondidas horas depois — ou nunca',
      'Conversas importantes perdidas entre chats pessoais',
      'Zero registo do que foi prometido a cada cliente',
      'Equipa presa a copiar dados para o CRM',
    ],
    solutionTitle: 'WhatsApp como sistema, não como chat',
    solutionPoints: [
      'Resposta imediata a qualquer hora do dia',
      'Qualificação e encaminhamento automáticos',
      'Tudo registado no CRM sem copiar nada',
      'Follow-ups e campanhas a partir das conversas',
    ],
    flow: ['Mensagem', 'Automação', 'Resposta', 'CRM', 'Venda'],
    benefits: [
      { title: 'Velocidade', desc: 'Primeira resposta em segundos, não horas.' },
      { title: 'Organização', desc: 'Cada conversa vira registo pesquisável.' },
      { title: 'Vendas', desc: 'Do primeiro olá à proposta sem fricção.' },
      { title: 'Escala', desc: 'Mil conversas com o custo de uma.' },
    ],
    faqs: [
      {
        q: 'Preciso do WhatsApp Business API?',
        a: 'Tratamos de tudo: número, API oficial, aprovações e configuração inicial.',
      },
      {
        q: 'Funciona com o nosso CRM?',
        a: 'Sim — integramos com os principais CRMs e, quando não há API, construímos a ponte.',
      },
      {
        q: 'Os clientes percebem que falam com automação?',
        a: 'A conversa é natural, e o handoff para humano acontece sempre que faz sentido — com contexto total.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre o teu atendimento atual.',
      },
    ],
    products: ['qook', 'trackfy'],
  },
  {
    slug: 'integracao-crm',
    pillar: 'automation',
    keyword: 'integração crm empresas',
    intent: 'Centralizar dados de clientes e automatizar o comercial',
    cluster: 'Integrações',
    title: 'Integração de CRM — Dados Centrais, Comercial Automático',
    description:
      'Ligamos o teu CRM ao site, WhatsApp, faturação e marketing: dados sincronizados e follow-ups automáticos. Diagnóstico gratuito.',
    h1: 'Integração de',
    h1Accent: 'CRM',
    sub: 'Um só sistema a ver todos os clientes — e a trabalhar por eles.',
    chips: ['Dados sincronizados', 'Follow-up automático', 'Zero copy-paste'],
    assessment: 'automation-audit',
    problemTitle: 'O cliente existe em cinco sítios diferentes',
    problemPoints: [
      'Site, WhatsApp, folhas e faturação sem falar entre si',
      'Comerciais a copiar dados à mão, todos os dias',
      'Follow-ups dependentes de memória e post-its',
      'Ninguém sabe ao certo em que ponto está cada negócio',
    ],
    solutionTitle: 'Um CRM que se alimenta sozinho',
    solutionPoints: [
      'Captura automática de leads de todos os canais',
      'Sincronização bidirecional com faturação e loja',
      'Follow-ups e tarefas criados por regras',
      'Pipeline visível e atualizado em tempo real',
    ],
    flow: ['Canais', 'Captura', 'CRM', 'Automação', 'Venda'],
    benefits: [
      { title: 'Dados únicos', desc: 'Uma fonte de verdade para toda a equipa.' },
      { title: 'Zero tarefas manuais', desc: 'Registo e follow-up acontecem sozinhos.' },
      { title: 'Pipeline visível', desc: 'Cada negócio rastreado até ao fecho.' },
      { title: 'Escala comercial', desc: 'Mais leads sem mais administrativos.' },
    ],
    faqs: [
      {
        q: 'Trabalham com o nosso CRM atual?',
        a: 'Na maioria dos casos sim — integramos os principais CRMs do mercado e avaliamos o teu no diagnóstico.',
      },
      {
        q: 'E se não tivermos CRM?',
        a: 'Ajudamos a escolher e implementamos um à medida do teu processo comercial.',
      },
      {
        q: 'Os dados históricos migram?',
        a: 'Sim, com limpeza, deduplicação e validação antes de entrar no novo fluxo.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre o teu stack atual.',
      },
    ],
    products: ['trackfy', 'qook'],
  },
  {
    slug: 'integracao-erp',
    pillar: 'automation',
    keyword: 'integração erp pme',
    intent: 'Sincronizar stocks, faturação e operações com o ERP',
    cluster: 'Integrações',
    title: 'Integração ERP para PMEs — Stocks e Faturação Sincronizados',
    description:
      'Ligamos ERP, loja, CRM e logística: stocks, encomendas e faturação sempre alinhados, sem trabalho manual. Diagnóstico gratuito.',
    h1: 'Integração',
    h1Accent: 'ERP',
    sub: 'O teu ERP a falar com tudo — stocks, encomendas e faturação sempre certos.',
    chips: ['Stocks sincronizados', 'Faturação automática', 'Zero erros manuais'],
    assessment: 'automation-audit',
    problemTitle: 'O ERP sabe uma coisa, a loja sabe outra',
    problemPoints: [
      'Stocks desatualizados a gerar vendas impossíveis',
      'Faturas emitidas à mão, uma a uma',
      'Encomendas reintroduzidas em dois ou três sistemas',
      'Fechos de mês que demoram semanas',
    ],
    solutionTitle: 'Um ERP ligado a tudo',
    solutionPoints: [
      'Sincronização bidirecional com loja e CRM',
      'Faturação automática por regras',
      'Stocks atualizados em tempo real',
      'Alertas antes da rutura, não depois',
    ],
    flow: ['Encomenda', 'ERP', 'Stock', 'Faturação', 'Expedição'],
    benefits: [
      { title: 'Stocks certos', desc: 'Vende apenas o que existe.' },
      { title: 'Faturação sozinha', desc: 'Documentos emitidos por regras.' },
      { title: 'Menos erros', desc: 'Sem reintrodução manual de dados.' },
      { title: 'Fechos rápidos', desc: 'Mês fechado em dias, não semanas.' },
    ],
    faqs: [
      {
        q: 'Integram PHC, Primavera ou SAGE?',
        a: 'Sim — são os ERPs mais comuns nas PMEs portuguesas e integramos todos.',
      },
      {
        q: 'E se o nosso ERP não tiver API?',
        a: 'Ligamos por base de dados, ficheiros ou RPA controlado — há sempre caminho.',
      },
      {
        q: 'A operação para durante a integração?',
        a: 'Não. Trabalhamos em paralelo e comutamos por fases, sem downtime.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre sistemas e fluxos atuais.',
      },
    ],
    products: ['qook', 'trackfy'],
  },
  {
    slug: 'desenvolvimento-saas',
    pillar: 'software',
    keyword: 'desenvolvimento saas portugal',
    intent: 'Construir uma plataforma SaaS multi-tenant escalável',
    cluster: 'Software por formato',
    title: 'Desenvolvimento SaaS — Plataformas Multi-Tenant em Produção',
    description:
      'Construímos plataformas SaaS escaláveis: MVP em 30 dias, billing, multi-tenant e operação pronta para SLA. Diagnóstico gratuito.',
    h1: 'Desenvolvimento',
    h1Accent: 'SaaS',
    sub: 'Da ideia ao produto multi-tenant — sem dívida técnica desde o dia zero.',
    chips: ['MVP em 30 dias', 'Multi-tenant', 'Billing incluído'],
    assessment: 'software-readiness',
    problemTitle: 'A ideia é boa. A execução é que falha',
    problemPoints: [
      'Meses de desenvolvimento sem nada testável',
      'Arquitetura que parte ao décimo cliente',
      'Billing e subscrições adiados para "depois"',
      'Protótipos que nunca chegam a produção',
    ],
    solutionTitle: 'Produto real, pronto para escalar',
    solutionPoints: [
      'MVP focado em 30 dias, validado com utilizadores reais',
      'Arquitetura multi-tenant e segura desde o início',
      'Billing, trials e planos desde o lançamento',
      'Operação monitorizada com SLA',
    ],
    flow: ['Ideia', 'MVP', 'Validação', 'Plataforma', 'Escala'],
    benefits: [
      { title: 'Velocidade', desc: 'Testável em 30 dias, não em 6 meses.' },
      { title: 'Escala', desc: 'De 10 a 10.000 clientes sem reescrever.' },
      { title: 'Receita', desc: 'Cobrança desde o primeiro dia.' },
      { title: 'Operação', desc: 'Monitorização e alertas incluídos.' },
    ],
    faqs: [
      {
        q: 'Quanto custa desenvolver um SaaS?',
        a: 'Depende do âmbito — por isso começamos por um MVP focado, com orçamento fechado, antes de qualquer compromisso maior.',
      },
      {
        q: 'E se a ideia mudar a meio?',
        a: 'É esperado: trabalhamos em ciclos curtos e a arquitetura suporta mudança sem reescrever.',
      },
      {
        q: 'Ficamos dependentes de vocês?',
        a: 'Não. Entregamos código, documentação e acessos — és dono de tudo desde o dia um.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre a ideia, mercado e âmbito.',
      },
    ],
    products: ['qook', 'motivae', 'pikto'],
  },
  {
    slug: 'software-gestao',
    pillar: 'software',
    keyword: 'software de gestão para pmes',
    intent: 'Centralizar a operação num sistema à medida',
    cluster: 'Software por formato',
    title: 'Software de Gestão para PMEs — Operação Centralizada',
    description:
      'Sistemas de gestão à medida: clientes, stocks, equipas e finanças num só lugar, sem adaptar a empresa à ferramenta. Diagnóstico gratuito.',
    h1: 'Software de',
    h1Accent: 'gestão',
    sub: 'A tua operação inteira num sistema desenhado para ela — não o contrário.',
    chips: ['Processos centrais', 'Dados únicos', 'Sem adaptações'],
    assessment: 'software-readiness',
    problemTitle: 'A empresa adaptou-se à ferramenta — devia ser ao contrário',
    problemPoints: [
      'Folhas de cálculo como sistema operativo',
      'Informação crítica na cabeça de duas pessoas',
      'Ferramentas genéricas que não cobrem o processo real',
      'Crescer significa contratar, não escalar',
    ],
    solutionTitle: 'Um sistema desenhado para a tua operação',
    solutionPoints: [
      'Levantamento completo dos processos antes de codificar',
      'Módulos por área: comercial, stocks, equipas, finanças',
      'Integrações com o que já funciona',
      'Evolução contínua após o lançamento',
    ],
    flow: ['Levantamento', 'Desenho', 'Sistema', 'Adoção', 'Escala'],
    benefits: [
      { title: 'Centralização', desc: 'Tudo num só lugar pesquisável.' },
      { title: 'Conhecimento retido', desc: 'Processos no sistema, não nas pessoas.' },
      { title: 'Decisão rápida', desc: 'Dados reais em vez de sensações.' },
      { title: 'Crescimento', desc: 'Novos colaboradores entram a correr.' },
    ],
    faqs: [
      {
        q: 'Porquê à medida em vez de um ERP de prateleira?',
        a: 'Quando o processo é a vantagem competitiva, adaptar a empresa à ferramenta destrói valor. Software à medida segue o teu processo.',
      },
      {
        q: 'Quanto tempo demora?',
        a: 'Um primeiro módulo em produção em semanas; a plataforma completa evolui por fases.',
      },
      {
        q: 'E a formação da equipa?',
        a: 'Incluída: desenhamos com quem opera e acompanhamos a adoção.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre processos e ferramentas atuais.',
      },
    ],
    products: ['qook', 'motivae', 'pikto'],
  },
  {
    slug: 'growth-system',
    pillar: 'growth',
    keyword: 'sistema de crescimento previsível',
    intent: 'Construir uma máquina de aquisição e conversão',
    cluster: 'Growth por sistema',
    title: 'Growth System — Crescimento Previsível, Mês após Mês',
    description:
      'Construímos sistemas de aquisição e conversão que geram pipeline todos os meses — não campanhas isoladas. Diagnóstico gratuito.',
    h1: 'Growth',
    h1Accent: 'system',
    sub: 'Aquisição, conversão e retenção ligadas num sistema que compõe resultado.',
    chips: ['Pipeline mensal', 'Origem rastreada', 'Otimização contínua'],
    assessment: 'growth-score',
    problemTitle: 'Marketing que recomeça do zero todos os meses',
    problemPoints: [
      'Campanhas pontuais sem aprendizagem acumulada',
      'Leads sem origem conhecida nem follow-up',
      'Orçamento distribuído por sensação',
      'Resultados que sobem e descem sem explicação',
    ],
    solutionTitle: 'Um sistema que compõe',
    solutionPoints: [
      'Aquisição multicanal com origem rastreada',
      'Captura e nutrição automáticas',
      'Revisão semanal orientada a receita',
      'Escala do que prova ROI, corte do resto',
    ],
    flow: ['Aquisição', 'Captura', 'Nutrição', 'Conversão', 'Otimização'],
    benefits: [
      { title: 'Previsibilidade', desc: 'Pipeline esperado, não desejado.' },
      { title: 'Atribuição', desc: 'Cada euro com destino e retorno.' },
      { title: 'Compostagem', desc: 'Cada mês aprende com o anterior.' },
      { title: 'Escala', desc: 'Aumentar budget sem aumentar caos.' },
    ],
    faqs: [
      {
        q: 'Em quanto tempo se veem resultados?',
        a: 'Tráfego pago em semanas; orgânico compõe ao longo de meses. O sistema mede ambos desde o dia um.',
      },
      {
        q: 'Substituem a nossa equipa de marketing?',
        a: 'Trabalhamos com ela: trazemos sistema, dados e execução onde faltam.',
      },
      {
        q: 'Qual o investimento mínimo?',
        a: 'Depende do ciclo de venda e ticket médio — definido no diagnóstico, sem compromisso.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre aquisição e funil atuais.',
      },
    ],
    products: ['pikto', 'trackfy'],
  },
  {
    slug: 'geracao-leads',
    pillar: 'growth',
    keyword: 'geração de leads b2b',
    intent: 'Criar pipeline previsível de oportunidades qualificadas',
    cluster: 'Growth por sistema',
    title: 'Geração de Leads B2B — Pipeline Previsível de Oportunidades',
    description:
      'Máquinas de geração de leads B2B: tráfego qualificado, captura, nutrição e qualificação até à reunião. Diagnóstico gratuito.',
    h1: 'Geração de',
    h1Accent: 'leads',
    sub: 'Oportunidades qualificadas a entrar no pipeline — todas as semanas.',
    chips: ['Leads qualificadas', 'Origem rastreada', 'Reuniões marcadas'],
    assessment: 'growth-score',
    problemTitle: 'Pipeline vazio no início de cada mês',
    problemPoints: [
      'Dependência de referências e sorte',
      'Leads frias sem qualificação nem contexto',
      'Comerciais a caçar em vez de fechar',
      'Sem previsibilidade de receita futura',
    ],
    solutionTitle: 'Uma máquina de oportunidades',
    solutionPoints: [
      'Tráfego pago e orgânico para páginas que convertem',
      'Captura com qualificação imediata',
      'Nutrição automática até ao momento de compra',
      'Entrega à equipa só do que tem fit',
    ],
    flow: ['Tráfego', 'Captura', 'Qualificação', 'Nutrição', 'Reunião'],
    benefits: [
      { title: 'Volume', desc: 'Fluxo constante de oportunidades.' },
      { title: 'Qualidade', desc: 'Fit validado antes do comercial.' },
      { title: 'Velocidade', desc: 'Da captura à reunião em dias.' },
      { title: 'Previsão', desc: 'Pipeline futuro sempre visível.' },
    ],
    faqs: [
      {
        q: 'B2B ou B2C?',
        a: 'Ambos, com mecânicas diferentes: ciclos longos e conta-alvo no B2B, volume e velocidade no B2C.',
      },
      {
        q: 'Garantem número de leads?',
        a: 'Não prometemos números sem dados — prometemos sistema, medição e otimização até aos números.',
      },
      {
        q: 'E se já temos equipa comercial?',
        a: 'Perfeito: alimentamo-la com oportunidades qualificadas em vez de listas frias.',
      },
      {
        q: 'Como começo?',
        a: 'Com um diagnóstico gratuito de 30 minutos sobre pipeline e aquisição atuais.',
      },
    ],
    products: ['pikto', 'trackfy'],
  },
];

export const getLanding = (slug: string): Landing | undefined =>
  LANDINGS.find((landing) => landing.slug === slug);

export const LANDING_SLUGS = LANDINGS.map((landing) => landing.slug);
