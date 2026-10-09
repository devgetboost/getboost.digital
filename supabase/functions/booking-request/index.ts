/**
 * R1C5 Wave 3 — trusted booking write path.
 *
 * Replaces every browser-side `bookings` insert/update. The public booking form
 * and the "reschedule from an email link" flow both used to write directly with
 * an unauthenticated client and, worse, the reschedule flow trusted a bare
 * booking id from a URL query parameter — anyone holding the link could move
 * anyone's meeting.
 *
 * Actions:
 *  - `lookup`     Reschedule pre-fill. Returns only non-sensitive fields plus a
 *                 masked email, so the visitor can confirm which address to
 *                 use without the endpoint leaking PII.
 *  - `create`     Public booking submission. Returns a `reschedule_secret` that
 *                 is stored in `bookings.metadata` and can be used to prove
 *                 possession later.
 *  - `reschedule` Requires the booking id **plus** either the matching email or
 *                 the `reschedule_secret`. Without one of those the request is
 *                 refused.
 *
 * `metadata` (an existing Clean V1 jsonb column) carries the retired
 * meeting/CRM fields so nothing previously captured is lost.
 *
 * Public endpoint (verify_jwt = false): anonymous visitors create bookings and
 * visitors arriving from an email link reschedule them.
 *
 * Public endpoint (verify_jwt = false): anonymous visitors create bookings and
 * visitors arriving from an email link reschedule them. Input is validated
 * server-side and a reschedule requires proof of possession.
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
  randomToken,
  secretsMatch,
  corsHeaders,
} from "../_shared/commercial-write.ts";

const RATE_LIMIT = createRateLimiter(20, 60_000);

/** Bookings a visitor may still move on their own. */
const RESCHEDULABLE_STATUSES = ["requested", "confirmed"];

type BookingRequest = {
  action: "lookup" | "create" | "reschedule";
  booking_id?: string;
  email?: string;
  reschedule_secret?: string;

  name?: string;
  phone?: string;
  company?: string;
  website?: string;
  timezone?: string;
  start_at?: string;
  end_at?: string;
  notes?: string;
  market?: string;
  locale?: string;

  /** Retired pre-2027 meeting/CRM fields, preserved into metadata. */
  meeting_type?: string;
  meeting_date?: string;
  meeting_time?: string;
  jitsi_room?: string;
  meeting_link?: string;
  language?: string;
  lead_status?: string;
  challenges?: string;
};

type BookingRow = {
  id: string;
  name: string;
  email: string;
  status: string;
  market: string;
  locale: string;
  timezone: string;
  start_at: string;
  end_at: string;
  notes: string | null;
  lead_id: string | null;
  metadata: Record<string, unknown> | null;
};

/** `j•••@example.com` — enough to recognise, not enough to leak. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "•••";
  const head = local.slice(0, 1);
  return `${head}${"•".repeat(Math.max(local.length - 1, 3))}@${domain}`;
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (isPayloadTooLarge(req)) return json({ error: "Pedido demasiado grande." }, 413);
  if (!RATE_LIMIT(clientKey(req))) {
    return json({ error: "Demasiados pedidos. Tenta novamente em breve." }, 429);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("booking-request: missing server configuration");
    return json({ error: "Configuração do servidor incompleta." }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = (await req.json()) as BookingRequest;
    const action = body.action;
    if (action !== "lookup" && action !== "create" && action !== "reschedule") {
      return json({ error: "Ação inválida." }, 400);
    }

    // ------------------------------------------------------------- lookup
    if (action === "lookup") {
      const bookingId = cleanText(body.booking_id, 64);
      if (!bookingId) return json({ error: "Identificador em falta." }, 400);

      const { data, error } = await supabase
        .from("bookings")
        .select("id, name, email, status, timezone, start_at, end_at, metadata")
        .eq("id", bookingId)
        .maybeSingle<BookingRow>();

      if (error || !data) {
        // Do not distinguish "not found" from "not allowed" in the message.
        return json({ error: "Reserva não encontrada." }, 404);
      }

      const metadata = (data.metadata ?? {}) as Record<string, unknown>;
      return json({
        booking_id: data.id,
        name: data.name,
        email_hint: maskEmail(data.email),
        timezone: data.timezone,
        start_at: data.start_at,
        end_at: data.end_at,
        meeting_type: typeof metadata.meeting_type === "string" ? metadata.meeting_type : null,
        company: typeof metadata.company === "string" ? metadata.company : null,
        phone: typeof metadata.phone === "string" ? metadata.phone : null,
        website: typeof metadata.website === "string" ? metadata.website : null,
        challenges: typeof metadata.challenges === "string" ? metadata.challenges : null,
        reschedulable: RESCHEDULABLE_STATUSES.includes(data.status),
      });
    }

    // ------------------------------------------------------------ create
    if (action === "create") {
      const email = cleanEmail(body.email);
      const name = cleanText(body.name, FIELD_LIMITS.name);
      const timezone = cleanText(body.timezone, 64);
      if (!email || !name || !timezone) {
        return json({ error: "Nome, email e fuso horário são obrigatórios." }, 400);
      }
      if (!isIsoTimestamp(body.start_at) || !isIsoTimestamp(body.end_at)) {
        return json({ error: "Intervalo da reunião inválido." }, 400);
      }
      if (new Date(body.end_at).getTime() <= new Date(body.start_at).getTime()) {
        return json({ error: "A reunião tem de terminar depois de começar." }, 400);
      }

      const market = deriveMarket(body.market, req.headers.get("accept-language"));
      const locale = deriveLocale(market, body.locale);

      const legacy = buildLegacyMetadata({
        meeting_type: cleanText(body.meeting_type, FIELD_LIMITS.short),
        meeting_date: cleanText(body.meeting_date, FIELD_LIMITS.short),
        meeting_time: cleanText(body.meeting_time, FIELD_LIMITS.short),
        jitsi_room: cleanText(body.jitsi_room, FIELD_LIMITS.short),
        meeting_link: cleanText(body.meeting_link, 500),
        language: cleanText(body.language, 35),
        lead_status: cleanText(body.lead_status, FIELD_LIMITS.short),
        challenges: cleanText(body.challenges, FIELD_LIMITS.text),
        phone: cleanText(body.phone, 40),
        company: cleanText(body.company, FIELD_LIMITS.short),
        website: cleanText(body.website, FIELD_LIMITS.short),
      });

      // Proof-of-possession token for later reschedules. Stored server-side in
      // `bookings.metadata` and returned to the visitor once.
      const rescheduleSecret = randomToken();

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          name,
          email,
          market,
          locale,
          timezone,
          start_at: body.start_at,
          end_at: body.end_at,
          notes: cleanText(body.notes, FIELD_LIMITS.text),
          status: "requested",
          lead_id: null,
          metadata: { ...legacy, reschedule_secret: rescheduleSecret },
        })
        .select("id, market, locale")
        .single();

      if (error) {
        console.error("booking-request create failed:", error.message);
        return json({ error: "Não foi possível criar a reserva." }, 500);
      }

      return json({
        booking_id: data.id,
        reschedule_secret: rescheduleSecret,
        market: data.market,
        locale: data.locale,
      });
    }

    // -------------------------------------------------------- reschedule
    const bookingId = cleanText(body.booking_id, 64);
    if (!bookingId) return json({ error: "Identificador em falta." }, 400);
    if (!isIsoTimestamp(body.start_at) || !isIsoTimestamp(body.end_at)) {
      return json({ error: "Intervalo da reunião inválido." }, 400);
    }

    const { data: booking, error: loadError } = await supabase
      .from("bookings")
      .select("id, name, email, status, timezone, start_at, end_at, metadata")
      .eq("id", bookingId)
      .maybeSingle<BookingRow>();

    if (loadError || !booking) {
      return json({ error: "Reserva não encontrada." }, 404);
    }
    if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
      return json({ error: "Esta reserva já não pode ser reagendada." }, 409);
    }

    // Proof of possession: the secret minted at creation, or the booking email.
    const storedSecret = typeof booking.metadata?.reschedule_secret === "string"
      ? (booking.metadata.reschedule_secret as string)
      : null;
    const providedSecret = cleanText(body.reschedule_secret, 64);
    const providedEmail = cleanEmail(body.email);

    const secretOk = !!storedSecret && !!providedSecret && secretsMatch(storedSecret, providedSecret);
    const emailOk = !!providedEmail && providedEmail === booking.email.toLowerCase();
    if (!secretOk && !emailOk) {
      return json({ error: "Não foi possível validar esta reserva." }, 403);
    }

    const metadata = { ...(booking.metadata ?? {}) } as Record<string, unknown>;
    metadata.meeting_date = new Date(body.start_at).toISOString().slice(0, 10);
    metadata.meeting_time = new Date(body.start_at).toISOString().slice(11, 16);
    metadata.timezone = cleanText(body.timezone, 64) ?? booking.timezone;
    if (body.jitsi_room) metadata.jitsi_room = cleanText(body.jitsi_room, FIELD_LIMITS.short);
    if (body.meeting_link) metadata.meeting_link = cleanText(body.meeting_link, 500);

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        start_at: body.start_at,
        end_at: body.end_at,
        timezone: metadata.timezone as string,
        // A moved meeting returns to "requested" until an admin confirms it.
        status: "requested",
        metadata,
      })
      .eq("id", bookingId);

    if (updateError) {
      console.error("booking-request reschedule failed:", updateError.message);
      return json({ error: "Não foi possível reagendar." }, 500);
    }

    return json({ booking_id: bookingId, status: "requested", rescheduled_at: nowIso() });
  } catch (err) {
    console.error("booking-request error:", err);
    return json({ error: "Erro inesperado." }, 500);
  }
});
