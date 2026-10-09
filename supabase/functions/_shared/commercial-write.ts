/**
 * R1C5 Wave 3 — shared commercial write-path primitives.
 *
 * Every public write to `leads`, `bookings` and `newsletter_subscribers` goes
 * through an Edge Function. This module holds the pieces those functions
 * share so validation and market/locale stamping are declared once.
 *
 * Why server-side at all:
 *  - `leads`, `bookings` and `newsletter_subscribers` are RLS-locked with no
 *    anonymous (and no authenticated-write) policies, so a browser insert is
 *    denied by design. The previous code therefore relied on inserts that
 *    could never have worked against Clean V1.
 *  - Clean V1 requires `market`, `locale` and `consent_privacy_at` to be NOT
 *    NULL. Those are server-derived facts (Accept-Language, submission
 *    instant), not client-supplied ones.
 *  - A trusted path lets the service-role key stay on the server while the
 *    browser keeps only the publishable key.
 */

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Authoritative market codes, mirrored from the Clean V1 CHECK constraints. */
export const MARKETS = ["PT", "BR", "INTL"] as const;
export type Market = (typeof MARKETS)[number];

const MARKET_DEFAULT: Market = "PT";
const LOCALE_BY_MARKET: Record<Market, string> = {
  PT: "pt-PT",
  BR: "pt-BR",
  INTL: "en",
};

/** Upper bound for any free-text field, to keep payloads bounded. */
const MAX_TEXT = 4000;
const MAX_SHORT = 300;
const MAX_EMAIL = 254;
const MAX_SOURCE = 120;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Trims and clamps a string. Returns null for anything empty. */
export function cleanText(raw: unknown, max: number = MAX_TEXT): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim().slice(0, max);
  return trimmed.length > 0 ? trimmed : null;
}

/** Validates and normalises an email address. Returns null when unusable. */
export function cleanEmail(raw: unknown): string | null {
  const value = cleanText(raw, MAX_EMAIL);
  if (!value) return null;
  const normalised = value.toLowerCase();
  // Deliberately permissive but bounded: the database is the final arbiter and
  // deliverability is the transactional email layer's problem.
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(normalised)) return null;
  return normalised;
}

/**
 * Derives the market from an explicit request value, falling back to the
 * `Accept-Language` header, and finally to the platform default.
 *
 * An unknown explicit value is ignored rather than rejected, so a stale
 * cached form can never block a submission.
 */
export function deriveMarket(explicit: unknown, acceptLanguage: string | null): Market {
  if (typeof explicit === "string" && (MARKETS as readonly string[]).includes(explicit)) {
    return explicit as Market;
  }
  const header = (acceptLanguage ?? "").toLowerCase();
  if (header.includes("pt-br") || header.includes("pt_br")) return "BR";
  if (header.includes("en")) return "INTL";
  if (header.includes("pt")) return "PT";
  return MARKET_DEFAULT;
}

/** Resolves the locale for a market, honouring an explicit override. */
export function deriveLocale(market: Market, explicit: unknown): string {
  const value = cleanText(explicit, 35);
  if (value && /^[a-z]{2}(-[A-Z]{2})?$/.test(value)) return value;
  return LOCALE_BY_MARKET[market];
}

/** The submission instant, used for `consent_privacy_at` / `consent_at`. */
export function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Builds the `metadata` jsonb payload for a row.
 *
 * Clean V1 dropped the per-purpose CRM columns in favour of a single jsonb
 * escape hatch, so retired fields are preserved verbatim instead of being
 * silently discarded. Keys are namespaced under `legacy` to keep them
 * distinguishable from first-class metadata.
 */
export function buildLegacyMetadata(legacy: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(legacy).filter(
    ([, value]) =>
      value !== undefined &&
      value !== null &&
      !(typeof value === "string" && value.trim() === ""),
  );
  return entries.length > 0 ? { legacy: Object.fromEntries(entries) } : {};
}

/** Merges two jsonb objects, the second winning. */
export function mergeMetadata(
  base: Record<string, unknown>,
  extra: Record<string, unknown>,
): Record<string, unknown> {
  return { ...base, ...extra };
}

/**
 * Best-effort per-instance rate limiter.
 *
 * Edge function instances are ephemeral, so this only blunts bursts from a
 * single instance — it is a speed bump, not a security boundary. The durable
 * limits are the NOT NULL + CHECK constraints in the database.
 */
export function createRateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return function allow(key: string): boolean {
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (hits.get(key) ?? []).filter((at) => at > cutoff);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}

/** Coarse client key: user agent + accept language, hashed to a short string. */
export function clientKey(req: Request): string {
  const ua = req.headers.get("user-agent") ?? "unknown";
  const al = req.headers.get("accept-language") ?? "unknown";
  let hash = 0;
  for (const part of [ua, al]) {
    for (let i = 0; i < part.length; i += 1) {
      hash = (hash * 31 + part.charCodeAt(i)) | 0;
    }
  }
  return String(hash);
}

/** Rejects a payload that is obviously oversized before any parsing cost. */
export function isPayloadTooLarge(req: Request, maxBytes = 64_000): boolean {
  const length = Number(req.headers.get("content-length") ?? "0");
  return Number.isFinite(length) && length > maxBytes;
}

export const FIELD_LIMITS = {
  name: MAX_SHORT,
  email: MAX_EMAIL,
  source: MAX_SOURCE,
  short: MAX_SHORT,
  text: MAX_TEXT,
};

/** Random opaque token, used as proof-of-possession for later mutations. */
export function randomToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** Constant-time-ish comparison that does not short-circuit on length only. */
export function secretsMatch(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
