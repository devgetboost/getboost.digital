import { createClient } from "npm:@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

async function decryptPassword(encoded: string): Promise<string> {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const key = await getKey();
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

type Meta = {
  username: string;
  smtp: { host: string; port: number; security: "ssl" | "starttls" | "none" };
};

function sanitize(s: string, max = 512): string {
  // Strip CR/LF to prevent header injection
  return String(s ?? "").replace(/[\r\n]+/g, " ").slice(0, max);
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

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Invalid session" }, 401);

    const body = await req.json();
    const action = String(body.action ?? "send");
    const accountId = String(body.account_id ?? "");
    if (!accountId) return json({ error: "account_id required" }, 400);

    const { data: account, error: accErr } = await userClient
      .from("email_accounts")
      .select("id,email_address,display_name,provider,connection_key,provider_meta,status")
      .eq("id", accountId)
      .maybeSingle();
    if (accErr || !account) return json({ error: "Account not found" }, 404);
    if (account.provider !== "imap") return json({ error: "Not an IMAP/SMTP account" }, 400);
    if (!account.connection_key) return json({ error: "Missing credentials — reconnect the account." }, 412);

    const meta = (account.provider_meta ?? {}) as Meta;
    if (!meta.smtp?.host) return json({ error: "SMTP config missing" }, 400);

    let password: string;
    try {
      password = await decryptPassword(account.connection_key);
    } catch (_e) {
      return json({ error: "Cannot decrypt stored password — reconnect the account." }, 412);
    }

    // Build message
    let to: string, subject: string, content: string, html: string | undefined;
    if (action === "send_test") {
      to = account.email_address;
      subject = "Teste de ligação SMTP — Lovable";
      content =
        `Olá!\r\n\r\nEste é o teste automático da tua ligação SMTP (${meta.smtp.host}:${meta.smtp.port}, ${meta.smtp.security}).\r\n\r\nSe recebeste este email, o envio está a funcionar. ✔️\r\n\r\n— Caixa de Email`;
    } else if (action === "send") {
      to = sanitize(body.to, 320);
      subject = sanitize(body.subject, 512);
      content = String(body.body_text ?? "").slice(0, 200_000);
      const rawHtml = body.body_html ? String(body.body_html) : "";
      html = rawHtml ? rawHtml.slice(0, 400_000) : undefined;
      if (!to || !subject) return json({ error: "to and subject required" }, 400);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) return json({ error: "Invalid recipient" }, 400);
    } else {
      return json({ error: `Unknown action: ${action}` }, 400);
    }


    const useTLS = meta.smtp.security === "ssl";
    const client = new SMTPClient({
      connection: {
        hostname: meta.smtp.host,
        port: meta.smtp.port,
        tls: useTLS,
        auth: { username: meta.username, password },
      },
    });

    try {
      await client.send({
        from: account.display_name
          ? `${sanitize(account.display_name, 120)} <${account.email_address}>`
          : account.email_address,
        to,
        subject,
        content,
        ...(html ? { html } : {}),
      });

    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("SMTP send failed:", msg);
      try { await client.close(); } catch (_) { /* noop */ }
      return json({ error: `SMTP: ${msg}` }, 502);
    }
    await client.close();

    // Log outbound to lead history if the recipient matches a lead
    if (action === "send") {
      try {
        const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        const leadId = body.lead_id
          ? String(body.lead_id)
          : (await admin.from("leads").select("id").ilike("email", to).limit(1).maybeSingle()).data?.id;
        if (leadId) {
          await admin.from("lead_conversation_messages").insert({
            lead_id: leadId,
            direction: "outbound",
            sender: "human",
            content: `${subject}\n\n${content}`.trim(),
            message_type: "email",
            sent_at: new Date().toISOString(),
            metadata: { to, status: "sent", account_id: accountId, provider: "imap" },
          });
        }
      } catch (e) {
        console.error("lead history log failed:", e instanceof Error ? e.message : e);
      }
    }

    return json({ ok: true, to, subject });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("email-imap-smtp-send error:", msg);
    return json({ error: msg }, 500);
  }
});
