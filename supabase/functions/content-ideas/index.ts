import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAgent } from "../_shared/agentic-runtime.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FUNCTION_SLUG = "content-ideas";

/** Robustly extract JSON from a model response that may be wrapped in markdown or prose. */
function extractJson(raw: string): unknown {
  if (!raw) throw new Error("empty response");
  let s = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  const start = s.search(/[\{\[]/);
  if (start === -1) throw new Error("no JSON found");
  const openChar = s[start];
  const closeChar = openChar === "[" ? "]" : "}";
  const end = s.lastIndexOf(closeChar);
  if (end === -1 || end < start) throw new Error("no JSON end");
  s = s.substring(start, end + 1);
  try {
    return JSON.parse(s);
  } catch {
    const fixed = s
      .replace(/,\s*}/g, "}")
      .replace(/,\s*]/g, "]")
      .replace(/[\x00-\x1F\x7F]/g, " ");
    return JSON.parse(fixed);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { niche, language, email } = await req.json();

    if (!niche || typeof niche !== "string" || niche.trim().length < 2 || niche.trim().length > 200) {
      return new Response(JSON.stringify({ error: "Nicho inválido. Deve ter entre 2 e 200 caracteres." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Email obrigatório." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
    const auth = req.headers.get("Authorization") ?? "";
    const isServiceRoleCall = auth.includes(serviceKey);

    // Cenário automatizado (cron) usa service role → bypass do lead gate.
    if (!isServiceRoleCall) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: lead, error: leadErr } = await supabase
        .from("leads").select("id").ilike("email", email.trim())
        .gte("created_at", since).limit(1).maybeSingle();
      if (leadErr || !lead) {
        return new Response(JSON.stringify({ error: "Submete o formulário antes de gerar ideias." }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const lang = language === "en" ? "English" : language === "es" ? "Spanish" : "Portuguese";
    const fallbackSystem = `You are a creative digital marketing strategist. Generate content ideas in ${lang}. Return ONLY a valid JSON object with this exact structure, no markdown:
{
  "posts": [{"title":"...","description":"...","hashtags":["..."],"bestTime":"..."}],
  "reels": [{"title":"...","description":"...","hook":"...","duration":"..."}],
  "articles": [{"title":"...","description":"...","keywords":["..."],"estimatedWords":"..."}],
  "stories": [{"title":"...","description":"...","type":"..."}],
  "carousels": [{"title":"...","slides":["..."],"cta":"..."}]
}
Generate exactly 5 items for posts, 4 for reels, 3 for articles, 3 for stories, and 3 for carousels.`;

    const result = await callAgent({
      functionSlug: FUNCTION_SLUG,
      bucketKey: email.toLowerCase(),
      userPrompt: `Nicho/Indústria: ${niche.trim()} (idioma: ${lang})`,
      metadata: { niche: niche.trim(), language: lang },
      fallback: { systemPrompt: fallbackSystem },
    });

    if (!result.ok) {
      console.error("content-ideas call failed:", result.errorType, result.errorMessage);
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
      return new Response(JSON.stringify({ error: "Erro ao gerar ideias." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let ideas;
    try {
      ideas = extractJson(result.text);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr, result.text?.slice(0, 500));
      return new Response(JSON.stringify({ error: "Erro ao processar resposta da IA." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ideas, niche: niche.trim() }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("content-ideas error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
