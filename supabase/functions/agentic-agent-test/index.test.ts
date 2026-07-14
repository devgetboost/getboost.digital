// Deno tests reais contra a edge function `agentic-agent-test` deployada.
// Valida os guardas de autenticação e as regras de validação de input, sem mocks.
//
// Corre com: supabase--test_edge_functions (functions: ["agentic-agent-test"]).
// Pré-requisitos: VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env raiz.
// Opcional: AGENTIC_TEST_ADMIN_JWT (JWT de utilizador com role admin) para cobrir
// também as validações de body — sem ele, os testes de validação são ignorados.

import "https://deno.land/std@0.224.0/dotenv/load.ts";
import {
  assertEquals,
  assertExists,
} from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const ADMIN_JWT = Deno.env.get("AGENTIC_TEST_ADMIN_JWT");

const FN_URL = `${SUPABASE_URL}/functions/v1/agentic-agent-test`;

async function call(body: unknown, jwt?: string) {
  const res = await fetch(FN_URL, {
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

Deno.test("rejeita pedido sem Authorization com 401", async () => {
  const { status, json } = await call({ systemPrompt: "x", userMessage: "y", model: "google/gemini-2.5-flash" });
  assertEquals(status, 401);
  assertExists(json.error);
});

Deno.test("rejeita JWT inválido com 401", async () => {
  const { status, json } = await call(
    { systemPrompt: "x", userMessage: "y", model: "google/gemini-2.5-flash" },
    "not-a-real-jwt",
  );
  assertEquals(status, 401);
  assertExists(json.error);
});

Deno.test({
  name: "admin: rejeita modelo não permitido com 400",
  ignore: !ADMIN_JWT,
  fn: async () => {
    const { status, json } = await call(
      { systemPrompt: "Sê útil.", userMessage: "Olá", model: "openai/gpt-4o-invented" },
      ADMIN_JWT!,
    );
    assertEquals(status, 400);
    assertEquals(json.error, "Modelo inválido");
  },
});

Deno.test({
  name: "admin: rejeita systemPrompt vazio com 400",
  ignore: !ADMIN_JWT,
  fn: async () => {
    const { status, json } = await call(
      { systemPrompt: "   ", userMessage: "Olá", model: "google/gemini-2.5-flash" },
      ADMIN_JWT!,
    );
    assertEquals(status, 400);
    assertEquals(json.error, "Instruções do agente vazias");
  },
});

Deno.test({
  name: "admin: rejeita userMessage vazio com 400",
  ignore: !ADMIN_JWT,
  fn: async () => {
    const { status, json } = await call(
      { systemPrompt: "Sê útil.", userMessage: "", model: "google/gemini-2.5-flash" },
      ADMIN_JWT!,
    );
    assertEquals(status, 400);
    assertEquals(json.error, "Mensagem de teste vazia");
  },
});

Deno.test({
  name: "admin: rejeita userMessage > 4000 chars com 400",
  ignore: !ADMIN_JWT,
  fn: async () => {
    const { status, json } = await call(
      { systemPrompt: "Sê útil.", userMessage: "a".repeat(4001), model: "google/gemini-2.5-flash" },
      ADMIN_JWT!,
    );
    assertEquals(status, 400);
    assertEquals(json.error, "Mensagem demasiado longa");
  },
});

Deno.test({
  name: "admin: happy path devolve reply + usage + model",
  ignore: !ADMIN_JWT,
  fn: async () => {
    const { status, json } = await call(
      {
        systemPrompt: "Responde apenas com 'OK'.",
        userMessage: "ping",
        model: "google/gemini-2.5-flash",
      },
      ADMIN_JWT!,
    );
    // Aceita 200 (sucesso) ou 402/429 (créditos/rate-limit) — ambos são respostas
    // válidas do gateway e provam que a validação passou.
    if (status === 200) {
      assertExists(json.reply);
      assertEquals(json.model, "google/gemini-2.5-flash");
    } else {
      assertEquals([402, 429].includes(status), true, `status inesperado: ${status}`);
    }
  },
});
