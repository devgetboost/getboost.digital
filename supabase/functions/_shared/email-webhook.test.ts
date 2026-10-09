// Unit tests for the local webhook verifier (R2C).
//
// The scheme replicates `npm:@lovable.dev/webhooks-js` exactly
// (`{timestamp}.{body}` HMAC-SHA256, `sha256=` hex, 5-minute tolerance),
// so vectors here pin the wire protocol for every sender.
// Run with: deno test --allow-env supabase/functions/_shared/email-webhook.test.ts

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { WebhookError, verifyWebhookRequest, verifyWebhookSignature } from "./email-webhook.ts";

async function sign(timestamp: string, body: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${timestamp}.${body}`));
  return "sha256=" + Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function request(body: string, headers: Record<string, string>): Request {
  return new Request("https://example.test/hook", { method: "POST", headers, body });
}

const SECRET = "test-webhook-secret";
const BODY = JSON.stringify({ data: { email: "a@b.co" } });

Deno.test("valid signature verifies", async () => {
  const ts = String(Date.now());
  const req = request(BODY, {
    "x-lovable-timestamp": ts,
    "x-lovable-signature": await sign(ts, BODY, SECRET),
  });
  const r = await verifyWebhookRequest({ req, secret: SECRET });
  assertEquals(r.timestamp, ts);
  assertEquals(JSON.parse(r.body), JSON.parse(BODY));
});

Deno.test("wrong secret fails closed", async () => {
  const ts = String(Date.now());
  const req = request(BODY, {
    "x-lovable-timestamp": ts,
    "x-lovable-signature": await sign(ts, BODY, SECRET),
  });
  try {
    await verifyWebhookRequest({ req, secret: "other-secret" });
    assert(false, "must throw");
  } catch (e) {
    assert(e instanceof WebhookError);
    assertEquals(e.code, "invalid_signature");
  }
});

Deno.test("rotation secrets are tried after the primary", async () => {
  const ts = String(Date.now());
  const req = request(BODY, {
    "x-lovable-timestamp": ts,
    "x-lovable-signature": await sign(ts, BODY, "old-secret"),
  });
  const r = await verifyWebhookRequest({ req, secret: "new-secret", secrets: ["old-secret"] });
  assertEquals(JSON.parse(r.body), JSON.parse(BODY));
});

Deno.test("missing timestamp fails closed", async () => {
  const req = request(BODY, { "x-lovable-signature": "sha256=00" });
  try {
    await verifyWebhookRequest({ req, secret: SECRET });
    assert(false, "must throw");
  } catch (e) {
    assert(e instanceof WebhookError);
    assertEquals(e.code, "missing_timestamp");
  }
});

Deno.test("stale timestamp fails closed", async () => {
  const ts = String(Date.now() - 10 * 60 * 1000);
  const req = request(BODY, {
    "x-lovable-timestamp": ts,
    "x-lovable-signature": await sign(ts, BODY, SECRET),
  });
  try {
    await verifyWebhookRequest({ req, secret: SECRET });
    assert(false, "must throw");
  } catch (e) {
    assert(e instanceof WebhookError);
    assertEquals(e.code, "stale_timestamp");
  }
});

Deno.test("tampered body fails closed", async () => {
  const ts = String(Date.now());
  const req = request(JSON.stringify({ data: { email: "evil@x.co" } }), {
    "x-lovable-timestamp": ts,
    "x-lovable-signature": await sign(ts, BODY, SECRET),
  });
  try {
    await verifyWebhookRequest({ req, secret: SECRET });
    assert(false, "must throw");
  } catch (e) {
    assert(e instanceof WebhookError);
    assertEquals(e.code, "invalid_signature");
  }
});

Deno.test("custom parser errors map to invalid_payload", async () => {
  const ts = String(Date.now());
  const req = request("not-json{{{", {
    "x-lovable-timestamp": ts,
    "x-lovable-signature": await sign(ts, "not-json{{{", SECRET),
  });
  try {
    await verifyWebhookRequest({ req, secret: SECRET, parser: () => JSON.parse("not-json{{{") });
    assert(false, "must throw");
  } catch (e) {
    assert(e instanceof WebhookError);
    assertEquals(e.code, "invalid_payload");
  }
});

Deno.test("missing secret throws missing_secret", async () => {
  const ok = await verifyWebhookSignature({
    signedPayload: "x",
    signature: null,
    secret: "s",
  });
  assertEquals(ok, false);
  try {
    await verifyWebhookSignature({ signedPayload: "x", signature: "sha256=00" });
    assert(false, "must throw");
  } catch (e) {
    assert(e instanceof WebhookError);
    assertEquals(e.code, "missing_secret");
  }
});
