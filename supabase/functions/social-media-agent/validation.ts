// Regras puras de validação do social-media-agent (tamanho do corpo, hashtags,
// formatos permitidos por rede). Isolado do index.ts para poder ser testado sem
// arrancar o servidor HTTP.

export type RedeLimits = {
  max_chars: number;
  hashtags_min: number;
  hashtags_max: number;
  formatos: string[];
  notas?: string;
};

export const LIMITS: Record<string, RedeLimits> = {
  instagram:         { max_chars: 2200, hashtags_min: 5, hashtags_max: 10, formatos: ["feed", "carrossel", "reel"] },
  instagram_stories: { max_chars: 200,  hashtags_min: 0, hashtags_max: 3,  formatos: ["story"], notas: "3 slides máx, 1 ideia por slide" },
  facebook:          { max_chars: 2000, hashtags_min: 0, hashtags_max: 3,  formatos: ["texto", "imagem", "video"] },
  linkedin:          { max_chars: 3000, hashtags_min: 0, hashtags_max: 3,  formatos: ["texto", "imagem", "carrossel", "video"] },
  tiktok:            { max_chars: 150,  hashtags_min: 3, hashtags_max: 8,  formatos: ["video"], notas: "legenda curta; hooks nos primeiros 3s" },
  youtube:           { max_chars: 5000, hashtags_min: 0, hashtags_max: 15, formatos: ["video"], notas: "título ≤ 60 car., descrição SEO" },
  youtube_shorts:    { max_chars: 100,  hashtags_min: 1, hashtags_max: 5,  formatos: ["short"], notas: "≤ 60s" },
  x:                 { max_chars: 280,  hashtags_min: 0, hashtags_max: 2,  formatos: ["tweet", "thread"] },
};

export const ALLOWED_REDES = new Set(Object.keys(LIMITS));

export type ValidationIssue = { rede: string; severity: "error" | "warning"; field: string; message: string };
export type PostShape = { rede?: string; corpo?: string; hashtags?: unknown; titulo_opcional?: string; cta?: string };

export function normalizeHashtags(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((h) => String(h ?? "").trim().replace(/\s+/g, ""))
    .filter(Boolean)
    .map((h) => (h.startsWith("#") ? h : `#${h}`))
    .filter((h, i, arr) => arr.indexOf(h) === i);
}

export function validatePost(
  rede: string,
  post: PostShape,
  limitsTable: Record<string, RedeLimits> = LIMITS,
): { corrected: PostShape; issues: ValidationIssue[]; ok: boolean } {
  const issues: ValidationIssue[] = [];
  const limits = limitsTable[rede];
  if (!limits) {
    return { corrected: post, issues: [{ rede, severity: "error", field: "rede", message: `rede desconhecida: ${rede}` }], ok: false };
  }

  const corrected: PostShape = { ...post, rede };

  const corpo = String(post.corpo ?? "");
  if (!corpo.trim()) {
    issues.push({ rede, severity: "error", field: "corpo", message: "corpo vazio" });
  } else if (corpo.length > limits.max_chars) {
    issues.push({ rede, severity: "warning", field: "corpo", message: `corpo com ${corpo.length} car. — excede ${limits.max_chars}, será truncado` });
    corrected.corpo = corpo.slice(0, limits.max_chars - 1) + "…";
  } else {
    corrected.corpo = corpo;
  }

  const tituloLimit = rede === "youtube" ? Math.min(60, limits.max_chars) : null;
  if (rede === "youtube" && post.titulo_opcional && tituloLimit !== null && post.titulo_opcional.length > tituloLimit) {
    issues.push({ rede, severity: "warning", field: "titulo_opcional", message: `título com ${post.titulo_opcional.length} car. — excede ${tituloLimit}, será truncado` });
    corrected.titulo_opcional = post.titulo_opcional.slice(0, tituloLimit);
  }

  const tags = normalizeHashtags(post.hashtags);
  if (tags.length < limits.hashtags_min) {
    issues.push({ rede, severity: "warning", field: "hashtags", message: `${tags.length} hashtags — mínimo ${limits.hashtags_min} para ${rede}` });
  }
  if (tags.length > limits.hashtags_max) {
    issues.push({ rede, severity: "warning", field: "hashtags", message: `${tags.length} hashtags — máximo ${limits.hashtags_max}, será cortado` });
  }
  (corrected as PostShape & { hashtags: string[] }).hashtags = tags.slice(0, limits.hashtags_max);

  const ok = !issues.some((i) => i.severity === "error");
  return { corrected, issues, ok };
}

export function validateOutput(
  action: string,
  payload: any,
  output: any,
  limitsTable: Record<string, RedeLimits> = LIMITS,
): { output: any; validation: any } {
  if (!output || typeof output !== "object" || (output as any).raw) {
    return { output, validation: { ok: false, issues: [{ severity: "error", message: "output não é JSON estruturado" }] } };
  }

  if (action === "gerar_post" || action === "regenerar_com_correcoes") {
    const rede = String(payload?.rede || output.rede || "").toLowerCase();
    const r = validatePost(rede, output as PostShape, limitsTable);
    return {
      output: { ...output, ...r.corrected },
      validation: { ok: r.ok, issues: r.issues, limits: limitsTable[rede] ?? null },
    };
  }

  if (action === "repurpose") {
    const versoes = (output.versoes && typeof output.versoes === "object") ? output.versoes : {};
    const allIssues: ValidationIssue[] = [];
    const correctedVersoes: Record<string, any> = {};
    for (const [rede, post] of Object.entries(versoes)) {
      if (!ALLOWED_REDES.has(rede)) {
        allIssues.push({ rede, severity: "error", field: "rede", message: `rede não suportada: ${rede}` });
        correctedVersoes[rede] = post;
        continue;
      }
      const r = validatePost(rede, post as PostShape, limitsTable);
      correctedVersoes[rede] = r.corrected;
      allIssues.push(...r.issues);
    }
    return {
      output: { ...output, versoes: correctedVersoes },
      validation: { ok: !allIssues.some((i) => i.severity === "error"), issues: allIssues },
    };
  }

  if (action === "sugerir_hashtags") {
    const rede = String(payload?.rede || output.rede || "").toLowerCase();
    const limits = limitsTable[rede];
    const all = [
      ...normalizeHashtags(output.nicho),
      ...normalizeHashtags(output.amplas),
      ...normalizeHashtags(output.trend),
    ];
    const issues: ValidationIssue[] = [];
    if (limits && all.length > limits.hashtags_max) {
      issues.push({ rede, severity: "warning", field: "hashtags", message: `total ${all.length} — máximo ${limits.hashtags_max} para ${rede}` });
    }
    return { output, validation: { ok: true, issues, limits: limits ?? null } };
  }

  return { output, validation: { ok: true, issues: [] } };
}
