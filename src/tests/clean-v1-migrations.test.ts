import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS_DIR = join(process.cwd(), 'supabase/migrations');
const LEGACY_DIR = join(process.cwd(), 'supabase/migrations_legacy_archive');

const EXPECTED_TABLES = [
  'profiles',
  'user_roles',
  'leads',
  'bookings',
  'content_entries',
  'content_localizations',
  'content_authors',
  'content_categories',
  'content_category_localizations',
  'case_studies',
  'case_study_localizations',
  'products',
  'product_localizations',
  'newsletter_subscribers',
  'admin_audit_log',
];

const FORBIDDEN_REFS = [
  'asqdfrzhakgnlfhnzfyu',
  'wkziyskrcsfuepuqdctb',
  'gdbxutbwgolftqmxnkbi',
  'zwrrkbedbprgqtypglwm',
  'jruylzhfobhjisnneyrj',
];

const readChain = () =>
  readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => ({ file: f, sql: readFileSync(join(MIGRATIONS_DIR, f), 'utf8') }));

describe('clean v1 migration chain', () => {
  it('contains only the clean v1 baseline files', () => {
    const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      expect(f).toMatch(/^20261008\d{6}_clean_v1_.*\.sql$/);
    }
  });

  it('keeps legacy migrations archived outside the active chain', () => {
    const archived = readdirSync(LEGACY_DIR).filter((f) => f.endsWith('.sql'));
    expect(archived.length).toBe(110);
  });

  it('creates exactly the 15 intended application tables', () => {
    const chain = readChain();
    const created = new Set<string>();
    for (const { sql } of chain) {
      for (const m of sql.matchAll(/create table public\.(\w+)/gi)) {
        created.add(m[1].toLowerCase());
      }
    }
    expect([...created].sort()).toEqual([...EXPECTED_TABLES].sort());
  });

  it('enables RLS on every application table', () => {
    const chain = readChain();
    for (const table of EXPECTED_TABLES) {
      const covered = chain.some(({ sql }) =>
        new RegExp(`alter table public\\.${table} enable row level security`, 'i').test(sql),
      );
      expect(covered, `RLS enabled on ${table}`).toBe(true);
    }
  });

  it('grants no anonymous direct writes on commercial tables', () => {
    const chain = readChain().map((m) => m.sql).join('\n');
    for (const table of ['leads', 'bookings', 'newsletter_subscribers']) {
      const anonWrite = new RegExp(
        `create policy[^;]*on public\\.${table} for (insert|update|delete|all)[^;]*to anon`,
        'is',
      );
      expect(anonWrite.test(chain), `no anon writes on ${table}`).toBe(false);
    }
  });

  it('contains zero hardcoded supabase project refs', () => {
    for (const { file, sql } of readChain()) {
      for (const ref of FORBIDDEN_REFS) {
        expect(sql.includes(ref), `${file} must not contain ${ref}`).toBe(false);
      }
      expect(/https:\/\/[a-z0-9]{20}\.supabase\.co/.test(sql), `${file}: no supabase URLs`).toBe(false);
    }
  });

  it('uses market TEXT checks (no CHAR(2), PT/BR/INTL codes)', () => {
    const chain = readChain().map((m) => m.sql).join('\n');
    expect(/char\s*\(\s*2\s*\)/i.test(chain)).toBe(false);
    expect(chain).toContain(`check (market in ('PT', 'BR', 'INTL'))`);
  });

  it('enforces market-scoped slug uniqueness on localizations', () => {
    const chain = readChain().map((m) => m.sql).join('\n');
    for (const pair of ['uq_content_market_slug', 'uq_case_market_slug', 'uq_product_market_slug']) {
      expect(chain).toContain(pair);
    }
    expect(chain).toContain('uq_category_market_slug');
  });

  it('blocks admin self-escalation (no authenticated writes on user_roles)', () => {
    const chain = readChain().map((m) => m.sql).join('\n');
    const grants = [...chain.matchAll(/create policy[^;]*on public\.user_roles for (\w+)([^;]*?)to authenticated/gi)];
    for (const [, cmd] of grants) {
      expect(cmd.toLowerCase()).not.toBe('insert');
    }
    expect(/user_roles_admin_all/.test(chain)).toBe(true);
  });
});
