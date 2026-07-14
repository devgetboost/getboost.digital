// Send a campaign (WhatsApp or Email) by campaign_id.
// Loads recipients from campaign_recipients, sends via whatsapp-proxy or Brevo (smtp/email),
// updates each recipient row and the aggregated stats on the campaign.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => vars[k] ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userRes } = await userClient.auth.getUser();
    const user = userRes?.user;
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: isAdmin } = await userClient.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return new Response(JSON.stringify({ error: "Admin required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { campaign_id, test_recipient, inline_campaign } = await req.json();

    let campaign: any = null;
    if (inline_campaign && test_recipient) {
      campaign = { id: null, ...inline_campaign };
    } else {
      if (!campaign_id) return new Response(JSON.stringify({ error: "campaign_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: c, error: cErr } = await admin
        .from("campaigns").select("*").eq("id", campaign_id).maybeSingle();
      if (cErr || !c) return new Response(JSON.stringify({ error: "Campaign not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      campaign = c;
    }

    // Load recipients (or use test)
    let recipients: any[] = [];
    if (test_recipient) {
      recipients = [{ id: null, ...test_recipient, variables: test_recipient.variables || {} }];
    } else {
      const { data: recs } = await admin
        .from("campaign_recipients")
        .select("*")
        .eq("campaign_id", campaign_id)
        .eq("status", "pending");
      recipients = recs || [];
    }

    if (recipients.length === 0) {
      return new Response(JSON.stringify({ error: "No pending recipients" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (campaign.id && !test_recipient) await admin.from("campaigns").update({ status: "sending" }).eq("id", campaign.id);

    let sentCount = 0;
    let failedCount = 0;
    const delayMs = (campaign.delay_seconds || 3) * 1000;

    // ─── WhatsApp channel ───────────────────────────────────────────────────
    if (campaign.channel === "whatsapp") {
      if (!campaign.instance_id) {
        if (campaign.id) await admin.from("campaigns").update({ status: "failed" }).eq("id", campaign.id);
        return new Response(JSON.stringify({ error: "instance_id missing" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Delegate to whatsapp-proxy send-messages in one call
      const proxyRes = await fetch(`${supabaseUrl}/functions/v1/whatsapp-proxy`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authHeader },
        body: JSON.stringify({
          action: "send-messages",
          instance_id: campaign.instance_id,
          message: campaign.body,
          delay_seconds: campaign.delay_seconds || 3,
          recipients: recipients.map((r) => ({
            name: r.contact_name || "",
            phone: r.contact_phone || "",
            variables: r.variables || {},
          })),
        }),
      });
      const proxyJson = await proxyRes.json().catch(() => ({}));
      const results = proxyJson.results || [];

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        const res = results[i];
        const ok = res?.status === "sent" || res?.status === "success";
        const providerMsgId: string | null = res?.key?.id || res?.messageId || res?.id || null;
        if (r.id) {
          await admin.from("campaign_recipients").update({
            status: ok ? "sent" : "failed",
            sent_at: ok ? new Date().toISOString() : null,
            provider_message_id: providerMsgId,
            error: ok ? null : (res?.error || "Unknown error"),
          }).eq("id", r.id);
        }
        if (ok) sentCount++; else failedCount++;
      }
    }

    // ─── Email channel ──────────────────────────────────────────────────────
    if (campaign.channel === "email") {
      const brevoKey = Deno.env.get("BREVO_API_KEY");
      if (!brevoKey) {
        if (campaign.id) await admin.from("campaigns").update({ status: "failed" }).eq("id", campaign.id);
        return new Response(JSON.stringify({
          error: "BREVO_NOT_CONFIGURED",
          message: "Configura BREVO_API_KEY (nas definições) ou liga o conector Brevo.",
        }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const senderEmail = (campaign.audience_filter?.sender_email as string) || "no-reply@getboost.digital";
      const senderName = (campaign.audience_filter?.sender_name as string) || "GetBoost";

      for (let i = 0; i < recipients.length; i++) {
        const r = recipients[i];
        if (i > 0) await new Promise((res) => setTimeout(res, Math.min(delayMs, 500)));

        const vars = {
          nome: r.contact_name || "",
          name: r.contact_name || "",
          email: r.contact_email || "",
          ...(r.variables || {}),
        };
        const subject = renderTemplate(campaign.subject || "", vars);
        const html = renderTemplate(campaign.body || "", vars);

        try {
          const res = await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": brevoKey, "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              sender: { email: senderEmail, name: senderName },
              to: [{ email: r.contact_email, name: r.contact_name || undefined }],
              subject,
              htmlContent: html,
            }),
          });
          const data = await res.json().catch(() => ({}));
          const ok = res.ok;
          const providerMsgId: string | null = data?.messageId || data?.messageIds?.[0] || null;
          if (r.id) {
            await admin.from("campaign_recipients").update({
              status: ok ? "sent" : "failed",
              sent_at: ok ? new Date().toISOString() : null,
              provider_message_id: providerMsgId,
              error: ok ? null : (data.message || `HTTP ${res.status}`),
            }).eq("id", r.id);
          }
          if (ok) sentCount++; else failedCount++;
        } catch (e) {
          failedCount++;
          if (r.id) {
            await admin.from("campaign_recipients").update({
              status: "failed", error: String(e),
            }).eq("id", r.id);
          }
        }
      }
    }

    // Update campaign stats
    // Stats are recomputed automatically by the recompute_campaign_stats trigger.
    if (!test_recipient && campaign.id) {
      const finalStatus = failedCount > 0 && sentCount === 0 ? "failed" : "sent";
      await admin.from("campaigns").update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
      }).eq("id", campaign.id);
    }

    return new Response(JSON.stringify({ success: true, sent: sentCount, failed: failedCount }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("send-campaign error", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
