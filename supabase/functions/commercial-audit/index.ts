// CRM & Sales Intelligence — auditoria comercial rápida (7 min)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { callAgent } from "../_shared/agentic-runtime.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FUNCTION_SLUG = "commercial-audit";

type Answers = {
  industry: string; teamSize: string; currentCrm: string; leadVolume: string;
  conversionRate: string; biggestChallenge: string; automationLevel: string;
};
type Contact = { name: string; email: string; company?: string; phone?: string };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { answers, contact } = (await req.json()) as { answers: Answers; contact: Contact };
    if (!contact?.name || !contact?.email || !answers?.industry) {
      return new Response(JSON.stringify({ error: "Dados incompletos." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const messageSummary = [
      `Indústria: ${answers.industry}`,
      `Equipa comercial: ${answers.teamSize}`,
      `CRM atual: ${answers.currentCrm}`,
      `Leads/mês: ${answers.leadVolume}`,
      `Conversão: ${answers.conversionRate}`,
      `Maior desafio: ${answers.biggestChallenge}`,
      `Automação: ${answers.automationLevel}`,
    ].join(" | ");

    const { data: lead, error: leadErr } = await supabase.from("leads").insert({
      source: "auditoria-comercial-crm",
      name: contact.name.trim(),
      email: contact.email.trim().toLowerCase(),
      phone: contact.phone?.trim() || null,
      company: contact.company?.trim() || null,
      service: "CRM & Sales Intelligence",
      business_area: answers.industry,
      message: messageSummary,
      resource_name: "Auditoria Comercial 7 min",
      status: "new",
    }).select().single();
    if (leadErr) console.error("Lead insert error:", leadErr);

    const fallbackSystem = `És um consultor sénior em CRM e Sales Intelligence da Getboost Digital. Analisas empresas portuguesas e produzis relatórios comerciais curtos, directos e accionáveis em português de Portugal (PT-PT). Devolves SEMPRE JSON válido, sem markdown à volta, com esta estrutura exacta:
{"score":<0-100>,"verdict":"<12-18 palavras>","strengths":["...","..."],"gaps":[{"title":"...","detail":"..."}],"recommendations":[{"title":"...","impact":"...","effort":"Baixo|Médio|Alto","detail":"..."}],"projection":{"revenueUplift":"...","timeSaved":"...","paybackMonths":"..."},"nextStep":"..."}`;

    const userPrompt = `Perfil do cliente:
- Nome: ${contact.name}
- Empresa: ${contact.company || "(não indicado)"}
- Indústria: ${answers.industry}
- Equipa comercial: ${answers.teamSize}
- CRM em uso: ${answers.currentCrm}
- Leads por mês: ${answers.leadVolume}
- Taxa de conversão actual: ${answers.conversionRate}
- Maior desafio comercial: ${answers.biggestChallenge}
- Nível de automação actual: ${answers.automationLevel}

Gera o relatório personalizado agora.`;

    const result = await callAgent({
      functionSlug: FUNCTION_SLUG,
      bucketKey: contact.email.toLowerCase(),
      userPrompt,
      metadata: { industry: answers.industry, lead_id: lead?.id ?? null },
      fallback: { systemPrompt: fallbackSystem },
    });

    if (!result.ok) {
      console.error("commercial-audit call failed:", result.errorType, result.errorMessage);
      if (result.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tenta novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (result.status === 402) {
        return new Response(JSON.stringify({ error: "Serviço temporariamente indisponível." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (result.status === 503) {
        return new Response(JSON.stringify({ error: "Agente indisponível." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Erro ao gerar relatório." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let jsonStr = result.text;
    const m = result.text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) jsonStr = m[1];

    let report;
    try {
      report = JSON.parse(jsonStr.trim());
    } catch {
      console.error("Failed to parse AI report:", result.text);
      return new Response(JSON.stringify({ error: "Erro ao processar relatório." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      await supabase.from("commercial_audit_reports").insert({
        lead_id: lead?.id ?? null,
        contact_name: contact.name.trim(),
        contact_email: contact.email.trim().toLowerCase(),
        contact_company: contact.company?.trim() || null,
        contact_phone: contact.phone?.trim() || null,
        industry: answers.industry,
        answers,
        score: typeof report?.score === "number" ? Math.round(report.score) : null,
        verdict: report?.verdict ?? null,
        report,
        report_status: "generated",
      });
    } catch (err) {
      console.error("Failed to persist audit report:", err);
    }

    return new Response(JSON.stringify({ leadId: lead?.id ?? null, report }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("commercial-audit error:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
