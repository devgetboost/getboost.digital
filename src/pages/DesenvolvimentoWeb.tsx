import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import ProcessTimeline from '@/components/ProcessTimeline';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CountUp } from '@/components/ui/count-up';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import { analytics } from '@/lib/analytics';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

const SOFTWARE = PILLARS.software;

/** What we build — titles from the brief, descriptors from existing platform copy. */
const buildTypes = [
  { icon: 'Layers', title: 'Plataformas SaaS', desc: 'Multi-tenant, billing e SLA' },
  { icon: 'Briefcase', title: 'Aplicações de Negócio', desc: 'Operação diária da empresa' },
  { icon: 'Cog', title: 'Sistemas de Backoffice', desc: 'Gestão interna sem fricção' },
  { icon: 'Workflow', title: 'Sistemas Operacionais', desc: 'Processos digitalizados' },
  { icon: 'BarChart3', title: 'Dashboards', desc: 'KPIs em tempo real' },
  { icon: 'Smartphone', title: 'Apps Mobile', desc: 'Nativas e híbridas' },
  { icon: 'Store', title: 'Marketplaces', desc: 'Catálogo, pagamentos e sellers' },
  { icon: 'Globe', title: 'Portais', desc: 'Clientes, parceiros e equipas' },
  { icon: 'Brain', title: 'Aplicações com IA', desc: 'Modelos integrados no produto' },
  { icon: 'Code2', title: 'Plataformas à Medida', desc: 'Arquitetura desenhada do zero' },
];

/** Product journeys (illustrative patterns — never measured metrics). */
const journeys = [
  { title: 'Do zero ao mercado', steps: ['Ideia', 'Wireframe', 'MVP', 'Validação', 'Produção'] },
  { title: 'Da operação à escala', steps: ['Operação', 'Automação', 'Escala'] },
  { title: 'Da intuição à decisão', steps: ['Equipa', 'Dashboard', 'KPIs', 'Decisão'] },
];

/** Benefit titles from the brief (numbers stay exclusively in the proof metrics). */
const benefits = [
  { icon: 'TrendingUp', title: 'Escalabilidade' },
  { icon: 'ShieldCheck', title: 'Controlo' },
  { icon: 'Zap', title: 'Velocidade' },
  { icon: 'Bot', title: 'Automação' },
  { icon: 'Layers', title: 'Centralização' },
  { icon: 'Gauge', title: 'Performance' },
];

const timeline = [
  { step: '01', title: 'Descoberta' },
  { step: '02', title: 'Planeamento' },
  { step: '03', title: 'UX/UI' },
  { step: '04', title: 'Desenvolvimento' },
  { step: '05', title: 'Testes' },
  { step: '06', title: 'Produção' },
  { step: '07', title: 'Evolução' },
];

/**
 * R19.6 — Software premium product page.
 * Mounts at the canonical /solucoes/desenvolvimento-software route. SEO
 * props preserved byte-identical; routes, schema and tracking untouched.
 */
const DesenvolvimentoWeb = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const relatedProducts = PRODUCTS.filter((p) => SOFTWARE.products.includes(p.slug));

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="software" />
      <SEO
        title="Desenvolvimento SaaS — Plataformas Multi-Tenant e Produtos Digitais | Getboost Digital"
        description="Construímos plataformas SaaS multi-tenant escaláveis: MVP, billing, IA integrada e operação pronta para SLA."
        canonical="/solucoes/desenvolvimento-software"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.10) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Software · Plataformas Escaláveis</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                Transformamos ideias em plataformas que crescem{' '}
                <span style={{ color: 'var(--gb-software-strong)' }}>durante anos</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Construímos software, aplicações web, plataformas SaaS e
                sistemas digitais preparados para escalar operações, equipas
                e clientes.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('software_hero', 'software_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#prova">
                    Ver Exemplos
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['SaaS', 'Web Apps', 'Mobile Apps', 'Escalabilidade', 'Arquitetura'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: an idea growing into a platform (illustrative). */}
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
                      <span className="gb-eyebrow text-ink-tertiary">Evolução do produto</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        A escalar
                      </span>
                    </div>
                    <MiniFlow
                      steps={['Ideia', 'Descoberta', 'MVP', 'Plataforma', 'Utilizadores', 'Escala']}
                      tint="var(--gb-software-tint)"
                      strong="var(--gb-software-strong)"
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
                      {[
                        { icon: 'Lightbulb', v: 'ideia validada' },
                        { icon: 'Rocket', v: 'MVP em 30 dias' },
                        { icon: 'Users', v: 'a crescer' },
                      ].map((stat) => (
                        <div key={stat.v} className="rounded-xl bg-black/[0.03] px-2 py-3">
                          <span className="mx-auto h-4 w-4" style={{ color: 'var(--gb-software-strong)' }} />
                          <div className="mt-1.5 text-[11px] font-semibold text-ink-primary">{stat.v}</div>
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

      {/* ==================================================== 02 PROBLEMA */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O problema"
            title="Ferramentas improvisadas partem quando cresces"
            description="A diferença entre remendar sistemas e operar sobre uma plataforma desenhada para escalar."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal i={0}>
              <div className="gb-card h-full opacity-80">
                <p className="gb-eyebrow text-ink-tertiary">Sistema improvisado</p>
                <MiniFlow
                  steps={['Ferramentas dispersas', 'Processos manuais', 'Dificuldade de crescimento']}
                  tint="var(--gb-canvas-subtle)"
                  strong="var(--gb-ink-tertiary)"
                />
              </div>
            </Reveal>
            <Reveal i={1}>
              <div
                className="gb-card gb-card-lift h-full"
                style={{ ['--gb-glow' as string]: 'var(--gb-software-glow)' }}
              >
                <p className="gb-eyebrow" style={{ color: 'var(--gb-software-strong)' }}>Software bem construído</p>
                <MiniFlow
                  steps={['Sistema centralizado', 'Processos digitais', 'Escalabilidade', 'Operação eficiente']}
                  tint="var(--gb-software-tint)"
                  strong="var(--gb-software-strong)"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 03 COMO CONSTRUÍMOS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como construímos"
            title="Da descoberta à evolução, sem saltar etapas"
            description="Cada fase tem dono, prazo e critério de saída — do primeiro wireframe à produção."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Discovery', 'Arquitetura', 'UX/UI', 'Desenvolvimento', 'Validação', 'Produção', 'Evolução']}
                tint="var(--gb-software-tint)"
                strong="var(--gb-software-strong)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 04 O QUE CONSTRUÍMOS */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O que construímos"
            title="Dez formatos, uma arquitetura"
            description="Combinamos os formatos que o teu contexto exige — sobre a mesma base escalável."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildTypes.map((type, i) => (
              <Reveal key={type.title} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-software-tint)', ['--gb-chip-fg' as string]: 'var(--gb-software-strong)' }}
                  >
                    <span className="h-5 w-5" style={{ color: 'var(--gb-software-strong)' }} />
                  </span>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{type.title}</h3>
                  <p className="gb-text-small mt-2 text-ink-secondary">{type.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 05 JORNADAS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Jornadas de produto"
            title="Padrões que repetimos porque funcionam"
            description="Três arcos típicos — do primeiro esboço à decisão orientada por dados."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {journeys.map((journey, i) => (
              <Reveal key={journey.title} i={i}>
                <div className="gb-card gb-card-lift h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">{journey.title}</h3>
                  <MiniFlow
                    steps={journey.steps}
                    tint="var(--gb-software-tint)"
                    strong="var(--gb-software-strong)"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 06 ARQUITETURA */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Arquitetura"
            title="Um sistema integrado, não peças soltas"
            description="Todas as camadas desenhadas em conjunto — do ecrã aos dados, da automação à IA."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12 !p-8 md:!p-10">
              <div className="flex flex-col items-center gap-5">
                <span className="inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-base font-bold text-white shadow-premium" style={{ background: 'var(--gb-gradient-brand)' }}>
                  <span className="h-5 w-5" style={{ color: 'var(--gb-software-strong)' }} />
                  Plataforma Getboost
                </span>
                <div aria-hidden="true" className="h-6 w-px bg-black/10" />
                <MiniFlow
                  steps={['Frontend', 'Backend', 'Database', 'Automações', 'AI', 'Analytics']}
                  tint="var(--gb-software-tint)"
                  strong="var(--gb-software-strong)"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 07 RESULTADOS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Resultados"
            title="O que uma plataforma bem construída devolve"
            description="Métricas de plataformas em produção — com origem rastreada."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {SOFTWARE.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-software-strong)' }}><CountUp value={p.k} /></div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} i={i}>
                <div className="gb-card gb-card-lift h-full !p-5 text-center">
                  <span
                    className="gb-icon-chip mx-auto"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-software-tint)', ['--gb-chip-fg' as string]: 'var(--gb-software-strong)' }}
                  >
                    <span className="h-5 w-5" style={{ color: 'var(--gb-software-strong)' }} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink-primary">{benefit.title}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 08 WHY GETBOOST */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Porquê a Getboost"
            title="Ferramenta entregue vs produto vivo"
            description="A diferença entre fechar um projeto e abrir uma plataforma."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Software tradicional</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {[
                    { weak: 'Projeto entregue', note: 'fim do contrato' },
                    { weak: 'Fim do projeto', note: 'sem evolução' },
                  ].map((item) => (
                    <li key={item.weak} className="flex items-center gap-3 text-[15px] text-ink-tertiary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05]">
                        <span className="h-3.5 w-3.5" style={{ color: 'var(--gb-ink-tertiary)' }} />
                      </span>
                      <span><strong className="font-semibold">{item.weak}</strong> — {item.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="rounded-2xl border border-software-base/25 bg-white p-6 shadow-[0_18px_44px_-20px_var(--gb-software-glow)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--gb-software-strong)' }}>Getboost</h3>
                <MiniFlow
                  steps={['Produto vivo', 'Melhoria contínua', 'Integração', 'Escalabilidade', 'Evolução']}
                  tint="var(--gb-software-tint)"
                  strong="var(--gb-software-strong)"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 09 TIMELINE */}
      <ProcessTimeline
        eyebrow="Implementação"
        title="Do esboço à evolução, com marcos claros"
        description="Um processo fechado: cada fase tem dono, prazo e critério de saída."
        steps={timeline}
        hue={{ base: 'var(--gb-software-base)', strong: 'var(--gb-software-strong)', tint: 'var(--gb-software-tint)' }}
      />

      {/* ==================================================== 10 PROVA */}
      <section id="prova" className="gb-surface-subtle gb-section scroll-mt-24">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Plataformas nossas, a correr em produção"
            description="Os produtos que desenhámos, construímos e operamos — todos os dias."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {relatedProducts.map((product, i) => (
              <Reveal key={product.slug} i={i}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'software_proof')}>
                  <div className="gb-surface-card gb-card-lift h-full">
                    <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                    <h3 className="gb-text-h3 mt-4 text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                    <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Conhecer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild variant="ghost">
              <Link to={i18n.language === 'pt' ? '/portfolio' : `/${i18n.language}/portfolio`}>
                Ver portefólio <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to={i18n.language === 'pt' ? '/produtos' : `/${i18n.language}/produtos`}>
                Ver todos os produtos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ==================================================== 11 FINAL CTA */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(ellipse, rgba(37,99,235,0.25) 0%, rgba(0,0,0,0) 65%)' }}
                animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }}
                transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  O teu negócio precisa de mais uma ferramenta ou de uma{' '}
                  <span style={{ color: '#ff4000' }}>plataforma preparada para crescer</span>?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos a ideia e o prazo — voltamos com arquitetura,
                  milestones e investimento em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('software_cta', 'software_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`} onClick={() => analytics.trackClick('software_cta', 'software_contact', 'consideration')}>
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
        trackingSource="software"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default DesenvolvimentoWeb;