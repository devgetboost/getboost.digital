// Shared runtime for agentic edge functions.
// - resolveVersion: reads active/canary version from DB (uses pick_agent_version_for_run)
// - logRun: writes to agentic_run_logs (fire-and-forget, never throws)
// - callAgent: end-to-end helper that calls Lovable AI Gateway with the resolved
//   prompt/model, logs the run (with computed cost_credits) and returns the parsed result.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

type SupabaseClient = ReturnType<typeof createClient>;

export type AgentResolution =
  | { kind: "ok"; agent: ResolvedAgent }
  | { kind: "paused"; agentId: string; agentName: string }
  | { kind: "missing" }
  | { kind: "no_version"; agentId: string; agentName: string };

export type ResolvedAgent = {
  agentId: string;
  agentName: string;
  agentStatus: "active" | "draft" | "paused";
  versionId: string;
  systemPrompt: string;
  model: string;
  temperature: number;
  maxTokens: number;
  fastMode: boolean;
  isCanary: boolean;
};

export type LogArgs = {
  agentId: string;
  versionId: string | null;
  model: string;
  startedAt: number;
  status: "success" | "error" | "timeout";
  text?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  errorType?: string;
  errorMessage?: string;
  runId?: string;
  metadata?: Record<string, unknown>;
};

const FALLBACK_MODEL = "google/gemini-3-flash-preview";

// Pricing table in Lovable credits per 1K tokens (input, output).
// Approximate — used only to attribute cost per run for dashboards/rollups.
// Add new models here as they get adopted.
export const MODEL_PRICING_PER_1K: Record<string, { input: number; output: number }> = {
  "google/gemini-3-flash-preview": { input: 0.15, output: 0.30 },
  "google/gemini-2.5-flash": { input: 0.15, output: 0.30 },
  "google/gemini-2.5-pro": { input: 1.25, output: 5.0 },
  "openai/gpt-5-nano": { input: 0.10, output: 0.40 },
  "openai/gpt-5-mini": { input: 0.30, output: 1.20 },
  "openai/gpt-5": { input: 1.50, output: 6.0 },
};
const DEFAULT_PRICING = { input: 0.20, output: 0.60 };

export function computeCostCredits(
  model: string,
  usage?: { inputTokens?: number; outputTokens?: number },
): number | null {
  if (!usage) return null;
  const inTok = usage.inputTokens ?? 0;
  const outTok = usage.outputTokens ?? 0;
  if (inTok === 0 && outTok === 0) return null;
  const p = MODEL_PRICING_PER_1K[model] ?? DEFAULT_PRICING;
  const cost = (inTok / 1000) * p.input + (outTok / 1000) * p.output;
  return Math.round(cost * 1e6) / 1e6;
}

let cachedClient: SupabaseClient | null = null;
function serviceClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  cachedClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
  return cachedClient;
}

/**
 * Resolve which agent/version should serve this call.
 * Returns a discriminated result so callers can distinguish paused vs. missing.
 */
export async function resolveAgent(
  functionSlug: string,
  bucketKey?: string | null,
): Promise<AgentResolution> {
  const supabase = serviceClient();

  const { data: agent, error: aErr } = await supabase
    .from("agentic_agents")
    .select("id,name,status,active_version_id,canary_version_id")
    .eq("function_slug", functionSlug)
    .maybeSingle();

  if (aErr || !agent) {
    console.warn("[agentic-runtime] agent not found for slug", functionSlug, aErr?.message);
    return { kind: "missing" };
  }
  if (agent.status === "paused") {
    return { kind: "paused", agentId: agent.id as string, agentName: agent.name as string };
  }

  const { data: pickedId } = await supabase.rpc("pick_agent_version_for_run", {
    _agent_id: agent.id,
    _bucket_key: bucketKey ?? crypto.randomUUID(),
  });

  const versionId = (pickedId as string | null) ?? agent.active_version_id;
  if (!versionId) {
    return { kind: "no_version", agentId: agent.id as string, agentName: agent.name as string };
  }

  const { data: version, error: vErr } = await supabase
    .from("agentic_agent_versions")
    .select("id,system_prompt,model,temperature,max_tokens,fast_mode")
    .eq("id", versionId)
    .maybeSingle();

  if (vErr || !version) {
    return { kind: "no_version", agentId: agent.id as string, agentName: agent.name as string };
  }

  return {
    kind: "ok",
    agent: {
      agentId: agent.id as string,
      agentName: agent.name as string,
      agentStatus: agent.status as ResolvedAgent["agentStatus"],
      versionId: version.id as string,
      systemPrompt: (version.system_prompt as string) ?? "",
      model: (version.model as string) ?? FALLBACK_MODEL,
      temperature: Number(version.temperature ?? 0.4),
      maxTokens: Number(version.max_tokens ?? 1024),
      fastMode: Boolean(version.fast_mode ?? false),
      isCanary: versionId === agent.canary_version_id,
    },
  };
}

/** Back-compat: returns the resolved agent or null. */
export async function resolveVersion(
  functionSlug: string,
  bucketKey?: string | null,
): Promise<ResolvedAgent | null> {
  const r = await resolveAgent(functionSlug, bucketKey);
  return r.kind === "ok" ? r.agent : null;
}

/** Fire-and-forget log; never throws. Computes cost_credits from model+usage. */
export async function logRun(args: LogArgs): Promise<void> {
  try {
    const finished = Date.now();
    await serviceClient().from("agentic_run_logs").insert({
      run_id: args.runId ?? crypto.randomUUID(),
      agent_id: args.agentId,
      version_id: args.versionId,
      status: args.status,
      model: args.model,
      started_at: new Date(args.startedAt).toISOString(),
      finished_at: new Date(finished).toISOString(),
      latency_ms: finished - args.startedAt,
      input_tokens: args.usage?.inputTokens ?? null,
      output_tokens: args.usage?.outputTokens ?? null,
      cost_credits: computeCostCredits(args.model, args.usage),
      output_preview: args.text ? args.text.slice(0, 200) : null,
      error_type: args.errorType ?? null,
      error_message: args.errorMessage ? args.errorMessage.slice(0, 500) : null,
      metadata: args.metadata ?? null,
    });
  } catch (e) {
    console.warn("[agentic-runtime] logRun failed:", (e as Error).message);
  }
}

export type CallAgentArgs = {
  functionSlug: string;
  bucketKey?: string | null;
  userPrompt: string;
  overrides?: { model?: string; temperature?: number; maxTokens?: number };
  metadata?: Record<string, unknown>;
  fallback?: { systemPrompt: string; model?: string };
};

export type CallAgentResult =
  | {
      ok: true;
      text: string;
      usage?: { inputTokens?: number; outputTokens?: number };
      costCredits: number | null;
      model: string;
      agent: ResolvedAgent | null;
    }
  | {
      ok: false;
      status: number;
      errorType: string;
      errorMessage: string;
      agent: ResolvedAgent | null;
    };

export async function callAgent(args: CallAgentArgs): Promise<CallAgentResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return { ok: false, status: 500, errorType: "CONFIG",
      errorMessage: "LOVABLE_API_KEY not configured", agent: null };
  }

  const resolution = await resolveAgent(args.functionSlug, args.bucketKey ?? null);

  // Paused agents MUST NOT run, even if a fallback prompt is provided.
  if (resolution.kind === "paused") {
    return { ok: false, status: 503, errorType: "AGENT_PAUSED",
      errorMessage: `Agent '${args.functionSlug}' is paused`, agent: null };
  }
  if (resolution.kind === "no_version") {
    return { ok: false, status: 503, errorType: "NO_ACTIVE_VERSION",
      errorMessage: `No active version for '${args.functionSlug}'`, agent: null };
  }
  const agent = resolution.kind === "ok" ? resolution.agent : null;

  // Missing agent record: only proceed if a fallback prompt is supplied (bootstrap).
  if (!agent && !args.fallback) {
    return { ok: false, status: 503, errorType: "AGENT_UNAVAILABLE",
      errorMessage: `No agent registered for '${args.functionSlug}'`, agent: null };
  }

  const systemPrompt = agent?.systemPrompt || args.fallback?.systemPrompt || "";
  const model = args.overrides?.model ?? agent?.model ?? args.fallback?.model ?? FALLBACK_MODEL;
  const temperature = args.overrides?.temperature ?? agent?.temperature;
  const maxTokens = args.overrides?.maxTokens ?? agent?.maxTokens;
  const runId = crypto.randomUUID();

  const body: Record<string, unknown> = {
    model,
    messages: [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      { role: "user", content: args.userPrompt },
    ],
  };
  if (temperature != null) body.temperature = temperature;
  if (maxTokens != null) body.max_tokens = maxTokens;

  // Budget gate — block new runs when daily/monthly cost limit reached.
  if (agent) {
    try {
      const { data: b } = await serviceClient().rpc("check_agent_budget", { _agent_id: agent.agentId });
      const row = Array.isArray(b) ? b[0] : b;
      if (row && row.allowed === false) {
        return { ok: false, status: 429, errorType: "BUDGET_EXCEEDED",
          errorMessage: row.reason ?? "Budget exceeded", agent };
      }
    } catch (e) {
      console.warn("[agentic-runtime] budget check failed (allowing):", (e as Error).message);
    }
  }

  const startedAt = Date.now();
  let response: Response;
  try {
    response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    const msg = (e as Error).message;
    if (agent) {
      void logRun({ agentId: agent.agentId, versionId: agent.versionId, model, startedAt,
        status: "error", errorType: "NETWORK", errorMessage: msg, runId, metadata: args.metadata });
    }
    return { ok: false, status: 502, errorType: "NETWORK", errorMessage: msg, agent };
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    if (agent) {
      void logRun({ agentId: agent.agentId, versionId: agent.versionId, model, startedAt,
        status: "error", errorType: `HTTP_${response.status}`, errorMessage: errText,
        runId, metadata: args.metadata });
    }
    return { ok: false, status: response.status, errorType: `HTTP_${response.status}`,
      errorMessage: errText || response.statusText, agent };
  }

  const json = await response.json().catch(() => ({} as any));
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  const u = json?.usage;
  const usage = u ? { inputTokens: u.prompt_tokens, outputTokens: u.completion_tokens } : undefined;
  const costCredits = computeCostCredits(model, usage);

  if (agent) {
    void logRun({ agentId: agent.agentId, versionId: agent.versionId, model, startedAt,
      status: "success", text, usage, runId, metadata: args.metadata });
  }

  return { ok: true, text, usage, costCredits, model, agent };
}
