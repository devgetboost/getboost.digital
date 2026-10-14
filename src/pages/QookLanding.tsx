import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Check,
  Utensils,
  CreditCard,
  Package,
  Users,
  Brain,
  Shield,
  BarChart3,
  Smartphone,
  Globe,
  Cpu,
  Store,
  Truck,
  Settings,
  Zap as ZapIcon,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { SectionHeader } from '@/components/ui/section-header';
import ProcessTimeline from '@/components/ProcessTimeline';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CaseProofStrip } from '@/components/CaseProofStrip';
import { CountUp } from '@/components/ui/count-up';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { analytics } from '@/lib/analytics';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

const AUTOMATION = PILLARS.automation;

/** What we build — titles from the brief, descriptors from existing platform copy. */
const buildTypes = [
  { icon: 'Utensils', title: 'Gestão de Pedidos', desc: 'Comanda digital, QR Code, KDS, Delivery' },
  { icon: 'CreditCard', title: 'Ementa Digital', desc: 'Fotos, extras, upsell, esgotados' },
  { icon: 'CreditCard', title: 'Pagamentos Integrados', desc: 'MB WAY, Cartão, Multibanco, Carteira' },
  { icon: 'Package', title: 'Stock & Ficha Técnica', desc: 'Baixa por receita, alertas, margem real' },
  { icon: 'Cpu', title: 'KDS · Painel da Cozinha', desc: 'Tempo de confeção, impressoras, dark kitchen' },
  { icon: 'Users', title: 'Equipa & Permissões', desc: 'Perfis, escalas, desempenho, turnos' },
  { icon: 'Brain', title: 'Automação & IA', desc: 'Previsão de vendas, sugestões, desperdício' },
  { icon: 'BarChart3', title: 'Relatórios & BI', desc: 'Faturação, top pratos, margem, equipa' },
  { icon: 'Shield', title: 'Segurança & Multiplataforma', desc: 'Multi-tenant, criptografia, backups, Web/Tablet/QR' },
];

/** Product journeys (illustrative patterns — never measured metrics). */
const journeys = [
  { title: 'Da mesa à cozinha', steps: ['QR Code', 'Comanda', 'KDS', 'Preparo', 'Serviço'] },
  { title: 'Do pedido ao pagamento', steps: ['Ementa', 'Pedido', 'Pagamento', 'Fechamento', 'Fidelização'] },
  { title: 'Da compra à decisão', steps: ['Stock', 'IA prevê', 'Compra', 'Margem', 'Lucro'] },
];

/** Benefit titles from the brief (numbers stay exclusively in the proof metrics). */
const benefits = [
  { icon: 'TrendingUp', title: 'Margem Real' },
  { icon: 'Shield', title: 'Controlo Total' },
  { icon: 'Zap', title: 'Velocidade' },
  { icon: 'Bot', title: 'Automação' },
  { icon: 'Users', title: 'Equipa Alinhada' },
  { icon: 'Brain', title: 'IA Operacional' },
];

const timeline = [
  { step: '01', title: 'Descoberta' },
  { step: '02', title: 'Configuração' },
  { step: '03', title: 'Treino' },
  { step: '04', title: 'Integração' },
  { step: '05', title: 'Lançamento' },
  { step: '06', title: 'Otimização' },
];

const PROOF = AUTOMATION.proof;

const QookLanding = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const relatedProducts = PRODUCTS.filter((p) => AUTOMATION.products.includes(p.slug));

      const manifestoLines = ['Já não geres um restaurante.', 'Comandas uma operação.'];

  return (
    <Layout>
      {/* R20.1 — scroll depth (renders nothing). */}
      <ScrollDepth location="qook" />
      <SEO
        title="Qook — Sistema tudo-em-um para restaurantes | Getboost"
        description="Qook centraliza pedidos, ementa digital, pagamentos, stock, KDS, equipa e IA num único SaaS pensado para restaurantes, cafés, bares e dark kitchens em Portugal."
        canonical="/qook"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* ==================================================== 01 HERO */}
      <section ref={heroRef} className="gb-surface-page relative overflow-hidden">
        
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[560px] w-[560px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(13,148,136,0.10) 0%, transparent 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                <span className="gb-eyebrow text-brand-600">Restauração · SaaS POS · Automação</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="ed-display mt-6 text-ink-primary text-[clamp(2.75rem,7vw,6.5rem)]"
              >
                A Qook centraliza <em style={{ color: 'var(--gb-automation-strong)' }}>pedidos, ementa, pagamentos, stock, KDS, equipa e IA</em>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Um sistema tudo-em-um para restaurantes, cafés, bares, takeaway e dark kitchens. Menos ferramentas, menos erros, mais margem.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to="/demo?produto=qook" onClick={() => analytics.trackClick('qook_hero', 'qook_demo', 'consideration')}>
                    Pedir Demonstração
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#prova">
                    Ver Casos Reais
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
                {['POS + KDS', 'Ementa Digital', 'Pagamentos', 'Stock + IA', 'Equipa'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Hero visual: Qook in action (illustrative). */}
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
                      steps={['Mesa', 'QR Code', 'Cozinha', 'Pronto', 'Pagamento', 'Fidelização']}
                      tint="var(--gb-automation-tint)"
                      strong="var(--gb-automation-strong)"
                    />
                    <div className="mt-5 flex flex-col gap-2 border-t border-black/[0.06] pt-4 text-[13px]">
                      {[
                        { who: 'Mesa 12', detail: 'Pedido: Bacalhau + Vinho · há 30s' },
                        { who: 'Cozinha', detail: 'KDS: Bacalhau em preparo · 8min' },
                        { who: 'Mesa 12', detail: 'Pagamento MB WAY · €47,50' },
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
            title="Ferramentas dispersas matam a margem do restaurante"
            description="A diferença entre gerir com folhas de papel e operar com um sistema que pensa por ti."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            <Reveal i={0}>
              <div className="gb-card h-full opacity-80">
                <p className="gb-eyebrow text-ink-tertiary">Restaurante sem Qook</p>
                <MiniFlow
                  steps={['Comandas em papel', 'Erros de cozinha', 'Stock às cegas', 'Faturação manual', 'Zero fidelização']}
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
                <p className="gb-eyebrow" style={{ color: 'var(--gb-automation-strong)' }}>Restaurante com Qook</p>
                <MiniFlow
                  steps={['Comanda digital', 'KDS automático', 'Stock em tempo real', 'Pagamento na mesa', 'Fidelização ativa']}
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
            title="Da mesa ao balanço, sem intervenção manual"
            description="O fluxo completo: o cliente pede, a cozinha produz, o stock baixa, a fatura sai — tudo sozinho."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Mesa', 'QR Code', 'Cozinha (KDS)', 'Stock baixa', 'Pagamento', 'Fidelização']}
                tint="var(--gb-automation-tint)"
                strong="var(--gb-automation-strong)"
              />
              <div className="mt-6 border-t border-black/[0.06] pt-5">
                <p className="gb-eyebrow text-ink-tertiary">A ação termina onde faz sentido</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Comanda fechada', 'Stock atualizado', 'Fatura emitida', 'Cliente fidelizado'].map((outcome) => (
                    <span
                      key={outcome}
                      className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-semibold"
                      style={{ background: 'var(--gb-automation-tint)', color: 'var(--gb-automation-strong)' }}
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
            title="Nove frentes, uma única plataforma"
            description="Combinamos as frentes que o teu restaurante exige — nunca pacotes fechados."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {buildTypes.map((type, i) => (
              <Reveal key={type.title} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <span
                    className="gb-icon-chip"
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-automation-tint)', ['--gb-chip-fg' as string]: 'var(--gb-automation-strong)' }}
                  >
                    <span className="h-5 w-5" style={{ color: 'var(--gb-automation-strong)' }} />
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
            eyebrow="Jornadas"
            title="Três fluxos, um só sistema"
            description="O mesmo sistema adapta-se ao modelo do teu negócio."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {journeys.map((journey, i) => (
              <Reveal key={journey.title} i={i}>
                <div className="gb-card gb-card-lift h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">{journey.title}</h3>
                  <MiniFlow
                    steps={journey.steps}
                    tint="var(--gb-automation-tint)"
                    strong="var(--gb-automation-strong)"
                  />
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 06 PROVA */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Resultados que se veem no balanço"
            description="Métricas de restaurantes a operar com Qook — com origem rastreada."
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {PROOF.map((p, i) => (
              <Reveal key={p.k} i={i}>
                <div className="gb-surface-card-elevated h-full">
                  <div className="gb-text-display" style={{ color: 'var(--gb-automation-strong)' }}><CountUp value={p.k} /></div>
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
                    style={{ ['--gb-chip-bg' as string]: 'var(--gb-automation-tint)', ['--gb-chip-fg' as string]: 'var(--gb-automation-strong)' }}
                  >
                    <span className="h-5 w-5" style={{ color: 'var(--gb-automation-strong)' }} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-ink-primary">{benefit.title}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 07 WHY GETBOOST */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Porquê a Getboost"
            title="POS entregue vs operação gerida"
            description="A diferença entre instalar software e ter um parceiro que opera contigo."
          />
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 md:grid-cols-2">
            <Reveal i={0}>
              <div className="rounded-2xl border border-black/[0.06] bg-white p-6 opacity-80 md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em] text-ink-tertiary">POS tradicional</h3>
                <ul className="mt-4 flex flex-col gap-3">
                  {[
                    { weak: 'Só fatura', note: 'não gere operação' },
                    { weak: 'Sem stock', note: 'ruturas constantes' },
                    { weak: 'Sem fidelização', note: 'clientes perdidos' },
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
              <div className="rounded-2xl border border-automation-base/25 bg-white p-6 shadow-[0_18px_44px_-20px_var(--gb-automation-glow)] md:p-8">
                <h3 className="gb-text-small font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--gb-automation-strong)' }}>Getboost + Qook</h3>
                <MiniFlow
                  steps={['POS + KDS + Stock', 'Automação total', 'IA operacional', 'Escala sem caos', 'Parceiro 24/7']}
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
        title="Da configuração à operação, em dias"
        description="Um processo fechado: cada fase tem dono, prazo e critério de saída."
        steps={timeline}
        hue={{ base: 'var(--gb-automation-base)', strong: 'var(--gb-automation-strong)', tint: 'var(--gb-automation-tint)' }}
      />

      {/* ==================================================== 10 PROVA */}
            {/* 10B CASOS — resultados de clientes (motor partilhado, sem conteúdo inventado) */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <CaseProofStrip
            slugs={['qook']}
            tint="var(--gb-automation-tint)"
            strong="var(--gb-automation-strong)"
            trackingLocation="qook_cases"
          />
        </div>
      </section>

<section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Qook a correr em produção"
            description="O nosso POS corre em restaurantes reais — a mesma engenharia que instalamos no teu negócio."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {relatedProducts.map((product, i) => (
              <Reveal key={product.slug} i={i}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'qook_proof')}>
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
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Precisamos de comprar hardware novo?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Não necessariamente: a Qook corre em tablet e telemóvel, usa QR Code na mesa e integra as impressoras térmicas que já tens.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-1" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">E os pagamentos?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">MB WAY, cartão, Multibanco e carteira digital — com divisão de conta e conciliação no fim do dia.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-2" i={0}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">A equipa vai adaptar-se?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Perfis e permissões por função, escalas e registo de desempenho — cada pessoa vê só o que precisa para o seu turno.</p>
                </div>
              </Reveal>
              <Reveal key="objecao-3" i={1}>
                <div className="gb-card h-full">
                  <h3 className="gb-text-h3 !text-xl text-ink-primary">Quanto custa?</h3>
                  <p className="gb-text-body mt-3 text-ink-secondary">Pede uma demonstração e recebe um plano em 48 horas — sem compromisso.</p>
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
                  Pronto para <span style={{ color: '#ff4000' }}>transformar o teu restaurante</span>?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Conta-nos o teu conceito — voltamos com demo, plano e investimento em menos de 48 horas.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button asChild size="lg">
                    <Link to="/demo?produto=qook" onClick={() => analytics.trackClick('qook_cta', 'qook_demo', 'consideration')}>
                      Pedir Demonstração
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`} onClick={() => analytics.trackClick('qook_cta', 'qook_contact', 'consideration')}>
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
        trackingSource="qook"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default QookLanding;