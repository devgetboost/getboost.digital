// Meta OAuth flow — connects Facebook Pages + Instagram Business accounts and
// stores per-account page_access_token in social_media_accounts.metadata.
//
// GET  ?action=start&return_to=<url>   (Authorization: Bearer <admin JWT>)
//   → { authorize_url }
// GET  ?code=...&state=<nonce>         (browser redirect from Meta)
//   → 302 to return_to?meta=connected|error

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const META_APP_ID = Deno.env.get("META_APP_ID");
const META_APP_SECRET = Deno.env.get("META_APP_SECRET");

const GRAPH = "https://graph.facebook.com/v20.0";
const REDIRECT_URI = `${SUPABASE_URL.replace(".supabase.co", ".functions.supabase.co")}/meta-oauth`;
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "pages_manage_metadata",
  "pages_messaging",
  "instagram_basic",
  "instagram_manage_messages",
  "instagram_manage_comments",
  "business_management",
].join(",");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function redirect(url: string) {
  return new Response(null, { status: 302, headers: { ...corsHeaders, Location: url } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (!META_APP_ID || !META_APP_SECRET) {
    return json({ error: "META_APP_ID / META_APP_SECRET não configurados" }, 500);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // ---- START: called from the admin UI to get an authorize_url ----
  if (action === "start") {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);
    const jwt = authHeader.slice(7);
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: authErr } = await userClient.auth.getClaims(jwt);
    if (authErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;
    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) return json({ error: "Requer perfil admin" }, 403);

    const returnTo = url.searchParams.get("return_to") ?? `${SUPABASE_URL}/admin/social-media/accounts`;
    const nonce = crypto.randomUUID().replace(/-/g, "");
    await admin.from("meta_oauth_states").insert({ nonce, user_id: userId, return_to: returnTo });

    const authorize = new URL("https://www.facebook.com/v20.0/dialog/oauth");
    authorize.searchParams.set("client_id", META_APP_ID);
    authorize.searchParams.set("redirect_uri", REDIRECT_URI);
    authorize.searchParams.set("state", nonce);
    authorize.searchParams.set("scope", SCOPES);
    authorize.searchParams.set("response_type", "code");
    return json({ authorize_url: authorize.toString() });
  }

  // ---- CALLBACK: Meta redirects browser here with ?code & ?state ----
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errParam = url.searchParams.get("error_description") ?? url.searchParams.get("error");

  // Look up state (needed for redirect target on any exit path)
  let returnTo = `${SUPABASE_URL}`;
  let userId: string | null = null;
  if (state) {
    const { data: st } = await admin.from("meta_oauth_states").select("*").eq("nonce", state).maybeSingle();
    if (st && new Date(st.expires_at).getTime() > Date.now()) {
      userId = st.user_id;
      returnTo = st.return_to ?? returnTo;
      await admin.from("meta_oauth_states").delete().eq("nonce", state);
    }
  }
  const bail = (reason: string) => redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}meta=error&reason=${encodeURIComponent(reason)}`);

  if (errParam) return bail(errParam);
  if (!code || !state || !userId) return bail("state_invalid_or_expired");

  try {
    // 1. Exchange code → short-lived user token
    const tokenRes = await fetch(`${GRAPH}/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`);
    const tokenJson: any = await tokenRes.json();
    if (!tokenRes.ok || !tokenJson?.access_token) return bail(`token_exchange:${tokenJson?.error?.message ?? tokenRes.status}`);
    const shortToken = tokenJson.access_token;

    // 2. Upgrade to long-lived (~60d) user token
    const longRes = await fetch(`${GRAPH}/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`);
    const longJson: any = await longRes.json();
    const userToken = longJson?.access_token ?? shortToken;

    // 3. List pages — each carries its own never-expiring page_access_token
    const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,username,access_token,tasks,instagram_business_account{id,username,name}&access_token=${userToken}`);
    const pagesJson: any = await pagesRes.json();
    if (!pagesRes.ok) return bail(`pages_list:${pagesJson?.error?.message ?? pagesRes.status}`);
    const pages: any[] = pagesJson?.data ?? [];
    if (pages.length === 0) return bail("no_pages_authorized");

    let inserted = 0;
    for (const p of pages) {
      const perms: string[] = Array.isArray(p.tasks) ? p.tasks : [];

      // Facebook Page account
      await admin.from("social_media_accounts").upsert({
        rede: "facebook",
        account_label: p.name ?? `Page ${p.id}`,
        handle: p.username ? `@${p.username}` : null,
        external_id: p.id,
        connection_status: "connected",
        connection_checked_at: new Date().toISOString(),
        status: "active",
        metadata: {
          account_name: p.name,
          permissions: perms,
          page_access_token: p.access_token,
          page_id: p.id,
          last_synced_at: new Date().toISOString(),
          last_sync_ok: true,
        },
      }, { onConflict: "rede,external_id" });
      inserted++;

      // Linked Instagram Business account (if any) — shares the page token
      const ig = p.instagram_business_account;
      if (ig?.id) {
        await admin.from("social_media_accounts").upsert({
          rede: "instagram",
          account_label: ig.name ?? ig.username ?? `IG ${ig.id}`,
          handle: ig.username ? `@${ig.username}` : null,
          external_id: ig.id,
          connection_status: "connected",
          connection_checked_at: new Date().toISOString(),
          status: "active",
          metadata: {
            account_name: ig.name ?? ig.username,
            permissions: ["instagram_basic", "instagram_manage_messages", "instagram_manage_comments"],
            page_access_token: p.access_token,
            page_id: p.id,
            ig_user_id: ig.id,
            last_synced_at: new Date().toISOString(),
            last_sync_ok: true,
          },
        }, { onConflict: "rede,external_id" });
        inserted++;
      }
    }

    return redirect(`${returnTo}${returnTo.includes("?") ? "&" : "?"}meta=connected&count=${inserted}`);
  } catch (err) {
    return bail(`exception:${String((err as Error)?.message ?? err).slice(0, 120)}`);
  }
});
