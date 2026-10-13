import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight,
  Zap,
  Check,
  X,
  Smartphone,
  Rocket,
  ShieldCheck,
  Layers,
  Bell,
  Database,
} from 'lucide-react';
import Layout from '@/components/Layout';
import { ScrollDepth } from '@/components/ScrollDepth';
import SEO from '@/components/SEO';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { CountUp } from '@/components/ui/count-up';
import CommercialAuditModal from '@/components/CommercialAuditModal';
import ConsultantContactForm from '@/components/ConsultantContactForm';
import { analytics } from '@/lib/analytics';
import { PILLARS } from '@/components/pillars/pillarData';
import { PRODUCTS } from '@/data/products';
import type { StoredAudit } from '@/lib/auditHistory';
import { Reveal } from '@/components/ui/reveal';

const SOFTWARE = PILLARS.software;

type Feature = { eyebrow: string; title: string; tags: string[]; body: string };

const features: Feature[] = [
  {
    eyebrow: 'Estratégia Mobile-First',
    title: 'Decidir antes de codar',
    tags: ['Product Discovery', 'Jornadas de Utilizador', 'Métricas de Retenção', 'Roadmap Trimestral'],
    body: 'Começamos por entender o problema, não a tecnologia. Mapeamos jornadas, hipóteses de valor e KPIs de retenção antes de escrever a primeira linha. O resultado é uma app com propósito claro — e não mais uma ficha institucional no ecossistema móvel.',
  },
  {
    eyebrow: 'Nativo vs Cross-Platform',
    title: 'A stack certa para cada caso',
    tags: ['React Native', 'Expo EAS', 'Swift/Kotlin quando necessário', 'Offline-first'],
    body: 'Escolhemos com honestidade técnica: React Native/Expo quando faz sentido acelerar iOS e Android com uma base comum; nativo puro quando o produto exige performance gráfica, hardware específico ou SDKs proprietários. Nunca por moda — sempre por argumentos.',
  },
  {
    eyebrow: 'Design de Produto',
    title: 'Interfaces que dão vontade de abrir',
    tags: ['Design System', 'Micro-interacções', 'Human Interface / Material 3', 'Acessibilidade AA'],
    body: 'Tipografia, espaçamento e gestos pensados para o polegar. Componentes vivem num design system versionado, com dark mode e acessibilidade nativa. Cada micro-interacção reforça a marca em vez de a diluir num template genérico.',
  },
  {
    eyebrow: 'Integrações e Backend',
    title: 'Sincronizada com o teu negócio',
    tags: ['Auth Segura', 'Push Notifications', 'Pagamentos In-App', 'Analytics de Produto'],
    body: 'Autenticação social e biométrica, notificações push segmentadas, compras in-app e integração directa com o teu CRM ou ERP. Instrumentamos eventos-chave desde o dia 1 para conseguires decidir com dados reais em vez de opiniões.',
  },
  {
    eyebrow: 'Publicação e Evolução',
    title: 'Da store ao review contínuo',
    tags: ['App Store & Play Console', 'OTA Updates', 'A/B Testing', 'Crash-free > 99.5%'],
    body: 'Tratamos de fichas, screenshots, políticas e submissões. Depois entramos em ciclos curtos com actualizações OTA, experimentação e monitorização de crashes. A app não termina no lançamento — começa aí.',
  },
];

const capabilityIcons = [Smartphone, Rocket, Layers, Bell, ShieldCheck, Database];

const timeline = [
  { step: '01', title: 'Descoberta' },
  { step: '02', title: 'Protótipo' },
  { step: '03', title: 'UX/UI' },
  { step: '04', title: 'Desenvolvimento' },
  { step: '05', title: 'Testes & QA' },
  { step: '06', title: 'Store + OTA' },
];

/**
 * R19.6 — Mobile premium page on the frozen design system.
 * SEO props preserved byte-identical; routes, schema and tracking untouched.
 */
const DesenvolvimentoMobile = () => {
  const { i18n } = useTranslation();
  const [auditOpen, setAuditOpen] = useState(false);
  const [preloadedAudit, setPreloadedAudit] = useState<StoredAudit | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const clusterY = useTransform(scrollYProgress, [0, 1], [0, 32]);

  const bookingHref = i18n.language === 'pt' ? '/booking' : `/${i18n.language}/booking`;
  const contactHref = i18n.language === 'pt' ? '/contact' : `/${i18n.language}/contact`;
  const relatedProducts = PRODUCTS.filter((p) => SOFTWARE.products.includes(p.slug));

  return (
    <Layout>
      <ScrollDepth location="mobile" />
      <SEO
        title="Desenvolvimento Mobile — Apps iOS e Android de Alta Performance | Getboost Digital"
        description="Apps nativas e cross-platform (React Native, Swift, Kotlin) desenhadas para retenção, performance e integração total com o teu negócio."
        canonical="/solucoes/desenvolvimento-mobile"
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
                <span className="gb-eyebrow text-brand-600">Mobile · iOS · Android · React Native</span>
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                A tua marca <span style={{ color: 'var(--gb-software-strong)' }}>cabe no bolso</span> deles.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Uma app não é um site com moldura. É um produto que vive no bolso do teu cliente, notifica, cobra e fideliza. Desenhamos e construímos apps iOS e Android que abrem depressa, funcionam offline e crescem com o teu negócio.
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <Link to={bookingHref} onClick={() => analytics.trackClick('mobile_hero', 'mobile_booking', 'consideration')}>
                    Agendar Diagnóstico
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to={contactHref} onClick={() => analytics.trackClick('mobile_hero', 'mobile_contact', 'consideration')}>
                    Pedir Proposta
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
                {['iOS + Android', 'React Native', 'Offline-first', 'Push', 'OTA'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

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
                      <span className="gb-eyebrow text-ink-tertiary">App em produção</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-1 text-[11px] font-semibold text-success">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
                        </span>
                        Live
                      </span>
                    </div>
                    <MiniFlow
                      steps={['Ideia', 'Protótipo', 'App', 'Store', 'Push', 'Retenção']}
                      tint="var(--gb-software-tint)"
                      strong="var(--gb-software-strong)"
                    />
                    <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
                      {[
                        { v: 'iOS + Android' },
                        { v: 'Cold start < 2s' },
                        { v: 'Crash-free > 99.5%' },
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

      {/* ==================================================== 02 CAPACIDADES */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Capacidades"
            title="Do problema ao produto, sem atalhos"
            description="Cinco frentes que combinamos conforme o contexto — nunca pacotes fechados."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = capabilityIcons[i % capabilityIcons.length];
              return (
                <Reveal key={feature.title} i={i % 3}>
                  <div className="gb-card gb-card-lift h-full !p-6">
                    <span
                      className="gb-icon-chip"
                      style={{ ['--gb-chip-bg' as string]: 'var(--gb-software-tint)', ['--gb-chip-fg' as string]: 'var(--gb-software-strong)' }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="gb-eyebrow mt-5" style={{ color: 'var(--gb-software-strong)' }}>{feature.eyebrow}</p>
                    <h3 className="gb-text-h3 mt-2 !text-xl text-ink-primary">{feature.title}</h3>
                    <p className="gb-text-small mt-2 text-ink-secondary">{feature.body}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {feature.tags.map((tag) => (
                        <span key={tag} className="gb-chip">{tag}</span>
                      ))}
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================================================== 03 PROCESSO */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Implementação"
            title="Da descoberta à store, com marcos claros"
            description="Um processo fechado: cada fase tem dono, prazo e critério de saída."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {timeline.map((t, i) => (
              <Reveal key={t.step} i={i % 3}>
                <div className="gb-card gb-card-lift h-full !p-6">
                  <div className="font-mono text-sm tracking-[0.22em]" style={{ color: 'var(--gb-software-strong)' }}>{t.step}</div>
                  <h3 className="gb-text-h3 mt-4 !text-xl text-ink-primary">{t.title}</h3>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================== 04 PROVA */}
      <section className="gb-surface-subtle gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Prova"
            title="Apps nossas, a correr em produção"
            description="Os produtos que desenhámos, construímos e operamos — todos os dias."
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {relatedProducts.map((product, i) => (
              <Reveal key={product.slug} i={i}>
                <Link to={product.to as string} className="group block h-full" onClick={() => analytics.trackProduct(product.slug, 'click', 'mobile_proof')}>
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

      {/* ==================================================== 05 FINAL CTA */}
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
                  Vamos colocar a tua marca <span style={{ color: '#ff4000' }}>no ecrã inicial</span> deles?
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  Diz-nos o objectivo da app, público-alvo e integrações necessárias. Devolvemos proposta técnica, arquitectura e cronograma.
                </p>
                <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
                  <Button size="lg" onClick={() => setContactOpen((v) => !v)}>
                    {contactOpen ? 'Fechar formulário' : 'Falar com um consultor'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-white/40 !text-white hover:!bg-white hover:!text-ink-primary">
                    <Link to={bookingHref} onClick={() => analytics.trackClick('mobile_cta', 'mobile_booking', 'consideration')}>
                      Agendar Diagnóstico
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
                  ou faz a auditoria de produto de 7 min
                </button>
                <div className="mx-auto mt-10 max-w-3xl text-left">
                  <ConsultantContactForm
                    open={contactOpen}
                    service={{
                      slug: 'desenvolvimento-mobile',
                      name: 'Desenvolvimento Mobile',
                      accent: '#ff4000',
                      eyebrow: 'Briefing · Desenvolvimento Mobile',
                      headline: 'Vamos desenhar a tua próxima app.',
                      subhead: 'Diz-nos o objectivo da app, público-alvo e integrações necessárias. Devolvemos proposta técnica, arquitectura e cronograma.',
                      goalOptions: [
                        'Lançar app nova (MVP)',
                        'Rebuild de app existente',
                        'Publicar em iOS e Android em paralelo',
                        'Integrar com CRM/ERP ou backend próprio',
                        'Ainda a explorar',
                      ],
                      messagePlaceholder: 'Público-alvo, funcionalidades-chave, integrações (pagamentos, push, mapas, hardware)…',
                    }}
                  />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <CommercialAuditModal
        open={auditOpen}
        trackingSource="mobile"
        onClose={() => { setAuditOpen(false); setPreloadedAudit(null); }}
        preloaded={preloadedAudit}
      />
    </Layout>
  );
};

export default DesenvolvimentoMobile;