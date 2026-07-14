// ─── Handoff: categorização + respostas canned padronizadas (PT/EN) ─────
// Tom consistente: acolhedor, curto (<200 chars), 1ª pessoa em nome do Nuno,
// promessa clara de próximo passo, 1 emoji máximo, sem jargão.

export type HandoffCategory = "human_request" | "complaint_legal" | "urgency";
export type HandoffLang = "pt" | "en" | "es";

interface CategoryConfig {
  category: HandoffCategory;
  keywords: string[];
}

const CATEGORIES: CategoryConfig[] = [
  {
    category: "complaint_legal",
    keywords: [
      "reclamação", "reclamacao", "cancelar contrato", "quero cancelar",
      "reembolso", "devolver dinheiro", "processo judicial", "advogado",
      "complaint", "refund", "lawyer", "legal action", "cancel contract",
    ],
  },
  {
    category: "urgency",
    keywords: [
      "urgente!!!", "isto é grave", "isto e grave",
      "this is serious", "urgent!!!", "emergency",
    ],
  },
  {
    category: "human_request",
    keywords: [
      "falar com humano", "quero falar com alguém", "quero falar com alguem",
      "atendente humano", "pessoa real", "operador", "quero falar com o nuno",
      "falar com o nuno", "chamar um humano",
      "human agent", "speak to human", "talk to a person", "real person", "talk to nuno",
    ],
  },
];

// Mantido para compatibilidade retro (usado em testes existentes)
export const HANDOFF_KEYWORDS = CATEGORIES.flatMap((c) => c.keywords);

export interface HandoffMatch {
  keyword: string;
  category: HandoffCategory;
}

export function detectHandoffMatch(text: string): HandoffMatch | null {
  const s = (text || "").toLowerCase();
  for (const c of CATEGORIES) {
    const hit = c.keywords.find((k) => s.includes(k));
    if (hit) return { keyword: hit, category: c.category };
  }
  return null;
}

// API antiga: só devolve a keyword
export function detectHandoff(text: string): string | null {
  return detectHandoffMatch(text)?.keyword ?? null;
}

// Deteção robusta de idioma (PT/EN/ES) — scoring por contagem, tolerante a mistura.
export function detectLang(text: string): HandoffLang {
  const s = (text || "").toLowerCase();
  if (!s.trim()) return "pt";
  const count = (re: RegExp) => (s.match(re) || []).length;
  const es = count(/\b(hola|gracias|por favor|quiero|necesito|hablar|humano|urgente|reembolso|abogado|presupuesto|precio|cu[áa]nto|reuni[óo]n|agendar|cotizaci[óo]n|s[íi]|tambi[ée]n)\b/g);
  const en = count(/\b(hello|hi|hey|thanks|thank you|please|the|you|your|refund|lawyer|urgent|human|speak|talk|quote|price|meeting|schedule|how much|budget)\b/g);
  const pt = count(/\b(ol[áa]|obrigad\w*|por favor|quero|preciso|falar|humano|reclama\w*|reembolso|advogado|urgente|or[çc]amento|proposta|pre[çc]o|reuni[ãa]o|agendar|marcar|voc[êe])\b/g);
  if (pt === 0 && en === 0 && es === 0) {
    if (/[¿¡ñ]/.test(s)) return "es";
    if (/[ãõç]/.test(s)) return "pt";
    return "pt";
  }
  const scores: [HandoffLang, number][] = [["pt", pt], ["es", es], ["en", en]];
  scores.sort((a, b) => b[1] - a[1]);
  if (scores[0][1] === scores[1][1]) return "pt"; // empate → PT (mercado padrão)
  return scores[0][0];
}


// ─── Respostas canned padronizadas ──────────────────────────────
export const CANNED_REPLIES: Record<HandoffCategory, Record<HandoffLang, string>> = {
  human_request: {
    pt: "Claro — vou passar-te ao Nuno para te responder pessoalmente. Ele vê a conversa e volta a ti em breve. 🙌",
    en: "Of course — I'll hand you over to Nuno so he can reply personally. He'll see the chat and get back to you shortly. 🙌",
    es: "Claro — te paso con Nuno para que te responda personalmente. Verá la conversación y volverá a ti en breve. 🙌",
  },
  complaint_legal: {
    pt: "Lamento pela situação. Vou encaminhar já ao Nuno para tratar disto pessoalmente e com prioridade. Ele volta a ti o mais rápido possível. 🤝",
    en: "I'm sorry about this. I'm escalating to Nuno right away so he can handle it personally and with priority. He'll get back to you as soon as possible. 🤝",
    es: "Lamento la situación. Voy a derivarlo ya a Nuno para que lo trate personalmente y con prioridad. Volverá a ti lo antes posible. 🤝",
  },
  urgency: {
    pt: "Percebido, é urgente. Vou alertar já o Nuno para ele te responder o quanto antes. Fica atento(a) ao WhatsApp. ⚡",
    en: "Understood — this is urgent. I'm alerting Nuno right now so he replies as soon as possible. Keep an eye on WhatsApp. ⚡",
    es: "Entendido, es urgente. Aviso ya a Nuno para que te responda lo antes posible. Estate atento(a) al WhatsApp. ⚡",
  },
};


export function cannedReplyFor(category: HandoffCategory, lang: HandoffLang = "pt"): string {
  return CANNED_REPLIES[category][lang];
}

// Retrocompatibilidade
export const CANNED_HANDOFF_REPLY = CANNED_REPLIES.human_request.pt;
