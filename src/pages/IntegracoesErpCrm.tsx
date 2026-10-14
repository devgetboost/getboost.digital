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
  Database,
  Server,
  BarChart3,
  Workflow,
  MessageSquare,
  FileSearch,
  LineChart,
  Layers,
  Instagram,
  Mail,
  CalendarCheck,
  Code2,
  ClipboardCheck,
  LayoutGrid,
  Sparkles,
  ShieldCheck,
  Target,
  Gauge,
  Globe,
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

const AUTOMATION = PILLARS.automation;

/** Automation types reuse existing integration copy (tags/bodies) — no invented claims. */
const automationTypes = [
  { icon: Database, title: 'Automação de CRM', desc: 'Contactos, pipelines e follow-ups' },
  { icon: Server, title: 'Integração ERP', desc: 'PHC, Primavera e SAGE sincronizados' },
  { icon: BarChart3, title: 'Fluxos Financeiros', desc: 'Faturação e cobranças automáticas' },
  { icon: Workflow, title: 'Fluxos Operacionais', desc: 'Operações sem intervenção manual' },
  { icon: MessageSquare, title: 'Comunicação com Clientes', desc: 'Email, WhatsApp e notificações' },
  { icon: FileSearch, title: 'Processamento Documental', desc: 'Validação e arquivo automático' },
  { icon: Bot, title: 'Automação de Tarefas', desc: 'Tarefas repetitivas eliminadas' },
  { icon: LineChart, title: 'Relatórios Automáticos', desc: 'Cada fluxo publica métricas' },
  { icon: Layers, title: 'Sincronização de Dados', desc: 'Bidireccional, sem duplicados' },
  { icon: Code2, title: 'Integrações à Medida', desc: 'APIs REST e GraphQL' },
];

/** Real-world automation patterns (illustrative flows — never measured metrics). */
const realFlows = [
  { title: 'Atendimento que vende', steps: ['WhatsApp', 'CRM', 'Contacto criado', 'Equipa notificada'] },
  { title: 'Operação sem papel', steps: ['Reserva', 'Sistema', 'Limpeza', 'Checklist', 'Relatório'] },
  { title: 'Dinheiro sem fricção', steps: ['Formulário', 'Base de Dados', 'ERP', 'Faturação'] },
];

const integrations = [
  { icon: MessageSquare, label: 'WhatsApp' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Mail, label: 'Gmail' },
  { icon: CalendarCheck, label: 'Google Calendar' },
  { icon: Database, label: 'CRM' },
  { icon: Server, label: 'ERP' },
  { icon: ClipboardCheck, label: 'Forms' },
  { icon: LayoutGrid, label: 'Sheets' },
  { icon: Code2, label: 'APIs' },
  { icon: Sparkles, label: 'Outros sistemas' },
];

/** Benefit titles from the brief (numbers stay exclusively in the proof metrics). */
const benefits = [
  { icon: Bot, title: 'Menos tarefas manuais' },
  { icon: ShieldCheck, title: 'Menos erros' },
  { icon: Zap, title: 'Mais velocidade' },
  { icon: Target, title: 'Mais previsibilidade' },
  { icon: Gauge, title: 'Mais controlo' },
];

const timeline = [
  { step: '01', title: 'Diagnóstico' },
  { step: '02', title: 'Mapeamento' },
  { step: '03', title: 'Integração' },
  { step: '04', title: 'Automação' },
  { step: '05', title: 'Testes' },
  { step: '06', title: 'Otimização' },
];

/**
 * R19.5 — Automation premium product page.
 * Mounts at the canonical /solucoes/integracoes-erp-crm route. SEO props
 * preserved byte-identical; routes, schema and tracking untouched.
 */
const IntegracoesErpCrm = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const relatedProducts = PRODUCTS.filter((p) => AUTOMATION.products.includes(p.slug));

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="automation" />
      <SEO
        title="Integrações ERP e CRM — Sistemas Sincronizados em Tempo Real | Getboost Digital"
        description="Ligamos ERP, CRM, e-commerce e ferramentas verticais com middleware auditável, sincronização bidireccional e SLA. Fim dos silos e dos dados duplicados."
        canonical="/solucoes/integracoes-erp-crm"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.10) 0%, rgba(250,247,241,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Automação · Sistema Operacional Digital</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="ed-display mt-6 text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]"
              >
                Os melhores processos são os que{' '}
                <em style={{ color: 'var(--gb-automation-strong)' }}>já não exigem intervenção manual</em>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Ligamos sistemas, eliminamos tarefas repetitivas e transformamos
                operações fragmentadas em fluxos automáticos e escaláveis.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('automation_hero', 'automation_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#tipos-automacao">
                    Ver Automações
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
                {['CRM', 'ERP', 'Workflows', 'Integrações', 'Automação'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: data circulating through the system (illustrative). */}
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
                      <span className="gb-eyebrow text-ink-tertiary">Sistema vivo</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        A executar
                      </span>
                    </div>
                    <MiniFlow
                      steps={['Cliente', 'WhatsApp', 'CRM', 'ERP', 'Relatórios', 'Operação']}
                      tint="var(--gb-automation-tint)"
                      strong="var(--gb-automation-strong)"
                    />
                    <div className="mt-5 flex flex-col gap-2 border-t border-black/[0.06] pt-4 text-[13px]">
                      {[
                        { who: 'Sincronização CRM → ERP', detail: '312 registos · há 1 min' },
                        { who: 'Relatório semanal', detail: 'gerado e enviado · 08h00' },
                        { who: 'Alerta resolvido', detail: 'fila drenada · sem intervenção' },
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
            title="Trabalho manual não escala — e esconde erros"
            description="A diferença entre copiar e colar o dia todo e operar com fluxos integrados."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal i={0}>
              <div className="gb-card h-full opacity-80">
                <p className="gb-eyebrow text-ink-tertiary">Empresa sem automação</p>
                <MiniFlow
                  steps={['Copiar', 'Colar', 'Emails manuais', 'Dados dispersos', 'Erros', 'Repetição']}
                  tint="var(--gb-canvas-subtle)"
                  strong="var(--gb-ink-tertiary)"
                />
              </div>
            </Reveal>
            <Reveal i={1}>
              <div
                className="gb-card gb-card-lift h-full"
                style={{ ['--gb-glow' as string]: 'var(--gb-automation-glow)' }}
              >
                <p className="gb-eyebrow" style={{ color: 'var(--gb-automation-strong)' }}>Empresa automatizada</p>
                <MiniFlow
                  steps={['Fluxos integrados', 'Dados sincronizados', 'Menos erros', 'Mais produtividade']}
                  tint="var(--gb-automation-tint)"
                  strong="var(--gb-automation-strong)"
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
            title="Cada dado entra uma vez e circula sozinho"
            description="Da captura ao relatório, sem intervenção manual em nenhum ponto do caminho."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Lead', 'Captura', 'CRM', 'Processamento', 'ERP', 'Relatórios', 'Ação']}
                tint="var(--gb-automation-tint)"
                strong="var(--gb-automation-strong)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================================================== 04 TIPOS */}
      <section id="tipos-automacao" className="gb-surface-section gb-section scroll-mt-24">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Tipos de automação"
            title="Dez frentes, um único sistema"
            description="Combinamos as frentes que o teu contexto exige — nunca pacotes fechados."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {automationTypes.map((type, i) => (
              <Reveal key={type.title} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-automation-tint)', ['--gb-chip-fg' as string]: 'var(--gb-automation-strong)' }}
                  >
                    <type.icon className="h-5 w-5" />
                  </span>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{type.title}</h3>
                  <p className="gb-text-small mt-2 text-ink-secondary">{type.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 05 AUTOMAÇÕES REAIS */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Automações reais"
            title="Padrões que já correm em produção"
            description="Fluxos típicos que instalamos — adaptados ao teu stack, nunca copiados."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {realFlows.map((flow, i) => (
              <Reveal key={flow.title} i={i}>
                <div className="gb-card gb-card-lift h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">{flow.title}</h3>
                  <MiniFlow
                    steps={flow.steps}
                    tint="var(--gb-automation-tint)"
                    strong="var(--gb-automation-strong)"
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
            title="Um hub central, todos os sistemas"
            description="Chega de ligações ponto-a-ponto: um hub com filas, retries e logs auditáveis."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12 !p-8 md:!p-10">
              <div className="flex flex-col items-center gap-5">
                <span className="inline-flex items-center gap-2.5 rounded-2xl px-5 py-3 text-base font-bold text-white shadow-premium" style={{ background: 'var(--gb-gradient-brand)' }}>
                  <Workflow className="h-5 w-5" />
                  Hub de Automação Getboost
                </span>
                <div aria-hidden="true" className="h-6 w-px bg-black/10" />
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  {integrations.map((integration) => (
                    <span
                      key={integration.label}
                      className="inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-2 text-[13px] font-semibold text-ink-secondary shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <integration.icon className="h-4 w-4" style={{ color: 'var(--gb-automation-strong)' }} />
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
            title="O que muda quando os processos correm sozinhos"
            description="Métricas de operações automatizadas — com origem rastreada."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {AUTOMATION.proof.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-automation-strong)' }}><CountUp value={p.k} /></div>
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
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-automation-tint)', ['--gb-chip-fg' as string]: 'var(--gb-automation-strong)' }}
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
            title="Ferramenta isolada vs ecossistema integrado"
            description="Uma plataforma a mais — ou uma operação que nunca para."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">Ferramenta isolada</h3>
                <p className="gb-text-body mt-4 text-ink-tertiary">Mais uma plataforma para gerir — e os silos continuam.</p>
              </div>
            </Reveal>
            <Reveal i={1}>
              <div className="rounded-2xl border border-automation-base/25 bg-white p-6 shadow-[0_18px_44px_-20px_var(--gb-automation-glow)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--gb-automation-strong)' }}>Getboost</h3>
                <MiniFlow
                  steps={['Ecossistema integrado', 'Automação', 'Operação contínua', 'Escalabilidade']}
                  tint="var(--gb-automation-tint)"
                  strong="var(--gb-automation-strong)"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ==================================================== 09 TIMELINE */}
      <ProcessTimeline
        eyebrow="Implementação"
        title="Do mapeamento à otimização, sem parar a operação"
        description="Um processo fechado: cada fase tem dono, prazo e critério de saída."
        steps={timeline}
        hue={{ base: 'var(--gb-automation-base)', strong: 'var(--gb-automation-strong)', tint: 'var(--gb-automation-tint)' }}
      />

      {/* ==================================================== 10 PROVA */}
            {/* 10B CASOS — resultados de clientes (motor partilhado, sem conteúdo inventado) */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <CaseProofStrip
            slugs={['trackfy', 'hostify']}
            tint="var(--gb-automation-tint)"
            strong="var(--gb-automation-strong)"
            trackingLocation="automation_cases"
          />
        </div>
      </section>

<section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Automações nossas, a correr em produção"
            description="Os nossos produtos correm sobre os mesmos fluxos que instalamos nos clientes."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {relatedProducts.map((product, i) => (
              <Reveal key={product.slug} i={i}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'automation_proof')}>
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
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Os nossos processos são uma confusão. Por onde começam?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Pelo diagnóstico e mapeamento: levantamos os fluxos atuais antes de automatizar o que quer que seja.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-1" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">O nosso ERP integra na mesma?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Trabalhamos com PHC, Primavera e SAGE através de middleware auditável, com sincronização bidirecional.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-2" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">E se uma automação falhar a meio da noite?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Todos os fluxos correm num hub com filas, retries e logs auditáveis — nada falha em silêncio.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-3" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Os dados ficam duplicados entre sistemas?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não: sincronização bidirecional, zero dados duplicados entre sistemas.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-4" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quanto custa?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Cada operação é diferente. O diagnóstico é gratuito e sais dele com o mapa de automação em 48 horas — sem compromisso.</p>
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
                style={{ background: 'radial-gradient(ellipse, rgba(13,148,136,0.25) 0%, rgba(0,0,0,0) 65%)' }}
                animate={reduceMotion ? undefined : { x: ['-50%', '-46%', '-50%'], opacity: [0.7, 1, 0.7] }}
                transition={reduceMotion ? undefined : { duration: 14, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  Quanto tempo da tua equipa está a ser{' '}
                  <span style={{ color: '#ff4000' }}>desperdiçado</span> em tarefas repetitivas?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos os processos e os sistemas — voltamos com o mapa
                  de automação em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('automation_cta', 'automation_booking', 'consideration')}>
                      Agendar Diagnóstico
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`} onClick={() => analytics.trackClick('automation_cta', 'automation_contact', 'consideration')}>
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
        trackingSource="automation"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default IntegracoesErpCrm;
