// Lightweight in-app diagnostics for integration calls (IMAP / Gmail / CRM).
// Wraps supabase.functions.invoke and records request, response, error, duration.
import { supabase } from "@/integrations/supabase/client";

export type DiagEntry = {
  id: string;
  ts: string;              // ISO timestamp
  source: string;          // edge function name
  request: unknown;        // body sent
  response: unknown;       // response data (may be null)
  error: string | null;    // error message if any
  status: "ok" | "error";
  duration_ms: number;
};

const KEY = "integration_diag_log_v1";
const MAX = 100;
type Listener = (entries: DiagEntry[]) => void;
const listeners = new Set<Listener>();

const read = (): DiagEntry[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as DiagEntry[]; }
  catch { return []; }
};
const write = (entries: DiagEntry[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX))); } catch { /* ignore */ }
  listeners.forEach(l => l(entries));
};

export const diagList = (): DiagEntry[] => read();
export const diagClear = () => write([]);
export const diagSubscribe = (l: Listener): (() => void) => {
  listeners.add(l);
  l(read());
  return () => { listeners.delete(l); };
};

const safe = (v: unknown): unknown => {
  try { return JSON.parse(JSON.stringify(v)); } catch { return String(v); }
};

type InvokeResult<T> = { data: T | null; error: { message: string } | null };

// Single-flight: dedupe concurrent identical calls
const inflight = new Map<string, Promise<InvokeResult<unknown>>>();
// Circuit-breaker: cool-off per key after repeated failures
const cooldown = new Map<string, { until: number; fails: number }>();

const stableKey = (fn: string, body: unknown): string => {
  try { return `${fn}:${JSON.stringify(body ?? null)}`; } catch { return `${fn}:_`; }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry when error looks transient (network, 5xx, timeout, rate-limit). */
const isRetryable = (msg: string | undefined): boolean => {
  if (!msg) return false;
  return /timeout|timed out|network|fetch|ECONN|ETIMEDOUT|429|5\d\d|temporar|unavailable|rate.?limit/i.test(msg);
};

async function doInvoke<T>(
  fn: string,
  options: { body?: unknown; headers?: Record<string, string> },
): Promise<InvokeResult<T>> {
  const started = Date.now();
  const id = `${started}-${Math.random().toString(36).slice(2, 8)}`;
  let data: T | null = null;
  let error: { message: string } | null = null;
  try {
    const res = await supabase.functions.invoke(fn, options as never);
    data = (res.data ?? null) as T | null;
    error = res.error ? { message: res.error.message } : null;
    const bodyErr = (data as unknown as { error?: string } | null)?.error;
    if (!error && bodyErr) error = { message: String(bodyErr) };
  } catch (e) {
    error = { message: e instanceof Error ? e.message : String(e) };
  }
  const entry: DiagEntry = {
    id, ts: new Date().toISOString(), source: fn,
    request: safe(options.body ?? null),
    response: safe(data),
    error: error?.message ?? null,
    status: error ? "error" : "ok",
    duration_ms: Date.now() - started,
  };
  write([entry, ...read()].slice(0, MAX));
  return { data, error };
}

/**
 * Drop-in replacement for supabase.functions.invoke with:
 * - diagnostics logging
 * - single-flight dedupe of identical concurrent calls
 * - exponential backoff retry on transient errors (max 3 attempts)
 * - short circuit-breaker cool-off after repeated failures
 */
export async function invokeIntegration<T = unknown>(
  fn: string,
  options: { body?: unknown; headers?: Record<string, string> } = {},
  opts: { retries?: number; baseDelayMs?: number } = {},
): Promise<InvokeResult<T>> {
  const retries = opts.retries ?? 2; // 3 attempts total
  const base = opts.baseDelayMs ?? 400;
  const key = stableKey(fn, options.body);

  // Circuit-breaker gate
  const cb = cooldown.get(key);
  if (cb && cb.until > Date.now()) {
    const secs = Math.ceil((cb.until - Date.now()) / 1000);
    return { data: null, error: { message: `Ação em cool-off (${secs}s) após falhas repetidas. Tenta novamente em breve.` } };
  }

  // Single-flight
  const existing = inflight.get(key);
  if (existing) return existing as Promise<InvokeResult<T>>;

  const run = (async (): Promise<InvokeResult<T>> => {
    let attempt = 0;
    let last: InvokeResult<T> = { data: null, error: { message: "unknown" } };
    while (attempt <= retries) {
      last = await doInvoke<T>(fn, options);
      if (!last.error) {
        cooldown.delete(key);
        return last;
      }
      if (attempt >= retries || !isRetryable(last.error.message)) break;
      await sleep(base * Math.pow(2, attempt) + Math.random() * 100);
      attempt++;
    }
    // Track failures for cool-off
    const prev = cooldown.get(key);
    const fails = (prev?.fails ?? 0) + 1;
    const coolMs = fails >= 3 ? 30_000 : fails >= 2 ? 10_000 : 0;
    cooldown.set(key, { until: Date.now() + coolMs, fails });
    return last;
  })();

  inflight.set(key, run as Promise<InvokeResult<unknown>>);
  try { return await run; } finally { inflight.delete(key); }
}
