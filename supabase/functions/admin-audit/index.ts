/**
 * R1C8 Wave 6 — trusted admin audit writer.
 *
 * `public.admin_audit_log` grants admins SELECT only, so the browser cannot
 * insert rows directly (and must never hold the service key). This function
 * holds the service key and is the single writer of the audit table.
 *
 * Every request is verified: the caller must present a user JWT belonging to
 * an admin (`has_role` RPC). Anonymous and non-admin calls are refused.
 *
 * Body: { action, entity, entity_id?, metadata? }
 *  - action:   short verb, e.g. "content.publish", "lead.status"
 *  - entity:   e.g. "content_entry", "lead", "booking", "subscriber"
 *  - entity_id: the row id, when the action targets one row
 *  - metadata: small JSON object (no snapshots, no secrets, no PII beyond ids)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Método não permitido." }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Não autorizado." }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error("admin-audit: missing server configuration");
      return json({ error: "Configuração do servidor incompleta." }, 500);
    }

    // Verify the caller with their own JWT.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json({ error: "Não autorizado." }, 401);

    // Re-verify the admin role server-side; the browser is never trusted.
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("has_role", {
      _user_id: caller.id,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Acesso restrito ao admin." }, 403);

    const body = (await req.json()) as {
      action?: unknown;
      entity?: unknown;
      entity_id?: unknown;
      metadata?: unknown;
    };

    const action = typeof body.action === "string" ? body.action.trim().slice(0, 120) : "";
    const entity = typeof body.entity === "string" ? body.entity.trim().slice(0, 120) : "";
    if (!action || !entity) {
      return json({ error: "Ação e entidade são obrigatórias." }, 400);
    }

    const entityId =
      typeof body.entity_id === "string" && body.entity_id.trim().length > 0
        ? body.entity_id.trim().slice(0, 64)
        : null;

    const metadata =
      typeof body.metadata === "object" && body.metadata !== null
        ? (body.metadata as Record<string, unknown>)
        : {};

    const { data, error } = await adminClient
      .from("admin_audit_log")
      .insert({
        actor_id: caller.id,
        action,
        entity,
        entity_id: entityId,
        metadata,
      })
      .select("id, occurred_at")
      .single();

    if (error) {
      console.error("admin-audit insert failed:", error.message);
      return json({ error: "Não foi possível registar a auditoria." }, 500);
    }

    return json({ audit_id: data.id, occurred_at: data.occurred_at });
  } catch (err) {
    console.error("admin-audit error:", err);
    return json({ error: "Erro inesperado." }, 500);
  }
});
