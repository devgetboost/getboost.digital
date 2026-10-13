import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Check,
  X,
  Search,
  Target,
  Share2,
  LayoutTemplate,
  Mail,
  Database,
  Workflow,
  BarChart3,
  TrendingUp,
  Megaphone,
  Globe,
  Gauge,
  MousePointerClick,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { ScrollDepth } from '@/components/ScrollDepth';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import ProcessTimeline from '@/components/ProcessTimeline';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CaseProofStrip } from '@/components/CaseProofStrip';
import { CountUp } from '@/components/ui/count-up';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import { analytics } from '@/lib/analytics';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

const GROWTH = PILLARS.growth;

/** Growth levers reuse existing service copy — no invented claims. */
const levers = [
  { icon: Search, title: 'SEO', desc: 'Tráfego orgânico que compõe' },
  { icon: Target, title: 'Google Ads', desc: 'Procura com intenção de compra' },
  { icon: Share2, title: 'Meta Ads', desc: 'Escala em paid social' },
  { icon: LayoutTemplate, title: 'Landing Pages', desc: 'Páginas focadas em conversão' },
  { icon: Mail, title: 'Email Marketing', desc: 'Nutrição e retenção' },
  { icon: Database, title: 'CRM', desc: 'Pipeline e follow-up' },
  { icon: Workflow, title: 'Marketing Automation', desc: 'Jornadas automáticas' },
  { icon: BarChart3, title: 'Analytics', desc: 'Atribuição por canal' },
  { icon: MousePointerClick, title: 'Conversão', desc: 'CRO e testes A/B' },
  { icon: TrendingUp, title: 'Growth Strategy', desc: 'Roadmap com North Star' },
];

/** Growth journeys (illustrative patterns — never measured metrics). */
const journeys = [
  { title: 'Orgânico que compõe', steps: ['SEO', 'Conteúdo', 'Posicionamento', 'Leads'] },
  { title: 'Pago que converte', steps: ['Ads', 'Landing', 'Conversão', 'Oportunidades'] },
  { title: 'Base que recompra', steps: ['CRM', 'Follow-up', 'Relacionamento', 'Cliente'] },
];

/** Benefit titles from the brief (numbers stay exclusively in the proof metrics). */
const benefits = [
  { icon: Gauge, title: 'Previsibilidade' },
  { icon: Megaphone, title: 'Aquisição' },
  { icon: MousePointerClick, title: 'Conversão' },
  { icon: TrendingUp, title: 'Escala' },
];

const ecosystem = [
  { icon: Search, label: 'SEO' },
  { icon: Globe, label: 'Google' },
  { icon: Share2, label: 'Meta' },
  { icon: LayoutTemplate, label: 'Landing Pages' },
  { icon: Database, label: 'CRM' },
  { icon: Mail, label: 'Email' },
  { icon: Workflow, label: 'Automação' },
  { icon: BarChart3, label: 'Analytics' },
];

const timeline = [
  { step: '01', title: 'Diagnóstico' },
  { step: '02', title: 'Estratégia' },
  { step: '03', title: 'Implementação' },
  { step: '04', title: 'Captação' },
  { step: '05', title: 'Conversão' },
  { step: '06', title: 'Otimização' },
  { step: '07', title: 'Escala' },
];

/**
 * R19.7 — Growth premium product page.
 * Mounts at the canonical /solucoes/marketing-digital route. SEO props
 * preserved byte-identical; routes, schema and tracking untouched.
 */
const MarketingDigital = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const relatedProducts = PRODUCTS.filter((p) => GROWTH.products.includes(p.slug));

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="growth" />
      <SEO
        title="Marketing Digital — Estratégia Integrada e Receita Previsível | Getboost Digital"
        description="Marketing digital ponta a ponta: estratégia, aquisição multi-canal, retenção, analytics e otimização contínua. Menos táticas soltas, mais receita mensurável."
        canonical="/solucoes/marketing-digital"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(22,163,74,0.10) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Growth · Sistema de Crescimento Escalável</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                O crescimento deixa de ser sorte quando existe um{' '}
                <span style={{ color: 'var(--gb-growth-strong)' }}>sistema por trás</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Combinamos aquisição, conversão, automação e dados para criar
                mecanismos de crescimento previsíveis e escaláveis.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('growth_hero', 'growth_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#estrategia">
                    Ver Estratégia
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
                {['SEO', 'Google Ads', 'Meta Ads', 'Conversão', 'Growth Systems'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: growth as a system output (illustrative). */}
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
                      <span className="gb-eyebrow text-ink-tertiary">Pipeline vivo</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        A converter
                      </span>
                    </div>
                    <MiniFlow
                      steps={['Tráfego', 'Landing Page', 'Lead', 'CRM', 'Oportunidade', 'Cliente', 'Crescimento']}
                      tint="var(--gb-growth-tint)"
                      strong="var(--gb-growth-strong)"
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
                      {[
                        { v: 'tráfego qualificado' },
                        { v: 'leads com origem' },
                        { v: 'receita atribuída' },
                      ].map((stat) => (
                        <div key={stat.v} className="rounded-xl bg-black/[0.03] px-2 py-3">
                          <div className="text-[11px] font-semibold text-ink-primary">{stat.v}</div>
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
            title="Campanhas isoladas não compõem crescimento"
            description="A diferença entre táticas soltas e um sistema que aprende todos os meses."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal i={0}>
              <div className="gb-card h-full opacity-80">
                <p className="gb-eyebrow text-ink-tertiary">Marketing tradicional</p>
                <MiniFlow
                  steps={['Campanhas isoladas', 'Leads dispersos', 'Pouco controlo', 'Resultados inconsistentes']}
                  tint="var(--gb-canvas-subtle)"
                  strong="var(--gb-ink-tertiary)"
                />
              </div>
            </Reveal>
            <Reveal i={1}>
              <div
                className="gb-card gb-card-lift h-full"
                style={{ ['--gb-glow' as string]: 'var(--gb-growth-glow)' }}
              >
                <p className="gb-eyebrow" style={{ color: 'var(--gb-growth-strong)' }}>Growth system</p>
                <MiniFlow
                  steps={['Aquisição', 'Conversão', 'Nutrição', 'Otimização', 'Escala']}
                  tint="var(--gb-growth-tint)"
                  strong="var(--gb-growth-strong)"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 03 COMO FUNCIONA */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como funciona"
            title="Cada euro entra com destino e sai com aprendizagem"
            description="Do clique à venda, cada etapa alimenta a seguinte — e a próxima iteração."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Tráfego', 'Captura', 'Conversão', 'CRM', 'Follow-up', 'Venda', 'Otimização']}
                tint="var(--gb-growth-tint)"
                strong="var(--gb-growth-strong)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 04 ALAVANCAS */}
      <section id="estrategia" className="gb-surface-section gb-section scroll-mt-24">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Alavancas de crescimento"
            title="Dez frentes, uma North Star"
            description="Combinamos as alavancas que o teu ciclo de venda exige — medidas no mesmo dashboard."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {levers.map((lever, i) => (
              <Reveal key={lever.title} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-growth-tint)', ['--gb-chip-fg' as string]: 'var(--gb-growth-strong)' }}
                  >
                    <lever.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{lever.title}</h3>
                  <p className="gb-text-small mt-2 text-ink-secondary">{lever.desc}</p>
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
            eyebrow="Jornadas de crescimento"
            title="Padrões que repetimos porque funcionam"
            description="Três arcos típicos — do primeiro clique ao cliente recorrente."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {journeys.map((journey, i) => (
              <Reveal key={journey.title} i={i}>
                <div className="gb-card gb-card-lift h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">{journey.title}</h3>
                  <MiniFlow
                    steps={journey.steps}
                    tint="var(--gb-growth-tint)"
                    strong="var(--gb-growth-strong)"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 06 ECOSSISTEMA */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Ecossistema"
            title="Tudo ligado, tudo medido"
            description="Canais, captura, nutrição e analytics no mesmo sistema — sem silos."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12 !p-8 md:!p-10">
              <div className="flex flex-col items-center gap-5">
                <span className="inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-base font-bold text-white shadow-premium" style={{ background: 'var(--gb-gradient-brand)' }}>
                  <TrendingUp className="h-5 w-5" />
                  Growth System Getboost
                </span>
                <div aria-hidden="true" className="h-6 w-px bg-black/10" />
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {ecosystem.map((item) => (
                    <span
                      key={item.label}
                      className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[13px] font-semibold text-ink-secondary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <item.icon className="h-4 w-4" style={{ color: 'var(--gb-growth-strong)' }} />
                      {item.label}
                    </span>
                  ))}
                </div>
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
            title="Crescimento que se mede em receita, não em cliques"
            description="Métricas de operações de growth em produção — com origem rastreada."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {GROWTH.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-growth-strong)' }}><CountUp value={p.k} /></div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} i={i}>
                <div className="gb-card gb-card-lift h-full !p-5 text-center">
                  <span
                    className="gb-icon-chip mx-auto"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-growth-tint)', ['--gb-chip-fg' as string]: 'var(--gb-growth-strong)' }}
                  >
                    <benefit.icon className="h-5 w-5" />
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
            title="Campanhas passam. Sistemas ficam."
            description="A diferença entre recomeçar todos os meses e compor crescimento."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Marketing tradicional</h3>
                <MiniFlow
                  steps={['Campanhas', 'Relatórios', 'Recomeçar']}
                  tint="var(--gb-canvas-subtle)"
                  strong="var(--gb-ink-tertiary)"
                />
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="rounded-2xl border border-growth-base/25 bg-white p-6 shadow-[0_18px_44px_-20px_var(--gb-growth-glow)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--gb-growth-strong)' }}>Getboost</h3>
                <MiniFlow
                  steps={['Sistema', 'Dados', 'Otimização', 'Aprendizagem', 'Escala']}
                  tint="var(--gb-growth-tint)"
                  strong="var(--gb-growth-strong)"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 09 TIMELINE */}
      <ProcessTimeline
        eyebrow="Implementação"
        title="Do diagnóstico à escala, em sprints mensais"
        description="Um processo fechado: cada fase tem dono, prazo e critério de saída."
        steps={timeline}
        hue={{ base: 'var(--gb-growth-base)', strong: 'var(--gb-growth-strong)', tint: 'var(--gb-growth-tint)' }}
      />

      {/* ==================================================== 10 PROVA */}
            {/* 10B CASOS — resultados de clientes (motor partilhado, sem conteúdo inventado) */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <CaseProofStrip
            slugs={['motivae', 'prosafe360']}
            tint="var(--gb-growth-tint)"
            strong="var(--gb-growth-strong)"
            trackingLocation="growth_cases"
          />
        </div>
      </section>

<section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Growth sobre produtos reais"
            description="Operamos os nossos próprios produtos com o mesmo sistema que instalamos nos clientes."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {relatedProducts.map((product, i) => (
              <Reveal key={product.slug} i={i}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'growth_proof')}>
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
            {/* OBJEÇÕES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Perguntas que ouvimos sempre"
            title="Dúvidas legítimas, respostas diretas"
            description="O que nos perguntam antes de avançar — respondido sem rodeios."
          />
          <div className="mt-12 grid gap-4 md:grid-cols-2">
              <Reveal key="objecao-0" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quando vemos resultados?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Trabalhamos em sprints mensais com um roadmap de 90 dias e KPIs ligados a receita — cada euro com destino e origem rastreada.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-1" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Já nos queimámos com agências.</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Percebemos. Aqui cada euro entra com destino e sai com aprendizagem, medido no mesmo dashboard — sem relatórios de vaidade.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-2" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Precisamos de contratar equipa interna?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não necessariamente. Operamos estratégia, execução e otimização por ti, com tudo visível no mesmo dashboard.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-3" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Como sei que está a funcionar?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Atribuição por canal: cada lead chega com origem conhecida, da captura ao fecho.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-4" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quanto custa?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Cada ciclo de venda é diferente. Conta-nos os canais e as metas e voltamos com um plano de crescimento em 48 horas — sem compromisso.</p>
                </div>
              </Reveal>
          </div>
        </div>
      </section>

<section className="gb-surface-page gb-section">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(ellipse, rgba(22,163,74,0.25) 0%, rgba(0,0,0,0) 65%)' }}
                animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }}
                transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Queres mais campanhas ou um sistema que gere crescimento{' '}
                  <span style={{ color: '#ff4000' }}>todos os meses</span>?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos os canais e as metas — voltamos com plano de
                  crescimento em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('growth_cta', 'growth_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`} onClick={() => analytics.trackClick('growth_cta', 'growth_contact', 'consideration')}>
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
        trackingSource="growth"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default MarketingDigital;
