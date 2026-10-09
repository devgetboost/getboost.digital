/**
 * R1C6 Wave 4 — content data access layer.
 *
 * The single place the browser reads the Clean V1 content tables. Before this
 * wave each page inlined its own `supabase.from(...)` call against legacy
 * tables (`blog_posts`, `projects`, `services`) that no longer exist in the
 * Clean V1 schema, plus a set of static arrays in `src/data/*`.
 *
 * Everything here is a **read**. The Clean V1 RLS policies expose published
 * rows to anonymous readers and nothing else, so the layer does not need a
 * write path — content administration is a separate wave.
 *
 * Contract notes that drive the shapes below:
 *  - Content is localized per market. `content_localizations`,
 *    `case_study_localizations` and `product_localizations` are unique on
 *    `(parent_id, market)` and on `(market, slug)`.
 *  - A localization is only anonymously visible when *it* is published **and**
 *    its parent is published. The layer therefore filters both explicitly
 *    instead of relying on RLS alone, so intent is visible and testable.
 *  - `content_authors`, `content_categories` and
 *    `content_category_localizations` have no `status` column and are
 *    unconditionally readable by RLS. They carry no draft concept, so no
 *    status filter applies.
 *  - `body` is a `jsonb` column holding block-based content, not the
 *    markdown/HTML string the old `blog_posts.content` held. See
 *    `./contentBody` for the adapter that renders it.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { MarketCode } from '@/config/env';
import { contentBodyToText } from './contentBody';
import { publicMediaUrl } from './storage';
import type { MarketScope } from './markets';

/**
 * R1C7: a content read is scoped by market, and the canonical locale follows
 * from the market. `MarketScope` is the authoritative definition in `./markets`.
 */
export type ContentScope = MarketScope;
export {
  MARKET_CODES,
  MARKET_HREFLANG,
  MARKET_LOCALE,
  MARKET_OG_LOCALE,
  MARKET_PATH_PREFIX,
  MARKET_UI_LANGUAGE,
  marketAlternates,
  marketForUiLanguage,
  parseMarketPath,
  toMarketPath,
  type MarketCode,
  type MarketScope,
} from './markets';

type Tables = Database['public']['Tables'];

type AuthorRow = Tables['content_authors']['Row'];
type CategoryRow = Tables['content_categories']['Row'];
type CategoryLocalizationRow = Tables['content_category_localizations']['Row'];
type EntryRow = Tables['content_entries']['Row'];
type EntryLocalizationRow = Tables['content_localizations']['Row'];
type CaseStudyRow = Tables['case_studies']['Row'];
type CaseStudyLocalizationRow = Tables['case_study_localizations']['Row'];
type ProductRow = Tables['products']['Row'];
type ProductLocalizationRow = Tables['product_localizations']['Row'];

/** Content types the entry table models. */
export type ContentType = 'insight' | 'guide';

/** Draft status shared by all localized and parent content tables. */
export const PUBLISHED_STATUS = 'published' as const;

// ---------------------------------------------------------------------------
// Market / locale resolution
// ---------------------------------------------------------------------------

/**
 * R1C7: market and locale resolution is delegated to `./markets`, the single
 * authoritative model. PT → pt-PT, BR → pt-BR, INTL → en. A locale is never
 * derived by assuming it equals the market.
 */
export {
  marketForLanguage,
  localeForLanguage,
  scopeForLanguage,
} from './markets';

// ---------------------------------------------------------------------------
// Page-facing view models
// ---------------------------------------------------------------------------

export interface ContentAuthorView {
  id: string;
  name: string;
  roleTitle: string | null;
  avatarPath: string | null;
  bio: string | null;
  socialLinks: Record<string, unknown>;
}

export interface ContentCategoryView {
  id: string;
  key: string;
  sortOrder: number;
  /** Localized fields, resolved for the requested scope. */
  name: string | null;
  slug: string | null;
  description: string | null;
}

export interface ContentEntryView {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  /** Block-based jsonb body. Render with `./contentBody`. */
  body: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImagePath: string | null;
  coverMediaPath: string | null;
  contentType: ContentType;
  market: MarketCode;
  locale: string;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: ContentAuthorView | null;
  category: ContentCategoryView | null;
}

export interface CaseStudyView {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  challenge: string | null;
  strategy: string | null;
  solution: string | null;
  results: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  market: MarketCode;
  locale: string;
  publishedAt: string | null;
  /** Parent (non-localized) fields. */
  clientName: string;
  industry: string | null;
  featured: boolean;
  capabilities: string[];
  technologies: string[];
  heroMediaPath: string | null;
}

export interface ProductView {
  id: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  market: MarketCode;
  locale: string;
  /** Parent (non-localized) fields. */
  name: string;
  websiteUrl: string | null;
  featured: boolean;
  logoPath: string | null;
  heroMediaPath: string | null;
  capabilities: string[];
}

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

function toAuthor(row: AuthorRow): ContentAuthorView {
  return {
    id: row.id,
    name: row.name,
    roleTitle: row.role_title,
    avatarPath: row.avatar_path,
    bio: row.bio,
    socialLinks: (row.social_links ?? {}) as Record<string, unknown>,
  };
}

function toCategory(row: CategoryRow, localization: CategoryLocalizationRow | null): ContentCategoryView {
  return {
    id: row.id,
    key: row.key,
    sortOrder: row.sort_order,
    name: localization?.name ?? null,
    slug: localization?.slug ?? null,
    description: localization?.description ?? null,
  };
}

/**
 * Shape returned by the embedded `content_localizations!inner(...)` select.
 *
 * PostgREST returns an embedded to-many relation as an array, so `localization`
 * arrives as `EntryLocalizationRow[]` even though `!inner` guarantees exactly one
 * row for the requested market. The mapper below normalises it.
 */
type EntryRowWithRelations = EntryRow & {
  localization?: EntryLocalizationRow[] | null;
  author?: AuthorRow | AuthorRow[] | null;
  category?: (CategoryRow & { localization?: CategoryLocalizationRow[] | null }) | Array<
    CategoryRow & { localization?: CategoryLocalizationRow[] | null }
  > | null;
};

function toEntry(row: EntryRowWithRelations): ContentEntryView {
  const localization = first(row.localization);
  const author = first(row.author);
  const category = first(row.category);
  const categoryLocalization = category ? first(category.localization) : null;

  return {
    id: row.id,
    slug: localization?.slug ?? row.id,
    title: localization?.title ?? '',
    excerpt: localization?.excerpt ?? null,
    body: localization?.body ?? null,
    seoTitle: localization?.seo_title ?? null,
    seoDescription: localization?.seo_description ?? null,
    ogImagePath: localization?.og_image_path ?? null,
    // Fall back to the parent cover when the localization has no OG image.
    coverMediaPath: localization?.og_image_path ?? row.cover_media_path,
    contentType: row.content_type,
    market: localization?.market ?? row.primary_market,
    locale: localization?.locale ?? '',
    featured: row.featured,
    publishedAt: localization?.published_at ?? row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: author ? toAuthor(author) : null,
    category: category ? toCategory(category, categoryLocalization) : null,
  };
}

/** PostgREST may return an embedded relation as a single row or a 1-element array. */
function first<T>(value: T | T[] | null | undefined): T | null {
  if (value === null || value === undefined) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function toCaseStudy(row: CaseStudyRow, localization: CaseStudyLocalizationRow): CaseStudyView {
  return {
    id: row.id,
    slug: localization.slug,
    title: localization.title,
    summary: localization.summary,
    challenge: localization.challenge,
    strategy: localization.strategy,
    solution: localization.solution,
    results: localization.results,
    seoTitle: localization.seo_title,
    seoDescription: localization.seo_description,
    market: localization.market,
    locale: localization.locale,
    publishedAt: localization.published_at ?? row.published_at,
    clientName: row.client_name,
    industry: row.industry,
    featured: row.featured,
    capabilities: row.capabilities ?? [],
    technologies: row.technologies ?? [],
    heroMediaPath: row.hero_media_path,
  };
}

function toProduct(row: ProductRow, localization: ProductLocalizationRow): ProductView {
  return {
    id: row.id,
    slug: localization.slug,
    tagline: localization.tagline,
    description: localization.description,
    seoTitle: localization.seo_title,
    seoDescription: localization.seo_description,
    market: localization.market,
    locale: localization.locale,
    name: row.name,
    websiteUrl: row.website_url,
    featured: row.featured,
    logoPath: row.logo_path,
    heroMediaPath: row.hero_media_path,
    capabilities: row.capabilities ?? [],
  };
}

// ---------------------------------------------------------------------------
// Media paths
// ---------------------------------------------------------------------------

/**
 * R1C9: resolves a stored media path to a public URL.
 *
 * Delegates to `./storage`, the single storage boundary. Absolute URLs pass
 * through so rows written before the migration keep rendering.
 */
export { publicMediaUrl as mediaUrl } from './storage';

/**
 * Estimated reading time for a body, in minutes.
 *
 * The legacy `blog_posts.read_time` column does not exist in Clean V1; reading
 * time is derived from the body at read time instead of being stored.
 */
export function estimateReadingMinutes(body: unknown, wordsPerMinute = 200): number {
  const words = contentBodyToText(body).split(' ').filter(Boolean).length;
  if (words === 0) return 1;
  return Math.max(1, Math.round(words / wordsPerMinute));
}

/**
 * Thrown when content is unavailable. Callers distinguish "not written yet"
 * (empty) from "broken" (transport/schema error) — a page must render its
 * empty state, never a fabricated fallback.
 */
export class ContentUnavailableError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ContentUnavailableError';
    this.cause = cause;
  }
}

/** Normalises a supabase result into either rows or a thrown error. */
function orThrow<T>(rows: T[] | null, error: { message: string } | null, what: string): T[] {
  if (error) throw new ContentUnavailableError(`${what}: ${error.message}`, error);
  return rows ?? [];
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

/** All editorial authors. No draft concept exists on this table. */
export async function fetchAuthors(): Promise<ContentAuthorView[]> {
  const { data, error } = await supabase
    .from('content_authors')
    .select('*')
    .order('name', { ascending: true });
  return orThrow(data as AuthorRow[] | null, error, 'authors').map(toAuthor);
}

/** One author by id, or null. */
export async function fetchAuthorById(id: string | null | undefined): Promise<ContentAuthorView | null> {
  if (!id) return null;
  const [author] = await fetchAuthors();
  return author && author.id === id ? author : null;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/**
 * All categories with their localizations for the requested market.
 *
 * Localizations have no status column, so a category whose localization for
 * this market has not been written resolves with `name === null` and the
 * caller decides whether to show it.
 */
export async function fetchCategories(scope: ContentScope): Promise<ContentCategoryView[]> {
  const { data, error } = await supabase
    .from('content_categories')
    .select('*, localization:content_category_localizations(*)')
    .eq('localization.market', scope.market)
    .order('sort_order', { ascending: true });

  const rows = orThrow(data, error, 'categories') as Array<
    CategoryRow & { localization?: CategoryLocalizationRow[] | null }
  >;
  return rows.map((row) => {
    const match = (row.localization ?? []).find((l) => l.market === scope.market) ?? null;
    return toCategory(row, match);
  });
}

// ---------------------------------------------------------------------------
// Entries (blog / resources)
// ---------------------------------------------------------------------------

const EntrySelect =
  '*, localization:content_localizations!inner(*), author:content_authors(*), category:content_categories(*, localization:content_category_localizations(*))';

/**
 * Published entries for a market, newest first.
 *
 * `contentType` narrows to `insight` (articles) or `guide` (resources); omit
 * it for both. The localization join is `!inner` so a published entry whose
 * localization for this market is missing or draft is simply not returned —
 * which is exactly the RLS rule, made explicit.
 */
export async function fetchPublishedEntries(
  scope: ContentScope,
  options: { contentType?: ContentType; limit?: number } = {},
): Promise<ContentEntryView[]> {
  let query = supabase
    .from('content_entries')
    .select(EntrySelect)
    .eq('status', PUBLISHED_STATUS)
    .eq('localization.market', scope.market)
    .eq('localization.status', PUBLISHED_STATUS)
    .order('published_at', { ascending: false, foreignTable: 'content_localizations' });

  if (options.contentType) query = query.eq('content_type', options.contentType);
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  const rows = orThrow(data, error, 'entries') as unknown as EntryRowWithRelations[];
  return rows.map(toEntry);
}

/**
 * One published entry by slug for a market.
 *
 * The route keeps the historical `:id` parameter name, but the value is a slug:
 * Clean V1 keys localized content by `(market, slug)`, and the SEO URLs already
 * published in the sitemap use slugs. A raw uuid is still accepted as a
 * fallback so old links keep resolving.
 */
export async function fetchEntryBySlug(scope: ContentScope, slugOrId: string): Promise<ContentEntryView | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const column = isUuid ? 'id' : 'localization.slug';

  const { data, error } = await supabase
    .from('content_entries')
    .select(EntrySelect)
    .eq('status', PUBLISHED_STATUS)
    .eq('localization.status', PUBLISHED_STATUS)
    .eq(column, slugOrId)
    .maybeSingle();

  if (error) throw new ContentUnavailableError(`entry: ${error.message}`, error);
  if (!data) return null;

  const row = data as unknown as EntryRowWithRelations;
  const entry = toEntry(row);
  // A uuid lookup can land on an entry whose published localization is for a
  // different market; treat that as "not in this market".
  if (isUuid && entry.market !== scope.market) return null;
  return entry;
}

/** Published entries sharing a category, excluding the given entry. */
export async function fetchRelatedEntries(
  scope: ContentScope,
  entry: ContentEntryView,
  limit = 3,
): Promise<ContentEntryView[]> {
  if (!entry.category) return [];
  const entries = await fetchPublishedEntries(scope, { contentType: entry.contentType, limit: limit + 1 });
  return entries.filter((e) => e.id !== entry.id).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Case studies
// ---------------------------------------------------------------------------

const CaseSelect =
  '*, localization:case_study_localizations!inner(*)';

/** Published case studies for a market, newest first. */
export async function fetchCaseStudies(
  scope: ContentScope,
  options: { limit?: number } = {},
): Promise<CaseStudyView[]> {
  let query = supabase
    .from('case_studies')
    .select(CaseSelect)
    .eq('status', PUBLISHED_STATUS)
    .eq('localization.market', scope.market)
    .eq('localization.status', PUBLISHED_STATUS)
    .order('published_at', { ascending: false, foreignTable: 'case_study_localizations' });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  const rows = orThrow(data, error, 'case studies') as Array<
    CaseStudyRow & { localization?: CaseStudyLocalizationRow[] | null }
  >;
  return rows
    .map((row) => {
      const l = (row.localization ?? []).find((x) => x.market === scope.market) ?? null;
      return l ? toCaseStudy(row, l) : null;
    })
    .filter((v): v is CaseStudyView => v !== null);
}

/** One published case study by slug for a market. */
export async function fetchCaseStudyBySlug(scope: ContentScope, slugOrId: string): Promise<CaseStudyView | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const column = isUuid ? 'id' : 'localization.slug';

  const { data, error } = await supabase
    .from('case_studies')
    .select(CaseSelect)
    .eq('status', PUBLISHED_STATUS)
    .eq('localization.status', PUBLISHED_STATUS)
    .eq(column, slugOrId)
    .maybeSingle();

  if (error) throw new ContentUnavailableError(`case study: ${error.message}`, error);
  if (!data) return null;

  const row = data as CaseStudyRow & { localization?: CaseStudyLocalizationRow[] };
  const l = (row.localization ?? []).find((x) => x.market === scope.market) ?? null;
  if (!l) return null;
  const study = toCaseStudy(row, l);
  if (isUuid && study.market !== scope.market) return null;
  return study;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

const ProductSelect = '*, localization:product_localizations!inner(*)';

/** Published products for a market, ordered by featured then name. */
export async function fetchProducts(
  scope: ContentScope,
  options: { limit?: number } = {},
): Promise<ProductView[]> {
  let query = supabase
    .from('products')
    .select(ProductSelect)
    .eq('status', PUBLISHED_STATUS)
    .eq('localization.market', scope.market)
    .eq('localization.status', PUBLISHED_STATUS)
    .order('featured', { ascending: false });
  if (options.limit) query = query.limit(options.limit);

  const { data, error } = await query;
  const rows = orThrow(data, error, 'products') as Array<
    ProductRow & { localization?: ProductLocalizationRow[] | null }
  >;
  return rows
    .map((row) => {
      const l = (row.localization ?? []).find((x) => x.market === scope.market) ?? null;
      return l ? toProduct(row, l) : null;
    })
    .filter((v): v is ProductView => v !== null);
}

/** One published product by slug for a market. */
export async function fetchProductBySlug(scope: ContentScope, slugOrId: string): Promise<ProductView | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
  const column = isUuid ? 'id' : 'localization.slug';

  const { data, error } = await supabase
    .from('products')
    .select(ProductSelect)
    .eq('status', PUBLISHED_STATUS)
    .eq('localization.status', PUBLISHED_STATUS)
    .eq(column, slugOrId)
    .maybeSingle();

  if (error) throw new ContentUnavailableError(`product: ${error.message}`, error);
  if (!data) return null;

  const row = data as ProductRow & { localization?: ProductLocalizationRow[] };
  const l = (row.localization ?? []).find((x) => x.market === scope.market) ?? null;
  if (!l) return null;
  const product = toProduct(row, l);
  if (isUuid && product.market !== scope.market) return null;
  return product;
}
