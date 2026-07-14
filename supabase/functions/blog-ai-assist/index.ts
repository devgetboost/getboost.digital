import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { callAgent } from "../_shared/agentic-runtime.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FUNCTION_SLUG = "blog-ai-assist";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAuth = createClient(supabaseUrl, serviceRoleKey);

    const token = authHeader.replace("Bearer ", "");
    // Scenario cron uses the service role key as bearer; allow it through.
    let userId: string | null = null;
    if (token !== serviceRoleKey) {
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { data: roleData } = await supabaseAuth
        .from("user_roles").select("role")
        .eq("user_id", user.id).eq("role", "admin").maybeSingle();
      if (!roleData) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = user.id;
    }

    const { action, content, keyword, title } = await req.json();

    const prompts: Record<string, string> = {
      generate_title: `Gera 3 títulos alternativos para um artigo de blog sobre: "${title || content}". Os títulos devem ser cativantes, otimizados para SEO e em português. Responde apenas com os 3 títulos, um por linha, numerados.`,
      generate_meta_description: `Cria uma meta description SEO-friendly (máximo 155 caracteres) para o seguinte artigo:\nTítulo: ${title}\nConteúdo: ${content?.substring(0, 500)}\nResponde apenas com a meta description, sem aspas.`,
      improve_paragraph: `Reescreve o seguinte parágrafo para melhorar a clareza, fluidez e engagement. Mantém o mesmo significado e tom profissional. Responde apenas com o parágrafo melhorado, em português:\n\n${content}`,
      improve: `Reescreve o seguinte parágrafo para melhorar a clareza, fluidez e engagement. Mantém o mesmo significado e tom profissional. Responde apenas com o parágrafo melhorado, em português:\n\n${content}`,
      generate_summary: `Cria um sumário/resumo executivo (3-4 frases) do seguinte artigo em português:\n\n${content?.substring(0, 2000)}`,
      summary: `Cria um sumário/resumo executivo (3-4 frases) do seguinte artigo em português:\n\n${content?.substring(0, 2000)}`,
      suggest_headings: `Baseado no seguinte conteúdo, sugere 5 headings (H2) relevantes para estruturar o artigo. Responde em português, um heading por linha:\n\n${content?.substring(0, 1500)}`,
      seo_suggestions: `Analisa o seguinte artigo e dá 5 sugestões concretas de melhoria SEO. Keyword principal: "${keyword}". Título: "${title}". Responde em português com sugestões numeradas:\n\n${content?.substring(0, 2000)}`,
      seo: `Analisa o seguinte artigo e dá 5 sugestões concretas de melhoria SEO. Keyword principal: "${keyword}". Título: "${title}". Responde em português com sugestões numeradas:\n\n${content?.substring(0, 2000)}`,
      social_version: `Cria uma versão curta (máximo 280 caracteres) do seguinte artigo para partilhar nas redes sociais. Inclui um call-to-action. Responde em português:\n\nTítulo: ${title}\n${content?.substring(0, 500)}`,
    };

    const userPrompt = prompts[action];
    if (!userPrompt) {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await callAgent({
      functionSlug: FUNCTION_SLUG,
      bucketKey: userId ?? action,
      userPrompt,
      metadata: { action },
      fallback: {
        systemPrompt: "És um especialista em marketing digital, SEO e copywriting em português europeu. Dás respostas concisas, profissionais e prontas a usar.",
      },
    });

    if (!result.ok) {
      console.error("blog-ai-assist call failed:", result.errorType, result.errorMessage);
      if (result.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Tenta novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (result.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (result.status === 503) {
        return new Response(JSON.stringify({ error: "Agente indisponível." }), {
          status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: result.text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("blog-ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
