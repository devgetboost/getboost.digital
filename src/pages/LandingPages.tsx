import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Zap, Grid2x2, Minus, Circle } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import type { StoredAudit } from '@/lib/auditHistory';

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
        Não construímos <em className="not-italic text-white">websites bonitos</em>. Construímos
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
        We don’t build <em className="not-italic text-white">pretty websites</em>. We build
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
        No construimos <em className="not-italic text-white">webs bonitas</em>. Construimos
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
      <SEO
        title={t.seoTitle}
        description={t.seoDescription}
        canonical="/solucoes/landing-pages"
        lang={lang}
      />

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{
            background:
              'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)',
          }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-28 md:py-40">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            {t.badge}
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.75rem,8vw,7rem)]">
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
            className="mt-10 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
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
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {t.ctaProposal}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button
              type="button"
              onClick={() => { setPreloadedAudit(null); setAuditOpen(true); }}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Zap className="h-4 w-4" style={{ color: ACCENT }} />
              {t.ctaAudit}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {t.stats.map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>
                  {s.k}
                </div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURE LIST */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10">
            {t.features.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={f.title} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <div className="flex items-start gap-5">
                        <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                        </span>
                        <h3 className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">
                          {f.title}
                        </h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-10 flex flex-wrap gap-3">
                        {f.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/25 px-4 py-1.5 text-xs md:text-sm text-white/80"
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
                          style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.6)' }}
                        >
                          {f.eyebrow}
                        </span>
                        <Minus
                          className="h-6 w-6 shrink-0 transition-transform"
                          style={{
                            color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)',
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
                            className="overflow-hidden text-sm md:text-base leading-relaxed text-white/70"
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
      <section className="bg-black text-white py-28 md:py-40">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
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
