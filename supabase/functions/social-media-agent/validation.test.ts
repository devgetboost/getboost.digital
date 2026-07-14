// Testes unitários das regras de validação por rede (tamanho do corpo,
// hashtags, formatos). Não dependem de rede/HTTP — importam directamente as
// funções puras de ./validation.ts.
import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { LIMITS, normalizeHashtags, validateOutput, validatePost } from "./validation.ts";

// ── normalizeHashtags ─────────────────────────────────────────

Deno.test("normalizeHashtags: adiciona #, remove espaços, dedupe e ignora vazios", () => {
  const out = normalizeHashtags(["ia", "#ia", " marketing ", "  ", null, "growth hack"]);
  assertEquals(out, ["#ia", "#marketing", "#growthhack"]);
});

Deno.test("normalizeHashtags: input não-array devolve []", () => {
  assertEquals(normalizeHashtags(null), []);
  assertEquals(normalizeHashtags("nope"), []);
});

// ── validatePost por rede ─────────────────────────────────────

Deno.test("validatePost: rede desconhecida → error crítico", () => {
  const r = validatePost("mastodon", { corpo: "ola", hashtags: [] });
  assert(!r.ok);
  assertEquals(r.issues[0].severity, "error");
  assertEquals(r.issues[0].field, "rede");
});

Deno.test("validatePost: corpo vazio → error e ok=false", () => {
  const r = validatePost("linkedin", { corpo: "   ", hashtags: [] });
  assert(!r.ok);
  assert(r.issues.some(i => i.field === "corpo" && i.severity === "error"));
});

Deno.test("validatePost: X (280) — corpo demasiado longo é truncado com reticência", () => {
  const corpo = "a".repeat(400);
  const r = validatePost("x", { corpo, hashtags: [] });
  assert(r.ok, "sem errors → ok");
  assertEquals(r.corrected.corpo!.length, LIMITS.x.max_chars);
  assert(r.corrected.corpo!.endsWith("…"));
  assert(r.issues.some(i => i.field === "corpo" && i.severity === "warning"));
});

Deno.test("validatePost: TikTok exige hashtags mínimas (>=3)", () => {
  const r = validatePost("tiktok", { corpo: "hook curto", hashtags: ["#a"] });
  assert(r.issues.some(i => i.field === "hashtags" && /mínimo/.test(i.message)));
});

Deno.test("validatePost: Instagram — hashtags acima do máximo são cortadas para 10", () => {
  const many = Array.from({ length: 15 }, (_, i) => `tag${i}`);
  const r = validatePost("instagram", { corpo: "post", hashtags: many });
  const corrected = r.corrected as { hashtags: string[] };
  assertEquals(corrected.hashtags.length, LIMITS.instagram.hashtags_max);
  assert(r.issues.some(i => i.field === "hashtags" && /máximo/.test(i.message)));
});

Deno.test("validatePost: YouTube — título > 60 car. é truncado com warning", () => {
  const titulo = "T".repeat(90);
  const r = validatePost("youtube", { corpo: "descricao ok", titulo_opcional: titulo, hashtags: [] });
  assertEquals(r.corrected.titulo_opcional!.length, 60);
  assert(r.issues.some(i => i.field === "titulo_opcional"));
});

Deno.test("validatePost: LinkedIn no limite exacto (3000 car.) não gera warning", () => {
  const corpo = "L".repeat(LIMITS.linkedin.max_chars);
  const r = validatePost("linkedin", { corpo, hashtags: [] });
  assertEquals(r.issues.filter(i => i.field === "corpo").length, 0);
  assertEquals(r.corrected.corpo, corpo);
});

Deno.test("validatePost: hashtags são normalizadas antes de contar (dedupe + '#')", () => {
  // "#ia" e "ia" contam como 1 → LinkedIn permite até 3, sem warnings.
  const r = validatePost("linkedin", { corpo: "x", hashtags: ["ia", "#ia", "growth"] });
  const corrected = r.corrected as { hashtags: string[] };
  assertEquals(corrected.hashtags, ["#ia", "#growth"]);
  assertEquals(r.issues.filter(i => i.field === "hashtags").length, 0);
});

// ── validateOutput por acção ─────────────────────────────────

Deno.test("validateOutput(gerar_post): propaga rede do payload e devolve limits", () => {
  const { output, validation } = validateOutput(
    "gerar_post",
    { rede: "x" },
    { corpo: "curto", hashtags: [] },
  );
  assertEquals(output.rede, "x");
  assertEquals(validation.limits?.max_chars, LIMITS.x.max_chars);
  assertEquals(validation.ok, true);
});

Deno.test("validateOutput(gerar_post): output raw fallback → error", () => {
  const { validation } = validateOutput("gerar_post", { rede: "linkedin" }, { raw: "..." });
  assertEquals(validation.ok, false);
});

Deno.test("validateOutput(regenerar_com_correcoes) usa mesma pipeline que gerar_post", () => {
  const { validation } = validateOutput(
    "regenerar_com_correcoes",
    { rede: "tiktok" },
    { corpo: "hook", hashtags: ["#a", "#b", "#c"] },
  );
  assertEquals(validation.ok, true);
  assertEquals(validation.limits?.hashtags_min, LIMITS.tiktok.hashtags_min);
});

Deno.test("validateOutput(repurpose): valida cada rede em versoes[] e sinaliza rede não suportada", () => {
  const { output, validation } = validateOutput("repurpose", {}, {
    versoes: {
      x: { corpo: "a".repeat(500), hashtags: [] },
      mastodon: { corpo: "hi", hashtags: [] },
      linkedin: { corpo: "post ok", hashtags: [] },
    },
  });
  // x é truncado
  assertEquals(output.versoes.x.corpo.length, LIMITS.x.max_chars);
  // mastodon: rede não suportada = error
  assert(validation.issues.some((i: any) => i.rede === "mastodon" && i.severity === "error"));
  assertEquals(validation.ok, false);
});

Deno.test("validateOutput(sugerir_hashtags): total > máximo da rede gera warning", () => {
  const many = Array.from({ length: 5 }, (_, i) => `t${i}`);
  const { validation } = validateOutput("sugerir_hashtags", { rede: "x" }, {
    nicho: many, amplas: many, trend: many,
  });
  assert(validation.issues.some((i: any) => /máximo/.test(i.message)));
});

Deno.test("validateOutput: acção sem validação de limites (ideias_conteudo) devolve ok=true", () => {
  const { validation } = validateOutput("ideias_conteudo", {}, { ideias: [] });
  assertEquals(validation.ok, true);
  assertEquals(validation.issues.length, 0);
});

// ── limitsTable override (limites por autor) ─────────────────

Deno.test("validatePost: limitsTable customizado sobrepõe defaults da rede", () => {
  const custom = { ...LIMITS, linkedin: { ...LIMITS.linkedin, max_chars: 50, hashtags_max: 1 } };
  const r = validatePost("linkedin", { corpo: "a".repeat(200), hashtags: ["#a", "#b", "#c"] }, custom);
  assertEquals(r.corrected.corpo!.length, 50);
  assertEquals((r.corrected as any).hashtags.length, 1);
});
