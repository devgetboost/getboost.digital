import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = new Set(['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ ok: false, error: 'Não autenticado' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: userRes, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !userRes.user) return json({ ok: false, error: 'Sessão inválida' }, 401);
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: userRes.user.id, _role: 'admin' });
    if (!isAdmin) return json({ ok: false, error: 'Requer perfil admin' }, 403);

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? '').trim();
    const value = String(body?.value ?? '').trim();
    const action = String(body?.action ?? 'upsert');

    if (!ALLOWED.has(name)) return json({ ok: false, error: 'Chave não permitida' }, 400);

    if (action === 'delete') {
      const { error } = await admin.from('agentic_provider_keys').delete().eq('name', name);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true });
    }

    if (value.length < 8 || value.length > 500) {
      return json({ ok: false, error: 'Valor da chave inválido (8-500 chars)' }, 400);
    }

    const { error } = await admin.from('agentic_provider_keys').upsert({
      name,
      value,
      updated_by: userRes.user.id,
      updated_at: new Date().toISOString(),
    });
    if (error) return json({ ok: false, error: error.message }, 500);
    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? 'Erro' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
