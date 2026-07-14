// Meta (Instagram + Facebook Messenger + Page comments) webhook.
// Public endpoint — verify_jwt is disabled at the platform layer.
// Auth model:
//   • GET  → Meta hub verification via META_VERIFY_TOKEN
//   • POST → HMAC SHA-256 signature check against META_APP_SECRET (raw body)
// Persists into the unified inbox tables (whatsapp_conversations + whatsapp_chat_messages)
// tagged with channel = 'instagram' | 'facebook'. Outbound send is a separate function.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const META_VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") ?? "";
const META_APP_SECRET = Deno.env.get("META_APP_SECRET") ?? "";

const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function verifySignature(rawBody: string, header: string | null): Promise<boolean> {
  if (!META_APP_SECRET) return false;
  if (!header || !header.startsWith("sha256=")) return false;
  const provided = header.slice("sha256=".length).trim().toLowerCase();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(META_APP_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody));
  const expected = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // constant-time compare
  if (expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  return diff === 0;
}

type NormalizedEvent = {
  channel: "instagram" | "facebook";
  externalAccountId: string;         // IG account id / FB page id
  contactId: string;                  // PSID / IGSID / commenter id
  contactName?: string | null;
  externalMessageId: string;
  content: string;
  kind: "dm" | "comment";
  timestamp?: number;
};

function normalizeMessaging(entry: any, channel: "instagram" | "facebook"): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  const pageId: string = entry?.id ?? "";
  for (const m of entry?.messaging ?? []) {
    const sender = m?.sender?.id;
    const recipient = m?.recipient?.id;
    const msg = m?.message;
    if (!sender || !msg || msg?.is_echo) continue; // ignore echoes of our outbound
    // Prefer text; fall back to attachments summary.
    let content: string = msg?.text ?? "";
    if (!content && Array.isArray(msg?.attachments) && msg.attachments.length) {
      content = msg.attachments
        .map((a: any) => `[${a?.type ?? "attachment"}] ${a?.payload?.url ?? ""}`.trim())
        .join("\n");
    }
    if (!content) content = "(mensagem sem texto)";
    out.push({
      channel,
      externalAccountId: recipient ?? pageId,
      contactId: sender,
      externalMessageId: msg?.mid ?? `${sender}-${m?.timestamp ?? Date.now()}`,
      content,
      kind: "dm",
      timestamp: m?.timestamp,
    });
  }
  return out;
}

function normalizeChanges(entry: any, channel: "instagram" | "facebook"): NormalizedEvent[] {
  const out: NormalizedEvent[] = [];
  const pageId: string = entry?.id ?? "";
  for (const c of entry?.changes ?? []) {
    const field = c?.field;
    const value = c?.value ?? {};
    if (field === "comments" || field === "feed") {
      // FB page comment / IG comment
      const from = value?.from ?? {};
      const commentId = value?.comment_id ?? value?.id ?? `${pageId}-${Date.now()}`;
      const text = value?.message ?? value?.text ?? "(comentário sem texto)";
      if (!from?.id && !value?.sender_id) continue;
      out.push({
        channel,
        externalAccountId: pageId,
        contactId: from?.id ?? value?.sender_id,
        contactName: from?.name ?? from?.username ?? null,
        externalMessageId: String(commentId),
        content: `[comentário] ${text}`,
        kind: "comment",
        timestamp: value?.created_time ? Date.parse(value.created_time) : undefined,
      });
    }
  }
  return out;
}

async function upsertConversation(ev: NormalizedEvent): Promise<string | null> {
  // Lookup existing (channel, external_account_id, contact_phone).
  const { data: existing } = await sb
    .from("whatsapp_conversations")
    .select("id")
    .eq("channel", ev.channel)
    .eq("external_account_id", ev.externalAccountId)
    .eq("contact_phone", ev.contactId)
    .maybeSingle();

  if (existing?.id) {
    await sb.from("whatsapp_conversations").update({
      last_message_preview: ev.content.slice(0, 200),
      last_message_at: new Date(ev.timestamp ?? Date.now()).toISOString(),
      unread_count: (undefined as unknown as number), // handled below via rpc-style patch
      contact_name: ev.contactName ?? undefined,
    }).eq("id", existing.id);
    // increment unread_count separately (PostgREST can't do +1 in single update)
    await sb.rpc("noop_touch_conversation", { _id: existing.id }).catch(() => {});
    return existing.id;
  }

  const { data: inserted, error } = await sb
    .from("whatsapp_conversations")
    .insert({
      channel: ev.channel,
      external_account_id: ev.externalAccountId,
      contact_phone: ev.contactId,
      contact_name: ev.contactName ?? null,
      instance_id: null,
      last_message_preview: ev.content.slice(0, 200),
      last_message_at: new Date(ev.timestamp ?? Date.now()).toISOString(),
      unread_count: 1,
      assistant_enabled: false, // beta: DM/comments não têm auto-reply ainda
      handoff_to_human: true,
    })
    .select("id")
    .single();
  if (error) {
    console.error("meta-webhook: insert conversation failed", error);
    return null;
  }
  return inserted.id;
}

async function insertInboundMessage(conversationId: string, ev: NormalizedEvent) {
  const { error } = await sb.from("whatsapp_chat_messages").insert({
    conversation_id: conversationId,
    direction: "inbound",
    sender: "contact",
    content: ev.content,
    external_id: ev.externalMessageId,
    status: "received",
    created_at: new Date(ev.timestamp ?? Date.now()).toISOString(),
  });
  if (error && !String(error.message).includes("duplicate key")) {
    console.error("meta-webhook: insert message failed", error);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const url = new URL(req.url);

  // ── Meta hub verification (GET) ───────────────────────────────────────
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge") ?? "";
    if (mode === "subscribe" && META_VERIFY_TOKEN && token === META_VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "method not allowed" }, 405);
  }

  // ── Signature check (POST) ────────────────────────────────────────────
  const raw = await req.text();
  const sigOk = await verifySignature(raw, req.headers.get("x-hub-signature-256"));
  if (!sigOk) {
    console.warn("meta-webhook: invalid signature");
    return json({ error: "invalid signature" }, 401);
  }

  let payload: any;
  try { payload = JSON.parse(raw); } catch { return json({ error: "invalid json" }, 400); }

  const object: string = payload?.object ?? "";
  const channel: "instagram" | "facebook" | null =
    object === "instagram" ? "instagram" : object === "page" ? "facebook" : null;
  if (!channel) return json({ ignored: object || "unknown" });

  const events: NormalizedEvent[] = [];
  for (const entry of payload?.entry ?? []) {
    events.push(...normalizeMessaging(entry, channel));
    events.push(...normalizeChanges(entry, channel));
  }

  let saved = 0;
  for (const ev of events) {
    const convId = await upsertConversation(ev);
    if (!convId) continue;
    await insertInboundMessage(convId, ev);
    saved++;
  }

  return json({ ok: true, received: events.length, saved });
});
