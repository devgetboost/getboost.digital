import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckSquare,
  FileText,
  Calculator,
  Book,
  Calendar,
  Search,
  Lightbulb,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { resources } from '@/data/resources';
import ResourceCard from '@/components/ResourceCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';
import avatar1 from '@/assets/avatar-1.jpg';
import avatar2 from '@/assets/avatar-2.jpg';
import avatar3 from '@/assets/avatar-3.jpg';
import avatar4 from '@/assets/avatar-4.jpg';

const ACCENT = '#ff4000';
const socialProofAvatars = [avatar1, avatar2, avatar3, avatar4];

const iconMap: Record<string, React.ElementType> = {
  CheckSquare,
  FileText,
  Calculator,
  Book,
  Calendar,
  Search,
  Lightbulb,
};

const ResourceDetail = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const resource = resources.find((r) => r.id === id);
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+351 ');
  const [cargo, setCargo] = useState('');
  const [businessArea, setBusinessArea] = useState('');
  const [website, setWebsite] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!resource) return <Navigate to="/resources" replace />;

  const Icon = iconMap[resource.icon] || FileText;

  const rKey = `resourceDetail.items.${resource.id}`;
  const headline = t(`${rKey}.headline`, { defaultValue: resource.headline });
  const subheadline = t(`${rKey}.subheadline`, { defaultValue: resource.subheadline });
  const ctaText = t(`${rKey}.ctaText`, { defaultValue: resource.ctaText });
  const benefits = t(`${rKey}.benefits`, {
    returnObjects: true,
    defaultValue: resource.benefits,
  }) as string[];

  const cargoOptions = t('resourceDetail.cargoOptions', { returnObjects: true }) as string[];
  const businessAreaOptions = t('resourceDetail.businessAreaOptions', {
    returnObjects: true,
  }) as string[];

  const handleNextStep = () => {
    if (!name.trim() || !email.trim()) {
      toast.error(t('resourceDetail.errorNameEmail'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error(t('resourceDetail.errorEmail'));
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cargo) {
      toast.error(t('resourceDetail.errorCargo'));
      return;
    }
    if (!businessArea) {
      toast.error(t('resourceDetail.errorBusinessArea'));
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('leads').insert({
      source: 'resource',
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() !== '+351' ? phone.trim() : null,
      resource_id: resource.id,
      resource_name: resource.title,
      company: cargo,
      website: website.trim() || null,
      budget: businessArea,
    } as any);

    if (!error) {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'lead-notification',
          recipientEmail: 'nunocruz@getboost.digital',
          templateData: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim() !== '+351' ? phone.trim() : null,
            company: cargo,
            website: website.trim() || null,
            service: `Recurso: ${resource.title} (${resource.id})`,
            message: `Área de Atuação: ${businessArea}`,
            source: 'Recursos',
            language: i18n.language,
          },
        },
      });
    }

    setSubmitting(false);

    if (error) {
      toast.error(t('resourceDetail.errorSend'));
      return;
    }

    analytics.trackForm('resource', `resource_${resource.id}_form_success`, {
      resource_id: resource.id,
      resource_name: resource.title,
      email: email.trim(),
    });


    if (resource?.id === '3') {
      navigate('/tools/roi-calculator', { state: { authorized: true } });
      return;
    }
    if (resource?.id === '4') {
      navigate('/tools/branding-guide', { state: { authorized: true } });
      return;
    }
    if (resource?.id === '7') {
      navigate('/tools/seo-analyzer');
      return;
    }
    if (resource?.id === '8') {
      navigate('/tools/content-ideas');
      return;
    }
    if (resource?.id === '9') {
      navigate('/tools/digital-audit', { state: { authorized: true } });
      return;
    }
    setSubmitted(true);
    toast.success(t('resourceDetail.successSend'));
  };

  const related = resources
    .filter((r) => r.id !== resource.id)
    .sort((a, b) => {
      const aSame = a.category === resource.category ? 0 : 1;
      const bSame = b.category === resource.category ? 0 : 1;
      return aSame - bSame;
    })
    .slice(0, 3);

  return (
    <Layout>
      <SEO
        title={resource.title}
        description={resource.description}
        canonical={`/resources/${resource.id}`}
      />

      {/* HERO — manifesto */}
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

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-20 md:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: ACCENT }}
            />
            {t(`resources.filters.${resource.category}`)} · Recurso Getboost · Download livre
          </motion.div>

          <div className="mt-10 grid lg:grid-cols-[1.35fr,1fr] gap-12 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 }}
                className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,6vw,4.75rem)]"
              >
                {headline}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed max-w-xl"
              >
                {subheadline}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <a
                  href="#form"
                  className="group inline-flex items-center gap-3 rounded-full px-7 py-3.5 text-sm font-bold uppercase tracking-[0.18em] transition-all"
                  style={{ background: ACCENT, color: '#ffffff' }}
                >
                  {ctaText}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
                <Link
                  to="/resources"
                  className="text-sm font-mono uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
                >
                  ← Todos os recursos
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="mt-10 flex flex-wrap items-center gap-x-5 gap-y-3"
              >
                <div className="flex -space-x-3 shrink-0">
                  {socialProofAvatars.map((avatar, i) => (
                    <img
                      key={i}
                      src={avatar}
                      alt=""
                      loading="lazy"
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full border-2 border-[#0a0603] object-cover"
                    />
                  ))}
                </div>
                <span className="flex-1 min-w-0 text-xs md:text-sm font-mono uppercase tracking-[0.18em] text-white/60 leading-relaxed">
                  {t('resourceDetail.socialProof')}
                </span>
              </motion.div>
            </div>

            {/* Right — spec card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.35 }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm"
            >
              <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#ff4000]/60 to-transparent" />
              <div className="flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
                >
                  <Icon className="h-7 w-7" style={{ color: ACCENT }} />
                </div>
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/50">
                    Ficha do recurso
                  </p>
                  <p className="mt-1 font-semibold text-white">{resource.title}</p>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                {[
                  { k: 'Formato', v: resource.category === 'tools' ? 'Ferramenta web' : 'PDF / Template' },
                  { k: 'Tempo', v: '< 5 min' },
                  { k: 'Preço', v: 'Gratuito' },
                  { k: 'Acesso', v: 'Instantâneo' },
                ].map((row) => (
                  <div key={row.k}>
                    <dt className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
                      {row.k}
                    </dt>
                    <dd className="mt-1 font-medium text-white/90">{row.v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] text-white/50">
                <span
                  className="h-1.5 w-1.5 rounded-full animate-pulse"
                  style={{ background: ACCENT }}
                />
                Disponível agora
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* BENEFITS + FORM — dark */}
      <section id="form" className="relative bg-[#0a0603] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            maskImage: 'linear-gradient(to bottom, black, transparent 90%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black, transparent 90%)',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="grid lg:grid-cols-[1.1fr,1fr] gap-16 items-start">
            {/* Benefits */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p
                className="text-[10px] font-mono uppercase tracking-[0.28em]"
                style={{ color: ACCENT }}
              >
                / O que ganhas
              </p>
              <h2 className="mt-4 font-black leading-[1.02] tracking-tight text-[clamp(1.85rem,4vw,3rem)]">
                {resource.category === 'tools'
                  ? t('resourceDetail.whyUseTool')
                  : t('resourceDetail.whyDownload')}
              </h2>
              <p className="mt-5 text-white/65 leading-relaxed max-w-lg">
                {resource.category === 'tools'
                  ? t('resourceDetail.whyUseToolDesc')
                  : t('resourceDetail.whyDownloadDesc')}
              </p>

              <ul className="mt-10 space-y-4">
                {benefits.map((benefit, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="group flex items-start gap-4 rounded-xl border border-white/10 bg-white/[0.02] p-5 transition-colors hover:border-[#ff4000]/40"
                  >
                    <div
                      className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md"
                      style={{ background: `${ACCENT}1f`, border: `1px solid ${ACCENT}55` }}
                    >
                      <Check className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                    </div>
                    <span className="text-white/85 leading-relaxed">{benefit}</span>
                  </motion.li>
                ))}
              </ul>

              <p className="mt-10 text-sm font-mono uppercase tracking-[0.22em] text-white/50">
                {resource.category === 'tools'
                  ? t('resourceDetail.accessFreeToolCta')
                  : t('resourceDetail.downloadFreeCta')}
              </p>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:sticky lg:top-28"
            >
              <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-8 md:p-10 backdrop-blur-sm">
                <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-[#ff4000]/60 to-transparent" />

                <p
                  className="text-[10px] font-mono uppercase tracking-[0.28em]"
                  style={{ color: ACCENT }}
                >
                  / {resource.category === 'tools' ? 'Aceder à ferramenta' : 'Descarregar'}
                </p>
                <h3 className="mt-3 text-2xl md:text-3xl font-black tracking-tight text-white">
                  {t('resourceDetail.formTitle')}
                </h3>
                <p className="mt-2 text-sm text-white/60">
                  {t('resourceDetail.formSubtitle')}
                </p>

                {!submitted && (
                  <div className="mt-8 flex items-center gap-0">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        step >= 1
                          ? 'text-[#0a0603]'
                          : 'bg-white/10 text-white/50'
                      }`}
                      style={step >= 1 ? { background: ACCENT } : {}}
                    >
                      {step > 1 ? <Check className="h-5 w-5" /> : '1'}
                    </div>
                    <div
                      className="h-0.5 w-12 transition-all"
                      style={{ background: step > 1 ? ACCENT : 'rgba(255,255,255,0.15)' }}
                    />
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                        step >= 2 ? 'text-[#0a0603]' : 'bg-white/10 text-white/50'
                      }`}
                      style={step >= 2 ? { background: ACCENT } : {}}
                    >
                      2
                    </div>
                  </div>
                )}

                {submitted ? (
                  <div className="py-8 text-center">
                    <div
                      className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
                      style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
                    >
                      <Check className="h-8 w-8" style={{ color: ACCENT }} />
                    </div>
                    <h4 className="text-xl font-bold text-white">
                      {t('resourceDetail.successTitle')}
                    </h4>
                    <p className="mt-2 text-white/70">{t('resourceDetail.successMsg')}</p>
                    <Button
                      asChild
                      className="mt-6 rounded-full text-white hover:opacity-90"
                      style={{ background: ACCENT }}
                    >
                      <Link to="/resources">{t('resourceDetail.viewMoreResources')}</Link>
                    </Button>
                  </div>
                ) : step === 1 ? (
                  <div className="mt-8 space-y-5">
                    <div>
                      <Label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                        {t('resourceDetail.labelName')} *
                      </Label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('resourceDetail.placeholderName')}
                        className="h-12 rounded-lg border-white/15 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                        required
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                        {t('resourceDetail.labelEmail')} *
                      </Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('resourceDetail.placeholderEmail')}
                        className="h-12 rounded-lg border-white/15 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                        required
                        maxLength={255}
                      />
                    </div>
                    <Button
                      type="button"
                      size="lg"
                      className="mt-2 h-14 w-full rounded-full text-base font-bold uppercase tracking-[0.14em] text-white hover:opacity-90"
                      style={{ background: ACCENT }}
                      onClick={handleNextStep}
                    >
                      {t('resourceDetail.nextStep')}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="mt-4 text-center text-xs leading-relaxed text-white/40">
                      {t('resourceDetail.privacyNote')}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                    <div>
                      <Label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                        {t('resourceDetail.labelPhone')} *
                      </Label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+351 912 345 678"
                        className="h-12 rounded-lg border-white/15 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                        required
                        maxLength={20}
                      />
                    </div>
                    <div>
                      <Label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                        {t('resourceDetail.labelCargo')} *
                      </Label>
                      <Select value={cargo} onValueChange={setCargo}>
                        <SelectTrigger className="h-12 rounded-lg border-white/15 bg-white/[0.04] text-white focus:ring-[#ff4000]/40">
                          <SelectValue placeholder={t('resourceDetail.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(cargoOptions) &&
                            cargoOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                        {t('resourceDetail.labelBusinessArea')} *
                      </Label>
                      <Select value={businessArea} onValueChange={setBusinessArea}>
                        <SelectTrigger className="h-12 rounded-lg border-white/15 bg-white/[0.04] text-white focus:ring-[#ff4000]/40">
                          <SelectValue placeholder={t('resourceDetail.selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(businessAreaOptions) &&
                            businessAreaOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="mb-2 block text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                        {t('resourceDetail.labelWebsite')}
                      </Label>
                      <Input
                        type="url"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        placeholder="https://www.exemplo.pt"
                        className="h-12 rounded-lg border-white/15 bg-white/[0.04] text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                        maxLength={255}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="h-14 rounded-full border-white/20 bg-transparent text-sm font-bold uppercase tracking-[0.14em] text-white hover:bg-white/5"
                        onClick={() => setStep(1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('resourceDetail.prevStep')}
                      </Button>
                      <Button
                        type="submit"
                        size="lg"
                        className="h-14 flex-1 rounded-full text-sm font-bold uppercase tracking-[0.14em] text-white hover:opacity-90"
                        style={{ background: ACCENT }}
                        disabled={submitting}
                      >
                        {submitting ? t('resourceDetail.submitting') : ctaText}
                        {!submitting && <ArrowRight className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* RELATED — dark */}
      <section className="relative overflow-hidden bg-black text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <div className="flex items-end justify-between gap-8 mb-12">
            <div>
              <p
                className="text-[10px] font-mono uppercase tracking-[0.28em]"
                style={{ color: ACCENT }}
              >
                / Também te pode interessar
              </p>
              <h2 className="mt-4 font-black leading-[1.02] tracking-tight text-[clamp(1.75rem,3.5vw,2.75rem)]">
                {t('resourceDetail.relatedTitle', {
                  defaultValue: 'Outras ferramentas e recursos',
                })}
              </h2>
            </div>
            <Link
              to="/resources"
              className="hidden md:inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
            >
              Ver todos <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((r, i) => (
              <ResourceCard key={r.id} resource={r} index={i} />
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ResourceDetail;
