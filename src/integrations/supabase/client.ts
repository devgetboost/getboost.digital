import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { createSupabaseFetch } from './fetch';
import type { Database } from './types';

/**
 * Authoritative browser Supabase client for the Clean Database V1 schema.
 *
 * Requirements honoured here (R1C2 Wave 1):
 *  - single authoritative configuration, driven by validated environment
 *    variables (no raw `import.meta.env`, no hardcoded project ref),
 *  - URL and publishable key come from `src/config/env`, which fails clearly
 *    when they are absent and rejects secret keys,
 *  - no service-role credential is ever referenced,
 *  - request/auth behaviour is unchanged from the previous implementation.
 *
 * New code must use this client. Legacy flows still migrating to the Clean V1
 * schema use `legacySupabase`, re-exported below — that client is a type-level
 * bridge only and is documented in `./legacy-compat`.
 */
const SUPABASE_URL = env.supabaseUrl;
const SUPABASE_PUBLISHABLE_KEY = env.supabasePublishableKey;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  global: {
    fetch: createSupabaseFetch(SUPABASE_PUBLISHABLE_KEY),
  },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Legacy migration bridge (type-level only, runtime-identical).
export { legacySupabase, LEGACY_COMPAT_TABLES } from './legacy-compat';
export type { LegacyCompatDatabase } from './legacy-compat';
