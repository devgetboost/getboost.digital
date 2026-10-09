/**
 * R1C6 Wave 4 — content hooks.
 *
 * One coherent pattern for every content read: resolve the market scope from
 * the active language, fetch through `./contentApi`, and expose
 * `{ data, loading, error }`. Pages never talk to Supabase directly.
 *
 * Empty and error are distinct on purpose: `data === null` means "nothing
 * published in this market yet" (render the empty state), `error` means the
 * read failed. A page must not substitute static content in either case.
 */

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { withFallback, withFallbackList, type FallbackResult } from '@/lib/contentFallback';
import {
  ContentUnavailableError,
  fetchAuthors,
  fetchCategories,
  fetchCaseStudies,
  fetchCaseStudyBySlug,
  fetchEntryBySlug,
  fetchProductBySlug,
  fetchProducts,
  fetchPublishedEntries,
  fetchRelatedEntries,
  scopeForLanguage,
  type CaseStudyView,
  type ContentAuthorView,
  type ContentCategoryView,
  type ContentEntryView,
  type ContentScope,
  type ContentType,
  type ProductView,
} from '@/lib/contentApi';

export interface ContentQuery<T> {
  data: T | null;
  loading: boolean;
  error: ContentUnavailableError | null;
}

function useContentQuery<T>(run: (scope: ContentScope) => Promise<T>, deps: unknown[]): ContentQuery<T> {
  const { i18n } = useTranslation();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ContentUnavailableError | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const result = await run(scopeForLanguage(i18n.language));
        if (active) setData(result);
      } catch (err) {
        if (!active) return;
        setData(null);
        setError(
          err instanceof ContentUnavailableError
            ? err
            : new ContentUnavailableError(err instanceof Error ? err.message : 'Erro inesperado.', err),
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language, ...deps]);

  return { data, loading, error };
}

/** Published entries (articles or guides) for the active market. */
export function useContentEntries(options: { contentType?: ContentType; limit?: number } = {}) {
  return useContentQuery<ContentEntryView[]>((scope) => fetchPublishedEntries(scope, options), [
    options.contentType,
    options.limit,
  ]);
}

/**
 * Published entries with the explicit R1C7 fallback chain.
 *
 * Returns the same list plus `fallback` and `resolvedMarket`, so a page can
 * show "not yet translated" instead of pretending cross-market content is
 * local. Pass `allowMarketFallback: false` to refuse other markets' content.
 */
export function useContentEntriesWithFallback(
  options: { contentType?: ContentType; limit?: number; allowMarketFallback?: boolean } = {},
) {
  const { data, loading, error } = useContentQuery<FallbackResult<ContentEntryView[]> | null>(
    (scope) =>
      withFallbackList(scope, (s) => fetchPublishedEntries(s, options), {
        allowMarketFallback: options.allowMarketFallback,
      }),
    [options.contentType, options.limit, options.allowMarketFallback],
  );
  return { entries: data?.data ?? [], fallback: data?.fallback ?? 'exact', resolvedMarket: data?.resolvedMarket, loading, error };
}

/** One published entry by slug or id. */
export function useContentEntry(slugOrId: string | undefined) {
  return useContentQuery<ContentEntryView | null>(
    (scope) => (slugOrId ? fetchEntryBySlug(scope, slugOrId) : Promise.resolve(null)),
    [slugOrId],
  );
}

/** Published entries related to a given entry. */
export function useRelatedEntries(entry: ContentEntryView | null, limit = 3) {
  return useContentQuery<ContentEntryView[]>(
    (scope) => (entry ? fetchRelatedEntries(scope, entry, limit) : Promise.resolve([])),
    [entry?.id],
  );
}

/** All editorial authors. */
export function useContentAuthors() {
  return useContentQuery<ContentAuthorView[]>(() => fetchAuthors(), []);
}

/** All categories with their active-market localization. */
export function useContentCategories() {
  return useContentQuery<ContentCategoryView[]>((scope) => fetchCategories(scope), []);
}

/** Published case studies for the active market. */
export function useCaseStudies(options: { limit?: number } = {}) {
  return useContentQuery<CaseStudyView[]>((scope) => fetchCaseStudies(scope, options), [options.limit]);
}

/** Case studies with the explicit R1C7 fallback chain. */
export function useCaseStudiesWithFallback(options: { limit?: number; allowMarketFallback?: boolean } = {}) {
  const { data, loading, error } = useContentQuery<FallbackResult<CaseStudyView[]> | null>((scope) =>
    withFallbackList(scope, (s) => fetchCaseStudies(s, options), {
      allowMarketFallback: options.allowMarketFallback,
    }),
    [options.limit, options.allowMarketFallback],
  );
  return { caseStudies: data?.data ?? [], fallback: data?.fallback ?? 'exact', resolvedMarket: data?.resolvedMarket, loading, error };
}

/** One published case study by slug or id. */
export function useCaseStudy(slugOrId: string | undefined) {
  return useContentQuery<CaseStudyView | null>(
    (scope) => (slugOrId ? fetchCaseStudyBySlug(scope, slugOrId) : Promise.resolve(null)),
    [slugOrId],
  );
}

/** Published products for the active market. */
export function useProducts(options: { limit?: number } = {}) {
  return useContentQuery<ProductView[]>((scope) => fetchProducts(scope, options), [options.limit]);
}

/** Products with the explicit R1C7 fallback chain. */
export function useProductsWithFallback(options: { limit?: number; allowMarketFallback?: boolean } = {}) {
  const { data, loading, error } = useContentQuery<FallbackResult<ProductView[]> | null>((scope) =>
    withFallbackList(scope, (s) => fetchProducts(s, options), {
      allowMarketFallback: options.allowMarketFallback,
    }),
    [options.limit, options.allowMarketFallback],
  );
  return { products: data?.data ?? [], fallback: data?.fallback ?? 'exact', resolvedMarket: data?.resolvedMarket, loading, error };
}

/** One published product by slug or id. */
export function useProduct(slugOrId: string | undefined) {
  return useContentQuery<ProductView | null>(
    (scope) => (slugOrId ? fetchProductBySlug(scope, slugOrId) : Promise.resolve(null)),
    [slugOrId],
  );
}

/**
 * Re-fetches on demand. Exposed as a stable callback so a "retry" button can
 * call it without re-mounting the page.
 */
export function useContentRefresh(refresh: () => Promise<void>) {
  return useCallback(() => {
    void refresh();
  }, [refresh]);
}
