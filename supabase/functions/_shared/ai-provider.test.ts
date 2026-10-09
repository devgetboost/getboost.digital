// Unit tests for the provider-neutral AI layer (R2B).
//
// Pure and hermetic: model resolution never touches the network, and the
// fail-closed test deletes the provider keys so no request can fire.
// Run with: deno test --allow-env supabase/functions/_shared/ai-provider.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  chatCompletions,
  DEFAULT_PROVIDER,
  DEEPSEEK_CHAT_MODEL,
  resolveModelName,
  resolveProviderName,
} from "./ai-provider.ts";

Deno.test("default provider is deepseek", () => {
  assertEquals(DEFAULT_PROVIDER, "deepseek");
});

Deno.test("resolveProviderName falls back on unknown values", () => {
  const prev = Deno.env.get("AI_PROVIDER");
  try {
    Deno.env.set("AI_PROVIDER", "deepseek");
    assertEquals(resolveProviderName(), "deepseek");
    Deno.env.set("AI_PROVIDER", "lovable");
    assertEquals(resolveProviderName(), "lovable");
    Deno.env.set("AI_PROVIDER", "openai");
    assertEquals(resolveProviderName(), "deepseek");
    Deno.env.set("AI_PROVIDER", "");
    assertEquals(resolveProviderName(), "deepseek");
  } finally {
    if (prev === undefined) Deno.env.delete("AI_PROVIDER");
    else Deno.env.set("AI_PROVIDER", prev);
  }
});

Deno.test("resolveModelName maps legacy namespaces to deepseek-chat", () => {
  assertEquals(resolveModelName("google/gemini-2.5-flash"), DEEPSEEK_CHAT_MODEL);
  assertEquals(resolveModelName("google/gemini-3-flash-preview"), DEEPSEEK_CHAT_MODEL);
  assertEquals(resolveModelName("openai/gpt-5"), DEEPSEEK_CHAT_MODEL);
  assertEquals(resolveModelName("openai/gpt-4o-invented"), DEEPSEEK_CHAT_MODEL);
  assertEquals(resolveModelName(""), DEEPSEEK_CHAT_MODEL);
  assertEquals(resolveModelName(null), DEEPSEEK_CHAT_MODEL);
  assertEquals(resolveModelName("anything-else"), DEEPSEEK_CHAT_MODEL);
});

Deno.test("resolveModelName passes deepseek ids through", () => {
  assertEquals(resolveModelName("deepseek-chat"), "deepseek-chat");
  assertEquals(resolveModelName("deepseek/deepseek-chat"), "deepseek-chat");
});

Deno.test("chatCompletions fail-closes without a key", async () => {
  const prevProvider = Deno.env.get("AI_PROVIDER");
  const prevDeepseek = Deno.env.get("DEEPSEEK_API_KEY");
  const prevLovable = Deno.env.get("LOVABLE_API_KEY");
  try {
    Deno.env.set("AI_PROVIDER", "deepseek");
    Deno.env.delete("DEEPSEEK_API_KEY");
    const r1 = await chatCompletions({ messages: [{ role: "user", content: "ping" }] });
    assertEquals(r1.ok, false);
    if (!r1.ok) {
      assertEquals(r1.status, 500);
      assertEquals(r1.errorType, "CONFIG");
      assertEquals(r1.errorMessage, "DEEPSEEK_API_KEY not configured");
      assertEquals(r1.provider, "deepseek");
    }

    Deno.env.set("AI_PROVIDER", "lovable");
    Deno.env.delete("LOVABLE_API_KEY");
    const r2 = await chatCompletions({ messages: [{ role: "user", content: "ping" }] });
    assertEquals(r2.ok, false);
    if (!r2.ok) {
      assertEquals(r2.status, 500);
      assertEquals(r2.errorType, "CONFIG");
      assertEquals(r2.errorMessage, "LOVABLE_API_KEY not configured");
      assertEquals(r2.provider, "lovable");
    }
  } finally {
    if (prevProvider === undefined) Deno.env.delete("AI_PROVIDER");
    else Deno.env.set("AI_PROVIDER", prevProvider);
    if (prevDeepseek === undefined) Deno.env.delete("DEEPSEEK_API_KEY");
    else Deno.env.set("DEEPSEEK_API_KEY", prevDeepseek);
    if (prevLovable === undefined) Deno.env.delete("LOVABLE_API_KEY");
    else Deno.env.set("LOVABLE_API_KEY", prevLovable);
  }
});

function stubFetch(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const prev = globalThis.fetch;
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    calls.push({ url, init });
    return handler(url, init);
  }) as typeof fetch;
  return { calls, restore: () => { globalThis.fetch = prev; } };
}

function okResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const CHAT_BODY = {
  choices: [{ message: { role: "assistant", content: "Olá" } }],
  usage: { prompt_tokens: 10, completion_tokens: 5 },
};

function withKey(provider: "deepseek" | "lovable", fn: () => Promise<void>): Promise<void> {
  const prevProvider = Deno.env.get("AI_PROVIDER");
  const prevKey = Deno.env.get(provider === "deepseek" ? "DEEPSEEK_API_KEY" : "LOVABLE_API_KEY");
  Deno.env.set("AI_PROVIDER", provider);
  Deno.env.set(provider === "deepseek" ? "DEEPSEEK_API_KEY" : "LOVABLE_API_KEY", "test-key");
  return fn().finally(() => {
    if (prevProvider === undefined) Deno.env.delete("AI_PROVIDER");
    else Deno.env.set("AI_PROVIDER", prevProvider);
    const name = provider === "deepseek" ? "DEEPSEEK_API_KEY" : "LOVABLE_API_KEY";
    if (prevKey === undefined) Deno.env.delete(name);
    else Deno.env.set(name, prevKey);
  });
}

Deno.test("request mapping: portable OpenAI-compatible body", async () => {
  await withKey("deepseek", async () => {
    const stub = stubFetch(() => okResponse(CHAT_BODY));
    try {
      const r = await chatCompletions({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: "s" }, { role: "user", content: "u" }],
        temperature: 0.4,
        maxTokens: 500,
        jsonMode: true,
      });
      assertEquals(r.ok, true);
      assertEquals(stub.calls.length, 1);
      assertEquals(stub.calls[0].url, "https://api.deepseek.com/chat/completions");
      const sent = JSON.parse(stub.calls[0].init?.body as string);
      assertEquals(sent.model, "deepseek-chat");
      assertEquals(sent.temperature, 0.4);
      assertEquals(sent.max_tokens, 500);
      assertEquals(sent.response_format, { type: "json_object" });
      assertEquals(sent.messages.length, 2);
      // No provider-specific extras may leak into the request.
      assertEquals("service_tier" in sent, false);
      const headers = new Headers(stub.calls[0].init?.headers);
      assertEquals(headers.get("Authorization"), "Bearer test-key");
    } finally {
      stub.restore();
    }
  });
});

Deno.test("request mapping: tools pass through for function calling", async () => {
  await withKey("deepseek", async () => {
    const tools = [{ type: "function", function: { name: "book", description: "d", parameters: {} } }];
    const stub = stubFetch(() => okResponse({
      choices: [{
        message: {
          role: "assistant",
          content: "",
          tool_calls: [{ id: "1", type: "function", function: { name: "book", arguments: "{}" } }],
        },
      }],
      usage: { prompt_tokens: 3, completion_tokens: 2 },
    }));
    try {
      const r = await chatCompletions({
        messages: [{ role: "user", content: "u" }],
        tools,
        toolChoice: "auto",
      });
      assertEquals(r.ok, true);
      if (r.ok) {
        assertEquals(r.toolCalls.length, 1);
        assertEquals(r.toolCalls[0].function.name, "book");
        assertEquals(r.usage, { inputTokens: 3, outputTokens: 2 });
      }
      const sent = JSON.parse(stub.calls[0].init?.body as string);
      assertEquals(sent.tool_choice, "auto");
      assertEquals(sent.tools, tools);
    } finally {
      stub.restore();
    }
  });
});

Deno.test("response mapping: empty choices yield empty text, not a throw", async () => {
  await withKey("deepseek", async () => {
    const stub = stubFetch(() => okResponse({ choices: [] }));
    try {
      const r = await chatCompletions({ messages: [{ role: "user", content: "u" }] });
      assertEquals(r.ok, true);
      if (r.ok) {
        assertEquals(r.text, "");
        assertEquals(r.toolCalls, []);
        assertEquals(r.usage, undefined);
      }
    } finally {
      stub.restore();
    }
  });
});

Deno.test("response mapping: HTTP errors keep status and body", async () => {
  await withKey("deepseek", async () => {
    const stub = stubFetch(() => okResponse({ error: { message: "busy" } }, 429));
    try {
      const r = await chatCompletions({ messages: [{ role: "user", content: "u" }] });
      assertEquals(r.ok, false);
      if (!r.ok) {
        assertEquals(r.status, 429);
        assertEquals(r.errorType, "HTTP_429");
      }
    } finally {
      stub.restore();
    }
  });
});

Deno.test("lovable fallback keeps endpoint, key and mapping", async () => {
  await withKey("lovable", async () => {
    const stub = stubFetch(() => okResponse(CHAT_BODY));
    try {
      const r = await chatCompletions({
        model: "openai/gpt-5-mini",
        messages: [{ role: "user", content: "u" }],
      });
      assertEquals(r.ok, true);
      assertEquals(stub.calls[0].url, "https://ai.gateway.lovable.dev/v1/chat/completions");
      const sent = JSON.parse(stub.calls[0].init?.body as string);
      // Under the lovable provider the stored namespace passes through as-is.
      assertEquals(sent.model, "openai/gpt-5-mini");
      if (r.ok) assertEquals(r.provider, "lovable");
    } finally {
      stub.restore();
    }
  });
});
