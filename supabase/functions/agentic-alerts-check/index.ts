import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const FALLBACK = { errorRatePct: 5, avgLatencyMs: 4000, minRuns: 5, windowHours: 24, cooldownHours: 6 };

type Threshold = {
  id: string; profile_name: string; agent_id: string | null;
  window_hours: number | null; window_runs: number | null;
  error_rate_pct: number; avg_latency_ms: number; min_runs: number;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: settings } = await supabase
    .from('agentic_alert_settings')
    .select('recipients,window_hours,cooldown_hours,default_error_rate_pct,default_avg_latency_ms,default_min_runs,enabled')
    .eq('id', 1).maybeSingle();

  if (settings && settings.enabled === false) return json({ ok: true, disabled: true });

  const envRecipients = (Deno.env.get('AGENTIC_ALERT_RECIPIENTS') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  const recipients: string[] = (settings?.recipients?.length ? settings.recipients : envRecipients);
  if (recipients.length === 0) return json({ ok: false, error: 'No recipients configured (settings or AGENTIC_ALERT_RECIPIENTS)' }, 400);

  const COOLDOWN_HOURS = settings?.cooldown_hours ?? FALLBACK.cooldownHours;
  const defWindow = settings?.window_hours ?? FALLBACK.windowHours;
  const defErr = settings?.default_error_rate_pct ?? FALLBACK.errorRatePct;
  const defLat = settings?.default_avg_latency_ms ?? FALLBACK.avgLatencyMs;
  const defMin = settings?.default_min_runs ?? FALLBACK.minRuns;

  const { data: agents } = await supabase.from('agentic_agents').select('id,name');
  const { data: thresholds } = await supabase
    .from('agentic_alert_thresholds')
    .select('id,profile_name,agent_id,window_hours,window_runs,error_rate_pct,avg_latency_ms,min_runs')
    .eq('enabled', true);

  const rules: Threshold[] = (thresholds as Threshold[]) ?? [];
  if (rules.length === 0) {
    rules.push({ id: 'fallback', profile_name: 'default', agent_id: null,
      window_hours: defWindow, window_runs: null, error_rate_pct: defErr, avg_latency_ms: defLat, min_runs: defMin });
  }

  type Item = { agent_id: string; agent: string; kind: 'error_rate' | 'latency'; value: string; threshold: string; runs: number; raw: number; window_hours: number | null; window_runs: number | null; profile: string };
  const items: Item[] = [];

  for (const a of agents ?? []) {
    const applicable = rules.filter((r) => r.agent_id === a.id || r.agent_id === null);
    // key by "window": time-based ("h:24") or run-based ("n:20"); specific agent wins over default
    const byKey = new Map<string, Threshold>();
    for (const r of applicable) {
      const key = r.window_runs ? `n:${r.window_runs}` : `h:${r.window_hours}`;
      const cur = byKey.get(key);
      if (!cur || (cur.agent_id === null && r.agent_id !== null)) byKey.set(key, r);
    }

    for (const rule of byKey.values()) {
      let rows: Array<{ status: string; latency_ms: number | null }> | null = null;
      if (rule.window_runs && rule.window_runs > 0) {
        const { data } = await supabase
          .from('agentic_run_logs')
          .select('status,latency_ms')
          .eq('agent_id', a.id)
          .order('created_at', { ascending: false })
          .limit(rule.window_runs);
        rows = data as any;
      } else {
        const since = new Date(Date.now() - (rule.window_hours ?? defWindow) * 3600_000).toISOString();
        const { data } = await supabase
          .from('agentic_run_logs')
          .select('status,latency_ms')
          .eq('agent_id', a.id)
          .gte('created_at', since);
        rows = data as any;
      }
      const runs = rows?.length ?? 0;
      if (runs < rule.min_runs) continue;
      const errors = (rows ?? []).filter((r) => r.status !== 'success').length;
      const errorRate = (errors / runs) * 100;
      const lats = (rows ?? []).map((r) => r.latency_ms).filter((v): v is number => typeof v === 'number');
      const avgLat = lats.length ? lats.reduce((s, v) => s + v, 0) / lats.length : 0;

      const winLabel = rule.window_runs ? `${rule.window_runs} exec` : `${rule.window_hours}h`;
      if (errorRate > rule.error_rate_pct) {
        items.push({ agent_id: a.id, agent: a.name, kind: 'error_rate', value: `${errorRate.toFixed(1)}%`, threshold: `${rule.error_rate_pct}%`, runs, raw: errorRate, window_hours: rule.window_hours, window_runs: rule.window_runs, profile: `${rule.profile_name} (${winLabel})` });
      }
      if (avgLat > rule.avg_latency_ms) {
        items.push({ agent_id: a.id, agent: a.name, kind: 'latency', value: `${Math.round(avgLat)} ms`, threshold: `${rule.avg_latency_ms} ms`, runs, raw: avgLat, window_hours: rule.window_hours, window_runs: rule.window_runs, profile: `${rule.profile_name} (${winLabel})` });
      }
    }
  }

  // Cooldown per agent+kind+window (time or run)
  const cooldownSince = new Date(Date.now() - COOLDOWN_HOURS * 3600_000).toISOString();
  const toSend: Item[] = [];
  for (const it of items) {
    let q = supabase
      .from('agentic_alert_log')
      .select('id')
      .eq('agent_id', it.agent_id)
      .eq('kind', it.kind)
      .gte('created_at', cooldownSince)
      .limit(1);
    q = it.window_runs
      ? q.eq('window_runs', it.window_runs).is('window_hours', null)
      : q.eq('window_hours', it.window_hours as number).is('window_runs', null);
    const { data: recent } = await q;
    if (!recent || recent.length === 0) toSend.push(it);
  }

  if (toSend.length === 0) return json({ ok: true, checked: items.length, sent: 0 });

  const templateData = {
    windowHours: toSend[0].window_hours ?? 0,
    items: toSend.map(({ agent, kind, value, threshold, runs, profile }) => ({
      agent: `${agent} · ${profile}`, kind, value, threshold, runs,
    })),
    dashboardUrl: 'https://getboost.digital/admin/agentic-ai/monitoring',
  };

  const errors: string[] = [];
  for (const to of recipients) {
    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'agentic-alert',
        recipientEmail: to,
        idempotencyKey: `agentic-alert-${new Date().toISOString().slice(0, 13)}-${to}`,
        templateData,
      },
    });
    if (error) errors.push(`${to}: ${error.message}`);
  }

  const nowIso = new Date().toISOString();
  await supabase.from('agentic_alert_log').insert(
    toSend.map((it) => ({
      agent_id: it.agent_id, kind: it.kind,
      window_hours: it.window_hours, window_runs: it.window_runs,
      value: it.raw,
      threshold: it.kind === 'error_rate' ? Number(it.threshold.replace('%','')) : Number(it.threshold.replace(' ms','')),
      runs: it.runs, recipients: recipients.join(','), created_at: nowIso,
    }))
  );

  return json({ ok: errors.length === 0, sent: toSend.length, errors });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
