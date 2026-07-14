// Input-schema tests for blog-ai-assist.
// Focus: reject unknown actions and empty payloads without hitting the network.

import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const ALLOWED_ACTIONS = new Set([
  "generate_title", "generate_meta_description", "improve_paragraph", "improve",
  "generate_summary", "summary", "suggest_headings", "seo_suggestions", "seo",
]);

function validateBlogInput(body: unknown): { ok: boolean; error?: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "empty" };
  const { action, content, title } = body as Record<string, unknown>;
  if (typeof action !== "string" || !ALLOWED_ACTIONS.has(action)) {
    return { ok: false, error: "invalid_action" };
  }
  if (action === "generate_title" && !title && !content) return { ok: false, error: "missing_topic" };
  if (["improve_paragraph", "improve", "generate_summary", "summary"].includes(action) && !content) {
    return { ok: false, error: "missing_content" };
  }
  return { ok: true };
}

Deno.test("blog-ai-assist schema: rejects unknown action", () => {
  assertEquals(validateBlogInput({ action: "hack_the_planet" }).error, "invalid_action");
});

Deno.test("blog-ai-assist schema: requires content for improve", () => {
  assertEquals(validateBlogInput({ action: "improve" }).error, "missing_content");
});

Deno.test("blog-ai-assist schema: accepts valid summary payload", () => {
  assert(validateBlogInput({ action: "summary", content: "lorem ipsum" }).ok);
});
