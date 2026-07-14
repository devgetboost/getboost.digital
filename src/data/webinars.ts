export type WebinarFormat = 'Webinar' | 'Workshop';

export type Webinar = {
  slug: string;
  format: WebinarFormat;
  title: string;
  tagline: string;
  date: string; // ISO
  durationMin: number;
  language: 'PT' | 'EN' | 'ES';
  location: 'Online' | 'Lisboa' | 'Porto' | 'Híbrido';
  price: string; // "Gratuito" or "€ 120"
  seats?: number;
  speaker: {
    name: string;
    role: string;
    bio: string;
  };
  audience: string[];
  summary: string;
  learn: string[];
  agenda: { time: string; title: string; body?: string }[];
  requirements?: string[];
  tags: string[];
};

export const webinars: Webinar[] = [
  {
    slug: 'ia-generativa-para-pmes',
    format: 'Webinar',
    title: 'IA Generativa para PMEs: do hype ao ROI',
    tagline: 'Um roteiro prático para pôr modelos generativos a trabalhar no teu negócio em 30 dias.',
    date: '2026-07-23T18:30:00+01:00',
    durationMin: 75,
    language: 'PT',
    location: 'Online',
    price: 'Gratuito',
    seats: 250,
    speaker: {
      name: 'Nuno Cruz',
      role: 'Founder · Getboost Digital',
      bio: '15 anos a construir produtos digitais e agentes de IA para PMEs em Portugal, Brasil e Espanha.',
    },
    audience: ['Fundadores', 'Directores de marketing', 'Directores de operações', 'Product managers'],
    summary:
      'Uma sessão desmistificadora sobre IA generativa aplicada ao dia-a-dia de uma PME. Mostramos casos reais, custos, arquitecturas e onde é que os modelos generativos criam alavancagem imediata — e onde não vale a pena investir.',
    learn: [
      'Identificar 5 processos internos onde a IA generativa devolve horas por semana',
      'Escolher entre APIs fechadas, modelos open-source e agentes autónomos',
      'Estimar custo mensal por caso de uso (com números reais)',
      'Desenhar um piloto de 30 dias com métricas claras',
    ],
    agenda: [
      { time: '00:00', title: 'Abertura e enquadramento', body: 'Onde estamos no ciclo de adopção de IA em Portugal.' },
      { time: '00:10', title: 'Anatomia de um caso de uso rentável', body: 'Como separar hype de valor real.' },
      { time: '00:30', title: 'Demo ao vivo · Agente de qualificação de leads', body: 'Do site ao CRM em menos de 2 minutos.' },
      { time: '00:50', title: 'Custos, riscos e governance', body: 'Privacidade, dados sensíveis e alinhamento com a equipa.' },
      { time: '01:05', title: 'Q&A aberto', body: 'Respondemos a tudo, sem guião.' },
    ],
    tags: ['IA Generativa', 'Estratégia', 'ROI', 'Casos práticos'],
  },
  {
    slug: 'workshop-agentes-whatsapp',
    format: 'Workshop',
    title: 'Workshop · Constrói o teu agente de WhatsApp em 3 horas',
    tagline: 'Hands-on: sais da sessão com um agente de IA a atender clientes no teu WhatsApp Business.',
    date: '2026-08-06T09:30:00+01:00',
    durationMin: 180,
    language: 'PT',
    location: 'Lisboa',
    price: '€ 180',
    seats: 12,
    speaker: {
      name: 'Rita Fonseca',
      role: 'Lead AI Engineer · Getboost Digital',
      bio: 'Especialista em arquitecturas RAG e agentes conversacionais multi-canal. Ex-Feedzai.',
    },
    audience: ['Equipas de atendimento', 'Product managers', 'Fundadores técnicos'],
    summary:
      'Workshop presencial, em grupo restrito de 12 pessoas, onde cada participante configura o seu próprio agente de IA no WhatsApp Business — com base de conhecimento personalizada, integração ao Google Calendar e handoff humano.',
    learn: [
      'Ligar o WhatsApp Business API a um agente conversacional',
      'Construir uma base de conhecimento (RAG) a partir dos teus documentos',
      'Definir regras de escalonamento para humanos',
      'Medir qualidade das respostas e iterar',
    ],
    agenda: [
      { time: '09:30', title: 'Setup e boas-vindas' },
      { time: '10:00', title: 'Módulo 1 · Fundamentos de agentes conversacionais' },
      { time: '10:45', title: 'Módulo 2 · Base de conhecimento e RAG', body: 'Cada participante carrega os seus próprios documentos.' },
      { time: '11:30', title: 'Pausa · Coffee' },
      { time: '11:45', title: 'Módulo 3 · Integrações e handoff humano' },
      { time: '12:15', title: 'Sprint final · agente ao vivo no teu WhatsApp' },
    ],
    requirements: [
      'Portátil próprio',
      'Conta WhatsApp Business (podemos criar no dia)',
      'Documentos ou FAQs que queiras usar como base de conhecimento',
    ],
    tags: ['WhatsApp', 'Agentes IA', 'RAG', 'Hands-on'],
  },
  {
    slug: 'seo-geo-era-agentes',
    format: 'Webinar',
    title: 'SEO na era dos agentes: como ser encontrado por IA',
    tagline: 'Novas regras de visibilidade quando quem lê o teu site é um LLM, não uma pessoa.',
    date: '2026-08-20T18:00:00+01:00',
    durationMin: 60,
    language: 'PT',
    location: 'Online',
    price: 'Gratuito',
    seats: 500,
    speaker: {
      name: 'André Vieira',
      role: 'Head of Growth · Getboost Digital',
      bio: 'Trabalhou SEO para marcas em 12 mercados. Foca-se hoje em GEO — Generative Engine Optimization.',
    },
    audience: ['Equipas de marketing', 'Content managers', 'Founders SaaS'],
    summary:
      'ChatGPT, Perplexity e Google AI Overviews estão a substituir a página de resultados clássica. Nesta sessão mostramos o que muda na optimização de conteúdo e estrutura para seres citado — e não apenas indexado — pelas ferramentas de IA.',
    learn: [
      'Diferenças práticas entre SEO clássico e GEO',
      'Como estruturar conteúdo para ser citado por LLMs',
      'Auditoria à tua marca em ChatGPT, Perplexity e Gemini',
      'Métricas para acompanhar visibilidade em respostas geradas',
    ],
    agenda: [
      { time: '00:00', title: 'O fim da SERP como a conheces' },
      { time: '00:15', title: 'Como os LLMs escolhem fontes' },
      { time: '00:30', title: 'Framework GEO em 6 passos' },
      { time: '00:45', title: 'Auditoria ao vivo à marca de um participante' },
      { time: '00:55', title: 'Q&A' },
    ],
    tags: ['SEO', 'GEO', 'Conteúdo', 'LLM'],
  },
  {
    slug: 'workshop-automacao-back-office',
    format: 'Workshop',
    title: 'Workshop · Automatiza o back-office da tua PME',
    tagline: 'Facturas, contratos, relatórios e emails: o que dá para automatizar hoje, com o que já tens.',
    date: '2026-09-11T14:00:00+01:00',
    durationMin: 210,
    language: 'PT',
    location: 'Híbrido',
    price: '€ 220',
    seats: 20,
    speaker: {
      name: 'Sofia Marques',
      role: 'Automation Architect · Getboost Digital',
      bio: 'Desenha fluxos de automação para empresas de serviços profissionais e retalho. Certificada n8n & Zapier.',
    },
    audience: ['Directores administrativos e financeiros', 'COOs', 'Escritórios de advogados e contabilidade'],
    summary:
      'Um workshop de tarde inteira dedicado a mapear e automatizar processos repetitivos de back-office. Sais com pelo menos 3 fluxos a funcionar no teu ambiente — sem depender do IT.',
    learn: [
      'Mapear processos manuais e priorizar por ROI',
      'Ligar Gmail, Drive, ERP e assinaturas digitais num único fluxo',
      'Usar IA para leitura e classificação de documentos',
      'Governar automações: logs, alertas e handover humano',
    ],
    agenda: [
      { time: '14:00', title: 'Diagnóstico · o teu mapa de processos' },
      { time: '14:45', title: 'Fluxo 1 · gestão inteligente de facturas' },
      { time: '15:30', title: 'Pausa' },
      { time: '15:45', title: 'Fluxo 2 · contratos, assinatura e arquivo' },
      { time: '16:30', title: 'Fluxo 3 · relatório semanal automatizado' },
      { time: '17:15', title: 'Governance e próximos passos' },
    ],
    requirements: [
      'Portátil próprio',
      'Acessos administrativos ao Google Workspace ou Microsoft 365',
      'Exemplo real (anonimizado) de um processo repetitivo',
    ],
    tags: ['Automação', 'Back-office', 'PMEs', 'Hands-on'],
  },
];

export const getWebinarBySlug = (slug: string) => webinars.find((w) => w.slug === slug);

export const formatWebinarDate = (iso: string, lang: string = 'pt-PT') => {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(lang, {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
};
