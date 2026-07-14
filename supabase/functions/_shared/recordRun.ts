// Server-side logger for real agent invocations. Feeds
// /admin/agentic-ai/monitoring with latency, tokens and errors.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AiResult = {
  text?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
};

const cache = new Map<string, { agentId: string; versionId: string | null }>();

function client() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
}

async function resolveAgent(agentName: string) {
  const hit = cache.get(agentName);
  if (hit) return hit;
  try {
    const { data } = await client()
      .from('agentic_agents')
      .select('id,active_version_id')
      .eq('name', agentName)
      .maybeSingle();
    if (!data) return null;
    const entry = { agentId: data.id as string, versionId: (data.active_version_id as string | null) ?? null };
    cache.set(agentName, entry);
    return entry;
  } catch (e) {
    console.warn('resolveAgent failed', (e as Error).message);
    return null;
  }
}

/** Fire-and-forget insert; never throws. */
export async function logAgentRun(args: {
  agentName: string;
  model?: string | null;
  startedAt: number;
  status: 'success' | 'error' | 'timeout';
  text?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  errorType?: string;
  errorMessage?: string;
}) {
  try {
    const resolved = await resolveAgent(args.agentName);
    if (!resolved) return;
    const finished = Date.now();
    await client().from('agentic_run_logs').insert({
      agent_id: resolved.agentId,
      version_id: resolved.versionId,
      status: args.status,
      model: args.model ?? null,
      started_at: new Date(args.startedAt).toISOString(),
      finished_at: new Date(finished).toISOString(),
      latency_ms: finished - args.startedAt,
      input_tokens: args.usage?.inputTokens ?? null,
      output_tokens: args.usage?.outputTokens ?? null,
      output_preview: args.text ? args.text.slice(0, 200) : null,
      error_type: args.errorType ?? null,
      error_message: args.errorMessage ? args.errorMessage.slice(0, 500) : null,
    });
  } catch (e) {
    console.warn('logAgentRun failed', (e as Error).message);
  }
}

/** Extract text + usage from a Lovable AI gateway (OpenAI-compatible) response body. */
export function extractAi(body: any): AiResult {
  const text: string | undefined = body?.choices?.[0]?.message?.content ?? undefined;
  const u = body?.usage;
  return {
    text,
    usage: u ? { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens } : undefined,
  };
}
