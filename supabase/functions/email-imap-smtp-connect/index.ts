import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("EMAIL_CREDENTIAL_ENCRYPTION_KEY");
  if (!raw) throw new Error("EMAIL_CREDENTIAL_ENCRYPTION_KEY not configured");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(raw));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptPassword(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  const buf = new Uint8Array(iv.length + ct.length);
  buf.set(iv, 0);
  buf.set(ct, iv.length);
  return btoa(String.fromCharCode(...buf));
}

// Basic validation
function isValidHost(h: string) {
  return /^[a-zA-Z0-9.-]{3,255}$/.test(h);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);
    const userId = userData.user.id;

    const body = await req.json();

    const email = String(body.email_address ?? "").trim().toLowerCase();
    const displayName = String(body.display_name ?? "").trim();
    const username = String(body.username ?? "").trim();
    const password = String(body.password ?? "");
    const imapHost = String(body.imap_host ?? "").trim();
    const imapPort = Number(body.imap_port);
    const imapSecurity = String(body.imap_security ?? "ssl"); // ssl | starttls | none
    const smtpHost = String(body.smtp_host ?? "").trim();
    const smtpPort = Number(body.smtp_port);
    const smtpSecurity = String(body.smtp_security ?? "ssl");

    const errors: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.email_address = "Email inválido";
    if (email.length > 255) errors.email_address = "Email demasiado longo";
    if (!username) errors.username = "Obrigatório";
    if (username.length > 255) errors.username = "Máx. 255 caracteres";
    if (!password) errors.password = "Obrigatório";
    if (password.length > 1024) errors.password = "Password demasiado longa";
    if (!isValidHost(imapHost)) errors.imap_host = "Host inválido";
    if (!Number.isInteger(imapPort) || imapPort < 1 || imapPort > 65535) errors.imap_port = "Porta inválida (1-65535)";
    if (!["ssl", "starttls", "none"].includes(imapSecurity)) errors.imap_security = "Valor inválido";
    if (!isValidHost(smtpHost)) errors.smtp_host = "Host inválido";
    if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) errors.smtp_port = "Porta inválida (1-65535)";
    if (!["ssl", "starttls", "none"].includes(smtpSecurity)) errors.smtp_security = "Valor inválido";

    if (Object.keys(errors).length) return json({ error: "validation_failed", fields: errors }, 400);

    const encrypted = await encryptPassword(password);

    const { data: account, error: upErr } = await admin
      .from("email_accounts")
      .upsert({
        user_id: userId,
        provider: "imap",
        email_address: email,
        display_name: displayName || email,
        status: "active",
        connection_key: encrypted,
        provider_meta: {
          username,
          imap: { host: imapHost, port: imapPort, security: imapSecurity },
          smtp: { host: smtpHost, port: smtpPort, security: smtpSecurity },
        },
        last_sync_at: new Date().toISOString(),
      }, { onConflict: "user_id,email_address" })
      .select("id,email_address")
      .single();

    if (upErr) return json({ error: `Save account: ${upErr.message}` }, 500);

    return json({ account_id: account.id, email: account.email_address });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("email-imap-smtp-connect error:", msg);
    return json({ error: msg }, 500);
  }
});
