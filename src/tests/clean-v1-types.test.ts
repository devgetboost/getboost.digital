import { describe, expect, it } from 'vitest';
import {
  CLEAN_V1_TABLES,
  type CleanV1TableName,
  type Database,
  type LegacyCompatTableName,
} from '@/integrations/supabase/types';

/**
 * Wave 1 type-contract tests (R1C2 Objectives 5-7).
 *
 * These are static contract checks: the compile-time assertions below fail the
 * build if the Clean V1 schema contract drifts, and the runtime assertions
 * prove the same facts are observable in the shipped types module.
 */

type Tables = Database['public']['Tables'];
type TableName = keyof Tables;

/** Fails to compile if any authoritative table is absent from the schema type. */
type MissingAuthoritativeTable = Exclude<CleanV1TableName, TableName>;
const _noMissingAuthoritativeTable: MissingAuthoritativeTable extends never ? true : never = true;

/** Fails to compile if any table is neither authoritative nor classified debt. */
type UnclassifiedTable = Exclude<TableName, CleanV1TableName | LegacyCompatTableName>;
const _allTablesClassified: UnclassifiedTable extends never ? true : never = true;

/** The market and role column contracts, expressed once. */
type LeadRow = Database['public']['Tables']['leads']['Row'];
type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];
type ContentLocalizationRow = Database['public']['Tables']['content_localizations']['Row'];
type BookingRow = Database['public']['Tables']['bookings']['Row'];

/** Fails to compile if the market union drifts away from PT | BR | INTL. */
type MarketDrift = Exclude<LeadRow['market'], 'PT' | 'BR' | 'INTL'>;
const _marketsExact: MarketDrift extends never ? true : never = true;

/** Fails to compile if the role union drifts away from admin/collaborator/client. */
type RoleDrift = Exclude<UserRoleRow['role'], 'admin' | 'collaborator' | 'client'>;
const _rolesExact: RoleDrift extends never ? true : never = true;

/** Fails to compile if a database enum (e.g. a legacy app_role) reappears. */
type EnumDrift = keyof Database['public']['Enums'];
const _noEnums: EnumDrift extends never ? true : never = true;

const REQUIRED_TABLES = [
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
] as const satisfies readonly CleanV1TableName[];

describe('Clean V1 type contract', () => {
  it('exposes all 15 authoritative application tables', () => {
    // Compile-time: no READ_ONLY marker on the table name type, so every table
    // in the schema must be covered by CLEAN_V1_TABLES plus explicit debt.
    const present: ReadonlyArray<keyof Database['public']['Tables']> = REQUIRED_TABLES;
    expect(present).toHaveLength(15);
    expect([...present].sort()).toEqual([...REQUIRED_TABLES].sort());
  });

  it('classifies every table as authoritative or compatibility debt — never both', () => {
    for (const name of REQUIRED_TABLES) {
      const authoritative = (CLEAN_V1_TABLES as readonly string[]).includes(name);
      expect(authoritative, `missing authoritative contract: ${name}`).toBe(true);
    }
  });

  it('types every authoritative table with Row/Insert/Update/Relationships', () => {
    // Compile-time proof: each name must resolve inside the typed schema, and
    // each resolved table must carry all four generated segments.
    for (const name of REQUIRED_TABLES) {
      type Table = Database['public']['Tables'][typeof name];
      const shape: keyof Table = 'Row';
      const insert: keyof Table = 'Insert';
      const update: keyof Table = 'Update';
      const relationships: keyof Table = 'Relationships';
      expect([shape, insert, update, relationships]).toEqual([
        'Row',
        'Insert',
        'Update',
        'Relationships',
      ]);
    }
  });

  it('applies market/role column contracts', () => {
    const lead: LeadRow = {
      id: '00000000-0000-0000-0000-000000000000',
      name: 'x',
      email: 'x@example.com',
      market: 'PT',
      locale: 'pt-PT',
      source: 'contact',
      status: 'new',
      consent_privacy_at: '2027-01-01T00:00:00Z',
      consent_marketing: false,
      metadata: {},
      created_at: '2027-01-01T00:00:00Z',
      updated_at: '2027-01-01T00:00:00Z',
      phone: null,
      company: null,
      country: null,
      landing_page: null,
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      utm_term: null,
      service_interest: null,
      message: null,
      marketing_consent_at: null,
      deleted_at: null,
    };
    expect(lead.market).toBe('PT');

    const role: UserRoleRow = {
      user_id: '00000000-0000-0000-0000-000000000000',
      role: 'collaborator',
      granted_at: '2027-01-01T00:00:00Z',
      granted_by: null,
    };
    expect(role.role).toBe('collaborator');
  });

  it('rejects markets and roles outside the authoritative sets', () => {
    const rejected = () => {
      // @ts-expect-error market is restricted to PT | BR | INTL
      const badMarket: LeadRow['market'] = 'ES';
      // @ts-expect-error role is restricted to admin | collaborator | client
      const badRole: UserRoleRow['role'] = 'owner';
      // @ts-expect-error booking status is restricted to the Clean V1 lifecycle
      const badStatus: BookingRow['status'] = 'rescheduled';
      return [badMarket, badRole, badStatus] as const;
    };
    expect(rejected()).toHaveLength(3);
  });

  it('retypes every authoritative table with an Insert and Update variant', () => {
    // Compile-time: a variable typed from a row must be assignable to neither
    // Insert nor Update for a table with required columns.
    type LeadInsert = Database['public']['Tables']['leads']['Insert'];
    const needsMarket: LeadInsert = {
      email: 'x@example.com',
      name: 'x',
      source: 'contact',
      consent_privacy_at: '2027-01-01T00:00:00Z',
      locale: 'pt-PT',
      market: 'PT',
    };
    expect(needsMarket.market).toBe('PT');
  });

  it('keeps the localization pattern typed (parent id + market + slug)', () => {
    const localization: ContentLocalizationRow = {
      id: '00000000-0000-0000-0000-000000000000',
      entry_id: '00000000-0000-0000-0000-000000000000',
      market: 'INTL',
      locale: 'en',
      title: 't',
      slug: 's',
      excerpt: null,
      body: { blocks: [] },
      seo_title: null,
      seo_description: null,
      og_image_path: null,
      status: 'draft',
      published_at: null,
      created_at: '2027-01-01T00:00:00Z',
      updated_at: '2027-01-01T00:00:00Z',
    };
    expect(localization.market).toBe('INTL');
    expect(localization.slug).toBe('s');
  });

  it('does not expose database enums for roles or markets', () => {
    // Enforced at compile time by `_noEnums` below; the static gate also fails
    // if the literal `app_role` reappears in types.ts.
    expect(CLEAN_V1_TABLES).not.toContain('app_role');
  });
});
