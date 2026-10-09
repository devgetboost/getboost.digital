import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { normalizePath } from '@/lib/utils';
import {
  DEFAULT_MARKET,
  MARKET_CODES,
  MARKET_HREFLANG,
  MARKET_LOCALE,
  MARKET_OG_LOCALE,
  MARKET_PATH_PREFIX,
  MARKET_UI_LANGUAGE,
  canonicalMarketUrl,
  marketAlternates,
  marketForLanguage,
  marketForUiLanguage,
  parseMarketPath,
  scopeForLanguage,
  switchMarketPath,
  toMarketPath,
  uiLanguageForMarket,
} from '@/lib/markets';
import { localeForLanguage } from '@/lib/commercialMarket';
import { withFallback, withFallbackList } from '@/lib/contentFallback';

/**
 * R1C7 Wave 5 — market and localization gate.
 *
 * The load-bearing invariant: a market and a locale are different things.
 * PT and BR are both Portuguese (same UI language) but separate markets with
 * separate locales; INTL's canonical locale is English.
 */

const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8');
const stripComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

const SITE = 'https://example.test';

describe('authoritative market model', () => {
  it('declares exactly three markets with PT first', () => {
    expect([...MARKET_CODES]).toEqual(['PT', 'BR', 'INTL']);
  });

  it('keeps market and locale distinct', () => {
    expect(MARKET_LOCALE).toEqual({ PT: 'pt-PT', BR: 'pt-BR', INTL: 'en' });
    // The whole point: PT and BR share a UI language but not a locale.
    expect(MARKET_UI_LANGUAGE.PT).toBe(MARKET_UI_LANGUAGE.BR);
    expect(MARKET_LOCALE.PT).not.toBe(MARKET_LOCALE.BR);
  });

  it('gives each market a distinct hreflang and og:locale', () => {
    expect([MARKET_HREFLANG.PT, MARKET_HREFLANG.BR, MARKET_HREFLANG.INTL]).toEqual([
      'pt-PT',
      'pt-BR',
      'en',
    ]);
    expect([MARKET_OG_LOCALE.PT, MARKET_OG_LOCALE.BR, MARKET_OG_LOCALE.INTL]).toEqual([
      'pt_PT',
      'pt_BR',
      'en_US',
    ]);
    expect(new Set(Object.values(MARKET_HREFLANG)).size).toBe(3);
  });

  it('gives each market a distinct URL prefix, with PT owning the bare path', () => {
    expect(MARKET_PATH_PREFIX).toEqual({ PT: '', BR: 'br', INTL: 'en' });
  });
});

describe('market detection', () => {
  it('separates PT from BR — the two must never collapse', () => {
    expect(marketForLanguage('pt')).toBe('PT');
    expect(marketForLanguage('pt-PT')).toBe('PT');
    expect(marketForLanguage('br')).toBe('BR');
    expect(marketForLanguage('pt-BR')).toBe('BR');
  });

  it('maps every remaining language to INTL', () => {
    expect(marketForLanguage('en')).toBe('INTL');
    expect(marketForLanguage('es')).toBe('INTL');
    expect(marketForLanguage('fr')).toBe('INTL');
  });

  it('falls back deterministically for unknown and absent values', () => {
    // No language at all → the default market (PT), so a bare visit is stable.
    expect(marketForLanguage(undefined)).toBe('PT');
    expect(marketForLanguage(null)).toBe('PT');
    expect(marketForLanguage('')).toBe('PT');
    // A language that exists but is not Portuguese → INTL, never PT.
    expect(marketForLanguage('xx')).toBe('INTL');
    expect(marketForLanguage('zz-ZZ')).toBe('INTL');
    expect(marketForUiLanguage('fr')).toBe('INTL');
  });

  it('resolves a UI language per market', () => {
    expect(uiLanguageForMarket('PT')).toBe('pt');
    expect(uiLanguageForMarket('BR')).toBe('pt');
    expect(uiLanguageForMarket('INTL')).toBe('en');
    expect(marketForUiLanguage('pt')).toBe('PT');
    expect(marketForUiLanguage('en')).toBe('INTL');
  });

  it('derives a scope with the canonical locale, never a guessed one', () => {
    expect(scopeForLanguage('pt')).toEqual({ market: 'PT', locale: 'pt-PT' });
    expect(scopeForLanguage('br')).toEqual({ market: 'BR', locale: 'pt-BR' });
    expect(scopeForLanguage('en')).toEqual({ market: 'INTL', locale: 'en' });
    expect(localeForLanguage('br')).toBe('pt-BR');
  });
});

describe('market-aware routing', () => {
  it('reads the market from the URL prefix', () => {
    expect(parseMarketPath('/br/solucoes')).toEqual({ market: 'BR', path: '/solucoes', explicit: true });
    expect(parseMarketPath('/en/solucoes')).toEqual({ market: 'INTL', path: '/solucoes', explicit: true });
    expect(parseMarketPath('/solucoes')).toEqual({ market: 'PT', path: '/solucoes', explicit: false });
  });

  it('treats a bare path as PT without pretending it was explicit', () => {
    expect(parseMarketPath('/')).toEqual({ market: 'PT', path: '/', explicit: false });
    expect(parseMarketPath('')).toEqual({ market: 'PT', path: '/', explicit: false });
  });

  it('does not mistake a content path for a market prefix', () => {
    // `/enx` is not INTL; `/br` alone is BR with an empty relative path.
    expect(parseMarketPath('/enx/solucoes').market).toBe('PT');
    expect(parseMarketPath('/br').market).toBe('BR');
  });

  it('prefixes and un-prefixes a path for each market', () => {
    expect(toMarketPath('/solucoes', 'PT')).toBe('/solucoes');
    expect(toMarketPath('/solucoes', 'BR')).toBe('/br/solucoes');
    expect(toMarketPath('/solucoes', 'INTL')).toBe('/en/solucoes');
    expect(toMarketPath('/', 'BR')).toBe('/br');
    expect(toMarketPath('/', 'INTL')).toBe('/en');
  });

  it('preserves path, query and hash when switching market', () => {
    expect(switchMarketPath('/br/solucoes', '?q=1', '#top', 'INTL')).toBe('/en/solucoes?q=1#top');
    expect(switchMarketPath('/en/solucoes', '', '', 'PT')).toBe('/solucoes');
    expect(switchMarketPath('/br', '?x=2', '', 'INTL')).toBe('/en?x=2');
  });

  it('round-trips a path through every market', () => {
    for (const path of ['/', '/solucoes', '/blog/my-post']) {
      for (const market of MARKET_CODES) {
        const parsed = parseMarketPath(toMarketPath(path, market));
        expect(parsed.market, `${path} → ${market}`).toBe(market);
        expect(parsed.path, `${path} → ${market}`).toBe(path);
      }
    }
  });
});

describe('canonical and alternates', () => {
  it('emits one distinct URL per market', () => {
    const alternates = marketAlternates('/br/solucoes');
    expect(alternates).toEqual({ PT: '/solucoes', BR: '/br/solucoes', INTL: '/en/solucoes' });
    expect(new Set(Object.values(alternates)).size).toBe(3);
  });

  it('makes PT the canonical owner of the bare path', () => {
    expect(canonicalMarketUrl('/en/solucoes', SITE)).toBe(`${SITE}/solucoes`);
    expect(canonicalMarketUrl('/br/solucoes', SITE)).toBe(`${SITE}/solucoes`);
    expect(canonicalMarketUrl('/solucoes', SITE)).toBe(`${SITE}/solucoes`);
  });
});

describe('explicit content fallback', () => {
  const loadFor = (rowsByMarket: Record<string, string[]>) => (scope: { market: string; locale: string }) =>
    Promise.resolve(rowsByMarket[scope.market] ?? []);

  it('prefers the exact market', async () => {
    const result = await withFallbackList({ market: 'BR', locale: 'pt-BR' }, loadFor({ BR: ['br-a'], PT: ['pt-a'] }));
    expect(result?.fallback).toBe('exact');
    expect(result?.resolvedMarket).toBe('BR');
    expect(result?.data).toEqual(['br-a']);
  });

  it('falls back to the default market only when the market has nothing', async () => {
    const result = await withFallbackList({ market: 'BR', locale: 'pt-BR' }, loadFor({ PT: ['pt-a'] }), {
      allowMarketFallback: true,
    });
    expect(result?.fallback).toBe('default');
    expect(result?.resolvedMarket).toBe('PT');
  });

  it('never crosses markets when fallback is refused', async () => {
    const result = await withFallbackList({ market: 'BR', locale: 'pt-BR' }, loadFor({ PT: ['pt-a'] }), {
      allowMarketFallback: false,
    });
    expect(result?.fallback).toBe('exact');
    expect(result?.data).toEqual([]);
  });

  it('never crosses markets from the default market itself', async () => {
    const result = await withFallbackList({ market: 'PT', locale: 'pt-PT' }, loadFor({ BR: ['br-a'] }), {
      allowMarketFallback: true,
    });
    expect(result?.data).toEqual([]);
  });

  it('does not merge markets when the market is only partly populated', async () => {
    const result = await withFallbackList({ market: 'BR', locale: 'pt-BR' }, loadFor({ BR: ['br-1'], PT: ['pt-1', 'pt-2'] }), {
      allowMarketFallback: true,
    });
    expect(result?.fallback).toBe('exact');
    expect(result?.data).toEqual(['br-1']);
  });

  it('applies the same chain to single-row lookups', async () => {
    const found = await withFallback(
      { market: 'BR', locale: 'pt-BR' },
      (scope) => Promise.resolve(scope.market === 'PT' ? 'pt-row' : null),
      { allowMarketFallback: true },
    );
    expect(found?.fallback).toBe('default');
    expect(found?.data).toBe('pt-row');

    const refused = await withFallback({ market: 'BR', locale: 'pt-BR' }, (scope) =>
      Promise.resolve(scope.market === 'PT' ? 'pt-row' : null),
    );
    expect(refused).toBeNull();

    const missing = await withFallback({ market: 'BR', locale: 'pt-BR' }, () => Promise.resolve(null));
    expect(missing).toBeNull();
  });
});

describe('duplicate-content avoidance', () => {
  it('retires `/es` as a market path', () => {
    // `es` maps into INTL but is never a market of its own: no prefix, no
    // hreflang, no og:locale. Giving it a URL would duplicate INTL content.
    expect(MARKET_PATH_PREFIX).not.toHaveProperty('es');
    expect(MARKET_HREFLANG).not.toHaveProperty('es');
    expect(MARKET_OG_LOCALE).not.toHaveProperty('es');
    expect(marketForLanguage('es')).toBe('INTL');
    // `marketForLanguage('es')` maps into INTL and never gets a market of its own.
    const code = read('src/lib/markets.ts');
    expect(code).toContain('interface language');
  });

  it('redirects the retired /es prefix to the INTL market', () => {
    const manager = stripComments(read('src/components/LanguageManager.tsx'));
    expect(manager).toContain("navigate('/en', { replace: true })");
  });

  it('keeps a single canonical per market in the sitemap', () => {
    const script = read('scripts/generate-sitemap.js');
    expect(script).not.toMatch(/hreflang="es"/);
    // Alternates are per market, emitted from an explicit table.
    expect(script).toContain("['pt-PT', '']");
    expect(script).toContain("['pt-BR', '/br']");
    expect(script).toContain("['en', '/en']");
    expect(script).toContain("hreflang=\"x-default\"");
  });

  it('emits market alternates, not language alternates, from SEO', () => {
    const seo = stripComments(read('src/components/SEO.tsx'));
    expect(seo).not.toContain("'/es'");
    expect(seo).toContain('marketAlternates(path)');
  });
});

describe('normalization and prefixed redirects', () => {
  it('no longer strips market prefixes', () => {
    expect(normalizePath('/br/solucoes')).toBe('/br/solucoes');
    expect(normalizePath('/en/solucoes')).toBe('/en/solucoes');
    expect(normalizePath('/pt/solucoes')).toBe('/solucoes');
    expect(normalizePath('/solucoes')).toBe('/solucoes');
  });

  it('keeps the market prefix on legacy redirects', () => {
    const app = read('src/App.tsx');
    // 15 prefixed `<Navigate to="/x" />` used to drop `/:lang`.
    expect(app).toContain('<Navigate to="/:lang/hostify" replace />');
    expect(app).not.toMatch(/<Route path="\/:lang\/[^"]*" element=\{<Navigate to="\/(?!:lang)[^"]*" replace \/>\} \/>/);
  });
});

describe('switcher consistency', () => {
  it('moves the URL from both switchers', () => {
    for (const file of ['src/components/LanguageSwitcher.tsx', 'src/components/Footer.tsx']) {
      const src = stripComments(read(file));
      expect(src, `${file} must navigate on market change`).toMatch(/navigate\(/);
      expect(src, `${file} must not only change the language`).not.toMatch(
        /onClick=\{\(\) => i18n\.changeLanguage\(/,
      );
    }
  });

  it('shares one market-change helper', () => {
    const markets = stripComments(read('src/lib/markets.ts'));
    expect(markets).toContain('export function switchMarketPath');
    const switcher = stripComments(read('src/components/LanguageSwitcher.tsx'));
    const footer = stripComments(read('src/components/Footer.tsx'));
    expect(switcher).toContain('switchMarketPath');
    expect(footer).toContain('switchMarketPath');
    // Neither may carry its own copy of the mutator.
    expect(switcher).not.toContain('export function switchMarketPath');
    expect(footer).not.toContain('export function switchMarketPath');
  });
});
