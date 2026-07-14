// Corre os cenários de teste dos agentes agentic e grava resultados em
// `agentic_scenario_runs`. Invocado pelo cron diário; também aceita chamadas
// manuais com Authorization Bearer <SUPABASE_SERVICE_ROLE_KEY>.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Scenario = {
  id: string;
  label: string;
  body: unknown;
  validate: (payload: any, status: number) => { ok: boolean; reason?: string };
};
type AgentDef = { fn: string; scenarios: Scenario[] };

const nonEmpty = (v: unknown) => typeof v === "string" && v.trim().length > 0;

function buildAudit(overrides: Record<string, string> = {}) {
  return {
    answers: {
      industry: "SaaS",
      teamSize: "3-5",
      currentCrm: "HubSpot Free",
      leadVolume: "50-100",
      conversionRate: "5-10%",
      biggestChallenge: "Follow-up manual",
      automationLevel: "baixo",
      ...overrides,
    },
    contact: {
      name: "Cron Cenário",
      email: `cron+${Date.now()}@getboost.digital`,
      company: "Cron Lda",
    },
  };
}

const AGENTS: AgentDef[] = [
  {
    fn: "blog-ai-assist",
    scenarios: [
      { id: "improve", label: "improve texto curto",
        body: { action: "improve", content: "Marketing digital é importante para empresas." },
        validate: (p, s) => ({ ok: s === 200 && nonEmpty(p?.result), reason: p?.error }) },
      { id: "seo", label: "seo com keyword",
        body: { action: "seo", title: "Como escolher um CRM em 2026", keyword: "CRM PME Portugal" },
        validate: (p, s) => ({ ok: s === 200 && nonEmpty(p?.result), reason: p?.error }) },
      { id: "summary", label: "resumo",
        body: { action: "summary", content: "A automação comercial permite reduzir tempo perdido em tarefas repetitivas e aumentar a conversão de leads qualificados, sobretudo em PMEs." },
        validate: (p, s) => ({ ok: s === 200 && nonEmpty(p?.result), reason: p?.error }) },
    ],
  },
  {
    fn: "content-ideas",
    scenarios: [
      { id: "pt-local", label: "PT nicho local",
        body: { niche: "Restaurantes locais em Lisboa", language: "pt", email: `cron+${Date.now()}@getboost.digital`, name: "Cron" },
        validate: (p, s) => ({ ok: s === 200 && Array.isArray(p?.ideas) && p.ideas.length > 0, reason: p?.error ?? `status ${s}` }) },
      { id: "en-saas", label: "EN SaaS",
        body: { niche: "SaaS B2B para RH", language: "en", email: `cron+${Date.now()}@getboost.digital`, name: "Cron" },
        validate: (p, s) => ({ ok: s === 200 && Array.isArray(p?.ideas) && p.ideas.length > 0, reason: p?.error ?? `status ${s}` }) },
      { id: "estetica", label: "PT saúde",
        body: { niche: "Clínicas de estética", language: "pt", email: `cron+${Date.now()}@getboost.digital`, name: "Cron" },
        validate: (p, s) => ({ ok: s === 200 && Array.isArray(p?.ideas) && p.ideas.length > 0, reason: p?.error ?? `status ${s}` }) },
    ],
  },
  {
    fn: "commercial-audit",
    scenarios: [
      { id: "saas", label: "SaaS pequena equipa", body: buildAudit({ industry: "SaaS" }),
        validate: (p, s) => ({ ok: s === 200 && typeof p?.report?.score === "number" && nonEmpty(p?.report?.classificacao), reason: p?.error ?? `status ${s}` }) },
      { id: "ecom", label: "E-commerce sem CRM",
        body: buildAudit({ industry: "E-commerce", currentCrm: "Nenhum", automationLevel: "nenhum" }),
        validate: (p, s) => ({ ok: s === 200 && typeof p?.report?.score === "number" && nonEmpty(p?.report?.classificacao), reason: p?.error ?? `status ${s}` }) },
      { id: "servicos", label: "Serviços high-touch",
        body: buildAudit({ industry: "Serviços profissionais", teamSize: "10+", conversionRate: "20-30%" }),
        validate: (p, s) => ({ ok: s === 200 && typeof p?.report?.score === "number" && nonEmpty(p?.report?.classificacao), reason: p?.error ?? `status ${s}` }) },
    ],
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Aceita: (a) service role (cron), (b) admin autenticado via JWT.
  const auth = req.headers.get("Authorization") ?? "";
  const bearer = auth.replace(/^Bearer\s+/i, "").trim();
  const supabase = createClient(supabaseUrl, serviceKey);
  let authorized = bearer.length > 0 && bearer === serviceKey;
  if (!authorized && bearer) {
    const { data: userData } = await supabase.auth.getUser(bearer);
    if (userData?.user?.id) {
      const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
      authorized = !!isAdmin;
    }
  }
  if (!authorized) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const batchId = crypto.randomUUID();
  const rows: any[] = [];

  // Pre-resolve agent_id for each function slug so scenario runs can be
  // filtered by agent in the admin panel.
  const slugToAgentId = new Map<string, string>();
  {
    const { data: agents } = await supabase
      .from("agentic_agents")
      .select("id,function_slug")
      .not("function_slug", "is", null);
    for (const a of agents ?? []) {
      if (a.function_slug) slugToAgentId.set(a.function_slug as string, a.id as string);
    }
  }

  for (const agent of AGENTS) {
    for (const sc of agent.scenarios) {
      const t0 = performance.now();
      let httpStatus = 0;
      let payload: any = null;
      let errText: string | null = null;
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/${agent.fn}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
            apikey: serviceKey,
          },
          body: JSON.stringify(sc.body),
        });
        httpStatus = res.status;
        payload = await res.json().catch(() => null);
      } catch (e) {
        errText = e instanceof Error ? e.message : String(e);
      }
      const durationMs = Math.round(performance.now() - t0);

      let status: "pass" | "fail" | "error" = "error";
      let reason: string | undefined = errText ?? undefined;
      if (!errText) {
        const val = sc.validate(payload ?? {}, httpStatus);
        status = val.ok ? "pass" : "fail";
        reason = val.reason;
      }

      rows.push({
        batch_id: batchId,
        agent_fn: agent.fn,
        agent_id: slugToAgentId.get(agent.fn) ?? null,
        scenario_id: sc.id,
        scenario_label: sc.label,
        status,
        http_status: httpStatus || null,
        duration_ms: durationMs,
        payload,
        request_body: sc.body,
        error: errText,
        reason: reason ?? null,
      });
    }
  }


  const { error: insertErr } = await supabase.from("agentic_scenario_runs").insert(rows);
  if (insertErr) {
    console.error("agentic-scenario-cron insert failed:", insertErr);
    return new Response(JSON.stringify({ error: insertErr.message, batchId, rows }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const summary = rows.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; },
    { pass: 0, fail: 0, error: 0 } as Record<string, number>,
  );

  return new Response(JSON.stringify({ batchId, count: rows.length, summary }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
