import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * R1C5 Wave 3 — commercial flow gate.
 *
 * The wave's hard rule is `BROWSER_DIRECT_INSERTS = 0` for `leads`, `bookings`
 * and `newsletter_subscribers`. These checks enforce that structurally over the
 * whole browser source tree, plus the properties that make the server-side
 * paths trustworthy.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

/** Recursively lists every browser source file, as repo-relative paths. */
function browserSources(): string[] {
  const { readdirSync, statSync } = require('node:fs') as typeof import('node:fs');
  const root = process.cwd();
  const out: string[] = [];
  const walk = (rel: string) => {
    for (const entry of readdirSync(join(root, rel))) {
      const full = `${rel}/${entry}`;
      const isDir = statSync(join(root, full)).isDirectory();
      if (isDir && entry !== 'node_modules') walk(full);
      else if (!isDir && /\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk('src');
  return out;
}

const COMMERCIAL_TABLES = ['leads', 'bookings', 'newsletter_subscribers'];

/**
 * Matches `from('leads').insert(...)` and `from("bookings").upsert(...)`,
 * including when the builder is wrapped across lines.
 */
const directWritePattern = (table: string) =>
  new RegExp(`from\\(['"]${table}['"]\\)[\\s\\S]{0,40}?\\.(insert|upsert)\\(`, 'm');

describe('browser never writes commercial tables directly', () => {
  // The gate itself necessarily names these patterns, so it is excluded.
  const sources = browserSources().filter((f) => !f.includes('/src/tests/'));

  it('scans a non-trivial number of browser sources', () => {
    expect(sources.length).toBeGreaterThan(150);
  });

  for (const table of COMMERCIAL_TABLES) {
    it(`has zero direct inserts/upserts on ${table}`, () => {
      const offenders: string[] = [];
      for (const file of sources) {
        const src = stripComments(read(file));
        const pattern = directWritePattern(table);
        pattern.lastIndex = 0;
        if (pattern.test(src)) offenders.push(file);
      }
      expect(offenders, `direct writes remain in: ${offenders.join(', ')}`).toEqual([]);
    });
  }
});

describe('trusted server-side write paths exist', () => {
  const functions = ['lead-capture', 'booking-request', 'newsletter-subscribe'];

  for (const fn of functions) {
    it(`${fn} is implemented as an edge function`, () => {
      const src = read(`supabase/functions/${fn}/index.ts`);
      expect(src).toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(src).toContain('Deno.serve');
    });
  }

  it('never exposes the service-role key to the browser', () => {
    const api = stripComments(read('src/lib/commercialApi.ts'));
    expect(api).not.toContain('SERVICE_ROLE');
    expect(api).not.toContain('sb_secret_');
    expect(api).toContain('supabase.functions.invoke');
  });

  it('routes every write path through the single browser client', () => {
    const api = stripComments(read('src/lib/commercialApi.ts'));
    expect(api).toContain("from '@/integrations/supabase/client'");
    for (const fn of functions) {
      expect(api, `${fn} must be callable`).toContain(`'${fn}'`);
    }
  });
});

describe('server-side paths enforce the Clean V1 contract', () => {
  it('lead-capture server-derives market, locale and consent', () => {
    const src = read('supabase/functions/lead-capture/index.ts');
    expect(src).toContain('deriveMarket');
    expect(src).toContain('deriveLocale');
    expect(src).toContain('consent_privacy_at');
    // Status is never taken from the request body.
    expect(src).toContain('const SUBMITTED_STATUS = "new"');
    expect(src).not.toMatch(/status:\s*body\./);
  });

  it('lead-capture preserves retired fields instead of dropping them', () => {
    const src = read('supabase/functions/lead-capture/index.ts');
    expect(src).toContain('buildLegacyMetadata');
    for (const retired of ['service', 'cargo', 'website', 'budget', 'notes']) {
      expect(src, `retired field ${retired} must be forwarded`).toContain(retired);
    }
  });

  it('booking-request requires proof of possession to reschedule', () => {
    const src = read('supabase/functions/booking-request/index.ts');
    // R1C8: `public.bookings` has no `metadata` column, so the minted-secret
    // mechanism was removed. Proof of possession is the booking email.
    expect(src).not.toContain('reschedule_secret');
    expect(src).toContain('providedEmail !== booking.email.toLowerCase()');
    expect(src).toContain('Não foi possível validar esta reserva.');
  });

  it('booking-request validates the meeting window server-side', () => {
    const src = read('supabase/functions/booking-request/index.ts');
    expect(src).toContain('isIsoTimestamp');
    expect(src).toContain('end_at).getTime() <= new Date(body.start_at).getTime()');
  });

  it('booking lookup returns a masked email, never the address', () => {
    const src = read('supabase/functions/booking-request/index.ts');
    expect(src).toContain('maskEmail');
    expect(src).toContain('email_hint');
    expect(src).not.toContain('return json({ booking_id: data.id, name: data.name, email: data.email');
  });

  it('newsletter-subscribe never re-activates an unsubscribed address', () => {
    const src = read('supabase/functions/newsletter-subscribe/index.ts');
    expect(src).toContain('already_subscribed');
    // An existing row is reported, never updated.
    expect(src).not.toMatch(/\.update\(\{[^}]*status/);
    expect(src).toMatch(/status:\s*["']subscribed["']/);
  });
});

describe('commercial flows are wired to the trusted paths', () => {
  const migrated = [
    'src/pages/Contact.tsx',
    'src/pages/Booking.tsx',
    'src/components/Footer.tsx',
    'src/components/ConsultantContactForm.tsx',
    'src/components/ChatWidget.tsx',
    'src/pages/DemoRequest.tsx',
    'src/pages/PriceSimulator.tsx',
    'src/pages/SEOAnalyzer.tsx',
    'src/pages/ContentIdeas.tsx',
    'src/pages/AcademyInCompany.tsx',
    'src/pages/AcademyCourseDetail.tsx',
    'src/pages/ServiceDetail.tsx',
    'src/pages/ResourceDetail.tsx',
    'src/components/admin/mail/MailReader.tsx',
  ];

  for (const file of migrated) {
    it(`${file} uses the commercial api`, () => {
      const src = stripComments(read(file));
      expect(src, `${file} must import the commercial api`).toMatch(
        /from ["']@\/lib\/commercialApi["']/,
      );
      expect(src, `${file} must not write a commercial table directly`).not.toMatch(
        /from\(['"](leads|bookings|newsletter_subscribers)['"]\)[\s\S]{0,40}?\.(insert|upsert)\(/,
      );
    });
  }

  it('newsletter subscribe comes from one shared helper', () => {
    const footer = read('src/components/Footer.tsx');
    expect(footer).toContain('subscribeNewsletter');
  });
});

describe('market and locale derivation', () => {
  const helpers = [
    'marketForLanguage',
    'localeForLanguage',
  ];

  it('declares browser-side market/locale helpers', () => {
    const src = read('src/lib/commercialMarket.ts');
    for (const helper of helpers) {
      expect(src).toContain(helper);
    }
  });

  it('maps the PT and BR languages to their markets', () => {
    // R1C7: both commercial and content reads resolve through `./markets`, so
    // the mapping table lives there and `commercialMarket` is a thin delegate.
    const shared = read('src/lib/markets.ts');
    expect(shared).toContain("pt: 'PT'");
    expect(shared).toContain("'pt-br': 'BR'");
    const commercial = read('src/lib/commercialMarket.ts');
    expect(commercial).toContain("from './markets'");
  });
});
