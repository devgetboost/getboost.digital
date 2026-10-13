import { useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Check, X, Boxes } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CountUp } from '@/components/ui/count-up';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { analytics } from '@/lib/analytics';
import { PRODUCTS, SAAS_PRODUCTS, PLATFORM_PRODUCTS } from '@/data/products';
import { METRICS } from '@/data/brandRegistry';
import { SOLUCOES_SUBMENU } from '@/data/solucoesSubmenu';
import { MARKET_CODES } from '@/lib/markets';

const ACCENT = '#ff4000';

/** R19.9 — the four pillars as one company (spans only, no links). */
const pillarChain = [
  { id: 'ai', name: 'IA' },
  { id: 'automation', name: 'Automação' },
  { id: 'software', name: 'Software' },
  { id: 'growth', name: 'Growth' },
];

/**
 * R19.9 — Institutional page (canonical /sobre-nos).
 * Company voice throughout: technology, product and operation — never
 * personal narrative. SEO block preserved byte-identical; the consultant
 * conversion modal is preserved with its original configuration.
 */
const SobreNos = () => {
  const { i18n } = useTranslation();
  const [contactOpen, setContactOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const contactHref = i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`;

  return (
    <Layout>
    <ScrollDepth location="about" />
      <SEO
        title="Sobre Nós — Quem é a Getboost Digital"
        description="Somos uma casa técnica portuguesa que pensa, constrói e opera. Conhece a origem, missão, valores e método da Getboost Digital."
        canonical="/sobre-nos"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.08) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Sobre Nós · Getboost Digital · Desde 2019</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                Construímos tecnologia para ajudar empresas a{' '}
                <span className="text-brand-600">crescer</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                A Getboost combina inteligência artificial, automação, software
                e crescimento para criar sistemas digitais preparados para escalar.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={i18n.language === 'pt' ? '/solucoes' : `/${i18n.language}/solucoes`} onClick={() => analytics.trackClick('sobre_nos', 'sobre_solutions', 'consideration')}>
                    Conhecer Soluções
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={i18n.language === 'pt' ? '/equipa' : `/${i18n.language}/equipa`} onClick={() => analytics.trackClick('sobre_nos', 'sobre_team', 'consideration')}>
                    Falar com a Equipa
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            </div>

            {/* Hero visual: the company as one ecosystem (illustrative). */}
            <motion.div style={{ y: reduceMotion ? 0 : clusterY }} className="relative">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                  transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="gb-card !p-6 !shadow-lg">
                    <p className="gb-eyebrow text-ink-tertiary">Uma empresa, um ecossistema</p>
                    <MiniFlow
                      steps={['IA', 'Automação', 'Software', 'Growth']}
                      tint="var(--gb-brand-50)"
                      strong="var(--gb-brand-600)"
                    />
                    <div className="mt-5 grid grid-cols-2 gap-2 border-t border-black/[0.06] pt-4 text-center">
                      {[
                        { k: '2019', v: 'a construir' },
                        { k: `${SAAS_PRODUCTS.length}`, v: 'produtos próprios' },
                      ].map((stat) => (
                        <div key={stat.v} className="rounded-xl bg-black/[0.03] px-2 py-3">
                          <div className="gb-text-h3 text-brand-600">{stat.k}</div>
                          <div className="text-[11px] font-medium text-ink-tertiary">{stat.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ==================================================== 01B AUTORIDADE */}
      <section className="gb-surface-subtle gb-section !py-14">
        <div className="gb-container">
          <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
            {[
              { k: METRICS.yearsExperience.value, v: 'anos de engenharia' },
              { k: METRICS.projectsDelivered.value, v: 'projetos entregues' },
              { k: `${SAAS_PRODUCTS.length}`, v: 'produtos próprios em operação' },
              { k: '2019', v: 'a construir, sem parar' },
            ].map((stat, i) => (
              <motion.div
                key={stat.v}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="gb-text-h2 text-brand-600"><CountUp value={stat.k} /></div>
                <div className="gb-text-small mt-1 text-ink-secondary">{stat.v}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 02 EMPRESA HOJE */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="A Getboost hoje"
            title="Uma empresa de tecnologia, não uma agência"
            description="Quatro capacidades técnicas e um ecossistema de produtos próprios — a mesma equipa pensa, constrói e opera."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <div className="flex flex-col items-stretch justify-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
                {pillarChain.map((pillar, pi) => (
                  <Fragment key={pillar.id}>
                    {pi > 0 && (
                      <span aria-hidden="true" className="gb-flow-connector" style={{ ['--gb-flow-color' as string]: 'var(--gb-brand-500)' }} />
                    )}
                    <span
                      className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
                      style={{ background: `var(--gb-${pillar.id}-tint)`, borderColor: `var(--gb-${pillar.id}-border)`, color: `var(--gb-${pillar.id}-strong)` }}
                    >
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: `var(--gb-${pillar.id}-base)` }} />
                      {pillar.name}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { k: '2019', v: 'fundação', countable: false },
              { k: `${SAAS_PRODUCTS.length}`, v: 'produtos próprios', countable: true },
              { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços especializados', countable: true },
              { k: `${MARKET_CODES.length}`, v: 'mercados', countable: true },
            ].map((stat, i) => (
              <Reveal key={stat.v} i={i}>
                <div className="gb-card gb-card-lift h-full text-center">
                  <div className="gb-text-h2 text-brand-600">
                    {stat.countable ? <CountUp value={stat.k} /> : stat.k}
                  </div>
                  <p className="gb-text-small mt-2 text-ink-secondary">{stat.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 03 CONSTRUÍMOS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O que construímos"
            title="Software nosso, a correr em produção"
            description="Produtos SaaS e plataformas desenvolvidas e operadas pela Getboost."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SAAS_PRODUCTS.filter((p) => p.to && p.tagline).map((product, i) => (
              <Reveal key={product.slug} i={i % 3}>
                <Link to={product.to as string} className="group block h-full">
                  <div className="gb-surface-card gb-card-lift h-full">
                    <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                    <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="gb-eyebrow text-ink-tertiary">Plataformas:</span>
            {PLATFORM_PRODUCTS.map((product) => (
              <span key={product.slug} className="gb-chip">
                <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: product.accent }} />
                {product.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 04 MÉTODO */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como trabalhamos"
            title="Do diagnóstico à operação contínua"
            description="Um método fechado: cada fase tem dono, prazo e critério de saída."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Diagnóstico', 'Estratégia', 'Implementação', 'Operação', 'Escala']}
                tint="var(--gb-brand-50)"
                strong="var(--gb-brand-600)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 05 ABORDAGEM */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Abordagem"
            title="Ecossistemas, não projetos isolados"
            description="A diferença entre entregar e acompanhar."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Projetos isolados</h3>
                <MiniFlow
                  steps={['Entrega', 'Fim']}
                  tint="var(--gb-canvas-subtle)"
                  strong="var(--gb-ink-tertiary)"
                />
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="rounded-2xl border border-[#ff4000]/25 bg-white p-6 shadow-[0_18px_44px_-20px_rgba(255,64,0,0.45)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-brand-600">Ecossistemas digitais</h3>
                <MiniFlow
                  steps={['Construção', 'Melhoria contínua', 'Escalabilidade']}
                  tint="var(--gb-brand-50)"
                  strong="var(--gb-brand-600)"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 06 PROVA */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Execução verificável"
            description="Portefólio, produtos e casos — tudo consultável, nada por dizer."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {[
              { to: '/portfolio', title: 'Portefólio', desc: 'Trabalhos selecionados em produção' },
              { to: '/produtos', title: 'Produtos', desc: 'Software próprio em operação' },
              { to: '/casos-de-sucesso', title: 'Casos de sucesso', desc: 'Resultados com contexto' },
            ].map((proof, i) => (
              <Reveal key={proof.to} i={i}>
                <Link
                  to={i18n.language === 'pt' ? proof.to : `/${i18n.language}${proof.to}`}
                  className="group block h-full"
                  onClick={() => analytics.trackClick('sobre_nos', 'sobre_proof', 'consideration')}
                >
                  <div className="gb-surface-card gb-card-lift h-full">
                    <h3 className="gb-text-h3 !text-xl text-ink-primary">{proof.title}</h3>
                    <p className="gb-text-small mt-2 text-ink-secondary">{proof.desc}</p>
                    <span className="gb-link-more mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Explorar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 07 VISÃO */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Visão"
            title="PMEs a operar com sistemas de nível mundial"
            description="Uma casa técnica portuguesa que pensa, constrói e opera — e prova todos os dias que produto português compete lá fora."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <p className="gb-eyebrow text-ink-tertiary">Onde investimos o futuro</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {['IA aplicada', 'Automação', 'Produtos digitais', 'SaaS', 'Ecossistemas'].map((focus) => (
                  <span key={focus} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {focus}
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 08 FINAL CTA */}
      <section className="gb-surface-page gb-section !pt-0">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Pronto para construir a próxima geração da tua{' '}
                  <span style={{ color: '#ff4000' }}>operação digital</span>?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Fala com a equipa — voltamos com um plano concreto em menos
                  de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('sobre_nos', 'sobre_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={contactHref} onClick={() => analytics.trackClick('sobre_nos', 'sobre_contact', 'consideration')}>
                      Contactar Equipa
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
                <div className="mt-8">
                  <button
                    type="button"
                    onClick={() => setContactOpen((v) => !v)}
                    className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                  >
                    {contactOpen ? 'Fechar formulário' : 'ou escreve-nos aqui'}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </Reveal>
          <ConsultantContactForm
            open={contactOpen}
            onClose={() => setContactOpen(false)}
            service={{
              slug: 'sobre-nos',
              name: 'Getboost Digital',
              accent: ACCENT,
              eyebrow: 'Contacto · Getboost',
              headline: 'Diz-nos em que podemos ajudar.',
              subhead: 'Seja um projecto novo, uma parceria ou apenas uma conversa exploratória, respondemos em menos de 24h.',
              goalOptions: [
                'Novo projecto digital',
                'Escalar produto existente',
                'Consultoria estratégica',
                'Parceria comercial',
                'Ainda a explorar',
              ],
              messagePlaceholder: 'Contexto, objectivos, timings, qualquer detalhe útil…',
            }}
          />
        </div>
      </section>
    </Layout>
  );
};

export default SobreNos;
