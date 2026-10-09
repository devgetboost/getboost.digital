import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import {
  contentBodyToText,
  parseContentBody,
  type ContentBlock,
} from '@/lib/contentBody';
import { localeForLanguage, marketForLanguage, scopeForLanguage } from '@/lib/contentApi';

/**
 * R1C6 Wave 4 — content system gate.
 *
 * Covers the read contract of the Clean V1 content tables: market/locale
 * resolution, draft filtering, localization handling, empty results, and the
 * guarantee that no public page queries Supabase directly any more.
 */

/** Reads either a repo-relative path or an absolute one returned by listSources. */
const read = (rel: string) => readFileSync(rel.startsWith('/') ? rel : join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const CONTENT_TABLES = [
  'content_authors',
  'content_categories',
  'content_category_localizations',
  'content_entries',
  'content_localizations',
  'case_studies',
  'case_study_localizations',
  'products',
  'product_localizations',
];

/** Legacy tables that must no longer be read by a public content page. */
const RETIRED_TABLES = ['blog_posts', 'projects', 'services', 'blog_categories'];

const listSources = (root: string): string[] => {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
    }
  };
  walk(root);
  return out;
};

/** Recursively lists browser sources under `src/pages`. */
const pageSources = listSources(join(process.cwd(), 'src/pages'));

/**
 * Admin content surfaces are excluded on purpose: migrating the admin CRUD
 * screens onto the Clean V1 content tables is a later wave. What these checks
 * assert is that no *public* page reads a content or retired table directly.
 */
const isAdminPage = (file: string) =>
  file.includes('/src/pages/admin/') || file.includes('/components/admin/');

const readsTable = (file: string, table: string): boolean =>
  new RegExp(`from\\(['"]${table}['"]\\)`).test(stripComments(read(file)));

describe('market and locale resolution', () => {
  it('maps the three i18n languages onto the three markets', () => {
    expect(marketForLanguage('pt')).toBe('PT');
    expect(marketForLanguage('pt-PT')).toBe('PT');
    expect(marketForLanguage('en')).toBe('INTL');
    expect(marketForLanguage('es')).toBe('INTL');
  });

  it('maps the three i18n languages onto the three markets', () => {
    expect(marketForLanguage('pt')).toBe('PT');
    expect(marketForLanguage('pt-PT')).toBe('PT');
    expect(marketForLanguage('br')).toBe('BR');
    expect(marketForLanguage('pt-BR')).toBe('BR');
    expect(marketForLanguage('en')).toBe('INTL');
    expect(marketForLanguage('es')).toBe('INTL');
  });

  it('defaults deterministically for absent and unknown languages', () => {
    // R1C7: no language at all → the default market (PT). A language that is not
    // Portuguese → INTL, because INTL is the international market.
    expect(marketForLanguage(undefined)).toBe('PT');
    expect(marketForLanguage('')).toBe('PT');
    expect(marketForLanguage('fr')).toBe('INTL');
  });

  it('resolves the locale string stored alongside content', () => {
    // Market and locale are separate: PT → pt-PT, BR → pt-BR, INTL → en.
    expect(localeForLanguage('pt')).toBe('pt-PT');
    expect(localeForLanguage('br')).toBe('pt-BR');
    expect(localeForLanguage('en')).toBe('en');
    // `es` is an interface language inside the INTL market, so its canonical
    // locale is `en`, not `es`.
    expect(localeForLanguage('es')).toBe('en');
    expect(localeForLanguage(undefined)).toBe('pt-PT');
  });

  it('scopes every content read by market and locale together', () => {
    expect(scopeForLanguage('pt')).toEqual({ market: 'PT', locale: 'pt-PT' });
    expect(scopeForLanguage('br')).toEqual({ market: 'BR', locale: 'pt-BR' });
    expect(scopeForLanguage('es')).toEqual({ market: 'INTL', locale: 'en' });
  });
});

describe('content body adapter', () => {
  it('reads the legacy rich-text shape', () => {
    expect(parseContentBody('# Hello')).toEqual([{ kind: 'rich-text', text: '# Hello' }]);
  });

  it('reads the block-based jsonb shape', () => {
    const body = [{ type: 'paragraph', text: 'first' }, { type: 'heading', level: 2, text: 'Second' }];
    const [segment] = parseContentBody(body);
    expect(segment.kind).toBe('blocks');
    if (segment.kind !== 'blocks') throw new Error('expected blocks');
    expect(segment.blocks.map((b: ContentBlock) => b.type)).toEqual(['paragraph', 'heading']);
  });

  it('reads the wrapped { blocks } shape', () => {
    expect(parseContentBody({ blocks: [{ type: 'list', items: ['a', 'b'] }] })).toHaveLength(1);
  });

  it('reads a string field under any of the accepted keys', () => {
    expect(parseContentBody({ html: '<p>x</p>' })).toEqual([{ kind: 'rich-text', text: '<p>x</p>' }]);
    expect(parseContentBody({ markdown: '# t' })).toEqual([{ kind: 'rich-text', text: '# t' }]);
  });

  it('returns nothing for empty, null and unrecognised shapes', () => {
    expect(parseContentBody(null)).toEqual([]);
    expect(parseContentBody('')).toEqual([]);
    expect(parseContentBody(42)).toEqual([]);
    expect(parseContentBody({ foo: 'bar' })).toEqual([]);
    expect(parseContentBody([{ notAType: true }])).toEqual([]);
  });

  it('ignores blocks with an unknown type instead of failing', () => {
    expect(parseContentBody([{ type: 'video' }])).toEqual([]);
  });

  it('flattens a body to searchable text', () => {
    const body = [{ type: 'paragraph', text: 'first block' }, { type: 'list', items: ['a', 'b'] }];
    expect(contentBodyToText(body)).toBe('first block a b');
    expect(contentBodyToText(null)).toBe('');
  });
});

describe('no public page queries content tables directly', () => {
  it('scans a non-trivial number of page sources', () => {
    expect(pageSources.length).toBeGreaterThan(50);
  });

  for (const table of CONTENT_TABLES) {
    it(`never queries ${table} from a public page`, () => {
      const offenders = pageSources.filter((f) => !isAdminPage(f) && readsTable(f, table));
      expect(offenders, `direct queries in: ${offenders.join(', ')}`).toEqual([]);
    });
  }

  for (const table of RETIRED_TABLES) {
    it(`no longer reads the retired ${table} table`, () => {
      const offenders = pageSources.filter((f) => !isAdminPage(f) && readsTable(f, table));
      expect(offenders, `retired reads in: ${offenders.join(', ')}`).toEqual([]);
    });
  }
});

describe('content data layer', () => {
  const api = stripComments(read('src/lib/contentApi.ts'));

  it('declares every Clean V1 content read', () => {
    for (const fn of [
      'fetchAuthors',
      'fetchAuthorById',
      'fetchCategories',
      'fetchPublishedEntries',
      'fetchEntryBySlug',
      'fetchRelatedEntries',
      'fetchCaseStudies',
      'fetchCaseStudyBySlug',
      'fetchProducts',
      'fetchProductBySlug',
    ]) {
      expect(api, `${fn} must exist`).toContain(`export async function ${fn}`);
    }
  });

  it('filters drafts explicitly on every status-bearing table', () => {
    // Localizations require both their own published status and a published
    // parent; the layer states that rather than relying on RLS alone.
    expect(api).toContain("PUBLISHED_STATUS = 'published'");
    expect(api.match(/PUBLISHED_STATUS/g)?.length ?? 0).toBeGreaterThan(5);
  });

  it('joins localizations with !inner so draft localizations are excluded', () => {
    for (const table of ['content_localizations', 'case_study_localizations', 'product_localizations']) {
      const inner = `localization:${table}!inner`;
      expect(api, `${table} must be an inner join`).toContain(inner);
    }
  });

  it('exposes one set of hooks built on a single query primitive', () => {
    const hooks = stripComments(read('src/hooks/useContent.ts'));
    for (const hook of [
      'useContentEntries',
      'useContentEntry',
      'useRelatedEntries',
      'useContentAuthors',
      'useContentCategories',
      'useCaseStudies',
      'useCaseStudy',
      'useProducts',
      'useProduct',
    ]) {
      expect(hooks, `${hook} must exist`).toContain(`export function ${hook}`);
    }
    // One shared query primitive, not one per hook: one definition plus one
    // call per exported hook (the three R1C7 fallback-aware variants included).
    expect(hooks.match(/useContentQuery</g)?.length ?? 0).toBeGreaterThanOrEqual(12);
  });

  it('distinguishes an empty result from a failure', () => {
    expect(api).toContain('class ContentUnavailableError');
  });

  it('resolves stored media paths through the shared storage boundary', () => {
    // R1C9: contentApi delegates to `./storage`, which owns the bucket.
    expect(api).toContain("from './storage'");
    const storage = read('src/lib/storage.ts');
    expect(storage).toContain("from(PUBLIC_MEDIA_BUCKET).getPublicUrl");
  });
});

describe('static content removal', () => {
  it('no longer imports the static blog and portfolio arrays', () => {
    const offenders = listSources(join(process.cwd(), 'src')).filter((file) =>
      /from ['"]@\/data\/(blog|portfolio)['"]/.test(read(file)),
    );
    expect(offenders, `static imports remain in: ${offenders.join(', ')}`).toEqual([]);
  });
});
