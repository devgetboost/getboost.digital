import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { chatCompletions } from '../_shared/ai-provider.ts';

// R2B: DeepSeek is the active provider. Legacy namespaces stay accepted so
// older admin UI selections keep working — the provider layer maps them.
const ALLOWED_MODELS = new Set([
  'deepseek-chat',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'openai/gpt-5-mini',
  'openai/gpt-5',
  'google/gemini-3-flash-preview',
]);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) {
      return json({ error: 'Não autenticado' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes.user) return json({ error: 'Sessão inválida' }, 401);

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userRes.user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Requer perfil admin' }, 403);

    const body = await req.json().catch(() => ({}));
    const systemPrompt = typeof body.systemPrompt === 'string' ? body.systemPrompt.trim() : '';
    const userMessage = typeof body.userMessage === 'string' ? body.userMessage.trim() : '';
    const model = typeof body.model === 'string' ? body.model : '';
    if (!systemPrompt) return json({ error: 'Instruções do agente vazias' }, 400);
    if (!userMessage) return json({ error: 'Mensagem de teste vazia' }, 400);
    if (userMessage.length > 4000) return json({ error: 'Mensagem demasiado longa' }, 400);
    if (!ALLOWED_MODELS.has(model)) return json({ error: 'Modelo inválido' }, 400);

    // R2B: inference via the provider-neutral layer. Status mapping and the
    // reply/usage response shape are unchanged.
    const aiRes = await chatCompletions({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    });

    if (!aiRes.ok && aiRes.status === 429) return json({ error: 'Limite de pedidos atingido. Tenta mais tarde.' }, 429);
    if (!aiRes.ok && aiRes.status === 402) return json({ error: 'Créditos AI esgotados.' }, 402);
    if (!aiRes.ok) {
      return json({ error: `Erro do gateway (${aiRes.status})`, detail: aiRes.errorMessage.slice(0, 300) }, 502);
    }

    const reply = aiRes.text ?? '';
    const usage = aiRes.usage ? {
      prompt_tokens: aiRes.usage.inputTokens ?? 0,
      completion_tokens: aiRes.usage.outputTokens ?? 0,
    } : null;
    return json({ reply, usage, model });
  } catch (e) {
    return json({ error: (e as Error).message ?? 'Erro inesperado' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
