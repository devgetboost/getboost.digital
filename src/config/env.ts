/**
 * R1C2 Wave 1 — validated browser environment boundary.
 *
 * This module is the single place where browser configuration is read and
 * validated. Application code must consume `env` (or the Market/Role contracts
 * exported here) instead of touching `import.meta.env` directly.
 *
 * Rules enforced here:
 *  - Only browser-public configuration is read (`VITE_*` publishable values).
 *  - Service-role / secret keys are never read, never required, and are
 *    actively rejected if someone tries to wire one into the browser.
 *  - Environment selection is EXPLICIT: `VITE_ENV` must name the target.
 *    There is no project-ref sniffing and no hostname heuristics, so a
 *    misconfigured target fails loudly instead of silently hitting the
 *    wrong backend.
 *  - Missing or malformed configuration throws a descriptive error.
 *
 * Target matrix (no secrets are ever committed):
 *  local        -> repo `.env`          (VITE_ENV=local)
 *  staging      -> host/CI environment  (VITE_ENV=staging    + staging publishable key)
 *  production   -> host/CI environment  (VITE_ENV=production + production publishable key)
 *
 * See `.env.example` for the variable-name contract.
 */

/** Every deploy target we support. Selection is explicit, never inferred. */
export const APP_ENVIRONMENTS = ['local', 'staging', 'production'] as const;
export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

/**
 * Market codes — authoritative application contract.
 * Mirrors the Clean V1 SQL CHECK constraints in
 * `supabase/migrations/2026100810000{0,1,2}_clean_v1_*.sql`.
 */
export const MARKETS = ['PT', 'BR', 'INTL'] as const;
export type MarketCode = (typeof MARKETS)[number];

/**
 * Role codes — authoritative application contract.
 * Mirrors the Clean V1 SQL CHECK constraint on `public.user_roles.role`.
 * There is intentionally no `moderator`/`user` role (legacy enum retired).
 */
export const ROLES = ['admin', 'collaborator', 'client'] as const;
export type RoleCode = (typeof ROLES)[number];

/** Raised when required browser configuration is missing or malformed. */
export class EnvironmentConfigError extends Error {
  readonly variable?: string;

  constructor(message: string, variable?: string) {
    super(message);
    this.name = 'EnvironmentConfigError';
    this.variable = variable;
  }
}

/** Abstraction over the value source so validation stays unit-testable. */
export type EnvironmentSource = (key: string) => string | undefined;

/** Reads from Vite's `import.meta.env` without ever throwing. */
export const readViteEnvironment: EnvironmentSource = (key) => {
  const value = (import.meta as ImportMeta & { env?: Record<string, unknown> }).env?.[key];
  return typeof value === 'string' ? value : undefined;
};

export interface EnvConfig {
  /** Supabase project URL (browser-safe, publishable). */
  readonly supabaseUrl: string;
  /** Supabase publishable/anon key (browser-safe). Never a secret key. */
  readonly supabasePublishableKey: string;
  /** Explicit deploy target. */
  readonly environment: AppEnvironment;
  /** Default market for this build (overridable per target). */
  readonly defaultMarket: MarketCode;
  /** True when running in a browser document. */
  readonly isBrowser: boolean;
}

function requireValue(source: EnvironmentSource, key: string): string {
  const raw = source(key);
  if (raw === undefined || raw.trim() === '') {
    throw new EnvironmentConfigError(
      `Missing required browser configuration "${key}". ` +
        `Set it for the target you are building (local: repo .env, ` +
        `staging/production: host or CI environment). See .env.example.`,
      key,
    );
  }
  return raw;
}

function resolveEnvironment(source: EnvironmentSource): AppEnvironment {
  const raw = requireValue(source, 'VITE_ENV');
  if (!(APP_ENVIRONMENTS as readonly string[]).includes(raw)) {
    throw new EnvironmentConfigError(
      `Invalid VITE_ENV "${raw}". Expected one of: ${APP_ENVIRONMENTS.join(', ')}.`,
      'VITE_ENV',
    );
  }
  return raw as AppEnvironment;
}

function resolveUrl(source: EnvironmentSource): string {
  const raw = requireValue(source, 'VITE_SUPABASE_URL');
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new EnvironmentConfigError(
      'VITE_SUPABASE_URL must be an absolute URL (https://<project>.supabase.co).',
      'VITE_SUPABASE_URL',
    );
  }
  if (parsed.protocol !== 'https:') {
    throw new EnvironmentConfigError('VITE_SUPABASE_URL must use https://.', 'VITE_SUPABASE_URL');
  }
  return raw;
}

function resolvePublishableKey(source: EnvironmentSource): string {
  const raw = requireValue(source, 'VITE_SUPABASE_PUBLISHABLE_KEY');
  if (raw.startsWith('sb_secret_')) {
    throw new EnvironmentConfigError(
      'VITE_SUPABASE_PUBLISHABLE_KEY looks like a secret key. ' +
        'Secret/service keys must never reach browser code.',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    );
  }
  const isPublishable = raw.startsWith('sb_publishable_');
  const isLegacyAnonJwt = raw.split('.').length === 3;
  if (!isPublishable && !isLegacyAnonJwt) {
    throw new EnvironmentConfigError(
      'VITE_SUPABASE_PUBLISHABLE_KEY is not a recognised publishable/anon key.',
      'VITE_SUPABASE_PUBLISHABLE_KEY',
    );
  }
  return raw;
}

function resolveDefaultMarket(source: EnvironmentSource): MarketCode {
  const raw = source('VITE_DEFAULT_MARKET');
  if (raw === undefined || raw.trim() === '') return 'PT';
  if (!(MARKETS as readonly string[]).includes(raw)) {
    throw new EnvironmentConfigError(
      `Invalid VITE_DEFAULT_MARKET "${raw}". Expected one of: ${MARKETS.join(', ')}.`,
      'VITE_DEFAULT_MARKET',
    );
  }
  return raw as MarketCode;
}

/**
 * Builds a validated configuration object from any value source.
 * Pure and deterministic — this is what the environment tests exercise.
 */
export function createEnvConfig(
  source: EnvironmentSource,
  options: { isBrowser?: boolean } = {},
): EnvConfig {
  return Object.freeze({
    supabaseUrl: resolveUrl(source),
    supabasePublishableKey: resolvePublishableKey(source),
    environment: resolveEnvironment(source),
    defaultMarket: resolveDefaultMarket(source),
    isBrowser: options.isBrowser ?? typeof window !== 'undefined',
  });
}

/**
 * Singleton configuration for the running application.
 * Throws `EnvironmentConfigError` at start-up when the target is not
 * explicitly and correctly configured.
 */
export const env: EnvConfig = createEnvConfig(readViteEnvironment);

/** Runtime market list — use for filters/validation, not for casting. */
export function isMarket(value: unknown): value is MarketCode {
  return typeof value === 'string' && (MARKETS as readonly string[]).includes(value);
}

/** Runtime role list — use for guards/validation, not for casting. */
export function isRole(value: unknown): value is RoleCode {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}
