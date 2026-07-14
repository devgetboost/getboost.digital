import { supabase } from '@/integrations/supabase/client';

export type RunLog = {
  id: string;
  agentId: string | null;
  versionId: string | null;
  runId: string;
  status: 'success' | 'error' | 'timeout';
  model: string | null;
  startedAt: string;
  finishedAt: string | null;
  latencyMs: number | null;
  inputTokens: number | null;
  outputTokens: number | null;
  costCredits: number | null;
  errorType: string | null;
  errorMessage: string | null;
  outputPreview: string | null;
};

type Row = {
  id: string;
  agent_id: string | null;
  version_id: string | null;
  run_id: string;
  status: 'success' | 'error' | 'timeout';
  model: string | null;
  started_at: string;
  finished_at: string | null;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_credits: number | null;
  error_type: string | null;
  error_message: string | null;
  output_preview: string | null;
};

const fromRow = (r: Row): RunLog => ({
  id: r.id,
  agentId: r.agent_id,
  versionId: r.version_id,
  runId: r.run_id,
  status: r.status,
  model: r.model,
  startedAt: r.started_at,
  finishedAt: r.finished_at,
  latencyMs: r.latency_ms,
  inputTokens: r.input_tokens,
  outputTokens: r.output_tokens,
  costCredits: r.cost_credits,
  errorType: r.error_type,
  errorMessage: r.error_message,
  outputPreview: r.output_preview,
});

async function sha256(input: string): Promise<string> {
  const buf = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Wraps an agent invocation and records a row in agentic_run_logs.
 * The caller supplies the actual execution as `run()`. Any thrown error is
 * logged and re-thrown so callers can still handle it.
 */
export async function recordRun<T extends { text?: string; usage?: { inputTokens?: number; outputTokens?: number } }>(
  args: { agentId: string; versionId?: string | null; model?: string | null; input: string },
  run: () => Promise<T>
): Promise<T> {
  const started = Date.now();
  const startedAt = new Date(started).toISOString();
  const inputHash = await sha256(args.input);
  try {
    const result = await run();
    const finished = Date.now();
    await supabase.from('agentic_run_logs').insert({
      agent_id: args.agentId,
      version_id: args.versionId ?? null,
      status: 'success',
      model: args.model ?? null,
      started_at: startedAt,
      finished_at: new Date(finished).toISOString(),
      latency_ms: finished - started,
      input_tokens: result.usage?.inputTokens ?? null,
      output_tokens: result.usage?.outputTokens ?? null,
      input_hash: inputHash,
      output_preview: result.text ? result.text.slice(0, 200) : null,
    });
    return result;
  } catch (err: any) {
    const finished = Date.now();
    await supabase.from('agentic_run_logs').insert({
      agent_id: args.agentId,
      version_id: args.versionId ?? null,
      status: 'error',
      model: args.model ?? null,
      started_at: startedAt,
      finished_at: new Date(finished).toISOString(),
      latency_ms: finished - started,
      error_type: err?.name ?? 'Error',
      error_message: (err?.message ?? String(err)).slice(0, 500),
      input_hash: inputHash,
    });
    throw err;
  }
}

export async function listRecentLogs(limit = 100, agentId?: string): Promise<RunLog[]> {
  let q = supabase.from('agentic_run_logs').select('*').order('created_at', { ascending: false }).limit(limit);
  if (agentId) q = q.eq('agent_id', agentId);
  const { data, error } = await q;
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function getMetricsSummary(sinceHours = 24, agentId?: string): Promise<{
  runs: number;
  errors: number;
  avgLatencyMs: number;
  totalCostCredits: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}> {
  const since = new Date(Date.now() - sinceHours * 3600_000).toISOString();
  let q = supabase.from('agentic_run_logs').select('status,latency_ms,cost_credits,input_tokens,output_tokens').gte('created_at', since);
  if (agentId) q = q.eq('agent_id', agentId);
  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as Array<{ status: string; latency_ms: number | null; cost_credits: number | null; input_tokens: number | null; output_tokens: number | null }>;
  const runs = rows.length;
  const errors = rows.filter((r) => r.status !== 'success').length;
  const latencies = rows.map((r) => r.latency_ms).filter((v): v is number => typeof v === 'number');
  const avgLatencyMs = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
  const totalCostCredits = rows.reduce((s, r) => s + (r.cost_credits ?? 0), 0);
  const totalInputTokens = rows.reduce((s, r) => s + (r.input_tokens ?? 0), 0);
  const totalOutputTokens = rows.reduce((s, r) => s + (r.output_tokens ?? 0), 0);
  return { runs, errors, avgLatencyMs, totalCostCredits, totalInputTokens, totalOutputTokens };
}
