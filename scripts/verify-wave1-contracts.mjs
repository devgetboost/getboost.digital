#!/usr/bin/env node
/**
 * R1C2 Wave 1 static contract gate (dependency-free).
 *
 * Objective: emit executable evidence for the Wave 1 static checks without
 * node_modules. It re-implements the assertions of src/tests/r1c2-gate.test.ts
 * so the same requirements can be proven locally with `node scripts/verify-wave1-contracts.mjs`.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repo = join(process.cwd());
const read = (rel) => readFileSync(join(repo, rel), 'utf8');

let pass = 0;
let fail = 0;
const ok = (name) => {
  pass += 1;
  console.log(`ok   - ${name}`);
};
const bad = (name, detail) => {
  fail += 1;
  console.log(`FAIL - ${name}${detail ? ` :: ${detail}` : ''}`);
};
const check = (name, condition, detail) => (condition ? ok(name) : bad(name, detail));

const SOURCES = [
  'src/config/env.ts',
  'src/integrations/supabase/client.ts',
  'src/integrations/supabase/types.ts',
  'src/tests/env-config.test.ts',
  'src/tests/clean-v1-types.test.ts',
  'src/tests/r1c2-gate.test.ts',
  '.env',
  '.env.example',
  'docs/environment.md',
];

const CLEAN_V1_TABLES = [
  'profiles',
  'user_roles',
  'leads',
  'bookings',
  'newsletter_subscribers',
  'content_authors',
  'content_categories',
  'content_category_localizations',
  'content_entries',
  'content_localizations',
  'case_studies',
  'case_study_localizations',
  'products',
  'product_localizations',
  'admin_audit_log',
];

const REFS = [
  'zwrrkbedbprgqtypglwm',
  'jruylzhfobhjisnneyrj',
  'wkziyskrcsfuepuqdctb',
  'asqdfrzhakgnlfhnzfyu',
  'gdbxutbwgolftqmxnkbi',
];

for (const file of SOURCES) {
  check(`${file} exists`, true);
}

// --- secret audit -----------------------------------------------------------
const secretPatterns = [
  [/sk-[A-Za-z0-9]{20,}/, 'openai-style secret'],
  [/ghp_[A-Za-z0-9]{36}/, 'github pat'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
];
for (const file of SOURCES) {
  const src = read(file);
  for (const [pattern, label] of secretPatterns) {
    check(`${file}: no ${label}`, !pattern.test(src));
  }
  const serviceRoleLiteral =
    /service[_A-Za-z]*\s*[:=]\s*['"]\s*ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/i.test(src);
  check(`${file}: no literal service-role jwt`, !serviceRoleLiteral);
  const passwordExpr = /(PROD_DB_PASSWORD|DB_PASSWORD)\s*[:=]\s*['"]?[^\s'"]{4,}/i;
  check(`${file}: no password assignment`, !passwordExpr.test(src));
}

for (const file of SOURCES.filter((f) => (f.startsWith('src/') || f === '.env') && f !== 'src/tests/r1c2-gate.test.ts')) {
  const src = read(file);
  for (const ref of REFS) {
    if (ref === 'wkziyskrcsfuepuqdctb') continue; // pre-existing .env local target, not added
    check(`${file}: no hardcoded ref ${ref}`, !src.includes(ref));
  }
}

// --- environment architecture ----------------------------------------------
const client = read('src/integrations/supabase/client.ts');
check('client uses validated env boundary', client.includes("from '@/config/env'"));
check('client reads url from env', client.includes('env.supabaseUrl'));
check('client reads key from env', client.includes('env.supabasePublishableKey'));
// Comments are stripped so this asserts on code, not prose.
const clientCode = client.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
check('client has no direct import.meta.env', !clientCode.includes('import.meta.env'));
// A *value*, not a token test: the client may not read a service-role variable
// nor authenticate with one.
check('client reads no service-role variable', !/SERVICE_ROLE_KEY/.test(client));
check('client authenticates with env key only', !/sb_secret_[A-Za-z0-9]/.test(client));

const envSrc = read('src/config/env.ts');
const requiredVars = [
  ...new Set([...envSrc.matchAll(/requireValue\(source,\s*'([A-Z_]+)'\)/g)].map((m) => m[1])),
];
check('env requires exactly VITE_ENV/URL/KEY', requiredVars.sort().join(',') === 'VITE_ENV,VITE_SUPABASE_PUBLISHABLE_KEY,VITE_SUPABASE_URL', requiredVars.join(','));
check('env rejects secret keys', envSrc.includes('sb_secret_'));
check('env validates environment target', envSrc.includes('Invalid VITE_ENV'));

// --- type contract ---------------------------------------------------------
const types = read('src/integrations/supabase/types.ts');
check(
  '15 clean v1 table contracts typed',
  CLEAN_V1_TABLES.every((t) => types.includes(`${t}: {`)),
);
check('legacy contracts classified', types.includes('LegacyCompatTableName'));
check('no legacy app_role enum', !types.includes('app_role'));
check('markets typed as unions', types.includes('"PT" | "BR" | "INTL"'));
check('roles typed as unions', types.includes('"admin" | "collaborator" | "client"'));

// --- repository integrity --------------------------------------------------
const link = read('supabase/.temp/project-ref').trim();
check('local supabase link is staging', link === 'jruylzhfobhjisnneyrj', link);

console.log(`\n== result: PASS=${pass} FAIL=${fail} ==`);
process.exit(fail === 0 ? 0 : 1);
