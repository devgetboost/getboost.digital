/**
 * R1C5 Wave 3 — trusted newsletter subscription path.
 *
 * Replaces the browser-side `newsletter_subscribers` insert in the site footer.
 *
 * The footer used to write `name`, `email`, `consent` and `consented_at`. Clean
 * V1 dropped `name` and `consent`: consent is expressed by `consent_at` (NOT
 * NULL) plus `status`, and there is no column for a display name. The function
 * therefore records `consent_at` and discards the name rather than inventing a
 * place for it — the form still collects it so the consent copy stays with the
 * submission, but it is not persisted.
 *
 * `status` is only ever `subscribed` here: flipping an existing `unsubscribed`
 * or `bounced` row back to `subscribed` is a re-subscribe, which is explicitly
 * out of scope for this wave. A repeat address is reported as already
 * subscribed instead.
 *
 * Public endpoint (verify_jwt = false): anonymous visitors subscribe from the
 * site footer, so it is invoked with the publishable key and no user JWT.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FIELD_LIMITS,
  cleanEmail,
  cleanText,
  clientKey,
  createRateLimiter,
  deriveLocale,
  deriveMarket,
  isPayloadTooLarge,
  json,
  nowIso,
  corsHeaders,
} from "../_shared/commercial-write.ts";

const RATE_LIMIT = createRateLimiter(10, 60_000);

type NewsletterSubscribeRequest = {
  email: string;
  source?: string;
  market?: string;
  locale?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (isPayloadTooLarge(req)) return json({ error: "Pedido demasiado grande." }, 413);
  if (!RATE_LIMIT(clientKey(req))) {
    return json({ error: "Demasiados pedidos. Tenta novamente em breve." }, 429);
  }

  try {
    const body = (await req.json()) as NewsletterSubscribeRequest;
    const email = cleanEmail(body.email);
    if (!email) return json({ error: "Email inválido." }, 400);

    const market = deriveMarket(body.market, req.headers.get("accept-language"));
    const locale = deriveLocale(market, body.locale);
    const source = cleanText(body.source, FIELD_LIMITS.source) ?? "footer";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("newsletter-subscribe: missing server configuration");
      return json({ error: "Configuração do servidor incompleto." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("id, status")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      // Known debt: re-subscribing an unsubscribed/bounced address is out of
      // scope for this wave, so an existing row is reported, not mutated.
      return json({
        status: "already_subscribed",
        subscriber_status: existing.status,
      });
    }

    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email,
        market,
        locale,
        source,
        status: "subscribed",
        consent_at: nowIso(),
      })
      .select("id, market, locale")
      .single();

    if (error) {
      // 23505 = unique violation on lower(email): treat as already subscribed.
      if (error.code === "23505") {
        return json({ status: "already_subscribed", subscriber_status: "subscribed" });
      }
      console.error("newsletter-subscribe insert failed:", error.message);
      return json({ error: "Não foi possível subscrever." }, 500);
    }

    return json({ subscriber_id: data.id, market: data.market, locale: data.locale });
  } catch (err) {
    console.error("newsletter-subscribe error:", err);
    return json({ error: "Erro inesperado." }, 500);
  }
});
