import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  DEFAULT_MARKET,
  MARKET_HREFLANG,
  MARKET_PATH_PREFIX,
  MARKET_UI_LANGUAGE,
  switchMarketPath,
  type MarketCode,
} from '@/lib/markets';
import { rememberMarket } from './LanguageManager';

/**
 * R1C7 Wave 5 — the market switcher.
 *
 * A market is not a language: PT and BR are both Portuguese but are separate
 * markets with separate content, pricing and locale tags. Switching market
 * therefore has to move the URL, not just the interface language.
 *
 * Policy:
 *  - PT owns the bare path, so switching to PT removes the prefix
 *  - BR is `/br`, INTL is `/en`
 *  - the path, query string and hash are all preserved
 */

/** Human labels for the three markets. */
export const MARKET_OPTIONS: { market: MarketCode; label: string; locale: string }[] = [
  { market: 'PT', label: 'Portugal', locale: 'pt-PT' },
  { market: 'BR', label: 'Brasil', locale: 'pt-BR' },
  { market: 'INTL', label: 'International', locale: 'en' },
];

const LanguageSwitcher = ({ variant = 'header', className = '' }: { variant?: 'header' | 'minimal' | 'sidebar'; className?: string }) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // The market comes from the URL: a bare path is PT, `/br` is BR, `/en` is INTL.
  const currentPath = location.pathname.replace(/^\/+/, '').split('/')[0];
  const current: MarketCode =
    currentPath === 'br' ? 'BR' : currentPath === 'en' ? 'INTL' : DEFAULT_MARKET;

  const uiLanguage = MARKET_UI_LANGUAGE[current];
  // `es` remains available as an interface language *inside* the INTL market.
  const activeUiLanguage: string =
    i18n.language === 'pt' || i18n.language === 'en' || i18n.language === 'es' ? i18n.language : uiLanguage;

  const change = (market: MarketCode) => {
    if (market !== current) {
      rememberMarket(market);
      navigate(switchMarketPath(location.pathname, location.search, location.hash, market));
    }
    // The interface language follows the market, unless the visitor explicitly
    // chose `es` while already inside INTL.
    const targetUiLanguage =
      market === 'INTL' && activeUiLanguage === 'es' ? 'es' : MARKET_UI_LANGUAGE[market];
    if (i18n.language !== targetUiLanguage) i18n.changeLanguage(targetUiLanguage);
    try {
      localStorage.setItem('lang', targetUiLanguage);
    } catch {
      /* storage unavailable */
    }
  };

  const currentOption = MARKET_OPTIONS.find((o) => o.market === current) ?? MARKET_OPTIONS[0];
  const flag =
    current === 'BR' ? 'br' : current === 'INTL' ? 'gb' : 'pt';

  if (variant === 'minimal') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs font-mono uppercase tracking-[0.18em]">
            <Globe className="h-3.5 w-3.5" />
            {current}
            <ChevronDown className="h-3 w-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {MARKET_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.market}
              onClick={() => change(option.market)}
              className="justify-between"
            >
              <span>{option.label}</span>
              {option.market === current && <Check className="h-3.5 w-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`gap-2 ${className}`}>
          <img
            src={`https://flagcdn.com/w20/${flag}.png`}
            width={16}
            height={12}
            alt={currentOption.label}
            className="h-3 w-auto rounded-[2px]"
          />
          <span className="font-mono text-xs uppercase tracking-[0.18em]">{current}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-xs text-muted-foreground">Mercado / Market</div>
        {MARKET_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.market}
            onClick={() => change(option.market)}
            className="justify-between"
          >
            <span className="flex items-center gap-2">
              <img
                src={`https://flagcdn.com/w20/${option.market === 'BR' ? 'br' : option.market === 'INTL' ? 'gb' : 'pt'}.png`}
                width={16}
                height={12}
                alt=""
                className="h-3 w-auto rounded-[2px]"
              />
              {option.label}
              <span className="text-[10px] text-muted-foreground">{MARKET_HREFLANG[option.market]}</span>
            </span>
            {option.market === current && <Check className="h-3.5 w-3.5" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
