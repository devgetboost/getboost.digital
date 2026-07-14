import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';

const ACCENT = '#ff4000';

const schema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  company: z.string().trim().max(120).optional().or(z.literal('')),
  role: z.string().trim().max(80).optional().or(z.literal('')),
  goal: z.string().trim().min(1, 'Escolhe um objectivo'),
  budget: z.string().trim().optional().or(z.literal('')),
  timeline: z.string().trim().optional().or(z.literal('')),
  message: z.string().trim().max(1000).optional().or(z.literal('')),
});

export type ConsultantServiceContext = {
  slug: string;
  name: string;
  accent?: string;
  eyebrow: string;
  headline: string;
  subhead: string;
  goalOptions: string[];
  budgetOptions?: string[];
  timelineOptions?: string[];
  messagePlaceholder?: string;
};

const defaultBudgets = ['< 1.000 €/mês', '1.000 – 3.000 €/mês', '3.000 – 7.000 €/mês', '> 7.000 €/mês', 'A definir'];
const defaultTimelines = ['O quanto antes', 'Próximas 2 semanas', 'Próximo mês', 'A explorar'];

type Props = {
  open: boolean;
  onClose?: () => void;
  service: ConsultantServiceContext;
};

const ConsultantContactForm = ({ open, service }: Props) => {
  const accent = service.accent || ACCENT;
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', company: '', role: '',
    goal: '', budget: '', timeline: '', message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      const composed = [
        `Serviço: ${service.name}`,
        `Objectivo: ${form.goal}`,
        form.budget && `Budget: ${form.budget}`,
        form.timeline && `Prazo: ${form.timeline}`,
        form.role && `Cargo: ${form.role}`,
        form.message && `\nMensagem:\n${form.message}`,
      ].filter(Boolean).join('\n');

      const { error } = await supabase.from('leads').insert({
        source: `consultor:${service.slug}`,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        service: service.name,
        cargo: form.role.trim() || null,
        resource_id: service.slug,
        resource_name: service.name,
        message: composed,
      });
      if (error) throw error;

      // Roteia o lead: consulta solucao_routing por slug, notifica destinatários
      // configurados e adiciona à lista Brevo mapeada.
      supabase.functions.invoke('route-solucao-lead', {
        body: {
          slug: service.slug,
          lead: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim() || null,
            company: form.company.trim() || null,
            service: service.name,
            role: form.role.trim() || null,
            message: composed,
          },
        },
      }).catch(() => {});

      analytics.trackForm('consultor', `consultor_${service.slug}_form_success`, {
        slug: service.slug,
        service: service.name,
        email: form.email.trim(),
      });

      setDone(true);
      toast.success('Pedido enviado. Entramos em contacto em breve.');
    } catch (err) {
      toast.error('Não foi possível enviar. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="max-w-4xl mx-auto mt-14 border border-white/15 bg-white/[0.02] backdrop-blur-sm p-8 md:p-12 text-left">
            {done ? (
              <div className="py-10 text-center">
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2"
                  style={{ borderColor: accent, color: accent }}
                >
                  <Check className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-2xl md:text-3xl font-bold">Recebemos o teu pedido.</h3>
                <p className="mt-3 text-white/70 max-w-xl mx-auto">
                  Um consultor especialista em <span style={{ color: accent }}>{service.name}</span> vai
                  analisar o teu contexto e responder em menos de 24h úteis.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: accent }}>
                    {service.eyebrow}
                  </span>
                  <h3 className="mt-3 text-2xl md:text-4xl font-bold leading-tight">{service.headline}</h3>
                  <p className="mt-3 text-white/65 text-sm md:text-base max-w-2xl">{service.subhead}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Nome *" error={errors.name}>
                    <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                      className="w-full bg-transparent border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60" />
                  </Field>
                  <Field label="Email *" error={errors.email}>
                    <input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
                      className="w-full bg-transparent border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60" />
                  </Field>
                  <Field label="Telefone" error={errors.phone}>
                    <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
                      placeholder="+351 …"
                      className="w-full bg-transparent border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60" />
                  </Field>
                  <Field label="Empresa" error={errors.company}>
                    <input value={form.company} onChange={(e) => set('company', e.target.value)}
                      className="w-full bg-transparent border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60" />
                  </Field>
                  <Field label="O teu cargo" error={errors.role}>
                    <input value={form.role} onChange={(e) => set('role', e.target.value)}
                      placeholder="Ex.: CEO, Marketing Lead"
                      className="w-full bg-transparent border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60" />
                  </Field>
                  <Field label="Quando querem começar?" error={errors.timeline}>
                    <select value={form.timeline} onChange={(e) => set('timeline', e.target.value)}
                      className="w-full bg-[#0a0603] border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60">
                      <option value="">Seleccionar…</option>
                      {(service.timelineOptions || defaultTimelines).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Qual é o principal objectivo? *" error={errors.goal}>
                  <div className="flex flex-wrap gap-2">
                    {service.goalOptions.map((g) => {
                      const active = form.goal === g;
                      return (
                        <button key={g} type="button" onClick={() => set('goal', g)}
                          className="rounded-full border px-4 py-2 text-xs md:text-sm transition-all"
                          style={{
                            borderColor: active ? accent : 'rgba(255,255,255,0.25)',
                            background: active ? accent : 'transparent',
                            color: active ? '#ffffff' : 'rgba(255,255,255,0.8)',
                          }}>
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Budget indicativo" error={errors.budget}>
                  <div className="flex flex-wrap gap-2">
                    {(service.budgetOptions || defaultBudgets).map((b) => {
                      const active = form.budget === b;
                      return (
                        <button key={b} type="button" onClick={() => set('budget', b)}
                          className="border px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-all"
                          style={{
                            borderColor: active ? accent : 'rgba(255,255,255,0.25)',
                            color: active ? accent : 'rgba(255,255,255,0.7)',
                          }}>
                          {b}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Conta-nos mais (opcional)" error={errors.message}>
                  <textarea value={form.message} onChange={(e) => set('message', e.target.value)}
                    rows={4} maxLength={1000}
                    placeholder={service.messagePlaceholder || 'Contexto, desafios actuais, ferramentas em uso…'}
                    className="w-full bg-transparent border border-white/20 px-4 py-3 text-white outline-none focus:border-white/60 resize-none" />
                </Field>

                <div className="flex items-center justify-between gap-4 pt-2">
                  <p className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                    Resposta &lt; 24h úteis
                  </p>
                  <button type="submit" disabled={submitting}
                    className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all disabled:opacity-60"
                    style={{ borderColor: accent, color: accent }}
                    onMouseEnter={(e) => !submitting && (e.currentTarget.style.background = accent, e.currentTarget.style.color = '#ffffff')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = accent)}>
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enviar pedido <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <label className="block">
    <span className="block mb-2 text-[11px] font-mono uppercase tracking-widest text-white/60">{label}</span>
    {children}
    {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
  </label>
);

export default ConsultantContactForm;
