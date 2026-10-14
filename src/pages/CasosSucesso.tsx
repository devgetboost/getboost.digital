import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { ScrollDepth } from '@/components/ScrollDepth';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import { analytics } from '@/lib/analytics';
import { openLeadMagnet } from '@/components/LeadMagnetModal';
import { METRICS } from '@/data/brandRegistry';
import { productPillars, pillarRoute } from '@/data/case-framework';
import type { StoredAudit } from '@/lib/auditHistory';

import { CASES, type CaseStudy, productSlugFor } from '@/data/cases';
import { Reveal } from '@/components/ui/reveal';

/**
 * R20.7 — published case narratives, verbatim. Titles, bodies, tags and
 * destinations below are shipped content (reused, never invented). Only
 * the presentation layer is premium.
 */

const PILLAR_LABEL: Record<string, string> = {
  ai: 'IA',
  automation: 'Automação',
  software: 'Software',
  growth: 'Growth',
};


/**
 * R20.7 — Cases hub on the premium template. Case narratives verbatim;
 * hero stats aligned to the brand registry (the legacy deliveries claim
 * conflicted with the single source of truth and is retired). Conversion via
 * booking/contact/audit + contextual assessment entry.
 */
const CasosSucesso = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);

  const track = (label: string) => analytics.trackClick('cases', label, 'consideration');
  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const contactHref = i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`;

  return (
    <Layout>
      <SEO
        title="Casos de Sucesso | Getboost Digital"
        description="PMEs e SaaS que escalaram com a Getboost: reposicionamento, funis, produto e IA. Casos reais, métricas concretas, sem letra pequena."
        canonical="/casos-de-sucesso"
        lang={i18n.language as 'pt' | 'en' | 'es'}
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Casos de Sucesso | Getboost Digital',
            description: 'PMEs e SaaS que escalaram com a Getboost.',
            url: 'https://getboost.digital/casos-de-sucesso',
          },
          {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Início', item: 'https://getboost.digital/' },
              { '@type': 'ListItem', position: 2, name: 'Casos de Sucesso', item: 'https://getboost.digital/casos-de-sucesso' },
            ],
          },
        ]}
      />
      <ScrollDepth location="cases" />

      {/* ==================================================== 01 HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
            <span className="gb-eyebrow text-brand-600">Casos de sucesso · SaaS · PMEs · Growth</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="ed-display mt-6 max-w-5xl text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]"
          >
            Resultados reais. <em>Clientes que escalaram.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="gb-text-body mt-6 max-w-2xl text-ink-secondary"
          >
            Não vendemos promessas. Mostramos empresas reais, decisões reais
            e as métricas que mudaram.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            <Button asChild size="lg">
              <Link to={bookingHref} onClick={() => track('booking')}>
                Quero um caso destes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/portfolio" onClick={() => track('portfolio')}>
                Ver portfólio completo
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 grid grid-cols-2 gap-6 border-t border-black/[0.06] pt-8 md:grid-cols-4"
          >
            {[
              { k: METRICS.projectsDelivered.value, v: 'Projectos entregues' },
              { k: '6', v: 'Produtos próprios' },
              { k: '21', v: 'Soluções no catálogo' },
              { k: '90d', v: 'Do briefing ao live' },
            ].map((s) => (
              <div key={s.v}>
                <div className="gb-text-h2 text-brand-600">{s.k}</div>
                <div className="gb-text-small mt-1 text-ink-secondary">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== 02 CASES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Os casos"
            title="Seis histórias, um padrão: execução"
            description="Desafio, solução e resultado — com os números que cada equipa viu mudar."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {CASES.map((f, i) => {
              const productSlug = productSlugFor(f.to);
              const pillars = productSlug ? productPillars(productSlug) : [];
              return (
                <Reveal key={f.title} i={i % 2}>
                  <article className="gb-surface-card gb-card-lift h-full">
                    <p className="gb-eyebrow text-ink-tertiary">{f.eyebrow}</p>
                    <h2 className="gb-text-h3 mt-3 text-ink-primary">{f.title}</h2>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {f.tags.map((tag) => (
                        <span key={tag} className="gb-chip">{tag}</span>
                      ))}
                    </div>
                    <p className="gb-text-body mt-4 text-ink-secondary">{f.body}</p>
                    <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/[0.06] pt-5">
                      {f.to && (
                        <Link
                          to={f.to}
                          onClick={() => track(`case_${productSlug}`)}
                          className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600"
                        >
                          Ver caso completo <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      {pillars.map((pillar) => (
                        <Link
                          key={pillar}
                          to={pillarRoute(pillar)}
                          onClick={() => track(`case_pillar_${pillar}`)}
                          className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-tertiary transition-colors hover:text-ink-primary"
                        >
                          Pilar {PILLAR_LABEL[pillar]}
                        </Link>
                      ))}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== 03 AVALIAÇÃO */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-card flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <SectionHeader
                  eyebrow="Diagnóstico"
                  title="Que resultado é possível no teu caso?"
                  description="Uma avaliação gratuita de 3 minutos mostra onde estás — e o caminho."
                />
              </div>
              <Button
                size="lg"
                onClick={() => {
                  analytics.trackAssessment('operations-score', 'start', { source: 'cases:assessment' });
                  openLeadMagnet('operations-score');
                }}
                className="shrink-0"
              >
                Fazer avaliação gratuita
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 04 FINAL CTA */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  O próximo <span style={{ color: '#ff4000' }}>caso de sucesso</span> pode ser{' '}
                  <span style={{ color: '#ff4000' }}>o teu</span>.
                </h2>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => track('booking_final')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={contactHref} onClick={() => track('contact_final')}>
                      Falar com Especialista
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <button
                  type="button"
                  onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
                  className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <Zap className="h-4 w-4" />
                  ou faz a auditoria grátis de 7 min
                </button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
        trackingSource="cases"
      />
    </Layout>
  );
};

export default CasosSucesso;
