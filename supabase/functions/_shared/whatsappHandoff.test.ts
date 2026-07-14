import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  CANNED_HANDOFF_REPLY,
  CANNED_REPLIES,
  cannedReplyFor,
  detectHandoff,
  detectHandoffMatch,
  detectLang,
  type HandoffCategory,
  type HandoffLang,
} from "./whatsappHandoff.ts";

// ─── Categorização ─────────────────────────────────────────────
Deno.test("categoriza pedido explícito de humano", () => {
  assertEquals(detectHandoffMatch("Quero falar com humano")?.category, "human_request");
  assertEquals(detectHandoffMatch("Speak to human please")?.category, "human_request");
  assertEquals(detectHandoffMatch("Passa-me a um operador")?.category, "human_request");
});

Deno.test("categoriza reclamações e temas jurídicos", () => {
  assertEquals(detectHandoffMatch("Isto é uma reclamação")?.category, "complaint_legal");
  assertEquals(detectHandoffMatch("Vou meter processo judicial")?.category, "complaint_legal");
  assertEquals(detectHandoffMatch("Quero reembolso")?.category, "complaint_legal");
  assertEquals(detectHandoffMatch("I want a refund now")?.category, "complaint_legal");
  assertEquals(detectHandoffMatch("Talking to my lawyer")?.category, "complaint_legal");
});

Deno.test("categoriza urgência extrema", () => {
  assertEquals(detectHandoffMatch("URGENTE!!!")?.category, "urgency");
  assertEquals(detectHandoffMatch("Isto é grave")?.category, "urgency");
  assertEquals(detectHandoffMatch("this is serious")?.category, "urgency");
});

Deno.test("mensagens neutras não têm categoria", () => {
  assertEquals(detectHandoffMatch("Olá, bom dia"), null);
  assertEquals(detectHandoffMatch("Preciso de um orçamento"), null);
});

// ─── Deteção de idioma ─────────────────────────────────────────
Deno.test("detecta PT e EN a partir do texto", () => {
  assertEquals(detectLang("Olá, quero falar com humano"), "pt");
  assertEquals(detectLang("Hello, I want to speak to human"), "en");
  assertEquals(detectLang(""), "pt"); // default PT
});

// ─── Cobertura: cada categoria tem canned PT e EN ──────────────
Deno.test("todas as categorias × idiomas têm resposta canned", () => {
  const cats: HandoffCategory[] = ["human_request", "complaint_legal", "urgency"];
  const langs: HandoffLang[] = ["pt", "en"];
  for (const c of cats) {
    for (const l of langs) {
      const msg = cannedReplyFor(c, l);
      assert(msg && msg.length > 0, `faltou canned ${c}/${l}`);
    }
  }
});

// ─── Consistência de tom ───────────────────────────────────────
Deno.test("respostas canned mencionam Nuno e têm próximo passo claro", () => {
  for (const cat of Object.keys(CANNED_REPLIES) as HandoffCategory[]) {
    for (const lang of ["pt", "en"] as HandoffLang[]) {
      const msg = CANNED_REPLIES[cat][lang];
      assert(msg.includes("Nuno"), `${cat}/${lang} não menciona o Nuno: ${msg}`);
      assert(msg.length < 220, `${cat}/${lang} demasiado longa (${msg.length} chars)`);
      // Deve ter exactamente 1 emoji (heurística: caracter fora do ASCII básico e pontuação PT)
      const emojiCount = [...msg].filter((ch) => /\p{Extended_Pictographic}/u.test(ch)).length;
      assertEquals(emojiCount, 1, `${cat}/${lang} deve ter 1 emoji, tem ${emojiCount}`);
    }
  }
});

Deno.test("PT usa tratamento por 'tu' e EN é informal", () => {
  // PT: nenhuma resposta deve usar 'você' (mantém tom informal já assumido nos prompts)
  for (const cat of Object.keys(CANNED_REPLIES) as HandoffCategory[]) {
    const pt = CANNED_REPLIES[cat].pt.toLowerCase();
    assert(!pt.includes("você"), `${cat}/pt não deve usar "você"`);
    const en = CANNED_REPLIES[cat].en.toLowerCase();
    assert(!en.includes("dear sir") && !en.includes("madam"), `${cat}/en deve ser informal`);
  }
});

// ─── Retrocompatibilidade ──────────────────────────────────────
Deno.test("APIs antigas continuam a funcionar", () => {
  assertEquals(detectHandoff("Quero falar com humano"), "falar com humano");
  assertEquals(detectHandoff("mensagem neutra"), null);
  assert(CANNED_HANDOFF_REPLY.includes("Nuno"));
});
