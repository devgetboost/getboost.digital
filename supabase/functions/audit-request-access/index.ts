// Recebe o pedido de auditoria, guarda a lead, envia email com magic link.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TOKEN_TTL_MS = 1000 * 60 * 60 * 72; // 72h

async function signToken(email: string, url: string, expires: number, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const payload = `${email.toLowerCase()}|${url}|${expires}`;
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return `${expires}.${b64}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { url, email, name, company, sector, goal, origin } = body || {};
    if (!url || !email || !company) {
      return new Response(JSON.stringify({ error: "URL, email e empresa obrigatórios." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email inválido." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let normalizedUrl = String(url).trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) normalizedUrl = "https://" + normalizedUrl;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, serviceKey);

    // Save lead (best-effort)
    await sb.from("leads").insert({
      name: name || company,
      email: String(email).trim(),
      message: `Auditoria Digital 360º — ${normalizedUrl}${sector ? ` · ${sector}` : ""}${goal ? ` · ${goal}` : ""}`,
      source: "digital-audit",
    } as never).then(() => {}, (e) => console.warn("lead insert", e));

    const expires = Date.now() + TOKEN_TTL_MS;
    const token = await signToken(email, normalizedUrl, expires, serviceKey);

    const base = (origin && typeof origin === "string" ? origin : "https://getboost.digital").replace(/\/$/, "");
    const auditLink = `${base}/tools/digital-audit?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}&url=${encodeURIComponent(normalizedUrl)}`;

    const { error: sendErr } = await sb.functions.invoke("send-transactional-email", {
      body: {
        templateName: "audit-access-link",
        recipientEmail: String(email).trim(),
        idempotencyKey: `audit-access-${email}-${expires}`,
        templateData: {
          name: name || company,
          websiteUrl: normalizedUrl,
          auditLink,
        },
      },
    });

    if (sendErr) {
      console.error("send error", sendErr);
      return new Response(JSON.stringify({ error: "Falha ao enviar email de confirmação." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro inesperado." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
