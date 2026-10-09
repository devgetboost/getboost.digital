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
 *  - `create`     Public booking submission.
 *  - `reschedule` Requires the booking id **plus** the matching email. Without
 *                 it the request is refused.
 *
 * R1C8 correction: `public.bookings` has no `metadata` column (only `leads`
 * does), so this function stores nothing beyond the native columns. The retired
 * meeting fields (jitsi room, meeting link, meeting type, phone, website,
 * challenges) are carried in the confirmation email sent at booking time
 * instead of being persisted — there is no Clean V1 column for them. Proof of
 * possession for a reschedule is the booking email itself.
 *
 * Public endpoint (verify_jwt = false): anonymous visitors create bookings and
 * visitors arriving from an email link reschedule them. Input is validated
 * server-side and a reschedule requires proof of possession.
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

const RATE_LIMIT = createRateLimiter(20, 60_000);

/** Bookings a visitor may still move on their own. */
const RESCHEDULABLE_STATUSES = ["requested", "confirmed"];

type BookingRequest = {
  action: "lookup" | "create" | "reschedule";
  booking_id?: string;
  email?: string;

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

  /**
   * The visitor's free-text notes. Stored in the native `notes` column.
   * (The legacy `challenges` field maps here.)
   */
  notes?: string;
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
        .select("id, name, email, status, timezone, start_at, end_at")
        .eq("id", bookingId)
        .maybeSingle<BookingRow>();

      if (error || !data) {
        // Do not distinguish "not found" from "not allowed" in the message.
        return json({ error: "Reserva não encontrada." }, 404);
      }

      return json({
        booking_id: data.id,
        name: data.name,
        email_hint: maskEmail(data.email),
        timezone: data.timezone,
        start_at: data.start_at,
        end_at: data.end_at,
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
        })
        .select("id, market, locale")
        .single();

      if (error) {
        console.error("booking-request create failed:", error.message);
        return json({ error: "Não foi possível criar a reserva." }, 500);
      }

      return json({
        booking_id: data.id,
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
      .select("id, name, email, status, timezone, start_at, end_at")
      .eq("id", bookingId)
      .maybeSingle<BookingRow>();

    if (loadError || !booking) {
      return json({ error: "Reserva não encontrada." }, 404);
    }
    if (!RESCHEDULABLE_STATUSES.includes(booking.status)) {
      return json({ error: "Esta reserva já não pode ser reagendada." }, 409);
    }

    // Proof of possession: the booking email. Only the address the booking was
    // made with can move it.
    const providedEmail = cleanEmail(body.email);
    if (!providedEmail || providedEmail !== booking.email.toLowerCase()) {
      return json({ error: "Não foi possível validar esta reserva." }, 403);
    }

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        start_at: body.start_at,
        end_at: body.end_at,
        timezone: cleanText(body.timezone, 64) ?? booking.timezone,
        // A moved meeting returns to "requested" until an admin confirms it.
        status: "requested",
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
