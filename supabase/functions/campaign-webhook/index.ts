// Public webhook (verify_jwt = false) that receives Brevo email events and
// updates campaign_recipients status/timestamps. The campaign stats are
// recomputed automatically by a DB trigger, and the frontend receives the
// update in real-time via the supabase_realtime publication.
//
// Optional shared secret: set CAMPAIGN_WEBHOOK_SECRET and configure Brevo to
// send it in the `x-webhook-secret` header (or ?secret=... query param).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Brevo events → recipient status
function mapBrevoEvent(event: string): { status?: string; timestampField?: string } {
  const e = event.toLowerCase();
  if (e === "delivered") return { status: "delivered", timestampField: "delivered_at" };
  if (e === "opened" || e === "unique_opened") return { status: "opened", timestampField: "opened_at" };
  if (e === "click") return { status: "clicked", timestampField: "clicked_at" };
  if (e === "hard_bounce" || e === "soft_bounce" || e === "bounce") return { status: "bounced", timestampField: "failed_at" };
  if (e === "spam" || e === "invalid_email" || e === "blocked" || e === "error" || e === "deferred") return { status: "failed", timestampField: "failed_at" };
  return {};
}

async function handleBrevoEvent(evt: any) {
  const messageId: string | undefined = evt["message-id"] || evt.messageId || evt.messageID;
  const event: string = evt.event || evt.type || "";
  if (!messageId || !event) return { ignored: true };

  const { status, timestampField } = mapBrevoEvent(event);
  if (!status) return { ignored: true, event };

  // Find recipient by provider_message_id (Brevo returns with or without <>)
  const cleanId = messageId.replace(/[<>]/g, "");
  const { data: rec } = await supabase
    .from("campaign_recipients")
    .select("id, status")
    .or(`provider_message_id.eq.${cleanId},provider_message_id.eq.<${cleanId}>`)
    .maybeSingle();

  if (!rec) return { ignored: true, reason: "recipient not found", messageId };

  // Never downgrade status (e.g. don't overwrite 'clicked' with 'delivered')
  const rank: Record<string, number> = { sent: 1, delivered: 2, opened: 3, clicked: 4, bounced: 5, failed: 5 };
  const newRank = rank[status] ?? 0;
  const curRank = rank[rec.status] ?? 0;
  const update: Record<string, unknown> = {};
  if (newRank >= curRank) update.status = status;
  if (timestampField) update[timestampField] = new Date(evt.date || Date.now()).toISOString();
  if (status === "failed" || status === "bounced") update.error = evt.reason || evt.error || event;

  await supabase.from("campaign_recipients").update(update).eq("id", rec.id);
  return { ok: true, recipient_id: rec.id, status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const secret = Deno.env.get("CAMPAIGN_WEBHOOK_SECRET");
    if (!secret) {
      console.error("campaign-webhook: CAMPAIGN_WEBHOOK_SECRET not configured");
      return json({
        error: "webhook_not_configured",
        message: "CAMPAIGN_WEBHOOK_SECRET is not set. Configure it in Lovable Cloud secrets before enabling this webhook.",
      }, 503);
    }
    const provided = req.headers.get("x-webhook-secret") || url.searchParams.get("secret");
    if (!provided) {
      return json({
        error: "missing_secret",
        message: "Missing webhook secret. Send it in the 'x-webhook-secret' header or '?secret=' query param.",
      }, 401);
    }
    if (provided !== secret) {
      console.warn("campaign-webhook: invalid secret from", req.headers.get("x-forwarded-for") || "unknown");
      return json({
        error: "invalid_secret",
        message: "The provided webhook secret does not match CAMPAIGN_WEBHOOK_SECRET.",
      }, 403);
    }

    const payload = await req.json().catch(() => null);
    if (!payload) return json({ error: "invalid json" }, 400);

    const events = Array.isArray(payload) ? payload : [payload];
    const results = [];
    for (const evt of events) {
      results.push(await handleBrevoEvent(evt).catch((e) => ({ error: String(e) })));
    }
    return json({ ok: true, processed: results.length, results });
  } catch (e) {
    console.error("campaign-webhook error", e);
    return json({ error: String(e) }, 500);
  }
});
