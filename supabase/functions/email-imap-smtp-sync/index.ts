import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Security = "ssl" | "starttls" | "none";
type Meta = {
  username: string;
  imap: { host: string; port: number; security: Security };
};
type CheckResult = { id: string; label: string; ok: boolean; detail: string };
type ParsedMessage = {
  id: string;
  uid: string;
  from: string;
  fromEmail: string;
  to: string;
  cc: string;
  replyTo: string;
  deliveredTo: string;
  subject: string;
  date: string;
  messageId: string;
  snippet: string;
  bodyHtml: string;
  unread: boolean;
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
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decryptPassword(encoded: string): Promise<string> {
  const bytes = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = bytes.slice(0, 12);
  const ct = bytes.slice(12);
  const key = await getKey();
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}

function quoteImap(value: string) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function concatBytes(a: Uint8Array, b: Uint8Array) {
  const c = new Uint8Array(a.length + b.length);
  c.set(a, 0);
  c.set(b, a.length);
  return c;
}

function crlfIndex(buf: Uint8Array) {
  for (let i = 0; i < buf.length - 1; i += 1) {
    if (buf[i] === 13 && buf[i + 1] === 10) return i;
  }
  return -1;
}

class ImapClient {
  private conn: Deno.Conn | Deno.TlsConn | null = null;
  private tag = 1;
  private buffer = new Uint8Array();
  private decoder = new TextDecoder();
  private encoder = new TextEncoder();

  constructor(private host: string, private port: number, private security: Security) {}

  async connect() {
    if (this.security === "ssl") {
      this.conn = await Deno.connectTls({ hostname: this.host, port: this.port });
    } else {
      this.conn = await Deno.connect({ hostname: this.host, port: this.port });
    }
    const greeting = await this.readLine();
    if (!/^\* OK/i.test(greeting)) throw new Error(`IMAP greeting failed: ${greeting}`);

    if (this.security === "starttls") {
      await this.command("STARTTLS");
      this.conn = await Deno.startTls(this.conn as Deno.Conn, { hostname: this.host });
      this.buffer = new Uint8Array();
    }
  }

  async login(username: string, password: string) {
    await this.command(`LOGIN ${quoteImap(username)} ${quoteImap(password)}`);
  }

  async select(mailbox: string) {
    return await this.command(`SELECT ${quoteImap(mailbox)}`);
  }

  async logout() {
    try {
      if (this.conn) await this.command("LOGOUT");
    } catch (_) {
      // ignore logout errors
    }
    try {
      this.conn?.close();
    } catch (_) {
      // ignore close errors
    }
  }

  async command(command: string) {
    if (!this.conn) throw new Error("IMAP connection is not open");
    const tag = `A${this.tag++}`;
    await this.conn.write(this.encoder.encode(`${tag} ${command}\r\n`));
    return await this.readResponse(tag);
  }

  private async fill() {
    if (!this.conn) throw new Error("IMAP connection is not open");
    const chunk = new Uint8Array(16_384);
    const n = await this.conn.read(chunk);
    if (n === null) throw new Error("IMAP connection closed unexpectedly");
    this.buffer = concatBytes(this.buffer, chunk.slice(0, n));
  }

  private async readLine() {
    let idx = crlfIndex(this.buffer);
    while (idx < 0) {
      await this.fill();
      idx = crlfIndex(this.buffer);
    }
    const line = this.buffer.slice(0, idx);
    this.buffer = this.buffer.slice(idx + 2);
    return this.decoder.decode(line);
  }

  private async readBytes(length: number) {
    while (this.buffer.length < length) await this.fill();
    const bytes = this.buffer.slice(0, length);
    this.buffer = this.buffer.slice(length);
    return bytes;
  }

  private async readResponse(tag: string) {
    const lines: string[] = [];
    const literals: string[] = [];

    while (true) {
      const line = await this.readLine();
      lines.push(line);
      const literal = line.match(/\{(\d+)\}$/);
      if (literal) {
        const bytes = await this.readBytes(Number(literal[1]));
        literals.push(new TextDecoder("latin1").decode(bytes));
      }

      if (line.startsWith(`${tag} `)) {
        if (!new RegExp(`^${tag} OK`, "i").test(line)) {
          throw new Error(line.replace(`${tag} `, "IMAP "));
        }
        return { text: lines.join("\n"), literals };
      }
    }
  }
}

function decodeHeaderValue(value: string) {
  return value.replace(/=\?([^?]+)\?([bqBQ])\?([^?]*)\?=/g, (_m, charset, enc, text) => {
    try {
      const bytes = enc.toUpperCase() === "B"
        ? Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
        : decodeQuotedPrintable(text.replace(/_/g, " "));
      return new TextDecoder(String(charset).toLowerCase()).decode(bytes);
    } catch (_) {
      return text;
    }
  }).replace(/\s+/g, " ").trim();
}

function decodeQuotedPrintable(input: string) {
  const clean = input.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 1) {
    if (clean[i] === "=" && /^[0-9a-fA-F]{2}$/.test(clean.slice(i + 1, i + 3))) {
      bytes.push(parseInt(clean.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(clean.charCodeAt(i));
    }
  }
  return new Uint8Array(bytes);
}

function parseHeaders(raw: string) {
  const headers: Record<string, string> = {};
  const unfolded = raw.replace(/\r?\n[\t ]+/g, " ").split(/\r?\n/);
  for (const line of unfolded) {
    const idx = line.indexOf(":");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();
    headers[key] = headers[key] ? `${headers[key]}, ${value}` : value;
  }
  for (const key of Object.keys(headers)) headers[key] = decodeHeaderValue(headers[key]);
  return headers;
}

function extractEmails(s: string | null | undefined): string[] {
  if (!s) return [];
  return Array.from(s.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)).map((m) => m[0].toLowerCase());
}

function displayName(from: string) {
  const email = extractEmails(from)[0] ?? "";
  return from.replace(/<.*>/, "").replace(/"/g, "").trim() || email || "—";
}

function toBytesLatin1(s: string) {
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff;
  return out;
}

function extractCharset(contentType: string) {
  const m = contentType.match(/charset=(?:"([^"]+)"|([^;\s]+))/i);
  return (m?.[1] ?? m?.[2] ?? "utf-8").toLowerCase();
}

function safeDecode(bytes: Uint8Array, charset: string) {
  try { return new TextDecoder(charset).decode(bytes); }
  catch { try { return new TextDecoder("utf-8").decode(bytes); } catch { return new TextDecoder("latin1").decode(bytes); } }
}

function decodeTransfer(raw: string, encoding: string, charset: string) {
  const enc = encoding.toLowerCase();
  try {
    if (enc.includes("base64")) {
      const clean = raw.replace(/\s+/g, "");
      const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));
      return safeDecode(bytes, charset);
    }
    if (enc.includes("quoted-printable")) return safeDecode(decodeQuotedPrintable(raw), charset);
  } catch (_) {
    return raw;
  }
  // 7bit / 8bit / binary — raw is latin1 passthrough of original bytes
  return safeDecode(toBytesLatin1(raw), charset);
}

function splitHeaderBody(raw: string) {
  const match = raw.match(/\r?\n\r?\n/);
  if (!match || match.index === undefined) return { header: "", body: raw };
  const end = match.index + match[0].length;
  return { header: raw.slice(0, match.index), body: raw.slice(end) };
}

function extractBoundary(contentType: string) {
  return contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i)?.[1]
    ?? contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i)?.[2]
    ?? "";
}

function extractBody(rawBody: string, topHeaders: Record<string, string>): { text: string; html: string } {
  const topCt = topHeaders["content-type"] ?? "";
  const boundary = extractBoundary(topCt);
  if (boundary) {
    const parts = rawBody.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:--)?\\r?\\n?`, "g"));
    let html = "";
    let text = "";
    for (const part of parts) {
      const { header, body } = splitHeaderBody(part.trim());
      const h = parseHeaders(header);
      const ct = (h["content-type"] ?? "").toLowerCase();
      const charset = extractCharset(ct);
      // Nested multipart (e.g. multipart/alternative inside multipart/mixed)
      if (ct.includes("multipart/")) {
        const nested = extractBody(body, h);
        if (!text && nested.text) text = nested.text;
        if (!html && nested.html) html = nested.html;
        continue;
      }
      const decoded = decodeTransfer(body, h["content-transfer-encoding"] ?? "", charset);
      if (!text && ct.includes("text/plain")) text = decoded;
      if (!html && ct.includes("text/html")) html = decoded;
    }
    return { text, html };
  }
  const charset = extractCharset(topCt);
  const decoded = decodeTransfer(rawBody, topHeaders["content-transfer-encoding"] ?? "", charset);
  if (topCt.toLowerCase().includes("text/html")) return { text: "", html: decoded };
  return { text: decoded, html: "" };
}

function stripHtml(s: string) {
  return s.replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function safeIsoDate(value: string) {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toISOString() : new Date().toISOString();
}

function sanitizeHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "");
}

function parseFetch(uid: string, response: { text: string; literals: string[] }): ParsedMessage {
  const headerRaw = response.literals[0] ?? "";
  const bodyRaw = response.literals[1] ?? "";
  const headers = parseHeaders(headerRaw);
  const { text, html } = extractBody(bodyRaw, headers);
  const plain = stripHtml(html || text) || "(sem conteúdo)";
  const bodyHtml = html
    ? sanitizeHtml(html)
    : `<div style="white-space:pre-wrap">${escapeHtml(text)}</div>`;
  const flags = response.text.match(/FLAGS \(([^)]*)\)/i)?.[1] ?? "";
  const from = headers.from ?? "";
  const fromEmail = extractEmails(from)[0] ?? "";
  return {
    id: `imap:${uid}`,
    uid,
    from: displayName(from),
    fromEmail,
    to: headers.to ?? "",
    cc: headers.cc ?? "",
    replyTo: headers["reply-to"] ?? "",
    deliveredTo: headers["delivered-to"] ?? "",
    subject: headers.subject || "(sem assunto)",
    date: headers.date ?? response.text.match(/INTERNALDATE "([^"]+)"/i)?.[1] ?? "",
    messageId: headers["message-id"] ?? `imap:${uid}`,
    snippet: plain.slice(0, 240),
    bodyHtml,
    unread: !/\\Seen/i.test(flags),
  };
}

function folderCandidates(folder: string | undefined): string[] {
  switch (folder) {
    case "sent": return ["Sent", "Sent Items", "Sent Messages", "INBOX.Sent", "[Gmail]/Sent Mail"];
    case "drafts": return ["Drafts", "INBOX.Drafts", "[Gmail]/Drafts"];
    case "trash": return ["Trash", "Deleted Items", "Deleted Messages", "INBOX.Trash", "[Gmail]/Trash"];
    case "starred": return ["INBOX"]; // filtered by FLAGGED search below
    case "snoozed": return ["INBOX"]; // IMAP has no native snoozed
    default: return ["INBOX"];
  }
}

async function selectFirstAvailable(client: ImapClient, candidates: string[]): Promise<string> {
  for (const name of candidates) {
    try {
      await client.select(name);
      return name;
    } catch (_) { /* try next */ }
  }
  await client.select("INBOX");
  return "INBOX";
}

function normalizeUid(threadId: string | undefined) {
  return String(threadId ?? "").replace(/^imap:/, "");
}

async function fetchMessage(client: ImapClient, uid: string, peekBytes = 60_000) {
  const res = await client.command(
    `UID FETCH ${uid} (UID FLAGS INTERNALDATE BODY.PEEK[HEADER.FIELDS (FROM TO CC SUBJECT DATE MESSAGE-ID CONTENT-TYPE CONTENT-TRANSFER-ENCODING)] BODY.PEEK[TEXT]<0.${peekBytes}>)`,
  );
  return parseFetch(uid, res);
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
    const action = String(body.action ?? "list");
    const accountId = String(body.account_id ?? "");
    if (!accountId) return json({ error: "account_id required" }, 400);

    const { data: account, error: accErr } = await userClient
      .from("email_accounts")
      .select("id,email_address,provider,connection_key,provider_meta,status")
      .eq("id", accountId)
      .maybeSingle();
    if (accErr || !account) return json({ error: "Account not found" }, 404);
    if (account.provider !== "imap") return json({ error: "Not an IMAP/SMTP account" }, 400);
    if (!account.connection_key) return json({ error: "Missing credentials — reconnect the account." }, 412);

    const meta = (account.provider_meta ?? {}) as Meta;
    if (!meta.imap?.host || !meta.username) return json({ error: "IMAP config missing" }, 400);

    let password: string;
    try {
      password = await decryptPassword(account.connection_key);
    } catch (_) {
      return json({ error: "Cannot decrypt stored password — reconnect the account." }, 412);
    }

    const client = new ImapClient(meta.imap.host, Number(meta.imap.port), meta.imap.security);
    try {
      await client.connect();
      await client.login(meta.username, password);
      const folderKey = String(body.folder ?? "inbox");
      const candidates = folderCandidates(folderKey);
      await selectFirstAvailable(client, candidates);

      if (action === "test_connection") {
        const checks: CheckResult[] = [
          { id: "connect", label: "Servidor IMAP", ok: true, detail: `${meta.imap.host}:${meta.imap.port} (${meta.imap.security})` },
          { id: "login", label: "Credenciais", ok: true, detail: `Autenticado como ${meta.username}` },
        ];
        const search = await client.command("UID SEARCH ALL");
        const uids = (search.text.match(/\* SEARCH\s+([\d\s]*)/i)?.[1] ?? "").trim().split(/\s+/).filter(Boolean);
        checks.push({ id: "inbox", label: "Caixa de entrada", ok: true, detail: `${uids.length} mensagem(ns) encontrada(s)` });
        await admin.from("email_accounts").update({ last_sync_at: new Date().toISOString() }).eq("id", accountId);
        return json({ ok: true, checks });
      }

      if (action === "list") {
        const searchCmd = folderKey === "starred" ? "UID SEARCH FLAGGED" : "UID SEARCH ALL";
        const search = await client.command(searchCmd);
        const uids = (search.text.match(/\* SEARCH\s+([\d\s]*)/i)?.[1] ?? "").trim().split(/\s+/).filter(Boolean);
        const latest = uids.slice(-25).reverse();
        const query = String(body.query ?? "").trim().toLowerCase();
        const messages: ParsedMessage[] = [];
        for (const uid of latest) {
          try {
            const msg = await fetchMessage(client, uid, 4_000);
            if (!query || `${msg.from} ${msg.fromEmail} ${msg.subject} ${msg.snippet}`.toLowerCase().includes(query)) messages.push(msg);
          } catch (e) {
            console.warn("IMAP fetch preview failed:", uid, e instanceof Error ? e.message : String(e));
          }
        }
        await admin.from("email_accounts").update({ last_sync_at: new Date().toISOString() }).eq("id", accountId);
        return json({ threads: messages });
      }

      if (action === "get") {
        const uid = normalizeUid(body.thread_id);
        if (!uid) return json({ error: "thread_id required" }, 400);
        const msg = await fetchMessage(client, uid, 80_000);

        if (msg.unread) {
          try {
            await client.command(`UID STORE ${uid} +FLAGS.SILENT (\\Seen)`);
            msg.unread = false;
          } catch (e) {
            console.warn("IMAP mark seen failed:", e instanceof Error ? e.message : String(e));
          }
        }

        const ownEmail = String(account.email_address ?? "").toLowerCase();
        const addresses = Array.from(new Set([
          ...extractEmails(msg.fromEmail),
          ...extractEmails(msg.replyTo),
          ...extractEmails(msg.to),
          ...extractEmails(msg.cc),
          ...extractEmails(msg.deliveredTo),
        ].map((a) => a.toLowerCase()).filter((a) => a && a !== ownEmail)));
        let leadId: string | null = null;
        if (addresses.length) {
          const { data: lead } = await admin.from("leads").select("id").in("email", addresses).limit(1).maybeSingle();
          leadId = lead?.id ?? null;
          if (leadId) {
            await admin.from("email_lead_links").upsert({
              account_id: accountId,
              provider_thread_id: msg.id,
              lead_id: leadId,
              linked_by: userId,
              user_id: userId,
            }, { onConflict: "account_id,provider_thread_id,lead_id" });
            await admin.from("lead_conversation_messages").upsert({
              lead_id: leadId,
              direction: "inbound",
              sender: "user",
              content: `${msg.subject}\n\n${msg.snippet}`.trim(),
              message_type: "email",
              external_id: msg.messageId ? `imap:${msg.messageId}` : msg.id,
              sent_at: msg.date ? safeIsoDate(msg.date) : new Date().toISOString(),
              metadata: { thread_id: msg.id, message_id: msg.messageId, from: msg.fromEmail, status: "read", account_id: accountId, provider: "imap" },
            }, { onConflict: "external_id", ignoreDuplicates: true });
          }
        }

        await admin.from("email_accounts").update({ last_sync_at: new Date().toISOString() }).eq("id", accountId);
        return json({ message: msg, lead_id: leadId });
      }

      if (action === "trash") {
        const ids: string[] = Array.isArray(body.thread_ids) && body.thread_ids.length
          ? body.thread_ids.map((v: unknown) => normalizeUid(String(v)))
          : body.thread_id ? [normalizeUid(String(body.thread_id))] : [];
        const uids = ids.filter(Boolean);
        if (!uids.length) return json({ error: "thread_id or thread_ids required" }, 400);
        const uidList = uids.join(",");
        let movedToTrash = false;
        let trashFolder: string | null = null;
        // Try each known Trash folder name until COPY succeeds — servers differ
        // (Gmail: [Gmail]/Trash, Outlook: Deleted Items, cPanel: INBOX.Trash, ...)
        for (const name of folderCandidates("trash")) {
          try {
            const copyRes = await client.command(`UID COPY ${uidList} "${name}"`);
            if (/OK/i.test(copyRes.text)) {
              movedToTrash = true;
              trashFolder = name;
              break;
            }
          } catch (e) {
            console.warn(`IMAP COPY to "${name}" failed:`, e instanceof Error ? e.message : String(e));
          }
        }
        // Only expunge from source if we successfully moved a copy to Trash,
        // otherwise the message would be lost entirely.
        if (movedToTrash) {
          try {
            await client.command(`UID STORE ${uidList} +FLAGS.SILENT (\\Deleted)`);
            await client.command(`UID EXPUNGE ${uidList}`).catch(async () => { await client.command("EXPUNGE"); });
          } catch (e) {
            return json({ error: `IMAP delete failed: ${e instanceof Error ? e.message : String(e)}` }, 502);
          }
        } else {
          return json({ error: "Não foi possível mover para a Lixeira: pasta Trash não encontrada no servidor IMAP." }, 502);
        }
        try {
          const providerIds = uids.map((u) => `imap:${u}`);
          await admin.from("email_lead_links").delete().eq("account_id", accountId).in("provider_thread_id", providerIds);
        } catch (_) { /* ignore */ }
        return json({ ok: true, moved_to_trash: movedToTrash, trash_folder: trashFolder, count: uids.length });
      }

      if (action === "archive" || action === "mark_read" || action === "mark_unread") {
        const ids: string[] = Array.isArray(body.thread_ids) && body.thread_ids.length
          ? body.thread_ids.map((v: unknown) => normalizeUid(String(v)))
          : body.thread_id ? [normalizeUid(String(body.thread_id))] : [];
        const uids = ids.filter(Boolean);
        if (!uids.length) return json({ error: "thread_id or thread_ids required" }, 400);
        const uidList = uids.join(",");
        try {
          if (action === "mark_read") {
            await client.command(`UID STORE ${uidList} +FLAGS.SILENT (\\Seen)`);
          } else if (action === "mark_unread") {
            await client.command(`UID STORE ${uidList} -FLAGS.SILENT (\\Seen)`);
          } else {
            // archive: move to Archive folder then expunge from current
            let moved = false;
            for (const box of ["Archive", "[Gmail]/All Mail", "Arquivo"]) {
              try {
                const r = await client.command(`UID COPY ${uidList} ${box}`);
                if (/OK/i.test(r.text)) { moved = true; break; }
              } catch (_) { /* try next */ }
            }
            if (moved) {
              await client.command(`UID STORE ${uidList} +FLAGS.SILENT (\\Deleted)`);
              await client.command(`UID EXPUNGE ${uidList}`).catch(async () => { await client.command("EXPUNGE"); });
            } else {
              return json({ error: "No Archive mailbox available on server" }, 502);
            }
          }
        } catch (e) {
          return json({ error: `IMAP ${action} failed: ${e instanceof Error ? e.message : String(e)}` }, 502);
        }
        return json({ ok: true, count: uids.length });
      }

      return json({ error: `Unknown action: ${action}` }, 400);

    } finally {
      await client.logout();
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("email-imap-smtp-sync error:", msg);
    return json({ error: msg }, 500);
  }
});