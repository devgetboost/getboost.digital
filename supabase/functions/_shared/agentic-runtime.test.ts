// Unit tests for the shared agentic runtime helper.
// Run: deno test --allow-net --allow-env supabase/functions/_shared/agentic-runtime.test.ts

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeCostCredits, MODEL_PRICING_PER_1K, logRun } from "./agentic-runtime.ts";

Deno.test("computeCostCredits: returns null with no usage", () => {
  assertEquals(computeCostCredits("google/gemini-3-flash-preview"), null);
  assertEquals(computeCostCredits("x", { inputTokens: 0, outputTokens: 0 }), null);
});

Deno.test("computeCostCredits: applies model pricing", () => {
  const p = MODEL_PRICING_PER_1K["google/gemini-3-flash-preview"];
  const cost = computeCostCredits("google/gemini-3-flash-preview",
    { inputTokens: 1000, outputTokens: 1000 })!;
  assertEquals(cost, Math.round((p.input + p.output) * 1e6) / 1e6);
});

Deno.test("computeCostCredits: falls back to default pricing for unknown model", () => {
  const c = computeCostCredits("unknown/model", { inputTokens: 1000, outputTokens: 0 })!;
  assert(c > 0);
});

Deno.test({
  name: "logRun: never throws when SUPABASE_* env is missing",
  sanitizeOps: false,
  sanitizeResources: false,
  async fn() {
    await logRun({
      agentId: "00000000-0000-0000-0000-000000000000",
      versionId: null,
      model: "google/gemini-3-flash-preview",
      startedAt: Date.now(),
      status: "error",
      errorType: "TEST",
      errorMessage: "simulated",
    });
    assert(true, "logRun swallowed the error as expected");
  },
});
