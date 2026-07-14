import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller is admin
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const admin = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await admin.from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const clientUserId = typeof body?.client_user_id === "string" ? body.client_user_id : null;
    if (!clientUserId) {
      return new Response(JSON.stringify({ error: "client_user_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gather full client dossier
    const [profile, services, subs, invoices, tickets] = await Promise.all([
      admin.from("profiles").select("*").eq("user_id", clientUserId).maybeSingle(),
      admin.from("client_services").select("*").eq("user_id", clientUserId),
      admin.from("client_subscriptions").select("*").eq("user_id", clientUserId),
      admin.from("client_invoices").select("*").eq("user_id", clientUserId),
      admin.from("support_tickets").select("*").eq("user_id", clientUserId),
    ]);

    const dossier = {
      profile: profile.data,
      services: services.data || [],
      subscriptions: subs.data || [],
      invoices: invoices.data || [],
      tickets: tickets.data || [],
    };

    const today = new Date().toISOString().slice(0, 10);

    // Heuristic signals
    const overdueInvoices = dossier.invoices.filter((i: any) => i.status !== "paid" && i.due_date && i.due_date < today);
    const pendingInvoices = dossier.invoices.filter((i: any) => i.status === "pending");
    const stalledServices = dossier.services.filter((s: any) => s.status === "in_progress" && (s.progress ?? 0) < 30);
    const awaitingApproval = dossier.services.filter((s: any) => s.status === "awaiting_approval");
    const openTickets = dossier.tickets.filter((t: any) => t.status === "open" || t.status === "in_progress");
    const renewalsSoon = dossier.subscriptions.filter((s: any) => {
      if (!s.renewal_date) return false;
      const diff = (new Date(s.renewal_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 14;
    });

    const signals = {
      overdueInvoices: overdueInvoices.length,
      pendingInvoices: pendingInvoices.length,
      stalledServices: stalledServices.length,
      awaitingApproval: awaitingApproval.length,
      openTickets: openTickets.length,
      renewalsSoon: renewalsSoon.length,
      activeSubscriptions: dossier.subscriptions.filter((s: any) => s.status === "active").length,
      totalMRR: dossier.subscriptions
        .filter((s: any) => s.status === "active" && s.billing_cycle === "monthly")
        .reduce((acc: number, s: any) => acc + Number(s.amount || 0), 0),
    };

    // Ask Lovable AI for prioritized automation flows
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    let aiFlows: any[] = [];
    let aiSummary = "";

    if (lovableKey) {
      const systemPrompt = `És um especialista em customer success e automação. Analisas a ficha de um cliente (serviços, assinaturas, faturas, tickets) e devolves fluxos de automação acionáveis, em português de Portugal. Responde APENAS em JSON válido.`;

      const userPrompt = `Cliente: ${dossier.profile?.display_name || "Sem nome"}
Dossier resumido: ${JSON.stringify({ signals, services: dossier.services.length, subs: dossier.subscriptions.length, invoices: dossier.invoices.length, tickets: dossier.tickets.length })}

Detalhes:
- Faturas atrasadas: ${overdueInvoices.length} (${overdueInvoices.map((i: any) => `${i.invoice_number}/${i.amount}€`).join(", ")})
- Faturas pendentes: ${pendingInvoices.length}
- Serviços estagnados (<30%): ${stalledServices.map((s: any) => s.service_name).join(", ") || "—"}
- Serviços a aguardar aprovação: ${awaitingApproval.map((s: any) => s.service_name).join(", ") || "—"}
- Tickets abertos: ${openTickets.map((t: any) => t.subject).join("; ") || "—"}
- Renovações próximas (14d): ${renewalsSoon.map((s: any) => s.name).join(", ") || "—"}

Devolve JSON com:
{
  "summary": "1-2 frases de diagnóstico",
  "health_score": 0-100,
  "flows": [
    {
      "id": "slug",
      "title": "Título curto",
      "priority": "high|medium|low",
      "channel": "email|whatsapp|task|call",
      "trigger": "razão",
      "suggested_message": "mensagem pronta a enviar (máx 4 linhas)",
      "action_label": "rótulo do botão"
    }
  ]
}
Máx 6 fluxos. Foca em ações que aumentem satisfação, retenção, cobrança e upsell.`;

      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const content = aiJson.choices?.[0]?.message?.content || "{}";
          const parsed = JSON.parse(content);
          aiFlows = Array.isArray(parsed.flows) ? parsed.flows : [];
          aiSummary = parsed.summary || "";
        }
      } catch (e) {
        console.error("AI call failed", e);
      }
    }

    return new Response(JSON.stringify({ signals, summary: aiSummary, flows: aiFlows, dossier_counts: { services: dossier.services.length, subscriptions: dossier.subscriptions.length, invoices: dossier.invoices.length, tickets: dossier.tickets.length } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("client-automation-analyze error", err);
    return new Response(JSON.stringify({ error: err?.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
