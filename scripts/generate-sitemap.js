import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SITE_URL = 'https://getboost.digital';
const TODAY = new Date().toISOString().split('T')[0];

const staticRoutes = [
  '',
  '/solucoes',
  '/produtos',
  '/work',
  '/insights',
  '/about',
  '/portfolio',
  '/blog',
  '/resources',
  '/contact',
  '/booking',
  '/investidores',
  '/simulador',
  '/agentes-ia',
  '/crm-sales-intelligence',
  '/tools/roi-calculator',
  '/tools/seo-analyzer',
  '/tools/content-ideas',
  '/tools/branding-guide',
  '/politica-de-privacidade',
  '/politica-de-cookies',
  // SEO Local - Cidades
  '/agencia-marketing-digital-figueira-da-foz',
  '/agencia-marketing-digital-coimbra',
  '/agencia-marketing-digital-leiria',
  '/agencia-marketing-digital-pombal'
];


// Kept in sync with src/data/solucoesSubmenu.ts (current live slugs only).
const serviceSlugs = [
  // Marketing & Growth
  'branding-identidade',
  'marketing-digital',
  'gestao-redes-sociais',
  'copywriting-conteudo',
  'seo-geo-webmcp',
  'paid-media',
  'email-marketing',
  'funis-vendas',
  'landing-pages',
  'video-fotografia',
  // Software Engineering
  'desenvolvimento-web',
  'desenvolvimento-mobile',
  'desenvolvimento-software',
  'sistemas-gestao-pmes',
  'integracoes-erp-crm',
  'ux-ui-design',
  'mvp-30-dias',
  // Automação & IA
  'bots-whatsapp-ia',
  // Wave 2A.6: removed 'hostify', 'qook' and 9 'qook/<city>' entries —
  // redirect-only or no-route destinations. Sitemaps list canonical URLs only.
];

const investorSlugs = ['qook', 'hostify', 'motivae', 'trackfy', 'prosafe360', 'pikto'];
const resourceIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
const portfolioSlugs = ['kasccab-website'];
const blogSlugs = [
  'transformacao-digital-guia-completo-2026',
  'erros-comuns-marketing-digital',
  'consultoria-digital-como-ajudar-empresas-crescer',
  'como-atrair-mais-clientes-google-ads',
  'marketing-digital-figueira-da-foz-guia-completo',
  'inteligencia-artificial-pequenas-empresas-portugal',
  'ia-marketing-atrair-clientes',
  'como-escolher-melhor-sistema-restaurante',
  'futuro-restauracao-self-order-pagamento-digital',
  'automacao-ia-reduzir-custos-aumentar-produtividade'
];

function generateUrlXml(path, priority = '0.5', changefreq = 'weekly') {
  const cleanPath = path === '' ? '/' : path;
  const url = `${SITE_URL}${cleanPath}`;
  
  let xml = '  <url>\n';
  xml += `    <loc>${url}</loc>\n`;
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += `    <changefreq>${changefreq}</changefreq>\n`;
  xml += `    <priority>${priority}</priority>\n`;
  
  // Add hreflang for en and es if the page supports it
  // We avoid trailing slashes for consistency unless it's the root
  const baseHref = cleanPath === '/' ? '' : cleanPath;
  
  // R1C7: alternates are per MARKET, not per interface language. PT owns the
  // bare path, BR is /br, INTL is /en. `x-default` points at PT.
  const MARKET_ALTERNATES = [
    ['pt-PT', ''],
    ['pt-BR', '/br'],
    ['en', '/en'],
  ];
  MARKET_ALTERNATES.forEach(([hreflang, prefix]) => {
    const href = `${SITE_URL}${prefix}${baseHref}`;
    xml += `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${href}"/>\n`;
  });
  xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${cleanPath}"/>\n`;
  
  xml += '  </url>\n';
  return xml;
}

function writeSitemapFile(filename, urls) {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n';
  xml += urls.join('');
  xml += '</urlset>';
  writeFileSync(join(process.cwd(), `public/${filename}`), xml);
  console.log(`${filename} generated successfully!`);
}

// Demo product landing pages (/demo?produto=<slug>). Kept in sync with PRODUCTS
// in src/pages/DemoRequest.tsx. Multilingual slugs also emit a ?lang=en variant.
const demoProductSlugs = ['pikto', 'prosafe360', 'motivae', 'qook', 'hostify', 'trackfy'];
const demoMultilingualSlugs = new Set(['qook']);

/** XML-escapes a value: query-param URLs contain '&', invalid unescaped. */
function xmlEscape(value) {
  return value.replace(/&/g, '&amp;');
}

function generateDemoUrlXml(slug) {
  const isMulti = demoMultilingualSlugs.has(slug);
  const pt = `${SITE_URL}/demo?produto=${slug}`;
  // Wave 2A.6: market-model alternates. PT owns the bare URL (pt-PT); the EN
  // variant carries the page's own ?lang=en (its i18n is query-param based).
  // No `es` (presentation only) and no legacy bare `pt`.
  const en = `${pt}&lang=en`;

  let xml = '  <url>\n';
  xml += `    <loc>${xmlEscape(pt)}</loc>\n`;
  xml += `    <lastmod>${TODAY}</lastmod>\n`;
  xml += `    <changefreq>weekly</changefreq>\n`;
  xml += `    <priority>0.7</priority>\n`;
  if (isMulti) {
    xml += `    <xhtml:link rel="alternate" hreflang="pt-PT" href="${xmlEscape(pt)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(en)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(pt)}"/>\n`;
  }
  xml += '  </url>\n';

  if (!isMulti) return xml;

  // Emit dedicated entries for each language variant so crawlers index them all.
  for (const href of [en]) {
    xml += '  <url>\n';
    xml += `    <loc>${xmlEscape(href)}</loc>\n`;
    xml += `    <lastmod>${TODAY}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="pt-PT" href="${xmlEscape(pt)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="en" href="${xmlEscape(en)}"/>\n`;
    xml += `    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(pt)}"/>\n`;
    xml += '  </url>\n';
  }
  return xml;
}

function generateSitemap() {
  // 1. Pages Sitemap
  const pagesUrls = staticRoutes.map(path => generateUrlXml(path, path === '' ? '1.0' : '0.8', 'weekly'));
  writeSitemapFile('sitemap-pages.xml', pagesUrls);

  // 2. Services Sitemap
  const servicesUrls = serviceSlugs.map(s => generateUrlXml(`/solucoes/${s}`, '0.8', 'weekly'));
  writeSitemapFile('sitemap-services.xml', servicesUrls);

  // 3. Blog Sitemap
  const blogUrls = blogSlugs.map(s => generateUrlXml(`/blog/${s}`, '0.8', 'daily'));
  writeSitemapFile('sitemap-blog.xml', blogUrls);

  // 4. Portfolio Sitemap
  const portfolioUrls = portfolioSlugs.map(s => generateUrlXml(`/portfolio/${s}`, '0.7', 'monthly'));
  writeSitemapFile('sitemap-portfolio.xml', portfolioUrls);

  // 5. Resources Sitemap
  const resourcesUrls = resourceIds.map(id => generateUrlXml(`/resources/${id}`, '0.6', 'monthly'));
  writeSitemapFile('sitemap-resources.xml', resourcesUrls);

  // 6. Demo Sitemap (per-product landings + hreflang alternates)
  const demoUrls = [
    generateUrlXml('/demo', '0.7', 'weekly'),
    ...demoProductSlugs.map(generateDemoUrlXml),
  ];
  writeSitemapFile('sitemap-demo.xml', demoUrls);

  // 7. Index Sitemap
  let indexXml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  indexXml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  ['sitemap-pages.xml', 'sitemap-blog.xml', 'sitemap-services.xml', 'sitemap-portfolio.xml', 'sitemap-resources.xml', 'sitemap-demo.xml'].forEach(file => {
    indexXml += '  <sitemap>\n';
    indexXml += `    <loc>${SITE_URL}/${file}</loc>\n`;
    indexXml += `    <lastmod>${TODAY}</lastmod>\n`;
    indexXml += '  </sitemap>\n';
  });

  indexXml += '</sitemapindex>';
  writeFileSync(join(process.cwd(), 'public/sitemap.xml'), indexXml);
  console.log('Sitemap Index generated successfully!');
}

generateSitemap();

