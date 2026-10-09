import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * R1C10 — release gate. Single file, single verdict.
 *
 * Release is GO only when every assertion here passes together with
 * `tsc` (0 errors), `vite build` (exit 0) and the full suite. Any single
 * failure → NO-GO. No partial releases.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');

describe('release gate: schema chain', () => {
  it('contains exactly the 3 Clean V1 migrations and nothing else', () => {
    const files = readdirSync(join(process.cwd(), 'supabase/migrations')).filter((f) =>
      f.endsWith('.sql'),
    );
    expect(files.sort()).toEqual([
      '20261008100000_clean_v1_identity.sql',
      '20261008100001_clean_v1_commercial.sql',
      '20261008100002_clean_v1_content.sql',
    ]);
  });

  it('creates exactly the 15 application tables', () => {
    const chain = readdirSync(join(process.cwd(), 'supabase/migrations'))
      .filter((f) => f.endsWith('.sql'))
      .map((f) => read(`supabase/migrations/${f}`))
      .join('\n');
    const created = new Set<string>();
    for (const m of chain.matchAll(/create table public\.(\w+)/gi)) {
      created.add(m[1].toLowerCase());
    }
    expect(created.size).toBe(15);
  });

  it('seeds exactly the 2 Clean V1 buckets', () => {
    const content = read('supabase/migrations/20261008100002_clean_v1_content.sql');
    expect(content).toContain("'public-media'");
    expect(content).toContain("'private-assets'");
  });
});

describe('release gate: no legacy in admin', () => {
  it('has zero admin references to retired tables', () => {
    const { readdirSync: ls, statSync } = require('node:fs') as typeof import('node:fs');
    const root = process.cwd();
    const files: string[] = [];
    const walk = (rel: string) => {
      for (const entry of ls(join(root, rel))) {
        const full = `${rel}/${entry}`;
        if (statSync(join(root, full)).isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry)) files.push(full);
      }
    };
    walk('src/pages/admin');
    walk('src/components/admin');
    const offenders: string[] = [];
    for (const file of files) {
      const src = read(file);
      if (/from\(['"](blog_posts|projects|services|blog_categories|resources)['"]\)/.test(src)) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });
});

describe('release gate: storage discipline', () => {
  it('references only the two Clean V1 buckets in storage calls', () => {
    const { readdirSync: ls, statSync } = require('node:fs') as typeof import('node:fs');
    const root = process.cwd();
    const offenders: string[] = [];
    const walk = (rel: string) => {
      for (const entry of ls(join(root, rel))) {
        const full = `${rel}/${entry}`;
        if (statSync(join(root, full)).isDirectory()) {
          if (entry !== 'node_modules') walk(full);
        } else if (/\.(ts|tsx)$/.test(entry)) {
          if (full === 'src/lib/storage.ts' || full === 'src/tests/storage.test.ts') return;
          const src = read(full);
          const m = src.match(/storage\.from\(['"]([^'"]+)['"]\)/g) ?? [];
          for (const call of m) {
            if (!call.includes('public-media') && !call.includes('private-assets')) {
              offenders.push(`${full}: ${call}`);
            }
          }
        }
      }
    };
    walk('src');
    expect(offenders).toEqual([]);
  });
});

describe('release gate: market integrity', () => {
  it('keeps the three-market model intact', () => {
    const markets = read('src/lib/markets.ts');
    expect(markets).toContain("PT: 'pt-PT'");
    expect(markets).toContain("BR: 'pt-BR'");
    expect(markets).toContain("INTL: 'en'");
  });

  it('emits per-market sitemap alternates', () => {
    const script = read('scripts/generate-sitemap.js');
    expect(script).toContain("['pt-PT', '']");
    expect(script).toContain("['pt-BR', '/br']");
    expect(script).toContain("['en', '/en']");
  });
});

describe('release gate: secrets', () => {
  it('commits no credential material', () => {
    const { readdirSync: ls, statSync } = require('node:fs') as typeof import('node:fs');
    const root = process.cwd();
    const offenders: string[] = [];
    const walk = (rel: string) => {
      for (const entry of ls(join(root, rel))) {
        const full = `${rel}/${entry}`;
        if (statSync(join(root, full)).isDirectory()) {
          if (entry !== 'node_modules') walk(full);
        } else if (/\.(ts|tsx|js|mjs)$/.test(entry)) {
          const src = read(full);
          // PLACEHOLDER values are test fixtures that prove rejection logic.
          const scrubbed = src.replace(/PLACEHOLDER/g, '');
          if (/sb_secret_[A-Za-z0-9_-]{10,}/.test(scrubbed)) offenders.push(`${full}: secret key`);
          if (/sk-[A-Za-z0-9]{20,}/.test(scrubbed)) offenders.push(`${full}: api key`);
        }
      }
    };
    walk('src');
    walk('scripts');
    expect(offenders).toEqual([]);
  });
});
