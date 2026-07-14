// Public link-tracking redirect for email links.
// URL: /functions/v1/email-track-click?m=<messageId>&k=<kind>&u=<base64url-target>
// Logs a row in email_link_clicks and 302-redirects to the decoded target.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function b64urlDecode(s: string): string {
  try {
    const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
    return atob(b64);
  } catch {
    return "";
  }
}

const isSafeUrl = (u: string) => /^https?:\/\//i.test(u) && u.length < 2048;

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const messageId = url.searchParams.get("m") || "";
    const kind = url.searchParams.get("k") || "link";
    const encoded = url.searchParams.get("u") || "";
    const target = b64urlDecode(encoded);

    if (!target || !isSafeUrl(target)) {
      return new Response("Invalid link", { status: 400 });
    }

    // Look up template/recipient by message_id (best effort, non-blocking)
    let template_name: string | null = null;
    let recipient_email: string | null = null;
    if (messageId) {
      const { data } = await supabase
        .from("email_send_log")
        .select("template_name, recipient_email")
        .eq("message_id", messageId)
        .limit(1)
        .maybeSingle();
      template_name = data?.template_name ?? null;
      recipient_email = data?.recipient_email ?? null;
    }

    await supabase.from("email_link_clicks").insert({
      message_id: messageId || "unknown",
      template_name,
      recipient_email,
      kind,
      url: target,
      user_agent: req.headers.get("user-agent"),
      referer: req.headers.get("referer"),
    });

    return new Response(null, {
      status: 302,
      headers: { Location: target, "Cache-Control": "no-store" },
    });
  } catch (e) {
    console.error("email-track-click error", e);
    return new Response("error", { status: 500 });
  }
});
