/**
 * R1C7: market and locale resolution for commercial writes.
 *
 * Delegates to `./markets` so every layer agrees. `es` is an interface language
 * inside the INTL market, not a market of its own.
 */

export {
  marketForLanguage,
  localeForLanguage,
  scopeForLanguage,
} from './markets';
export type { MarketScope } from './markets';
