import { useState, useRef, Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Check,
  X,
  Bot,
  CalendarCheck,
  Headphones,
  TrendingUp,
  Brain,
  Globe,
  MessageSquare,
  Monitor,
  Instagram,
  Database,
  Building2,
  Home,
  Utensils,
  HeartPulse,
  Briefcase,
  GraduationCap,
  Facebook,
  Server,
  Mail,
  Target,
  Clock,
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

const AI = PILLARS.ai;

/** Capabilities reuse existing AI copy (tags/bodies from the pillar data) — no invented claims. */
const capabilities = [
  { icon: Target, title: 'Qualificação de Leads', desc: 'Intenção real, follow-up inteligente' },
  { icon: CalendarCheck, title: 'Agendamento de Reuniões', desc: 'Direto na agenda comercial' },
  { icon: Headphones, title: 'Apoio ao Cliente 24/7', desc: 'Resolução com contexto do cliente' },
  { icon: TrendingUp, title: 'Assistente Comercial IA', desc: 'Máquinas de oportunidades' },
  { icon: Brain, title: 'Base de Conhecimento RAG', desc: 'Fontes validadas, sem suposições' },
  { icon: Globe, title: 'Multi-idioma Nativo', desc: 'Conversa natural em vários idiomas' },
  { icon: MessageSquare, title: 'WhatsApp', desc: 'Atendimento no WhatsApp Business' },
  { icon: Monitor, title: 'Website', desc: 'Widget web à medida da marca' },
  { icon: Instagram, title: 'Instagram', desc: 'Instagram & FB Direct' },
  { icon: Database, title: 'CRM', desc: 'Integração total com o teu CRM' },
];

/** Verticals with qualitative outcomes (what the system does — never invented metrics). */
const useCases = [
  { icon: Building2, vertical: 'Imobiliário', outcome: 'Visitas agendadas' },
  { icon: Home, vertical: 'Alojamento Local', outcome: 'Reservas confirmadas' },
  { icon: Utensils, vertical: 'Restauração', outcome: 'Pedidos e reservas tratados' },
  { icon: HeartPulse, vertical: 'Clínicas', outcome: 'Consultas marcadas' },
  { icon: Briefcase, vertical: 'Serviços', outcome: 'Pedidos qualificados' },
  { icon: GraduationCap, vertical: 'Educação', outcome: 'Inscrições acompanhadas' },
];

const integrations = [
  { icon: MessageSquare, label: 'WhatsApp' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Globe, label: 'Website' },
  { icon: Database, label: 'CRM' },
  { icon: Server, label: 'ERP' },
  { icon: Mail, label: 'Email' },
  { icon: CalendarCheck, label: 'Calendário' },
];

/** Benefit titles from the brief (no numbers invented — proof metrics stay in section 7). */
const benefits = [
  { icon: Zap, title: 'Resposta imediata' },
  { icon: CalendarCheck, title: 'Mais reuniões' },
  { icon: Target, title: 'Mais qualificação' },
  { icon: Clock, title: 'Menos tempo administrativo' },
  { icon: Bot, title: 'Operação 24/7' },
];

const timeline = [
  { step: '01', title: 'Diagnóstico' },
  { step: '02', title: 'Configuração' },
  { step: '03', title: 'Treino' },
  { step: '04', title: 'Integração' },
  { step: '05', title: 'Lançamento' },
  { step: '06', title: 'Otimização' },
];

/**
 * R19.2 — AI Agents premium product page.
 * Mounts at the canonical /agentes-ia route. SEO props preserved
 * byte-identical from the pre-R19 page; routes, schema and tracking
 * architecture untouched.
 */
const AgentesIA = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const relatedProducts = PRODUCTS.filter((p) => AI.products.includes(p.slug));

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="ai_agents" />
      <SEO
        title="Agentic AI — Agentes de IA Autónomos | Getboost Digital"
        description="Agentes de inteligência artificial que compreendem o teu negócio, resolvem problemas complexos e executam tarefas de forma autónoma, 24/7."
        canonical="/agentes-ia"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, rgba(250,247,241,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">AI Agents · Operadores Digitais 24/7</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="ed-display mt-6 text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]"
              >
                O teu melhor colaborador trabalha{' '}
                <em style={{ color: 'var(--gb-ai-strong)' }}>24 horas por dia</em>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                AI Agents que conversam com clientes, qualificam oportunidades
                e mantêm a operação em movimento — mesmo quando a tua equipa
                está offline.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('ai_hero', 'ai_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={i18n.language === 'pt' ? '/demo' : `/${i18n.language}/demo`} onClick={() => analytics.trackClick('ai_hero', 'ai_demo', 'consideration')}>
                    Ver Demonstração
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
                {['24/7', 'Multicanal', 'IA Conversacional', 'Integrações'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: the operation, live (illustrative). */}
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
                      <span className="gb-eyebrow text-ink-tertiary">Operação em tempo real</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        Live
                      </span>
                    </div>
                    <MiniFlow
                      steps={['Lead', 'AI Agent', 'Qualificação', 'CRM', 'Reunião', 'Venda']}
                      tint="var(--gb-ai-tint)"
                      strong="var(--gb-ai-strong)"
                    />
                    <div className="mt-5 flex flex-col gap-2 border-t border-black/[0.06] pt-4 text-[13px]">
                      {[
                        { who: 'Lead capturado', detail: 'via WhatsApp · há 2 min' },
                        { who: 'Reunião marcada', detail: 'amanhã, 10h00 · agenda sincronizada' },
                        { who: 'Follow-up enviado', detail: 'proposta + lembrete automático' },
                      ].map((event, ei) => (
                        <motion.div
                          key={event.who}
                          initial={{ opacity: 0, x: 12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.8 + ei * 0.25, duration: 0.4 }}
                          className="flex items-center justify-between gap-3 rounded-xl bg-black/[0.03] px-3 py-2"
                        >
                          <span className="font-semibold text-ink-primary">{event.who}</span>
                          <span className="truncate text-ink-tertiary">{event.detail}</span>
                        </motion.div>
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
            title="Sem um operador digital, o funil perde em todo o lado"
            description="A diferença entre deixar oportunidades escapar e operar com um sistema que nunca dorme."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal i={0}>
              <div className="gb-card h-full opacity-80">
                <p className="gb-eyebrow text-ink-tertiary">Empresa sem AI Agents</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {['Leads perdidos', 'Respostas lentas', 'Equipa sobrecarregada', 'Oportunidades esquecidas'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] text-ink-tertiary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/[0.05]">
                        <X className="h-3.5 w-3.5" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div
                className="gb-card gb-card-lift h-full"
                style={{ ['--gb-glow' as string]: 'var(--gb-ai-glow)' }}
              >
                <p className="gb-eyebrow" style={{ color: 'var(--gb-ai-strong)' }}>Empresa com AI Agents</p>
                <ul className="mt-5 flex flex-col gap-3">
                  {['Resposta imediata', 'Qualificação automática', 'Agenda preenchida', 'Operação escalável'].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-[15px] font-semibold text-ink-primary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--gb-ai-tint)' }}>
                        <Check className="h-3.5 w-3.5" style={{ color: 'var(--gb-ai-strong)' }} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
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
            title="Do visitante ao resultado, sem intervenção manual"
            description="O agente recebe, interpreta, qualifica e age — e entrega o resultado onde ele pertence."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Visitante', 'AI Agent', 'Análise de intenção', 'Qualificação', 'Ação']}
                tint="var(--gb-ai-tint)"
                strong="var(--gb-ai-strong)"
              />
              <div className="mt-6 border-t border-black/[0.06] pt-5">
                <p className="gb-eyebrow text-ink-tertiary">A ação termina onde faz sentido</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Reunião agendada', 'Suporte resolvido', 'Venda assistida'].map((outcome) => (
                    <span
                      key={outcome}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold"
                      style={{ background: 'var(--gb-ai-tint)', color: 'var(--gb-ai-strong)' }}
                    >
                      <Check className="h-3.5 w-3.5" />
                      {outcome}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 04 CAPACIDADES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Um operador completo, não um chatbot"
            description="Dez frentes de trabalho que combinamos conforme o contexto — nunca pacotes fechados."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((cap, i) => (
              <Reveal key={cap.title} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-ai-tint)', ['--gb-chip-fg' as string]: 'var(--gb-ai-strong)' }}
                  >
                    <cap.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{cap.title}</h3>
                  <p className="gb-text-small mt-2 text-ink-secondary">{cap.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 05 CASOS DE USO */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Casos de uso"
            title="O mesmo operador, em qualquer setor"
            description="O fluxo é sempre o mesmo — cliente, agente, resultado. Muda apenas o contexto."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {useCases.map((useCase, i) => (
              <Reveal key={useCase.vertical} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-ai-tint)', ['--gb-chip-fg' as string]: 'var(--gb-ai-strong)' }}
                  >
                    <useCase.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{useCase.vertical}</h3>
                  <MiniFlow
                    steps={['Cliente', 'AI Agent', useCase.outcome]}
                    tint="var(--gb-ai-tint)"
                    strong="var(--gb-ai-strong)"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 06 INTEGRAÇÕES */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Ecossistema"
            title="Um agente, todos os canais"
            description="A mesma inteligência, o mesmo conhecimento — onde quer que os teus clientes estejam."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12 !p-8 md:!p-10">
              <div className="flex flex-col items-center gap-5">
                <span className="inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-base font-bold text-white shadow-premium" style={{ background: 'var(--gb-gradient-brand)' }}>
                  <Bot className="h-5 w-5" />
                  AI Agent Getboost
                </span>
                <div aria-hidden="true" className="h-6 w-px bg-black/10" />
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {integrations.map((integration) => (
                    <span
                      key={integration.label}
                      className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[13px] font-semibold text-ink-secondary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <integration.icon className="h-4 w-4" style={{ color: 'var(--gb-ai-strong)' }} />
                      {integration.label}
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
            title="O que muda quando o operador entra"
            description="Métricas de operações com agentes em produção — com origem rastreada."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {AI.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-ai-strong)' }}><CountUp value={p.k} /></div>
                  <p className="gb-eyebrow mt-2 text-ink-tertiary">Resultado</p>
                  <p className="gb-text-body mt-3 text-ink-secondary">{p.v}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {benefits.map((benefit, i) => (
              <Reveal key={benefit.title} i={i}>
                <div className="gb-card gb-card-lift h-full !p-5 text-center">
                  <span
                    className="gb-icon-chip mx-auto"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-ai-tint)', ['--gb-chip-fg' as string]: 'var(--gb-ai-strong)' }}
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
            title="Isto não é um chatbot"
            description="A diferença entre capturar mensagens e operar um negócio."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Chatbot tradicional</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {[
                    { weak: 'Menu fixo', note: 'opções rígidas' },
                    { weak: 'Captura mensagens', note: 'sem qualificar' },
                    { weak: 'Resposta básica', note: 'sem executar' },
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
              <div className="rounded-2xl border border-ai-base/25 bg-white p-6 shadow-[0_18px_44px_-20px_var(--gb-ai-glow)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--gb-ai-strong)' }}>AI Agent Getboost</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {[
                    { strong: 'Conversação real', note: 'linguagem natural' },
                    { strong: 'Qualifica oportunidades', note: 'intenção + fit' },
                    { strong: 'Executa processos', note: 'agenda, CRM, follow-up' },
                  ].map((item) => (
                    <li key={item.strong} className="flex items-center gap-3 text-[15px] font-semibold text-ink-primary">
                      <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ background: 'var(--gb-ai-tint)' }}>
                        <Check className="h-3.5 w-3.5" style={{ color: 'var(--gb-ai-strong)' }} />
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

      {/* ==================================================== 09 TIMELINE */}
      <ProcessTimeline
        eyebrow="Implementação"
        title="Do diagnóstico à otimização, em semanas"
        description="Um processo fechado: cada fase tem dono, prazo e critério de saída."
        steps={timeline}
        hue={{ base: 'var(--gb-ai-base)', strong: 'var(--gb-ai-strong)', tint: 'var(--gb-ai-tint)' }}
      />

      {/* ==================================================== 10 PROVA */}
            {/* 10B CASOS — resultados de clientes (motor partilhado, sem conteúdo inventado) */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <CaseProofStrip
            slugs={['qook']}
            tint="var(--gb-ai-tint)"
            strong="var(--gb-ai-strong)"
            trackingLocation="ai_cases"
          />
        </div>
      </section>

<section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Tecnologia nossa, a correr em produção"
            description="Não vendemos teoria: construímos e operamos os nossos próprios produtos com IA."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {relatedProducts.map((product, i) => (
              <Reveal key={product.slug} i={i}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'ai_proof')}>
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
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quanto tempo até estar a funcionar?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Menos de 30 dias do briefing ao primeiro agente em produção — diagnóstico, configuração, treino, integração e lançamento, cada fase com dono e prazo.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-1" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Preciso de trocar as ferramentas que já uso?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não. O agente trabalha sobre o teu WhatsApp, Instagram, site e CRM — sem migrações e sem novos logins para a equipa.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-2" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">E se o agente não souber responder?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Ele só usa a tua base de conhecimento validada — sem suposições. E é treinado com o teu conteúdo e afinado em contínuo na fase de otimização.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-3" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">A minha equipa precisa de formação técnica?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não. A configuração e o treino são feitos por nós; a equipa continua a usar agenda e CRM como sempre.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-4" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quanto custa?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Cada operação é diferente. O diagnóstico é gratuito e sais dele com um plano fechado em 48 horas — sem compromisso.</p>
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
                style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.25) 0%, rgba(0,0,0,0) 65%)' }}
                animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }}
                transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Pronto para colocar um{' '}
                  <span style={{ color: '#ff4000' }}>operador digital</span> a trabalhar
                  para o teu negócio?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos os processos e os canais — voltamos com um plano
                  concreto em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('ai_cta', 'ai_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`} onClick={() => analytics.trackClick('ai_cta', 'ai_contact', 'consideration')}>
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
        trackingSource="ai_agents"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default AgentesIA;
