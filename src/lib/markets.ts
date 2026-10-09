/**
 * R1C7 Wave 5 — the authoritative market and locale model.
 *
 * A market and a locale are **different things** and must never be conflated:
 *
 *   market | URL prefix | canonical locale | UI language | hreflang
 *   -------|------------|------------------|-------------|---------
 *   PT     | (none)     | pt-PT            | pt          | pt-PT
 *   BR     | /br        | pt-BR            | pt          | pt-BR
 *   INTL   | /en        | en               | en          | en
 *
 * Consequences of that split:
 *  - PT and BR share the *same* UI language (`pt`) but are different markets
 *    with different content, pricing and locale tags. Collapsing them to
 *    "language = pt" is the bug this module exists to prevent.
 *  - INTL's canonical locale is `en`, so any other language the UI can still
 *    display (e.g. `es`) is a *presentation* choice inside the INTL market, not
 *    a market of its own.
 *  - PT is the default and keeps the bare path, so every URL already indexed
 *    stays valid.
 *
 * This is the single source of truth for market resolution, URL prefixes and
 * hreflang tags. `src/i18n`, `LanguageManager`, `LanguageSwitcher`, `SEO`,
 * `contentApi`, `commercialMarket` and the sitemap generator all read from here.
 */

import { MARKETS, type MarketCode } from '@/config/env';

export type { MarketCode };

/** UI language a market renders its interface in. */
export type UiLanguage = 'pt' | 'en';

/** The three markets, ordered PT (default) first. */
export const MARKET_CODES: readonly MarketCode[] = MARKETS;

/** URL prefix per market. PT is the default and deliberately has none. */
export const MARKET_PATH_PREFIX: Record<MarketCode, string> = {
  PT: '',
  BR: 'br',
  INTL: 'en',
};

/** The canonical locale stored on content and commercial rows. */
export const MARKET_LOCALE: Record<MarketCode, string> = {
  PT: 'pt-PT',
  BR: 'pt-BR',
  INTL: 'en',
};

/** The hreflang tag advertised for each market. */
export const MARKET_HREFLANG: Record<MarketCode, string> = {
  PT: 'pt-PT',
  BR: 'pt-BR',
  INTL: 'en',
};

/** The UI language used to render each market's interface. */
export const MARKET_UI_LANGUAGE: Record<MarketCode, UiLanguage> = {
  PT: 'pt',
  BR: 'pt',
  INTL: 'en',
};

/** `og:locale` per market. */
export const MARKET_OG_LOCALE: Record<MarketCode, string> = {
  PT: 'pt_PT',
  BR: 'pt_BR',
  INTL: 'en_US',
};

/** The default market, used for the bare path and as the last-resort fallback. */
export const DEFAULT_MARKET: MarketCode = 'PT';

/** The three markets a visitor can switch between, with their URL prefixes. */
export const SWITCHABLE_MARKETS: readonly MarketCode[] = MARKET_CODES;

/**
 * Rewrites a pathname to target a market, preserving the path, query and hash.
 *
 * Any existing market prefix is stripped first so `/br/x` → `/en/x` never
 * stacks prefixes.
 */
export function switchMarketPath(
  pathname: string,
  search: string,
  hash: string,
  market: MarketCode,
): string {
  const stripped = pathname.replace(/^\/(br|en|pt)(?=\/|$)/, '');
  const prefix = MARKET_PATH_PREFIX[market];
  const base = stripped === '/' || stripped === '' ? '' : stripped.replace(/\/+$/, '');
  const next = prefix ? `/${prefix}${base}` : base || '/';
  return `${next}${search}${hash}`;
}

/** Reverse lookup: URL prefix → market. */
const MARKET_BY_PREFIX: Record<string, MarketCode> = {
  br: 'BR',
  en: 'INTL',
};

/**
 * Languages the interface can still render.
 *
 * Only `pt` and `en` are market-backed. `es` remains available so a visitor who
 * explicitly picks it keeps their reading language, but it is *not* a market:
 * its content, canonical URL and hreflang all belong to INTL. Giving `es` its
 * own URL would duplicate `/en/...` content, which is exactly what this wave
 * must avoid.
 */
export const UI_LANGUAGES: readonly ('pt' | 'en' | 'es')[] = ['pt', 'en', 'es'];

/**
 * Market a language belongs to when the visitor has no market yet.
 *
 * Portuguese is split by region (`pt-PT` vs `pt-BR`); everything that is not
 * Portuguese belongs to the international market. Only `pt`, `pt-PT` and `pt-BR`
 * decide between the two Portuguese markets.
 *
 * `es` is deliberately absent: it is an interface language *inside* INTL, not a
 * market of its own — giving it a market would duplicate INTL content at a
 * second URL.
 */
const MARKET_BY_UI_LANGUAGE: Record<string, MarketCode> = {
  pt: 'PT',
  'pt-pt': 'PT',
  br: 'BR',
  'pt-br': 'BR',
};

/** Market scope for a content or commercial read. */
export interface MarketScope {
  market: MarketCode;
  /** The canonical locale for that market. */
  locale: string;
}

// ---------------------------------------------------------------------------
// Language ↔ market
// ---------------------------------------------------------------------------

/**
 * Resolves the market for a language or locale string.
 *
 * Recognises `pt-BR`/`br` as BR — a bare `pt` is PT, because European
 * Portuguese is the default. Anything unknown falls back to the default market
 * rather than failing, so a stale `localStorage` value can never block a visit.
 */
export function marketForLanguage(language: string | undefined | null): MarketCode {
  // No language at all → the default market, so a bare visit is deterministic.
  if (!language) return DEFAULT_MARKET;
  const normalised = language.toLowerCase();
  if (normalised === 'br' || normalised === 'pt-br') return 'BR';
  const base = normalised.split('-')[0];
  if (base === 'br') return 'BR';
  // Portuguese → PT; anything else (English, Spanish, French…) → INTL.
  if (base === 'pt') return 'PT';
  return MARKET_BY_UI_LANGUAGE[normalised] ?? MARKET_BY_UI_LANGUAGE[base] ?? 'INTL';
}

/** The canonical locale for a language string. */
export function localeForLanguage(language: string | undefined | null): string {
  return MARKET_LOCALE[marketForLanguage(language)];
}

/** The UI language a market renders in. */
export function uiLanguageForMarket(market: MarketCode): UiLanguage {
  return MARKET_UI_LANGUAGE[market];
}

/** The market a UI language belongs to. Only `pt` and `en` are market-backed. */
export function marketForUiLanguage(language: string): MarketCode {
  const normalised = language.toLowerCase();
  if (normalised === 'br' || normalised === 'pt-br') return 'BR';
  const base = normalised.split('-')[0];
  // Portuguese splits by region; everything else is international.
  if (base === 'pt') return 'PT';
  return 'INTL';
}

/** A full market scope from a language string. */
export function scopeForLanguage(language: string | undefined | null): MarketScope {
  const market = marketForLanguage(language);
  return { market, locale: MARKET_LOCALE[market] };
}

// ---------------------------------------------------------------------------
// Path ↔ market
// ---------------------------------------------------------------------------

export interface ParsedMarketPath {
  market: MarketCode;
  /** The path with the market prefix removed, always starting with `/`. */
  path: string;
  /** True when the URL carried an explicit market prefix. */
  explicit: boolean;
}

/** True when the first path segment is a market prefix. */
export function isMarketPrefix(segment: string | undefined): boolean {
  return !!segment && Object.prototype.hasOwnProperty.call(MARKET_BY_PREFIX, segment);
}

/**
 * Splits a pathname into its market and the market-relative path.
 *
 * A bare path is PT and `explicit: false`, because PT is the default.
 */
export function parseMarketPath(pathname: string): ParsedMarketPath {
  const withoutLeading = pathname.replace(/^\/+/, '');
  const [first, ...rest] = withoutLeading.split('/');

  if (isMarketPrefix(first)) {
    return {
      market: MARKET_BY_PREFIX[first as string],
      path: `/${rest.join('/')}`,
      explicit: true,
    };
  }

  const path = withoutLeading.length === 0 ? '/' : `/${withoutLeading}`;
  return { market: DEFAULT_MARKET, path, explicit: false };
}

/** Prefixes a market-relative path with a market's URL prefix. */
export function toMarketPath(path: string, market: MarketCode): string {
  const prefix = MARKET_PATH_PREFIX[market];
  const clean = path.startsWith('/') ? path : `/${path}`;
  const withSlash = clean.length > 1 && clean.endsWith('/') ? clean.replace(/\/+$/, '') : clean;
  const prefixed = prefix ? `/${prefix}${withSlash === '/' ? '' : withSlash}` : withSlash;
  return prefixed === '' ? '/' : prefixed;
}

/** Every URL that renders the same content, keyed by market. */
export function marketAlternates(pathname: string): Record<MarketCode, string> {
  const { path } = parseMarketPath(pathname);
  return {
    PT: toMarketPath(path, 'PT'),
    BR: toMarketPath(path, 'BR'),
    INTL: toMarketPath(path, 'INTL'),
  };
}

/**
 * The canonical URL for a market.
 *
 * PT owns the bare path; the alternates are the prefixed ones. This is what
 * keeps a single canonical per piece of content and prevents duplicate content
 * across markets.
 */
export function canonicalMarketUrl(pathname: string, siteUrl: string): string {
  const alternates = marketAlternates(pathname);
  return `${siteUrl}${alternates.PT}`;
}
