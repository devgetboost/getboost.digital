import { Helmet } from 'react-helmet-async';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { normalizePath } from '@/lib/utils';

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
  lang?: 'pt' | 'en' | 'es';
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
  
  const baseCleanPath = normalizePath(path);
  
  // Get path without language prefix if it exists
  let cleanPathWithoutLang = baseCleanPath;
  const langPrefixes = ['/en', '/es', '/pt'];
  for (const prefix of langPrefixes) {
    if (baseCleanPath.startsWith(prefix)) {
      cleanPathWithoutLang = baseCleanPath.substring(prefix.length) || '/';
      break;
    }
  }

  // Ensure we don't have double slashes when prefixing
  const pathPart = cleanPathWithoutLang === '/' ? '' : cleanPathWithoutLang;
  
  return [
    { lang: 'pt', href: `${SITE_URL}${pathPart || '/'}` },
    { lang: 'en', href: `${SITE_URL}/en${pathPart}` },
    { lang: 'es', href: `${SITE_URL}/es${pathPart}` },
    { lang: 'x-default', href: `${SITE_URL}${pathPart || '/'}` }
  ];
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

  const localeMap = {
    pt: 'pt_PT',
    en: 'en_US',
    es: 'es_ES',
  };

  const htmlLangMap = {
    pt: 'pt',
    en: 'en',
    es: 'es',
  };

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