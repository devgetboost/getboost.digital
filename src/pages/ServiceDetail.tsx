import { useParams, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown, MessageCircle, Shield, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { servicesData, type ServiceData } from '@/data/services';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';
import { StandardCTA } from '@/components/StandardCTA';
import DronePriceCalculator from '@/components/DronePriceCalculator';
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t, i18n } = useTranslation();
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchService = async () => {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('slug', slug || '')
        .eq('status', 'published')
        .maybeSingle();

      if (data && !error) {
        const staticMatch = servicesData.find(s => s.key === data.key);
        setService({
          key: data.key,
          slug: data.slug,
          image: data.image || staticMatch?.image || '',
          price: data.price,
          icon: data.icon || staticMatch?.icon || '',
          headline: data.headline,
          subheadline: data.subheadline,
          painPoints: (data.pain_points as string[]) || [],
          benefits: (data.benefits as { title: string; desc: string }[]) || [],
          process: (data.process as { step: string; title: string; desc: string }[]) || [],
          results: (data.results as { value: string; label: string }[]) || [],
          faq: (data.faq as { q: string; a: string }[]) || [],
        });
      } else {
        const staticService = servicesData.find(s => s.slug === slug);
        if (staticService) {
          setService(staticService);
        } else {
          setNotFound(true);
        }
      }
      setLoading(false);
    };
    fetchService();
  }, [slug]);

  if (loading) {
    return <Layout><div className="min-h-screen flex items-center justify-center text-muted-foreground">{t('servicesPage.serviceDetail.loading')}</div></Layout>;
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
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={service.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,10,0,0.82) 0%, rgba(255,64,0,0.75) 50%, rgba(26,10,0,0.85) 100%)' }} />
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-sm" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 blur-sm" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-20 md:pb-28">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link to="/solucoes" className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm mb-8">
              <ArrowLeft className="w-4 h-4" /> {t('servicesPage.serviceDetail.backToServices')}
            </Link>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
                {headline}
              </h1>
              <p className="text-lg md:text-xl text-white/75 mt-5 leading-relaxed">
                {subheadline}
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <StandardCTA
                  i18nKey="servicesPage.serviceDetail.bookConsultation"
                  href="/booking"
                  category={`service_detail_${service.key}`}
                  ctaType="hero_cta"
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-[12px] px-8 py-3.5 h-auto text-base font-semibold"
                />
                <div className="flex items-center gap-2 text-white/80">
                  <span className="text-sm">{t('servicesPage.serviceDetail.startingFrom')}</span>
                  <span className="text-2xl font-bold text-white">{service.price}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="hidden lg:block"
            >
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={service.image} alt={headline} className="w-full aspect-[4/3] object-cover" />
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C240 10 480 0 720 10C960 20 1200 40 1440 30V60H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>
      )}

      {service.key !== 'softwareDev' && (
        <>
      {/* Pain Points */}
      <section className="section-padding">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('servicesPage.serviceDetail.painPointsTitle')}</h2>
            <p className="text-muted-foreground mb-12">{t('servicesPage.serviceDetail.painPointsSubtitle')}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 gap-6">
            {painPoints.map((point, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-4 text-left p-6 bg-section-alt card-boost card-boost-hover">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-destructive text-sm font-bold">!</span>
                </div>
                <p className="text-base font-medium">{point}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* Benefits */}
      <section className="section-padding bg-section-alt">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('servicesPage.serviceDetail.benefitsTitle')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('servicesPage.serviceDetail.benefitsSubtitle')}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-background p-6 card-boost card-boost-hover">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Process + Results */}
      <section className="section-padding">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('servicesPage.serviceDetail.processTitle')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{t('servicesPage.serviceDetail.processSubtitle')}</p>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {process.map((step, i) => (
              <motion.div key={i} variants={fadeUp} className="relative">
                <div className="text-5xl font-black text-primary/10 mb-3">{step.step}</div>
                <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < process.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute top-8 -right-4 w-5 h-5 text-primary/30" />
                )}
              </motion.div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('servicesPage.serviceDetail.resultsTitle')}</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {results.map((result, i) => (
              <motion.div key={i} variants={fadeUp} className="text-center p-8 bg-primary/5 card-boost card-boost-hover">
                <div className="text-3xl md:text-4xl font-black text-primary mb-2">{result.value}</div>
                <p className="text-sm text-muted-foreground font-medium">{result.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Special section for Drone Photography */}
      {service.key === 'drone' && <DronePriceCalculator />}

      {/* FAQ */}
      <section className="section-padding bg-section-alt">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('servicesPage.serviceDetail.faqTitle')}</h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="space-y-4">
            {faq.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </motion.div>
        </div>
      </section>
        </>
      )}

      {service.key === 'softwareDev' && <SoftwareDevSections />}



      {/* CTA */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0">
          <img src={service.image} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(26,10,0,0.85) 0%, rgba(255,64,0,0.78) 50%, rgba(26,10,0,0.88) 100%)' }} />
        </div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-sm" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/5 blur-sm" />
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative max-w-3xl mx-auto px-6 md:px-12 text-center">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="space-y-6">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {service.key === 'softwareDev'
                ? 'Pronto para transformar o teu negócio numa máquina de crescimento?'
                : t('servicesPage.serviceDetail.ctaTitle')}
            </h2>
            <p className="text-xl md:text-2xl text-white/80 font-medium">
              {service.key === 'softwareDev'
                ? 'Vamos construir uma estrutura profissional, automatizada e preparada para o futuro.'
                : t('servicesPage.serviceDetail.ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <StandardCTA
                i18nKey="servicesPage.serviceDetail.ctaBook"
                href="/booking"
                category={`service_detail_${service.key}`}
                ctaType="bottom_cta"
                size="lg"
                className="bg-white text-primary hover:bg-white/90 rounded-[12px] px-8 py-4 h-auto text-base font-semibold shadow-lg"
              />
              <StandardCTA
                i18nKey="servicesPage.serviceDetail.ctaChat"
                href="/contact"
                category={`service_detail_${service.key}`}
                ctaType="bottom_secondary_cta"
                size="lg"
                icon={MessageCircle}
                variant="outline"
                className="border-2 border-white text-white bg-white/10 hover:bg-white/20 rounded-[12px] px-8 py-4 h-auto text-base font-semibold"
              />
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
    <motion.div variants={fadeUp} className="bg-background rounded-2xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-6 text-left">
        <span className="font-semibold text-base pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-6 pb-6 pt-0">
          <p className="text-muted-foreground leading-relaxed text-sm">{answer}</p>
        </div>
      )}
    </motion.div>
  );
};

const leadSchema = z.object({
  name: z.string().trim().min(2, 'Nome demasiado curto').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().min(6, 'Telemóvel inválido').max(30),
  message: z.string().trim().max(1000).optional(),
});

const SoftwareDevHero = ({ headline, subheadline, serviceKey }: { headline: string; subheadline: string; serviceKey: string }) => {
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
    const { error } = await supabase.from('leads').insert({
      source: `service_${serviceKey}`,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      notes: parsed.data.message || null,
    } as any);
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
    <section className="relative overflow-hidden hero-wave-clip bg-[#0a0a0a]">
      {/* Ambient orange glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[160px] bg-primary/25" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full blur-[180px] bg-primary/20" />
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-20 md:pb-28">

        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" /> Software · SaaS · IA
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.1]">
              {headline.split(' ').slice(0, -3).join(' ')}{' '}
              <span className="text-primary">{headline.split(' ').slice(-3).join(' ')}</span>
            </h1>
            <div className="flex flex-wrap gap-2 mt-8">
              {['UI/UX Design', 'Mentoria', 'Co‑building', 'Manutenção de Produto', 'Segurança & Escalabilidade', 'Auditoria Digital 360º', 'Validação de Ideia', 'UX Research', 'Protótipos'].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/5 text-white/80 text-sm backdrop-blur-sm">
                  <Check className="w-3.5 h-3.5 text-primary" /> {tag}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right — Lead form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="rounded-3xl bg-white p-8 md:p-10 shadow-[0_30px_80px_-20px_rgba(255,64,0,0.35)] border border-white/10"
          >
            {done ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-2">Obrigado!</h3>
                <p className="text-muted-foreground">Recebemos o teu pedido. Entramos em contacto em menos de 24h.</p>
              </div>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-foreground">Vamos falar do teu projeto</h3>
                  <p className="text-sm text-muted-foreground mt-1">Sessão gratuita e sem compromisso</p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">O teu nome</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como podemos tratar-te?" maxLength={100} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">E-mail profissional</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="exemplo@empresa.pt" maxLength={255} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Telemóvel</label>
                    <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+351 9 999 9999" maxLength={30} required />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-1.5">Conta-nos sobre o projeto (opcional)</label>
                    <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Que desafio queres resolver?" rows={3} maxLength={1000} />
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full h-12 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 text-base font-semibold gap-2"
                  >
                    {submitting ? 'A enviar...' : 'Agendar Sessão Gratuita'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5 pt-1">
                    <Shield className="w-3 h-3" /> Os teus dados estão seguros. Não enviamos spam.
                  </p>
                </form>
              </>
            )}
          </motion.div>
        </div>
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
      {/* Secção 2 — Sobre a Getboost */}
      <section className="section-padding bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="order-2 lg:order-1">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-8" style={{ color: '#1a1b3a' }}>
                Desenvolvimento de software <span className="text-primary">à medida para empresas</span>
              </h2>
              <div className="text-muted-foreground leading-relaxed text-base md:text-lg space-y-4">
                <p>Na Getboost, criamos sistemas inteligentes que impulsionam empresas a escalar com confiança.</p>
                <p>Desenvolvemos soluções digitais à medida, desde plataformas web e aplicações móveis até sistemas SaaS completos, sempre com foco em performance, automação e experiência do utilizador.</p>
                <p>Combinamos engenharia de software, inteligência artificial e estratégia de produto para transformar processos complexos em soluções simples, seguras e escaláveis.</p>
                <p>Trabalhamos lado a lado com equipas e gestores para garantir que cada projeto nasce com propósito, cresce com tecnologia e evolui com dados reais.</p>
                <p className="font-semibold text-foreground">O resultado? Produtos digitais que não apenas funcionam, mas fazem o teu negócio trabalhar por ti.</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="order-1 lg:order-2">
              <div className="rounded-2xl overflow-hidden shadow-2xl">
                <img src={softwareDevTeamPhoto} alt="Equipa de desenvolvimento de software" className="w-full aspect-[4/3] object-cover" loading="lazy" width={1024} height={1024} />
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      <ProductEngineeringCards sections={sections} />


      {/* Secção 5 — Estratégia de Produto */}
      <section className="section-padding bg-[#0a0a0a] text-white relative overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.15) 0%, transparent 70%)' }} />
        <div className="relative max-w-5xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-14 max-w-3xl mx-auto">
            <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-4">Estratégia de Produto</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5 leading-tight text-white">A melhor tecnologia <span className="text-primary">ao teu dispor.</span></h2>
            <p className="text-white/70 text-base md:text-lg leading-relaxed">
              Implementamos as tecnologias ideais para garantir robustez técnica, escalabilidade e inovação contínua. Encontramos o ponto ideal entre Pessoas (Desejável), Negócio (Viável) e Tecnologia (Exequível).
            </p>
          </motion.div>
          <div className="relative mx-auto w-full max-w-[520px] aspect-square">
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
                className={`absolute ${c.cls} w-[62%] aspect-square rounded-full flex flex-col items-center justify-center text-center border border-primary/60`}
                style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.35) 0%, rgba(255,64,0,0.12) 70%)', mixBlendMode: 'screen' }}
              >
                <span className="text-lg md:text-xl font-bold text-white">{c.label}</span>
                <span className="text-xs md:text-sm text-white/70 mt-1">{c.sub}</span>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.6, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 bg-primary text-primary-foreground rounded-full px-5 py-2 text-sm font-bold shadow-lg shadow-primary/40"
            >
              Ponto Ideal
            </motion.div>
          </div>
        </div>
      </section>


      {/* Secção 6 — Portfólio */}
      <section className="section-padding">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <span className="inline-block text-xs font-bold tracking-widest text-primary uppercase mb-4">Portfólio</span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ color: '#1a1b3a' }}>As <span className="text-primary">nossas criações.</span></h2>
          </motion.div>
          <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { name: 'Ascendi', desc: 'Aplicação móvel 360º para players em mobilidade.' },
              { name: 'Cleanwatts', desc: 'Diagnóstico energético para indústria e manufatura.' },
              { name: 'Abbott', desc: 'Medição de satisfação do cliente através de canais digitais.' },
            ].map((p, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-section-alt p-8 card-boost card-boost-hover">
                <div className="text-2xl font-black text-primary mb-3">{p.name}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
          <div className="text-center">
            <Link to="/portfolio" className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-[12px] px-8 py-3.5 text-base font-semibold transition-colors">
              Explorar Portfólio <ArrowRight className="w-4 h-4" />
            </Link>
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
    <section className="section-padding bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-primary mb-3">Como trabalhamos</span>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight" style={{ color: '#1a1b3a' }}>Product <span className="text-primary">&amp; Engineering</span></h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {sections.map((s, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div
                key={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative bg-white overflow-hidden card-boost card-boost-hover flex flex-col"
              >
                {/* Image */}
                <div className="relative">
                  <img
                    src={PE_IMAGES[s.tag]}
                    alt={s.tag}
                    loading="lazy"
                    width={1024}
                    height={1024}
                    className="w-full h-56 object-cover"
                  />
                  <span className="absolute top-0 right-0 inline-flex items-center text-[11px] font-extrabold uppercase tracking-widest text-[#1a1b3a] bg-[#FFC939] px-4 py-2 rounded-bl-2xl border-2 border-t-0 border-r-0 border-[#1a1b3a] z-10">
                    {s.tag}
                  </span>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-6">
                  <h3 className="font-bold text-xl text-[#1a1b3a] leading-snug mb-3">{s.tag}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">{PE_SUBS[s.tag]}</p>

                  <button
                    onClick={() => setOpenIdx(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="mt-auto inline-flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-primary hover:gap-3 transition-all duration-300 self-start"
                  >
                    {isOpen ? 'Fechar' : 'Saber mais'}
                    <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : '-rotate-90'}`} />
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
                      className="absolute inset-x-0 bottom-0 bg-white p-6 border-t-2 border-[#1a1b3a] max-h-[85%] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="text-sm font-extrabold uppercase tracking-widest text-[#1a1b3a]">{s.tag}</div>
                        <button
                          onClick={() => setOpenIdx(null)}
                          aria-label="Fechar"
                          className="text-primary text-xs font-extrabold uppercase tracking-wider inline-flex items-center gap-1"
                        >
                          Fechar
                          <ChevronDown className="w-4 h-4 rotate-180" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {s.blocks.map((b, j) => (
                          <div key={j}>
                            <div className="text-sm font-bold text-[#1a1b3a]">{b.title}</div>
                            <div className="text-xs text-muted-foreground leading-relaxed">{b.desc}</div>
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


