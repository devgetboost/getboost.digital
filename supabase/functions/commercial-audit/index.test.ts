// Input-schema tests for commercial-audit.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

type Answers = Partial<Record<
  "industry" | "teamSize" | "currentCrm" | "leadVolume" |
  "conversionRate" | "biggestChallenge" | "automationLevel", string
>>;
type Contact = Partial<Record<"name" | "email" | "company" | "phone", string>>;

function validateAuditInput(body: unknown): { ok: boolean; error?: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "empty" };
  const { answers, contact } = body as { answers?: Answers; contact?: Contact };
  if (!contact?.name || !contact?.email) return { ok: false, error: "missing_contact" };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email)) return { ok: false, error: "invalid_email" };
  if (!answers?.industry) return { ok: false, error: "missing_industry" };
  return { ok: true };
}

Deno.test("commercial-audit schema: rejects missing contact", () => {
  assertEquals(validateAuditInput({ answers: { industry: "saas" } }).error, "missing_contact");
});
Deno.test("commercial-audit schema: rejects invalid email", () => {
  assertEquals(
    validateAuditInput({ answers: { industry: "saas" }, contact: { name: "x", email: "bad" } }).error,
    "invalid_email",
  );
});
Deno.test("commercial-audit schema: rejects missing industry", () => {
  assertEquals(
    validateAuditInput({ answers: {}, contact: { name: "x", email: "a@b.co" } }).error,
    "missing_industry",
  );
});
Deno.test("commercial-audit schema: accepts valid payload", () => {
  assert(validateAuditInput({
    answers: { industry: "saas" },
    contact: { name: "Ana", email: "ana@empresa.pt" },
  }).ok);
});
