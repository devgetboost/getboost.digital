import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED_MODELS = new Set([
  'google/gemini-3-flash-preview',
  'google/gemini-3.1-flash-lite',
  'google/gemini-3.5-flash',
  'google/gemini-2.5-flash',
  'google/gemini-2.5-flash-lite',
  'google/gemini-2.5-pro',
  'openai/gpt-5',
  'openai/gpt-5-mini',
  'openai/gpt-5-nano',
]);

const FAST_MODE_SUPPORTED = new Set(['openai/gpt-5', 'openai/gpt-5-mini']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ ok: false, error: 'Não autenticado' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_KEY) return json({ ok: false, error: 'LOVABLE_API_KEY em falta no servidor' }, 500);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes.user) return json({ ok: false, error: 'Sessão inválida' }, 401);

    const { data: isAdmin } = await admin.rpc('has_role', {
      _user_id: userRes.user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ ok: false, error: 'Requer perfil admin' }, 403);

    const body = await req.json().catch(() => ({}));
    const model = typeof body.model === 'string' ? body.model : '';
    const fastMode = !!body.fastMode;
    if (!ALLOWED_MODELS.has(model)) return json({ ok: false, error: 'Modelo não suportado' }, 400);

    const started = Date.now();
    const payload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: 'Ping de teste. Responde apenas "ok".' },
        { role: 'user', content: 'ping' },
      ],
      max_tokens: 8,
    };
    if (fastMode && FAST_MODE_SUPPORTED.has(model)) payload.service_tier = 'priority';

    const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${LOVABLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const latency = Date.now() - started;

    if (aiRes.status === 429) return json({ ok: false, error: 'Limite de pedidos atingido. Tenta mais tarde.', status: 429, latency }, 200);
    if (aiRes.status === 402) return json({ ok: false, error: 'Créditos AI esgotados.', status: 402, latency }, 200);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      return json({ ok: false, error: `Erro do gateway (${aiRes.status})`, detail: t.slice(0, 300), status: aiRes.status, latency }, 200);
    }

    const data = await aiRes.json();
    const reply = data?.choices?.[0]?.message?.content ?? '';
    return json({ ok: true, model, latency, reply: String(reply).slice(0, 120) });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message ?? 'Erro inesperado' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
