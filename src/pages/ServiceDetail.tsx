import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { servicesData, type ServiceData } from '@/data/services';
import { useProduct } from '@/hooks/useContent';
import { mediaUrl } from '@/lib/contentApi';
import { captureLead } from '@/lib/commercialApi';
import { marketForLanguage, localeForLanguage } from '@/lib/commercialMarket';
import { analytics } from '@/lib/analytics';
import { StandardCTA } from '@/components/StandardCTA';
import DronePriceCalculator from '@/components/DronePriceCalculator';
import { SectionHeader } from '@/components/ui/section-header';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { z } from 'zod';
import nunoFounderPhotoAsset from '@/assets/nuno-cruz-fundador.png.asset.json';
const nunoFounderPhoto = nunoFounderPhotoAsset.url;
import softwareDevTeamPhoto from '@/assets/software-dev-team.jpg';
import peDiscoverImg from '@/assets/pe-discover.jpg';
import peBuildImg from '@/assets/pe-build.jpg';
import peLaunchImg from '@/assets/pe-launch.jpg';
import { fadeUp } from '@/components/ui/reveal';

/**
 * R19 execution — /solucoes/:slug detail on the frozen design system.
 *
 * This page serves the slugs that are not in the solutions submenu (old
 * bookmarks, unmapped imports) and renders the product published in the CMS.
 * It used to be the last dark, gradient-photo shell on the site; it now uses
 * the same tokens, grid, glow, motion and CTA band as every other public
 * route. Content, i18n keys, analytics events and the trusted lead capture
 * path are unchanged.
 */

const ACCENT = '#ff4000';

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const [service, setService] = useState<ServiceData | null>(null);

  // R1C6: a published product from the Clean V1 `products` +
  // `product_localizations` tables. The legacy `services` table and the static
  // `servicesData` fallback are both gone.
  const { data: product, loading } = useProduct(slug);
  const notFound = !loading && !product;

  useEffect(() => {
    if (!product) return;
    const image = mediaUrl(product.logoPath) ?? mediaUrl(product.heroMediaPath) ?? '';
    setService({
      key: product.slug,
      slug: product.slug,
      image,
      price: '',
      icon: '',
      headline: product.tagline ?? '',
      subheadline: product.description ?? '',
      // Clean V1 models a product's substance as `capabilities`; the legacy
      // pain/benefit/process/results/faq arrays have no column yet, so they
      // resolve empty and the page's i18n copy carries the messaging.
      painPoints: [],
      benefits: product.capabilities.map((capability) => ({ title: capability, desc: '' })),
      process: [],
      results: [],
      faq: [],
    });
  }, [product]);

  if (loading) {
    return (
      <Layout>
        <div className="gb-surface-page flex min-h-screen items-center justify-center">
          <p className="gb-text-body text-ink-tertiary">{t('servicesPage.serviceDetail.loading')}</p>
        </div>
      </Layout>
    );
  }

  if (notFound || !service) return <Navigate to="/solucoes" replace />;

  // Use translated content if available, fallback to static data
  const sc = (field: string) => t(`servicesPage.serviceContent.${service.key}.${field}`, { returnObjects: true, defaultValue: '' });
  const headline = (sc('headline') as unknown as string) || service.headline;
  const subheadline = (sc('subheadline') as unknown as string) || service.subheadline;
  const painPoints = (sc('painPoints') as unknown as string[])?.length ? (sc('painPoints') as unknown as string[]) : service.painPoints;
  const benefits = (sc('benefits') as unknown as {title:string;desc:string}[])?.length ? (sc('benefits') as unknown as {title:string;desc:string}[]) : service.benefits;
  const process = (sc('process') as unknown as {step:string;title:string;desc:string}[])?.length ? (sc('process') as unknown as {step:string;title:string;desc:string}[]) : service.process;
  const results = (sc('results') as unknown as {value:string;label:string}[])?.length ? (sc('results') as unknown as {value:string;label:string}[]) : service.results;
  const faq = (sc('faq') as unknown as {q:string;a:string}[])?.length ? (sc('faq') as unknown as {q:string;a:string}[]) : service.faq;

  return (
    <Layout>
      <SEO
        title={headline}
        description={subheadline}
        canonical={`/solucoes/${slug}`}
        image={service.image}
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* Hero */}
      {service.key === 'softwareDev' ? (
        <SoftwareDevHero headline={headline} subheadline={subheadline} serviceKey={service.key} />
      ) : (
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.10) 0%, rgba(255,255,255,0) 65%)' }}
        />

        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/solucoes" className="gb-link-more inline-flex items-center gap-2 text-sm text-ink-secondary transition-colors hover:text-ink-primary">
              <ArrowLeft className="h-4 w-4" /> {t('servicesPage.serviceDetail.backToServices')}
            </Link>
          </motion.div>

          <div className="mt-10 grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span className="gb-eyebrow text-brand-600">Soluções</span>
              <h1 className="gb-text-display mt-5 text-ink-primary">{headline}</h1>
              <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">{subheadline}</p>

              {service.price ? (
                <div className="mt-6 flex items-center gap-2 text-sm text-ink-secondary">
                  <span>{t('servicesPage.serviceDetail.startingFrom')}</span>
                  <span className="text-2xl font-bold text-ink-primary">{service.price}</span>
                </div>
              ) : null}

              <div className="mt-10 flex flex-wrap gap-4">
                <StandardCTA
                  i18nKey="servicesPage.serviceDetail.bookConsultation"
                  href="/booking"
                  category={`service_detail_${service.key}`}
                  ctaType="hero_cta"
                  size="lg"
                />
                <Button asChild size="lg" variant="outline">
                  <Link to="/contact" onClick={() => analytics.trackClick('service_detail', 'service_contact', 'consideration')}>
                    Falar com um especialista
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>

            {service.image ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="hidden lg:block"
              >
                <div className="gb-surface-card overflow-hidden !p-0">
                  <img src={service.image} alt={headline} className="aspect-[4/3] w-full object-cover" />
                </div>
              </motion.div>
            ) : null}
          </div>
        </div>

        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>
      )}

      {service.key !== 'softwareDev' && (
        <>
      {/* Pain Points */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O problema"
            title={t('servicesPage.serviceDetail.painPointsTitle')}
            description={t('servicesPage.serviceDetail.painPointsSubtitle')}
            align="center"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-12 grid max-w-5xl gap-6 sm:grid-cols-2">
            {painPoints.map((point, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="gb-surface-card flex items-start gap-4">
                <span aria-hidden="true" className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-error/10 text-sm font-bold text-error">
                  !
                </span>
                <p className="gb-text-body font-medium text-ink-primary">{point}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="O que muda"
            title={t('servicesPage.serviceDetail.benefitsTitle')}
            description={t('servicesPage.serviceDetail.benefitsSubtitle')}
            align="center"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="gb-card gb-card-lift h-full">
                <span aria-hidden="true" className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Check className="h-5 w-5 text-primary" />
                </span>
                <h3 className="gb-text-h3 text-ink-primary">{benefit.title}</h3>
                {benefit.desc ? <p className="gb-text-small mt-2 leading-relaxed text-ink-secondary">{benefit.desc}</p> : null}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process + Results */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader
            eyebrow="Como trabalhamos"
            title={t('servicesPage.serviceDetail.processTitle')}
            description={t('servicesPage.serviceDetail.processSubtitle')}
            align="center"
          />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((step, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="relative">
                <div className="gb-text-display mb-3 text-brand-600">{step.step}</div>
                <h3 className="gb-text-h3 mb-2 text-ink-primary">{step.title}</h3>
                <p className="gb-text-small leading-relaxed text-ink-secondary">{step.desc}</p>
                {i < process.length - 1 && (
                  <ArrowRight aria-hidden="true" className="absolute -right-4 top-8 hidden h-5 w-5 text-ink-tertiary lg:block" />
                )}
              </motion.div>
            ))}
          </motion.div>

          {results.length > 0 && (
            <>
              <div className="gb-container">
                <div className="gb-hairline-accent" />
              </div>
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-16 text-center">
                <h3 className="gb-text-h2 text-ink-primary">{t('servicesPage.serviceDetail.resultsTitle')}</h3>
              </motion.div>
              <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
                {results.map((result, i) => (
                  <motion.div key={i} variants={fadeUp} custom={i} className="gb-surface-card text-center">
                    <div className="gb-text-display text-brand-600">{result.value}</div>
                    <p className="gb-text-small mt-2 font-medium text-ink-secondary">{result.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </>
          )}
        </div>
      </section>

      {/* Special section for Drone Photography */}
      {service.key === 'drone' && <DronePriceCalculator />}

      {/* FAQ */}
      {faq.length > 0 && (
        <section className="gb-surface-section gb-section">
          <div className="gb-container">
            <SectionHeader
              eyebrow="Perguntas frequentes"
              title={t('servicesPage.serviceDetail.faqTitle')}
              align="center"
            />
            <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mx-auto mt-12 max-w-3xl space-y-4">
              {faq.map((item, i) => (
                <FaqItem key={i} question={item.q} answer={item.a} />
              ))}
            </motion.div>
          </div>
        </section>
      )}
        </>
      )}

      {service.key === 'softwareDev' && <SoftwareDevSections />}

      {/* CTA */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            <div className="gb-cta-band relative overflow-hidden border border-white/10 text-center">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
                style={{ background: 'radial-gradient(ellipse, rgba(255,64,0,0.28) 0%, rgba(0,0,0,0) 65%)' }}
              />
              <div className="relative">
                <h2 className="font-black leading-[0.98] tracking-tight text-[clamp(2rem,5vw,4rem)] text-ink-inverse">
                  {service.key === 'softwareDev'
                    ? 'Pronto para transformar o teu negócio numa máquina de crescimento?'
                    : t('servicesPage.serviceDetail.ctaTitle')}
                </h2>
                <p className="gb-text-body mx-auto mt-6 max-w-2xl text-white/70">
                  {service.key === 'softwareDev'
                    ? 'Vamos construir uma estrutura profissional, automatizada e preparada para o futuro.'
                    : t('servicesPage.serviceDetail.ctaSubtitle')}
                </p>
                <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
                  <StandardCTA
                    i18nKey="servicesPage.serviceDetail.ctaBook"
                    href="/booking"
                    category={`service_detail_${service.key}`}
                    ctaType="bottom_cta"
                    size="lg"
                    className="!bg-white !text-ink-primary hover:!bg-white/90"
                  />
                  <StandardCTA
                    i18nKey="servicesPage.serviceDetail.ctaChat"
                    href="/contact"
                    category={`service_detail_${service.key}`}
                    ctaType="bottom_secondary_cta"
                    size="lg"
                    icon={MessageCircle}
                    variant="outline"
                    className="border-white/40 !text-white hover:!bg-white/10"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} className="gb-surface-card !p-0 overflow-hidden">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-4 p-6 text-left">
        <span className="gb-text-body font-semibold text-ink-primary">{question}</span>
        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-ink-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <p className="gb-text-small px-6 pb-6 leading-relaxed text-ink-secondary">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const leadSchema = z.object({
  name: z.string().trim().min(1, 'Indica o teu nome.').max(100),
  email: z.string().trim().email('E-mail inválido.').max(255),
  phone: z.string().trim().min(1, 'Indica um contacto.').max(30),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

const SoftwareDevHero = ({ headline, subheadline, serviceKey }: { headline: string; subheadline: string; serviceKey: string }) => {
  const { i18n } = useTranslation();
  const market = marketForLanguage(i18n.language);
  const locale = localeForLanguage(i18n.language);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = leadSchema.safeParse({ name, email, phone, message });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    // R1C5: trusted server-side capture; retired `notes` is preserved in
    // `metadata.legacy` server-side.
    const { error } = await captureLead({
      source: `service_${serviceKey}`,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      message: parsed.data.message || null,
      market,
      locale,
    });
    setSubmitting(false);
    if (error) {
      toast.error('Erro ao enviar. Tenta novamente.');
      return;
    }
    analytics.trackForm('service_detail', `service_${serviceKey}_form_success`, {
      service: serviceKey,
      email: parsed.data.email,
    });
    setDone(true);
    toast.success('Recebemos o teu pedido. Falamos em breve!');
    setName(''); setEmail(''); setPhone(''); setMessage('');
  };

  return (
    <section className="gb-surface-page relative overflow-hidden">
      <div aria-hidden className="gb-grid-overlay" />
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-[10%] top-[-15%] h-[500px] w-[500px] rounded-full bg-primary/10 blur-[160px]" />
        <div className="absolute -bottom-[20%] -right-[5%] h-[600px] w-[600px] rounded-full bg-primary/10 blur-[180px]" />
      </div>

      <div className="gb-container relative gb-section !pt-10 md:!pt-16">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="gb-eyebrow text-brand-600">
              <Sparkles className="h-3.5 w-3.5" /> Software · SaaS · IA
            </span>
            <h1 className="gb-text-display mt-5 text-ink-primary">
              {headline.split(' ').slice(0, -3).join(' ')}{' '}
              <span className="text-brand-600">{headline.split(' ').slice(-3).join(' ')}</span>
            </h1>
            <p className="gb-text-body mt-6 max-w-2xl text-ink-secondary">{subheadline}</p>
            <div className="mt-8 flex flex-wrap gap-2">
              {['UI/UX Design', 'Mentoria', 'Co‑building', 'Manutenção de Produto', 'Segurança & Escalabilidade', 'Auditoria Digital 360º', 'Validação de Ideia', 'UX Research', 'Protótipos'].map((tag) => (
                <span key={tag} className="gb-chip text-ink-secondary">
                  <Check className="h-3.5 w-3.5 text-brand-600" /> {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Lead form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="gb-surface-card"
          >
            {done ? (
              <div className="py-10 text-center">
                <span aria-hidden="true" className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-7 w-7 text-primary" />
                </span>
                <h2 className="gb-text-h2 text-ink-primary">Obrigado!</h2>
                <p className="gb-text-body mt-2 text-ink-secondary">Recebemos o teu pedido. Entramos em contacto em menos de 24h.</p>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <h2 className="gb-text-h2 text-ink-primary">Vamos falar do teu projeto</h2>
                  <p className="gb-text-small mt-1 text-ink-secondary">Sessão gratuita e sem compromisso</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="gb-text-small mb-1.5 block font-medium text-ink-primary">O teu nome</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos tratar-te?" maxLength={100} required />
                  </div>
                  <div>
                    <label className="gb-text-small mb-1.5 block font-medium text-ink-primary">E-mail profissional</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@empresa.pt" maxLength={255} required />
                  </div>
                  <div>
                    <label className="gb-text-small mb-1.5 block font-medium text-ink-primary">Telemóvel</label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 9 999 9999" maxLength={30} required />
                  </div>
                  <div>
                    <label className="gb-text-small mb-1.5 block font-medium text-ink-primary">Conta-nos sobre o projeto (opcional)</label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Que desafio queres resolver?" rows={3} maxLength={1000} />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="h-12 w-full rounded-full text-base font-semibold gap-2"
                  >
                    {submitting ? 'A enviar...' : 'Agendar Sessão Gratuita'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <p className="gb-text-small flex items-center justify-center gap-1.5 pt-1 text-center text-ink-tertiary">
                    <Shield className="h-3 w-3" /> Os teus dados estão seguros. Não enviamos spam.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
      </div>

      <div className="gb-container pb-16">
        <div className="gb-hairline-accent" />
      </div>
    </section>
  );
};

const SoftwareDevSections = () => {
  const sections = [
    {
      tag: 'Discover',
      title: 'Descobre o que está a travar o crescimento do teu negócio.',
      text: 'Realizamos uma auditoria digital completa para identificar oportunidades de melhoria, automação e inovação. Da estratégia à execução, garantimos clareza técnica e foco nos resultados.',
      blocks: [
        { title: 'Auditoria Digital 360º', desc: 'Análise de sistemas, processos e presença online.' },
        { title: 'Validação de Ideia & UX Research', desc: 'Estudamos o comportamento dos teus clientes.' },
        { title: 'Protótipos e Service Design', desc: 'Desenhamos soluções que simplificam e encantam.' },
      ],
      cta: { label: 'Solicitar Diagnóstico', href: '/booking' },
      alt: false,
    },
    {
      tag: 'Design & Build',
      title: 'Transformamos decisões estratégicas em produtos digitais de alta performance.',
      text: 'Criamos sistemas robustos e escaláveis — desde websites e apps até plataformas SaaS completas. Adaptamo-nos à forma como a tua equipa trabalha, garantindo colaboração e resultados.',
      blocks: [
        { title: 'UI/UX Design Premium', desc: 'Interfaces intuitivas e visuais que refletem a tua marca.' },
        { title: 'Arquitetura & Desenvolvimento SaaS', desc: 'Sistemas modulares, seguros e multi-tenant.' },
        { title: 'Co-building & Mentoria Técnica', desc: 'Trabalhamos lado a lado com a tua equipa.' },
      ],
      cta: { label: 'Explorar Projetos', href: '/portfolio' },
      alt: true,
    },
    {
      tag: 'Launch & Evolve',
      title: 'O teu produto não para — evolui contigo.',
      text: 'Garantimos estabilidade, segurança e melhoria contínua. Acompanhamos o teu negócio com mentoria, manutenção e automação inteligente.',
      blocks: [
        { title: 'Evolução & Manutenção de Produto', desc: 'Performance e estabilidade garantidas.' },
        { title: 'Capacitação de Equipas (Enablement)', desc: 'Formamos talento interno para autonomia digital.' },
        { title: 'Segurança & Escalabilidade', desc: 'Sistemas prontos para crescer com confiança.' },
      ],
      cta: { label: 'Agendar Sessão Técnica', href: '/booking' },
      alt: false,
    },
  ];

  return (
    <>
      {/* Sobre a Getboost */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="order-2 lg:order-1">
              <span className="gb-eyebrow text-brand-600">Sobre a Getboost</span>
              <h2 className="gb-text-h2 mt-6 text-ink-primary">
                Desenvolvimento de software <span className="text-brand-600">à medida para empresas</span>
              </h2>
              <div className="gb-text-body mt-6 space-y-4 text-ink-secondary">
                <p>Na Getboost, criamos sistemas inteligentes que impulsionam empresas a escalar com confiança.</p>
                <p>Desenvolvemos soluções digitais à medida, desde plataformas web e aplicações móveis até sistemas SaaS completos, sempre com foco em performance, automação e experiência do utilizador.</p>
                <p>Combinamos engenharia de software, inteligência artificial e estratégia de produto para transformar processos complexos em soluções simples, seguras e escaláveis.</p>
                <p>Trabalhamos lado a lado com equipas e gestores para garantir que cada projeto nasce com propósito, cresce com tecnologia e evolui com dados reais.</p>
                <p className="font-semibold text-ink-primary">O resultado? Produtos digitais que não apenas funcionam, mas fazem o teu negócio trabalhar por ti.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="order-1 lg:order-2">
              <div className="gb-surface-card overflow-hidden !p-0">
                <img src={softwareDevTeamPhoto} alt="Equipa de desenvolvimento de software" className="aspect-[4/3] w-full object-cover" loading="lazy" width={1024} height={1024} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <ProductEngineeringCards sections={sections} />

      {/* Estratégia de Produto */}
      <section className="gb-surface-section gb-section relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.12) 0%, rgba(255,255,255,0) 70%)' }}
        />
        <div className="gb-container relative">
          <SectionHeader
            eyebrow="Estratégia de Produto"
            title={<>A melhor tecnologia <span className="text-brand-600">ao teu dispor.</span></>}
            description="Implementamos as tecnologias ideais para garantir robustez técnica, escalabilidade e inovação contínua. Encontramos o ponto ideal entre Pessoas (Desejável), Negócio (Viável) e Tecnologia (Exequível)."
            align="center"
          />
          <div className="relative mx-auto mt-14 aspect-square w-full max-w-[520px]">
            {[
              { label: 'Pessoas', sub: 'Desejável', cls: 'top-0 left-1/2 -translate-x-1/2', from: { x: 0, y: -60 } },
              { label: 'Negócio', sub: 'Viável', cls: 'bottom-0 left-0', from: { x: -60, y: 60 } },
              { label: 'Tecnologia', sub: 'Exequível', cls: 'bottom-0 right-0', from: { x: 60, y: 60 } },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.4, x: c.from.x, y: c.from.y }}
                whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.9, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute ${c.cls} flex aspect-square w-[62%] flex-col items-center justify-center rounded-full border border-brand-600/40 bg-brand-50 text-center`}
              >
                <span className="gb-text-h3 text-ink-primary">{c.label}</span>
                <span className="gb-text-small mt-1 text-ink-secondary">{c.sub}</span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white shadow-lg"
            >
              Ponto Ideal
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portfólio */}
      <section className="gb-surface-page gb-section">
        <div className="gb-container">
          <SectionHeader eyebrow="Portfólio" title={<>As <span className="text-brand-600">nossas criações.</span></>} align="center" />
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { name: 'Ascendi', desc: 'Aplicação móvel 360º para players em mobilidade.' },
              { name: 'Cleanwatts', desc: 'Diagnóstico energético para indústria e manufatura.' },
              { name: 'Abbott', desc: 'Medição de satisfação do cliente através de canais digitais.' },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="gb-card gb-card-lift h-full">
                <div className="gb-text-h3 mb-3 text-brand-600">{p.name}</div>
                <p className="gb-text-small leading-relaxed text-ink-secondary">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="mt-10 text-center">
            <Button asChild size="lg">
              <Link to="/portfolio" onClick={() => analytics.trackClick('service_detail', 'service_portfolio', 'consideration')}>
                Explorar Portfólio <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

type PESection = {
  tag: string;
  title: string;
  text: string;
  blocks: { title: string; desc: string }[];
};

const PE_IMAGES: Record<string, string> = {
  'Discover': peDiscoverImg,
  'Design & Build': peBuildImg,
  'Launch & Evolve': peLaunchImg,
};

const PE_SUBS: Record<string, string> = {
  'Discover': 'Minimização de riscos desde o primeiro dia',
  'Design & Build': 'De decisões a produtos de alta performance',
  'Launch & Evolve': 'Crescimento sustentável pós-entrega',
};

const ProductEngineeringCards = ({ sections }: { sections: PESection[] }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <section className="gb-surface-section gb-section">
      <div className="gb-container">
        <SectionHeader
          eyebrow="Como trabalhamos"
          title={<>Product <span className="text-brand-600">&amp; Engineering</span></>}
          align="center"
        />
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {sections.map((s, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="gb-card gb-card-lift relative flex flex-col overflow-hidden !p-0"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={PE_IMAGES[s.tag]}
                    alt={s.tag}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="h-56 w-full object-cover"
                  />
                  <span className="absolute right-0 top-0 z-10 inline-flex items-center rounded-bl-2xl bg-brand-500 px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-white">
                    {s.tag}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="gb-text-h3 mb-3 text-ink-primary">{s.tag}</h3>
                  <p className="gb-text-small mb-5 leading-relaxed text-ink-secondary">{PE_SUBS[s.tag]}</p>

                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="gb-link-more mt-auto inline-flex items-center gap-2 self-start text-sm font-extrabold uppercase tracking-wider text-brand-600 transition-all duration-300 hover:gap-3"
                  >
                    {isOpen ? 'Fechar' : 'Saber mais'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : '-rotate-90'}`} />
                  </button>
                </div>

                {/* Expand upward overlay */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: 'tween', duration: 0.35, ease: 'easeOut' }}
                      className="gb-surface-card absolute inset-x-0 bottom-0 max-h-[85%] overflow-y-auto !rounded-none !rounded-t-2xl"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <div className="gb-text-small font-extrabold uppercase tracking-widest text-ink-primary">{s.tag}</div>
                        <button
                          onClick={() => setOpenIdx(null)}
                          aria-label="Fechar"
                          className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-brand-600"
                        >
                          Fechar
                          <ChevronDown className="h-4 w-4 rotate-180" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {s.blocks.map((b, j) => (
                          <div key={j}>
                            <div className="gb-text-small font-bold text-ink-primary">{b.title}</div>
                            <div className="gb-text-small leading-relaxed text-ink-secondary">{b.desc}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServiceDetail;
