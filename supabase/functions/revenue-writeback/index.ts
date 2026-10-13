/**
 * R20.18 — revenue writeback endpoint.
 *
 * Closes the commercial attribution loop: when the CRM/operator moves a deal
 * (proposal sent → negotiation → won/lost), this function appends the stage
 * transition to the `revenue_events` ledger and advances the opportunity.
 *
 * Security model (mirrors the B2 webhook precedent):
 *  - NOT a public form. Every call must present
 *    `Authorization: Bearer <REVENUE_WEBHOOK_SECRET>` (operator-set secret).
 *  - Holds the service-role key; the browser can never write these tables
 *    (RLS denies anon/authenticated, like leads/bookings).
 *  - Validates linkage: the opportunity must belong to the given lead, and
 *    `won` requires a value + close date (mirrored in DB constraints so a
 *    bypassing writer still cannot create dirty rows).
 *  - Idempotent per (opportunity_id, stage, occurred_at-day): replays of the
 *    same transition return the existing event instead of duplicating it.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  cleanText,
  isPayloadTooLarge,
  createRateLimiter,
  clientKey,
  json,
  secretsMatch,
} from "../_shared/commercial-write.ts";

const RATE_LIMIT = createRateLimiter(60, 60_000);

const STAGES = ["open", "proposal_sent", "negotiation", "won", "lost"] as const;
type Stage = (typeof STAGES)[number];

interface WritebackBody {
  opportunity_id?: unknown;
  lead_id?: unknown;
  crm_id?: unknown;
  deal_stage?: unknown;
  deal_value?: unknown;
  close_date?: unknown;
  note?: unknown;
}

const isIsoDate = (value: unknown): value is string =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isUuid = (value: unknown): value is string =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

const cleanMoney = (value: unknown): number | null | undefined => {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[^\d.,-]/g, "").replace(",", "."));
  if (!Number.isFinite(n) || n < 0 || n > 999_999_999.99) return undefined;
  return Math.round(n * 100) / 100;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);
  if (isPayloadTooLarge(req)) return json({ error: "Pedido demasiado grande." }, 413);
  if (!RATE_LIMIT(clientKey(req))) {
    return json({ error: "Demasiados pedidos. Tenta novamente em breve." }, 429);
  }

  const secret = Deno.env.get("REVENUE_WEBHOOK_SECRET") ?? "";
  const presented = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  if (!secret || !presented || !secretsMatch(secret, presented)) {
    return json({ error: "Unauthorized." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("revenue-writeback: missing server configuration");
    return json({ error: "Configuração do servidor incompleta." }, 500);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let body: WritebackBody;
  try {
    body = (await req.json()) as WritebackBody;
  } catch {
    return json({ error: "Corpo JSON inválido." }, 400);
  }

  if (!isUuid(body.opportunity_id)) return json({ error: "opportunity_id inválido." }, 400);
  if (!isUuid(body.lead_id)) return json({ error: "lead_id inválido." }, 400);
  if (typeof body.deal_stage !== "string" || !(STAGES as readonly string[]).includes(body.deal_stage)) {
    return json({ error: "deal_stage inválido." }, 400);
  }
  const stage = body.deal_stage as Stage;
  const value = cleanMoney(body.deal_value);
  if (value === undefined) {
    return json({ error: "deal_value inválido." }, 400);
  }
  const closeDate = body.close_date ?? null;
  if (closeDate !== null && !isIsoDate(closeDate)) return json({ error: "close_date inválida (AAAA-MM-DD)." }, 400);
  if (stage === "won" && (value === null || closeDate === null)) {
    return json({ error: "won exige deal_value e close_date." }, 400);
  }
  if (stage === "lost" && closeDate === null) {
    return json({ error: "lost exige close_date." }, 400);
  }
  const note = cleanText(body.note, 500);
  // Optional CRM reference, carried so the row can be joined back to the CRM.
  const crmId = cleanText(body.crm_id, 80);

  // Verify the opportunity belongs to the lead (linkage check).
  const { data: opp, error: oppError } = await supabase
    .from("opportunities")
    .select("id, lead_id, stage")
    .eq("id", body.opportunity_id)
    .maybeSingle();
  if (oppError || !opp) return json({ error: "Oportunidade não encontrada." }, 404);
  if (opp.lead_id !== body.lead_id) return json({ error: "lead_id não corresponde à oportunidade." }, 409);

  const today = new Date().toISOString().slice(0, 10);
  // Idempotency: same opportunity + stage already recorded today → replay.
  const { data: existing } = await supabase
    .from("revenue_events")
    .select("id")
    .eq("opportunity_id", body.opportunity_id)
    .eq("stage", stage)
    .gte("occurred_at", `${today}T00:00:00.000Z`)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return json({ ok: true, replay: true, revenue_event_id: (existing as { id: string }).id });
  }

  const patch: Record<string, unknown> = { stage };
  if (crmId !== null) patch["crm_id"] = crmId;
  if (stage === "proposal_sent" || stage === "negotiation") {
    if (value !== null) patch["proposal_value"] = value;
  }
  if (stage === "won") {
    patch["won_value"] = value;
    patch["close_date"] = closeDate;
  }
  if (stage === "lost") {
    patch["close_date"] = closeDate;
  }
  const { error: updateError } = await supabase
    .from("opportunities")
    .update(patch)
    .eq("id", body.opportunity_id);
  if (updateError) {
    console.error("revenue-writeback: opportunity update failed", updateError.message);
    return json({ error: "Falha ao atualizar a oportunidade." }, 500);
  }

  const { data: event, error: eventError } = await supabase
    .from("revenue_events")
    .insert({
      opportunity_id: body.opportunity_id,
      lead_id: body.lead_id,
      stage,
      value,
      note,
    })
    .select("id")
    .single();
  if (eventError || !event) {
    console.error("revenue-writeback: ledger append failed", eventError?.message);
    return json({ error: "Falha ao registar o evento." }, 500);
  }
  return json({ ok: true, replay: false, revenue_event_id: (event as { id: string }).id });
});
