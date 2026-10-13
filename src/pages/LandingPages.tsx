import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Check, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import { CountUp } from '@/components/ui/count-up';
import { MiniFlow } from '@/components/ui/mini-flow';
import { Button } from '@/components/ui/button';
import { SectionHeader } from '@/components/ui/section-header';
import { ScrollDepth } from '@/components/ScrollDepth';
import { analytics } from '@/lib/analytics';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

const ACCENT = '#ff4000';

type Lang = 'pt' | 'en' | 'es';

type Feature = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

type Copy = {
  seoTitle: string;
  seoDescription: string;
  badge: string;
  manifestoLines: [string, string];
  intro: React.ReactNode;
  ctaProposal: string;
  ctaAudit: string;
  stats: { k: string; v: string }[];
  features: Feature[];
  finalTitle: React.ReactNode;
  ctaOpen: string;
  ctaClose: string;
  formHeadline: string;
  formSubhead: string;
  formGoals: string[];
  formMessagePlaceholder: string;
  briefingEyebrow: string;
};

const COPY: Record<Lang, Copy> = {
  pt: {
    seoTitle: 'Landing Pages de Alta Conversão | Getboost Digital',
    seoDescription:
      'Landing pages desenhadas para converter: copy persuasiva, UX cirúrgica, performance no verde e A/B testing contínuo. Do brief à primeira venda em dias.',
    badge: 'Landing Pages · High Converting · CRO · A/B Tested',
    manifestoLines: ['Uma página.', 'Uma decisão. Converter.'],
    intro: (
      <>
        Não construímos <em className="not-italic text-ink-primary">websites bonitos</em>. Construímos
        máquinas de conversão — uma única página, uma única promessa, um único CTA. Onde cada
        pixel, cada palavra e cada milissegundo trabalham para transformar cliques em clientes.
      </>
    ),
    ctaProposal: 'Pedir Proposta',
    ctaAudit: 'Auditoria de conversão 7 min',
    stats: [
      { k: '3.2×', v: 'Uplift médio 90 dias' },
      { k: '<2s', v: 'Largest Contentful Paint' },
      { k: '100/100', v: 'Core Web Vitals' },
      { k: '7d', v: 'Do brief ao live' },
    ],
    features: [
      {
        eyebrow: 'Copy Orientada a Conversão',
        title: 'Copy que Vende, Não que Descreve',
        tags: ['Framework AIDA', 'Value Proposition', 'Objection Handling', 'Prova Social'],
        body: 'Cada palavra tem um trabalho: prender atenção, criar tensão, resolver a objeção e empurrar para o clique. Escrevemos com base em research real ao teu público — não em suposições nem em templates genéricos.',
      },
      {
        eyebrow: 'Design de Alta Fricção Zero',
        title: 'UX Desenhada Para o Único Objectivo',
        tags: ['Above the Fold', 'Hierarquia Visual', 'CTAs Estratégicos', 'Mobile First'],
        body: 'Nada distrai. Nada compete com o CTA. Cada bloco tem intenção — do hero à secção final — e a hierarquia visual conduz o visitante numa única direcção: o próximo passo do funil.',
      },
      {
        eyebrow: 'Performance Técnica',
        title: 'Velocidade e Core Web Vitals no Verde',
        tags: ['LCP < 2.5s', 'CLS Zero', 'SEO Técnico', 'Edge Deploy'],
        body: 'Landing pages construídas com stack moderna, imagens optimizadas, lazy loading e deploy em edge. Menos de 200ms de time-to-first-byte e Core Web Vitals no verde — porque cada segundo custa conversões.',
      },
      {
        eyebrow: 'Tracking & Attribution',
        title: 'Dados Que Contam a História Toda',
        tags: ['GA4 & GTM', 'Meta CAPI', 'Heatmaps', 'Server-Side Events'],
        body: 'Instalamos tracking cirúrgico: eventos personalizados, funis, heatmaps e attribution multi-touch. Sabes exactamente onde perdes visitantes, que canal converte melhor e onde investir o próximo euro.',
      },
      {
        eyebrow: 'A/B Testing Contínuo',
        title: 'Iteração Que Multiplica Resultados',
        tags: ['Split Tests', 'Hipóteses Validadas', 'Reports Semanais', 'CRO Ativo'],
        body: 'Não entregamos e desaparecemos. Testamos headlines, ofertas, provas sociais e CTAs em ciclos curtos. Cada iteração é uma hipótese validada com dados — normalmente, 2 a 4× de uplift ao fim de 90 dias.',
      },
    ],
    finalTitle: (
      <>
        Pronto para transformar <span style={{ color: ACCENT }}>tráfego</span> em{' '}
        <span style={{ color: ACCENT }}>receita</span>?
      </>
    ),
    ctaOpen: 'Falar com um consultor',
    ctaClose: 'Fechar formulário',
    briefingEyebrow: 'Briefing · Landing Pages',
    formHeadline: 'Vamos desenhar a tua máquina de conversão.',
    formSubhead:
      'Diz-nos qual a oferta, o público e o canal de tráfego. Preparamos um plano de landing + CRO com timings e investimento claros.',
    formGoals: [
      'Captar leads qualificadas',
      'Vender um produto/serviço específico',
      'Testar uma nova oferta',
      'Suportar campanha de Paid Media',
      'Ainda a explorar',
    ],
    formMessagePlaceholder:
      'Oferta, público-alvo, canais de tráfego (Meta/Google/Orgânico), volume esperado, integrações (CRM, email)…',
  },
  en: {
    seoTitle: 'High-Converting Landing Pages | Getboost Digital',
    seoDescription:
      'Landing pages engineered to convert: persuasive copy, surgical UX, green Core Web Vitals and continuous A/B testing. From brief to first sale in days.',
    badge: 'Landing Pages · High Converting · CRO · A/B Tested',
    manifestoLines: ['One page.', 'One decision. Convert.'],
    intro: (
      <>
        We don’t build <em className="not-italic text-ink-primary">pretty websites</em>. We build
        conversion machines — one page, one promise, one CTA. Every pixel, every word and every
        millisecond works to turn clicks into customers.
      </>
    ),
    ctaProposal: 'Request Proposal',
    ctaAudit: '7-min conversion audit',
    stats: [
      { k: '3.2×', v: 'Average 90-day uplift' },
      { k: '<2s', v: 'Largest Contentful Paint' },
      { k: '100/100', v: 'Core Web Vitals' },
      { k: '7d', v: 'From brief to live' },
    ],
    features: [
      {
        eyebrow: 'Conversion-Driven Copy',
        title: 'Copy That Sells, Not Describes',
        tags: ['AIDA Framework', 'Value Proposition', 'Objection Handling', 'Social Proof'],
        body: 'Every word has a job: capture attention, build tension, defuse objections and push the click. We write from real audience research — never assumptions or generic templates.',
      },
      {
        eyebrow: 'Zero-Friction Design',
        title: 'UX Built Around a Single Goal',
        tags: ['Above the Fold', 'Visual Hierarchy', 'Strategic CTAs', 'Mobile First'],
        body: 'Nothing distracts. Nothing competes with the CTA. Every block has intent — from hero to footer — and visual hierarchy guides the visitor in one direction: the next funnel step.',
      },
      {
        eyebrow: 'Technical Performance',
        title: 'Speed and Green Core Web Vitals',
        tags: ['LCP < 2.5s', 'CLS Zero', 'Technical SEO', 'Edge Deploy'],
        body: 'Landing pages built on a modern stack: optimized images, lazy loading and edge deploy. Sub-200ms TTFB and green Core Web Vitals — because every second costs you conversions.',
      },
      {
        eyebrow: 'Tracking & Attribution',
        title: 'Data That Tells the Full Story',
        tags: ['GA4 & GTM', 'Meta CAPI', 'Heatmaps', 'Server-Side Events'],
        body: 'We install surgical tracking: custom events, funnels, heatmaps and multi-touch attribution. You know exactly where visitors drop off, which channel converts best and where to invest the next euro.',
      },
      {
        eyebrow: 'Continuous A/B Testing',
        title: 'Iteration That Compounds Results',
        tags: ['Split Tests', 'Validated Hypotheses', 'Weekly Reports', 'Active CRO'],
        body: 'We don’t ship and disappear. We test headlines, offers, social proof and CTAs in short cycles. Each iteration is a data-backed hypothesis — typically a 2–4× uplift within 90 days.',
      },
    ],
    finalTitle: (
      <>
        Ready to turn <span style={{ color: ACCENT }}>traffic</span> into{' '}
        <span style={{ color: ACCENT }}>revenue</span>?
      </>
    ),
    ctaOpen: 'Talk to a consultant',
    ctaClose: 'Close form',
    briefingEyebrow: 'Briefing · Landing Pages',
    formHeadline: 'Let’s design your conversion machine.',
    formSubhead:
      'Tell us the offer, the audience and the traffic channel. We’ll come back with a landing + CRO plan, timelines and investment.',
    formGoals: [
      'Capture qualified leads',
      'Sell a specific product/service',
      'Test a new offer',
      'Support a Paid Media campaign',
      'Still exploring',
    ],
    formMessagePlaceholder:
      'Offer, target audience, traffic channels (Meta/Google/Organic), expected volume, integrations (CRM, email)…',
  },
  es: {
    seoTitle: 'Landing Pages de Alta Conversión | Getboost Digital',
    seoDescription:
      'Landing pages diseñadas para convertir: copy persuasivo, UX quirúrgica, Core Web Vitals en verde y A/B testing continuo. Del brief a la primera venta en días.',
    badge: 'Landing Pages · High Converting · CRO · A/B Tested',
    manifestoLines: ['Una página.', 'Una decisión. Convertir.'],
    intro: (
      <>
        No construimos <em className="not-italic text-ink-primary">webs bonitas</em>. Construimos
        máquinas de conversión — una página, una promesa, un único CTA. Cada píxel, cada palabra y
        cada milisegundo trabajan para convertir clics en clientes.
      </>
    ),
    ctaProposal: 'Solicitar propuesta',
    ctaAudit: 'Auditoría de conversión 7 min',
    stats: [
      { k: '3.2×', v: 'Uplift medio a 90 días' },
      { k: '<2s', v: 'Largest Contentful Paint' },
      { k: '100/100', v: 'Core Web Vitals' },
      { k: '7d', v: 'Del brief al live' },
    ],
    features: [
      {
        eyebrow: 'Copy Orientado a Conversión',
        title: 'Copy que Vende, No que Describe',
        tags: ['Framework AIDA', 'Propuesta de Valor', 'Manejo de Objeciones', 'Prueba Social'],
        body: 'Cada palabra tiene una misión: captar atención, crear tensión, resolver la objeción y empujar al clic. Escribimos con research real de tu audiencia — no con suposiciones ni plantillas genéricas.',
      },
      {
        eyebrow: 'Diseño Sin Fricción',
        title: 'UX Diseñada Para un Único Objetivo',
        tags: ['Above the Fold', 'Jerarquía Visual', 'CTAs Estratégicos', 'Mobile First'],
        body: 'Nada distrae. Nada compite con el CTA. Cada bloque tiene intención — del hero al final — y la jerarquía visual guía al visitante en una única dirección: el siguiente paso del funnel.',
      },
      {
        eyebrow: 'Rendimiento Técnico',
        title: 'Velocidad y Core Web Vitals en Verde',
        tags: ['LCP < 2.5s', 'CLS Cero', 'SEO Técnico', 'Edge Deploy'],
        body: 'Landing pages construidas con stack moderna: imágenes optimizadas, lazy loading y deploy en edge. Menos de 200 ms de TTFB y Core Web Vitals en verde — porque cada segundo cuesta conversiones.',
      },
      {
        eyebrow: 'Tracking y Atribución',
        title: 'Datos Que Cuentan Toda la Historia',
        tags: ['GA4 y GTM', 'Meta CAPI', 'Heatmaps', 'Eventos Server-Side'],
        body: 'Instalamos tracking quirúrgico: eventos personalizados, funnels, heatmaps y atribución multi-touch. Sabes exactamente dónde pierdes visitantes, qué canal convierte mejor y dónde invertir el próximo euro.',
      },
      {
        eyebrow: 'A/B Testing Continuo',
        title: 'Iteración Que Multiplica Resultados',
        tags: ['Split Tests', 'Hipótesis Validadas', 'Reports Semanales', 'CRO Activo'],
        body: 'No entregamos y desaparecemos. Testeamos headlines, ofertas, pruebas sociales y CTAs en ciclos cortos. Cada iteración es una hipótesis validada con datos — normalmente 2 a 4× de uplift en 90 días.',
      },
    ],
    finalTitle: (
      <>
        ¿Listo para convertir <span style={{ color: ACCENT }}>tráfico</span> en{' '}
        <span style={{ color: ACCENT }}>ingresos</span>?
      </>
    ),
    ctaOpen: 'Hablar con un consultor',
    ctaClose: 'Cerrar formulario',
    briefingEyebrow: 'Briefing · Landing Pages',
    formHeadline: 'Vamos a diseñar tu máquina de conversión.',
    formSubhead:
      'Cuéntanos la oferta, el público y el canal de tráfico. Preparamos un plan de landing + CRO con timings e inversión claros.',
    formGoals: [
      'Captar leads cualificados',
      'Vender un producto/servicio concreto',
      'Testear una nueva oferta',
      'Apoyar una campaña de Paid Media',
      'Aún explorando',
    ],
    formMessagePlaceholder:
      'Oferta, público objetivo, canales de tráfico (Meta/Google/Orgánico), volumen esperado, integraciones (CRM, email)…',
  },
};

const GROWTH = PILLARS.growth;

const LandingPages = () => {
  const { i18n } = useTranslation();
  const lang = (['pt', 'en', 'es'].includes(i18n.language) ? i18n.language : 'pt') as Lang;
  const t = COPY[lang];
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <Layout>
      <ScrollDepth location="landing_pages" />
      <SEO
        title={t.seoTitle}
        description={t.seoDescription}
        canonical="/solucoes/landing-pages"
        lang={lang}
      />

      {/* HERO */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(255,255,255,0) 65%)',
          }}
        />

        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="gb-eyebrow text-brand-600"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            {t.badge}
          </motion.div>

          <h1 className="gb-text-display mt-5 text-ink-primary">
            {t.manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === t.manifestoLines.length - 1 ? (
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>
                    {line}
                  </span>
                ) : (
                  line
                )}
              </motion.span>
            ))}
          </h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-10 h-px w-40 origin-left"
            style={{ background: `${ACCENT}b3` }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="gb-text-body mt-6 max-w-xl text-ink-secondary"
          >
            {t.intro}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <Link
              to="/contact"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')} onClick={() => analytics.trackClick('landing_pages_hero', 'landing_pages_contact', 'consideration')}>
              {t.ctaProposal}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-ink-secondary transition-colors hover:text-ink-primary"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              {t.ctaAudit}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-black/[0.06] pt-8"
          >
            {t.stats.map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-ink-tertiary">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURE LIST */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Cada bloco com uma intenção"
            description="Abre cada bloco para ver o que está incluído e como se liga ao resto da operação."
          />
          <div className="border-t border-black/[0.06]">
            {t.features.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={f.title} className="border-b border-black/[0.06]">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-black/[0.02]"
                  >
                    <div>
                      <div className="flex items-start gap-5">
                        <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'var(--gb-ink-tertiary)' }}>
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                        </span>
                        <h3 className="gb-text-h3 !text-3xl md:!text-4xl text-ink-primary">
                          {f.title}
                        </h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-10 flex flex-wrap gap-3">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="gb-chip"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-6">
                        <span
                          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em]"
                          style={{ color: isOpen ? ACCENT : 'var(--gb-ink-tertiary)' }}
                        >
                          {f.eyebrow}
                        </span>
                        <Minus
                          className="h-6 w-6 shrink-0 transition-transform"
                          style={{
                            color: isOpen ? ACCENT : 'var(--gb-ink-tertiary)',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                          }}
                        />
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden text-sm md:text-base leading-relaxed text-ink-secondary"
                          >
                            {f.body}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
            {/* COMO FUNCIONA */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como funciona"
            title="Da entrada ao resultado, sem fricção"
            description="Cada etapa alimenta a seguinte — do primeiro contacto à operação em contínuo."
          />
          <Reveal i={0}>
            <div className="gb-card mt-12">
              <MiniFlow
                steps={['Descoberta', 'Configuração', 'Lançamento', 'Operação', 'Escala']}
                tint="var(--gb-growth-tint)"
                strong="var(--gb-growth-strong)"
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* PROVA */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="A mesma engenharia, noutros produtos"
            description="Construímos e operamos os nossos próprios produtos com o mesmo rigor que aplicamos nos clientes."
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
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {PRODUCTS.filter((product) => product.slug === 'pikto').map((product) => (
              <Reveal key={product.slug} i={0}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'proof_crosslink')}>
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
            {PRODUCTS.filter((product) => product.slug === 'trackfy').map((product) => (
              <Reveal key={product.slug} i={0}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'proof_crosslink')}>
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
              <Link to="/produtos">
                Ver todos os produtos <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

<section className="gb-surface-page gb-section">
        <div className="gb-container"><div className="gb-cta-band relative overflow-hidden border border-white/10 text-center"><div className="relative">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse"
          >
            {t.finalTitle}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-14"
          >
            <button
              type="button"
              onClick={() => setContactOpen((v) => !v)}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {contactOpen ? t.ctaClose : t.ctaOpen}
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
            </div>
          </div>

          <ConsultantContactForm
            open={contactOpen}
            service={{
              slug: 'landing-pages',
              name: 'Landing Pages',
              accent: ACCENT,
              eyebrow: t.briefingEyebrow,
              headline: t.formHeadline,
              subhead: t.formSubhead,
              goalOptions: t.formGoals,
              messagePlaceholder: t.formMessagePlaceholder,
            }}
          />
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default LandingPages;
