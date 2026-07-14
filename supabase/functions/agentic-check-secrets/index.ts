import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const ALLOWED = new Set(['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY', 'LOVABLE_API_KEY']);

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

    let names: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.names)) names = body.names.filter((n: unknown) => typeof n === 'string');
    } catch { /* ignore */ }
    if (names.length === 0) names = Array.from(ALLOWED);

    // Read DB-stored keys (values are never returned; only presence).
    const { data: dbKeys } = await admin
      .from('agentic_provider_keys')
      .select('name, updated_at');
    const dbMap = new Map<string, string>();
    (dbKeys ?? []).forEach((r: any) => dbMap.set(r.name, r.updated_at));

    const status: Record<string, boolean> = {};
    const source: Record<string, 'env' | 'db' | null> = {};
    const updatedAt: Record<string, string | null> = {};
    for (const n of names) {
      if (!ALLOWED.has(n)) { status[n] = false; source[n] = null; updatedAt[n] = null; continue; }
      const env = Deno.env.get(n);
      if (env && env.trim().length > 0) {
        status[n] = true; source[n] = 'env'; updatedAt[n] = null;
      } else if (dbMap.has(n)) {
        status[n] = true; source[n] = 'db'; updatedAt[n] = dbMap.get(n) ?? null;
      } else {
        status[n] = false; source[n] = null; updatedAt[n] = null;
      }
    }
    return json({ ok: true, status, source, updatedAt });
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
