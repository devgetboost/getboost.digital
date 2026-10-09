/**
 * R1C8 Wave 6 — shared admin content data layer.
 *
 * Every admin CRUD surface reads and writes the Clean V1 tables through this
 * module. No admin page queries `blog_posts`, `projects`, `services`,
 * `blog_categories` or `resources` any more — those tables are retired and
 * their contracts live only in `legacy-compat.ts` until the tables are
 * dropped.
 *
 * Design rules:
 *  - Admin writes run through the authenticated browser client. That is
 *    sanctioned: every Clean V1 content policy grants `all` to `authenticated`
 *    users holding the admin role, and denies anonymous access entirely.
 *  - `status` lives on BOTH parents and localizations, and the public read
 *    path requires both to be `published`. Every publish/unpublish helper in
 *    this module therefore sets both, so the two can never disagree.
 *  - Deleting a parent cascades to its localizations at the database level
 *    (`on delete cascade`), so delete helpers only delete the parent.
 *  - Slugs are unique per `(market, slug)` at the database level. Helpers
 *    surface the 23505 violation as a readable error instead of guessing.
 *  - After every successful mutation the caller should fire `logAdminAction`
 *    (fire-and-forget). It never throws, so auditing can never break saving.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database, Json } from '@/integrations/supabase/types';
import { MARKETS, type MarketCode } from '@/config/env';

export type { MarketCode };

type Tables = Database['public']['Tables'];

export type EntryRow = Tables['content_entries']['Row'];
export type EntryLocalizationRow = Tables['content_localizations']['Row'];
export type AuthorRow = Tables['content_authors']['Row'];
export type CategoryRow = Tables['content_categories']['Row'];
export type CategoryLocalizationRow = Tables['content_category_localizations']['Row'];
export type CaseStudyRow = Tables['case_studies']['Row'];
export type CaseStudyLocalizationRow = Tables['case_study_localizations']['Row'];
export type ProductRow = Tables['products']['Row'];
export type ProductLocalizationRow = Tables['product_localizations']['Row'];
export type LeadRow = Tables['leads']['Row'];
export type BookingRow = Tables['bookings']['Row'];
export type SubscriberRow = Tables['newsletter_subscribers']['Row'];

export type ContentStatus = 'draft' | 'published' | 'archived';
export type LeadStatus = LeadRow['status'];
export type BookingStatus = BookingRow['status'];
export type SubscriberStatus = SubscriberRow['status'];

export const CONTENT_STATUSES: readonly ContentStatus[] = ['draft', 'published', 'archived'];

export const STATUS_LABELS: Record<ContentStatus, string> = {
  draft: 'Rascunho',
  published: 'Publicado',
  archived: 'Arquivado',
};

export const LEAD_STATUSES: readonly LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'closed',
  'spam',
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  converted: 'Convertido',
  closed: 'Fechado',
  spam: 'Spam',
};

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  'requested',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  requested: 'Pedido',
  confirmed: 'Confirmada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  no_show: 'Falta',
};

export const SUBSCRIBER_STATUSES: readonly SubscriberStatus[] = [
  'subscribed',
  'unsubscribed',
  'bounced',
];

export const SUBSCRIBER_STATUS_LABELS: Record<SubscriberStatus, string> = {
  subscribed: 'Subscrito',
  unsubscribed: 'Cancelado',
  bounced: 'Rejeitado',
};

export const ADMIN_MARKETS: readonly MarketCode[] = MARKETS;

export const MARKET_LABELS: Record<MarketCode, string> = {
  PT: 'Portugal',
  BR: 'Brasil',
  INTL: 'Internacional',
};

export class AdminContentError extends Error {
  readonly code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'AdminContentError';
    this.code = code;
  }
}

/** Normalises a title into a URL slug. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120);
}

/** Converts an admin-entered year into a `published_at` instant. */
function yearToPublishedAt(year: string | null | undefined): string | undefined {
  if (!year) return undefined;
  const parsed = Number.parseInt(year.trim(), 10);
  if (!Number.isFinite(parsed) || parsed < 1900 || parsed > 2100) return undefined;
  return `${parsed}-01-01T00:00:00.000Z`;
}

function isUniqueViolation(error: { code?: string } | null): boolean {
  return !!error && error.code === '23505';
}

function uniqueSlugMessage(market: MarketCode): string {
  return `Já existe conteúdo com este slug no mercado ${market}. Escolhe outro slug.`;
}

function throwIfError(error: { message: string; code?: string } | null, market?: MarketCode): void {
  if (!error) return;
  if (market && isUniqueViolation(error)) {
    throw new AdminContentError(uniqueSlugMessage(market), error.code);
  }
  throw new AdminContentError(error.message, error.code);
}

/** A row joined with its localizations, as returned by the list helpers. */
export interface EntryWithLocalizations {
  entry: EntryRow;
  localizations: EntryLocalizationRow[];
  author: AuthorRow | null;
  category: (CategoryRow & { localization?: CategoryLocalizationRow | null }) | null;
}

const ENTRY_SELECT =
  '*, localizations:content_localizations(*), author:content_authors(*), category:content_categories(*, localization:content_category_localizations(*))';

/** All entries of a type, with every localization (drafts included — this is admin). */
export async function listEntries(contentType: 'insight' | 'guide'): Promise<EntryWithLocalizations[]> {
  const { data, error } = await supabase
    .from('content_entries')
    .select(ENTRY_SELECT)
    .eq('content_type', contentType)
    .order('updated_at', { ascending: false });

  if (error) throw new AdminContentError(error.message, error.code);
  return ((data ?? []) as unknown as EntryWithLocalizations[]).map((row) => ({
    ...row,
    localizations: Array.isArray(row.localizations) ? row.localizations : [],
  }));
}

/** One entry with every localization, or null. */
export async function getEntry(id: string): Promise<EntryWithLocalizations | null> {
  const { data, error } = await supabase
    .from('content_entries')
    .select(ENTRY_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new AdminContentError(error.message, error.code);
  if (!data) return null;
  const row = data as unknown as EntryWithLocalizations;
  return { ...row, localizations: Array.isArray(row.localizations) ? row.localizations : [] };
}

export interface EntryInput {
  content_type: 'insight' | 'guide';
  primary_market: MarketCode;
  author_id: string | null;
  category_id: string | null;
  cover_media_path: string | null;
  featured: boolean;
  status: ContentStatus;
}

export interface EntryLocalizationInput {
  market: MarketCode;
  locale: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: unknown;
  seo_title: string | null;
  seo_description: string | null;
  og_image_path: string | null;
  status: ContentStatus;
}

/** Creates an entry with its first localization. Sets both to the same status. */
export async function createEntryWithLocalization(
  entry: EntryInput,
  localization: EntryLocalizationInput,
): Promise<{ entry: EntryRow; localization: EntryLocalizationRow }> {
  const { data: created, error: entryError } = await supabase
    .from('content_entries')
    .insert({
      content_type: entry.content_type,
      primary_market: entry.primary_market,
      author_id: entry.author_id,
      category_id: entry.category_id,
      cover_media_path: entry.cover_media_path,
      featured: entry.featured,
      status: localization.status,
    })
    .select('*')
    .single();

  throwIfError(entryError);
  if (!created) throw new AdminContentError('Não foi possível criar o conteúdo.');

  const { data: loc, error: locError } = await supabase
    .from('content_localizations')
    .insert({
      entry_id: (created as EntryRow).id,
      market: localization.market,
      locale: localization.locale,
      title: localization.title,
      slug: localization.slug,
      excerpt: localization.excerpt,
      body: localization.body as never,
      seo_title: localization.seo_title,
      seo_description: localization.seo_description,
      og_image_path: localization.og_image_path,
      status: localization.status,
    })
    .select('*')
    .single();

  if (locError) {
    // Roll back the orphaned parent so a failed slug never leaves a husk.
    await supabase.from('content_entries').delete().eq('id', (created as EntryRow).id);
    throwIfError(locError, localization.market);
  }
  if (!loc) throw new AdminContentError('Não foi possível criar a localização.');

  return { entry: created as EntryRow, localization: loc as EntryLocalizationRow };
}

/**
 * Updates an entry and upserts its localization for one market.
 *
 * `published_at` is stamped server-side (now) the first time a localization is
 * published, and left alone afterwards — the database never derives it.
 */
export async function saveEntryWithLocalization(
  entryId: string,
  entry: Partial<Omit<EntryInput, 'content_type' | 'primary_market'>> & { status: ContentStatus },
  localization: EntryLocalizationInput,
): Promise<EntryLocalizationRow> {
  const { error: entryError } = await supabase
    .from('content_entries')
    .update({
      author_id: entry.author_id ?? null,
      category_id: entry.category_id ?? null,
      cover_media_path: entry.cover_media_path ?? null,
      featured: entry.featured,
      status: entry.status,
    })
    .eq('id', entryId);

  throwIfError(entryError);

  const { data: existing } = await supabase
    .from('content_localizations')
    .select('id, published_at, status')
    .eq('entry_id', entryId)
    .eq('market', localization.market)
    .maybeSingle();

  const shouldStampPublishedAt =
    localization.status === 'published' && existing?.published_at == null;

  const payload = {
    entry_id: entryId,
    market: localization.market,
    locale: localization.locale,
    title: localization.title,
    slug: localization.slug,
    excerpt: localization.excerpt,
    body: localization.body as never,
    seo_title: localization.seo_title,
    seo_description: localization.seo_description,
    og_image_path: localization.og_image_path,
    status: localization.status,
    ...(shouldStampPublishedAt ? { published_at: new Date().toISOString() } : {}),
  };

  if (existing) {
    const { data, error } = await supabase
      .from('content_localizations')
      .update(payload)
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .single();
    throwIfError(error, localization.market);
    if (!data) throw new AdminContentError('Não foi possível guardar a localização.');
    return data as EntryLocalizationRow;
  }

  const { data, error } = await supabase
    .from('content_localizations')
    .insert(payload)
    .select('*')
    .single();
  throwIfError(error, localization.market);
  if (!data) throw new AdminContentError('Não foi possível criar a localização.');
  return data as EntryLocalizationRow;
}

/** Deletes an entry. Localizations cascade at the database level. */
export async function deleteEntry(entryId: string): Promise<void> {
  const { error } = await supabase.from('content_entries').delete().eq('id', entryId);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Authors
// ---------------------------------------------------------------------------

export async function listAuthors(): Promise<AuthorRow[]> {
  const { data, error } = await supabase
    .from('content_authors')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new AdminContentError(error.message, error.code);
  return (data ?? []) as AuthorRow[];
}

export interface AuthorInput {
  name: string;
  role_title: string | null;
  avatar_path: string | null;
  bio: string | null;
}

export async function createAuthor(input: AuthorInput): Promise<AuthorRow> {
  const { data, error } = await supabase.from('content_authors').insert(input).select('*').single();
  throwIfError(error);
  if (!data) throw new AdminContentError('Não foi possível criar o autor.');
  return data as AuthorRow;
}

export async function updateAuthor(id: string, input: AuthorInput): Promise<void> {
  const { error } = await supabase.from('content_authors').update(input).eq('id', id);
  throwIfError(error);
}

export async function deleteAuthor(id: string): Promise<void> {
  const { error } = await supabase.from('content_authors').delete().eq('id', id);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export interface CategoryWithLocalizations {
  category: CategoryRow;
  localizations: CategoryLocalizationRow[];
}

/** All categories with every localization (all markets — this is admin). */
export async function listCategories(): Promise<CategoryWithLocalizations[]> {
  const { data, error } = await supabase
    .from('content_categories')
    .select('*, localizations:content_category_localizations(*)')
    .order('sort_order', { ascending: true });

  if (error) throw new AdminContentError(error.message, error.code);
  return ((data ?? []) as unknown as CategoryWithLocalizations[]).map((row) => ({
    ...row,
    localizations: Array.isArray(row.localizations) ? row.localizations : [],
  }));
}

export interface CategoryInput {
  key: string;
  sort_order: number;
}

export interface CategoryLocalizationInput {
  market: MarketCode;
  locale: string;
  name: string;
  slug: string;
  description: string | null;
}

/** Creates a category with its first localization. */
export async function createCategoryWithLocalization(
  category: CategoryInput,
  localization: CategoryLocalizationInput,
): Promise<{ category: CategoryRow; localization: CategoryLocalizationRow }> {
  const { data: created, error: catError } = await supabase
    .from('content_categories')
    .insert(category)
    .select('*')
    .single();

  throwIfError(catError);
  if (!created) throw new AdminContentError('Não foi possível criar a categoria.');

  const { data: loc, error: locError } = await supabase
    .from('content_category_localizations')
    .insert({ ...localization, category_id: (created as CategoryRow).id })
    .select('*')
    .single();

  if (locError) {
    await supabase.from('content_categories').delete().eq('id', (created as CategoryRow).id);
    throwIfError(locError, localization.market);
  }
  if (!loc) throw new AdminContentError('Não foi possível criar a localização.');

  return { category: created as CategoryRow, localization: loc as CategoryLocalizationRow };
}

/** Updates a category and upserts one localization. */
export async function saveCategoryWithLocalization(
  categoryId: string,
  category: CategoryInput,
  localization: CategoryLocalizationInput,
): Promise<void> {
  const { error: catError } = await supabase
    .from('content_categories')
    .update(category)
    .eq('id', categoryId);
  throwIfError(catError);

  const { data: existing } = await supabase
    .from('content_category_localizations')
    .select('id')
    .eq('category_id', categoryId)
    .eq('market', localization.market)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('content_category_localizations')
      .update({ ...localization })
      .eq('id', (existing as { id: string }).id);
    throwIfError(error, localization.market);
    return;
  }

  const { error } = await supabase
    .from('content_category_localizations')
    .insert({ ...localization, category_id: categoryId });
  throwIfError(error, localization.market);
}

/** Deletes a category. Localizations cascade; referencing entries are set null. */
export async function deleteCategory(categoryId: string): Promise<void> {
  const { error } = await supabase.from('content_categories').delete().eq('id', categoryId);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Case studies
// ---------------------------------------------------------------------------

export interface CaseStudyWithLocalizations {
  study: CaseStudyRow;
  localizations: CaseStudyLocalizationRow[];
}

const CASE_SELECT = '*, localizations:case_study_localizations(*)';

export async function listCaseStudies(): Promise<CaseStudyWithLocalizations[]> {
  const { data, error } = await supabase
    .from('case_studies')
    .select(CASE_SELECT)
    .order('updated_at', { ascending: false });

  if (error) throw new AdminContentError(error.message, error.code);
  return ((data ?? []) as unknown as CaseStudyWithLocalizations[]).map((row) => ({
    ...row,
    localizations: Array.isArray(row.localizations) ? row.localizations : [],
  }));
}

export interface CaseStudyInput {
  client_name: string;
  industry: string | null;
  featured: boolean;
  capabilities: string[];
  technologies: string[];
  hero_media_path: string | null;
  status: ContentStatus;
  /**
   * Optional display year. When set, `published_at` is stamped to 1 January of
   * that year — Clean V1 has no year column, and the public page derives the
   * year from `published_at`.
   */
  year?: string | null;
}

export interface CaseStudyLocalizationInput {
  market: MarketCode;
  locale: string;
  title: string;
  slug: string;
  summary: string | null;
  challenge: string | null;
  strategy: string | null;
  solution: string | null;
  results: unknown;
  seo_title: string | null;
  seo_description: string | null;
  status: ContentStatus;
}

export async function createCaseStudyWithLocalization(
  study: CaseStudyInput,
  localization: CaseStudyLocalizationInput,
): Promise<{ study: CaseStudyRow; localization: CaseStudyLocalizationRow }> {
  const { year: _year, ...rest } = study;
  const { data: created, error: studyError } = await supabase
    .from('case_studies')
    .insert({
      ...rest,
      status: localization.status,
      published_at: yearToPublishedAt(study.year),
    })
    .select('*')
    .single();

  throwIfError(studyError);
  if (!created) throw new AdminContentError('Não foi possível criar o caso.');

  const { data: loc, error: locError } = await supabase
    .from('case_study_localizations')
    .insert({
      ...localization,
      case_study_id: (created as CaseStudyRow).id,
      results: (localization.results ?? []) as never,
    })
    .select('*')
    .single();

  if (locError) {
    await supabase.from('case_studies').delete().eq('id', (created as CaseStudyRow).id);
    throwIfError(locError, localization.market);
  }
  if (!loc) throw new AdminContentError('Não foi possível criar a localização.');

  return { study: created as CaseStudyRow, localization: loc as CaseStudyLocalizationRow };
}

export async function saveCaseStudyWithLocalization(
  studyId: string,
  study: Omit<CaseStudyInput, 'status'> & { status: ContentStatus },
  localization: CaseStudyLocalizationInput,
): Promise<CaseStudyLocalizationRow> {
  const { year: _year, ...rest } = study;
  const { error: studyError } = await supabase
    .from('case_studies')
    .update({ ...rest, published_at: yearToPublishedAt(study.year) })
    .eq('id', studyId);
  throwIfError(studyError);

  const { data: existing } = await supabase
    .from('case_study_localizations')
    .select('id, published_at')
    .eq('case_study_id', studyId)
    .eq('market', localization.market)
    .maybeSingle();

  const payload = {
    ...localization,
    case_study_id: studyId,
    results: (localization.results ?? []) as never,
    ...(
      localization.status === 'published' && (existing as { published_at: string | null } | null)?.published_at == null
        ? { published_at: new Date().toISOString() }
        : {}
    ),
  };

  if (existing) {
    const { data, error } = await supabase
      .from('case_study_localizations')
      .update(payload)
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .single();
    throwIfError(error, localization.market);
    if (!data) throw new AdminContentError('Não foi possível guardar a localização.');
    return data as CaseStudyLocalizationRow;
  }

  const { data, error } = await supabase
    .from('case_study_localizations')
    .insert(payload)
    .select('*')
    .single();
  throwIfError(error, localization.market);
  if (!data) throw new AdminContentError('Não foi possível criar a localização.');
  return data as CaseStudyLocalizationRow;
}

export async function deleteCaseStudy(studyId: string): Promise<void> {
  const { error } = await supabase.from('case_studies').delete().eq('id', studyId);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface ProductWithLocalizations {
  product: ProductRow;
  localizations: ProductLocalizationRow[];
}

const PRODUCT_SELECT = '*, localizations:product_localizations(*)';

export async function listProducts(): Promise<ProductWithLocalizations[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .order('updated_at', { ascending: false });

  if (error) throw new AdminContentError(error.message, error.code);
  return ((data ?? []) as unknown as ProductWithLocalizations[]).map((row) => ({
    ...row,
    localizations: Array.isArray(row.localizations) ? row.localizations : [],
  }));
}

export interface ProductInput {
  name: string;
  website_url: string | null;
  featured: boolean;
  logo_path: string | null;
  hero_media_path: string | null;
  capabilities: string[];
  status: ContentStatus;
}

export interface ProductLocalizationInput {
  market: MarketCode;
  locale: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: ContentStatus;
}

export async function createProductWithLocalization(
  product: ProductInput,
  localization: ProductLocalizationInput,
): Promise<{ product: ProductRow; localization: ProductLocalizationRow }> {
  const { data: created, error: productError } = await supabase
    .from('products')
    .insert({ ...product, status: localization.status })
    .select('*')
    .single();

  throwIfError(productError);
  if (!created) throw new AdminContentError('Não foi possível criar o produto.');

  const { data: loc, error: locError } = await supabase
    .from('product_localizations')
    .insert({ ...localization, product_id: (created as ProductRow).id })
    .select('*')
    .single();

  if (locError) {
    await supabase.from('products').delete().eq('id', (created as ProductRow).id);
    throwIfError(locError, localization.market);
  }
  if (!loc) throw new AdminContentError('Não foi possível criar a localização.');

  return { product: created as ProductRow, localization: loc as ProductLocalizationRow };
}

export async function saveProductWithLocalization(
  productId: string,
  product: Omit<ProductInput, 'status'> & { status: ContentStatus },
  localization: ProductLocalizationInput,
): Promise<ProductLocalizationRow> {
  const { error: productError } = await supabase
    .from('products')
    .update({ ...product })
    .eq('id', productId);
  throwIfError(productError);

  const { data: existing } = await supabase
    .from('product_localizations')
    .select('id')
    .eq('product_id', productId)
    .eq('market', localization.market)
    .maybeSingle();

  const payload = { ...localization, product_id: productId };

  if (existing) {
    const { data, error } = await supabase
      .from('product_localizations')
      .update(payload)
      .eq('id', (existing as { id: string }).id)
      .select('*')
      .single();
    throwIfError(error, localization.market);
    if (!data) throw new AdminContentError('Não foi possível guardar a localização.');
    return data as ProductLocalizationRow;
  }

  const { data, error } = await supabase
    .from('product_localizations')
    .insert(payload)
    .select('*')
    .single();
  throwIfError(error, localization.market);
  if (!data) throw new AdminContentError('Não foi possível criar a localização.');
  return data as ProductLocalizationRow;
}

export async function deleteProduct(productId: string): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', productId);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Commercial reads
// ---------------------------------------------------------------------------

export interface LeadAdminRow extends LeadRow {
  /** Retired display fields, read from `metadata.legacy` when present. */
  legacyService: string | null;
  legacyBudget: string | null;
  legacyTimeline: string | null;
  legacyWebsite: string | null;
  legacyResourceName: string | null;
  legacyNotes: string | null;
  adminNotes: string | null;
}

function legacyOf(metadata: unknown, key: string): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null;
  const legacy = (metadata as Record<string, unknown>).legacy;
  if (typeof legacy !== 'object' || legacy === null) return null;
  const value = (legacy as Record<string, unknown>)[key];
  return typeof value === 'string' ? value : null;
}

function adminNotesOf(metadata: unknown): string | null {
  if (typeof metadata !== 'object' || metadata === null) return null;
  const value = (metadata as Record<string, unknown>).admin_notes;
  return typeof value === 'string' ? value : null;
}

/** All leads, newest first, with legacy display fields resolved from metadata. */
export async function listLeads(limit = 500): Promise<LeadAdminRow[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new AdminContentError(error.message, error.code);
  return ((data ?? []) as LeadRow[]).map((row) => ({
    ...row,
    legacyService: row.service_interest ?? legacyOf(row.metadata, 'service'),
    legacyBudget: legacyOf(row.metadata, 'budget'),
    legacyTimeline: legacyOf(row.metadata, 'timeline'),
    legacyWebsite: legacyOf(row.metadata, 'website'),
    legacyResourceName: legacyOf(row.metadata, 'resource_name'),
    legacyNotes: legacyOf(row.metadata, 'notes'),
    adminNotes: adminNotesOf(row.metadata),
  }));
}

/** Updates a lead's lifecycle status. Only Clean V1 statuses are accepted. */
export async function updateLeadStatus(leadId: string, status: LeadStatus): Promise<void> {
  const { error } = await supabase.from('leads').update({ status }).eq('id', leadId);
  throwIfError(error);
}

/** Persists internal admin notes without touching the visitor's message. */
export async function saveLeadAdminNotes(leadId: string, notes: string): Promise<void> {
  const { data, error } = await supabase
    .from('leads')
    .select('metadata')
    .eq('id', leadId)
    .maybeSingle();

  if (error) throw new AdminContentError(error.message, error.code);
  const metadata = { ...(((data as { metadata: unknown } | null)?.metadata ?? {}) as Record<string, unknown>) };
  if (notes.trim()) metadata.admin_notes = notes;
  else delete metadata.admin_notes;

  const { error: updateError } = await supabase
    .from('leads')
    .update({ metadata: metadata as Json })
    .eq('id', leadId);
  throwIfError(updateError);
}

export async function deleteLead(leadId: string): Promise<void> {
  const { error } = await supabase.from('leads').delete().eq('id', leadId);
  throwIfError(error);
}

/**
 * R1C8: `public.bookings` carries no `metadata` column, so there is nowhere to
 * resolve retired meeting fields (jitsi room, meeting link, meeting type, phone,
 * website, challenges) from. The confirmation email sent at booking time is the
 * only record of the meeting link. Admin surfaces therefore render the native
 * columns only.
 */
export type BookingAdminRow = BookingRow;

/** All bookings, newest first. */
export async function listBookings(limit = 500): Promise<BookingAdminRow[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new AdminContentError(error.message, error.code);
  return (data ?? []) as BookingRow[];
}

export async function getBooking(bookingId: string): Promise<BookingAdminRow | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();

  if (error) throw new AdminContentError(error.message, error.code);
  if (!data) return null;
  return data as BookingRow;
}

/** Updates a booking's lifecycle status. Only Clean V1 statuses are accepted. */
export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId);
  throwIfError(error);
}

export async function deleteBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.from('bookings').delete().eq('id', bookingId);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Newsletter reads
// ---------------------------------------------------------------------------

/** All subscribers, newest first. */
export async function listSubscribers(limit = 1000): Promise<SubscriberRow[]> {
  const { data, error } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new AdminContentError(error.message, error.code);
  return (data ?? []) as SubscriberRow[];
}

export async function deleteSubscriber(subscriberId: string): Promise<void> {
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', subscriberId);
  throwIfError(error);
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  occurred_at: string;
  metadata: Record<string, unknown>;
}

/** Recent audit entries for one entity, newest first. Admins can read this table. */
export async function listAuditForEntity(entity: string, entityId: string, limit = 50): Promise<AuditLogRow[]> {
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('entity', entity)
    .eq('entity_id', entityId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) throw new AdminContentError(error.message, error.code);
  return ((data ?? []) as unknown as AuditLogRow[]).map((row) => ({
    ...row,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
  }));
}

/**
 * Records an admin action in `admin_audit_log`.
 *
 * The browser cannot write this table (RLS grants admins SELECT only), so the
 * write goes through the `admin-audit` Edge Function, which holds the service
 * key and re-verifies the caller's admin role. This helper never throws: an
 * audit failure must never break the action it describes.
 */
export async function logAdminAction(
  action: string,
  entity: string,
  entityId?: string | null,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('admin-audit', {
      body: { action, entity, entity_id: entityId ?? null, metadata: metadata ?? {} },
    });
    if (error) console.error('admin-audit failed:', error.message);
  } catch (err) {
    console.error('admin-audit failed:', err instanceof Error ? err.message : err);
  }
}

// ---------------------------------------------------------------------------
// Storage
// ---------------------------------------------------------------------------

/**
 * R1C9: storage lives behind `./storage`, the single storage boundary. These
 * re-exports keep existing admin imports working.
 */
export {
  PUBLIC_MEDIA_BUCKET,
  uploadPublicImage as uploadPublicMedia,
  StorageUploadError as AdminStorageError,
} from './storage';
