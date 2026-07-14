import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_BASE_URL = "https://connector-gateway.lovable.dev";
const CONNECTOR_ID = "google_mail";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  "https://www.googleapis.com/auth/gmail.modify",
];

function b64url(input: string): string {
  return btoa(unescape(encodeURIComponent(input)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Wrap a base64 string in 76-char lines (RFC 2045).
function wrap76(s: string): string {
  return s.replace(/.{1,76}/g, (m) => m).match(/.{1,76}/g)?.join("\r\n") ?? s;
}

type Attachment = { name: string; type: string; base64: string };

function buildRawMessage(opts: {
  from: string; to: string; cc?: string; subject: string; body: string;
  bodyHtml?: string; inReplyTo?: string; attachments?: Attachment[];
}): string {
  const headers = [
    `From: ${opts.from}`, `To: ${opts.to}`,
    opts.cc ? `Cc: ${opts.cc}` : "",
    `Subject: ${opts.subject}`,
    'MIME-Version: 1.0',
    opts.inReplyTo ? `In-Reply-To: ${opts.inReplyTo}` : "",
    opts.inReplyTo ? `References: ${opts.inReplyTo}` : "",
  ].filter(Boolean);

  const altBoundary = `alt_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  const buildAlt = (): string[] => {
    if (!opts.bodyHtml) {
      return ['Content-Type: text/plain; charset="UTF-8"', "", opts.body];
    }
    return [
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      "",
      `--${altBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "",
      opts.body,
      `--${altBoundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "",
      opts.bodyHtml,
      `--${altBoundary}--`,
    ];
  };

  if (!opts.attachments?.length) {
    return b64url([...headers, ...buildAlt()].join("\r\n"));
  }

  const boundary = `bnd_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
  const parts: string[] = [
    ...headers,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    ...buildAlt(),
  ];
  for (const a of opts.attachments) {
    parts.push(
      `--${boundary}`,
      `Content-Type: ${a.type}; name="${a.name.replace(/"/g, "")}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${a.name.replace(/"/g, "")}"`,
      "",
      wrap76(a.base64),
    );
  }
  parts.push(`--${boundary}--`, "");
  return b64url(parts.join("\r\n"));
}



function extractEmails(s: string | null | undefined): string[] {
  if (!s) return [];
  return Array.from(s.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)).map((m) => m[0].toLowerCase());
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    const clientKey = Deno.env.get("GOOGLE_MAIL_APP_USER_CONNECTOR_CLIENT_API_KEY");
    if (!lovableKey || !clientKey) {
      return json({ error: "Gmail App User Connector not configured." }, 503);
    }

    const body = await req.json();
    const { action } = body as { action: string };

    // ============ OAuth flow ============
    if (action === "oauth_start") {
      const { return_url } = body as { return_url: string };
      if (!return_url) return json({ error: "return_url required" }, 400);
      const res = await fetch(`${GATEWAY_BASE_URL}/api/v1/app-users/oauth2/authorize`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${lovableKey}`,
          "X-Client-Api-Key": clientKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          app_user_id: userId,
          return_url,
          connector_id: CONNECTOR_ID,
          credentials_configuration: { scopes: GMAIL_SCOPES },
        }),
      });
      const text = await res.text();
      if (!res.ok) return json({ error: `Gateway authorize ${res.status}: ${text}` }, res.status);
      const data = JSON.parse(text);
      return json({ authorization_url: data.authorization_url, session_id: data.session_id });
    }

    if (action === "oauth_callback") {
      // Front sends whatever query params it received from the gateway return_url.
      // Try to obtain a connection_key: either directly (some flows) or via exchange(session_id, code).
      const params = (body.params ?? {}) as Record<string, string>;
      let connectionKey: string | undefined =
        params.connection_key || params.credential_key || params.app_user_credential_key;

      if (!connectionKey && params.session_id && params.code) {
        const exch = await fetch(`${GATEWAY_BASE_URL}/api/v1/app-users/oauth2/exchange`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${lovableKey}`,
            "X-Client-Api-Key": clientKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ session_id: params.session_id, code: params.code }),
        });
        const t = await exch.text();
        if (!exch.ok) return json({ error: `Exchange ${exch.status}: ${t}`, received_params: params }, exch.status);
        const parsed = JSON.parse(t);
        connectionKey = parsed.connection_key || parsed.credential_key || parsed.app_user_credential_key;
      }

      if (!connectionKey) {
        return json({ error: "Callback did not return a connection_key", received_params: params }, 400);
      }

      // Fetch the connected Gmail address to know what to save
      const profileRes = await fetch(`${GATEWAY_BASE_URL}/${CONNECTOR_ID}/gmail/v1/users/me/profile`, {
        headers: {
          "Authorization": `Bearer ${lovableKey}`,
          "X-Client-Api-Key": clientKey,
          "X-App-User-Connection-Key": connectionKey,
        },
      });
      const profileText = await profileRes.text();
      if (!profileRes.ok) {
        return json({ error: `Fetch profile ${profileRes.status}: ${profileText}` }, profileRes.status);
      }
      const profile = JSON.parse(profileText);
      const email = profile.emailAddress as string;

      // Upsert account (unique by user_id + email_address)
      const { data: account, error: upErr } = await admin
        .from("email_accounts")
        .upsert({
          user_id: userId,
          provider: "gmail",
          email_address: email,
          display_name: email,
          status: "active",
          connection_key: connectionKey,
          last_sync_at: new Date().toISOString(),
        }, { onConflict: "user_id,email_address" })
        .select("id,email_address")
        .single();
      if (upErr) return json({ error: `Save account: ${upErr.message}` }, 500);

      return json({ account_id: account.id, email: account.email_address });
    }

    // ============ Gmail data actions require account_id ============
    const { account_id } = body as { account_id: string };
    if (!account_id) return json({ error: "account_id required" }, 400);

    const { data: account, error: accErr } = await userClient
      .from("email_accounts")
      .select("id,user_id,email_address,provider,connection_key")
      .eq("id", account_id)
      .maybeSingle();
    if (accErr || !account) return json({ error: "Account not found or no access" }, 404);

    const connectionKey = (account as any).connection_key as string | null;
    if (!connectionKey) return json({ error: "This email account has no active OAuth connection. Reconnect it." }, 412);

    const gmailFetch = async (path: string, init: RequestInit = {}) => {
      const res = await fetch(`${GATEWAY_BASE_URL}/${CONNECTOR_ID}${path}`, {
        ...init,
        headers: {
          "Authorization": `Bearer ${lovableKey}`,
          "X-Client-Api-Key": clientKey,
          "X-App-User-Connection-Key": connectionKey,
          "Content-Type": "application/json",
          ...(init.headers ?? {}),
        },
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`Gmail API ${res.status}: ${text}`);
      return text ? JSON.parse(text) : {};
    };

    const ownEmail = String((account as any).email_address ?? "").toLowerCase();

    const linkLead = async (threadId: string, messageId: string | null, addresses: string[], explicitLeadId?: string) => {
      let leadId = explicitLeadId;
      if (!leadId) {
        // Auto-link: from From/Reply-To/To/Cc, excluding the account's own address.
        const candidates = Array.from(new Set(
          addresses.map((a) => a.toLowerCase()).filter((a) => a && a !== ownEmail)
        ));
        if (candidates.length) {
          const { data: lead } = await admin.from("leads").select("id").in("email", candidates).limit(1).maybeSingle();
          leadId = lead?.id;
        }
      }
      if (!leadId) return null;
      await admin.from("email_lead_links").upsert({
        account_id, provider_thread_id: threadId,
        lead_id: leadId, linked_by: userId, user_id: userId,
      }, { onConflict: "account_id,provider_thread_id,lead_id" });
      return leadId;
    };

    if (action === "test_connection") {
      const checks: Array<{ id: string; label: string; ok: boolean; detail: string }> = [];
      const run = async (id: string, label: string, fn: () => Promise<string>) => {
        try {
          const detail = await fn();
          checks.push({ id, label, ok: true, detail });
        } catch (e) {
          checks.push({ id, label, ok: false, detail: e instanceof Error ? e.message : String(e) });
        }
      };
      await run("profile", "Ler perfil", async () => {
        const p = await gmailFetch(`/gmail/v1/users/me/profile`);
        return `${p.emailAddress} · ${p.messagesTotal ?? 0} mensagens`;
      });
      await run("list", "Listar mensagens", async () => {
        const r = await gmailFetch(`/gmail/v1/users/me/messages?maxResults=1&q=in:inbox`);
        return `${r.resultSizeEstimate ?? 0} resultado(s) estimados`;
      });
      await run("drafts", "Ler/enviar rascunhos", async () => {
        const r = await gmailFetch(`/gmail/v1/users/me/drafts?maxResults=1`);
        return `${r.drafts?.length ?? 0} rascunho(s) visíveis`;
      });
      await run("modify", "Modificar (marcar como lido)", async () => {
        const r = await gmailFetch(`/gmail/v1/users/me/labels`);
        return `${r.labels?.length ?? 0} etiqueta(s) — scope gmail.modify OK`;
      });
      const allOk = checks.every((c) => c.ok);
      return json({ ok: allOk, checks });
    }

    if (action === "list") {
      const q = (body.query as string) ?? "in:inbox";
      const data = await gmailFetch(`/gmail/v1/users/me/threads?maxResults=25&q=${encodeURIComponent(q)}`);
      const threads = Array.isArray(data.threads) ? data.threads : [];
      const enriched = await Promise.all(threads.map(async (t: any) => {
        try {
          const meta = await gmailFetch(
            `/gmail/v1/users/me/threads/${t.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          );
          const msgs = meta.messages ?? [];
          const last = msgs[msgs.length - 1] ?? {};
          const headers = last.payload?.headers ?? [];
          const h = (n: string) => headers.find((x: any) => x.name?.toLowerCase() === n.toLowerCase())?.value ?? "";
          const fromRaw = h("From");
          const fromEmail = fromRaw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
          const fromName = fromRaw.replace(/<.*>/, "").replace(/"/g, "").trim() || fromEmail;
          const unread = msgs.some((m: any) => Array.isArray(m.labelIds) && m.labelIds.includes("UNREAD"));
          return {
            id: t.id,
            snippet: t.snippet ?? last.snippet ?? "",
            from: fromName,
            fromEmail,
            subject: h("Subject"),
            date: h("Date") || (last.internalDate ? new Date(Number(last.internalDate)).toISOString() : ""),
            unread,
          };
        } catch (_) {
          return { id: t.id, snippet: t.snippet ?? "", unread: false };
        }
      }));
      return json({ threads: enriched });
    }


    if (action === "get") {
      const { thread_id } = body as { thread_id: string };
      const thread = await gmailFetch(`/gmail/v1/users/me/threads/${thread_id}?format=full`);
      const addrs = new Set<string>();
      const hadUnread = (thread.messages ?? []).some((m: any) =>
        Array.isArray(m.labelIds) && m.labelIds.includes("UNREAD"));
      for (const m of thread.messages ?? []) {
        for (const h of m.payload?.headers ?? []) {
          if (["From", "To", "Cc", "Reply-To", "Delivered-To"].includes(h.name)) extractEmails(h.value).forEach((a) => addrs.add(a));
        }
      }
      // Auto mark thread as read on open (best-effort).
      if (hadUnread) {
        try {
          await gmailFetch(`/gmail/v1/users/me/threads/${thread_id}/modify`, {
            method: "POST", body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
          });
          for (const m of thread.messages ?? []) {
            if (Array.isArray(m.labelIds)) m.labelIds = m.labelIds.filter((l: string) => l !== "UNREAD");
          }
        } catch (e) { console.warn("mark_read failed:", e); }
      }
      const leadId = await linkLead(thread_id, thread.messages?.[0]?.id ?? null, [...addrs]);
      // Log inbound history entries (dedup by external_id unique index)
      if (leadId) {
        const rows = (thread.messages ?? []).map((m: any) => {
          const subj = m.payload?.headers?.find((h: any) => h.name === "Subject")?.value ?? "";
          const fromH = m.payload?.headers?.find((h: any) => h.name === "From")?.value ?? "";
          return {
            lead_id: leadId,
            direction: "inbound",
            sender: "user",
            content: `${subj}\n\n${m.snippet ?? ""}`.trim() || "(sem conteúdo)",
            message_type: "email",
            external_id: `gmail:${m.id}`,
            sent_at: m.internalDate ? new Date(Number(m.internalDate)).toISOString() : new Date().toISOString(),
            metadata: { thread_id, message_id: m.id, from: fromH, status: "read", account_id },
          };
        });
        if (rows.length) await admin.from("lead_conversation_messages").upsert(rows, { onConflict: "external_id", ignoreDuplicates: true });
      }
      return json({ thread, lead_id: leadId });
    }


    if (action === "send") {
      const { to, cc, subject, body_text, body_html, in_reply_to_message_id, thread_id, lead_id, attachments } = body;
      if (!to || !subject) return json({ error: "to and subject required" }, 400);

      let inReplyTo: string | undefined;
      if (in_reply_to_message_id) {
        try {
          const msg = await gmailFetch(`/gmail/v1/users/me/messages/${in_reply_to_message_id}?format=metadata&metadataHeaders=Message-Id`);
          inReplyTo = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === "message-id")?.value;
        } catch (_) { /* ignore */ }
      }

      const safeAtts = Array.isArray(attachments)
        ? attachments
            .filter((a: any) => a && typeof a.name === "string" && typeof a.base64 === "string")
            .map((a: any) => ({ name: a.name, type: a.type || "application/octet-stream", base64: a.base64 }))
        : [];

      const raw = buildRawMessage({
        from: (account as any).email_address, to, cc, subject,
        body: body_text ?? "",
        bodyHtml: body_html || undefined,
        inReplyTo,
        attachments: safeAtts,
      });


      const payload: Record<string, unknown> = { raw };
      if (thread_id) payload.threadId = thread_id;

      const sent = await gmailFetch(`/gmail/v1/users/me/messages/send`, {
        method: "POST", body: JSON.stringify(payload),
      });

      const addrs = [...extractEmails(to), ...extractEmails(cc)];
      const finalLead = await linkLead(sent.threadId ?? thread_id ?? sent.id, sent.id ?? null, addrs, lead_id);

      if (finalLead) {
        await admin.from("lead_conversation_messages").upsert({
          lead_id: finalLead,
          direction: "outbound",
          sender: "human",
          content: `${subject}\n\n${body_text ?? ""}`.trim(),
          message_type: "email",
          external_id: sent.id ? `gmail:${sent.id}` : null,
          sent_at: new Date().toISOString(),
          metadata: { thread_id: sent.threadId ?? thread_id, message_id: sent.id, to, cc, status: "sent", account_id },
        }, { onConflict: "external_id", ignoreDuplicates: true });
      }

      return json({ id: sent.id, thread_id: sent.threadId, lead_id: finalLead });
    }

    if (action === "trash") {
      const ids: string[] = Array.isArray(body.thread_ids) && body.thread_ids.length
        ? body.thread_ids.map(String)
        : body.thread_id ? [String(body.thread_id)] : [];
      if (!ids.length) return json({ error: "thread_id or thread_ids required" }, 400);
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const id of ids) {
        try {
          await gmailFetch(`/gmail/v1/users/me/threads/${id}/trash`, { method: "POST" });
          results.push({ id, ok: true });
        } catch (e) {
          results.push({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      }
      try {
        await admin.from("email_lead_links").delete().eq("account_id", account_id).in("provider_thread_id", ids);
      } catch (_) { /* ignore */ }
      return json({ ok: results.every((r) => r.ok), results });
    }

    if (action === "archive" || action === "mark_read" || action === "mark_unread") {
      const ids: string[] = Array.isArray(body.thread_ids) && body.thread_ids.length
        ? body.thread_ids.map(String)
        : body.thread_id ? [String(body.thread_id)] : [];
      if (!ids.length) return json({ error: "thread_id or thread_ids required" }, 400);
      const modifyBody = action === "archive"
        ? { removeLabelIds: ["INBOX"] }
        : action === "mark_read"
        ? { removeLabelIds: ["UNREAD"] }
        : { addLabelIds: ["UNREAD"] };
      const results: { id: string; ok: boolean; error?: string }[] = [];
      for (const id of ids) {
        try {
          await gmailFetch(`/gmail/v1/users/me/threads/${id}/modify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(modifyBody),
          });
          results.push({ id, ok: true });
        } catch (e) {
          results.push({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
        }
      }
      return json({ ok: results.every((r) => r.ok), results });
    }

    return json({ error: `Unknown action: ${action}` }, 400);

  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("email-gmail-proxy error:", msg);
    return json({ error: msg }, 500);
  }
});
