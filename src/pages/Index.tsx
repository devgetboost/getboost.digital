import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Bot, Workflow, Code2, LineChart, Target, Palette, Globe, MessageSquare, TrendingUp, BarChart3, Megaphone } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO, { organizationSchema } from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { useContentEntries } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import { PRODUCTS } from '@/data/products';
import { METRICS } from '@/data/brandRegistry';
import type { StoredAudit } from '@/lib/auditHistory';
import logoPikto from '@/assets/logos/logo-pikto.svg';
import logoHostify from '@/assets/logos/logo-hostify.svg';
import logoProSafe from '@/assets/logos/logo-prosafe360.svg';
import logoMotivae from '@/assets/logos/logo-motivae.svg';
import logoQook from '@/assets/logos/logo-qook.svg';
import logoAgrifly from '@/assets/logos/logo-agrifly.svg';
import logoKasccab from '@/assets/logos/logo-kasccab.svg';
import qookMockup from '@/assets/qook/saas-qook-mockup.png.asset.json';
import hostifyMockup from '@/assets/hostify/mockup.png.asset.json';

const ACCENT = '#ff4000';

const clientLogos = [
  { name: 'Pikto', src: logoPikto },
  { name: 'Hostify', src: logoHostify },
  { name: 'ProSafe360', src: logoProSafe },
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
  },
  {
    id: 'automation',
    eyebrow: 'Automação',
    title: 'Processos internos automatizados de ponta a ponta',
    body: 'Ligamos as ferramentas que já usas, eliminamos copy-paste manual e criamos agentes internos para relatórios, propostas, follow-ups e validação documental. A tua equipa decide — o resto executa-se sozinho.',
    tags: ['CRM & ERP', 'Integrações', 'Back-office IA', 'Fluxos personalizados'],
    icon: Workflow,
    href: '/solucoes/integracoes-erp-crm',
  },
  {
    id: 'software',
    eyebrow: 'Software',
    title: 'Produto digital construído para escalar sem re-escrever',
    body: 'Desenvolvemos software à medida quando o mercado não tem uma resposta suficientemente boa. Do MVP ao produto multi-tenant, sem dívida técnica desde o dia zero.',
    tags: ['Web apps', 'SaaS', 'Mobile', 'MVP em 30 dias'],
    icon: Code2,
    href: '/solucoes/desenvolvimento-software',
  },
  {
    id: 'growth',
    eyebrow: 'Growth',
    title: 'Tráfego pago e SEO que geram pipeline, não vaidade',
    body: 'Combinamos aquisição paga, SEO e páginas de conversão desenhadas para uma única acção: preencher a agenda comercial. Cada euro tem destino, cada lead tem origem.',
    tags: ['Google & Meta Ads', 'SEO técnico', 'Landing pages', 'CRO'],
    icon: LineChart,
    href: '/solucoes/marketing-digital',
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
  { k: '+300%', v: 'crescimento orgânico médio em 6 meses', pillar: 'Growth' },
  { k: '−70%', v: 'tempo em tarefas administrativas', pillar: 'Automação' },
  { k: '5x', v: 'reuniões comerciais qualificadas', pillar: 'IA' },
];

const method = [
  { step: '01', title: 'Auditoria comercial', body: 'Em 7 minutos analisamos o teu site, presença digital e funil actual. Sais com um relatório concreto do que está a travar vendas.' },
  { step: '02', title: 'Plano de ataque', body: 'Traduzimos a auditoria num roadmap de 90 dias com prioridades, entregáveis semanais e KPIs ligados a receita.' },
  { step: '03', title: 'Execução obsessiva', body: 'Equipa dedicada em design, código, IA e media. Reuniões semanais, dashboards partilhados e decisões documentadas.' },
  { step: '04', title: 'Escala e optimização', body: 'Quando o motor gira, subimos a velocidade: mais canais, mais automações, mais mercados.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

const Reveal = ({ children, i = 0, className }: { children: React.ReactNode; i?: number; className?: string }) => (
  <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i} className={className}>
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

  return (
    <Layout>
      <SEO
        title="Getboost Digital — Agentes IA, Growth e Software que geram clientes"
        description="Transformamos empresas com agentes de IA autónomos, marketing digital orientado a receita e software à medida. Auditoria comercial gratuita em 7 minutos."
        canonical="/"
        lang={i18n.language as 'pt' | 'en' | 'es'}
        jsonLd={organizationSchema}
      />

      {/* ==================================================== 01 HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div className="gb-container relative gb-section !pt-36 md:!pt-44">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
            <Reveal i={0}>
              <span className="gb-eyebrow text-brand-600">Marketing, Software &amp; IA para PMEs</span>
              <h1 className="gb-text-display mt-5 text-ink-primary">
                Agentes IA, Growth e Software que{' '}
                <span className="text-brand-600">geram clientes</span>.
              </h1>
              <p className="gb-text-body mt-6 max-w-xl text-ink-secondary">
                O teu negócio não precisa de mais horas. Precisa de mais
                inteligência. Instalamos sistemas digitais que atraem, convertem
                e operam — enquanto tu cuidas dos clientes.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Button size="lg" onClick={() => setContactOpen((v) => !v)}>
                  {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
                >
                  <Zap className="h-4 w-4" />
                  Auditoria grátis 7 min
                </Button>
              </div>
              <p className="gb-text-small mt-6 text-ink-tertiary">
                Resposta em menos de 48 horas · 30 min, online, 0€
              </p>
            </Reveal>

            {/* Static proof visual — real product surfaces, no carousel */}
            <Reveal i={1} className="relative">
              <div className="gb-surface-card !p-0 overflow-hidden">
                <img
                  src={qookMockup.url}
                  alt="Qook — sistema de gestão para restauração"
                  className="block w-full object-cover object-top"
                  loading="eager"
                />
              </div>
              <div className="gb-surface-card-elevated absolute -bottom-8 -left-4 hidden w-64 !p-0 overflow-hidden md:block">
                <img
                  src={hostifyMockup.url}
                  alt="Hostify — gestão para alojamento local"
                  className="block w-full object-cover object-top"
                  loading="lazy"
                />
              </div>
            </Reveal>
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
              { k: METRICS.projectsDelivered.value, v: 'Projetos entregues' },
              { k: '24/7', v: 'Agentes IA a operar' },
              { k: '<30d', v: 'Do briefing ao MVP' },
              { k: '3x', v: 'Leads qualificadas médias' },
            ].map((stat, i) => (
              <Reveal key={stat.v} i={i} className="text-center">
                <div className="gb-text-h2 text-brand-600">{stat.k}</div>
                <div className="gb-text-small mt-1 text-ink-secondary">{stat.v}</div>
              </Reveal>
            ))}
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
                <div className="gb-surface-card h-full">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas-tint text-brand-600">
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
                  className="gb-surface-pillar-card h-full"
                  style={{ ['--gb-pillar' as string]: `var(--gb-${pillar.id}-base)` }}
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-full"
                    style={{ background: `var(--gb-${pillar.id}-tint)`, color: `var(--gb-${pillar.id}-strong)` }}
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
                        className="rounded-full px-3 py-1.5 text-xs text-ink-secondary"
                        style={{ background: `var(--gb-${pillar.id}-tint)`, border: `1px solid var(--gb-${pillar.id}-border)` }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={pillar.href}
                    className="mt-7 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.22em] transition-colors"
                    style={{ color: `var(--gb-${pillar.id}-strong)` }}
                  >
                    Ver {pillar.eyebrow.toLowerCase()} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================== 05 CASE STUDIES */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova real"
            title="Não vendemos promessas. Vendemos operações que já funcionam."
            description="Resultados médios de projectos em produção — cada número com origem rastreada e dono responsável."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {caseStudies.map((study, i) => (
              <Reveal key={study.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display text-brand-600">{study.k}</div>
                  <p className="gb-text-body mt-3 text-ink-secondary">{study.v}</p>
                  <p className="gb-eyebrow mt-6 text-ink-tertiary">{study.pillar}</p>
                </div>
              </Reveal>
            ))}
          </div>
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
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((product, i) => (
              <Reveal key={product.slug} i={i % 3}>
                <Link to={product.to} className="group block h-full">
                  <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                    <span aria-hidden className="block h-1 w-10 rounded-full" style={{ background: product.accent }} />
                    <h3 className="gb-text-h3 mt-4 text-ink-primary">{product.name}</h3>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{product.tagline}</p>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
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
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl bg-sand-200 md:grid-cols-2 lg:grid-cols-4">
            {method.map((step, i) => (
              <Reveal key={step.step} i={i} className="bg-canvas-base p-8 md:p-10">
                <div className="font-mono text-sm tracking-[0.22em] text-brand-600">{step.step}</div>
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
                  <div className="gb-surface-card h-full transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
                    {entry.ogImagePath ?? entry.coverMediaPath ? (
                      <img
                        src={mediaUrl(entry.ogImagePath ?? entry.coverMediaPath) ?? ''}
                        alt={entry.title}
                        className="mb-5 h-40 w-full rounded-lg object-cover"
                        loading="lazy"
                      />
                    ) : null}
                    <h3 className="gb-text-h3 text-ink-primary">{entry.title}</h3>
                    <span className="mt-5 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-brand-600">
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
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <Reveal i={0}>
            <div className="gb-cta-band text-center">
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
          </Reveal>
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
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default Index;
