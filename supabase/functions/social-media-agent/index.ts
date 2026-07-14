// Social Media Agent — executa as tools do agente e devolve resultados
// prontos a aprovar (nunca publica diretamente).
//
// POST /social-media-agent
// Body: { action, payload, brand? }
//
// Actions suportadas:
//  - gerar_post           { rede, tema, cta?, tom? }
//  - repurpose            { conteudo_base, redes[] }
//  - sugerir_hashtags     { tema, rede }
//  - criar_calendario     { tema_mes, produto, icp, redes[] }
//  - ideias_conteudo      { pilar, icp }
//  - analisar_desempenho  { metricas }
//
// Resposta uniforme:
//  { status: "pending_approval", action, generated_at, brand, payload, output, model }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MODEL = "google/gemini-3-flash-preview";

const ALLOWED_REDES = new Set([
  "instagram", "instagram_stories", "facebook", "linkedin",
  "tiktok", "youtube", "youtube_shorts", "x",
]);

// Limites por rede e funções puras de validação estão em ./validation.ts
// (isolados para poderem ser testados sem arrancar o servidor HTTP).
import {
  LIMITS,
  normalizeHashtags,
  validatePost,
  validateOutput,
  type PostShape,
  type RedeLimits,
  type ValidationIssue,
} from "./validation.ts";


const ACTIONS = new Set([
  "gerar_post", "repurpose", "sugerir_hashtags",
  "criar_calendario", "ideias_conteudo", "analisar_desempenho",
  "aprovar_conteudo", "regenerar_com_correcoes", "publicar",
]);


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sbFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...(init.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

/**
 * Publica um rascunho aprovado através do worker `social-media-publisher`,
 * que já suporta LinkedIn, TikTok e X via gateway. O agente:
 *  1) Confirma que o rascunho está em `approved` ou `scheduled`.
 *  2) Se estiver `approved`, marca-o como `scheduled` (scheduled_at=agora)
 *     para o publisher o poder reclamar imediatamente.
 *  3) Invoca o publisher com { draft_id } e devolve o resultado tal como veio.
 *
 * O publisher já regista `status` (`published` / `scheduled` / `rejected`) e o
 * erro em `notes` do próprio rascunho — não duplicamos logging aqui.
 */
async function handlePublicar(payload: any) {
  const draftId = String(payload?.draft_id ?? "").trim();
  if (!draftId) {
    return { httpStatus: 400, body: { error: "draft_id é obrigatório", code: "missing_draft_id" } };
  }

  const rows = await sbFetch(
    `social_media_drafts?select=id,status,rede,output&id=eq.${encodeURIComponent(draftId)}`,
  ) as Array<{ id: string; status: string; rede: string | null; output: any }>;
  const draft = Array.isArray(rows) ? rows[0] : null;
  if (!draft) {
    return { httpStatus: 404, body: { error: "rascunho não encontrado", code: "draft_not_found" } };
  }

  const publishable = new Set(["approved", "scheduled", "rejected", "error"]);
  if (!publishable.has(draft.status)) {
    return {
      httpStatus: 409,
      body: {
        error: `rascunho em status "${draft.status}" — apenas approved/scheduled/rejected/error podem ser publicados`,
        code: "invalid_status",
        current_status: draft.status,
      },
    };
  }

  // Passo 1: garantir que o publisher pode reclamar o draft. Ele aceita
  // scheduled/rejected/error via draft_id, mas não 'approved'.
  if (draft.status === "approved") {
    await sbFetch(`social_media_drafts?id=eq.${encodeURIComponent(draftId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "scheduled", scheduled_at: new Date().toISOString() }),
    });
  }

  // Passo 2: invocar o worker publisher (mesmo projecto, service role).
  const pubRes = await fetch(`${SUPABASE_URL}/functions/v1/social-media-publisher`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ draft_id: draftId }),
  });
  const pubText = await pubRes.text();
  let pubJson: any = null;
  try { pubJson = pubText ? JSON.parse(pubText) : null; } catch { pubJson = { raw: pubText }; }

  // Ler estado final para devolver ao chamador (status, published_at, notes).
  const finalRows = await sbFetch(
    `social_media_drafts?select=id,status,rede,published_at,notes,scheduled_at&id=eq.${encodeURIComponent(draftId)}`,
  ) as Array<any>;
  const finalDraft = Array.isArray(finalRows) ? finalRows[0] : null;
  const result = Array.isArray(pubJson?.results) ? pubJson.results.find((r: any) => r?.id === draftId) : null;

  return {
    httpStatus: pubRes.ok ? 200 : 502,
    body: {
      publisher_ok: pubRes.ok,
      draft: finalDraft,
      publish_status: result?.status ?? finalDraft?.status ?? null,
      external_error: result?.error ?? null,
      attempts: result?.attempts ?? null,
      raw_publisher_response: pubJson,
    },
  };
}


/**
 * Handles the approval flow. Persists a draft to `social_media_drafts`.
 * Payload:
 *   {
 *     draft_id?: uuid,             // update existing; else create
 *     decision: "approve"|"reject"|"schedule"|"save",
 *     scheduled_at?: ISO string,   // required if decision="schedule"
 *     notes?: string,
 *     // Snapshot fields (usually copied from a previous gerar_post/repurpose response):
 *     rede?, action?, brand?, payload?, output?, validation?, model?
 *   }
 */
async function handleAprovarConteudo(payload: any, brand: Brand) {
  const decision = String(payload?.decision ?? "save").toLowerCase();
  const validDecisions = new Set(["approve", "reject", "schedule", "save"]);
  if (!validDecisions.has(decision)) {
    throw new Error(`decision inválida. Usa uma de: ${[...validDecisions].join(", ")}`);
  }

  const statusMap: Record<string, string> = {
    approve: "approved",
    reject: "rejected",
    schedule: "scheduled",
    save: "pending",
  };
  const status = statusMap[decision];

  if (decision === "schedule" && !payload?.scheduled_at) {
    throw new Error("scheduled_at é obrigatório quando decision=schedule");
  }

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    status,
    notes: payload?.notes ?? null,
    scheduled_at: payload?.scheduled_at ?? null,
    approved_at: (decision === "approve" || decision === "schedule") ? now : null,
  };

  let draft;
  if (payload?.draft_id) {
    draft = await sbFetch(
      `social_media_drafts?id=eq.${encodeURIComponent(payload.draft_id)}`,
      { method: "PATCH", body: JSON.stringify(row) },
    );
    if (!Array.isArray(draft) || draft.length === 0) {
      throw new Error(`draft ${payload.draft_id} não encontrado`);
    }
    draft = draft[0];
  } else {
    const insertRow = {
      ...row,
      rede: payload?.rede ?? payload?.output?.rede ?? null,
      action: payload?.action ?? "gerar_post",
      brand: brand ?? {},
      payload: payload?.payload ?? {},
      output: payload?.output ?? {},
      validation: payload?.validation ?? {},
      model: payload?.model ?? MODEL,
    };
    const inserted = await sbFetch("social_media_drafts", {
      method: "POST",
      body: JSON.stringify(insertRow),
    });
    draft = Array.isArray(inserted) ? inserted[0] : inserted;
  }

  return {
    status: status === "approved" || status === "scheduled" ? "approved" : status,
    decision,
    draft,
  };
}


type Brand = {
  nome?: string;
  tom?: string;
  do?: string;
  dont?: string;
  icp?: string;
  produto?: string;
};

function bad(status: number, error: string, opts: { code?: string; details?: unknown; reqId?: string } = {}) {
  const body = {
    error,
    code: opts.code ?? (status >= 500 ? "internal_error" : "bad_request"),
    details: opts.details ?? undefined,
    request_id: opts.reqId,
  };
  log("warn", "response_error", { status, ...body });
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function log(level: "info" | "warn" | "error", event: string, data: Record<string, unknown> = {}) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    fn: "social-media-agent",
    event,
    ...data,
  });
  (level === "error" ? console.error : level === "warn" ? console.warn : console.log)(line);
}

function extractJson(raw: string): unknown {
  if (!raw) throw new Error("empty response");
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = s.search(/[\{\[]/);
  if (start === -1) throw new Error("no JSON found");
  const openChar = s[start];
  const closeChar = openChar === "[" ? "]" : "}";
  const end = s.lastIndexOf(closeChar);
  if (end === -1 || end < start) throw new Error("no JSON end");
  s = s.substring(start, end + 1);
  try { return JSON.parse(s); }
  catch {
    const fixed = s.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, " ");
    return JSON.parse(fixed);
  }
}

function brandBlock(b: Brand): string {
  const parts = [
    b.nome && `Marca: ${b.nome}`,
    b.tom && `Tom: ${b.tom}`,
    b.icp && `ICP: ${b.icp}`,
    b.produto && `Produto/serviço: ${b.produto}`,
    b.do && `Faz: ${b.do}`,
    b.dont && `Não faz: ${b.dont}`,
  ].filter(Boolean);
  return parts.length ? `\n\nContexto da marca:\n- ${parts.join("\n- ")}` : "";
}

function limitsBlock(redes: string[]): string {
  const lines = redes
    .filter((r) => LIMITS[r])
    .map((r) => {
      const l = LIMITS[r];
      return `- ${r}: máx ${l.max_chars} car. no corpo, ${l.hashtags_min}-${l.hashtags_max} hashtags, formatos permitidos: ${l.formatos.join("/")}${l.notas ? ` (${l.notas})` : ""}`;
    });
  return lines.length ? `\n\nLimites obrigatórios por rede:\n${lines.join("\n")}` : "";
}

const BASE_SYSTEM = `És um Social Media Manager sénior.
Regras absolutas:
- Nunca inventes preços, features nem casos de sucesso.
- Cumpre RIGOROSAMENTE os limites por rede indicados no prompt (tamanho, hashtags, formatos). Se não couberes, encurta — nunca ultrapasses.
- Hashtags: apenas dentro da faixa min-max indicada, sem "#" duplicados, sem espaços.
- Devolve SEMPRE JSON válido, sem markdown fences, sem prosa fora do JSON.
- Nunca publiques nada — apenas propões conteúdo para revisão humana.`;


async function callAI(system: string, user: string): Promise<string> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

// ── Prompt builders ────────────────────────────────────────────

function promptGerarPost(p: any, b: Brand) {
  const rede = String(p.rede || "").toLowerCase();
  if (!ALLOWED_REDES.has(rede)) throw new Error(`rede inválida: ${rede}`);
  return {
    system: BASE_SYSTEM,
    user: `Gera 1 post nativo para ${rede} sobre "${p.tema}". CTA: ${p.cta ?? "à tua escolha"}. Tom: ${p.tom ?? b.tom ?? "próximo, direto"}.${brandBlock(b)}${limitsBlock([rede])}

Devolve JSON:
{ "rede": "${rede}", "titulo_opcional": "", "corpo": "", "hashtags": [], "cta": "", "notas_publicacao": "" }`,
  };
}

/**
 * Re-geração cirúrgica: recebe o output anterior + issues e pede ao modelo para
 * corrigir APENAS os campos assinalados, preservando tudo o resto. Reutiliza o
 * shape/validador de `gerar_post`.
 */
function promptRegenerarComCorreccoes(p: any, b: Brand) {
  const rede = String(p.rede || p.previous_output?.rede || "").toLowerCase();
  if (!ALLOWED_REDES.has(rede)) throw new Error(`rede inválida: ${rede}`);
  const prev = p.previous_output ?? {};
  const issues = Array.isArray(p.issues) ? p.issues : [];
  const issuesBlock = issues.length
    ? issues.map((i: any) => `- [${i.severity ?? "warning"}] ${i.field ?? "?"}: ${i.message ?? ""}`).join("\n")
    : "- (nenhuma; devolver output idêntico ao anterior)";
  return {
    system: BASE_SYSTEM,
    user: `Corrige o post abaixo APENAS nos campos assinalados nos issues. Preserva EXACTAMENTE tudo o resto (mesmo tema, mesmo tom, mesmo CTA, mesma voz). Não reescrevas do zero.

Rede: ${rede}${brandBlock(b)}${limitsBlock([rede])}

Issues a corrigir (só estes):
${issuesBlock}

Output anterior (JSON):
${JSON.stringify(prev, null, 2)}

Devolve JSON no mesmo shape:
{ "rede": "${rede}", "titulo_opcional": "", "corpo": "", "hashtags": [], "cta": "", "notas_publicacao": "" }`,
  };
}

function promptRepurpose(p: any, b: Brand) {
  const redes: string[] = Array.isArray(p.redes) ? p.redes.filter((r: string) => ALLOWED_REDES.has(r)) : [];
  if (!redes.length) throw new Error("redes[] vazio ou inválido");
  return {
    system: BASE_SYSTEM,
    user: `Adapta o conteúdo abaixo para cada rede em ${JSON.stringify(redes)}, respeitando as boas práticas de cada uma.${brandBlock(b)}${limitsBlock(redes)}

Conteúdo base:
"""
${p.conteudo_base}
"""

Devolve JSON: { "versoes": { "<rede>": { "corpo": "", "hashtags": [], "cta": "" } } }`,
  };
}

function promptHashtags(p: any) {
  const rede = String(p.rede || "").toLowerCase();
  if (!ALLOWED_REDES.has(rede)) throw new Error(`rede inválida: ${rede}`);
  return {
    system: BASE_SYSTEM,
    user: `Sugere hashtags para ${rede} sobre "${p.tema}".${limitsBlock([rede])}
Devolve JSON: { "rede": "${rede}", "nicho": [], "amplas": [], "trend": [] }`,
  };
}

function promptCalendario(p: any, b: Brand) {
  const redes: string[] = Array.isArray(p.redes) ? p.redes.filter((r: string) => ALLOWED_REDES.has(r)) : [];
  if (!redes.length) throw new Error("redes[] vazio ou inválido");
  return {
    system: BASE_SYSTEM,
    user: `Cria calendário editorial de 7 dias. Tema do mês: "${p.tema_mes}". Produto: "${p.produto ?? b.produto ?? ""}". ICP: "${p.icp ?? b.icp ?? ""}". Redes: ${JSON.stringify(redes)}.
Alterna pilares (educativo, prova social, bastidores, produto, entretenimento). 1 conteúdo âncora por semana.${brandBlock(b)}${limitsBlock(redes)}

Devolve JSON: { "dias": [ { "dia": 1, "rede": "", "formato": "", "pilar": "", "ideia": "", "hook": "", "cta": "", "ancora": false } ] }`,
  };
}

function promptIdeias(p: any, b: Brand) {
  return {
    system: BASE_SYSTEM,
    user: `Gera 20 ideias de conteúdo para o pilar "${p.pilar}" e ICP "${p.icp ?? b.icp ?? ""}".${brandBlock(b)}

Devolve JSON: { "ideias": [ { "n": 1, "formato": "", "hook": "", "angle": "" } ] }`,
  };
}

function promptAnalise(p: any) {
  return {
    system: BASE_SYSTEM,
    user: `Analisa estas métricas e propõe 5 ajustes concretos para a próxima semana.
Métricas:
${JSON.stringify(p.metricas, null, 2)}

Devolve JSON: { "insights": [], "acoes": [ { "prioridade": "alta|media|baixa", "acao": "" } ] }`,
  };
}

// ── Validação pós-geração: ver ./validation.ts ────────────────


// Devolve uma tabela de limites — no modo debug=force_warnings devolve uma
// cópia com valores drasticamente reduzidos para garantir que qualquer output
// do modelo dispara warnings de truncatura / hashtags.
function resolveLimits(debug?: string | null): Record<string, RedeLimits> {
  if (debug !== "force_warnings") return LIMITS;
  const shrunk: Record<string, RedeLimits> = {};
  for (const [rede, l] of Object.entries(LIMITS)) {
    shrunk[rede] = {
      ...l,
      max_chars: 20,
      hashtags_min: 20,
      hashtags_max: 1,
    };
  }
  return shrunk;
}

// Merge per-author overrides onto the base limits. Missing/invalid override
// fields fall back to the base defaults so incomplete rows still work.
async function loadAuthorLimits(
  authorId: string | null | undefined,
  base: Record<string, RedeLimits>,
): Promise<Record<string, RedeLimits>> {
  if (!authorId) return base;
  try {
    const rows = await sbFetch(
      `social_media_author_limits?select=rede,max_chars,hashtags_min,hashtags_max&user_id=eq.${encodeURIComponent(authorId)}`,
    ) as Array<{ rede: string; max_chars: number | null; hashtags_min: number | null; hashtags_max: number | null }>;
    if (!Array.isArray(rows) || rows.length === 0) return base;
    const merged: Record<string, RedeLimits> = { ...base };
    for (const row of rows) {
      const rede = String(row.rede || "").toLowerCase();
      const b = base[rede];
      if (!b) continue;
      merged[rede] = {
        ...b,
        max_chars: typeof row.max_chars === "number" ? row.max_chars : b.max_chars,
        hashtags_min: typeof row.hashtags_min === "number" ? row.hashtags_min : b.hashtags_min,
        hashtags_max: typeof row.hashtags_max === "number" ? row.hashtags_max : b.hashtags_max,
      };
    }
    return merged;
  } catch (e) {
    log("warn", "author_limits_load_failed", { authorId, error: (e as Error).message });
    return base;
  }
}

// validateOutput vive em ./validation.ts


// ── Handler ────────────────────────────────────────────────────



serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reqId = crypto.randomUUID();
  const t0 = performance.now();
  if (req.method !== "POST") return bad(405, "Method not allowed", { code: "method_not_allowed", reqId });

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug");
  const baseLimits = resolveLimits(debug);

  let body: any;
  let rawText = "";
  try {
    rawText = await req.text();
    body = rawText ? JSON.parse(rawText) : {};
  } catch (e) {
    return bad(400, "JSON inválido no corpo do pedido", {
      code: "invalid_json",
      reqId,
      details: { parse_error: (e as Error).message, body_preview: rawText.slice(0, 200) },
    });
  }

  const { action, payload, brand, author_id: bodyAuthorId } = body ?? {};
  const authorId = typeof bodyAuthorId === "string" && bodyAuthorId
    ? bodyAuthorId
    : (typeof (payload as any)?.author_id === "string" ? (payload as any).author_id : null);
  log("info", "request_received", { reqId, action, has_payload: !!payload, debug });

  if (!action || typeof action !== "string") {
    return bad(400, "action é obrigatória (string)", { code: "missing_action", reqId });
  }
  if (!ACTIONS.has(action)) {
    return bad(400, `action inválida: "${action}"`, {
      code: "unknown_action",
      reqId,
      details: { received: action, allowed: [...ACTIONS] },
    });
  }
  if (!payload || typeof payload !== "object") {
    return bad(400, "payload é obrigatório (object)", { code: "missing_payload", reqId, details: { action } });
  }

  // Validação de allowlist de rede para acções que a exigem
  const requiresRede = ["gerar_post", "sugerir_hashtags", "regenerar_com_correcoes"];
  if (requiresRede.includes(action)) {
    const rede = String((payload as any).rede ?? "").toLowerCase();
    if (!rede) {
      return bad(400, "payload.rede é obrigatório para esta acção", {
        code: "missing_rede", reqId, details: { action },
      });
    }
    if (!ALLOWED_REDES.has(rede)) {
      return bad(400, `rede não permitida: "${rede}"`, {
        code: "rede_not_allowed",
        reqId,
        details: { received: rede, allowed: [...ALLOWED_REDES], action },
      });
    }
  }

  const b: Brand = (brand && typeof brand === "object") ? brand : {};

  try {
    if (action === "aprovar_conteudo") {
      const result = await handleAprovarConteudo(payload, b);
      log("info", "approval_ok", { reqId, decision: result.decision, ms: Math.round(performance.now() - t0) });
      return new Response(JSON.stringify({
        status: result.status,
        action,
        decision: result.decision,
        draft: result.draft,
        request_id: reqId,
        generated_at: new Date().toISOString(),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "publicar") {
      const r = await handlePublicar(payload);
      log("info", "publish_dispatched", {
        reqId, ms: Math.round(performance.now() - t0),
        publish_status: r.body?.publish_status ?? null,
        external_error: r.body?.external_error ?? null,
      });
      return new Response(JSON.stringify({
        status: r.body?.publish_status === "published" ? "published" : "publish_failed",
        action,
        request_id: reqId,
        generated_at: new Date().toISOString(),
        ...r.body,
      }), {
        status: r.httpStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }




    let built: { system: string; user: string };
    switch (action) {
      case "gerar_post":          built = promptGerarPost(payload, b); break;
      case "regenerar_com_correcoes": built = promptRegenerarComCorreccoes(payload, b); break;
      case "repurpose":           built = promptRepurpose(payload, b); break;
      case "sugerir_hashtags":    built = promptHashtags(payload); break;
      case "criar_calendario":    built = promptCalendario(payload, b); break;
      case "ideias_conteudo":     built = promptIdeias(payload, b); break;
      case "analisar_desempenho": built = promptAnalise(payload); break;
      default: return bad(400, "action não implementada", { code: "action_not_implemented", reqId, details: { action } });
    }

    const raw = await callAI(built.system, built.user);
    let parsed: unknown;
    let jsonFallback = false;
    try { parsed = extractJson(raw); }
    catch (e) {
      jsonFallback = true;
      log("warn", "ai_json_parse_fallback", { reqId, action, error: (e as Error).message, raw_preview: String(raw).slice(0, 300) });
      parsed = { raw };
    }

    const limitsTable = await loadAuthorLimits(authorId, baseLimits);
    const { output, validation } = validateOutput(action, payload, parsed, limitsTable);
    const hasWarnings = Array.isArray(validation?.issues) && validation.issues.length > 0;

    log("info", "response_ok", {
      reqId, action, ms: Math.round(performance.now() - t0),
      validation_ok: !!validation?.ok, issues: validation?.issues?.length ?? 0, json_fallback: jsonFallback,
    });

    return new Response(JSON.stringify({
      status: !validation.ok
        ? "pending_approval_with_warnings"
        : (hasWarnings ? "pending_approval_with_warnings" : "pending_approval"),
      action,
      request_id: reqId,
      debug: debug ?? undefined,
      generated_at: new Date().toISOString(),
      brand: b,
      payload,
      output,
      validation,
      model: MODEL,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    const stack = e instanceof Error ? e.stack : undefined;
    log("error", "unhandled_error", { reqId, action, error: msg, stack });
    return bad(500, msg, { code: "internal_error", reqId });
  }
});
