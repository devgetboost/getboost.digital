/**
 * R1C7 Wave 5 — explicit content fallback rules.
 *
 * A market must never silently receive another market's content, and a market
 * with nothing published must never look like an error. This module makes the
 * chain explicit and observable:
 *
 *   1. `exact`   — a localization exists for (market, locale)
 *   2. `locale`  — the market has content, but not in this locale; the market's
 *                  canonical locale is used instead (e.g. a BR entry with no
 *                  pt-BR locale tag falls back to the BR market's canonical)
 *   3. `default` — the market has nothing published at all; the default market
 *                  (PT) supplies the row and the caller is told so it can
 *                  surface "not yet localised" rather than pretend it is local
 *
 * No step is silent: every result carries the rule that produced it.
 */

import { DEFAULT_MARKET, MARKET_LOCALE, type MarketCode, type MarketScope } from './markets';

/** Alias kept for readability: content reads are scoped by market. */
type ContentScope = MarketScope;

/** How a row was found. */
export type ContentFallback = 'exact' | 'locale' | 'default';

/** A content result plus the rule that produced it. */
export interface FallbackResult<T> {
  data: T;
  fallback: ContentFallback;
  /** The market the row actually came from. */
  resolvedMarket: MarketCode;
}

/** Scope widened with the explicit fallback decision. */
export interface FallbackScope extends ContentScope {
  /** Set when the row did not come from the requested market. */
  allowMarketFallback?: boolean;
}

/**
 * Applies the fallback chain to a single lookup.
 *
 * `load` is called with a scope; the first scope that yields a row wins. The
 * returned `fallback` records which step succeeded.
 */
export async function withFallback<T>(
  scope: ContentScope,
  load: (scope: ContentScope) => Promise<T | null>,
  options: { allowMarketFallback?: boolean } = {},
): Promise<FallbackResult<T> | null> {
  const exact = await load(scope);
  if (exact) {
    return { data: exact, fallback: 'exact', resolvedMarket: scope.market };
  }

  // Same market, canonical locale. `scope.locale` is already the market's
  // canonical locale, so this step only matters when a caller passes a
  // non-canonical locale (e.g. `es` inside INTL).
  if (scope.locale !== MARKET_LOCALE[scope.market]) {
    const canonical = await load({ ...scope, locale: MARKET_LOCALE[scope.market] });
    if (canonical) {
      return { data: canonical, fallback: 'locale', resolvedMarket: scope.market };
    }
  }

  if (!options.allowMarketFallback || scope.market === DEFAULT_MARKET) return null;

  const fromDefault = await load({ market: DEFAULT_MARKET, locale: MARKET_LOCALE[DEFAULT_MARKET] });
  if (!fromDefault) return null;
  return { data: fromDefault, fallback: 'default', resolvedMarket: DEFAULT_MARKET };
}

/**
 * Applies the fallback chain to a list.
 *
 * An empty list is a legitimate outcome (nothing published in this market), so
 * only a *non-empty* earlier step short-circuits. A partially-populated market
 * is returned as-is rather than merged with the default market's rows, so a
 * market never shows another market's content alongside its own.
 */
export async function withFallbackList<T>(
  scope: ContentScope,
  load: (scope: ContentScope) => Promise<T[]>,
  options: { allowMarketFallback?: boolean } = {},
): Promise<FallbackResult<T[]> | null> {
  const exact = await load(scope);
  if (exact.length > 0) {
    return { data: exact, fallback: 'exact', resolvedMarket: scope.market };
  }

  if (scope.locale !== MARKET_LOCALE[scope.market]) {
    const canonical = await load({ ...scope, locale: MARKET_LOCALE[scope.market] });
    if (canonical.length > 0) {
      return { data: canonical, fallback: 'locale', resolvedMarket: scope.market };
    }
  }

  if (!options.allowMarketFallback || scope.market === DEFAULT_MARKET) {
    return { data: [], fallback: 'exact', resolvedMarket: scope.market };
  }

  const fromDefault = await load({ market: DEFAULT_MARKET, locale: MARKET_LOCALE[DEFAULT_MARKET] });
  if (fromDefault.length === 0) {
    return { data: [], fallback: 'exact', resolvedMarket: scope.market };
  }
  return { data: fromDefault, fallback: 'default', resolvedMarket: DEFAULT_MARKET };
}

/** True when the row came from a different market than requested. */
export function isCrossMarket<T>(result: FallbackResult<T> | null): boolean {
  return !!result && result.resolvedMarket !== DEFAULT_MARKET && result.fallback === 'default';
}
