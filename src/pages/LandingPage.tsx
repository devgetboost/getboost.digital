import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Check, X, Zap, ChevronDown } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CountUp } from '@/components/ui/count-up';
import { ScrollDepth } from '@/components/ScrollDepth';
import { analytics } from '@/lib/analytics';
import { openLeadMagnet } from '@/components/LeadMagnetModal';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import { getLanding } from '@/data/landings';
import NotFound from '@/pages/NotFound';
import { Reveal } from '@/components/ui/reveal';

const PILLAR_LABEL: Record<string, string> = {
  ai: 'IA',
  automation: 'Automação',
  software: 'Software',
  growth: 'Growth',
};

/**
 * R20.6 — SEO landing template (data-driven, zero duplication).
 * Hero → problem/solution → flow → benefits → proof → FAQ (schema) →
 * CTA. Internal linking V3: pillar → products → insights → booking.
 * Conversion: booking/contact CTAs + assessment entry (all tracked).
 */
export const LandingPage = ({ slug }: { slug: string }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language as 'pt' | 'en' | 'es';
  const landing = getLanding(slug);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  if (!landing) return <NotFound />;

  const pillar = PILLARS[landing.pillar];
  const relatedProducts = PRODUCTS.filter((p) => landing.products.includes(p.slug) && p.to);
  const bookingHref = lang === 'pt' ? '/booking' : `/${lang}/booking`;
  const contactHref = lang === 'pt' ? '/contact' : `/${lang}/contact`;
  const location = `landing_${slug.replace(/-/g, '_')}`;
  const track = (label: string) => analytics.trackClick(location, label, 'consideration');

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: landing.title,
      description: landing.description,
      url: `https://getboost.digital/${landing.slug}`,
      isPartOf: { '@type': 'WebSite', name: 'Getboost Digital', url: 'https://getboost.digital' },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://getboost.digital/' },
        { '@type': 'ListItem', position: 2, name: PILLAR_LABEL[landing.pillar], item: `https://getboost.digital${pillar.route}` },
        { '@type': 'ListItem', position: 3, name: landing.title, item: `https://getboost.digital/${landing.slug}` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: landing.faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.q,
        acceptedAnswer: { '@type': 'Answer', text: faq.a },
      })),
    },
  ];

  return (
    <Layout>
      <SEO
        title={landing.title}
        description={landing.description}
        canonical={`/${landing.slug}`}
        lang={lang}
        jsonLd={jsonLd}
      />
      <ScrollDepth location={location} />

      {/* HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <Link to={pillar.route} className="gb-eyebrow transition-colors hover:text-brand-600" style={{ color: `var(--gb-${landing.pillar}-strong)` }}>
                  {PILLAR_LABEL[landing.pillar]} · Getboost
                </Link>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                {landing.h1} <span style={{ color: `var(--gb-${landing.pillar}-strong)` }}>{landing.h1Accent}</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                {landing.sub}
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => track('booking')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    analytics.trackAssessment(landing.assessment, 'start', { source: `landing:${landing.slug}` });
                    openLeadMagnet(landing.assessment);
                  }}
                >
                  Fazer Avaliação
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {landing.chips.map((chip) => (
                  <span key={chip} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {chip}
                  </span>
                ))}
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="gb-card !p-6 !shadow-lg">
                <p className="gb-eyebrow text-ink-tertiary">Como funciona</p>
                <MiniFlow
                  steps={landing.flow}
                  tint={`var(--gb-${landing.pillar}-tint)`}
                  strong={`var(--gb-${landing.pillar}-strong)`}
                />
                <div className="mt-5 border-t border-black/[0.06] pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      analytics.trackAssessment(landing.assessment, 'start', { source: `landing:${landing.slug}` });
                      openLeadMagnet(landing.assessment);
                    }}
                    className="inline-flex items-center gap-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                    style={{ color: `var(--gb-${landing.pillar}-strong)` }}
                  >
                    <Zap className="h-4 w-4" />
                    Avaliar o meu caso em 3 minutos
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* PROBLEM / SOLUTION */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O problema"
            title={landing.problemTitle}
            description="O custo de não resolver — e o caminho para resolver."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal i={0}>
              <div className="gb-card h-full opacity-80">
                <p className="gb-eyebrow text-ink-tertiary">Hoje</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {landing.problemPoints.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-[15px] text-ink-tertiary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05]">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div
                className="gb-card gb-card-lift h-full"
                style={{ ['--gb-glow' as string]: `var(--gb-${landing.pillar}-glow)` }}
              >
                <p className="gb-eyebrow" style={{ color: `var(--gb-${landing.pillar}-strong)` }}>{landing.solutionTitle}</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {landing.solutionPoints.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-[15px] font-semibold text-ink-primary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: `var(--gb-${landing.pillar}-tint)` }}>
                        <Check className="h-3.5 w-3.5" style={{ color: `var(--gb-${landing.pillar}-strong)` }} />
                      </span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* BENEFITS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Benefícios"
            title="O que muda na operação"
            description="Resultados práticos, sem promessas vazias."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {landing.benefits.map((benefit, i) => (
              <Reveal key={benefit.title} i={i % 4}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">{benefit.title}</h3>
                  <p className="gb-text-small mt-2 text-ink-secondary">{benefit.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* PROOF — pillar metrics + related products (real assets only). */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Suportado por operações reais"
            description="Métricas do pilar e produtos que já correm em produção."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {pillar.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: `var(--gb-${landing.pillar}-strong)` }}>
                    <CountUp value={p.k} />
                  </div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
          {relatedProducts.length > 0 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {relatedProducts.map((product, i) => (
                <Reveal key={product.slug} i={i}>
                  <Link
                    to={product.to as string}
                    onClick={() => analytics.trackProduct(product.slug, 'click', `landing_${landing.slug}`)}
                    className="group block h-full"
                  >
                    <div className="gb-surface-card gb-card-lift h-full">
                      <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                      <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{product.name}</h3>
                      {product.tagline && (
                        <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                      )}
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ + schema */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <div className="mx-auto max-w-3xl">
            <SectionHeader
              eyebrow="Perguntas frequentes"
              title="Dúvidas comuns, respostas diretas"
              align="center"
            />
            <div className="mt-10 flex flex-col gap-3">
              {landing.faqs.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <div key={faq.q} className="gb-card !p-5">
                    <button
                      type="button"
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center justify-between gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                    >
                      <span className="font-semibold text-ink-primary">{faq.q}</span>
                      <ChevronDown className={`h-4 w-4 shrink-0 text-ink-tertiary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen && (
                      <p className="gb-text-body mt-3 text-ink-secondary">{faq.a}</p>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="gb-text-small mt-8 text-center text-ink-tertiary">
              Mais contexto no <Link to="/blog" onClick={() => track('insights')} className="gb-link-more font-medium text-brand-600">blog</Link>
              {' '}e nos <Link to="/resources" onClick={() => track('insights')} className="gb-link-more font-medium text-brand-600">recursos</Link>.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Pronto para aplicar isto ao teu negócio?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Diagnóstico gratuito de 30 minutos — saís com um plano concreto.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => track('booking')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={contactHref} onClick={() => track('contact')}>
                      Falar com Especialista
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    analytics.trackAssessment(landing.assessment, 'start', { source: `landing:${landing.slug}` });
                    openLeadMagnet(landing.assessment);
                  }}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <Zap className="h-4 w-4" />
                  ou faz a avaliação gratuita
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </Layout>
  );
};

// Default export convention kept for pages (named const above).
export default LandingPage;
