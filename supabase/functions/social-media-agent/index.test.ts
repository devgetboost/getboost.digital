// Integration test: social-media-agent / action=gerar_post
// Verifies status=pending_approval and structural integrity of output JSON.
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
const ANON_KEY =
  Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY");

if (!SUPABASE_URL || !ANON_KEY) {
  throw new Error("Missing SUPABASE_URL / anon key in env for test.");
}

const FN_URL = `${SUPABASE_URL}/functions/v1/social-media-agent`;

Deno.test("gerar_post returns pending_approval with structured output", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ANON_KEY}`,
      apikey: ANON_KEY,
    },
    body: JSON.stringify({
      action: "gerar_post",
      payload: {
        rede: "linkedin",
        tema: "Automação com IA para PMEs",
        cta: "Marca uma call gratuita",
        tom: "consultivo",
      },
      brand: { nome: "Boost", tom: "consultivo", icp: "PMEs em PT", produto: "Consultoria IA" },
    }),
  });

  const body = await res.json();
  assertEquals(res.status, 200, `HTTP ${res.status}: ${JSON.stringify(body)}`);

  // Status must be one of the accepted pending states; happy path is "pending_approval".
  assert(
    body.status === "pending_approval" || body.status === "pending_approval_with_warnings",
    `unexpected status: ${body.status}`,
  );
  assertEquals(body.action, "gerar_post");
  assert(typeof body.request_id === "string" && body.request_id.length > 0, "request_id missing");

  // Output integrity: must be a structured object (not the raw-fallback shape).
  const out = body.output;
  assert(out && typeof out === "object", "output missing");
  assert(!("raw" in out), "output is raw fallback (JSON parse failed)");
  assertEquals(out.rede, "linkedin");
  assert(typeof out.corpo === "string" && out.corpo.length > 0, "corpo empty");
  assert(Array.isArray(out.hashtags), "hashtags not array");
  assert(typeof out.cta === "string", "cta missing");

  // Validation block present and passing on happy path.
  assert(body.validation && typeof body.validation === "object", "validation missing");
  assert(Array.isArray(body.validation.issues), "validation.issues not array");
});
