// Reenvia relatório de auditoria comercial por email
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { reportId } = await req.json();
    if (!reportId) {
      return new Response(JSON.stringify({ error: "reportId em falta" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row, error } = await supabase
      .from("commercial_audit_reports")
      .select("*")
      .eq("id", reportId)
      .single();

    if (error || !row) {
      return new Response(JSON.stringify({ error: "Relatório não encontrado" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const r: any = row.report || {};
    const templateData = {
      name: row.contact_name,
      company: row.contact_company,
      industry: row.industry,
      score: row.score,
      verdict: row.verdict || r.verdict,
      strengths: r.strengths || [],
      gaps: r.gaps || [],
      recommendations: r.recommendations || [],
      projection: r.projection || {},
      nextStep: r.nextStep,
    };

    const { error: sendErr } = await supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "audit-report",
        recipientEmail: row.contact_email,
        idempotencyKey: `audit-report-resend-${reportId}-${Date.now()}`,
        templateData,
      },
    });

    if (sendErr) {
      console.error("Send error:", sendErr);
      await supabase.from("commercial_audit_reports").update({ report_status: "error" }).eq("id", reportId);
      return new Response(JSON.stringify({ error: "Falha no envio" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("commercial_audit_reports").update({ report_status: "emailed" }).eq("id", reportId);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
