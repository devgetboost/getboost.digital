import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Mail, CheckCircle2, Building2, Users, TrendingUp, Check } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { analytics } from '@/lib/analytics';
import { CITIES, CITY_LIST } from '@/data/localCities';
import { CONTACT, METRICS } from '@/data/brandRegistry';

const ACCENT = '#ff4000';
const PHONE = CONTACT.phone.display;
const EMAIL = CONTACT.email;
const HQ_ADDRESS = CONTACT.address.formatted;

const SERVICES = [
  { title: 'Marketing Digital', href: '/solucoes/marketing-digital', body: 'Estratégia, funis, campanhas Google/Meta Ads e SEO.' },
  { title: 'Gestão de Redes Sociais', href: '/solucoes/gestao-redes-sociais', body: 'Conteúdo, community management e paid social.' },
  { title: 'Desenvolvimento Web', href: '/solucoes/desenvolvimento-web', body: 'Sites institucionais, e-commerce e landing pages que convertem.' },
  { title: 'SEO, GEO & WebMCP', href: '/solucoes/seo-geo-webmcp', body: 'Rankings no Google + presença em ChatGPT, Gemini e Perplexity.' },
  { title: 'Bots WhatsApp com IA', href: '/solucoes/bots-whatsapp-ia', body: 'Automação de atendimento e vendas 24/7.' },
  { title: 'Branding & Identidade', href: '/solucoes/branding-identidade', body: 'Naming, logo, sistema visual e brand book.' },
];

export default function AgenciaLocal() {
  const { citySlug } = useParams<{ citySlug: string }>();
  const city = citySlug ? CITIES[citySlug] : null;

  if (!city) return <Navigate to="/solucoes" replace />;

  const title = `Agência de Marketing Digital em ${city.name}`;
  const description = `Agência de marketing digital, software à medida e IA para PMEs em ${city.name}${city.district !== city.name ? ` (distrito de ${city.district})` : ''}. +20 anos, ${METRICS.projectsDelivered.value} projetos. Sessão gratuita de diagnóstico.`;

  const localBusinessLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `https://getboost.digital/agencia-marketing-digital-${city.slug}#business`,
    name: `Getboost Digital — ${city.name}`,
    description,
    url: `https://getboost.digital/agencia-marketing-digital-${city.slug}`,
    telephone: PHONE.replace(/\s/g, ''),
    email: EMAIL,
    priceRange: '€€',
    image: 'https://getboost.digital/og-image.jpg',
    address: {
      '@type': 'PostalAddress',
      streetAddress: CONTACT.address.street,
      addressLocality: CONTACT.address.locality,
      postalCode: CONTACT.address.postalCode,
      addressRegion: 'Coimbra',
      addressCountry: 'PT',
    },
    geo: { '@type': 'GeoCoordinates', latitude: 40.1508, longitude: -8.8618 },
    areaServed: {
      '@type': 'City',
      name: city.name,
      geo: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
    },
    serviceArea: {
      '@type': 'GeoCircle',
      geoMidpoint: { '@type': 'GeoCoordinates', latitude: city.lat, longitude: city.lng },
      geoRadius: '30000',
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '09:00', closes: '18:30' },
    ],
    sameAs: [
      'https://www.linkedin.com/in/nunocruz',
      'https://www.instagram.com/getboost.digital',
      'https://www.facebook.com/getboost.digital',
    ],
  };

  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `A Getboost trabalha com empresas em ${city.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: `Sim. A nossa sede é na Figueira da Foz (${city.distanceFromHQ.includes('Sede') ? 'atendimento presencial' : city.distanceFromHQ}) e trabalhamos regularmente com PMEs de ${city.name} em regime presencial e remoto.` },
      },
      {
        '@type': 'Question',
        name: `Quanto custa uma estratégia de marketing digital em ${city.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: 'O investimento depende dos objetivos e da concorrência local. Fazemos um diagnóstico gratuito de 7 minutos e apresentamos uma proposta ajustada ao negócio.' },
      },
      {
        '@type': 'Question',
        name: `Fazem SEO Local para ${city.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: `Sim. Trabalhamos Google Business Profile, citações NAP, reviews, conteúdo geo-referenciado e schema LocalBusiness para colocar o teu negócio no top do Google Maps em ${city.name}.` },
      },
      {
        '@type': 'Question',
        name: 'O que é GEO e WebMCP e porque interessa ao meu negócio?',
        acceptedAnswer: { '@type': 'Answer', text: 'GEO (Generative Engine Optimization) e WebMCP são as novas camadas de SEO que garantem que a tua empresa é citada por ChatGPT, Gemini e Perplexity — não apenas por Google. Cada vez mais utilizadores pesquisam por IA.' },
      },
    ],
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://getboost.digital/' },
      { '@type': 'ListItem', position: 2, name: 'Cidades', item: 'https://getboost.digital/cidades' },
      { '@type': 'ListItem', position: 3, name: city.name, item: `https://getboost.digital/agencia-marketing-digital-${city.slug}` },
    ],
  };

  return (
    <Layout>
      <ScrollDepth location="agency_local" />
      <SEO
        title={title}
        description={description}
        canonical={`/agencia-marketing-digital-${city.slug}`}
        jsonLd={[localBusinessLd, faqLd, breadcrumbLd]}
      />

      {/* Hero */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="gb-eyebrow text-brand-600">
              <MapPin size={14} className="mr-2 inline" />
              {city.name} · {city.district}
            </span>
            <h1 className="gb-text-display mt-5 text-ink-primary">
              Agência de <span className="text-brand-600">Marketing Digital</span>,<br />
              Software & IA em {city.name}
            </h1>
            <p className="gb-text-body mt-6 max-w-3xl text-ink-secondary">
              Ajudamos PMEs de {city.name} a crescer com estratégia digital, sites que convertem, campanhas Google/Meta Ads,
              automação com IA e SEO Local. Diagnóstico gratuito de 7 minutos.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link to="/booking" onClick={() => analytics.trackClick('agency_local_hero', 'agency_local_booking', 'consideration')}>
                  Agendar diagnóstico gratuito <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={`tel:${PHONE.replace(/\s/g, '')}`} onClick={() => analytics.trackOutbound('phone', 'agencia_local')}>
                  <Phone size={18} /> {PHONE}
                </a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {['SEO Local', 'Google & Meta Ads', 'Software à medida', METRICS.projectsDelivered.value + ' projetos'].map((chip) => (
                <span key={chip} className="gb-chip">
                  <Check className="h-3.5 w-3.5 text-brand-600" />
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* Contexto local */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <SectionHeader
              eyebrow="Contexto local"
              title={`Porque trabalhamos com PMEs em ${city.name}`}
            />
            <p className="gb-text-body mt-6 text-ink-secondary">{city.economyIntro}</p>
            <p className="gb-text-body mt-6 text-ink-secondary">
              Sabemos como comunicar num mercado onde a confiança se constrói pelo nome, pela reputação e pela proximidade — e traduzimos
              isso em estratégia digital que funciona no {city.landmarks[0]}, no {city.landmarks[1] || 'centro'} e em qualquer freguesia do concelho.
            </p>
          </div>
          <aside className="gb-surface-card h-fit">
            <h3 className="gb-text-h3 !text-xl text-ink-primary flex items-center gap-2"><Building2 size={20} className="text-brand-600" /> Sectores fortes</h3>
            <ul className="mt-4 space-y-2">
              {city.targetSectors.map(s => (
                <li key={s} className="flex items-start gap-2 text-ink-secondary"><CheckCircle2 size={16} className="mt-1 flex-shrink-0 text-brand-600" /> {s}</li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-black/[0.06] text-sm text-ink-tertiary">
              <div className="flex items-start gap-2 mb-2"><MapPin size={14} className="mt-1" /> {city.distanceFromHQ}</div>
              <div className="flex items-start gap-2"><Users size={14} className="mt-1" /> Presencial ou remoto</div>
            </div>
          </aside>
        </div>
      </section>

      {/* Serviços */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Serviços"
            title={`Serviços disponíveis em ${city.name}`}
            description={`Todos os serviços da Getboost estão disponíveis para empresas de ${city.name}, com atendimento remoto ou reuniões presenciais na Figueira.`}
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map((s, i) => (
              <motion.div key={s.href} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={s.href} onClick={() => analytics.trackClick('agency_local', 'agency_service', 'consideration')} className="group block h-full">
                  <div className="gb-surface-card gb-card-lift h-full">
                    <h3 className="gb-text-h3 !text-xl text-ink-primary group-hover:text-brand-600 transition-colors">{s.title}</h3>
                    <p className="gb-text-small mt-2 text-ink-secondary">{s.body}</p>
                    <span className="gb-link-more mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-600">Ver detalhes <ArrowRight size={14} /></span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outras cidades */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Cobertura"
            title="Também trabalhamos com PMEs em"
          />
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
            {CITY_LIST.filter(c => c.slug !== city.slug).map(c => (
              <Link key={c.slug} to={`/agencia-marketing-digital-${c.slug}`} className="group block">
                <div className="gb-surface-card gb-card-lift">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-ink-primary group-hover:text-brand-600">{c.name}</div>
                      <div className="text-xs text-ink-tertiary">{c.district}</div>
                    </div>
                    <ArrowRight size={16} className="text-brand-600" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 text-sm text-ink-tertiary">
            <TrendingUp size={18} className="text-brand-600" /> Presencial na Figueira da Foz, remoto em todo o país.
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
            <div className="relative">
              <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                Adoraria conhecer o teu projecto e trabalhar contigo.<br />
                <span style={{ color: ACCENT }}>Vamos criar algo extraordinário.</span>
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Diagnóstico gratuito de 7 minutos, sem compromisso, para PMEs de {city.name}.
              </p>
              <div className="mt-12 flex flex-wrap justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/booking" onClick={() => analytics.trackClick('agency_local_cta', 'agency_local_booking', 'consideration')}>
                    Agendar agora <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                  <a href={`mailto:${EMAIL}`} onClick={() => analytics.trackOutbound('email', 'agencia_local')}>
                    <Mail size={18} /> {EMAIL}
                  </a>
                </Button>
              </div>
              <div className="mt-8 text-sm text-white/50">
                {HQ_ADDRESS}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
