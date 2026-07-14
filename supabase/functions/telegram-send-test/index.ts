import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.100.1';
import { z } from 'https://esm.sh/zod@3.23.8';

const BodySchema = z.object({
  chat_id: z.string().trim().min(1).max(64).refine(
    (v) => /^(-100\d{6,}|-?\d{5,})$/.test(v) || /^@[A-Za-z][A-Za-z0-9_]{4,}$/.test(v),
    { message: "Formato inválido. Usa @username ou ID numérico (ex: -1001234567890)." },
  ),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Admin-only: valida JWT + role
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes?.user) {
      return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userRes.user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const parsed = BodySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return new Response(JSON.stringify({ ok: false, error: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { chat_id } = parsed.data;

    const token = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
      return new Response(JSON.stringify({ ok: false, error: 'TELEGRAM_BOT_TOKEN não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: '✅ Teste de ligação — Getboost Concierge. Se recebeste esta mensagem, o chat ID está bem configurado.',
      }),
    });
    const tgBody = await tgRes.json().catch(() => ({}));
    if (!tgRes.ok || !tgBody?.ok) {
      return new Response(JSON.stringify({
        ok: false,
        error: tgBody?.description ?? `Telegram HTTP ${tgRes.status}`,
        status: tgRes.status,
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true, message_id: tgBody.result?.message_id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
