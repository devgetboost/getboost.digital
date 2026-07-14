import { useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SUPPORTED = ['pt', 'en', 'es'] as const;
type Lang = (typeof SUPPORTED)[number];

const detectInitialLang = (): Lang => {
  try {
    const stored = localStorage.getItem('lang');
    if (stored && (SUPPORTED as readonly string[]).includes(stored)) return stored as Lang;
  } catch {}
  const nav = (typeof navigator !== 'undefined' ? navigator.language : 'pt').slice(0, 2).toLowerCase();
  return (SUPPORTED as readonly string[]).includes(nav) ? (nav as Lang) : 'pt';
};

const LanguageManager = ({ children }: { children: React.ReactNode }) => {
  const { lang } = useParams();
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Sync language with route param
  useEffect(() => {
    const routeLang = lang && (SUPPORTED as readonly string[]).includes(lang) ? (lang as Lang) : 'pt';
    if (i18n.language !== routeLang) {
      i18n.changeLanguage(routeLang);
    }
    try { localStorage.setItem('lang', routeLang); } catch {}
    if (typeof document !== 'undefined') {
      document.documentElement.lang = routeLang;
    }
  }, [lang, i18n]);

  // First-visit auto-detect: if user lands on "/" and prefers en/es, redirect to /en or /es
  useEffect(() => {
    if (location.pathname !== '/') return;
    const detected = detectInitialLang();
    if (detected !== 'pt') {
      navigate(`/${detected}`, { replace: true });
    }
  }, [location.pathname, navigate]);

  return <>{children}</>;
};

export default LanguageManager;
