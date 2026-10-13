import { useState, useRef, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap, Check, X, Loader2 } from 'lucide-react';
import Layout from '@/components/Layout';
import { ScrollDepth } from '@/components/ScrollDepth';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import { analytics } from '@/lib/analytics';
import { useCaseStudies } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import { PRODUCTS, SAAS_PRODUCTS } from '@/data/products';
import { SOLUCOES_SUBMENU } from '@/data/solucoesSubmenu';
import { MARKET_CODES } from '@/lib/markets';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

// R1C6: the page renders published case studies from the Clean V1
// `case_studies` + `case_study_localizations` tables. An empty result
// renders the empty state — no static fallback exists by design.

/** R19.3 — the four pillars as one execution chain (spans only, no links). */
const executionChain = [
  { id: 'ai', name: 'IA' },
  { id: 'automation', name: 'Automação' },
  { id: 'software', name: 'Software' },
  { id: 'growth', name: 'Growth' },
];

/**
 * R20.7 — proof hub lanes. The page already carries the three bodies of
 * proof (case studies, own products, execution model); these lanes name and
 * reach them so the portfolio reads as a commercial asset, not a gallery.
 * Destinations are existing routes/anchors only — nothing invented.
 */
const proofLanes = [
  {
    id: 'casos',
    label: 'Casos',
    title: 'Histórias com desafio, decisão e resultado',
    desc: 'Cada caso segue o mesmo framework: contexto, desafio, diagnóstico, solução, implementação e resultado.',
    anchor: '#casos',
    route: '/casos-de-sucesso',
    routeLabel: 'Casos de sucesso',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    title: 'Plataformas próprias em produção',
    desc: 'Seis SaaS que desenhámos, desenvolvemos e operamos — a prova de execução de produto.',
    anchor: '#produtos',
    route: '/produtos',
    routeLabel: 'Catálogo',
  },
  {
    id: 'implementacoes',
    label: 'Implementações',
    title: 'Como cada projeto é construído',
    desc: 'IA, automação, software e growth combinados na mesma entrega — o modelo de execução.',
    anchor: '#implementacoes',
    route: null,
    routeLabel: null,
  },
];

/**
 * R19.3 — Portfolio rescue: from project gallery to execution proof.
 * Light premium hero, authority strip, storytelling case grid (no
 * horizontal hijack), own-products spotlight, execution chain, Why
 * Getboost, and conversion throughout. SEO block, routes, case data
 * and tracking architecture untouched.
 */
const Portfolio = () => {
  const { t, i18n } = useTranslation();
  const [filter, setFilter] = useState<string>('all');
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const { data: studies, loading } = useCaseStudies();

  const projects = (studies ?? []).map((study) => ({
    id: study.id,
    slug: study.slug,
    // The legacy `category` column became `industry` on the case-study parent.
    category: study.industry ?? 'web',
    title: study.title,
    client: study.clientName,
    // Clean V1 models work as capabilities + technologies rather than one tag list.
    tags: [...study.capabilities, ...study.technologies],
    description: study.summary ?? '',
    image: mediaUrl(study.heroMediaPath),
    capabilities: study.capabilities,
    technologies: study.technologies.slice(0, 3),
    featured: study.featured,
  }));
  // R19.3 — filters derive from real case data (the dormant filter logic
  // already supported categories; only 'all' was ever offered).
  const filters = ['all', ...Array.from(new Set(projects.map((p) => p.category)))];

  const filtered = filter === 'all' ? projects : projects.filter((p) => p.category === filter);
  const prefix = i18n.language === 'pt' ? '' : `/${i18n.language}`;
  const bookingHref = `${prefix}/booking`;
  const contactHref = `${prefix}/contact`;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="portfolio" />
      <SEO title={`${t('portfolio.title')} — Marketing Digital`} description={t('portfolioPage.heroSubtitle')} canonical="/portfolio" lang={i18n.language as 'pt' | 'en' | 'es'} />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Portefólio · Prova de execução</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                Construímos produtos, sistemas e{' '}
                <span className="text-brand-600">operações digitais reais</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Da IA ao software, da automação aos produtos SaaS — criamos
                soluções que já operam no mundo real.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('portfolio', 'portfolio_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={contactHref} onClick={() => analytics.trackClick('portfolio', 'portfolio_contact', 'consideration')}>
                    Falar com Especialista
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['Produtos Próprios', 'Software', 'IA', 'Automação', 'Growth'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: every project runs on the same four pillars. */}
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
                    <div className="flex items-center justify-between">
                      <span className="gb-eyebrow text-ink-tertiary">Como nasce cada projeto</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                        Em produção
                      </span>
                    </div>
                    <MiniFlow
                      steps={['IA', 'Automação', 'Software', 'Growth', 'Operação']}
                      tint="var(--gb-brand-50)"
                      strong="var(--gb-brand-600)"
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
                      {[
                        { k: `${SAAS_PRODUCTS.length}`, v: 'produtos próprios' },
                        { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços' },
                        { k: `${MARKET_CODES.length}`, v: 'mercados' },
                      ].map((stat) => (
                        <div key={stat.v}>
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

      {/* ==================================================== 02 AUTHORITY */}
      <section className="gb-surface-subtle gb-section !py-14">
        <div className="gb-container">
          <Reveal i={0}>
            <p className="gb-eyebrow text-center text-ink-tertiary">Autoridade verificável</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { k: `${SAAS_PRODUCTS.length}`, v: 'produtos próprios em produção' },
                { k: '4', v: 'pilares: IA · Automação · Software · Growth' },
                { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços especializados' },
                { k: `${MARKET_CODES.length}`, v: 'mercados ativos' },
              ].map((fact) => (
                <span key={fact.v} className="inline-flex items-center gap-2 text-sm text-ink-secondary">
                  <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <strong className="font-bold text-ink-primary">{fact.k}</strong> {fact.v}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 02B PROOF HUB */}
      <section className="gb-surface-page gb-section !py-16">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Três formas de veres o que construímos"
            description="Casos que provam o resultado, produtos que provam a capacidade, o modelo que prova a forma de trabalhar."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {proofLanes.map((lane, i) => (
              <Reveal key={lane.id} i={i}>
                <div className="gb-surface-card h-full">
                  <p className="gb-eyebrow text-brand-600">{lane.label}</p>
                  <h3 className="gb-text-h3 mt-3 !text-xl text-ink-primary">{lane.title}</h3>
                  <p className="gb-text-small mt-2 text-ink-secondary">{lane.desc}</p>
                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-black/[0.06] pt-4">
                    <a
                      href={lane.anchor}
                      onClick={() => analytics.trackClick('portfolio', `portfolio_hub_${lane.id}`, 'consideration')}
                      className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600"
                    >
                      Ver {lane.label.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
                    </a>
                    {lane.route && lane.routeLabel && (
                      <Link
                        to={lane.route}
                        onClick={() => analytics.trackClick('portfolio', `portfolio_hub_${lane.id}_route`, 'consideration')}
                        className="gb-link-more inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-tertiary transition-colors hover:text-ink-primary"
                      >
                        {lane.routeLabel}
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 03 CASES */}
      <section id="casos" className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Casos"
            title="Trabalhos selecionados"
            description="Cada projeto responde a três perguntas: qual era o desafio, o que construímos, onde vive hoje."
          />
          <div className="mt-8 flex flex-wrap gap-2.5">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
                className={`gb-chip cursor-pointer transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50 ${
                  filter === f ? '!border-brand-600 !bg-brand-600 !text-white' : 'hover:-translate-y-px'
                }`}
              >
                {f === 'all' ? t('portfolio.filters.all') : f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="gb-text-body py-20 text-center text-ink-secondary">Sem projetos nesta categoria.</div>
          ) : (
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {filtered.map((project, i) => (
                <Reveal key={project.id} i={i % 2}>
                  <Link to={`/portfolio/${project.slug}`} className="group block h-full">
                    <article className="gb-surface-card gb-card-lift h-full !p-0 overflow-hidden">
                      {project.image ? (
                        <img
                          alt={project.title}
                          src={project.image}
                          className="h-48 w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div aria-hidden="true" className="flex h-48 w-full items-center justify-center bg-canvas-subtle">
                          <span className="gb-eyebrow text-ink-tertiary">{project.category}</span>
                        </div>
                      )}
                      <div className="p-6 md:p-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="gb-chip">{project.category}</span>
                          {project.featured && (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ff4000]/10 px-3 py-1.5 text-[13px] font-semibold text-brand-600">
                              Destaque
                            </span>
                          )}
                        </div>
                        <h3 className="gb-text-h3 mt-4 text-ink-primary">{project.title}</h3>
                        {project.description && (
                          <p className="gb-text-small mt-2 leading-relaxed text-ink-secondary [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
                            {project.description}
                          </p>
                        )}
                        {project.technologies.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            {project.technologies.map((tech) => (
                              <span key={tech} className="rounded-md bg-black/[0.04] px-2 py-1 font-mono text-[11px] text-ink-secondary">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                          Ver resultado <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                        </span>
                      </div>
                    </article>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==================================================== 04 PRODUCTS */}
      <section id="produtos" className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Produtos próprios"
            title="Construímos produtos, não apenas websites"
            description="Seis plataformas desenhadas, desenvolvidas e operadas pela Getboost — a prova de que executamos produto, não só serviços."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.filter((p) => p.kind === 'saas' && p.to && p.tagline).map((product, i) => (
              <Reveal key={product.slug} i={i % 3}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'portfolio_proof')}>
                  <div className="gb-surface-card gb-card-lift h-full">
                    <div className="flex items-start justify-between gap-3">
                      <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                      {product.status && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                          {product.status}
                        </span>
                      )}
                    </div>
                    {product.category && (
                      <p className="gb-eyebrow mt-4 text-ink-tertiary">{product.category}</p>
                    )}
                    <h3 className="gb-text-h3 mt-2 text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 05 EXECUTION */}
      <section id="implementacoes" className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Execução"
            title="Todos os projetos nascem da mesma integração"
            description="IA, automação, software e growth combinados — em cada entrega, sem exceção."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <div className="flex flex-col items-stretch justify-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
                {executionChain.map((pillar, pi) => (
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
        </div>
      </section>

      {/* ==================================================== 06 WHY */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Diferença"
            title="Fornecedor entrega. Nós operamos."
            description="A comparação honesta entre contratar um projeto e ganhar um parceiro de operação."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Fornecedor tradicional</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {[
                    { weak: 'Entrega o projeto', note: 'fim do contrato' },
                    { weak: 'Passa o manual', note: 'boa sorte' },
                    { weak: 'Fim', note: 'sem evolução' },
                  ].map((item) => (
                    <li key={item.weak} className="flex items-center gap-3 text-[15px] text-ink-tertiary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05]">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      <span><strong className="font-semibold">{item.weak}</strong> — {item.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="rounded-2xl border border-[#ff4000]/25 bg-white p-6 shadow-[0_18px_44px_-20px_rgba(255,64,0,0.45)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-brand-600">Getboost</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {[
                    { strong: 'Constrói', note: 'software à medida' },
                    { strong: 'Opera', note: 'todos os dias' },
                    { strong: 'Melhora e escala', note: 'sem recomeçar' },
                  ].map((item) => (
                    <li key={item.strong} className="flex items-center gap-3 text-[15px] font-semibold text-ink-primary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff4000]/10">
                        <Check className="h-3.5 w-3.5 text-brand-600" />
                      </span>
                      <span><strong>{item.strong}</strong> <span className="font-normal text-ink-secondary">— {item.note}</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 07 MID CTA */}
      <section className="gb-surface-page gb-section !py-14">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="flex flex-col items-center justify-between gap-6 rounded-2xl border border-black/[0.06] bg-white px-8 py-8 shadow-premium md:flex-row md:px-10">
              <div>
                <h2 className="gb-text-h2 text-ink-primary">Tens um projeto em mente?</h2>
                <p className="gb-text-body mt-2 text-ink-secondary">Um diagnóstico gratuito mostra o caminho — sem compromisso.</p>
              </div>
              <Button asChild size="lg">
                <Link to={bookingHref} onClick={() => analytics.trackClick('portfolio', 'portfolio_mid_booking', 'consideration')}>
                  Agendar Diagnóstico
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
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
                  Pronto para construir a{' '}
                  <span style={{ color: '#ff4000' }}>próxima operação digital</span> do teu negócio?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos o contexto e os objectivos — voltamos com um plano
                  concreto em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('portfolio', 'portfolio_final_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={contactHref} onClick={() => analytics.trackClick('portfolio', 'portfolio_final_contact', 'consideration')}>
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
        trackingSource="portfolio"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default Portfolio;
