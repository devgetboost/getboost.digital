// Provider-neutral AI inference layer (R2B).
//
// Before R2B every call site fetched the Lovable AI gateway directly, with the
// endpoint, auth header, model namespace and missing-key behavior copy-pasted
// seven times. This module is the single place that knows how to talk to an
// AI provider:
//
//   - `chatCompletions()` resolves the active provider from `AI_PROVIDER`
//     (default `deepseek`), maps any legacy `provider/model` namespace to a
//     real model id, and returns a uniform result — including the fail-closed
//     `{ ok: false, status: 500, errorType: "CONFIG" }` shape when the active
//     provider's key is absent.
//   - Only OpenAI-compatible chat-completions parameters are ever sent
//     (messages, temperature, max_tokens, response_format json_object, tools).
//     Provider-specific extras (e.g. `service_tier`) are stripped, because the
//     next provider may reject unknown fields.
//
// To add a provider (OpenAI, Gemini, Azure OpenAI): add its name to
// `AIProviderName`, its endpoint/key to `PROVIDER_CONFIG`, and its model map
// to `MODEL_MAP`. No call site changes.

export type AIProviderName = "deepseek" | "lovable";

export const DEFAULT_PROVIDER: AIProviderName = "deepseek";

export const DEEPSEEK_CHAT_MODEL = "deepseek-chat";
export const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";

const LOVABLE_API_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_FALLBACK_MODEL = "google/gemini-3-flash-preview";

/** Reads the active provider. Anything unrecognised falls back to the default. */
export function resolveProviderName(): AIProviderName {
  const raw = (Deno.env.get("AI_PROVIDER") ?? "").trim().toLowerCase();
  if (raw === "lovable" || raw === "deepseek") return raw;
  return DEFAULT_PROVIDER;
}

function providerKeyName(provider: AIProviderName): string {
  return provider === "deepseek" ? "DEEPSEEK_API_KEY" : "LOVABLE_API_KEY";
}

function providerApiUrl(provider: AIProviderName): string {
  return provider === "deepseek" ? DEEPSEEK_API_URL : LOVABLE_API_URL;
}

/**
 * Maps a stored/requested model to a real model id for the active provider.
 *
 * The database and older clients carry Lovable-namespaced ids
 * (`google/...`, `openai/...`). Those namespaces mean nothing to DeepSeek, so
 * under the deepseek provider they resolve to `deepseek-chat`. Under the
 * lovable provider they pass through untouched, because the gateway
 * understands them. Explicit `deepseek/*` ids pass through (prefix stripped)
 * on either provider. Anything else falls back to the provider default rather
 * than producing a provider 404.
 */
export function resolveModelName(
  model: string | null | undefined,
  provider: AIProviderName = resolveProviderName(),
): string {
  const trimmed = (model ?? "").trim();
  if (!trimmed) return provider === "deepseek" ? DEEPSEEK_CHAT_MODEL : LOVABLE_FALLBACK_MODEL;
  const lower = trimmed.toLowerCase();
  if (lower.startsWith("deepseek/")) {
    const rest = trimmed.slice("deepseek/".length).trim();
    return rest || DEEPSEEK_CHAT_MODEL;
  }
  if (lower === "deepseek-chat" || lower === "deepseek-reasoner") return lower;
  if (provider === "lovable") return trimmed;
  return DEEPSEEK_CHAT_MODEL;
}

export type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

export type ChatRequest = {
  model?: string | null;
  messages: ChatMessage[];
  temperature?: number | null;
  maxTokens?: number | null;
  /** When true, requests `response_format: { type: "json_object" }`. */
  jsonMode?: boolean;
  tools?: unknown[];
  toolChoice?: unknown;
  /** Per-call timeout in ms. Defaults to 30s. */
  timeoutMs?: number;
};

export type ChatUsage = { inputTokens?: number; outputTokens?: number };

export type ChatResult =
  | {
      ok: true;
      text: string;
      toolCalls: ToolCall[];
      usage?: ChatUsage;
      /** The resolved model id that actually served the request. */
      model: string;
      provider: AIProviderName;
    }
  | {
      ok: false;
      status: number;
      errorType: string;
      errorMessage: string;
      provider: AIProviderName;
    };

const DEFAULT_TIMEOUT_MS = 30_000;

function configError(provider: AIProviderName): ChatResult {
  const key = providerKeyName(provider);
  return {
    ok: false,
    status: 500,
    errorType: "CONFIG",
    errorMessage: `${key} not configured`,
    provider,
  };
}

/**
 * Single OpenAI-compatible chat-completions call against the active provider.
 *
 * Fail-closed: a missing key returns CONFIG/500, network failure returns
 * NETWORK/502, and provider HTTP errors return HTTP_<status> with the
 * provider's body as the message. Never throws for transport-level issues.
 */
export async function chatCompletions(req: ChatRequest): Promise<ChatResult> {
  const provider = resolveProviderName();
  const apiKey = Deno.env.get(providerKeyName(provider));
  if (!apiKey) return configError(provider);

  const model = resolveModelName(req.model, provider);

  const body: Record<string, unknown> = {
    model,
    messages: req.messages,
  };
  if (req.temperature != null) body.temperature = req.temperature;
  if (req.maxTokens != null) body.max_tokens = req.maxTokens;
  if (req.jsonMode) body.response_format = { type: "json_object" };
  if (req.tools !== undefined) body.tools = req.tools;
  if (req.toolChoice !== undefined) body.tool_choice = req.toolChoice;

  const timeoutMs = req.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(providerApiUrl(provider), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const msg = e instanceof Error && e.name === "AbortError"
      ? `AI request timed out after ${timeoutMs}ms`
      : (e as Error).message;
    return { ok: false, status: 502, errorType: "NETWORK", errorMessage: msg, provider };
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    return {
      ok: false,
      status: response.status,
      errorType: `HTTP_${response.status}`,
      errorMessage: errText || response.statusText,
      provider,
    };
  }

  const json = await response.json().catch(() => ({} as Record<string, unknown>));
  const message = (json?.choices as Array<Record<string, unknown>> | undefined)?.[0]?.message as
    | Record<string, unknown>
    | undefined;
  const text = typeof message?.content === "string" ? message.content : "";
  const toolCalls = (Array.isArray(message?.tool_calls) ? message.tool_calls : []) as ToolCall[];
  const usage = json?.usage as Record<string, unknown> | undefined;
  const resultUsage: ChatUsage | undefined = usage
    ? {
        inputTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : undefined,
        outputTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : undefined,
      }
    : undefined;

  return { ok: true, text, toolCalls, usage: resultUsage, model, provider };
}
