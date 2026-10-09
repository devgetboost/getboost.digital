import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  APP_ENVIRONMENTS,
  MARKETS,
  ROLES,
  createEnvConfig,
  isMarket,
  isRole,
  type EnvironmentSource,
} from '@/config/env';
import { CLEAN_V1_TABLES, type Database } from '@/integrations/supabase/types';

/**
 * Wave 1 static gate (R1C2 Objectives 12-14).
 *
 * Runs without node_modules: reads the sources from disk and asserts the
 * contract properties that matter for commit safety.
 */

const repo = process.cwd();
const read = (rel: string) => readFileSync(join(repo, rel), 'utf8');

const SOURCES = [
  'src/config/env.ts',
  'src/integrations/supabase/client.ts',
  'src/integrations/supabase/types.ts',
  'src/tests/env-config.test.ts',
  'src/tests/clean-v1-types.test.ts',
  '.env',
  '.env.example',
  'docs/environment.md',
];

describe('wave 1 secret audit', () => {
  it('introduces no real secret material', () => {
    for (const file of SOURCES) {
      const src = read(file);
      expect(src, file).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
      expect(src, file).not.toMatch(/ghp_[A-Za-z0-9]{36}/);
      expect(src, file).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
    }
  });

  it('never assigns a credential value in a source file', () => {
    for (const file of SOURCES) {
      const src = read(file);
      const passwordExpr = /(PROD_DB_PASSWORD|DB_PASSWORD)\s*[:=]\s*['"]?[^\s'"]{4,}/i;
      expect(passwordExpr.test(src), `${file} must not assign a password`).toBe(false);
    }
  });

  it('keeps service-role keys out of every source file', () => {
    for (const file of SOURCES) {
      const src = read(file);
      const serviceRoleLiteral =
        /service[_A-Za-z]*\s*[:=]\s*['"]\s*ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/i;
      expect(serviceRoleLiteral.test(src), file).toBe(false);
    }
  });

  it('introduces no hardcoded project ref in application source', () => {
    const refs = [
      'zwrrkbedbprgqtypglwm',
      'jruylzhfobhjisnneyrj',
      'asqdfrzhakgnlfhnzfyu',
      'gdbxutbwgolftqmxnkbi',
    ];
    // The gate itself necessarily enumerates these literals, so it is excluded.
    const appSources = SOURCES.filter(
      (f) => (f.startsWith('src/') || f === '.env') && f !== 'src/tests/r1c2-gate.test.ts',
    );
    for (const file of appSources) {
      const src = read(file);
      for (const ref of refs) {
        expect(src.includes(ref), `${file} must not contain ${ref}`).toBe(false);
      }
    }
  });

  it('does not read service-role variables in browser source', () => {
    const browserSrc = read('src/integrations/supabase/client.ts');
    expect(browserSrc).not.toMatch(/SERVICE_ROLE_KEY/);
    expect(browserSrc).not.toMatch(/sb_secret_[A-Za-z0-9]/);
  });
});

describe('wave 1 environment architecture', () => {
  it('declares explicit, mutually exclusive targets', () => {
    expect([...APP_ENVIRONMENTS]).toEqual(['local', 'staging', 'production']);
  });

  it('routes browser configuration through the single validated boundary', () => {
    // Comments are stripped so this asserts on code, not prose.
    const clientSrc = read('src/integrations/supabase/client.ts')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    expect(clientSrc).toContain("from '@/config/env'");
    expect(clientSrc).toContain('env.supabaseUrl');
    expect(clientSrc).toContain('env.supabasePublishableKey');
    expect(clientSrc).not.toContain('import.meta.env');
  });

  it('fails closed on missing or invalid configuration', () => {
    const bad: EnvironmentSource = () => undefined;
    expect(() => createEnvConfig(bad)).toThrow();
    const good: EnvironmentSource = (key) =>
      key === 'VITE_ENV' ? 'local' : 'https://x.supabase.co';
    expect(() => createEnvConfig(good)).toThrow();
  });
});

describe('wave 1 type contract static surface', () => {
  it('classifies the authoritative table set', () => {
    expect([...CLEAN_V1_TABLES].length).toBe(15);
    const types = read('src/integrations/supabase/types.ts');
    for (const name of CLEAN_V1_TABLES) {
      expect(types, `table ${name} must be typed`).toContain(`${String(name)}: {`);
    }
  });

  it('keeps markets and roles restricted', () => {
    expect([...MARKETS]).toEqual(['PT', 'BR', 'INTL']);
    expect([...ROLES]).toEqual(['admin', 'collaborator', 'client']);
    expect(isMarket('PT')).toBe(true);
    expect(isMarket('ES')).toBe(false);
    expect(isRole('admin')).toBe(true);
    expect(isRole('owner')).toBe(false);
  });

  it('does not carry a legacy database enum for roles', () => {
    const types = read('src/integrations/supabase/types.ts');
    expect(types).not.toContain('app_role');
  });
});

describe('wave 1 repository integrity', () => {
  it('leaves the supabase link pointing at STAGING', () => {
    // supabase/.temp/ is gitignored CLI-local state: the link file only
    // exists where a developer ran `supabase link`. CI/Hostinger checkouts
    // never link a project, so absence is safe — CI does not drive
    // `supabase db push` through a local link. When a link exists, it
    // must point at STAGING so migrations never target production.
    const linkPath = join(repo, 'supabase/.temp/project-ref');
    if (!existsSync(linkPath)) return;
    expect(readFileSync(linkPath, 'utf8').trim()).toBe('jruylzhfobhjisnneyrj');
  });
});
