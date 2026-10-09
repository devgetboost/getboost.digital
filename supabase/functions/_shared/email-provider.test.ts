// Unit tests for the transactional email provider layer (R2C).
//
// Hermetic: fetch is stubbed, secrets are set/restored per test, no network.
// Run with: deno test --allow-env supabase/functions/_shared/email-provider.test.ts

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  EmailProviderError,
  resolveEmailProvider,
  sendEmail,
  unsubscribeUrlForToken,
} from "./email-provider.ts";

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

function okResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...(headers ?? {}) },
  });
}

function withEnv(vars: Record<string, string | undefined>, fn: () => Promise<void>): Promise<void> {
  const prev: Record<string, string | undefined> = {};
  for (const [k] of Object.entries(vars)) prev[k] = Deno.env.get(k);
  for (const [k, v] of Object.entries(vars)) {
    if (v === undefined) Deno.env.delete(k);
    else Deno.env.set(k, v);
  }
  return fn().finally(() => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) Deno.env.delete(k);
      else Deno.env.set(k, v);
    }
  });
}

const BASE_REQ = {
  to: "user@example.test",
  from: "Getboost <noreply@mail.getboost.digital>",
  subject: "Olá",
  html: "<p>Olá</p>",
  text: "Olá",
};

Deno.test("provider defaults to resend", () => {
  assertEquals(resolveEmailProvider(), "resend");
});

Deno.test("missing key throws CONFIG, not a retryable error", async () => {
  await withEnv({ RESEND_API_KEY: undefined, EMAIL_PROVIDER: undefined }, async () => {
    try {
      await sendEmail(BASE_REQ);
      assert(false, "must throw");
    } catch (e) {
      assert(e instanceof EmailProviderError);
      assertEquals(e.message, "RESEND_API_KEY not configured");
      assertEquals(e.status, undefined);
    }
  });
});

Deno.test("request mapping: resend body, auth and idempotency", async () => {
  await withEnv({ RESEND_API_KEY: "re_test", SUPABASE_URL: "https://xyz.supabase.co" }, async () => {
    const stub = stubFetch(() => okResponse({ id: "msg_123" }));
    try {
      const r = await sendEmail({ ...BASE_REQ, idempotencyKey: "idem-1", unsubscribeToken: "tok-abc" });
      assertEquals(r, { id: "msg_123", provider: "resend" });
      assertEquals(stub.calls.length, 1);
      assertEquals(stub.calls[0].url, "https://api.resend.com/emails");
      const headers = new Headers(stub.calls[0].init?.headers);
      assertEquals(headers.get("Authorization"), "Bearer re_test");
      assertEquals(headers.get("Idempotency-Key"), "idem-1");
      const sent = JSON.parse(stub.calls[0].init?.body as string);
      assertEquals(sent.from, BASE_REQ.from);
      assertEquals(sent.to, [BASE_REQ.to]);
      assertEquals(sent.subject, BASE_REQ.subject);
      assertEquals(sent.html, BASE_REQ.html);
      assertEquals(sent.text, BASE_REQ.text);
      assertEquals(
        sent.headers["List-Unsubscribe"],
        "<https://xyz.supabase.co/functions/v1/handle-email-unsubscribe?token=tok-abc>",
      );
      assertEquals(sent.headers["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    } finally {
      stub.restore();
    }
  });
});

Deno.test("request mapping: no unsubscribe headers without a token", async () => {
  await withEnv({ RESEND_API_KEY: "re_test" }, async () => {
    const stub = stubFetch(() => okResponse({ id: "msg_1" }));
    try {
      await sendEmail(BASE_REQ);
      const sent = JSON.parse(stub.calls[0].init?.body as string);
      assertEquals("headers" in sent, false);
    } finally {
      stub.restore();
    }
  });
});

Deno.test("send failure: 429 keeps status and retry-after", async () => {
  await withEnv({ RESEND_API_KEY: "re_test" }, async () => {
    const stub = stubFetch(() => okResponse({ message: "slow down" }, 429, { "retry-after": "45" }));
    try {
      await sendEmail(BASE_REQ);
      assert(false, "must throw");
    } catch (e) {
      assert(e instanceof EmailProviderError);
      assertEquals(e.status, 429);
      assertEquals(e.retryAfterSeconds, 45);
    } finally {
      stub.restore();
    }
  });
});

Deno.test("send failure: 401/403 carry status for the DLQ branch", async () => {
  await withEnv({ RESEND_API_KEY: "re_test" }, async () => {
    for (const status of [401, 403, 422]) {
      const stub = stubFetch(() => okResponse({ message: "nope" }, status));
      try {
        await sendEmail(BASE_REQ);
        assert(false, "must throw");
      } catch (e) {
        assert(e instanceof EmailProviderError);
        assertEquals(e.status, status);
      } finally {
        stub.restore();
      }
    }
  });
});

Deno.test("send failure: network error has no status (counted retry)", async () => {
  await withEnv({ RESEND_API_KEY: "re_test" }, async () => {
    const prev = globalThis.fetch;
    globalThis.fetch = (() => Promise.reject(new Error("boom"))) as typeof fetch;
    try {
      await sendEmail(BASE_REQ);
      assert(false, "must throw");
    } catch (e) {
      assert(e instanceof EmailProviderError);
      assertEquals(e.status, undefined);
    } finally {
      globalThis.fetch = prev;
    }
  });
});

Deno.test("unsubscribeUrlForToken builds the function URL", async () => {
  await withEnv({ SUPABASE_URL: "https://xyz.supabase.co/" }, async () => {
    assertEquals(
      unsubscribeUrlForToken("tok abc"),
      "https://xyz.supabase.co/functions/v1/handle-email-unsubscribe?token=tok%20abc",
    );
  });
  await withEnv({ SUPABASE_URL: undefined }, async () => {
    assertEquals(unsubscribeUrlForToken("tok"), null);
  });
});
