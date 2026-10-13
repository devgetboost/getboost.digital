import { useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Zap,
  Check,
  X,
  Bot,
  Megaphone,
  Code2,
  Workflow,
  LineChart,
  Target,
  Palette,
  Globe,
  MessageSquare,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { ScrollDepth } from '@/components/ScrollDepth';
import { analytics } from '@/lib/analytics';
import SEO, { organizationSchema } from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { useContentEntries } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import { CountUp } from '@/components/ui/count-up';
import { MiniFlow } from '@/components/ui/mini-flow';
import { PRODUCTS, SAAS_PRODUCTS } from '@/data/products';
import { SOLUCOES_SUBMENU } from '@/data/solucoesSubmenu';
import { MARKET_CODES } from '@/lib/markets';
import { METRICS } from '@/data/brandRegistry';
import type { StoredAudit } from '@/lib/auditHistory';
import logoPikto from '@/assets/logos/logo-pikto.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoAgrifly from '@/assets/logos/logo-agrifly.svg';
import logoKasccab from '@/assets/logos/logo-kasccab.svg';
import { Reveal } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

// R19.8 — marquee shows current catalog products + client brands only.
// Superseded product logos (Hostify, ProSafe360) removed with the catalog.
const clientLogos = [
  { name: 'Pikto', src: logoPikto },
  { name: 'Motivae', src: logoMotivae },
  { name: 'Qook', src: logoQook },
  { name: 'Agrifly', src: logoAgrifly },
  { name: 'Kasccab', src: logoKasccab },
];

/**
 * Wave 3C — homepage per GETBOOST_2027_DESIGN_FREEZE_V1.
 * Frozen order: Hero · Proof Bar · Business Systems · Four Pillars ·
 * Case Studies · Products · Method · Insights · Final CTA.
 * Light theme, no autoplay, products as proof, four-pillar positioning.
 */

type Pillar = {
  id: 'ai' | 'automation' | 'software' | 'growth';
  eyebrow: string;
  title: string;
  body: string;
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  /** R18.9 — mini visual flow rendered under the tags (copy-adjacent, never replacing text). */
  flow: string[];
  /** R18.9 — status badges (AI pillar only). */
  badges?: string[];
};

const pillars: Pillar[] = [
  {
    id: 'ai',
    eyebrow: 'IA',
    title: 'IA que atende, qualifica e agenda por ti',
    body: 'Instalamos agentes autónomos no teu site, WhatsApp e redes. Conversam de forma natural, percebem intenção real, filtram curiosos e marcam reuniões na tua agenda — 24/7.',
    tags: ['Atendimento autónomo', 'Qualificação de leads', 'Agenda comercial', 'WhatsApp · Web · Instagram'],
    icon: Bot,
    href: '/agentes-ia',
    flow: ['Visitante', 'AI Agent', 'Qualificação', 'Reunião', 'Venda'],
    badges: ['Online', '24/7', 'Resposta instantânea'],
  },
  {
    id: 'automation',
    eyebrow: 'Automação',
    title: 'Processos internos automatizados de ponta a ponta',
    body: 'Ligamos as ferramentas que já usas, eliminamos copy-paste manual e criamos agentes internos para relatórios, propostas, follow-ups e validação documental. A tua equipa decide — o resto executa-se sozinho.',
    tags: ['CRM & ERP', 'Integrações', 'Back-office IA', 'Fluxos personalizados'],
    icon: Workflow,
    href: '/solucoes/integracoes-erp-crm',
    flow: ['WhatsApp', 'CRM', 'ERP', 'Relatórios', 'Gestão'],
  },
  {
    id: 'software',
    eyebrow: 'Software',
    title: 'Produto digital construído para escalar sem re-escrever',
    body: 'Desenvolvemos software à medida quando o mercado não tem uma resposta suficientemente boa. Do MVP ao produto multi-tenant, sem dívida técnica desde o dia zero.',
    tags: ['Web apps', 'SaaS', 'Mobile', 'MVP em 30 dias'],
    icon: Code2,
    href: '/solucoes/desenvolvimento-software',
    flow: ['Ideia', 'MVP', 'Produção', 'Escala'],
  },
  {
    id: 'growth',
    eyebrow: 'Growth',
    title: 'Tráfego pago e SEO que geram pipeline, não vaidade',
    body: 'Combinamos aquisição paga, SEO e páginas de conversão desenhadas para uma única acção: preencher a agenda comercial. Cada euro tem destino, cada lead tem origem.',
    tags: ['Google & Meta Ads', 'SEO técnico', 'Landing pages', 'CRO'],
    icon: LineChart,
    href: '/solucoes/marketing-digital',
    flow: ['SEO · Ads', 'Landing Pages', 'Pipeline', 'Leads', 'Clientes'],
  },
];

const systems = [
  {
    icon: Megaphone,
    title: 'Aquisição',
    body: 'Tráfego qualificado de canais pagos e orgânicos, com origem rastreada em cada lead.',
    pillar: 'Growth',
  },
  {
    icon: Target,
    title: 'Conversão',
    body: 'Páginas, funis e agentes de IA que transformam visitas em reuniões comerciais.',
    pillar: 'IA',
  },
  {
    icon: BarChart3,
    title: 'Operação',
    body: 'Processos internos automatizados e software que escala sem heroísmos.',
    pillar: 'Automação · Software',
  },
];

const caseStudies = [
  { k: '+300%', v: 'crescimento orgânico médio em 6 meses', pillar: 'Growth', flow: ['SEO', 'Arquitetura técnica + Conteúdo'] },
  { k: '−70%', v: 'tempo em tarefas administrativas', pillar: 'Automação', flow: ['Automação', 'Eliminação de tarefas repetitivas'] },
  { k: '5x', v: 'reuniões comerciais qualificadas', pillar: 'IA', flow: ['IA', 'Qualificação 24/7'] },
];

const method = [
  { step: '01', title: 'Auditoria comercial', body: 'Em 7 minutos analisamos o teu site, presença digital e funil actual. Sais com um relatório concreto do que está a travar vendas.' },
  { step: '02', title: 'Plano de ataque', body: 'Traduzimos a auditoria num roadmap de 90 dias com prioridades, entregáveis semanais e KPIs ligados a receita.' },
  { step: '03', title: 'Execução obsessiva', body: 'Equipa dedicada em design, código, IA e media. Reuniões semanais, dashboards partilhados e decisões documentadas.' },
  { step: '04', title: 'Escala e optimização', body: 'Quando o motor gira, subimos a velocidade: mais canais, mais automações, mais mercados.' },
];

/** R18.6 — hero entrance: fade-up with per-item delay. */
const heroItem = {
  hidden: { opacity: 0, y: 30 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 + i * 0.12, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

/** R18.6 — subtle float loop for the hero ecosystem cards (disabled on reduced motion). */
const Float = ({ children, i = 0, reduce = false }: { children: React.ReactNode; i?: number; reduce?: boolean }) => (
  <motion.div
    animate={reduce ? undefined : { y: [0, -8, 0] }}
    transition={reduce ? undefined : { duration: 5 + i * 1.3, repeat: Infinity, ease: 'easeInOut' }}
  >
    {children}
  </motion.div>
);

const Index = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  // Insights band — latest published entries through the content layer.
  const { data: latestEntries } = useContentEntries({ contentType: 'insight', limit: 3 });

  // R18.6 — subtle scroll parallax for the hero ecosystem (disabled on reduced motion).
  const reduceMotion = useReducedMotion() ?? false;
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  // R18.7 — subtle scroll parallax for the results + final CTA (±20px).
  const casesRef = useRef<HTMLElement>(null);
  const { scrollYProgress: casesProgress } = useScroll({ target: casesRef, offset: ['start end', 'end start'] });
  const casesY = useTransform(casesProgress, [0, 1], [20, -20]);
  const ctaRef = useRef<HTMLElement>(null);
  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ['start end', 'end start'] });
  const ctaY = useTransform(ctaProgress, [0, 1], [16, -16]);

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="homepage" />
      <SEO
        title="Getboost Digital — Agentes IA, Growth e Software que geram clientes"
        description="Transformamos empresas com agentes de IA autónomos, marketing digital orientado a receita e software à medida. Auditoria comercial gratuita em 7 minutos."
        canonical="/"
        lang={i18n.language as 'pt' | 'en' | 'es'}
        jsonLd={organizationSchema}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 top-1/3 h-[480px] w-[480px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.08) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Left — headline, sub, CTAs, trust */}
            <div>
              <motion.div initial="hidden" animate="show" variants={heroItem} custom={0}>
                <span className="gb-eyebrow text-brand-600">Software, IA &amp; Automação para PMEs</span>
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="show"
                variants={heroItem}
                custom={1}
                className="gb-text-display mt-5 text-ink-primary"
              >
                IA. Software. Automação.
                <br />
                Tudo ligado para gerar <span className="text-brand-600">crescimento</span>.
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="show"
                variants={heroItem}
                custom={2}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                A Getboost ajuda empresas a crescer com AI Agents, software à
                medida, automação e growth orientado a receita — sistemas
                completos, não tarefas soltas.
              </motion.p>
              <motion.div
                initial="hidden"
                animate="show"
                variants={heroItem}
                custom={3}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link
                    to={i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`}
                    onClick={() => analytics.trackClick('hero', 'hero_booking', 'consideration')}
                  >
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link
                    to={i18n.language === 'pt' ? '/solucoes' : `/${i18n.language}/solucoes`}
                    onClick={() => analytics.trackClick('hero', 'hero_solutions', 'consideration')}
                  >
                    Ver Soluções
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={heroItem}
                custom={4}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['AI Agents', 'Software', 'Automação', 'Growth'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
              {/* R20.15 — proof in the first scroll: shipped client metrics. */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={heroItem}
                custom={5}
                className="mt-4 flex flex-wrap gap-2.5"
              >
                {[
                  { k: '+312% MQLs', v: 'Hospitality' },
                  { k: '+8x sessões', v: 'Motivae' },
                  { k: '+140% trials', v: 'Pikto' },
                ].map((proof) => (
                  <Link
                    key={proof.v}
                    to="/casos-de-sucesso"
                    onClick={() => analytics.trackClick('hero', 'hero_proof', 'consideration')}
                    className="gb-chip transition-all duration-200 hover:-translate-y-px"
                  >
                    <span className="font-bold text-brand-600">{proof.k}</span>
                    {proof.v}
                  </Link>
                ))}
              </motion.div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={heroItem}
                custom={6}
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2"
              >
                <button
                  type="button"
                  onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4000]/50"
                >
                  <Zap className="h-4 w-4" />
                  Auditoria grátis 7 min
                </button>
                <span className="gb-text-small text-ink-tertiary">
                  Resposta em menos de 48 horas · 30 min, online, 0€
                </span>
              </motion.div>
            </div>

            {/* Right — interface-first visual ecosystem (illustrative, not data) */}
            <motion.div style={{ y: reduceMotion ? 0 : clusterY }} className="relative">
              <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2">
                {/* CARD 1 — AI Agent */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Float i={0} reduce={reduceMotion}>
                    <div className="gb-card !rounded-2xl !p-5 !shadow-lg bg-white/90 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--gb-ai-tint)] text-[var(--gb-ai-base)]">
                            <Bot className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-semibold text-ink-primary">AI Agent</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                          </span>
                          Online
                        </span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-black/[0.03] p-3">
                          <div className="text-2xl font-extrabold tracking-tight text-ink-primary">24</div>
                          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Leads</div>
                        </div>
                        <div className="rounded-xl bg-black/[0.03] p-3">
                          <div className="text-2xl font-extrabold tracking-tight text-ink-primary">8</div>
                          <div className="text-[11px] font-medium uppercase tracking-wider text-ink-tertiary">Reuniões</div>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 text-[13px] leading-snug">
                        <span className="w-fit max-w-full rounded-xl rounded-bl-sm bg-black/[0.05] px-3 py-2 text-ink-secondary">
                          Preciso de um orçamento
                        </span>
                        <span className="w-fit max-w-full self-end rounded-xl rounded-br-sm bg-[var(--gb-ai-tint)] px-3 py-2 font-medium text-[var(--gb-ai-strong)]">
                          Reunião marcada para amanhã, 10h ✓
                        </span>
                      </div>
                    </div>
                  </Float>
                </motion.div>

                {/* CARD 2 — Pipeline */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.47, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="sm:translate-y-8"
                >
                  <Float i={1} reduce={reduceMotion}>
                    <div className="gb-card !rounded-2xl !p-5 !shadow-lg bg-white/90 backdrop-blur">
                      <div className="gb-eyebrow text-ink-tertiary">Pipeline</div>
                      <div className="mt-3 flex flex-col">
                        {[
                          { label: 'Lead', done: true },
                          { label: 'Qualificação', done: true },
                          { label: 'Reunião', done: false, active: true },
                          { label: 'Venda', done: false },
                        ].map((step, idx, arr) => (
                          <div key={step.label} className="relative flex gap-3 pb-4 last:pb-0">
                            {idx < arr.length - 1 && (
                              <span aria-hidden className="absolute left-[7px] top-5 h-[calc(100%-1rem)] w-px bg-black/10" />
                            )}
                            <span
                              className={`mt-1 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full ${
                                step.done ? 'bg-[var(--gb-automation-base)]' : step.active ? 'bg-white ring-2 ring-[var(--gb-automation-base)]' : 'bg-black/10'
                              }`}
                            >
                              {step.done && <Check className="h-2.5 w-2.5 text-white" />}
                              {step.active && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--gb-automation-base)]" />}
                            </span>
                            <span className={`text-sm ${step.done || step.active ? 'font-semibold text-ink-primary' : 'text-ink-tertiary'}`}>
                              {step.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Float>
                </motion.div>

                {/* CARD 3 — Dashboard */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.59, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Float i={2} reduce={reduceMotion}>
                    <div className="gb-card !rounded-2xl !p-5 !shadow-lg bg-white/90 backdrop-blur">
                      <div className="gb-eyebrow text-ink-tertiary">Dashboard</div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
                        {[
                          { k: 'Conversão', v: '+38%' },
                          { k: 'Receita', v: '€48k' },
                          { k: 'Automações', v: '12' },
                          { k: 'Operações', v: '98%' },
                        ].map((stat) => (
                          <div key={stat.k} className="rounded-xl bg-black/[0.03] p-2.5">
                            <div className="text-base font-extrabold tracking-tight text-[var(--gb-software-strong)]">{stat.v}</div>
                            <div className="text-[11px] font-medium text-ink-tertiary">{stat.k}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex h-12 items-end gap-1.5" aria-hidden="true">
                        {[38, 62, 48, 78, 58, 88, 72].map((h, bi) => (
                          <motion.span
                            key={bi}
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ delay: 0.8 + bi * 0.07, duration: 0.4, ease: 'easeOut' }}
                            className="w-full origin-bottom rounded-sm bg-gradient-to-t from-[var(--gb-software-border)] to-[var(--gb-software-base)]"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </Float>
                </motion.div>

                {/* CARD 4 — Workflow */}
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.71, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="sm:translate-y-8"
                >
                  <Float i={3} reduce={reduceMotion}>
                    <div className="gb-card !rounded-2xl !p-5 !shadow-lg bg-white/90 backdrop-blur">
                      <div className="gb-eyebrow text-ink-tertiary">Workflow</div>
                      <div className="mt-3 flex flex-col items-stretch gap-1">
                        {['WhatsApp', 'CRM', 'ERP', 'Relatório'].map((node, ni, arr) => (
                          <div key={node} className="flex flex-col items-stretch">
                            <span className="rounded-xl border border-[var(--gb-growth-border)] bg-[var(--gb-growth-tint)] px-3 py-2 text-center text-[13px] font-semibold text-[var(--gb-growth-strong)]">
                              {node}
                            </span>
                            {ni < arr.length - 1 && (
                              <ArrowRight className="mx-auto h-3.5 w-3.5 rotate-90 text-[var(--gb-growth-base)] opacity-60" aria-hidden="true" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </Float>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* ================================================= 02 PROOF BAR */}
      <section className="gb-surface-subtle gb-section !py-14">
        <div className="gb-container">
          <p className="gb-eyebrow text-center text-ink-tertiary">Marcas que já correm com a nossa tecnologia</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
            {clientLogos.map((logo) => (
              <img
                key={logo.name}
                src={logo.src}
                alt={logo.name}
                className="h-9 w-auto object-contain opacity-50 transition-opacity hover:opacity-100 md:h-11"
                style={{ filter: 'brightness(0) saturate(100%) invert(36%) sepia(8%) saturate(1063%) hue-rotate(314deg) brightness(94%) contrast(87%)' }}
                loading="lazy"
              />
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4">
            {[
              { k: METRICS.projectsDelivered.value, v: 'Projectos entregues' },
              { k: '24/7', v: 'Agentes IA a operar' },
              { k: '<30d', v: 'Do briefing ao MVP' },
              { k: '3x', v: 'Leads qualificadas médias' },
            ].map((stat, i) => (
              <Reveal key={stat.v} i={i} className="text-center">
                <div className="gb-text-h2 text-brand-600"><CountUp value={stat.k} /></div>
                <div className="gb-text-small mt-1 text-ink-secondary">{stat.v}</div>
              </Reveal>
            ))}
          </div>
          {/* R18.10 — trust strip: only claims verifiable from the codebase. */}
          <div className="mt-10 border-t border-black/[0.06] pt-6">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
              {[
                { k: `${SAAS_PRODUCTS.length}`, v: 'produtos próprios' },
                { k: `${pillars.length}`, v: 'pilares tecnológicos' },
                { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços especializados' },
                { k: `${MARKET_CODES.length}`, v: 'mercados' },
              ].map((fact) => (
                <span key={fact.v} className="inline-flex items-center gap-2 text-sm text-ink-secondary">
                  <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                  <strong className="font-bold text-ink-primary">{fact.k}</strong> {fact.v}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* =========================================== 03 BUSINESS SYSTEMS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Sistemas, não tarefas"
            title="Três sistemas que se conectam"
            description="Cada peça funciona sozinha. Juntas, transformam o teu digital num sistema que atrai, converte e opera sem depender de heroísmos individuais."
            proof="Aquisição, conversão e operação a partilharem os mesmos dados."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {systems.map((system, i) => (
              <Reveal key={system.title} i={i}>
                <div className="gb-surface-card gb-card-lift h-full">
                  <span className="gb-icon-chip">
                    <system.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gb-text-h3 mt-5 text-ink-primary">{system.title}</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">{system.body}</p>
                  <p className="gb-eyebrow mt-6 text-ink-tertiary">{system.pillar}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================ 04 FOUR PILLARS */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O que fazemos"
            title="Quatro alavancas para crescer com previsibilidade"
            description="IA, Automação, Software e Growth — as quatro capacidades que combinamos para construir sistemas digitais completos."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {pillars.map((pillar, i) => (
              <Reveal key={pillar.id} i={i}>
                <div
                  className="gb-surface-pillar-card gb-card-lift h-full"
                  style={{
                    ['--gb-pillar' as string]: `var(--gb-${pillar.id}-base)`,
                    ['--gb-glow' as string]: `var(--gb-${pillar.id}-glow)`,
                  }}
                >
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: `var(--gb-${pillar.id}-tint)`, ['--gb-chip-fg' as string]: `var(--gb-${pillar.id}-strong)` }}
                  >
                    <pillar.icon className="h-5 w-5" />
                  </span>
                  <p className="gb-eyebrow mt-5" style={{ color: `var(--gb-${pillar.id}-strong)` }}>
                    {pillar.eyebrow}
                  </p>
                  <h3 className="gb-text-h3 mt-2 text-ink-primary">{pillar.title}</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">{pillar.body}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {pillar.tags.map((tag) => (
                      <span
                        key={tag}
                        className="gb-chip"
                        style={{ background: `var(--gb-${pillar.id}-tint)`, borderColor: `var(--gb-${pillar.id}-border)` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  {/* R18.9 — mini visual flow: entry → decision → outcome. */}
                  <MiniFlow
                    steps={pillar.flow}
                    tint={`var(--gb-${pillar.id}-tint)`}
                    strong={`var(--gb-${pillar.id}-strong)`}
                    badges={pillar.badges}
                  />
                  <Link
                    to={pillar.href}
                    className="gb-link-more mt-7 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] transition-colors"
                    style={{ color: `var(--gb-${pillar.id}-strong)` }}
                  >
                    Ver {pillar.eyebrow.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
          {/* R18.10 — authority strip: the four pillars as one ecosystem (spans only, no links). */}
          <Reveal i={0} className="mt-12">
            <div className="rounded-2xl border border-black/[0.06] bg-white px-6 py-5 shadow-premium">
              <p className="gb-eyebrow text-center text-ink-tertiary">Um ecossistema, não serviços soltos</p>
              <div className="mt-4 flex flex-col items-stretch justify-center gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
                {pillars.map((pillar, pi) => (
                  <Fragment key={pillar.id}>
                    {pi > 0 && (
                      <span aria-hidden="true" className="gb-flow-connector" style={{ ['--gb-flow-color' as string]: 'var(--gb-brand-500)' }} />
                    )}
                    <span
                      className="inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold"
                      style={{ background: `var(--gb-${pillar.id}-tint)`, borderColor: `var(--gb-${pillar.id}-border)`, color: `var(--gb-${pillar.id}-strong)` }}
                    >
                      <span aria-hidden="true" className="h-2 w-2 rounded-full" style={{ background: `var(--gb-${pillar.id}-base)` }} />
                      {pillar.eyebrow}
                    </span>
                  </Fragment>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================================================== 05 CASE STUDIES */}
      <section ref={casesRef} className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova real"
            title="Não vendemos promessas. Vendemos operações que já funcionam."
            description="Resultados médios de projectos em produção — cada número com origem rastreada e dono responsável."
          />
          <motion.div style={{ y: reduceMotion ? 0 : casesY }} className="mt-12 grid gap-6 md:grid-cols-3">
            {caseStudies.map((study, i) => (
              <Reveal key={study.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  {/* R18.9 — result storytelling: ação → implementação → resultado. */}
                  <div className="mb-4 flex flex-wrap items-center gap-1.5">
                    {study.flow.map((step, fi) => (
                      <Fragment key={step}>
                        {fi > 0 && <ArrowRight aria-hidden="true" className="h-3 w-3 text-ink-tertiary" />}
                        <span className="gb-chip">{step}</span>
                      </Fragment>
                    ))}
                  </div>
                  <div className="gb-text-display text-brand-600"><CountUp value={study.k} /></div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{study.v}</p>
                  <p className="gb-eyebrow mt-6 text-ink-tertiary">{study.pillar}</p>
                </div>
              </Reveal>
            ))}
          </motion.div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Button asChild variant="outline">
              <Link to="/portfolio">
                Ver portefólio <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/casos-de-sucesso">
                Casos de sucesso <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ======================================================= 06 PRODUCTS */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova de execução"
            title="Não só construímos software. Operamo-lo."
            description="Seis produtos a correr em produção, com clientes reais — a mesma engenharia que aplicamos no projecto que vamos construir contigo."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.filter((p) => p.kind === 'saas' && p.to && p.tagline).map((product, i) => (
              <Reveal key={product.slug} i={i % 3}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'homepage_products')}>
                  <div className="gb-surface-card gb-card-lift h-full">
                    <div className="flex items-start justify-between gap-3">
                      <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                      {/* R18.10 — lifecycle status: only project-supported states. */}
                      {product.status && (
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-success" />
                          {product.status}
                        </span>
                      )}
                    </div>
                    {/* R18.10 — category micro-label (evidence, not marketing). */}
                    {product.category && (
                      <p className="gb-eyebrow mt-4 text-ink-tertiary">{product.category}</p>
                    )}
                    <h3 className="gb-text-h3 mt-2 text-ink-primary">{product.name}</h3>
                    {/* R18.10 — abstract mini preview: one consistent pattern for
                        all six products (only three have real mockups; mixing
                        real + abstract would break card consistency). */}
                    <div aria-hidden="true" className="mt-4 overflow-hidden rounded-xl border border-black/[0.06] bg-canvas-subtle p-3">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-black/15" />
                        <span className="h-2 w-2 rounded-full bg-black/15" />
                        <span className="h-2 w-2 rounded-full" style={{ background: product.accent }} />
                        <span className="ml-2 h-1.5 w-16 rounded-full bg-black/10" />
                      </div>
                      <div className="mt-3 flex gap-2">
                        <div className="flex-1 space-y-1.5">
                          <div className="h-1.5 w-11/12 rounded-full bg-black/10" />
                          <div className="h-1.5 w-3/4 rounded-full bg-black/10" />
                          <div className="h-1.5 w-2/3 rounded-full" style={{ background: `${product.accent}55` }} />
                        </div>
                        <div className="flex w-1/3 flex-col justify-end gap-1">
                          <div className="h-6 rounded-md" style={{ background: `${product.accent}22` }} />
                          <div className="h-3 rounded-md" style={{ background: product.accent }} />
                        </div>
                      </div>
                    </div>
                    <p className="gb-text-small mt-4 font-medium text-ink-secondary">{product.tagline}</p>
                    <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Conhecer <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
          <div className="mt-8">
            <Button asChild variant="ghost">
              <Link to="/produtos">
                Ver todos os produtos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ========================================================= 07 METHOD */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como trabalhamos"
            title="De briefing a resultado, sem drama"
            description="Um processo obsessivo em quatro passos — com prioridades claras, prazos reais e decisões documentadas."
          />
          {/* R18.9 — premium timeline rail (desktop): numbered nodes on a progress line. */}
          <div aria-hidden="true" className="relative mb-2 mt-12 hidden lg:block">
            <div className="absolute left-[12.5%] right-[12.5%] top-1/2 h-px -translate-y-1/2 bg-black/10" />
            <div
              aria-hidden="true"
              className="absolute left-[12.5%] top-1/2 h-px w-1/2 -translate-y-1/2"
              style={{ background: 'linear-gradient(90deg, #ff4000, rgba(255,64,0,0.15))' }}
            />
            <div className="relative grid grid-cols-4">
              {method.map((step, mi) => (
                <div key={step.step} className="flex justify-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#ff4000]/60 bg-white font-mono text-xs font-bold text-brand-600 shadow-[0_6px_16px_-6px_rgba(255,64,0,0.5)]">
                    {String(mi + 1).padStart(2, '0')}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-sand-200 md:grid-cols-2 lg:grid-cols-4 lg:!mt-0">
            {method.map((step, i) => (
              <Reveal key={step.step} i={i} className="group bg-canvas-base p-8 transition-colors duration-200 hover:bg-canvas-subtle md:p-10">
                <div className="font-mono text-sm tracking-[0.22em] text-brand-600 transition-transform duration-200 group-hover:-translate-y-0.5">{step.step}</div>
                <h3 className="gb-text-h3 mt-6 text-ink-primary">{step.title}</h3>
                <p className="gb-text-small mt-4 text-ink-secondary">{step.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================== 08 INSIGHTS */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Insights"
            title="Conhecimento que aplicamos todos os dias"
            description="Artigos, guias e análises sobre marketing, software e IA — para manteres a operação à frente."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {(latestEntries ?? []).slice(0, 3).map((entry, i) => (
              <Reveal key={entry.id} i={i}>
                <Link to={`/blog/${entry.slug}`} className="group block h-full">
                  <div className="gb-surface-card gb-card-lift h-full">
                    {entry.ogImagePath ?? entry.coverMediaPath ? (
                      <img
                        src={mediaUrl(entry.ogImagePath ?? entry.coverMediaPath) ?? ''}
                        alt={entry.title}
                        className="mb-5 h-40 w-full rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <h3 className="gb-text-h3 text-ink-primary">{entry.title}</h3>
                    <span className="gb-link-more mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
                      Ler artigo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
            {!latestEntries?.length ? (
              <p className="gb-text-body text-ink-secondary">Sem artigos publicados de momento.</p>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button asChild variant="ghost">
              <Link to="/blog">
                Ver todos os artigos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/resources">
                Recursos e guias <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===================================================== 09 FINAL CTA */}
      <section ref={ctaRef} className="gb-surface-page gb-section">
        <div className="gb-container">
          {/* R18.10 — why Getboost: traditional agency vs product company.
              Spans only, no links: the CTAs below stay the single conversion path. */}
          <Reveal i={0} className="mb-12">
            <p className="gb-eyebrow text-center text-ink-tertiary">Porquê a Getboost</p>
            <div className="mx-auto mt-6 grid max-w-4xl gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Agência tradicional</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {['Campanhas', 'Relatórios', 'Dependência manual'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-ink-tertiary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05]">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-[#ff4000]/25 bg-white p-6 shadow-[0_18px_44px_-20px_rgba(255,64,0,0.45)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-brand-600">Getboost</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {['IA aplicada', 'Automação', 'Software próprio', 'Operação escalável'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] font-semibold text-ink-primary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ff4000]/10">
                        <Check className="h-3.5 w-3.5 text-brand-600" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
          <motion.div style={{ y: reduceMotion ? 0 : ctaY }}>
          <Reveal i={0}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              {/* R18.7 — slow ambient drift, almost imperceptible (auto-disabled on reduced motion). */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(ellipse, rgba(255,64,0,0.22) 0%, rgba(0,0,0,0) 65%)' }}
                animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }}
                transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
              <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                Adoraria conhecer o teu{' '}
                <span style={{ color: ACCENT }}>projecto</span> e trabalhar{' '}
                <span style={{ color: ACCENT }}>contigo</span>.
              </h2>
              <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                Conta-nos o contexto, os objectivos e o prazo — voltamos com um
                plano concreto em menos de 48 horas.
              </p>
              <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                <Button size="lg" onClick={() => setContactOpen((v) => !v)}>
                  {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary"
                  onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
                >
                  <Zap className="h-4 w-4" />
                  Auditoria grátis 7 min
                </Button>
              </div>
              </div>
            </div>
          </Reveal>
          </motion.div>
        </div>
      </section>

      <ConsultantContactForm
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        service={{
          slug: 'homepage',
          name: 'Getboost Digital',
          accent: ACCENT,
          eyebrow: 'Briefing · Projecto Digital',
          headline: 'Vamos desenhar o próximo passo do teu negócio.',
          subhead: 'Descreve o contexto, os objectivos e onde queres chegar. Voltamos com um plano concreto, prazos e investimento em menos de 48 horas.',
          goalOptions: [
            'Gerar mais leads qualificadas',
            'Automatizar operações com IA',
            'Lançar um produto/SaaS novo',
            'Redesenhar o site e a marca',
            'Estruturar marketing e vendas',
            'Ainda a explorar',
          ],
          messagePlaceholder: 'Contexto do negócio, objectivos a 6 meses, orçamento aproximado, prazo desejado…',
        }}
      />

      <CommercialAuditModal
        open={auditOpen}
        trackingSource="homepage"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default Index;
