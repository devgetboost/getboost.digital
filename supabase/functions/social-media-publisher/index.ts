import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Draft = {
  id: string;
  rede: string | null;
  action: string;
  status: string;
  output: any;
  scheduled_at: string | null;
  notes: string | null;
};

// ---------- Publishers reais por rede ------------------------------------
// Cada implementação devolve `ok:false` com erro permanente e legível quando
// faltam credenciais/connector, ou propaga o status+body do provider quando
// a chamada falha. Erros transitórios (5xx, 429, timeouts) são tratados no
// wrapper `publishWithRetry` mais abaixo.
const GATEWAY = "https://connector-gateway.lovable.dev";

type PubResult = { ok: boolean; error?: string; external_id?: string };

function pickText(output: any): string {
  if (!output) return "";
  if (typeof output === "string") return output;
  return output.corpo ?? output.texto ?? output.text ?? output.body ?? output.caption ?? "";
}
function pickMediaUrl(output: any): string | null {
  if (!output || typeof output !== "object") return null;
  return output.media_url ?? output.image_url ?? output.video_url ?? null;
}

async function publishLinkedIn(d: Draft): Promise<PubResult> {
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  const KEY = Deno.env.get("LINKEDIN_API_KEY");
  if (!LOVABLE || !KEY) return { ok: false, error: "connector LinkedIn não ligado (LINKEDIN_API_KEY em falta)" };

  // 1) obter author URN (member id) via /v2/userinfo
  const who = await fetch(`${GATEWAY}/linkedin/v2/userinfo`, {
    headers: { Authorization: `Bearer ${LOVABLE}`, "X-Connection-Api-Key": KEY },
  });
  if (!who.ok) return { ok: false, error: `linkedin userinfo ${who.status}: ${await who.text()}` };
  const sub = (await who.json())?.sub;
  if (!sub) return { ok: false, error: "linkedin userinfo sem 'sub'" };
  const authorUrn = `urn:li:person:${sub}`;

  // 2) publicar UGC post
  const text = pickText(d.output);
  if (!text) return { ok: false, error: "output sem texto para publicar" };
  const body = {
    author: authorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text },
        shareMediaCategory: "NONE",
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };
  const res = await fetch(`${GATEWAY}/linkedin/v2/ugcPosts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE}`,
      "X-Connection-Api-Key": KEY,
      "Content-Type": "application/json",
      "X-Restli-Protocol-Version": "2.0.0",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return { ok: false, error: `linkedin ${res.status}: ${await res.text()}` };
  const json = await res.json().catch(() => ({}));
  return { ok: true, external_id: json?.id ?? res.headers.get("x-restli-id") ?? "linkedin-ok" };
}

async function publishTikTok(d: Draft): Promise<PubResult> {
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  const KEY = Deno.env.get("TIKTOK_API_KEY");
  if (!LOVABLE || !KEY) return { ok: false, error: "connector TikTok não ligado (TIKTOK_API_KEY em falta)" };

  // Contrato com o schema: TikTok publica SEMPRE via output.video_url.
  // Não fazemos fallback para media_url — o trigger DB já garante que este
  // campo existe e é http(s), então uma ausência aqui é bug de payload.
  const videoUrl = typeof d.output?.video_url === "string" ? d.output.video_url.trim() : "";
  if (!videoUrl) {
    return { ok: false, error: "payload_invalid: output.video_url em falta (TikTok requer URL público .mp4)" };
  }
  if (!/^https?:\/\/\S+$/i.test(videoUrl)) {
    return { ok: false, error: `payload_invalid: output.video_url inválido (${videoUrl})` };
  }

  // Inicia publicação por URL (PULL_FROM_URL). O upload assíncrono é gerido
  // pela API do TikTok; devolvemos o publish_id como external_id para tracking.
  const res = await fetch(`${GATEWAY}/tiktok/post/publish/video/init/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE}`,
      "X-Connection-Api-Key": KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      post_info: { title: pickText(d.output).slice(0, 150), privacy_level: "SELF_ONLY" },
      source_info: { source: "PULL_FROM_URL", video_url: videoUrl },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    // 4xx (excepto 429) são erros permanentes de payload/credencial: marcamos
    // como payload_invalid para o wrapper não repetir e o draft ir para rejected.
    if (res.status >= 400 && res.status < 500 && res.status !== 429) {
      return { ok: false, error: `payload_invalid: tiktok ${res.status}: ${body}` };
    }
    return { ok: false, error: `tiktok ${res.status}: ${body}` };
  }
  const json = await res.json().catch(() => ({}));
  // TikTok pode devolver 200 com error.code != "ok" (ex.: url_ownership_unverified,
  // spam_risk_video_link, invalid_param). São falhas permanentes de payload.
  const errCode = json?.error?.code;
  if (errCode && errCode !== "ok") {
    return { ok: false, error: `payload_invalid: tiktok ${errCode}: ${json?.error?.message ?? JSON.stringify(json)}` };
  }
  const publishId = json?.data?.publish_id;
  if (!publishId) return { ok: false, error: `payload_invalid: tiktok resposta sem publish_id: ${JSON.stringify(json)}` };
  return { ok: true, external_id: `tiktok:${publishId}` };
}

async function publishX(d: Draft): Promise<PubResult> {
  // X/Twitter usa OAuth1 e não passa pelo gateway. Requer os 4 segredos
  // TWITTER_CONSUMER_KEY/SECRET + TWITTER_ACCESS_TOKEN/SECRET.
  const CK = Deno.env.get("TWITTER_CONSUMER_KEY");
  const CS = Deno.env.get("TWITTER_CONSUMER_SECRET");
  const AT = Deno.env.get("TWITTER_ACCESS_TOKEN");
  const AS = Deno.env.get("TWITTER_ACCESS_TOKEN_SECRET");
  if (!CK || !CS || !AT || !AS) return { ok: false, error: "credenciais X/Twitter em falta (TWITTER_*)" };

  const text = pickText(d.output);
  if (!text) return { ok: false, error: "output sem texto para publicar" };

  // Assinatura OAuth1 minimalista (POST sem parâmetros no body).
  const url = "https://api.x.com/2/tweets";
  const oauth: Record<string, string> = {
    oauth_consumer_key: CK,
    oauth_token: AT,
    oauth_nonce: crypto.randomUUID().replace(/-/g, ""),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: "1.0",
  };
  const enc = (s: string) => encodeURIComponent(s).replace(/[!*'()]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
  const paramStr = Object.keys(oauth).sort().map(k => `${enc(k)}=${enc(oauth[k])}`).join("&");
  const baseStr = `POST&${enc(url)}&${enc(paramStr)}`;
  const signingKey = `${enc(CS)}&${enc(AS)}`;
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(signingKey),
    { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(baseStr));
  const signature = btoa(String.fromCharCode(...new Uint8Array(sigBuf)));
  oauth.oauth_signature = signature;
  const authHeader = "OAuth " + Object.keys(oauth).sort()
    .map(k => `${enc(k)}="${enc(oauth[k])}"`).join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: authHeader, "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 280) }),
  });
  if (!res.ok) return { ok: false, error: `x ${res.status}: ${await res.text()}` };
  const json = await res.json().catch(() => ({}));
  const id = json?.data?.id;
  return id ? { ok: true, external_id: `x:${id}` } : { ok: false, error: `x resposta inválida: ${JSON.stringify(json)}` };
}

// Router: mapeia `rede` → publisher real. Redes não suportadas devolvem erro
// permanente para não entrar em loop de retentativas.
async function publishToNetwork(d: Draft): Promise<PubResult> {
  if (!d.rede) return { ok: false, error: "rede em falta no draft" };
  const rede = d.rede.trim().toLowerCase();
  switch (rede) {
    case "linkedin": return publishLinkedIn(d);
    case "tiktok":   return publishTikTok(d);
    case "x":
    case "twitter":  return publishX(d);
    case "facebook":
    case "instagram":
    case "youtube":
      return { ok: false, error: `rede '${rede}' ainda não suportada (falta connector oficial)` };
    default:
      return { ok: false, error: `rede desconhecida: '${rede}'` };
  }
}

// Erros transitórios: timeouts, quedas de rede, 5xx, rate limits. Devem ser
// tentados de novo antes de contabilizar como falha do draft. Erros
// permanentes (credenciais, payload inválido, "rede em falta", 4xx sem 429)
// falham imediatamente.
function isTransient(err: string | undefined): boolean {
  if (!err) return false;
  return /(timeout|timed out|ECONN|ENOTFOUND|EAI_AGAIN|network|fetch failed|5\d{2}\b|\b429\b|rate.?limit|temporarily|unavailable)/i.test(err);
}

const RETRY_DELAYS_MS = [500, 1500, 4500]; // 3 retries → total ~6.5s (mantém dentro do window do cron)

async function publishWithRetry(
  d: Draft,
): Promise<{ ok: boolean; error?: string; external_id?: string; attempts: number; attempt_log: string[] }> {
  const log: string[] = [];
  for (let attempt = 1; attempt <= RETRY_DELAYS_MS.length + 1; attempt++) {
    let res: { ok: boolean; error?: string; external_id?: string };
    try {
      res = await publishToNetwork(d);
    } catch (e) {
      res = { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
    if (res.ok) return { ...res, attempts: attempt, attempt_log: log };

    log.push(`t${attempt}: ${res.error ?? "erro desconhecido"}`);
    const transient = isTransient(res.error);
    const hasMore = attempt <= RETRY_DELAYS_MS.length;
    if (!transient || !hasMore) {
      return { ok: false, error: res.error, attempts: attempt, attempt_log: log };
    }
    // Backoff exponencial com jitter (±30%) para evitar thundering herd.
    const base = RETRY_DELAYS_MS[attempt - 1];
    const jitter = base * (0.7 + Math.random() * 0.6);
    await new Promise(r => setTimeout(r, jitter));
  }
  return { ok: false, error: "retries exceeded", attempts: RETRY_DELAYS_MS.length + 1, attempt_log: log };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const now = new Date().toISOString();

  // Aceita { draft_id } para reexecução manual de um único draft (ignora scheduled_at).
  let targetId: string | null = null;
  if (req.method === "POST") {
    try {
      const body = await req.json();
      if (body && typeof body.draft_id === "string") targetId = body.draft_id;
    } catch { /* body vazio = corrida do cron */ }
  }

  let query = supabase
    .from("social_media_drafts")
    .select("id,rede,action,status,output,scheduled_at,notes");

  if (targetId) {
    query = query.eq("id", targetId).in("status", ["scheduled", "rejected", "error"]);
  } else {
    query = query.eq("status", "scheduled").lte("scheduled_at", now).limit(50);
  }

  const { data: due, error } = await query;

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Array<{ id: string; status: string; error?: string; skipped?: boolean; attempts?: number }> = [];

  for (const d of (due ?? []) as Draft[]) {
    // Claim atómico: só uma execução consegue mover 'scheduled' → 'publishing'.
    // Em reexecução manual (targetId) aceitamos também 'rejected'/'error'.
    const claimFrom = targetId ? ["scheduled", "rejected", "error"] : ["scheduled"];
    const { data: claimed, error: claimErr } = await supabase
      .from("social_media_drafts")
      .update({ status: "publishing" })
      .eq("id", d.id)
      .in("status", claimFrom)
      .select("id")
      .maybeSingle();

    if (claimErr) {
      results.push({ id: d.id, status: "claim_error", error: claimErr.message });
      continue;
    }
    if (!claimed) {
      // Outra execução já apanhou o draft — idempotência garantida.
      results.push({ id: d.id, status: "skipped", skipped: true });
      continue;
    }

    try {
      const res = await publishWithRetry(d);
      const retryTrace = res.attempts > 1 ? ` (após ${res.attempts} tentativas: ${res.attempt_log.join(" → ")})` : "";
      if (res.ok) {
        await supabase.from("social_media_drafts").update({
          status: "published",
          published_at: new Date().toISOString(),
          notes: res.external_id
            ? `Publicado (${res.external_id})${retryTrace}`
            : (d.notes ?? null),
        }).eq("id", d.id);
        results.push({ id: d.id, status: "published", attempts: res.attempts });
      } else {
        // Só chega aqui se todos os retries falharam ou o erro é permanente.
        const prev = d.notes ?? "";
        const attempts = (prev.match(/\[tentativa (\d+)\]/)?.[1] ? parseInt(RegExp.$1) : 0) + 1;
        // Erros de payload (ex.: TikTok video_url inválido, credenciais em falta)
        // vão direto para 'rejected' — não faz sentido reagendar sem intervenção.
        const isPayload = /^payload_invalid:|em falta|não ligado|não suportada|rede em falta|rede desconhecida/i.test(res.error ?? "");
        const nextStatus = isPayload || attempts >= 3 ? "rejected" : "scheduled";
        const newNotes = `[tentativa ${attempts}] ${res.error ?? "erro desconhecido"}${retryTrace} — ${new Date().toISOString()}`;
        await supabase.from("social_media_drafts").update({
          status: nextStatus,
          notes: newNotes,
        }).eq("id", d.id);
        results.push({ id: d.id, status: nextStatus, error: res.error, attempts: res.attempts });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Devolve ao estado 'scheduled' para nova tentativa; nunca deixa preso em 'publishing'.
      await supabase.from("social_media_drafts").update({
        status: "scheduled",
        notes: `[erro] ${msg} — ${new Date().toISOString()}`,
      }).eq("id", d.id);
      results.push({ id: d.id, status: "error", error: msg });
    }
  }

  return new Response(JSON.stringify({ processed: results.length, results, ran_at: now }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
