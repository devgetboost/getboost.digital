import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.100.1";
import { buildProductKnowledgeSectionOrFallback, normalizeProductSlug } from "../_shared/product-knowledge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, message, visitor_name, product_slug } = await req.json();

    if (!conversation_id || !message || typeof message !== "string" || message.trim().length === 0) {
      return new Response(JSON.stringify({ error: "conversation_id and message are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (message.length > 2000) {
      return new Response(JSON.stringify({ error: "Message too long (max 2000 chars)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get assistant settings
    const { data: settings } = await supabase
      .from("assistant_settings")
      .select("*")
      .eq("id", 1)
      .single();

    if (!settings?.is_active) {
      return new Response(JSON.stringify({ reply: "O assistente está temporariamente indisponível. Por favor, contacte-nos através do formulário de contacto." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save user message
    await supabase.from("chat_messages").insert({
      conversation_id,
      role: "user",
      content: message.trim(),
    });

    // Get conversation history (last 20 messages)
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = (history || []).map((m) => ({
      role: m.role === "admin" ? "assistant" : m.role,
      content: m.content,
    }));

    // Build system prompt with knowledge base
    let systemPrompt = settings.system_prompt || "";
    if (settings.knowledge_base) {
      systemPrompt += `\n\nInformações adicionais para consulta:\n${settings.knowledge_base}`;
    }
    // Injeta knowledge pack específico do produto (product_knowledge)
    const productSection = await buildProductKnowledgeSectionOrFallback(supabase, normalizeProductSlug(product_slug));
    if (productSection) systemPrompt += productSection;
    if (visitor_name) {
      systemPrompt += `\n\nO nome do visitante é: ${visitor_name}. Na PRIMEIRA mensagem, cumprimenta-o pelo nome (ex: "Olá ${visitor_name}!"). Nas mensagens seguintes, não precisa repetir o nome a toda a hora.`;
    }
    systemPrompt += `\n\nREGRAS DE FORMATAÇÃO OBRIGATÓRIAS:
- NUNCA uses markdown: nada de **, __, [], (), #, ou qualquer formatação markdown.
- NUNCA uses a sintaxe [texto](url). Escreve o texto normalmente e o URL separado.
- Exemplo CORRETO: "Pode agendar a sua reunião aqui: https://getboost.digital/booking"
- Exemplo ERRADO: "[Agendar reunião](https://getboost.digital/booking)" ou "**link**"
- Escreve sempre texto simples e limpo.

Links importantes do site:
- Agendar reunião: https://getboost.digital/booking
- Contacto: https://getboost.digital/contact
- Serviços: https://getboost.digital/services
- Portfolio: https://getboost.digital/portfolio
- Blog: https://getboost.digital/blog
- Sobre: https://getboost.digital/about

Quando o utilizador pedir para agendar uma reunião ou consulta, fornece SEMPRE o link exato: https://getboost.digital/booking — nunca inventes links como Calendly ou outros.`;
    systemPrompt += `\n\nSe o utilizador pedir para falar com um humano ou se não conseguires ajudar adequadamente, responde EXATAMENTE com a frase: "[ESCALATE]" no início da mensagem, seguida de uma mensagem educada a informar que vais transferir para um humano.`;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ reply: "Estou com muitas conversas neste momento. Tenta novamente em breve!" }), {
          status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.error("AI error:", aiResponse.status, await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    let reply = aiData.choices?.[0]?.message?.content || "Desculpa, não consegui processar a tua mensagem.";

    // Check for escalation
    let escalated = false;
    if (reply.includes("[ESCALATE]")) {
      reply = reply.replace("[ESCALATE]", "").trim();
      escalated = true;
      await supabase
        .from("chat_conversations")
        .update({ status: "escalated", updated_at: new Date().toISOString() })
        .eq("id", conversation_id);
    }

    // Save assistant reply
    await supabase.from("chat_messages").insert({
      conversation_id,
      role: "assistant",
      content: reply,
    });

    return new Response(JSON.stringify({ reply, escalated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chat-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
