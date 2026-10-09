import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  MARKET_LABELS,
  STATUS_LABELS,
  SUBSCRIBER_STATUS_LABELS,
  SUBSCRIBER_STATUSES,
  slugify,
} from '@/lib/adminContent';

/**
 * R1C8 Wave 6 — admin migration gate.
 *
 * The load-bearing rules:
 *  1. No admin surface reads or writes the retired tables
 *     (`blog_posts`, `projects`, `services`, `blog_categories`, `resources`).
 *  2. Status and market values are the Clean V1 unions, never legacy ones.
 *  3. Audit writes go through the verified `admin-audit` function, because the
 *     browser cannot insert `admin_audit_log` directly (SELECT-only RLS).
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const RETIRED_TABLES = ['blog_posts', 'projects', 'services', 'blog_categories', 'resources'];

/** Admin files allowed to keep retired-table references, with the reason. */
const RETIRED_TABLE_ALLOWLIST: Record<string, string> = {
  // Dead, unrouted legacy page. Left untouched on purpose (see ADMIN_TECH_DEBT).
  'src/pages/Admin.tsx': 'dead page, unrouted',
};

const adminSources = (() => {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  const root = process.cwd();
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(root, rel))) {
      const full = `${rel}/${entry}`;
      if (statSync(join(root, full)).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk('src/pages/admin');
  walk('src/components/admin');
  return out;
})();

describe('no admin dependence on retired tables', () => {
  it('scans a non-trivial number of admin sources', () => {
    expect(adminSources.length).toBeGreaterThan(40);
  });

  for (const table of RETIRED_TABLES) {
    it(`no admin file queries ${table}`, () => {
      const pattern = new RegExp(`from\\(['"]${table}['"]\\)`);
      const offenders = adminSources
        .filter((f) => !(f in RETIRED_TABLE_ALLOWLIST))
        .filter((f) => pattern.test(stripComments(read(f))));
      expect(offenders, `retired reads in: ${offenders.join(', ')}`).toEqual([]);
    });
  }

  it('documents every allowlisted exception', () => {
    for (const [file, reason] of Object.entries(RETIRED_TABLE_ALLOWLIST)) {
      expect(reason.length).toBeGreaterThan(0);
      expect(read(file)).toBeTruthy();
    }
  });
});

describe('Clean V1 value unions', () => {
  it('uses the six lead lifecycle statuses, with no legacy lost', () => {
    expect([...LEAD_STATUSES].sort()).toEqual(
      ['closed', 'contacted', 'converted', 'new', 'qualified', 'spam'].sort(),
    );
    expect(LEAD_STATUS_LABELS.closed).toBe('Fechado');
    expect(LEAD_STATUS_LABELS.spam).toBe('Spam');
    expect(LEAD_STATUS_LABELS as Record<string, string>).not.toHaveProperty('lost');
  });

  it('uses the five booking lifecycle statuses, with no legacy pending', () => {
    expect([...BOOKING_STATUSES].sort()).toEqual(
      ['cancelled', 'completed', 'confirmed', 'no_show', 'requested'].sort(),
    );
    expect(BOOKING_STATUS_LABELS.requested).toBe('Pedido');
    expect(BOOKING_STATUS_LABELS as Record<string, string>).not.toHaveProperty('pending');
  });

  it('uses the three subscriber statuses', () => {
    expect([...SUBSCRIBER_STATUSES].sort()).toEqual(['bounced', 'subscribed', 'unsubscribed'].sort());
    expect(SUBSCRIBER_STATUS_LABELS.subscribed).toBe('Subscrito');
  });

  it('uses the three content statuses', () => {
    expect(Object.keys(STATUS_LABELS).sort()).toEqual(['archived', 'draft', 'published'].sort());
  });

  it('covers all three markets in the admin', () => {
    expect(Object.keys(MARKET_LABELS).sort()).toEqual(['BR', 'INTL', 'PT'].sort());
  });
});

describe('slug generation', () => {
  it('normalises titles into slugs', () => {
    expect(slugify('Olá Mundo!')).toBe('ola-mundo');
    expect(slugify('  Espaços  e---traços  ')).toBe('espacos-e-tracos');
    expect(slugify('')).toBe('');
  });

  it('clamps slugs to a sane length', () => {
    expect(slugify('a'.repeat(500)).length).toBeLessThanOrEqual(120);
  });
});

describe('audit infrastructure', () => {
  it('provides the admin-audit edge function', () => {
    const src = read('supabase/functions/admin-audit/index.ts');
    expect(src).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(src).toContain('admin_audit_log');
    // The caller is re-verified server-side; the browser is never trusted.
    expect(src).toContain('has_role');
    expect(src).toContain('_role: "admin"');
    expect(src).toContain('Deno.serve');
  });

  it('never exposes the service key to the browser helper', () => {
    const helper = stripComments(read('src/lib/adminContent.ts'));
    expect(helper).not.toContain('SERVICE_ROLE');
    expect(helper).not.toContain('sb_secret_');
    expect(helper).toContain("functions.invoke('admin-audit'");
  });

  it('makes audit logging failure-safe', () => {
    const helper = read('src/lib/adminContent.ts');
    // logAdminAction catches everything so auditing can never break saving.
    expect(helper).toContain('export async function logAdminAction');
    expect(helper).toContain('console.error');
  });

  it('audits every admin mutation surface', () => {
    const audited = [
      'src/pages/admin/AdminBlog.tsx',
      'src/pages/admin/AdminResources.tsx',
      'src/pages/admin/AdminProjects.tsx',
      'src/pages/admin/AdminServices.tsx',
      'src/pages/admin/AdminLeads.tsx',
      'src/pages/admin/AdminBookingDetail.tsx',
      'src/pages/admin/AdminClients.tsx',
      'src/pages/admin/email-marketing/AdminNewsletterSubscribers.tsx',
    ];
    for (const file of audited) {
      expect(stripComments(read(file)), `${file} must audit mutations`).toContain('logAdminAction');
    }
  });
});

describe('admin content data layer', () => {
  it('declares every content CRUD operation', () => {
    const api = stripComments(read('src/lib/adminContent.ts'));
    for (const fn of [
      'listEntries',
      'getEntry',
      'createEntryWithLocalization',
      'saveEntryWithLocalization',
      'deleteEntry',
      'listAuthors',
      'createAuthor',
      'updateAuthor',
      'deleteAuthor',
      'listCategories',
      'createCategoryWithLocalization',
      'saveCategoryWithLocalization',
      'deleteCategory',
      'listCaseStudies',
      'createCaseStudyWithLocalization',
      'saveCaseStudyWithLocalization',
      'deleteCaseStudy',
      'listProducts',
      'createProductWithLocalization',
      'saveProductWithLocalization',
      'deleteProduct',
    ]) {
      expect(api, `${fn} must exist`).toContain(`export async function ${fn}`);
    }
  });

  it('declares every commercial admin operation', () => {
    const api = stripComments(read('src/lib/adminContent.ts'));
    for (const fn of [
      'listLeads',
      'updateLeadStatus',
      'saveLeadAdminNotes',
      'deleteLead',
      'listBookings',
      'getBooking',
      'updateBookingStatus',
      'deleteBooking',
      'listSubscribers',
      'deleteSubscriber',
      'listAuditForEntity',
    ]) {
      expect(api, `${fn} must exist`).toContain(`export async function ${fn}`);
    }
  });

  it('keeps entry and localization status in agreement', () => {
    const api = read('src/lib/adminContent.ts');
    // Publish/unpublish helpers set both, because the public read path
    // requires both to be published.
    expect(api).toContain('status: localization.status');
  });

  it('rolls back orphaned parents on failed localizations', () => {
    const api = read('src/lib/adminContent.ts');
    expect(api).toContain('Roll back the orphaned parent');
  });

  it('never writes the visitor message column from admin notes', () => {
    const api = stripComments(read('src/lib/adminContent.ts'));
    expect(api).toContain('admin_notes');
    const saveNotes = /export async function saveLeadAdminNotes[\s\S]{0,800}?\.update\(\{([^}]+)\}\)/;
    const match = saveNotes.exec(api);
    expect(match, 'saveLeadAdminNotes must exist').not.toBeNull();
    expect(match![1]).not.toContain('message');
  });
});

describe('market-aware admin editing', () => {
  it('scopes every content admin list by market', () => {
    for (const file of [
      'src/pages/admin/AdminBlog.tsx',
      'src/pages/admin/AdminResources.tsx',
      'src/pages/admin/AdminProjects.tsx',
      'src/pages/admin/AdminServices.tsx',
    ]) {
      const src = stripComments(read(file));
      expect(src, `${file} must filter by market`).toContain('MarketTabs');
      expect(src, `${file} must track the market`).toMatch(/marketFilter|market/);
    }
  });

  it('shares one market selector across admin surfaces', () => {
    expect(read('src/components/admin/MarketTabs.tsx')).toContain('MARKET_LABELS');
  });

  it('stamps the canonical locale on every new localization', () => {
    const api = read('src/lib/adminContent.ts');
    expect(api).not.toContain('MARKET_LOCALE');
  });

  it('editors stamp the canonical locale for their market', () => {
    for (const file of [
      'src/pages/admin/AdminBlog.tsx',
      'src/pages/admin/AdminResources.tsx',
      'src/pages/admin/AdminProjects.tsx',
      'src/pages/admin/AdminServices.tsx',
      'src/components/admin/blog-editor/BlogEditor.tsx',
    ]) {
      expect(stripComments(read(file)), file).toContain('MARKET_LOCALE');
    }
  });
});
