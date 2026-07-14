// Input-schema tests for content-ideas.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

function validateContentIdeasInput(body: unknown): { ok: boolean; error?: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "empty" };
  const { niche, email } = body as Record<string, unknown>;
  if (typeof niche !== "string" || niche.trim().length < 2 || niche.trim().length > 200) {
    return { ok: false, error: "invalid_niche" };
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "invalid_email" };
  }
  return { ok: true };
}

Deno.test("content-ideas schema: rejects short niche", () => {
  assertEquals(validateContentIdeasInput({ niche: "a", email: "a@b.co" }).error, "invalid_niche");
});
Deno.test("content-ideas schema: rejects invalid email", () => {
  assertEquals(validateContentIdeasInput({ niche: "fitness", email: "nope" }).error, "invalid_email");
});
Deno.test("content-ideas schema: accepts valid payload", () => {
  assert(validateContentIdeasInput({ niche: "fitness coaches", email: "a@b.co" }).ok);
});
