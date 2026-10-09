import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizePath } from '@/lib/utils';

import {
  DEFAULT_MARKET,
  MARKET_HREFLANG,
  MARKET_LOCALE,
  MARKET_OG_LOCALE,
  MARKET_PATH_PREFIX,
  MARKET_UI_LANGUAGE,
  marketAlternates,
  marketForLanguage,
  type MarketCode,
} from '@/lib/markets';

const SITE_URL = 'https://getboostsoft.lovable.app';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.jpg`;
const SITE_NAME = 'Getboost Digital — Marketing Digital & IA';

const SOCIAL_LINKS = [
  'https://www.linkedin.com/in/nunocruz',
  'https://www.instagram.com/getboost.digital',
  'https://www.facebook.com/getboost.digital',
  'https://wa.me/351963574400'
];

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Either a market code (PT/BR/INTL) or a UI language (pt/en/es). */
  lang?: string;
  alternates?: { lang: string; href: string }[];
}

/**
 * Validates JSON-LD objects for required fields
 */
const validateJsonLd = (data: any) => {
  if (!data) return [];
  const items = Array.isArray(data) ? data : [data];
  
  return items.map(item => {
    const newItem = { ...item };
    if (!newItem['@context']) newItem['@context'] = 'https://schema.org';
    return newItem;
  });
};


/**
 * Normalizes a URL to ensure consistency
 * - Forces absolute URL using site domain
 * - Uses shared normalizePath logic
 */
const normalizeUrl = (url?: string) => {
  if (!url) return '';
  
  try {
    const pathOnly = url.startsWith('http') 
      ? new URL(url).pathname 
      : url;
      
    const cleanPath = normalizePath(pathOnly);
    return `${SITE_URL}${cleanPath}`;
  } catch (e) {
    console.error('[SEO] URL normalization failed:', url, e);
    return url;
  }
};

/**
 * Generates Hreflang links for multilingual support
 */
const generateHreflangs = (path?: string) => {
  if (!path) return [];

  // R1C7: alternates are per *market*, not per interface language. PT owns the
  // bare path; BR and INTL are prefixed. `x-default` points at PT, the default
  // market, so a search engine with no better signal lands on the PT page.
  const alternates = marketAlternates(path);

  return [
    { lang: MARKET_HREFLANG.PT, href: `${SITE_URL}${alternates.PT}` },
    { lang: MARKET_HREFLANG.BR, href: `${SITE_URL}${alternates.BR}` },
    { lang: MARKET_HREFLANG.INTL, href: `${SITE_URL}${alternates.INTL}` },
    { lang: 'x-default', href: `${SITE_URL}${alternates.PT}` },
  ];
};

/**
 * Resolves the market a `<SEO>` describes.
 *
 * Accepts either a market code (PT/BR/INTL) or an interface language
 * (pt/en/es) for backwards compatibility with the ~50 pages that pass
 * `lang={i18n.language}`. A bare path with no hint is PT, the default market.
 */
const resolveMarketFromLang = (lang: string | undefined, path: string): MarketCode => {
  if (lang && (['PT', 'BR', 'INTL'] as string[]).includes(lang)) return lang as MarketCode;
  if (lang) return marketForLanguage(lang);
  const prefix = path.replace(/^\/+/, '').split('/')[0];
  return prefix === 'br' ? 'BR' : prefix === 'en' ? 'INTL' : DEFAULT_MARKET;
};

const SEO = ({
  title,
  description = 'Especialista em Marketing Digital, Transformação Digital e IA na Figueira da Foz. +20 anos de experiência, +1500 projetos entregues.',
  canonical,
  image = DEFAULT_IMAGE,
  type = 'website',
  noIndex = false,
  jsonLd,
  lang = 'pt',
  alternates,

}: SEOProps) => {
  const location = useLocation();
  const fullTitle = title ? `${title} | Getboost Digital` : 'Getboost Digital — Marketing Digital & IA | Figueira da Foz';
  
  // Normalize provided canonical or use current location
  const effectivePath = canonical || location.pathname;
  const url = normalizeUrl(effectivePath);
  
  const normalizedImage = image.startsWith('http://') || image.startsWith('https://')
    ? image
    : `${SITE_URL}${image.startsWith('/') ? image : `/${image}`}`;

  // R1C7: locale and market are separate concepts. The `<html lang>` and
  // `og:locale` tags carry the market's canonical *locale* (pt-PT / pt-BR / en),
  // so a BR visitor is not mislabelled as European Portuguese.
  const activeMarket = resolveMarketFromLang(lang, effectivePath);
  const activeLocale = MARKET_LOCALE[activeMarket];

  const localeMap: Record<string, string> = {
    pt: MARKET_OG_LOCALE.PT,
    en: MARKET_OG_LOCALE.INTL,
    es: MARKET_OG_LOCALE.INTL,
    PT: MARKET_OG_LOCALE.PT,
    BR: MARKET_OG_LOCALE.BR,
    INTL: MARKET_OG_LOCALE.INTL,
  };

  const htmlLangMap: Record<string, string> = {
    pt: MARKET_LOCALE.PT,
    en: MARKET_LOCALE.INTL,
    // `es` is an interface language inside the INTL market; the document
    // language still reports the INTL market's canonical locale.
    es: MARKET_LOCALE.INTL,
    PT: MARKET_LOCALE.PT,
    BR: MARKET_LOCALE.BR,
    INTL: MARKET_LOCALE.INTL,
  };

  void MARKET_PATH_PREFIX;
  void MARKET_UI_LANGUAGE;

  // Runtime validation in Development mode
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // 1. Verify canonical matches location (ignoring case and trailing slashes)
      const currentNormalized = normalizeUrl(location.pathname);
      if (url !== currentNormalized && !url.includes(currentNormalized)) {
        console.warn(`[SEO Validation] Canonical path mismatch. 
Current location normalized: ${currentNormalized}
Provided canonical normalized: ${url}
Page title: ${title}`);
      }

      // 2. Specific validation for investor projects
      if (location.pathname.startsWith('/investidores/')) {
        const slug = location.pathname.split('/').filter(Boolean).pop();
        if (slug && !url.includes(slug.toLowerCase())) {
          console.error(`[SEO Validation] Canonical link does not match project slug for ${slug}`);
        }
      }
    }
  }, [url, location.pathname, title]);

  // Combined JSON-LD Structured Data
  const validatedJsonLd = validateJsonLd(jsonLd);
  const finalJsonLd = [
    ...validatedJsonLd,
    // Add main website schema on home page if not already present
    ...(location.pathname === '/' ? [organizationSchema, localBusinessSchema] : [])
  ];

  const hreflangs = noIndex ? [] : (alternates && alternates.length > 0 ? alternates : generateHreflangs(effectivePath));

  return (
    <Helmet>
      <html lang={htmlLangMap[lang]} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {!noIndex && <link rel="canonical" href={url} />}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Alternate Languages - Hreflang */}
      {!noIndex && hreflangs.map(hl => (
        <link key={hl.lang} rel="alternate" hrefLang={hl.lang} href={hl.href} />
      ))}

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {!noIndex && <meta property="og:url" content={url} />}
      <meta property="og:type" content={type} />
      <meta property="og:image" content={normalizedImage} />
      <meta property="og:image:secure_url" content={normalizedImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content={localeMap[lang]} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={normalizedImage} />

      {/* JSON-LD Structured Data */}
      {finalJsonLd.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(finalJsonLd.length === 1 ? finalJsonLd[0] : finalJsonLd)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;

// Reusable Organization/LocalBusiness schema
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Getboost Digital — Marketing Digital & IA',
  alternateName: 'GetBoost Digital',
  url: SITE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${SITE_URL}/logo.png`,
    width: '180',
    height: '60'
  },
  image: DEFAULT_IMAGE,
  description: 'Especialista em Marketing Digital com mais de 20 anos de experiência.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'R. Passeio Infante Dom Henrique, 22, Sala 33',
    addressLocality: 'Figueira da Foz',
    postalCode: '3080-042',
    addressCountry: 'PT'
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+351963574400',
    contactType: 'customer service',
    email: 'geral@getboost.digital',
    availableLanguage: ['Portuguese', 'English', 'Spanish']
  },
  sameAs: SOCIAL_LINKS
};

export const localBusinessSchema = {
  ...organizationSchema,
  '@type': 'LocalBusiness',
  '@id': `${SITE_URL}/#business`,
  priceRange: '€€',
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 40.1508,
    longitude: -8.8618,
  },
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:30'
    }
  ],
  areaServed: ['Portugal', 'Brasil', 'Spain']
};

export const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${SITE_URL}/about/#person`,
  name: 'Getboost Digital',
  jobTitle: 'Especialista em Marketing Digital & Inteligência Artificial',
  url: `${SITE_URL}/about`,
  image: `${SITE_URL}/assets/nuno-cruz.webp`,
  sameAs: SOCIAL_LINKS,
  worksFor: { '@id': `${SITE_URL}/#organization` }
};