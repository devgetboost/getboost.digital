import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  createEnvConfig,
  EnvironmentConfigError,
  MARKETS,
  ROLES,
  type EnvironmentSource,
} from '@/config/env';

/**
 * Wave 1 environment boundary tests (R1C2 Objective 8/9).
 *
 * Configuration comes from an injected source, so no Vite context and no real
 * credential is required to prove the fail-closed behaviour.
 */

const PLACEHOLDER_URL = 'https://example-placeholder-ref.supabase.co';
const PLACEHOLDER_KEY = 'sb_publishable_PLACEHOLDER_PLACEHOLDER_PLACEHOLDER_';

function source(values: Record<string, string | undefined>): EnvironmentSource {
  return (key: string) => values[key];
}

function validSource(overrides: Record<string, string | undefined> = {}): EnvironmentSource {
  return source({
    VITE_ENV: 'local',
    VITE_SUPABASE_URL: PLACEHOLDER_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: PLACEHOLDER_KEY,
    ...overrides,
  });
}

/** Strips line and block comments so assertions test code, not prose. */
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

describe('browser environment contract', () => {
  it('accepts a complete, explicit configuration', () => {
    const config = createEnvConfig(validSource(), { isBrowser: false });
    expect(config.supabaseUrl).toBe(PLACEHOLDER_URL);
    expect(config.supabasePublishableKey).toBe(PLACEHOLDER_KEY);
    expect(config.environment).toBe('local');
    expect(config.defaultMarket).toBe('PT');
    expect(config.isBrowser).toBe(false);
  });

  it('produces a frozen, deterministic configuration', () => {
    const first = createEnvConfig(validSource({ VITE_ENV: 'production' }), { isBrowser: false });
    const second = createEnvConfig(validSource({ VITE_ENV: 'production' }), { isBrowser: false });
    expect(first).toEqual(second);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.environment).toBe('production');
  });

  it('requires an explicit, valid environment target', () => {
    expect(() => createEnvConfig(validSource({ VITE_ENV: undefined }))).toThrow(
      EnvironmentConfigError,
    );
    expect(() => createEnvConfig(validSource({ VITE_ENV: 'debug' }))).toThrow(
      /Invalid VITE_ENV/,
    );
  });

  it('fails clearly when the URL or publishable key is missing', () => {
    expect(() =>
      createEnvConfig(validSource({ VITE_SUPABASE_URL: undefined })),
    ).toThrow(/Missing required browser configuration "VITE_SUPABASE_URL"/);
    expect(() =>
      createEnvConfig(validSource({ VITE_SUPABASE_PUBLISHABLE_KEY: '' })),
    ).toThrow(/Missing required browser configuration "VITE_SUPABASE_PUBLISHABLE_KEY"/);
  });

  it('rejects malformed and insecure URLs', () => {
    expect(() => createEnvConfig(validSource({ VITE_SUPABASE_URL: 'not-a-url' }))).toThrow(
      /absolute URL/,
    );
    expect(() =>
      createEnvConfig(validSource({ VITE_SUPABASE_URL: 'http://insecure.supabase.co' })),
    ).toThrow(/https/);
  });

  it('refuses secret/service keys in browser configuration', () => {
    expect(() =>
      createEnvConfig(
        validSource({ VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_PLACEHOLDER_123' }),
      ),
    ).toThrow(/secret key/i);
  });

  it('validates that the client consumes no raw environment variables', () => {
    const clientSrc = stripComments(
      readFileSync(join(process.cwd(), 'src/integrations/supabase/client.ts'), 'utf8'),
    );
    expect(clientSrc).not.toContain('import.meta.env');
    expect(clientSrc).toContain('env.supabaseUrl');
    expect(clientSrc).toContain('env.supabasePublishableKey');
  });

  it('declares every required client variable with a VITE_ browser prefix', () => {
    const envSrc = readFileSync(join(process.cwd(), 'src/config/env.ts'), 'utf8');
    const required = [...envSrc.matchAll(/requireValue\(source,\s*'([A-Z_]+)'\)/g)].map((m) => m[1]);
    expect(required.length).toBeGreaterThan(0);
    expect(required.every((v) => v.startsWith('VITE_'))).toBe(true);
  });

  it('validates the optional default market against the market contract', () => {
    expect(createEnvConfig(validSource({ VITE_DEFAULT_MARKET: 'BR' })).defaultMarket).toBe('BR');
    expect(() => createEnvConfig(validSource({ VITE_DEFAULT_MARKET: 'ES' }))).toThrow(
      /Invalid VITE_DEFAULT_MARKET/,
    );
  });

  it('keeps the authoritative market and role value lists', () => {
    expect([...MARKETS]).toEqual(['PT', 'BR', 'INTL']);
    expect([...ROLES]).toEqual(['admin', 'collaborator', 'client']);
  });
});
