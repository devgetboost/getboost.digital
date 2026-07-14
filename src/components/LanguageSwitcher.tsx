import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe, Check, ChevronDown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const LANGS: { code: 'pt' | 'en' | 'es'; country: string; language: string; iso: string }[] = [
  { code: 'pt', country: 'Portugal', language: 'Português', iso: 'pt' },
  { code: 'en', country: 'Reino Unido', language: 'Inglês', iso: 'gb' },
  { code: 'es', country: 'Espanha', language: 'Espanhol', iso: 'es' },
];

const FlagCircle = ({ iso, className = '' }: { iso: string; className?: string }) => (
  <span className={`inline-block rounded-full overflow-hidden bg-gray-100 shrink-0 ${className}`}>
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      srcSet={`https://flagcdn.com/w160/${iso}.png 2x`}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
    />
  </span>
);


type Variant = 'header' | 'sidebar' | 'minimal';

interface Props { variant?: Variant; className?: string }

const LanguageSwitcher = ({ variant = 'header', className = '' }: Props) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const current = (['pt', 'en', 'es'].includes(i18n.language) ? i18n.language : 'pt') as 'pt' | 'en' | 'es';

  const change = (lang: 'pt' | 'en' | 'es') => {
    try { localStorage.setItem('lang', lang); } catch {}
    i18n.changeLanguage(lang);

    // Rewrite pathname swapping the language prefix
    const parts = location.pathname.split('/').filter(Boolean);
    const hasLangPrefix = parts[0] && ['pt', 'en', 'es'].includes(parts[0]);
    const rest = hasLangPrefix ? parts.slice(1) : parts;

    // For PT we strip the prefix (default language). For en/es we always prefix.
    const newPath = lang === 'pt'
      ? '/' + rest.join('/')
      : '/' + [lang, ...rest].join('/');

    navigate(newPath.replace(/\/$/, '') || '/', { replace: false });
  };

  const triggerCls =
    variant === 'sidebar'
      ? 'w-full justify-start gap-2 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 h-9 px-3'
      : variant === 'minimal'
      ? 'h-9 w-9 p-0'
      : 'h-11 pl-1 pr-3 gap-1.5 text-[14px] font-medium text-gray-900 hover:text-gray-900 bg-white border border-gray-200 hover:bg-gray-50 rounded-full';

  const active = LANGS.find((l) => l.code === current)!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`${triggerCls} ${className}`} aria-label="Change language">
          {variant === 'header' ? (
            <>
              <FlagCircle iso={active.iso} className="w-[26px] h-[26px]" />
              <span className="uppercase tracking-wide text-[13px] font-semibold">{active.code}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </>
          ) : variant === 'minimal' ? (
            <FlagCircle iso={active.iso} className="w-5 h-5" />
          ) : (
            <>
              <Globe className="h-4 w-4 shrink-0" />
              <span className="uppercase tracking-wider text-xs">{active.code}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-64 bg-white p-3 rounded-2xl shadow-xl border border-gray-100">
        <div className="px-2 pt-1 pb-3 text-[15px] font-bold text-gray-900">
          Selecionar idioma
        </div>
        <div className="flex flex-col">
          {LANGS.map((l) => {
            const isActive = l.code === current;
            return (
              <DropdownMenuItem
                key={l.code}
                onClick={() => change(l.code)}
                className="flex items-center gap-3 cursor-pointer rounded-lg px-2 py-2.5 focus:bg-gray-50"
              >
                <FlagCircle iso={l.iso} className="w-[26px] h-[26px]" />
                <span className={`text-[14px] ${isActive ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>{l.language}</span>
                {isActive && <Check className="h-3.5 w-3.5 text-primary ml-auto" />}
              </DropdownMenuItem>
            );
          })}

        </div>
      </DropdownMenuContent>

    </DropdownMenu>
  );
};

export default LanguageSwitcher;
