import { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { analytics, buildWhatsAppUrl, getJourney, getJourneyOrigin } from '@/lib/analytics';
import { WHATSAPP_MESSAGES, WHATSAPP_PHONE } from '@/lib/whatsappMessages';
import { CONTACT, FOUNDER } from '@/data/brandRegistry';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Mail, Phone, MessageCircle, MapPin, Clock, ShieldCheck, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MiniFlow } from '@/components/ui/mini-flow';
import { PRODUCTS } from '@/data/products';
import { SOLUCOES_SUBMENU } from '@/data/solucoesSubmenu';
import { MARKET_CODES } from '@/lib/markets';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { ScrollDepth } from '@/components/ScrollDepth';
import { legacySupabase, supabase } from '@/integrations/supabase/client';
import { captureLead, CommercialWriteError } from '@/lib/commercialApi';
import { marketForLanguage, localeForLanguage } from '@/lib/commercialMarket';
import { fetchProducts } from '@/lib/contentApi';
import { toast } from 'sonner';

const ACCENT = '#ff4000';

const Contact = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [services, setServices] = useState<{ key: string; headline: string }[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', website: '',
    service: '', budget: '', timeline: '', message: '',
  });
  // R20.1 — form lifecycle (start/abandon). success/error keep their
  // dedicated events; refs only gate lifecycle attribution.
  const lifecycleStarted = useRef(false);
  const lifecycleSubmitted = useRef(false);

  useEffect(() => {
    if (lifecycleStarted.current) return;
    const interacted =
      form.name !== '' || form.email !== '' || form.phone !== '' ||
      form.company !== '' || form.message !== '';
    if (interacted) {
      lifecycleStarted.current = true;
      analytics.trackFormStep('contact', 'start');
    }
  }, [form.name, form.email, form.phone, form.company, form.message]);

  useEffect(() => {
    const onAbandon = () => {
      if (lifecycleStarted.current && !lifecycleSubmitted.current) {
        analytics.trackFormStep('contact', 'abandon', { origin: getJourneyOrigin() });
        lifecycleStarted.current = false; // fire once per page lifecycle
      }
    };
    window.addEventListener('pagehide', onAbandon);
    return () => {
      window.removeEventListener('pagehide', onAbandon);
      onAbandon(); // in-app navigation away (unmount only — stable deps)
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // R1C6: the service dropdown reads published products via the content layer
  // instead of the retired `services` table.
  useEffect(() => {
    fetchProducts({ market: marketForLanguage(i18n.language), locale: localeForLanguage(i18n.language) }).then((products) => {
      setServices(products.map((product) => ({ key: product.slug, headline: product.name })));
    }).catch(() => setServices([]));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.company.trim() || !form.message.trim()) {
      toast.error(t('contact.errorRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error(t('contact.errorEmail'));
      return;
    }
    setSubmitting(true);
    // R20.1 — explicit submit step (success/error keep dedicated events).
    analytics.trackFormStep('contact', 'submit', { origin: getJourneyOrigin() });
    // R1C5: the browser no longer writes `leads` directly. Retired fields
    // (`service`, `budget`, `timeline`, `website`) are forwarded and preserved
    // under `metadata.legacy` server-side.
    const { error: captureError } = await captureLead({
      source: 'contact',
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim(),
      message: form.message.trim(),
      service_interest: form.service || null,
      market: marketForLanguage(i18n.language),
      locale: localeForLanguage(i18n.language),
      legacy: {
        website: form.website.trim() || null,
        service: form.service || null,
        budget: form.budget || null,
        timeline: form.timeline || null,
      },
    });

    if (captureError) {
      setSubmitting(false);
      toast.error(t('contact.errorSubmit', 'Não foi possível enviar. Tenta novamente.'));
      return;
    }

    try {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'lead-notification',
          recipientEmail: FOUNDER.email,
          templateData: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            company: form.company.trim(),
            website: form.website.trim() || null,
            service: form.service || null,
            message: form.message.trim(),
            source: 'Contacto',
            language: i18n.language,
          }
        }
      });

      analytics.trackForm('contact', 'contact_form_success', { path: location.pathname, journey: getJourney(), origin: getJourneyOrigin() });
      lifecycleSubmitted.current = true; // converted — no abandon afterwards
      setForm({ name: '', email: '', phone: '', company: '', website: '', service: '', budget: '', timeline: '', message: '' });
      setSent(true);
    } catch (submitError) {
      toast.error(t('contact.errorSend'));
      analytics.trackForm('contact', 'contact_form_error', { path: location.pathname });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-black/20 rounded-none h-12 px-0 text-ink-primary placeholder:text-ink-tertiary focus-visible:ring-0 focus-visible:border-[#ff4000] transition-colors";
  const labelClass = "block font-mono text-[10px] uppercase tracking-[0.22em] text-ink-tertiary mb-2";

  return (
    <Layout>
      <ScrollDepth location="contact" />
      <SEO
        title="Contacto — Vamos operar juntos | Getboost Digital"
        description="Fala com a equipa Getboost Digital. Resposta em menos de 24h úteis. WhatsApp, email, telefone ou formulário completo — escolhe o canal."
        canonical="/contact"
        lang={i18n.language as 'pt' | 'en' | 'es'}
      />

      {/* HERO — R19.4 light premium (CTAs + tracking preserved). */}
      <section className="gb-surface-page relative overflow-hidden">
        <div aria-hidden className="gb-grid-overlay" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.08) 0%, rgba(255,255,255,0) 65%)' }}
        />
        <div className="gb-container relative gb-section !pt-10 md:!pt-16">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="gb-eyebrow text-brand-600">Contacto · Resposta em &lt; 24h úteis · PT / EN / ES</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-display mt-5 text-ink-primary"
              >
                Fala com a equipa certa para o{' '}
                <span className="text-brand-600">próximo passo</span>.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="gb-text-body mt-6 max-w-xl text-ink-secondary"
              >
                Quer precises de IA, automação, software ou growth, estamos
                disponíveis para ajudar.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Button asChild size="lg">
                  <a href="/booking">
                    Marcar 30 min gratuitos
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a
                    href={buildWhatsAppUrl(WHATSAPP_PHONE, WHATSAPP_MESSAGES.generic())}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => analytics.trackWhatsApp('contact_hero', 'generic')}
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp directo
                  </a>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap gap-2.5"
              >
                {['IA', 'Automação', 'Software', 'Growth'].map((item) => (
                  <span key={item} className="gb-chip">
                    <Check className="h-3.5 w-3.5 text-brand-600" />
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Why contact — Questão → Especialista → Solução (illustrative). */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="gb-card !p-6 !shadow-lg">
                <p className="gb-eyebrow text-ink-tertiary">Como funciona</p>
                <MiniFlow
                  steps={['Questão', 'Especialista', 'Solução']}
                  tint="var(--gb-brand-50)"
                  strong="var(--gb-brand-600)"
                />
                <div className="mt-5 grid grid-cols-3 gap-2 border-t border-black/[0.06] pt-4 text-center">
                  {[
                    { k: '<24h', v: 'resposta útil' },
                    { k: '30min', v: 'diagnóstico' },
                    { k: '0€', v: 'compromisso' },
                  ].map((stat) => (
                    <div key={stat.v}>
                      <div className="gb-text-h3 text-brand-600">{stat.k}</div>
                      <div className="text-[11px] font-medium text-ink-tertiary">{stat.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
        <div className="gb-container pb-16">
          <div className="gb-hairline-accent" />
        </div>
      </section>

      {/* AUTHORITY STRIP — R19.4 (dados reais do sistema, nunca hardcoded). */}
      <section className="gb-surface-subtle gb-section !py-12">
        <div className="gb-container">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {[
              { k: `${PRODUCTS.length}`, v: 'produtos próprios' },
              { k: `${SOLUCOES_SUBMENU.length}`, v: 'serviços especializados' },
              { k: `${MARKET_CODES.length}`, v: 'mercados' },
            ].map((fact) => (
              <span key={fact.v} className="inline-flex items-center gap-2 text-sm text-ink-secondary">
                <Check className="h-4 w-4 text-brand-600" aria-hidden="true" />
                <strong className="font-bold text-ink-primary">{fact.k}</strong> {fact.v}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CANAIS + FORM */}
      <section className="gb-surface-section gb-section">
        <div className="gb-container">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 border-t border-black/10 pt-14">
            {/* Canais */}
            <div className="lg:col-span-5 space-y-10">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  Canais directos
                </span>
                <h2 className="mt-4 text-3xl md:text-4xl font-black leading-tight tracking-tight">
                  Escolhe o teu <span style={{ color: ACCENT }}>ritmo</span>.
                </h2>
                <p className="mt-4 text-ink-secondary leading-relaxed">
                  Cada canal tem um propósito. Não temos call centers, nem tickets perdidos. Falas com quem opera.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { Icon: MessageCircle, label: 'WhatsApp', value: CONTACT.phone.display, href: buildWhatsAppUrl(WHATSAPP_PHONE, WHATSAPP_MESSAGES.generic()), note: 'Respostas em minutos, dias úteis' },
                  { Icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}`, note: 'Para briefings detalhados e propostas' },
                  { Icon: Phone, label: 'Telefone', value: CONTACT.phone.display, href: `tel:${CONTACT.phone.e164}`, note: 'Seg–Sex · 09h30–18h30 (WEST)' },
                  { Icon: MapPin, label: 'Escritório', value: `${CONTACT.address.locality}, ${CONTACT.address.country}`, href: 'https://maps.google.com/?q=R.+Passeio+Infante+Dom+Henrique+22+Figueira+da+Foz', note: CONTACT.address.street },
                ].map(({ Icon, label, value, href, note }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => {
                      if (label === 'WhatsApp') analytics.trackWhatsApp('contact_channels', 'generic');
                      else if (label === 'Email') analytics.trackOutbound('email', 'contact_channels');
                      else if (label === 'Telefone') analytics.trackOutbound('phone', 'contact_channels');
                    }}
                    className="group flex items-start gap-5 border border-black/10 bg-black/[0.02] p-5 transition-all hover:border-[#ff4000]/60 hover:bg-black/[0.04]"
                  >
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border transition-colors"
                      style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-ink-tertiary">{label}</div>
                      <div className="mt-1 text-base md:text-lg font-semibold truncate">{value}</div>
                      <div className="mt-1 text-xs text-ink-tertiary">{note}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-2 text-ink-tertiary transition-all group-hover:text-[#ff4000] group-hover:translate-x-1" />
                  </a>
                ))}
              </div>

              <div className="flex items-start gap-4 border-l-2 pl-5" style={{ borderColor: `${ACCENT}66` }}>
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                <p className="text-sm text-ink-secondary leading-relaxed">
                  Toda a informação enviada é tratada como confidencial. Assinamos NDA sempre que necessário —
                  basta pedir no formulário.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="border border-black/10 bg-black/[0.02] p-6 md:p-10">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                      Briefing · 2 min
                    </span>
                    <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight tracking-tight">
                      Conta-nos sobre o teu projecto.
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-tertiary">
                    <Clock className="h-3.5 w-3.5" style={{ color: ACCENT }} />
                    Resposta em &lt; 24h
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-10 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Nome *</label>
                      <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Como te chamas?" className={inputClass} maxLength={100} required />
                    </div>
                    <div>
                      <label className={labelClass}>Email *</label>
                      <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="tu@empresa.com" className={inputClass} maxLength={255} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Telefone</label>
                      <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+351 …" className={inputClass} maxLength={20} />
                    </div>
                    <div>
                      <label className={labelClass}>Empresa *</label>
                      <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Nome da empresa" className={inputClass} maxLength={100} required />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Website actual</label>
                    <Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://…" className={inputClass} maxLength={255} />
                  </div>

                  <div>
                    <label className={labelClass}>Serviço de interesse</label>
                    <Select value={form.service} onValueChange={v => setForm(f => ({ ...f, service: v }))}>
                      <SelectTrigger className={inputClass}><SelectValue placeholder="Selecciona um serviço" /></SelectTrigger>
                      <SelectContent className="bg-white border-black/10 text-ink-primary">
                        {services.map(s => (
                          <SelectItem key={s.key} value={s.key} className="focus:bg-black/10 focus:text-ink-primary">
                            {s.headline || s.key}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>Orçamento mensal</label>
                      <Select value={form.budget} onValueChange={v => setForm(f => ({ ...f, budget: v }))}>
                        <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent className="bg-white border-black/10 text-ink-primary">
                          <SelectItem value="500" className="focus:bg-black/10 focus:text-ink-primary">Até 500 €</SelectItem>
                          <SelectItem value="1000" className="focus:bg-black/10 focus:text-ink-primary">500 – 1.000 €</SelectItem>
                          <SelectItem value="2500" className="focus:bg-black/10 focus:text-ink-primary">1.000 – 2.500 €</SelectItem>
                          <SelectItem value="5000" className="focus:bg-black/10 focus:text-ink-primary">2.500 – 5.000 €</SelectItem>
                          <SelectItem value="5000+" className="focus:bg-black/10 focus:text-ink-primary">5.000 € +</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Quando queres começar?</label>
                      <Select value={form.timeline} onValueChange={v => setForm(f => ({ ...f, timeline: v }))}>
                        <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent className="bg-white border-black/10 text-ink-primary">
                          <SelectItem value="imediato" className="focus:bg-black/10 focus:text-ink-primary">Imediato</SelectItem>
                          <SelectItem value="1mes" className="focus:bg-black/10 focus:text-ink-primary">Próximo mês</SelectItem>
                          <SelectItem value="3meses" className="focus:bg-black/10 focus:text-ink-primary">3 meses</SelectItem>
                          <SelectItem value="explorar" className="focus:bg-black/10 focus:text-ink-primary">Ainda a explorar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Mensagem *</label>
                    <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Contexto, objectivos, prazos, integrações necessárias…" rows={5} className="w-full bg-transparent border border-black/15 rounded-none text-ink-primary placeholder:text-ink-tertiary focus-visible:ring-0 focus-visible:border-[#ff4000] transition-colors" maxLength={2000} required />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex items-center gap-3 border-2 px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-ink-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: ACCENT, color: ACCENT }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = ACCENT; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {submitting ? 'A enviar…' : 'Enviar briefing'}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="gb-surface-page gb-section">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2.25rem,7vw,6rem)]"
          >
            Vamos transformar a tua <span style={{ color: ACCENT }}>operação</span> em resultados mensuráveis.
          </motion.h2>
          <p className="mt-8 max-w-2xl mx-auto text-ink-secondary text-lg">
            Agenda um diagnóstico gratuito e recebe um plano claro para acelerar o teu negócio.
          </p>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <a
              href="/booking"
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-ink-primary"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Zap className="h-4 w-4" />
              Marcar diagnóstico grátis
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
