// Unit + integration tests for the product-knowledge helper.
// Run: deno test --allow-net --allow-env supabase/functions/_shared/product-knowledge.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  normalizeProductSlug,
  deriveProductSlugFromLead,
  buildProductKnowledgeSection,
  buildProductKnowledgeSectionOrFallback,
  NEUTRAL_PRODUCT_FALLBACK_SECTION,
} from "./product-knowledge.ts";

// ---------- normalizeProductSlug ----------

Deno.test("normalizeProductSlug: aceita slugs da allowlist", () => {
  for (const s of ["qook", "motivae", "hostify", "pikto", "trackfy", "prosafe360", "geral"]) {
    assertEquals(normalizeProductSlug(s), s);
    assertEquals(normalizeProductSlug(s.toUpperCase()), s);
    assertEquals(normalizeProductSlug(`  ${s}  `), s);
  }
});

Deno.test("normalizeProductSlug: rejeita slugs fora da allowlist", () => {
  assertEquals(normalizeProductSlug("outro-produto"), null);
  assertEquals(normalizeProductSlug("qook2"), null);
});

Deno.test("normalizeProductSlug: rejeita input inválido", () => {
  assertEquals(normalizeProductSlug(null), null);
  assertEquals(normalizeProductSlug(undefined), null);
  assertEquals(normalizeProductSlug(""), null);
  assertEquals(normalizeProductSlug("   "), null);
  assertEquals(normalizeProductSlug("qook demo"), null);      // espaço
  assertEquals(normalizeProductSlug("qook!"), null);          // símbolo
  assertEquals(normalizeProductSlug("a".repeat(41)), null);   // demasiado longo
});

// ---------- deriveProductSlugFromLead ----------

Deno.test("deriveProductSlugFromLead: lead nulo → none", () => {
  assertEquals(deriveProductSlugFromLead(null), { slug: null, derivedFrom: "none" });
  assertEquals(deriveProductSlugFromLead(undefined), { slug: null, derivedFrom: "none" });
});

Deno.test("deriveProductSlugFromLead: usa resource_id quando é slug válido", () => {
  assertEquals(
    deriveProductSlugFromLead({ resource_id: "qook", source: null }),
    { slug: "qook", derivedFrom: "resource_id" },
  );
});

Deno.test("deriveProductSlugFromLead: ignora resource_id 'geral' e cai no source", () => {
  assertEquals(
    deriveProductSlugFromLead({ resource_id: "geral", source: "demo:motivae" }),
    { slug: "motivae", derivedFrom: "source_demo_prefix" },
  );
});

Deno.test("deriveProductSlugFromLead: prefixo demo:<slug>", () => {
  assertEquals(
    deriveProductSlugFromLead({ resource_id: null, source: "demo:hostify" }),
    { slug: "hostify", derivedFrom: "source_demo_prefix" },
  );
});

Deno.test("deriveProductSlugFromLead: match por nome no source", () => {
  assertEquals(
    deriveProductSlugFromLead({ resource_id: null, source: "Landing Page Trackfy — Julho" }),
    { slug: "trackfy", derivedFrom: "source_name_match" },
  );
  assertEquals(
    deriveProductSlugFromLead({ resource_id: null, source: "campanha ProSafe360 linkedin" }),
    { slug: "prosafe360", derivedFrom: "source_name_match" },
  );
});

Deno.test("deriveProductSlugFromLead: fallback quando nada bate", () => {
  assertEquals(
    deriveProductSlugFromLead({ resource_id: "algo-random", source: "google-ads" }),
    { slug: null, derivedFrom: "none" },
  );
  assertEquals(
    deriveProductSlugFromLead({ resource_id: null, source: null }),
    { slug: null, derivedFrom: "none" },
  );
});

Deno.test("deriveProductSlugFromLead: prioridade resource_id > demo: > name-match", () => {
  assertEquals(
    deriveProductSlugFromLead({ resource_id: "pikto", source: "demo:hostify — qook" }),
    { slug: "pikto", derivedFrom: "resource_id" },
  );
});

// ---------- buildProductKnowledgeSection (integração com fake supabase) ----------

function fakeSupabase(response: { data: any; error: any }) {
  const chain: any = {
    select: () => chain,
    eq: () => chain,
    maybeSingle: async () => response,
  };
  return { from: () => chain };
}

Deno.test("buildProductKnowledgeSection: slug inválido → '' (fallback)", async () => {
  const sb = fakeSupabase({ data: { pitch: "x" }, error: null });
  assertEquals(await buildProductKnowledgeSection(sb, "invalid slug!"), "");
});

Deno.test("buildProductKnowledgeSection: 'geral' → '' (fallback)", async () => {
  const sb = fakeSupabase({ data: null, error: null });
  assertEquals(await buildProductKnowledgeSection(sb, "geral"), "");
});

Deno.test("buildProductKnowledgeSection: pack ausente → '' (fallback)", async () => {
  const sb = fakeSupabase({ data: null, error: null });
  assertEquals(await buildProductKnowledgeSection(sb, "qook"), "");
});

Deno.test("buildProductKnowledgeSection: erro de BD → '' (fallback)", async () => {
  const sb = fakeSupabase({ data: null, error: { message: "boom" } });
  assertEquals(await buildProductKnowledgeSection(sb, "qook"), "");
});

Deno.test("buildProductKnowledgeSection: is_active=false → '' (fallback)", async () => {
  const sb = fakeSupabase({ data: { pitch: "x", is_active: false }, error: null });
  assertEquals(await buildProductKnowledgeSection(sb, "qook"), "");
});

Deno.test("buildProductKnowledgeSection: pack vazio → '' (fallback)", async () => {
  const sb = fakeSupabase({ data: { is_active: true }, error: null });
  assertEquals(await buildProductKnowledgeSection(sb, "qook"), "");
});

Deno.test("buildProductKnowledgeSection: pack válido → injeta secção", async () => {
  const sb = fakeSupabase({
    data: {
      product_name: "Qook",
      pitch: "POS + gestão para restauração.",
      tone: "próximo, direto",
      is_active: true,
    },
    error: null,
  });
  const out = await buildProductKnowledgeSection(sb, "qook");
  assertEquals(out.includes("## Contexto do produto — Qook"), true);
  assertEquals(out.includes("POS + gestão para restauração."), true);
  assertEquals(out.includes("próximo, direto"), true);
});

// ---------- buildProductKnowledgeSectionOrFallback ----------

Deno.test("buildProductKnowledgeSectionOrFallback: sem slug → devolve secção neutra", async () => {
  const sb = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) };
  assertEquals(await buildProductKnowledgeSectionOrFallback(sb, null), NEUTRAL_PRODUCT_FALLBACK_SECTION);
  assertEquals(await buildProductKnowledgeSectionOrFallback(sb, "slug inválido"), NEUTRAL_PRODUCT_FALLBACK_SECTION);
  assertEquals(await buildProductKnowledgeSectionOrFallback(sb, "geral"), NEUTRAL_PRODUCT_FALLBACK_SECTION);
});

Deno.test("buildProductKnowledgeSectionOrFallback: pack ausente → secção neutra", async () => {
  const sb = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }) };
  assertEquals(await buildProductKnowledgeSectionOrFallback(sb, "qook"), NEUTRAL_PRODUCT_FALLBACK_SECTION);
});

Deno.test("buildProductKnowledgeSectionOrFallback: pack válido → devolve secção do produto", async () => {
  const sb = { from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { product_name: "Qook", pitch: "POS.", is_active: true }, error: null }) }) }) }) };
  const out = await buildProductKnowledgeSectionOrFallback(sb, "qook");
  assertEquals(out.includes("## Contexto do produto — Qook"), true);
  assertEquals(out === NEUTRAL_PRODUCT_FALLBACK_SECTION, false);
});
