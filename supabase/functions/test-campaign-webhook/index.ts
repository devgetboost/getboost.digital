// Admin-only helper that verifies CAMPAIGN_WEBHOOK_SECRET is configured
// and that the public campaign-webhook function accepts it.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Require an authenticated admin caller
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "unauthenticated" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userRes } = await anon.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return json({ error: "unauthenticated" }, 401);

    const { data: isAdmin } = await admin.rpc("has_role", { _user_id: uid, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const secret = Deno.env.get("CAMPAIGN_WEBHOOK_SECRET");
    if (!secret) {
      return json({
        ok: false,
        configured: false,
        message: "CAMPAIGN_WEBHOOK_SECRET não está configurado nos segredos.",
      });
    }

    const webhookUrl = `${supabaseUrl}/functions/v1/campaign-webhook`;
    const testPayload = { event: "test", "message-id": `test-${Date.now()}` };

    // 1) Missing secret should return 401
    const noSecret = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testPayload),
    });
    const noSecretBody = await noSecret.text();

    // 2) Wrong secret should return 403
    const wrong = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": "invalid-value" },
      body: JSON.stringify(testPayload),
    });
    const wrongBody = await wrong.text();

    // 3) Correct secret should return 200
    const ok = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-webhook-secret": secret },
      body: JSON.stringify(testPayload),
    });
    const okBody = await ok.text();

    const passed = noSecret.status === 401 && wrong.status === 403 && ok.status === 200;

    return json({
      ok: passed,
      configured: true,
      webhook_url: webhookUrl,
      checks: {
        missing_secret: { status: noSecret.status, expected: 401, body: safeParse(noSecretBody) },
        invalid_secret: { status: wrong.status, expected: 403, body: safeParse(wrongBody) },
        valid_secret: { status: ok.status, expected: 200, body: safeParse(okBody) },
      },
    });
  } catch (e) {
    console.error("test-campaign-webhook error", e);
    return json({ ok: false, error: String(e) }, 500);
  }
});

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return s?.slice(0, 200); }
}
