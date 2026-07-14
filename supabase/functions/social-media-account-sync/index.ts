import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GATEWAY = "https://connector-gateway.lovable.dev";

type SyncResult = {
  account_name?: string | null;
  handle?: string | null;
  external_id?: string | null;
  permissions?: string[];
  raw?: Record<string, unknown>;
  ok: boolean;
  error?: string;
};

async function syncLinkedIn(): Promise<SyncResult> {
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  const KEY = Deno.env.get("LINKEDIN_API_KEY");
  if (!LOVABLE || !KEY) return { ok: false, error: "connector LinkedIn não ligado (LINKEDIN_API_KEY em falta)" };
  const res = await fetch(`${GATEWAY}/linkedin/v2/userinfo`, {
    headers: { Authorization: `Bearer ${LOVABLE}`, "X-Connection-Api-Key": KEY },
  });
  if (!res.ok) return { ok: false, error: `linkedin userinfo ${res.status}: ${await res.text()}` };
  const j: any = await res.json().catch(() => ({}));
  const name = j?.name ?? [j?.given_name, j?.family_name].filter(Boolean).join(" ") || null;
  const perms: string[] = [];
  if (j?.email) perms.push("email");
  if (j?.sub) perms.push("openid");
  if (j?.name || j?.given_name) perms.push("profile");
  return {
    ok: true,
    account_name: name,
    handle: j?.email ?? null,
    external_id: j?.sub ? `urn:li:person:${j.sub}` : null,
    permissions: perms,
    raw: j,
  };
}

async function syncTikTok(): Promise<SyncResult> {
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  const KEY = Deno.env.get("TIKTOK_API_KEY");
  if (!LOVABLE || !KEY) return { ok: false, error: "connector TikTok não ligado (TIKTOK_API_KEY em falta)" };
  const res = await fetch(`${GATEWAY}/tiktok/user/info/?fields=open_id,union_id,display_name,avatar_url,username`, {
    headers: { Authorization: `Bearer ${LOVABLE}`, "X-Connection-Api-Key": KEY },
  });
  if (!res.ok) return { ok: false, error: `tiktok user/info ${res.status}: ${await res.text()}` };
  const j: any = await res.json().catch(() => ({}));
  const u = j?.data?.user ?? {};
  return {
    ok: true,
    account_name: u.display_name ?? null,
    handle: u.username ? `@${u.username}` : null,
    external_id: u.open_id ?? null,
    permissions: ["user.info.basic"],
    raw: j,
  };
}

async function syncX(): Promise<SyncResult> {
  const LOVABLE = Deno.env.get("LOVABLE_API_KEY");
  const KEY = Deno.env.get("X_API_KEY") ?? Deno.env.get("TWITTER_API_KEY");
  if (!LOVABLE || !KEY) return { ok: false, error: "connector X (Twitter) não ligado" };
  const res = await fetch(`${GATEWAY}/x/2/users/me?user.fields=username,name,verified,public_metrics`, {
    headers: { Authorization: `Bearer ${LOVABLE}`, "X-Connection-Api-Key": KEY },
  });
  if (!res.ok) return { ok: false, error: `x users/me ${res.status}: ${await res.text()}` };
  const j: any = await res.json().catch(() => ({}));
  const u = j?.data ?? {};
  return {
    ok: true,
    account_name: u.name ?? null,
    handle: u.username ? `@${u.username}` : null,
    external_id: u.id ?? null,
    permissions: ["users.read", "tweet.read"],
    raw: j,
  };
}

async function syncMeta(rede: "instagram" | "facebook", acc: any): Promise<SyncResult> {
  // IG/FB precisam de um Page Access Token por conta (não é um connector Lovable).
  // Guardamos o token em metadata.page_access_token quando o admin liga a conta.
  const token = acc?.metadata?.page_access_token as string | undefined;
  const pageId = acc?.external_id ?? acc?.metadata?.page_id;
  if (!token || !pageId) {
    return { ok: false, error: `${rede} requer 'external_id' (page/ig id) e metadata.page_access_token — liga a conta via Meta OAuth primeiro.` };
  }
  const fields = rede === "instagram"
    ? "id,username,name,profile_picture_url,followers_count"
    : "id,name,username,fan_count,tasks";
  const res = await fetch(`https://graph.facebook.com/v20.0/${pageId}?fields=${fields}&access_token=${encodeURIComponent(token)}`);
  if (!res.ok) return { ok: false, error: `${rede} graph ${res.status}: ${await res.text()}` };
  const j: any = await res.json().catch(() => ({}));
  return {
    ok: true,
    account_name: j?.name ?? null,
    handle: j?.username ? `@${j.username}` : null,
    external_id: j?.id ?? pageId,
    permissions: Array.isArray(j?.tasks) ? j.tasks : (rede === "instagram" ? ["instagram_basic"] : ["pages_read_engagement"]),
    raw: j,
  };
}

async function syncYouTube(acc: any): Promise<SyncResult> {
  const token = acc?.metadata?.oauth_access_token as string | undefined;
  if (!token) return { ok: false, error: "YouTube requer metadata.oauth_access_token (OAuth do Google por conta)." };
  const res = await fetch("https://youtube.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { ok: false, error: `youtube channels ${res.status}: ${await res.text()}` };
  const j: any = await res.json().catch(() => ({}));
  const ch = j?.items?.[0];
  if (!ch) return { ok: false, error: "sem canal YouTube associado ao token" };
  return {
    ok: true,
    account_name: ch?.snippet?.title ?? null,
    handle: ch?.snippet?.customUrl ?? null,
    external_id: ch?.id ?? null,
    permissions: ["youtube.readonly"],
    raw: ch,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { account_id } = await req.json();
    if (!account_id) {
      return new Response(JSON.stringify({ error: "account_id em falta" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: acc, error: e1 } = await sb.from("social_media_accounts").select("*").eq("id", account_id).maybeSingle();
    if (e1 || !acc) {
      return new Response(JSON.stringify({ error: e1?.message ?? "conta não encontrada" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let result: SyncResult;
    switch (String(acc.rede).toLowerCase()) {
      case "linkedin":  result = await syncLinkedIn(); break;
      case "tiktok":    result = await syncTikTok(); break;
      case "x":
      case "twitter":   result = await syncX(); break;
      case "instagram": result = await syncMeta("instagram", acc); break;
      case "facebook":  result = await syncMeta("facebook", acc); break;
      case "youtube":   result = await syncYouTube(acc); break;
      default:
        result = { ok: false, error: `rede '${acc.rede}' sem sync implementado` };
    }

    const now = new Date().toISOString();
    const metadata = {
      ...(acc.metadata ?? {}),
      account_name: result.account_name ?? acc.metadata?.account_name ?? null,
      permissions: result.permissions ?? acc.metadata?.permissions ?? [],
      last_synced_at: now,
      last_sync_ok: result.ok,
      last_sync_error: result.ok ? null : (result.error ?? null),
    };

    const patch: Record<string, unknown> = {
      metadata,
      connection_status: result.ok ? "connected" : "error",
      connection_checked_at: now,
      last_error: result.ok ? null : (result.error ?? "sync falhou"),
      last_error_at: result.ok ? null : now,
    };
    if (result.ok) {
      if (result.handle && !acc.handle) patch.handle = result.handle;
      if (result.external_id && !acc.external_id) patch.external_id = result.external_id;
    }

    const { error: e2 } = await sb.from("social_media_accounts").update(patch).eq("id", account_id);
    if (e2) {
      return new Response(JSON.stringify({ error: e2.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ ok: result.ok, sync: result, metadata }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String((err as Error)?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
