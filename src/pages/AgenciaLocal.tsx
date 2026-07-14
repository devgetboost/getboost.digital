import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Mail, CheckCircle2, Building2, Users, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { CITIES, CITY_LIST } from '@/data/localCities';

const ACCENT = '#ff4000';
const PHONE = '+351 963 574 400';
const EMAIL = 'geral@getboost.digital';
const HQ_ADDRESS = 'Rua Passeio Infante Dom Henrique, 22, Sala 33, 1º Piso, 3080-042 Figueira da Foz';

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
  const description = `Agência de marketing digital, software à medida e IA para PMEs em ${city.name}${city.district !== city.name ? ` (distrito de ${city.district})` : ''}. +20 anos, +1500 projetos. Sessão gratuita de diagnóstico.`;

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
      streetAddress: 'Rua Passeio Infante Dom Henrique, 22, Sala 33',
      addressLocality: 'Figueira da Foz',
      postalCode: '3080-042',
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
      <SEO
        title={title}
        description={description}
        canonical={`/agencia-marketing-digital-${city.slug}`}
        jsonLd={[localBusinessLd, faqLd, breadcrumbLd]}
      />

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6 md:px-12 bg-gradient-to-b from-[#1a0f08] to-[#0a0603] text-white overflow-hidden">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(circle at 20% 30%, ${ACCENT}40 0%, transparent 50%)` }} />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ background: `${ACCENT}20`, border: `1px solid ${ACCENT}40` }}>
              <MapPin size={16} style={{ color: ACCENT }} />
              <span className="text-sm font-medium">{city.name} · {city.district}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              Agência de <span style={{ color: ACCENT }}>Marketing Digital</span>,<br />
              Software & IA em {city.name}
            </h1>
            <p className="text-lg md:text-xl text-white/70 max-w-3xl mb-8 leading-relaxed">
              Ajudamos PMEs de {city.name} a crescer com estratégia digital, sites que convertem, campanhas Google/Meta Ads,
              automação com IA e SEO Local. Diagnóstico gratuito de 7 minutos.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/booking" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white transition-transform hover:scale-105" style={{ background: ACCENT }}>
                Agendar diagnóstico gratuito <ArrowRight size={18} />
              </Link>
              <a href={`tel:${PHONE.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold border border-white/30 hover:bg-white/10 transition-colors">
                <Phone size={18} /> {PHONE}
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contexto local */}
      <section className="py-20 px-6 md:px-12 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0a0603] mb-6">
              Porque trabalhamos com PMEs em {city.name}
            </h2>
            <p className="text-lg text-[#0a0603]/80 leading-relaxed mb-6">{city.economyIntro}</p>
            <p className="text-lg text-[#0a0603]/80 leading-relaxed">
              Sabemos como comunicar num mercado onde a confiança se constrói pelo nome, pela reputação e pela proximidade — e traduzimos
              isso em estratégia digital que funciona no {city.landmarks[0]}, no {city.landmarks[1] || 'centro'} e em qualquer freguesia do concelho.
            </p>
          </div>
          <aside className="bg-white rounded-3xl p-8 shadow-sm border border-black/5">
            <h3 className="font-bold text-[#0a0603] mb-4 flex items-center gap-2"><Building2 size={20} style={{ color: ACCENT }} /> Sectores fortes</h3>
            <ul className="space-y-2">
              {city.targetSectors.map(s => (
                <li key={s} className="flex items-start gap-2 text-[#0a0603]/80"><CheckCircle2 size={16} className="mt-1 flex-shrink-0" style={{ color: ACCENT }} /> {s}</li>
              ))}
            </ul>
            <div className="mt-6 pt-6 border-t border-black/10 text-sm text-[#0a0603]/60">
              <div className="flex items-start gap-2 mb-2"><MapPin size={14} className="mt-1" /> {city.distanceFromHQ}</div>
              <div className="flex items-start gap-2"><Users size={14} className="mt-1" /> Presencial ou remoto</div>
            </div>
          </aside>
        </div>
      </section>

      {/* Serviços */}
      <section className="py-20 px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0a0603] mb-4">Serviços disponíveis em {city.name}</h2>
          <p className="text-lg text-[#0a0603]/70 mb-12 max-w-3xl">
            Todos os serviços da Getboost estão disponíveis para empresas de {city.name}, com atendimento remoto ou reuniões presenciais na Figueira.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div key={s.href} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link to={s.href} className="block p-6 rounded-2xl border border-black/10 hover:border-[color:var(--accent)] hover:shadow-lg transition-all h-full group" style={{ ['--accent' as string]: ACCENT }}>
                  <h3 className="font-bold text-[#0a0603] mb-2 group-hover:text-[color:var(--accent)] transition-colors">{s.title}</h3>
                  <p className="text-sm text-[#0a0603]/70 mb-4">{s.body}</p>
                  <span className="text-sm font-semibold inline-flex items-center gap-1" style={{ color: ACCENT }}>Ver detalhes <ArrowRight size={14} /></span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Outras cidades */}
      <section className="py-20 px-6 md:px-12 bg-[#f5f3ef]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-[#0a0603] mb-8 flex items-center gap-2">
            <TrendingUp size={24} style={{ color: ACCENT }} /> Também trabalhamos com PMEs em
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CITY_LIST.filter(c => c.slug !== city.slug).map(c => (
              <Link key={c.slug} to={`/agencia-marketing-digital-${c.slug}`} className="p-4 bg-white rounded-xl border border-black/5 hover:border-[color:var(--accent)] transition-colors group" style={{ ['--accent' as string]: ACCENT }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#0a0603] group-hover:text-[color:var(--accent)]">{c.name}</div>
                    <div className="text-xs text-[#0a0603]/60">{c.district}</div>
                  </div>
                  <ArrowRight size={16} style={{ color: ACCENT }} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 md:px-12 bg-[#0a0603] text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Adoraria conhecer o teu projecto e trabalhar contigo.<br />
            <span style={{ color: ACCENT }}>Vamos criar algo extraordinário.</span>
          </h2>
          <p className="text-lg text-white/70 mb-8 max-w-2xl mx-auto">
            Diagnóstico gratuito de 7 minutos, sem compromisso, para PMEs de {city.name}.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-white" style={{ background: ACCENT }}>
              Agendar agora <ArrowRight size={18} />
            </Link>
            <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-semibold border border-white/30 hover:bg-white/10">
              <Mail size={18} /> {EMAIL}
            </a>
          </div>
          <div className="mt-8 text-sm text-white/50">
            {HQ_ADDRESS}
          </div>
        </div>
      </section>
    </Layout>
  );
}
