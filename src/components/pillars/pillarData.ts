/**
 * Getboost 2027 — Wave 3D · Pillar definitions.
 *
 * One definition per strategic pillar (AI, Automation, Software, Growth),
 * each rendered by the shared PillarLanding layout. Capabilities preserve
 * the copy of the pages they replace; services link canonical routes
 * only — no placeholders. Related products are the proof layer.
 */

export type PillarId = "ai" | "automation" | "software" | "growth";

export interface PillarCapability {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
}

export interface PillarService {
  title: string;
  to: string;
}

export interface PillarProof {
  k: string;
  v: string;
}

export interface PillarModalService {
  slug: string;
  name: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  goalOptions: string[];
  messagePlaceholder: string;
}

export interface Pillar {
  id: PillarId;
  /** The route the pillar experience mounts at. */
  route: string;
  name: string;
  eyebrow: string;
  manifestoLines: [string, string];
  heroBody: string;
  capabilities: PillarCapability[];
  services: PillarService[];
  proof: PillarProof[];
  /** Product slugs from src/data/products.ts — products as proof. */
  products: string[];
  service: PillarModalService;
}

export const PILLARS: Record<PillarId, Pillar> = {
  ai: {
    id: "ai",
    route: "/agentes-ia",
    name: "IA",
    eyebrow: "IA · Agentes Autónomos",
    manifestoLines: ["Já não geres tarefas.", "Comandas inteligência."],
    heroBody:
      "Instalamos agentes autónomos no teu site, WhatsApp e redes sociais. Conversam de forma natural, percebem intenção real, filtram curiosos e marcam reuniões directamente na tua agenda — 24/7, sem depender de ninguém da equipa.",
    capabilities: [
      {
        eyebrow: "Comunicação Personalizada",
        title: "Atendimento Personalizado",
        tags: ["Conversa Natural", "Resolução de Problemas", "Multi-idioma Nativo", "Contexto do Cliente"],
        body: "Os nossos agentes conversam de forma natural, como numa troca de mensagens entre quaisquer pessoas. Percebem o que o cliente quer e são sempre orientados pelos objetivos que traçamos previamente.",
      },
      {
        eyebrow: "Vendas Inteligentes",
        title: "Vendas e Qualificação de Leads via IA",
        tags: ["Qualificação de Leads", "Agendamento Direto", "Follow-up Inteligente", "Integração CRM"],
        body: "Não desenvolvemos websites meramente informativos, desenvolvemos máquinas de oportunidades. Os agentes de IA conversam com qualquer visitante, entendem a intenção real, qualificam leads e marcam reuniões automaticamente na agenda comercial.",
      },
      {
        eyebrow: "Knowledge Base e Arquitectura RAG",
        title: "Data Driven, Segurança e Knowledge Base",
        tags: ["Arquitetura RAG", "Privacidade de Dados", "Conhecimento Técnico", "Atualização Real-time"],
        body: "Respostas geradas com base em dados internos, não em suposições. Utilizamos arquiteturas RAG para que o agente consulte apenas fontes validadas, documentação oficial, manuais e políticas internas.",
      },
      {
        eyebrow: "Agentes Independentes",
        title: "Agentes Internos e Back-office de Gestão",
        tags: ["Análise de Documentos", "Geração de Relatórios", "Suporte à Equipa", "Automação de Tarefas"],
        body: "Menos tarefas repetitivas e mais foco no trabalho de valor. Criamos agentes de IA que tratam de relatórios, análise de dados, apoio interno e validação documental.",
      },
      {
        eyebrow: "Multi Channel Agent",
        title: "Presença em Todos os Canais",
        tags: ["WhatsApp Business", "Instagram & FB Direct", "Widget Web Custom", "Email Automation"],
        body: "Uma única inteligência em vários canais de ação. A mesma lógica e conhecimento são aplicados no Website, WhatsApp, Instagram Direct e Email. Centralizamos conhecimento e inteligência para uma abordagem cross channel.",
      },
    ],
    services: [
      { title: "Agentes de IA", to: "/agentes-ia" },
      { title: "WhatsApp & Conversational AI", to: "/solucoes/bots-whatsapp-ia" },
      { title: "CRM & Sales Intelligence", to: "/crm-sales-intelligence" },
    ],
    proof: [
      { k: "24/7", v: "operação sem interrupções" },
      { k: "5x", v: "reuniões comerciais qualificadas" },
      { k: "<30d", v: "do briefing ao primeiro agente em produção" },
    ],
    products: ["pikto", "motivae"],
    service: {
      slug: "agentes-ia",
      name: "Agentic AI",
      eyebrow: "Briefing · Agentic AI",
      headline: "Vamos desenhar o teu operador digital.",
      subhead:
        "Diz-nos que processos queres automatizar e onde queres colocar o agente a trabalhar. Preparamos uma proposta técnica e comercial personalizada.",
      goalOptions: [
        "Automatizar atendimento 24/7",
        "Qualificar e agendar leads",
        "Reduzir carga operacional interna",
        "Integrar IA no meu produto",
        "Ainda a explorar",
      ],
      messagePlaceholder: "Processos a automatizar, canais, volume de contactos…",
    },
  },

  automation: {
    id: "automation",
    route: "/solucoes/integracoes-erp-crm",
    name: "Automação",
    eyebrow: "Automação · Integrações & Operações",
    manifestoLines: ["Sistemas isolados", "custam-te dinheiro."],
    heroBody:
      "Ligamos o ERP, o CRM, o e-commerce e as ferramentas verticais numa única camada de integração — com filas, retries, logs auditáveis e alertas. A tua equipa foca em decisões; o resto executa-se sozinho.",
    capabilities: [
      {
        eyebrow: "Auditoria de Stack",
        title: "Mapeamos cada sistema e cada dado duplicado",
        tags: ["Inventário de APIs", "Fluxos de Dados", "Data Owners", "Riscos RGPD"],
        body: "Levantamos tudo o que corre no teu negócio — ERP, CRM, facturação, e-commerce, plataformas verticais — e desenhamos o mapa real de dados. Identificamos duplicações, campos em conflito e responsáveis por cada fonte. Sais com um plano priorizado por impacto e risco.",
      },
      {
        eyebrow: "Middleware e iPaaS",
        title: "Um hub central em vez de ligações ponto-a-ponto",
        tags: ["n8n / Make", "Node Serverless", "Webhooks", "Filas e Retries"],
        body: 'Chega de "quem chama quem". Construímos uma camada de integração central com filas, retries automáticos, logs auditáveis e alertas. Se um sistema falha, os dados esperam em vez de se perderem — e tu vês exactamente o que passou onde.',
      },
      {
        eyebrow: "Sincronização Bidireccional",
        title: "Clientes, produtos e stocks sempre alinhados",
        tags: ["Salesforce", "HubSpot", "PHC / Primavera / SAGE", "Shopify / WooCommerce"],
        body: "Sincronizamos contactos, encomendas, facturação e stocks entre CRM, ERP e loja online — nos dois sentidos, com resolução de conflitos. Um cliente actualizado no CRM aparece no ERP em segundos; uma encomenda no site actualiza inventário e comissões automaticamente.",
      },
      {
        eyebrow: "APIs e Portais Internos",
        title: "Quando não existe API, construímos uma",
        tags: ["REST / GraphQL", "Autenticação OAuth", "Rate Limiting", "Portais Cliente/Fornecedor"],
        body: "Sistemas legacy sem API? Ligamos por base de dados, ficheiros ou RPA controlado. Publicamos APIs REST/GraphQL modernas e portais para clientes, fornecedores ou parceiros consultarem estado de encomendas, facturas e documentos — sem sobrecarregar a tua equipa.",
      },
      {
        eyebrow: "Observabilidade e SLA",
        title: "Vês cada integração em tempo real",
        tags: ["Dashboard de Fluxos", "Alertas Slack/Email", "Logs Auditáveis", "SLA Contratual"],
        body: 'Cada fluxo publica métricas: sucessos, falhas, latência e volumes. Alertas automáticos para a equipa técnica antes de o cliente notar. Suporte com SLA claro, roadmap trimestral de melhorias e documentação viva — para nunca dependeres de uma única pessoa que "sabe como aquilo funciona".',
      },
    ],
    services: [
      { title: "Integrações ERP/CRM", to: "/solucoes/integracoes-erp-crm" },
      { title: "Funis de Vendas", to: "/solucoes/funis-vendas" },
      { title: "Sistemas de Gestão para PMEs", to: "/solucoes/sistemas-gestao-pmes" },
      { title: "Email Marketing", to: "/solucoes/email-marketing" },
    ],
    proof: [
      { k: "−70%", v: "tempo em tarefas administrativas" },
      { k: "100%", v: "dos fluxos com logs auditáveis" },
      { k: "0", v: "dados duplicados entre sistemas" },
    ],
    products: ["qook", "hostify"],
    service: {
      slug: "integracoes-erp-crm",
      name: "Automação",
      eyebrow: "Briefing · Automação",
      headline: "Vamos ligar os teus sistemas.",
      subhead:
        "Descreve o stack actual e onde se perde tempo em tarefas manuais. Voltamos com o mapa de integração, prioridades e estimativa.",
      goalOptions: [
        "Integrar ERP e CRM",
        "Automatizar processos internos",
        "Construir APIs e portais",
        "Migrar dados sem risco",
        "Ainda a explorar",
      ],
      messagePlaceholder: "Sistemas em uso, volumes, dores actuais…",
    },
  },

  software: {
    id: "software",
    route: "/solucoes/desenvolvimento-software",
    name: "Software",
    eyebrow: "Software · SaaS & Produto",
    manifestoLines: ["Software não se compra.", "Escala-se."],
    heroBody:
      "Desenvolvemos software à medida quando o mercado não tem uma resposta suficientemente boa. Do MVP ao produto multi-tenant, com arquitectura pronta para crescer, integrar e automatizar — sem dívida técnica desde o dia zero.",
    capabilities: [
      {
        eyebrow: "Product Discovery",
        title: "Do problema ao MVP com foco cirúrgico",
        tags: ["Entrevistas de Utilizador", "Definição de ICP", "Priorização RICE", "North-Star Metric"],
        body: "Antes de escrever código, alinhamos problema, cliente ideal e métrica-chave. Cortamos features que não movem o negócio e concentramos o MVP no que valida hipóteses reais — não no que impressiona em slides.",
      },
      {
        eyebrow: "Arquitectura Multi-Tenant",
        title: "Preparado para 10 ou 10.000 clientes",
        tags: ["Multi-tenant Seguro", "Row-Level Security", "Feature Flags", "Observabilidade"],
        body: "Modelo de dados isolado por cliente, RLS activa desde o primeiro deploy, feature flags para rollouts controlados e logs/traços que permitem debug em produção sem stress. Não somamos dívida técnica em nome da velocidade.",
      },
      {
        eyebrow: "Billing e Monetização",
        title: "Assinaturas, add-ons e trials sem dor",
        tags: ["Stripe / Paddle", "Trials & Freemium", "Metered Billing", "Dunning e Retenção"],
        body: "Integração completa com Stripe ou Paddle: planos, upgrades, downgrades, cobrança por utilização, provas gratuitas e recuperação de pagamentos falhados. Métricas de MRR, churn e LTV disponíveis desde o dia do lançamento.",
      },
      {
        eyebrow: "IA como Vantagem Competitiva",
        title: "Modelos integrados no produto, não colados",
        tags: ["LLMs em Contexto", "RAG sobre Dados do Cliente", "Agentes Autónomos", "Guardrails"],
        body: "IA embebida no fluxo de trabalho dos utilizadores — copilots, respostas contextuais, automação de tarefas repetitivas. Sempre com guardrails, dados isolados por tenant e custos monitorizados por conta.",
      },
      {
        eyebrow: "Operação e Suporte",
        title: "DevOps, CI/CD e SLAs desde o dia 1",
        tags: ["Deploy Contínuo", "Ambientes Isolados", "Monitorização 24/7", "Runbooks e Alertas"],
        body: "Pipelines automáticos, ambientes de staging e produção isolados, alertas ligados a on-call e runbooks documentados. Entregamos SaaS pronto para SLA — não protótipos que caem à primeira carga real.",
      },
    ],
    services: [
      { title: "Desenvolvimento Web", to: "/solucoes/desenvolvimento-web" },
      { title: "Desenvolvimento Mobile", to: "/solucoes/desenvolvimento-mobile" },
      { title: "Desenvolvimento SaaS", to: "/solucoes/desenvolvimento-software" },
      { title: "UX/UI Design", to: "/solucoes/ux-ui-design" },
      { title: "MVP em 30 dias", to: "/solucoes/mvp-30-dias" },
    ],
    proof: [
      { k: "30d", v: "do zero a MVP em produção" },
      { k: "10k+", v: "clientes por tenant sem reescrever" },
      { k: "24/7", v: "monitorização e alertas desde o dia 1" },
    ],
    products: ["qook", "hostify", "prosafe360"],
    service: {
      slug: "desenvolvimento-software",
      name: "Software",
      eyebrow: "Briefing · Software",
      headline: "Vamos desenhar o teu produto digital.",
      subhead:
        "Conta-nos o problema, os utilizadores e o prazo. Voltamos com arquitectura proposta, milestones e investimento.",
      goalOptions: [
        "Lançar um MVP",
        "Construir um SaaS multi-tenant",
        "Integrar IA no produto",
        "Redesenhar sistema legado",
        "Ainda a explorar",
      ],
      messagePlaceholder: "Problema, utilizadores, integrações, prazo…",
    },
  },

  growth: {
    id: "growth",
    route: "/solucoes/marketing-digital",
    name: "Growth",
    eyebrow: "Growth · Aquisição & Receita",
    manifestoLines: ["Menos táticas soltas.", "Mais receita previsível."],
    heroBody:
      "Combinamos aquisição paga, SEO e páginas de conversão desenhadas para uma única acção: preencher a agenda comercial. Cada euro investido tem um destino, cada lead tem origem rastreada e cada semana tem decisão baseada em dados.",
    capabilities: [
      {
        eyebrow: "Estratégia Integrada",
        title: "Um Plano Que Junta as Peças Todas",
        tags: ["Positioning", "ICP & Personas", "Roadmap 90 dias", "North Star Metric"],
        body: "Marketing digital não é somar canais — é orquestrá-los. Definimos posicionamento, público ideal e uma métrica-farol para que cada euro investido em ads, SEO, conteúdo ou email empurre o mesmo objectivo de negócio.",
      },
      {
        eyebrow: "Aquisição Multi-Canal",
        title: "Presença Onde o Cliente Decide",
        tags: ["SEO Orgânico", "Paid Social & Search", "Content Marketing", "Parcerias"],
        body: "Combinamos aquisição paga e orgânica com peso ajustado ao teu ciclo de venda. Curto prazo com performance ads, médio prazo com SEO e conteúdo, longo prazo com marca e parcerias — tudo medido no mesmo dashboard.",
      },
      {
        eyebrow: "Ativação & Retenção",
        title: "Vender Uma Vez é Fácil. Reter é Lucro.",
        tags: ["Email & Automation", "Loyalty Programs", "Upsell / Cross-sell", "NPS Loops"],
        body: "Focamos tanto na primeira venda como na segunda, terceira e décima. Criamos fluxos de onboarding, campanhas de reactivação e loops de recomendação que aumentam o LTV sem inflar o custo de aquisição.",
      },
      {
        eyebrow: "Analytics & Attribution",
        title: "Decisões Baseadas em Dados, Não em Achismos",
        tags: ["GA4 & GTM", "Server-Side Tracking", "Modelos de Atribuição", "Dashboards Executivos"],
        body: "Instalamos tracking limpo e resistente a cookieless, unificamos dados de ads, CRM e site num único painel e mostramos, canal a canal, quem gera receita real — não vaidade de cliques.",
      },
      {
        eyebrow: "Otimização Contínua",
        title: "Ciclos Curtos, Ganhos Compostos",
        tags: ["CRO", "A/B Testing", "Sprints Mensais", "Relatórios Executivos"],
        body: "Trabalhamos em sprints mensais: hipótese, teste, aprendizagem, escala. Cada ciclo melhora conversão, reduz CAC e liberta budget para as apostas que estão a compor resultado.",
      },
    ],
    services: [
      { title: "Marketing Digital", to: "/solucoes/marketing-digital" },
      { title: "Paid Media", to: "/solucoes/paid-media" },
      { title: "SEO, GEO e WebMCP", to: "/solucoes/seo-geo-webmcp" },
      { title: "Gestão de Redes Sociais", to: "/solucoes/gestao-redes-sociais" },
      { title: "Copywriting & Conteúdo", to: "/solucoes/copywriting-conteudo" },
      { title: "Branding & Identidade", to: "/solucoes/branding-identidade" },
      { title: "Vídeo & Fotografia", to: "/solucoes/video-fotografia" },
      { title: "Landing Pages", to: "/solucoes/landing-pages" },
    ],
    proof: [
      { k: "+300%", v: "crescimento orgânico médio em 6 meses" },
      { k: "5x", v: "reuniões comerciais qualificadas" },
      { k: "90d", v: "roadmap com KPIs ligados a receita" },
    ],
    products: ["pikto", "trackfy"],
    service: {
      slug: "marketing-digital",
      name: "Growth",
      eyebrow: "Briefing · Growth",
      headline: "Vamos desenhar a tua máquina de aquisição.",
      subhead:
        "Diz-nos onde estás e onde queres chegar. Voltamos com plano de canais, metas de receita e próximos passos.",
      goalOptions: [
        "Gerar mais leads qualificadas",
        "Estruturar marketing e vendas",
        "Reduzir custo de aquisição",
        "Medir receita por canal",
        "Ainda a explorar",
      ],
      messagePlaceholder: "Canais actuais, metas, orçamento mensal…",
    },
  },
};
