// Public open-tracking pixel for emails.
// URL: /functions/v1/email-track-open?m=<messageId>
// Logs one row in email_opens and returns a 1x1 transparent GIF.
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// 43-byte transparent 1x1 GIF
const PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00,
  0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00, 0x00, 0x00,
  0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02,
  0x44, 0x01, 0x00, 0x3b,
]);

const pixelHeaders = {
  "Content-Type": "image/gif",
  "Content-Length": String(PIXEL.byteLength),
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  Pragma: "no-cache",
  Expires: "0",
};

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    const messageId = url.searchParams.get("m") || "";

    if (messageId) {
      // Best-effort enrichment; ignore errors so the pixel is always served.
      let template_name: string | null = null;
      let recipient_email: string | null = null;
      try {
        const { data } = await supabase
          .from("email_send_log")
          .select("template_name, recipient_email")
          .eq("message_id", messageId)
          .limit(1)
          .maybeSingle();
        template_name = data?.template_name ?? null;
        recipient_email = data?.recipient_email ?? null;
      } catch (_) { /* ignore */ }

      supabase
        .from("email_opens")
        .insert({
          message_id: messageId,
          template_name,
          recipient_email,
          user_agent: req.headers.get("user-agent"),
          referer: req.headers.get("referer"),
        })
        .then(({ error }) => {
          if (error) console.warn("email-track-open insert error", error);
        });
    }
  } catch (e) {
    console.error("email-track-open error", e);
  }
  return new Response(PIXEL, { status: 200, headers: pixelHeaders });
});
