/**
 * R1C3 — Legacy compatibility layer (type-level only).
 *
 * WHY THIS EXISTS
 * ---------------
 * `types.ts` describes the deployed Clean Database V1 schema and is the only
 * authoritative contract. `leads`, `bookings`, `newsletter_subscribers`,
 * `profiles` and `user_roles` were rebuilt clean, which means the columns the
 * pre-2027 frontend still selects, filters, inserts and updates no longer
 * exist in the database.
 *
 * R1C2 completed the type contract only, so those legacy call sites no longer
 * type-checked. R1C3 fixes the compilation without touching the flow code:
 * this module re-declares the *retired* column contracts and hands out a
 * second client typed against them.
 *
 * WHAT THIS DOES NOT DO
 * ---------------------
 * It changes no runtime behaviour. `legacySupabase` is created from the exact
 * same URL, key, fetch wrapper and auth options as `supabase`, and every call
 * site keeps the SQL it already generates. Selecting a retired column still
 * fails at the database, exactly as before this layer existed — the database
 * is the source of truth, and the flow redesign that removes those retired
 * columns belongs to later Waves, not R1C3.
 *
 * IMPLEMENTATION NOTE
 * -------------------
 * Every contract below is declared as a `type` alias, never an `interface`.
 * supabase-js constrains its schema generic with `GenericSchema`
 * (`Tables: Record<string, GenericTable>`), and an interface-typed value is
 * not assignable to a `Record` index signature because interfaces have no
 * implicit index signature. Using `type` aliases is what keeps
 * `LegacyCompatDatabase` a valid schema; changing one of these back to an
 * `interface` silently collapses every row type to `never`.
 *
 * HOW TO USE IT
 * -------------
 *   import { legacySupabase } from '@/integrations/supabase/client';
 *
 * New code must use `supabase`. This client is a migration bridge: each import
 * is an explicit, greppable marker of remaining compatibility debt.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { createSupabaseFetch } from './fetch';
import type { Database } from './types';

type CleanTables = Database['public']['Tables'];

/** Table segment of a supabase-js schema definition. */
type CompatTable<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

// ------------------------------------------------------------------------ leads
/**
 * Retired `leads` columns. The CRM, automation, email and scheduling columns
 * below were dropped by Clean V1: Clean V1 keeps only the fields the website
 * itself owns (identity, market, locale, consent, attribution, status, audit
 * timestamps) plus a `metadata` jsonb escape hatch.
 */
export type RetiredLeadsColumns = {
  service: string | null;
  cargo: string | null;
  notes: string | null;
  website: string | null;
  budget: string | null;
  business_area: string | null;
  referrer: string | null;
  resource_id: string | null;
  resource_name: string | null;
  role: string | null;
  timeline: string | null;
  lead_status: string | null;
  crm_status: string | null;
  crm_error: string | null;
  crm_sent_at: string | null;
  automation_count: number;
  last_automation_at: string | null;
  last_email_at: string | null;
  last_email_subject: string | null;
};

/** `status`/`market`/`locale` widen to `string` because the legacy lifecycle used values outside the Clean V1 sets. */
export type LegacyLeadsRow = Omit<CleanTables['leads']['Row'], 'status' | 'market' | 'locale'> &
  RetiredLeadsColumns & {
    status: string;
    market: string;
    locale: string;
  };

export type LegacyLeadsInsert = Partial<LegacyLeadsRow>;
export type LegacyLeadsUpdate = Partial<LegacyLeadsRow>;

// --------------------------------------------------------------------- bookings
/** Retired `bookings` columns: the legacy jitsi/CRM meeting model. */
export type RetiredBookingsColumns = {
  phone: string | null;
  website: string | null;
  challenges: string | null;
  meeting_type: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  meeting_link: string | null;
  jitsi_room: string | null;
  language: string | null;
  lead_status: string | null;
};

export type LegacyBookingsRow = Omit<CleanTables['bookings']['Row'], 'status' | 'market' | 'locale'> &
  RetiredBookingsColumns & {
    status: string;
    market: string;
    locale: string;
  };

export type LegacyBookingsInsert = Partial<LegacyBookingsRow>;
export type LegacyBookingsUpdate = Partial<LegacyBookingsRow>;

// ---------------------------------------------------------- newsletter/subscribers
/**
 * Retired `newsletter_subscribers` columns: Clean V1 moves consent fields onto
 * `consent_at`/`unsubscribed_at` and drops the subscriber display name.
 */
export type RetiredNewsletterColumns = {
  name: string;
  consent: boolean;
  consented_at: string | null;
};

export type LegacyNewsletterRow = Omit<
  CleanTables['newsletter_subscribers']['Row'],
  'status' | 'market' | 'locale'
> &
  RetiredNewsletterColumns & {
    status: string;
    market: string;
    locale: string;
  };

export type LegacyNewsletterInsert = Partial<LegacyNewsletterRow>;
export type LegacyNewsletterUpdate = Partial<LegacyNewsletterRow>;

// --------------------------------------------------------------------- profiles
/**
 * Retired `profiles` columns: Clean V1 keys profiles on `auth.users.id` and
 * keeps only display identity, avatar path, market/locale/timezone and
 * timestamps. The legacy `user_id` duplicate plus the CRM contact block are
 * retired.
 */
export type RetiredProfilesColumns = {
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes: string | null;
  avatar_url: string | null;
};

export type LegacyProfilesRow = Omit<CleanTables['profiles']['Row'], 'preferred_market'> &
  RetiredProfilesColumns & {
    preferred_market: string | null;
  };

export type LegacyProfilesInsert = Partial<LegacyProfilesRow>;
export type LegacyProfilesUpdate = Partial<LegacyProfilesRow>;

// ------------------------------------------------------------------- user_roles
/**
 * Retired `user_roles` columns: Clean V1 uses a composite primary key
 * (user_id, role) with no surrogate id and no created_at, and restricts roles
 * to admin/collaborator/client.
 */
export type LegacyUserRolesRow = Omit<CleanTables['user_roles']['Row'], 'role'> & {
  role: string;
  id: string;
};

export type LegacyUserRolesInsert = Partial<LegacyUserRolesRow>;
export type LegacyUserRolesUpdate = Partial<LegacyUserRolesRow>;

// ------------------------------------------------------------------- the client

/** Tables whose contract was rebuilt by Clean V1. */
type RebuiltTables = 'leads' | 'bookings' | 'newsletter_subscribers' | 'profiles' | 'user_roles';

/**
 * `Database` with the rebuilt tables widened to their retired contracts.
 * Every other table (agentic, whatsapp, email, social, blog, academy…) keeps
 * the legacy contract it already had.
 */
export type LegacyCompatDatabase = Omit<Database, 'public'> & {
  public: {
    Tables: Omit<CleanTables, RebuiltTables> & {
      leads: CompatTable<LegacyLeadsRow, LegacyLeadsInsert, LegacyLeadsUpdate>;
      bookings: CompatTable<LegacyBookingsRow, LegacyBookingsInsert, LegacyBookingsUpdate>;
      newsletter_subscribers: CompatTable<
        LegacyNewsletterRow,
        LegacyNewsletterInsert,
        LegacyNewsletterUpdate
      >;
      profiles: CompatTable<LegacyProfilesRow, LegacyProfilesInsert, LegacyProfilesUpdate>;
      user_roles: CompatTable<LegacyUserRolesRow, LegacyUserRolesInsert, LegacyUserRolesUpdate>;
      email_deletion_audit: RetiredPassthroughTable;
    };
    Views: Database['public']['Views'];
    Functions: Database['public']['Functions'];
    Enums: Database['public']['Enums'];
    CompositeTypes: Database['public']['CompositeTypes'];
  };
};

/**
 * Legacy migration bridge client. Runtime-identical to `supabase`
 * (same URL, key, fetch wrapper, auth options).
 */
export const legacySupabase: SupabaseClient<LegacyCompatDatabase> = createClient<
  LegacyCompatDatabase
>(env.supabaseUrl, env.supabasePublishableKey, {
  global: {
    fetch: createSupabaseFetch(env.supabasePublishableKey),
  },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

/** Table names whose contracts are bridged here. Useful for audit reports. */
export const LEGACY_COMPAT_TABLES: readonly RebuiltTables[] = [
  'leads',
  'bookings',
  'newsletter_subscribers',
  'profiles',
  'user_roles',
];

/**
 * Legacy-only tables that Clean V1 removed entirely (no authority anywhere in
 * `types.ts`). Declared as permissive passthrough contracts so existing legacy
 * call sites still compile. Clean V1 owns email deletion auditing through
 * `admin_audit_log`; this entry exists purely so the retired write path keeps
 * its behaviour until a later Wave retires it.
 */
type RetiredPassthroughTable = {
  Row: Record<string, unknown>;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

/**
 * Authoritative role values accepted by the Clean V1 `public.has_role` function.
 * Derived from the deployed signature so this cast cannot drift silently.
 */
export type CleanRoleArg = Database['public']['Functions']['has_role']['Args']['_role'];

/**
 * Type adapter for `useHasRole`, which historically also accepted the retired
 * `'user'` role. The legacy union is widened back to the authoritative one
 * without changing the value that is sent: `has_role` simply returns false for
 * any role that is not assigned, which is the pre-existing behaviour.
 */
export function toHasRoleArg(role: string): CleanRoleArg {
  return role as CleanRoleArg;
}
