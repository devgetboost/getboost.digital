import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * R1C9 Wave 7 — legacy cleanup gate.
 *
 * Locks in what Wave 7 removed (dead pages, dead static files, retired admin
 * tables) and inventories what remains so the next wave knows exactly what is
 * left: live features built on legacy tables that have no Clean V1 counterpart
 * yet.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const root = process.cwd();
const listSources = (rel: string): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk(join(root, rel));
  return out.map((f) => f.slice(root.length + 1));
};

const adminSources = [...listSources('src/pages/admin'), ...listSources('src/components/admin')];

describe('dead code stays removed', () => {
  it('has no unrouted legacy admin page', () => {
    expect(existsSync(join(root, 'src/pages/Admin.tsx'))).toBe(false);
  });

  it('has no orphaned static content files', () => {
    expect(existsSync(join(root, 'src/data/blog.ts'))).toBe(false);
    expect(existsSync(join(root, 'src/data/portfolio.ts'))).toBe(false);
  });

  it('imports no removed module', () => {
    const offenders: string[] = [];
    for (const file of listSources('src')) {
      if (file.startsWith('src/tests/')) continue;
      const src = read(file);
      if (/@\/pages\/Admin['"]/.test(src)) offenders.push(`${file}: @/pages/Admin`);
      if (/@\/data\/(blog|portfolio)['"]/.test(src)) offenders.push(`${file}: @/data/${src.match(/@\/data\/(blog|portfolio)/)?.[1]}`);
    }
    expect(offenders).toEqual([]);
  });
});

describe('retired admin tables stay gone', () => {
  const RETIRED = ['blog_posts', 'projects', 'services', 'blog_categories', 'resources'];

  for (const table of RETIRED) {
    it(`no admin file queries ${table}`, () => {
      const pattern = new RegExp(`from\\(['"]${table}['"]\\)`);
      const offenders = adminSources.filter((f) => pattern.test(stripComments(read(f))));
      expect(offenders, `retired reads in: ${offenders.join(', ')}`).toEqual([]);
    });
  }
});

describe('remaining legacy inventory (documented, not removed)', () => {
  /**
   * Live features built on legacy tables with no Clean V1 counterpart.
   * Each entry names the table, the surfaces that depend on it, and why Wave 7
   * left it alone. Removing any of these rows without migrating the feature
   * would break it — that is Wave 8 work.
   */
  const REMAINING: Record<string, { usedBy: string[]; reason: string }> = {
    lead_tags: {
      usedBy: ['AdminLeads tags UI', 'AdminInbox tags', 'AdminCampaignNew', 'WhatsAppAutomation'],
      reason: 'live tagging feature; no Clean V1 successor table',
    },
    lead_tag_assignments: {
      usedBy: ['AdminLeads', 'AdminInbox', 'useLeadAutomationHistory', 'AdminLeadDetail'],
      reason: 'live tagging feature; no Clean V1 successor table',
    },
    client_services: {
      usedBy: ['AdminClients', 'ClientDashboard', 'ClientServices'],
      reason: 'live client-area feature; no Clean V1 successor table',
    },
    client_subscriptions: {
      usedBy: ['AdminClients', 'ClientFinances'],
      reason: 'live client-area feature; no Clean V1 successor table',
    },
    client_invoices: {
      usedBy: ['AdminClients', 'ClientDashboard', 'ClientFinances'],
      reason: 'live client-area feature; no Clean V1 successor table',
    },
    support_tickets: {
      usedBy: ['AdminClients', 'ClientDashboard', 'ClientSupport'],
      reason: 'live client-area feature; no Clean V1 successor table',
    },
    booking_settings: {
      usedBy: ['Booking availability form'],
      reason: 'live scheduling config; no Clean V1 successor table',
    },
    admin_calendar_blocks: {
      usedBy: ['InboxCalendar blocks'],
      reason: 'live calendar feature; no Clean V1 successor table',
    },
    booking_reschedule_history: {
      usedBy: ['Booking reschedule writes'],
      reason: 'append-only history; dropping the write would lose data silently',
    },
    email_deletion_audit: {
      usedBy: ['InboxMail audit view'],
      reason: 'admin audit view; superseded by admin_audit_log for new events only',
    },
  };

  it('documents every remaining legacy table with its reason', () => {
    for (const [table, { usedBy, reason }] of Object.entries(REMAINING)) {
      expect(usedBy.length, `${table} must name its consumers`).toBeGreaterThan(0);
      expect(reason.length, `${table} must state why it remains`).toBeGreaterThan(10);
    }
    expect(Object.keys(REMAINING)).toHaveLength(10);
  });

  it('keeps the inventory honest: every listed table is still referenced', () => {
    const all = listSources('src').filter((f) => !f.startsWith('src/tests/'));
    for (const table of Object.keys(REMAINING)) {
      const pattern = new RegExp(`from\\(['"]${table}['"]( as never)?\\)`);
      const found = all.some((f) => pattern.test(stripComments(read(f))));
      expect(found, `${table} is listed but no longer referenced — remove it from the inventory`).toBe(true);
    }
  });
});
