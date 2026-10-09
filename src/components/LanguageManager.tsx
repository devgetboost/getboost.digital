import { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_MARKET,
  MARKET_CODES,
  MARKET_LOCALE,
  MARKET_UI_LANGUAGE,
  isMarketPrefix,
  marketForUiLanguage,
  parseMarketPath,
  uiLanguageForMarket,
  type MarketCode,
} from '@/lib/markets';

/** The outcome of resolving which market a visitor should see. */
export interface ResolvedMarket {
  market: MarketCode;
  uiLanguage: string;
  /** True when the URL itself carried the market. */
  explicit: boolean;
}

/** The `localStorage` key that remembers the market a visitor last chose. */
export const MARKET_STORAGE_KEY = 'gb_market';

/** Remembers the market so a later bare-URL visit can restore it. */
export function rememberMarket(market: string): void {
  try {
    localStorage.setItem(MARKET_STORAGE_KEY, market);
  } catch {
    /* storage unavailable — market still resolves from the URL */
  }
}

/** The market the visitor last chose, if any. */
export function rememberedMarket(): string | null {
  try {
    return localStorage.getItem(MARKET_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** The market implied by the browser's `Accept-Language`. */
export function marketFromBrowser(): MarketCode {
  if (typeof navigator === 'undefined') return DEFAULT_MARKET;
  return marketForUiLanguage(navigator.language ?? '');
}

/**
 * Which market the visitor should see.
 *
 * Priority, first match wins:
 *  1. the URL prefix (`/br`, `/en`) — an explicit choice, always honoured
 *  2. the remembered market from a previous visit
 *  3. the browser language
 *  4. the default market
 *
 * Never throws and never blocks: an unusable value simply falls through.
 */
export function resolveMarket(pathname: string): ResolvedMarket {
  const first = pathname.replace(/^\/+/, '').split('/')[0];

  if (isMarketPrefix(first)) {
    const market = marketForUiLanguage(first);
    rememberMarket(market);
    return { market, uiLanguage: uiLanguageForMarket(market), explicit: true };
  }

  const remembered = rememberedMarket();
  if (remembered && isMarketCode(remembered)) {
    return { market: remembered, uiLanguage: uiLanguageForMarket(remembered), explicit: false };
  }

  const fromBrowser = marketFromBrowser();
  return { market: fromBrowser, uiLanguage: uiLanguageForMarket(fromBrowser), explicit: false };
}

/** Narrows an arbitrary stored string to a market code. */
function isMarketCode(value: string): value is MarketCode {
  return (MARKET_CODES as readonly string[]).includes(value);
}

/**
 * Keeps the app's language, market and document metadata in step with the URL.
 *
 * Before Wave 5 the site treated `/en` and `/es` as separate "languages" and
 * PT as the bare path. Now the URL carries the *market* and the interface
 * language is derived from it, so `/br/solucoes` renders pt-BR content under a
 * Portuguese interface while `/en/solucoes` renders INTL content in English.
 */
const LanguageManager = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useParams<{ lang?: string }>();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // A URL that is neither a market prefix nor a market-relative path is unknown
  // to the market layer and is left for the router to handle.
  const { market, path } = parseMarketPath(location.pathname);
  const legacyLangIsMarketPrefix = !!lang && isMarketPrefix(lang);

  useEffect(() => {
    const target = legacyLangIsMarketPrefix ? marketForUiLanguage(lang as string) : DEFAULT_MARKET;
    const uiLanguage = MARKET_UI_LANGUAGE[target];

    if (i18n.language !== uiLanguage) i18n.changeLanguage(uiLanguage);
    rememberMarket(target);

    if (typeof document !== 'undefined') {
      // The document language is the *locale*, not the market.
      document.documentElement.lang = MARKET_LOCALE[target];
    }
  }, [lang, legacyLangIsMarketPrefix, market, i18n]);

  // Land a visitor on the market the URL, memory or browser asks for. A bare
  // path is PT, so this only fires for BR/INTL and never rewrites a PT URL.
  useEffect(() => {
    if (location.pathname !== '/') return;
    const resolved = resolveMarket(location.pathname);
    if (resolved.market === DEFAULT_MARKET) return;
    const prefix = resolved.market === 'BR' ? '/br' : resolved.market === 'INTL' ? '/en' : '';
    if (!prefix) return;
    navigate(prefix, { replace: true });
  }, [location.pathname, navigate]);

  // Retired `/es/*` URLs: `es` is an interface language inside the INTL market,
  // not a market. Redirect so the same content does not live at two URLs.
  useEffect(() => {
    if (location.pathname === '/es') {
      navigate('/en', { replace: true });
      return;
    }
    if (!location.pathname.startsWith('/es')) return;
    const rest = location.pathname.slice('/es'.length);
    navigate(`/en${rest}${location.search}${location.hash}`, { replace: true });
  }, [location.pathname, location.search, location.hash, navigate]);

  return <>{children}</>;
};

export default LanguageManager;
