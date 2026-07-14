// Variações de tom e frases (saudações, transições, fechamentos) para
// evitar que a IA repita sempre os mesmos padrões. As listas são curadas
// para manter a persona da Sofia (PT-PT informal-profissional) e cobrir
// também EN/ES para consistência multilingue.

export type PhrasingLang = "pt" | "en" | "es";

export type PhrasingPalette = {
  greetings: string[];      // abrir conversa / primeira mensagem
  acknowledgements: string[]; // reagir a uma resposta do cliente
  transitions: string[];    // ligar 2 ideias ou passar à próxima pergunta
  closings: string[];       // fechar mensagem sem CTA de reunião
};

export const PHRASING: Record<PhrasingLang, PhrasingPalette> = {
  pt: {
    greetings: [
      "Boas 👋",
      "Olá! 👋",
      "Bem-vind@ 👋",
      "Tudo bem? 👋",
      "Que bom ter-te por aqui 👋",
    ],
    acknowledgements: [
      "Faz todo o sentido.",
      "Boa, percebi.",
      "Fixe, obrigado por partilhar.",
      "Certo, apontado ✍️",
      "Percebo perfeitamente.",
      "Boa pergunta.",
    ],
    transitions: [
      "Só mais uma coisa —",
      "Aproveitando —",
      "Antes de avançar,",
      "Já agora,",
      "Ainda no mesmo tema,",
    ],
    closings: [
      "Fico à espera 🙌",
      "Diz-me quando puderes.",
      "Sem pressa 👌",
      "Depois conta-me.",
      "Fico a aguardar.",
    ],
  },
  en: {
    greetings: [
      "Hey 👋",
      "Hi there! 👋",
      "Welcome 👋",
      "Great to have you here 👋",
      "Hello! 👋",
    ],
    acknowledgements: [
      "Makes total sense.",
      "Got it, thanks for sharing.",
      "Noted ✍️",
      "Totally get you.",
      "Great question.",
    ],
    transitions: [
      "One more thing —",
      "While we're at it —",
      "Before moving on,",
      "Quick side note,",
      "Still on the same topic,",
    ],
    closings: [
      "I'll be here 🙌",
      "Let me know when you can.",
      "No rush 👌",
      "Tell me later.",
      "Looking forward to it.",
    ],
  },
  es: {
    greetings: [
      "¡Hola! 👋",
      "¡Buenas! 👋",
      "Bienvenid@ 👋",
      "Qué bueno tenerte por aquí 👋",
      "¡Hey! 👋",
    ],
    acknowledgements: [
      "Tiene todo el sentido.",
      "Perfecto, entendido.",
      "Genial, gracias por contarme.",
      "Apuntado ✍️",
      "Te entiendo perfectamente.",
      "Buena pregunta.",
    ],
    transitions: [
      "Una cosa más —",
      "Aprovechando —",
      "Antes de avanzar,",
      "Por cierto,",
      "Siguiendo el mismo tema,",
    ],
    closings: [
      "Aquí sigo 🙌",
      "Cuéntame cuando puedas.",
      "Sin prisa 👌",
      "Ya me dices.",
      "Quedo atenta.",
    ],
  },
};

/**
 * Intenção detectada na última mensagem do cliente. Cada intenção ajusta o
 * tom das transições e fechamentos (proposta/orçamento = mais consultivo,
 * followup = mais leve e paciente, general = neutro).
 */
export type PhrasingIntent = "proposal" | "quote" | "followup" | "general";

type IntentOverrides = { transitions: string[]; closings: string[] };

const INTENT_OVERRIDES: Record<PhrasingLang, Record<Exclude<PhrasingIntent, "general">, IntentOverrides>> = {
  pt: {
    proposal: {
      transitions: ["Pra desenhar algo à medida,", "Antes de passar isto ao Director Comercial,", "Pra a proposta encaixar mesmo,"],
      closings: ["Assim conseguimos preparar algo à tua medida ✍️", "Com isto já dá pra desenhar a proposta certa 🙌", "Fico a aguardar pra avançar com a proposta."],
    },
    quote: {
      transitions: ["Pra te dar um valor que faça sentido,", "Antes de falar de números,", "Pra o orçamento ser realista,"],
      closings: ["Depois volto com um valor concreto 💬", "Assim já te consigo dar um orçamento honesto 👌", "Fico a aguardar pra fechar os números."],
    },
    followup: {
      transitions: ["Só a dar continuidade —", "A retomar o fio à meada —", "A voltar aqui —"],
      closings: ["Sem pressa, quando puderes 🙌", "Fico por aqui sempre que quiseres retomar.", "Diz-me só quando fizer sentido avançar."],
    },
  },
  en: {
    proposal: {
      transitions: ["To tailor this properly,", "Before I loop in our Commercial Director,", "To make sure the proposal fits,"],
      closings: ["That way we can shape it around you ✍️", "With this we can draft the right proposal 🙌", "I'll wait so we can move the proposal forward."],
    },
    quote: {
      transitions: ["To give you a fair number,", "Before we talk pricing,", "To keep the quote realistic,"],
      closings: ["I'll come back with a concrete number 💬", "That way I can give you an honest quote 👌", "I'll wait to close the numbers."],
    },
    followup: {
      transitions: ["Just picking this back up —", "Circling back —", "Following up here —"],
      closings: ["No rush, whenever you can 🙌", "I'm around whenever you want to pick it back up.", "Just tell me when it makes sense to move on."],
    },
  },
  es: {
    proposal: {
      transitions: ["Para diseñar algo a medida,", "Antes de pasar esto al Director Comercial,", "Para que la propuesta encaje de verdad,"],
      closings: ["Así podemos moldearla contigo ✍️", "Con esto ya podemos preparar la propuesta correcta 🙌", "Quedo atenta para avanzar con la propuesta."],
    },
    quote: {
      transitions: ["Para darte un número que tenga sentido,", "Antes de hablar de precios,", "Para que el presupuesto sea realista,"],
      closings: ["Después vuelvo con un valor concreto 💬", "Así te puedo dar un presupuesto honesto 👌", "Quedo atenta para cerrar los números."],
    },
    followup: {
      transitions: ["Retomando —", "Volviendo aquí —", "Siguiendo el hilo —"],
      closings: ["Sin prisa, cuando puedas 🙌", "Aquí sigo cuando quieras retomarlo.", "Solo dime cuando tenga sentido avanzar."],
    },
  },
};

/** Deteta intenção comercial na mensagem do cliente (heurística multilingue). */
export function detectPhrasingIntent(userMessage: string): PhrasingIntent {
  const t = (userMessage || "").toLowerCase();
  if (!t.trim()) return "general";
  if (/\b(proposta|propuesta|proposal)\b/.test(t)) return "proposal";
  if (/(or[çc]amento|presupuesto|cotiza[cç][aã]o|cotizaci[oó]n|quote|price|preço|precio|quanto\s+custa|cu[aá]nto\s+cuesta|how\s+much)/.test(t)) return "quote";
  if (/(follow[\s-]?up|a\s+dar\s+seguimento|retomar|circle\s+back|acompanhamento|seguimiento|status|novidades|any\s+news|alguma\s+novidade)/.test(t)) return "followup";
  return "general";
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.abs(seed) % arr.length];
}

function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h) ^ input.charCodeAt(i);
  return h;
}

export type PhrasingSample = {
  lang: PhrasingLang;
  intent: PhrasingIntent;
  greeting: string;
  acknowledgement: string;
  transition: string;
  closing: string;
};

/** Amostra uma variação por categoria; se `intent` for específica, transições
 *  e fechamentos vêm do banco intent-specific em vez do genérico. */
export function samplePhrasing(
  lang: PhrasingLang,
  conversationId: string,
  turnIndex: number,
  intent: PhrasingIntent = "general",
): PhrasingSample {
  const p = PHRASING[lang] ?? PHRASING.pt;
  const overrides = intent !== "general" ? INTENT_OVERRIDES[lang]?.[intent] : undefined;
  const base = hash(`${conversationId}:${turnIndex}:${intent}`);
  return {
    lang,
    intent,
    greeting: pick(p.greetings, base),
    acknowledgement: pick(p.acknowledgements, base + 1),
    transition: pick(overrides?.transitions ?? p.transitions, base + 2),
    closing: pick(overrides?.closings ?? p.closings, base + 3),
  };
}

const INTENT_LABELS: Record<PhrasingLang, Record<PhrasingIntent, string>> = {
  pt: { proposal: "proposta", quote: "orçamento", followup: "follow-up", general: "geral" },
  en: { proposal: "proposal", quote: "quote", followup: "follow-up", general: "general" },
  es: { proposal: "propuesta", quote: "presupuesto", followup: "follow-up", general: "general" },
};

/** Bloco de prompt a injectar no system prompt para forçar variação. */
export function buildPhrasingPromptSection(sample: PhrasingSample): string {
  const labels: Record<PhrasingLang, Record<string, string>> = {
    pt: { title: "Variação de tom (usar como inspiração, não copiar literalmente)", g: "Saudação", a: "Reconhecimento", t: "Transição", c: "Fechamento", i: "Intenção detectada", rule: "Alterna entre variantes ao longo da conversa. NÃO repitas a mesma saudação, transição ou fechamento em turnos consecutivos. Ajusta o tom à intenção detectada (proposta = consultivo, orçamento = concreto sobre números, follow-up = leve e paciente)." },
    en: { title: "Tone variation (use as inspiration, do not copy verbatim)", g: "Greeting", a: "Acknowledgement", t: "Transition", c: "Closing", i: "Detected intent", rule: "Alternate variants across the conversation. Do NOT repeat the same greeting, transition or closing in consecutive turns. Adjust tone to the detected intent (proposal = consultative, quote = concrete about numbers, follow-up = light and patient)." },
    es: { title: "Variación de tono (usar como inspiración, no copiar literal)", g: "Saludo", a: "Reconocimiento", t: "Transición", c: "Cierre", i: "Intención detectada", rule: "Alterna variantes a lo largo de la conversación. NO repitas el mismo saludo, transición o cierre en turnos consecutivos. Ajusta el tono a la intención detectada (propuesta = consultivo, presupuesto = concreto en números, follow-up = ligero y paciente)." },
  };
  const l = labels[sample.lang] ?? labels.pt;
  const intentLabel = INTENT_LABELS[sample.lang]?.[sample.intent] ?? sample.intent;
  return `## ${l.title}\n- ${l.i}: ${intentLabel}\n- ${l.g}: "${sample.greeting}"\n- ${l.a}: "${sample.acknowledgement}"\n- ${l.t}: "${sample.transition}"\n- ${l.c}: "${sample.closing}"\n\n${l.rule}`;
}

