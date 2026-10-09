/**
 * R1C5 Wave 3 — market/locale derivation for the browser.
 *
 * The trusted Edge Function is the authoritative source: it re-derives the
 * market from `Accept-Language` when the browser does not send a valid one.
 * These helpers let a form *hint* the market from the language the visitor is
 * already using, so the server's fallback rarely has to kick in.
 *
 * Kept in its own module so pages do not each invent their own mapping.
 */

import type { MarketCode } from '@/config/env';

/** Locale codes are BCP-47; markets are PT | BR | INTL. */
const MARKET_BY_LANGUAGE: Record<string, MarketCode> = {
  pt: 'PT',
  'pt-PT': 'PT',
  br: 'BR',
  'pt-BR': 'BR',
  en: 'INTL',
};

/** Locale codes the Clean V1 `locale` column accepts. */
export const LOCALE_BY_LANGUAGE: Record<string, string> = {
  pt: 'pt-PT',
  'pt-PT': 'pt-PT',
  br: 'pt-BR',
  'pt-BR': 'pt-BR',
  en: 'en',
};

/**
 * Resolves a market from an i18n language code. Unknown languages fall back to
 * the platform default so a submission is never blocked.
 */
export function marketForLanguage(language: string | undefined): MarketCode {
  if (!language) return 'PT';
  const direct = MARKET_BY_LANGUAGE[language];
  if (direct) return direct;
  const base = language.split('-')[0];
  return MARKET_BY_LANGUAGE[base] ?? 'PT';
}

/** Resolves the locale string stored alongside a lead/booking/subscriber. */
export function localeForLanguage(language: string | undefined): string {
  if (!language) return 'pt-PT';
  return LOCALE_BY_LANGUAGE[language] ?? LOCALE_BY_LANGUAGE[language.split('-')[0]] ?? 'pt-PT';
}
