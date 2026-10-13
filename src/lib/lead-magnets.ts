/**
 * R20.4 — Lead Magnet engine: assessment definitions + scoring.
 *
 * Pure data + pure functions (no DOM, no network). Five assessments, one
 * per category (AI, Automation, Software, Growth, Digital Operations).
 * Scoring is transparent: every option awards 0–2 points; percentage =
 * total / maximum; tiers Básico <40 / Intermédio <70 / Avançado ≥70.
 * Result copy is interpretive guidance — never measured metrics, never
 * promises.
 */

export type AssessmentCategory = 'AI' | 'Automation' | 'Software' | 'Growth' | 'Digital Operations';

export type AssessmentTier = 'basico' | 'intermedio' | 'avancado';

export interface AssessmentOption {
  label: string;
  /** 0, 1 or 2. */
  points: number;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  /** Pillar tag for transversal breakdowns (operations assessment). */
  pillar?: 'ai' | 'automation' | 'software' | 'growth';
  options: [AssessmentOption, AssessmentOption, AssessmentOption];
}

export interface AssessmentTierCopy {
  title: string;
  analysis: string;
}

export interface Assessment {
  id: string;
  category: AssessmentCategory;
  headline: string;
  benefit: string;
  timeEstimate: string;
  cta: string;
  questions: AssessmentQuestion[];
  tiers: Record<AssessmentTier, AssessmentTierCopy>;
  opportunities: [string, string, string];
}

export const ASSESSMENT_TIERS: AssessmentTier[] = ['basico', 'intermedio', 'avancado'];

export const tierForPercentage = (percentage: number): AssessmentTier => {
  if (percentage < 40) return 'basico';
  if (percentage < 70) return 'intermedio';
  return 'avancado';
};

const opt = (label: string, points: 0 | 1 | 2): AssessmentOption => ({ label, points });

export const ASSESSMENTS: Assessment[] = [
  {
    id: 'ai-readiness',
    category: 'AI',
    headline: 'Qual é o nível de maturidade de IA do teu negócio?',
    benefit: 'Descobre o potencial de IA do teu negócio em menos de 3 minutos.',
    timeEstimate: '3 min',
    cta: 'Começar avaliação',
    questions: [
      {
        id: 'ai-volume',
        text: 'Quantos contactos de clientes tratam por semana?',
        options: [opt('Poucos (menos de 20)', 0), opt('Alguns (20 a 100)', 1), opt('Muitos (mais de 100)', 2)],
      },
      {
        id: 'ai-qualify',
        text: 'Como qualificam hoje uma nova oportunidade?',
        options: [opt('Manualmente, caso a caso', 0), opt('Com critérios, mas à mão', 1), opt('Com processo definido e dados', 2)],
      },
      {
        id: 'ai-followup',
        text: 'O que acontece a um contacto fora de horas?',
        options: [opt('Espera até ao dia seguinte', 0), opt('Recebe resposta genérica', 1), opt('É atendido e registado', 2)],
      },
      {
        id: 'ai-data',
        text: 'A informação sobre clientes está organizada?',
        options: [opt('Dispersa em emails e mensagens', 0), opt('Parcialmente num CRM ou folhas', 1), opt('Centralizada e atualizada', 2)],
      },
      {
        id: 'ai-time',
        text: 'Quanto tempo a equipa perde em tarefas repetitivas?',
        options: [opt('Muito tempo, todos os dias', 0), opt('Algum tempo, algumas vezes', 1), opt('Pouco — está sob controlo', 2)],
      },
    ],
    tiers: {
      basico: {
        title: 'Nível Básico',
        analysis:
          'O teu negócio ainda opera quase tudo à mão. É exatamente aqui que um AI Agent devolve mais horas: atendimento, qualificação e follow-up a correr 24/7.',
      },
      intermedio: {
        title: 'Nível Intermédio',
        analysis:
          'Já tens processos, mas a execução ainda depende de pessoas. Um AI Agent ligado ao teu CRM elimina os intervalos e garante que nenhuma oportunidade espera.',
      },
      avancado: {
        title: 'Nível Avançado',
        analysis:
          'Tens base para automação séria. O próximo passo é um operador digital autónomo: atende, qualifica, agenda e aprende com cada conversa.',
      },
    },
    opportunities: [
      'Atendimento automático no site e WhatsApp',
      'Qualificação de leads antes da equipa pegar',
      'Agendamento direto na agenda comercial',
    ],
  },
  {
    id: 'automation-audit',
    category: 'Automation',
    headline: 'Quanto tempo a tua empresa perde em tarefas repetitivas?',
    benefit: 'Mede o potencial de automação do teu negócio em menos de 3 minutos.',
    timeEstimate: '3 min',
    cta: 'Começar auditoria',
    questions: [
      {
        id: 'au-copy',
        text: 'Com que frequência copiam dados entre sistemas?',
        options: [opt('Todos os dias', 0), opt('Algumas vezes por semana', 1), opt('Raramente ou nunca', 2)],
      },
      {
        id: 'au-email',
        text: 'Quantos emails manuais repetitivos enviam por semana?',
        options: [opt('Dezenas ou mais', 0), opt('Alguns', 1), opt('Quase nenhuns', 2)],
      },
      {
        id: 'au-sync',
        text: 'CRM, faturação e stocks estão sincronizados?',
        options: [opt('Não — cada um vive sozinho', 0), opt('Parcialmente, com trabalho manual', 1), opt('Sim, automaticamente', 2)],
      },
      {
        id: 'au-errors',
        text: 'Com que frequência erros manuais causam retrabalho?',
        options: [opt('Frequentemente', 0), opt('Ocasionalmente', 1), opt('Raramente', 2)],
      },
      {
        id: 'au-reports',
        text: 'Como nascem os relatórios de gestão?',
        options: [opt('Alguém monta à mão', 0), opt('Semi-automáticos', 1), opt('Gerados sozinhos', 2)],
      },
    ],
    tiers: {
      basico: {
        title: 'Potencial elevado',
        analysis:
          'Há muito trabalho manual a drenar a equipa. Os primeiros fluxos a automatizar pagam-se a si próprios em semanas: sincronização, emails e relatórios.',
      },
      intermedio: {
        title: 'Potencial moderado',
        analysis:
          'Parte da operação já corre sozinha, mas restam ilhas manuais. Um mapa de integrações revela os próximos fluxos com melhor retorno.',
      },
      avancado: {
        title: 'Operação madura',
        analysis:
          'A base está sólida. O ganho agora vem da camada seguinte: validações inteligentes, alertas preditivos e agentes internos.',
      },
    },
    opportunities: [
      'Sincronização automática entre sistemas',
      'Emails e follow-ups sem intervenção',
      'Relatórios gerados sozinhos',
    ],
  },
  {
    id: 'software-readiness',
    category: 'Software',
    headline: 'O teu negócio precisa de mais ferramentas ou de uma plataforma?',
    benefit: 'Avalia a maturidade digital do teu negócio em menos de 3 minutos.',
    timeEstimate: '3 min',
    cta: 'Começar avaliação',
    questions: [
      {
        id: 'sw-tools',
        text: 'Quantas ferramentas diferentes usam para operar?',
        options: [opt('Muitas, sem ligação entre elas', 0), opt('Algumas, parcialmente ligadas', 1), opt('Poucas e integradas', 2)],
      },
      {
        id: 'sw-process',
        text: 'Os processos críticos vivem dentro de software ou na cabeça das pessoas?',
        options: [opt('Na cabeça das pessoas', 0), opt('Parte num lado, parte no outro', 1), opt('Dentro de sistemas', 2)],
      },
      {
        id: 'sw-growth',
        text: 'O que acontece quando o volume duplica?',
        options: [opt('Precisamos de contratar', 0), opt('Apertamos, com esforço', 1), opt('Os sistemas absorvem', 2)],
      },
      {
        id: 'sw-data',
        text: 'Conseguem ver o estado do negócio num só lugar?',
        options: [opt('Não — juntamos peças', 0), opt('Mais ou menos', 1), opt('Sim, num dashboard', 2)],
      },
      {
        id: 'sw-custom',
        text: 'As ferramentas de mercado servem, ou andam a adaptar-se a elas?',
        options: [opt('Adaptamo-nos a elas', 0), opt('Servem com remendos', 1), opt('Temos o que precisamos', 2)],
      },
    ],
    tiers: {
      basico: {
        title: 'Maturidade inicial',
        analysis:
          'A operação depende de pessoas e remendos. Uma plataforma central — mesmo começando por um MVP focado — muda a escala possível do negócio.',
      },
      intermedio: {
        title: 'Maturidade em construção',
        analysis:
          'Há base digital, mas fragmentada. Consolidar processos numa plataforma reduz custo operacional e prepara o crescimento.',
      },
      avancado: {
        title: 'Pronto para escalar',
        analysis:
          'Tens sistemas e dados. O próximo passo é produto: transformar operação interna em plataforma — para a equipa e, quem sabe, para o mercado.',
      },
    },
    opportunities: [
      'Plataforma central à medida',
      'Dashboards com o estado real',
      'MVP focado em 30 dias',
    ],
  },
  {
    id: 'growth-score',
    category: 'Growth',
    headline: 'O teu sistema de aquisição é previsível?',
    benefit: 'Mede a previsibilidade do teu crescimento em menos de 3 minutos.',
    timeEstimate: '3 min',
    cta: 'Começar avaliação',
    questions: [
      {
        id: 'gr-source',
        text: 'De onde vêm os clientes novos?',
        options: [opt('Boca a boca e sorte', 0), opt('Alguns canais, irregular', 1), opt('Canais definidos e medidos', 2)],
      },
      {
        id: 'gr-track',
        text: 'Sabem que canal gerou cada lead?',
        options: [opt('Não fazemos ideia', 0), opt('Mais ou menos', 1), opt('Sim, com origem rastreada', 2)],
      },
      {
        id: 'gr-follow',
        text: 'O que acontece a uma lead que não responde?',
        options: [opt('Perde-se', 0), opt('Tentamos uma ou duas vezes', 1), opt('Entra em nutrição automática', 2)],
      },
      {
        id: 'gr-content',
        text: 'Publicam conteúdo com regularidade?',
        options: [opt('Raramente', 0), opt('Quando dá', 1), opt('Com calendário e objetivo', 2)],
      },
      {
        id: 'gr-review',
        text: 'Com que frequência revêem números e ajustam?',
        options: [opt('Quase nunca', 0), opt('De vez em quando', 1), opt('Semanalmente, com método', 2)],
      },
    ],
    tiers: {
      basico: {
        title: 'Crescimento por sorte',
        analysis:
          'Sem canais medidos nem follow-up, cada mês recomeça do zero. Um sistema de aquisição — tráfego, captura, nutrição — torna o crescimento repetível.',
      },
      intermedio: {
        title: 'Crescimento irregular',
        analysis:
          'Há movimento, mas sem sistema. Fechar o ciclo — origem rastreada, nutrição automática, revisão semanal — estabiliza o pipeline.',
      },
      avancado: {
        title: 'Máquina afinada',
        analysis:
          'Tens sistema e método. O ganho agora está na otimização contínua: testes, segmentação e expansão de canais com ROI provado.',
      },
    },
    opportunities: [
      'Aquisição com origem rastreada',
      'Nutrição automática de leads',
      'Revisão semanal orientada a receita',
    ],
  },
  {
    id: 'operations-score',
    category: 'Digital Operations',
    headline: 'Qual é a maturidade digital da tua operação?',
    benefit: 'Avaliação transversal em IA, automação, software e growth — em menos de 4 minutos.',
    timeEstimate: '4 min',
    cta: 'Começar avaliação',
    questions: [
      {
        id: 'op-ai-1',
        text: 'Os clientes são atendidos fora de horas?',
        pillar: 'ai',
        options: [opt('Não, esperam', 0), opt('Com resposta automática simples', 1), opt('Com atendimento inteligente', 2)],
      },
      {
        id: 'op-ai-2',
        text: 'As oportunidades são qualificadas antes de chegarem à equipa?',
        pillar: 'ai',
        options: [opt('Não', 0), opt('Por vezes', 1), opt('Sistematicamente', 2)],
      },
      {
        id: 'op-au-1',
        text: 'Os dados circulam sozinhos entre sistemas?',
        pillar: 'automation',
        options: [opt('Não', 0), opt('Em parte', 1), opt('Sim', 2)],
      },
      {
        id: 'op-au-2',
        text: 'Relatórios e follow-ups acontecem sem intervenção?',
        pillar: 'automation',
        options: [opt('Não', 0), opt('Em parte', 1), opt('Sim', 2)],
      },
      {
        id: 'op-sw-1',
        text: 'Os processos críticos vivem em sistemas próprios?',
        pillar: 'software',
        options: [opt('Não', 0), opt('Em parte', 1), opt('Sim', 2)],
      },
      {
        id: 'op-sw-2',
        text: 'A operação aguenta o dobro do volume sem contratar?',
        pillar: 'software',
        options: [opt('Não', 0), opt('Com esforço', 1), opt('Sim', 2)],
      },
      {
        id: 'op-gr-1',
        text: 'A aquisição de clientes é previsível mês após mês?',
        pillar: 'growth',
        options: [opt('Não', 0), opt('Irregular', 1), opt('Sim', 2)],
      },
      {
        id: 'op-gr-2',
        text: 'Cada euro de marketing tem destino e retorno medidos?',
        pillar: 'growth',
        options: [opt('Não', 0), opt('Mais ou menos', 1), opt('Sim', 2)],
      },
    ],
    tiers: {
      basico: {
        title: 'Operação manual',
        analysis:
          'A operação depende de esforço humano em todas as frentes. Há margem grande e rápida: começar pela frente com mais dor — normalmente atendimento ou dados dispersos.',
      },
      intermedio: {
        title: 'Operação em transição',
        analysis:
          'Algumas frentes digitalizadas, outras manuais. O breakdown por pilar abaixo mostra exatamente onde investir a seguir.',
      },
      avancado: {
        title: 'Operação digital',
        analysis:
          'Operação madura nas quatro frentes. O jogo agora é otimização e escala: refinar, medir melhor, expandir o que funciona.',
      },
    },
    opportunities: [
      'Atacar a frente mais fraca primeiro',
      'Ligar as frentes num ecossistema',
      'Medir tudo a partir de agora',
    ],
  },
];

export const getAssessment = (id: string): Assessment | undefined =>
  ASSESSMENTS.find((a) => a.id === id);

export interface AssessmentScore {
  total: number;
  max: number;
  percentage: number;
  tier: AssessmentTier;
}

/** Score an assessment from a map of question-id → points awarded. */
export const scoreAssessment = (
  assessment: Assessment,
  answers: Record<string, number>,
): AssessmentScore => {
  let total = 0;
  for (const question of assessment.questions) {
    const points = answers[question.id] ?? 0;
    total += Math.max(0, Math.min(2, points));
  }
  const max = assessment.questions.length * 2;
  const percentage = max > 0 ? Math.round((total / max) * 100) : 0;
  return { total, max, percentage, tier: tierForPercentage(percentage) };
};

/** Per-pillar averages for transversal assessments (0–100 per pillar). */
export const pillarBreakdown = (
  assessment: Assessment,
  answers: Record<string, number>,
): Record<string, number> => {
  const sums: Record<string, { total: number; max: number }> = {};
  for (const question of assessment.questions) {
    if (!question.pillar) continue;
    const entry = sums[question.pillar] ?? { total: 0, max: 0 };
    entry.total += Math.max(0, Math.min(2, answers[question.id] ?? 0));
    entry.max += 2;
    sums[question.pillar] = entry;
  }
  const out: Record<string, number> = {};
  for (const [pillar, { total, max }] of Object.entries(sums)) {
    out[pillar] = max > 0 ? Math.round((total / max) * 100) : 0;
  }
  return out;
};

/** Structural validation: options shape, points range, tier coverage. */
export const validateAssessment = (assessment: Assessment): boolean => {
  if (!assessment.id || !assessment.headline || assessment.questions.length === 0) return false;
  for (const question of assessment.questions) {
    if (!question.id || !question.text || question.options.length !== 3) return false;
    for (const option of question.options) {
      if (!option.label || option.points < 0 || option.points > 2) return false;
    }
  }
  for (const tier of ASSESSMENT_TIERS) {
    const copy = assessment.tiers[tier];
    if (!copy?.title || !copy?.analysis) return false;
  }
  return assessment.opportunities.length === 3;
};
