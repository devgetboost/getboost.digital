/**
 * R1C5 Wave 3 — trusted lead-capture path.
 *
 * Replaces every browser-side `leads` insert. The browser keeps only its
 * publishable key; this function holds the service-role key and is the single
 * writer of `public.leads` for public flows.
 *
 * Responsibilities that the database cannot do for us:
 *  - validate and normalise the contact fields,
 *  - derive `market` and `locale` (NOT NULL, and server facts),
 *  - stamp `consent_privacy_at` and carry the marketing consent flag,
 *  - preserve the fields Clean V1 retired into `metadata` instead of dropping
 *    them, so no submitted information is silently lost,
 *  - bound request size and blunted bursts.
 *
 * Public endpoint (verify_jwt = false): anonymous visitors submit leads, so
 * it is invoked with the publishable key and no user JWT. It must not trust
 * the body for anything the caller could abuse — in particular `status`,
 * which is always server-set to `new`.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  FIELD_LIMITS,
  buildLegacyMetadata,
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

/** Lead status is always server-set: a public submit is a new lead. */
const SUBMITTED_STATUS = "new";

type LegacyLeadFields = {
  /** Pre-2027 free-text service label. Clean V1 uses `service_interest`. */
  service?: string;
  cargo?: string;
  role?: string;
  website?: string;
  budget?: string;
  business_area?: string;
  timeline?: string;
  referrer?: string;
  resource_id?: string;
  resource_name?: string;
  lead_status?: string;
  notes?: string;
};

type LeadCaptureRequest = {
  source: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
  landing_page?: string;
  service_interest?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  market?: string;
  locale?: string;
  /** Explicit consent to marketing. Defaults to false, never to true. */
  consent_marketing?: boolean;
} & LegacyLeadFields;

const RATE_LIMIT = createRateLimiter(20, 60_000);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (isPayloadTooLarge(req)) return json({ error: "Pedido demasiado grande." }, 413);
  if (!RATE_LIMIT(clientKey(req))) {
    return json({ error: "Demasiados pedidos. Tenta novamente em breve." }, 429);
  }

  try {
    const body = (await req.json()) as LeadCaptureRequest;

    const email = cleanEmail(body.email);
    const name = cleanText(body.name, FIELD_LIMITS.name);
    const source = cleanText(body.source, FIELD_LIMITS.source);
    if (!email || !name || !source) {
      return json({ error: "Nome, email e origem são obrigatórios." }, 400);
    }

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!serviceRoleKey || !supabaseUrl) {
      console.error("lead-capture: missing server configuration");
      return json({ error: "Configuração do servidor incompleta." }, 500);
    }

    const market = deriveMarket(body.market, req.headers.get("accept-language"));
    const locale = deriveLocale(market, body.locale);

    // Retired columns are preserved rather than dropped.
    const legacy = buildLegacyMetadata({
      service: cleanText(body.service, FIELD_LIMITS.short),
      cargo: cleanText(body.cargo, FIELD_LIMITS.short),
      role: cleanText(body.role, FIELD_LIMITS.short),
      website: cleanText(body.website, FIELD_LIMITS.short),
      budget: cleanText(body.budget, FIELD_LIMITS.short),
      business_area: cleanText(body.business_area, FIELD_LIMITS.short),
      timeline: cleanText(body.timeline, FIELD_LIMITS.short),
      referrer: cleanText(body.referrer, FIELD_LIMITS.short),
      resource_id: cleanText(body.resource_id, FIELD_LIMITS.short),
      resource_name: cleanText(body.resource_name, FIELD_LIMITS.short),
      lead_status: cleanText(body.lead_status, FIELD_LIMITS.short),
      notes: cleanText(body.notes, FIELD_LIMITS.text),
    });

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from("leads")
      .insert({
        name,
        email,
        source,
        status: SUBMITTED_STATUS,
        phone: cleanText(body.phone, 40),
        company: cleanText(body.company, FIELD_LIMITS.short),
        message: cleanText(body.message, FIELD_LIMITS.text),
        landing_page: cleanText(body.landing_page, 500),
        service_interest: cleanText(body.service_interest ?? body.service, FIELD_LIMITS.short),
        country: null,
        market,
        locale,
        utm_source: cleanText(body.utm_source, 200),
        utm_medium: cleanText(body.utm_medium, 200),
        utm_campaign: cleanText(body.utm_campaign, 200),
        utm_content: cleanText(body.utm_content, 200),
        utm_term: cleanText(body.utm_term, 200),
        // Consent: the submission instant is the privacy-consent timestamp;
        // marketing consent is explicit and defaults to false.
        consent_privacy_at: nowIso(),
        consent_marketing: body.consent_marketing === true,
        marketing_consent_at: body.consent_marketing === true ? nowIso() : null,
        metadata: legacy,
      })
      .select("id, market, locale")
      .single();

    if (error) {
      console.error("lead-capture insert failed:", error.message);
      return json({ error: "Não foi possível registar o pedido." }, 500);
    }

    return json({ lead_id: data.id, market: data.market, locale: data.locale });
  } catch (err) {
    console.error("lead-capture error:", err);
    return json({ error: "Erro inesperado." }, 500);
  }
});
