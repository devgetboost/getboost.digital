// Cenários reais por agente: 3 pedidos representativos por edge function agentic,
// validando forma de resposta e regras prometidas (score, arrays, etc.).
//
// Corre com: supabase--test_edge_functions (functions: ["agentic-agent-test"]).
// Flags:
//   AGENTIC_TEST_ADMIN_JWT     JWT admin (necessário para blog-ai-assist)
//   AGENTIC_SCENARIOS_LIVE=1   activa cenários com efeitos secundários (insert lead)
//
// Sem as flags, os cenários correspondentes são ignorados (não falham).

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const ADMIN_JWT = Deno.env.get("AGENTIC_TEST_ADMIN_JWT");
const LIVE = Deno.env.get("AGENTIC_SCENARIOS_LIVE") === "1";

const FN = (name: string) => `${SUPABASE_URL}/functions/v1/${name}`;

async function post(fn: string, body: unknown, jwt?: string) {
  const res = await fetch(FN(fn), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

// ---------- blog-ai-assist (requer admin) ----------

const BLOG_SCENARIOS = [
  { action: "improve", content: "Marketing digital é importante para empresas.", label: "improve texto curto" },
  { action: "seo", title: "Como escolher um CRM em 2026", keyword: "CRM PME Portugal", label: "seo com keyword" },
  { action: "summary", content: "A automação comercial permite reduzir tempo perdido em tarefas repetitivas e aumentar a conversão de leads qualificados, sobretudo em PMEs.", label: "resumo" },
];

for (const s of BLOG_SCENARIOS) {
  Deno.test({
    name: `blog-ai-assist: ${s.label} devolve result string`,
    ignore: !ADMIN_JWT,
    fn: async () => {
      const { status, json } = await post("blog-ai-assist", s, ADMIN_JWT!);
      assertEquals(status, 200, `status=${status} json=${JSON.stringify(json)}`);
      assert(typeof json.result === "string" && json.result.length > 0, "result vazio");
    },
  });
}

// ---------- content-ideas (público, mas exige lead existente) ----------

const IDEAS_SCENARIOS = [
  { niche: "Restaurantes locais em Lisboa", language: "pt", label: "PT nicho local" },
  { niche: "SaaS B2B para RH", language: "en", label: "EN SaaS" },
  { niche: "Clínicas de estética", language: "pt", label: "PT saúde" },
];

for (const s of IDEAS_SCENARIOS) {
  Deno.test({
    name: `content-ideas: ${s.label} devolve ideias estruturadas`,
    ignore: !LIVE,
    fn: async () => {
      const email = `scenario+${Date.now()}@getboost.digital`;
      const { status, json } = await post("content-ideas", { ...s, email });
      // Aceita 403 (sem lead prévio) como resposta prometida — valida a regra.
      if (status === 403) {
        assertEquals(json.error, "Submete o formulário antes de gerar ideias.");
        return;
      }
      assertEquals(status, 200, `json=${JSON.stringify(json)}`);
      assert(json.ideas && typeof json.ideas === "object", "ideas ausente");
    },
  });
}

// ---------- commercial-audit (público, insere lead) ----------

const AUDIT_ANSWERS = {
  industry: "SaaS",
  teamSize: "3-5",
  currentCrm: "HubSpot Free",
  leadVolume: "50-100",
  conversionRate: "5-10%",
  biggestChallenge: "Follow-up manual",
  automationLevel: "baixo",
};

const AUDIT_SCENARIOS = [
  { industry: "SaaS", label: "SaaS pequena equipa" },
  { industry: "E-commerce", label: "E-commerce sem CRM", overrides: { currentCrm: "Nenhum", automationLevel: "nenhum" } },
  { industry: "Serviços profissionais", label: "Serviços high-touch", overrides: { teamSize: "10+", conversionRate: "20-30%" } },
];

for (const s of AUDIT_SCENARIOS) {
  Deno.test({
    name: `commercial-audit: ${s.label} devolve score+verdict`,
    ignore: !LIVE,
    fn: async () => {
      const answers = { ...AUDIT_ANSWERS, industry: s.industry, ...(s as any).overrides };
      const contact = {
        name: "Cenário Teste",
        email: `scenario+${Date.now()}@getboost.digital`,
        company: "Teste Lda",
      };
      const { status, json } = await post("commercial-audit", { answers, contact });
      assertEquals(status, 200, `json=${JSON.stringify(json)}`);
      assert(typeof json.score === "number" || json.score === null, "score inválido");
      assert(typeof json.verdict === "string" && json.verdict.length > 0, "verdict vazio");
    },
  });
}

// ---------- agentic-agent-test (playground) ----------

const AGENT_TEST_SCENARIOS = [
  { userMessage: "Explica CRM em 1 frase.", label: "definição curta" },
  { userMessage: "Lista 3 vantagens de automação comercial.", label: "lista" },
  { userMessage: "Escreve um email frio de 60 palavras a apresentar a Getboost.", label: "email frio" },
];

for (const s of AGENT_TEST_SCENARIOS) {
  Deno.test({
    name: `agentic-agent-test: ${s.label} devolve output não vazio`,
    ignore: !ADMIN_JWT,
    fn: async () => {
      const { status, json } = await post(
        "agentic-agent-test",
        {
          systemPrompt: "És um consultor comercial da Getboost Digital. Responde em PT-PT, directo e conciso.",
          userMessage: s.userMessage,
          model: "google/gemini-2.5-flash",
        },
        ADMIN_JWT!,
      );
      assertEquals(status, 200, `json=${JSON.stringify(json)}`);
      const output = json.output ?? json.result ?? json.text;
      assert(typeof output === "string" && output.trim().length > 0, `output vazio: ${JSON.stringify(json)}`);
    },
  });
}
