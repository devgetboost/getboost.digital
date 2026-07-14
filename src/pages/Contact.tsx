import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { analytics, buildWhatsAppUrl } from '@/lib/analytics';
import { WHATSAPP_MESSAGES, WHATSAPP_PHONE } from '@/lib/whatsappMessages';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Mail, Phone, MessageCircle, MapPin, Clock, ShieldCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ACCENT = '#ff4000';
const manifestoLines = ['Uma conversa.', 'Uma decisão clara.'];

const Contact = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [services, setServices] = useState<{ key: string; headline: string }[]>([]);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', website: '',
    service: '', budget: '', timeline: '', message: '',
  });

  useEffect(() => {
    supabase
      .from('services')
      .select('key, headline')
      .eq('status', 'published')
      .order('sort_order')
      .then(({ data }) => { if (data) setServices(data); });
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
    const { error } = await supabase.from('leads').insert({
      source: 'contact',
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      company: form.company.trim(),
      website: form.website.trim() || null,
      service: form.service || null,
      budget: form.budget || null,
      timeline: form.timeline || null,
      message: form.message.trim(),
    });

    if (!error) {
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'lead-notification',
          recipientEmail: 'nunocruz@getboost.digital',
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
    }

    setSubmitting(false);

    if (error) {
      toast.error(t('contact.errorSend'));
      analytics.trackForm('contact', 'contact_form_error', { error: error.message, path: location.pathname });
      return;
    }

    toast.success(t('contact.successSend'));
    analytics.trackForm('contact', 'contact_form_success', { service: form.service, budget: form.budget, path: location.pathname });
    setForm({ name: '', email: '', phone: '', company: '', website: '', service: '', budget: '', timeline: '', message: '' });
  };

  const inputClass = "w-full bg-transparent border-0 border-b border-white/20 rounded-none h-12 px-0 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#ff4000] transition-colors";
  const labelClass = "block font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 mb-2";

  return (
    <Layout>
      <SEO
        title="Contacto — Vamos operar juntos | Getboost Digital"
        description="Fala com a equipa Getboost Digital. Resposta em menos de 24h úteis. WhatsApp, email, telefone ou formulário completo — escolhe o canal."
        canonical="/contact"
        lang={i18n.language as 'pt' | 'en' | 'es'}
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
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
        />
        <motion.div
          aria-hidden
          initial={{ y: '-100%' }}
          animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent"
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
          >
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Contacto · Resposta em &lt; 24h úteis · PT / EN / ES
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.5rem,7.5vw,6.25rem)]">
            {manifestoLines.map((line, i) => (
              <motion.span
                key={line}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                className="block"
              >
                {i === manifestoLines.length - 1 ? (
                  <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>{line}</span>
                ) : (line)}
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
            Não vendemos <em className="not-italic text-white">brochuras</em>. Ouvimos o problema, medimos o
            impacto, propomos o caminho. Se preferires, marca 30 minutos gratuitos — saímos da chamada com um
            plano concreto, mesmo que não trabalhes connosco.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <a
              href="/booking"
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Marcar 30 min gratuitos
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href={buildWhatsAppUrl(WHATSAPP_PHONE, WHATSAPP_MESSAGES.generic())}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => analytics.trackWhatsApp('contact_hero', 'generic')}
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <MessageCircle className="h-4 w-4" style={{ color: ACCENT }} />
              WhatsApp directo
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '<24h', v: 'Resposta útil' },
              { k: '30min', v: 'Diagnóstico grátis' },
              { k: '0€', v: 'Compromisso inicial' },
              { k: '100%', v: 'Confidencialidade' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CANAIS + FORM */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 border-t border-white/10 pt-14">
            {/* Canais */}
            <div className="lg:col-span-5 space-y-10">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  Canais directos
                </span>
                <h2 className="mt-4 text-3xl md:text-4xl font-black leading-tight tracking-tight">
                  Escolhe o teu <span style={{ color: ACCENT }}>ritmo</span>.
                </h2>
                <p className="mt-4 text-white/60 leading-relaxed">
                  Cada canal tem um propósito. Não temos call centers, nem tickets perdidos. Falas com quem opera.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { Icon: MessageCircle, label: 'WhatsApp', value: '+351 963 574 400', href: buildWhatsAppUrl(WHATSAPP_PHONE, WHATSAPP_MESSAGES.generic()), note: 'Respostas em minutos, dias úteis' },
                  { Icon: Mail, label: 'Email', value: 'geral@getboost.digital', href: 'mailto:geral@getboost.digital', note: 'Para briefings detalhados e propostas' },
                  { Icon: Phone, label: 'Telefone', value: '+351 963 574 400', href: 'tel:+351963574400', note: 'Seg–Sex · 09h30–18h30 (WEST)' },
                  { Icon: MapPin, label: 'Escritório', value: 'Figueira da Foz, Portugal', href: 'https://maps.google.com/?q=R.+Passeio+Infante+Dom+Henrique+22+Figueira+da+Foz', note: 'R. Passeio Infante D. Henrique, 22 · Sala 33' },
                ].map(({ Icon, label, value, href, note }) => (
                  <a
                    key={label}
                    href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    onClick={() => {
                      if (label === 'WhatsApp') analytics.trackWhatsApp('contact_channels', 'generic');
                    }}
                    className="group flex items-start gap-5 border border-white/10 bg-white/[0.02] p-5 transition-all hover:border-[#ff4000]/60 hover:bg-white/[0.04]"
                  >
                    <div
                      className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border transition-colors"
                      style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">{label}</div>
                      <div className="mt-1 text-base md:text-lg font-semibold truncate">{value}</div>
                      <div className="mt-1 text-xs text-white/50">{note}</div>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 mt-2 text-white/30 transition-all group-hover:text-[#ff4000] group-hover:translate-x-1" />
                  </a>
                ))}
              </div>

              <div className="flex items-start gap-4 border-l-2 pl-5" style={{ borderColor: `${ACCENT}66` }}>
                <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" style={{ color: ACCENT }} />
                <p className="text-sm text-white/60 leading-relaxed">
                  Toda a informação enviada é tratada como confidencial. Assinamos NDA sempre que necessário —
                  basta pedir no formulário.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7">
              <div className="border border-white/10 bg-white/[0.02] p-6 md:p-10">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                      Briefing · 2 min
                    </span>
                    <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight tracking-tight">
                      Conta-nos sobre o teu projecto.
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50">
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
                      <SelectContent className="bg-[#0a0603] border-white/10 text-white">
                        {services.map(s => (
                          <SelectItem key={s.key} value={s.key} className="focus:bg-white/10 focus:text-white">
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
                        <SelectContent className="bg-[#0a0603] border-white/10 text-white">
                          <SelectItem value="500" className="focus:bg-white/10 focus:text-white">Até 500 €</SelectItem>
                          <SelectItem value="1000" className="focus:bg-white/10 focus:text-white">500 – 1.000 €</SelectItem>
                          <SelectItem value="2500" className="focus:bg-white/10 focus:text-white">1.000 – 2.500 €</SelectItem>
                          <SelectItem value="5000" className="focus:bg-white/10 focus:text-white">2.500 – 5.000 €</SelectItem>
                          <SelectItem value="5000+" className="focus:bg-white/10 focus:text-white">5.000 € +</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className={labelClass}>Quando queres começar?</label>
                      <Select value={form.timeline} onValueChange={v => setForm(f => ({ ...f, timeline: v }))}>
                        <SelectTrigger className={inputClass}><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                        <SelectContent className="bg-[#0a0603] border-white/10 text-white">
                          <SelectItem value="imediato" className="focus:bg-white/10 focus:text-white">Imediato</SelectItem>
                          <SelectItem value="1mes" className="focus:bg-white/10 focus:text-white">Próximo mês</SelectItem>
                          <SelectItem value="3meses" className="focus:bg-white/10 focus:text-white">3 meses</SelectItem>
                          <SelectItem value="explorar" className="focus:bg-white/10 focus:text-white">Ainda a explorar</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Mensagem *</label>
                    <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Contexto, objectivos, prazos, integrações necessárias…" rows={5} className="w-full bg-transparent border border-white/15 rounded-none text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#ff4000] transition-colors" maxLength={2000} required />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="group inline-flex items-center gap-3 border-2 px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
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
      <section className="bg-black text-white py-28 md:py-40">
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
          <p className="mt-8 max-w-2xl mx-auto text-white/60 text-lg">
            Agenda um diagnóstico gratuito e recebe um plano claro para acelerar o teu negócio.
          </p>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <a
              href="/booking"
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
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
