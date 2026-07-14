// Heurísticas partilhadas para validar respostas do WhatsApp Concierge
// (persona Sofia, nº de perguntas, convite de reunião).

export type ConciergeCheck = {
  personaOk: boolean;         // não contém frases proibidas
  questionCount: number;      // nº de perguntas (?) na mensagem
  singleQuestionOk: boolean;  // <= 1 pergunta por mensagem (regra "uma de cada vez")
  hasMeetingInvite: boolean;  // sugere marcar reunião ou link de booking
  ptPtOk: boolean;            // sem markers PT-BR óbvios
  violations: string[];
};

const FORBIDDEN_PHRASES = [
  /vou preparar uma proposta detalhada/i,
  /o nuno ir[áa] rever/i,
  /prepararei uma proposta/i,
];

const MEETING_MARKERS = [
  /marcar(mos)?\s+\d*\s*min/i,
  /agendar/i,
  /reuni[ãa]o/i,
  /director comercial/i,
  /diretor comercial/i,
  /getboost\.digital\/booking/i,
];

const PT_BR_MARKERS = [
  /você/i, /vocês/i, /\blegal\b/i, /ônibus/i, /\bcelular\b/i, /\btá bom\b/i,
];

export function analyzeConciergeReply(reply: string): ConciergeCheck {
  const text = reply || "";
  const violations: string[] = [];

  const forbiddenHit = FORBIDDEN_PHRASES.find((r) => r.test(text));
  const personaOk = !forbiddenHit;
  if (!personaOk) violations.push(`persona: frase proibida "${forbiddenHit}"`);

  const questionCount = (text.match(/\?/g) || []).length;
  const singleQuestionOk = questionCount <= 1;
  if (!singleQuestionOk) violations.push(`questions: ${questionCount} perguntas numa só mensagem`);

  const hasMeetingInvite = MEETING_MARKERS.some((r) => r.test(text));

  const ptHit = PT_BR_MARKERS.find((r) => r.test(text));
  const ptPtOk = !ptHit;
  if (!ptPtOk) violations.push(`pt-pt: marker "${ptHit}"`);

  return { personaOk, questionCount, singleQuestionOk, hasMeetingInvite, ptPtOk, violations };
}

/** Log estruturado para inspeccionar respostas em produção. */
export function logConciergeCheck(
  conversationId: string,
  turnIndex: number,
  reply: string,
): ConciergeCheck {
  const check = analyzeConciergeReply(reply);
  console.log(JSON.stringify({
    tag: "concierge_check",
    conversationId,
    turnIndex,
    replyPreview: reply.slice(0, 160),
    ...check,
  }));
  if (check.violations.length) {
    console.warn(JSON.stringify({
      tag: "concierge_violation",
      conversationId,
      turnIndex,
      violations: check.violations,
    }));
  }
  return check;
}

export type DiscoveryTopic = "objetivo" | "prazo" | "contexto" | "budget" | "quem";

/** Perguntas de descoberta canónicas, mapeadas por tópico. */
export const DISCOVERY_QUESTIONS_BY_TOPIC: Record<DiscoveryTopic, string> = {
  objetivo: "Só pra perceber melhor — conta-me em duas linhas, o que é que queres alcançar com isto?",
  prazo: "Fixe 👌 E pra quando é que gostavas de ter isto a andar?",
  contexto: "Já tentaste alguma coisa antes ou é do zero?",
  budget: "Tens uma ideia de orçamento, mesmo que aproximada?",
  quem: "Isto é pra ti, pra empresa, ou pra um cliente teu?",
};

/** Ordem de prioridade quando há vários tópicos em falta. */
export const DISCOVERY_TOPIC_PRIORITY: DiscoveryTopic[] = [
  "objetivo",
  "prazo",
  "contexto",
  "quem",
  "budget",
];

/** Retrocompatibilidade: lista ordenada de perguntas. */
export const DISCOVERY_QUESTIONS = DISCOVERY_TOPIC_PRIORITY.map(
  (t) => DISCOVERY_QUESTIONS_BY_TOPIC[t],
);

/** Selecciona próxima pergunta com base em tópicos ainda em falta. */
export function pickNextDiscoveryQuestion(coveredTopics: DiscoveryTopic[]): string {
  const covered = new Set(coveredTopics);
  const nextTopic = DISCOVERY_TOPIC_PRIORITY.find((t) => !covered.has(t));
  return nextTopic
    ? DISCOVERY_QUESTIONS_BY_TOPIC[nextTopic]
    : DISCOVERY_QUESTIONS_BY_TOPIC.objetivo;
}


/**
 * Cada tópico tem 2 famílias de padrões:
 *  - askedBy: marcadores tipicamente em perguntas do assistente
 *  - answeredBy: marcadores em respostas do utilizador que voluntariam a info
 *    (para cobrir respostas fora de ordem — o cliente pode dar contexto sem ser perguntado).
 * Excluímos deliberadamente perguntas de recolha de dados (email/telefone/nome) — não são descoberta.
 */
const DISCOVERY_TOPICS: Array<{
  topic: DiscoveryTopic;
  askedBy: RegExp[];
  answeredBy: RegExp[];
}> = [
  {
    topic: "objetivo",
    askedBy: [
      /o que (?:queres|pretendes|gostavas de) (?:alcan[çc]ar|resolver|obter|atingir)/i,
      /qual (?:é |e )?o (?:teu |seu )?objectivo|objetivo/i,
      /o que (?:é que )?(?:est[áa]s|estas) a tentar/i,
      /que problema/i,
    ],
    answeredBy: [
      /(?:quero|preciso|gostava|preciso|procuro) (?:de |)(?:aumentar|melhorar|reduzir|gerar|automatizar|criar|lan[çc]ar|escalar|converter)/i,
      /objectivo|objetivo/i,
      /mais (?:leads|vendas|clientes|receita|convers[õo]es)/i,
    ],
  },
  {
    topic: "prazo",
    askedBy: [
      /pra quando|para quando/i,
      /que prazo|em que prazo/i,
      /quando (?:é que )?gostavas|quando pretendes|quando queres/i,
      /at[ée] quando/i,
    ],
    answeredBy: [
      /(?:para|pra|no|na|at[ée])\s+(?:o |a |ao |à )?(?:pr[óo]xim[oa] )?(?:m[êe]s|trimestre|q[1-4]|ano|semestre|semana)/i,
      /(?:esta|na pr[óo]xima) semana/i,
      /(?:o mais )?r[áa]pido poss[íi]vel|urgente|asap/i,
      /\bem\s+\d+\s*(?:dias|semanas|meses)\b/i,
    ],
  },
  {
    topic: "contexto",
    askedBy: [
      /j[áa] tentaste|j[áa] fizeste|j[áa] tinham/i,
      /(?:é |e )?do zero|de raiz/i,
      /o que (?:é que )?j[áa] tens/i,
      /qual (?:é |e )?o (?:teu |seu )?ponto de partida/i,
    ],
    answeredBy: [
      /j[áa] (?:tentei|tentámos|temos|fiz|fizemos|usamos|usámos)/i,
      /(?:é |e )?do zero|come[çc]ar de raiz/i,
      /neste momento (?:tenho|temos|uso|usamos)/i,
    ],
  },
  {
    topic: "budget",
    askedBy: [
      /or[çc]amento|budget/i,
      /quanto (?:é que )?(?:podes|pretendes|queres) investir/i,
    ],
    answeredBy: [
      /or[çc]amento|budget/i,
      /(?:\d[\d.,]*\s*(?:€|eur|k))/i,
      /(?:posso|podemos|temos) investir/i,
    ],
  },
  {
    topic: "quem",
    askedBy: [
      /(?:é |e )?pra ti|para ti|pra empresa|para a empresa|pra um cliente|para um cliente/i,
      /quem (?:é que )?vai usar|quem beneficia/i,
    ],
    answeredBy: [
      /(?:é |e |para )?(?:a minha|na minha|da minha) empresa/i,
      /(?:é |e )?(?:um |o )?cliente meu/i,
      /(?:é |e )?pra mim|para mim/i,
    ],
  },
];

/**
 * Sinaliza que uma mensagem do assistente é apenas recolha de dados
 * (telefone/email/nome) — NÃO é pergunta de descoberta.
 */
const DATA_COLLECTION_PATTERNS = [
  /\btelefone\b|contacto telef[óo]nico|\+351/i,
  /\bemail\b|correio electr[óo]nico|e-mail/i,
  /qual (?:é |e )?o (?:teu |seu )?nome/i,
];

function isDataCollection(text: string): boolean {
  return DATA_COLLECTION_PATTERNS.some((r) => r.test(text));
}

export type DiscoveryCoverage = {
  topics: DiscoveryTopic[];
  assistantQuestions: number;
  count: number;
};

/**
 * Detecta que tópicos de descoberta já foram cobertos no histórico —
 * seja porque o assistente perguntou, seja porque o utilizador voluntariou
 * a informação (respostas fora de ordem contam).
 */
export function detectDiscoveryCoverage(
  history: Array<{ role: string; content: string }>,
): DiscoveryCoverage {
  const covered = new Set<DiscoveryTopic>();
  let assistantQuestions = 0;

  for (const m of history) {
    const text = m.content || "";
    if (!text.trim()) continue;

    if (m.role === "assistant") {
      const check = analyzeConciergeReply(text);
      if (check.questionCount > 0 && !check.hasMeetingInvite && !isDataCollection(text)) {
        assistantQuestions++;
        for (const t of DISCOVERY_TOPICS) {
          if (t.askedBy.some((r) => r.test(text))) covered.add(t.topic);
        }
      }
    } else if (m.role === "user") {
      for (const t of DISCOVERY_TOPICS) {
        if (t.answeredBy.some((r) => r.test(text))) covered.add(t.topic);
      }
    }
  }

  return {
    topics: [...covered],
    assistantQuestions,
    // Cobertura efectiva: max entre nº de perguntas feitas e tópicos identificados
    // (garante que 2 perguntas genéricas contam mesmo sem match de tópico).
    count: Math.max(covered.size, assistantQuestions),
  };
}

/** Retrocompatibilidade: nº de perguntas do assistente. */
export function countAssistantDiscoveryQuestions(
  history: Array<{ role: string; content: string }>,
): number {
  return detectDiscoveryCoverage(history).assistantQuestions;
}

export type DiscoveryGateResult = {
  reply: string;
  overridden: boolean;
  reason?: string;
  askedBefore: number;
  topics: DiscoveryTopic[];
};

/**
 * Garante que o convite de reunião só aparece depois de 2 tópicos de descoberta
 * cobertos (por perguntas do assistente OU respostas voluntárias do utilizador).
 */
export function enforceDiscoveryGate(
  history: Array<{ role: string; content: string }>,
  reply: string,
): DiscoveryGateResult {
  const coverage = detectDiscoveryCoverage(history);
  const check = analyzeConciergeReply(reply);

  if (check.hasMeetingInvite && coverage.count < 2) {
    const next = pickNextDiscoveryQuestion(coverage.topics);
    return {
      reply: next,
      overridden: true,
      reason: `meeting_invite_before_2_discovery (covered=${coverage.count}, topics=[${coverage.topics.join(",")}])`,
      askedBefore: coverage.count,
      topics: coverage.topics,
    };
  }

  return { reply, overridden: false, askedBefore: coverage.count, topics: coverage.topics };
}

export type ConciergeLang = "pt" | "en" | "es";

/** Detecta pedido explícito de proposta/orçamento na mensagem do utilizador (PT/EN/ES). */
const QUOTE_REQUEST_PATTERNS = [
  /\bproposta\b/i,
  /\bor[çc]amento\b/i,
  /\bquanto (?:custa|fica|é|e)\b/i,
  /\bpre[çc]o\b/i,
  /\bquote\b/i,
  /\bbudget\b/i,
  /\bhow much\b/i,
  /\bprice\b/i,
  /\bpresupuesto\b/i,
  /\bcu[áa]nto (?:cuesta|vale|es)\b/i,
  /\bprecio\b/i,
  /\bcotizaci[óo]n\b/i,
];

export function isQuoteRequest(text: string): boolean {
  return QUOTE_REQUEST_PATTERNS.some((r) => r.test(text || ""));
}

/**
 * Detecção robusta do idioma (PT/EN/ES) da última mensagem do utilizador.
 * Usa scoring por contagem de matches — em vez de exigir exclusividade — para
 * lidar com mensagens que misturam idiomas (ex: "hello, quero um orçamento").
 * Empates ou ausência de sinais recai em PT (idioma padrão).
 */
export function detectConciergeLang(text: string): ConciergeLang {
  const s = (text || "").toLowerCase();
  if (!s.trim()) return "pt";

  const countMatches = (re: RegExp) => (s.match(re) || []).length;

  // Palavras/expressões marcadamente distintivas de cada idioma.
  const ptRe = /\b(ol[áa]|obrigad\w*|por favor|quero|queria|preciso|or[çc]amento|proposta|pre[çc]o|reuni[ãa]o|agendar|marcar|bom dia|boa tarde|boa noite|n[ãa]o|sim|voc[êe]|vosso|tamb[ée]m|est[áa]|est[oã]u|ser[áa]|est[aã]|est[aã]o|quanto custa|obrigado|obrigada|com certeza)\b/g;
  const enRe = /\b(hello|hi|hey|thanks|thank you|please|the|you|your|we|would|could|need|want|quote|price|pricing|meeting|schedule|how much|budget|good morning|good afternoon|good evening)\b/g;
  const esRe = /\b(hola|gracias|por favor|quiero|necesito|hablar|presupuesto|precio|cu[áa]nto|reuni[óo]n|agendar|cotizaci[óo]n|buenos d[íi]as|buenas tardes|buenas noches|s[íi]|no|tambi[ée]n|usted|est[áa]|est[oá]y)\b/g;

  const scores = {
    pt: countMatches(ptRe),
    en: countMatches(enRe),
    es: countMatches(esRe),
  };

  // Fallback por caracteres exclusivos quando não há palavras-chave.
  if (scores.pt === 0 && scores.en === 0 && scores.es === 0) {
    if (/[¿¡ñ]/.test(s)) return "es";
    if (/[ãõç]/.test(s)) return "pt";
    return "pt";
  }

  const best = (Object.entries(scores) as [ConciergeLang, number][])
    .sort((a, b) => b[1] - a[1]);
  // Em caso de empate, prefere PT > ES > EN (mercado padrão).
  if (best[0][1] === best[1]?.[1]) {
    if (scores.pt === best[0][1]) return "pt";
    if (scores.es === best[0][1]) return "es";
    return "en";
  }
  return best[0][0];
}


/** Convite de reunião consistente por idioma (mesmo formato: contexto + horários + link). */
export const MEETING_INVITE_TEMPLATES: Record<ConciergeLang, string> = {
  pt:
    "Pra te dar um valor certo e adaptado, o melhor é marcarmos 15 min com o nosso Director Comercial. " +
    "Que dia te dá jeito esta semana — manhã ou tarde? Ou escolhe aqui um horário: https://getboost.digital/booking",
  en:
    "To give you an accurate, tailored quote, let's book 15 min with our Commercial Director. " +
    "Which day works for you this week — morning or afternoon? Or pick a slot here: https://getboost.digital/booking",
  es:
    "Para darte un valor exacto y a medida, lo mejor es agendar 15 min con nuestro Director Comercial. " +
    "¿Qué día te viene bien esta semana — mañana o tarde? O elige un horario aquí: https://getboost.digital/booking",
};

export type MeetingOfferResult = {
  reply: string;
  appended: boolean;
  reason?: string;
  lang?: ConciergeLang;
};

/**
 * Se o utilizador pediu proposta/orçamento e a resposta ainda não oferece
 * agendar reunião, acrescenta um convite curto (formato consistente PT/EN/ES)
 * com horários e link de booking. Corre depois do discovery gate.
 */
export function enforceMeetingOfferOnQuoteRequest(
  history: Array<{ role: string; content: string }>,
  reply: string,
): MeetingOfferResult {
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser || !isQuoteRequest(lastUser.content)) {
    return { reply, appended: false };
  }
  const check = analyzeConciergeReply(reply);
  if (check.hasMeetingInvite) {
    return { reply, appended: false };
  }
  const lang = detectConciergeLang(lastUser.content);
  return {
    reply: reply.trimEnd() + "\n\n" + MEETING_INVITE_TEMPLATES[lang],
    appended: true,
    reason: `quote_request_without_meeting_invite (lang=${lang})`,
    lang,
  };
}




