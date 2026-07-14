import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Building2,
  Target,
  Users,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ClipboardList,
  Presentation,
  LineChart,
  Handshake,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';

const ACCENT = '#ff4000';

const PROCESS = [
  {
    icon: ClipboardList,
    title: 'Diagnóstico',
    body: 'Reunião de 45 min com liderança + amostra da equipa. Mapeamos objetivos, stack atual, gaps e KPIs a mover.',
  },
  {
    icon: Presentation,
    title: 'Desenho do programa',
    body: 'Curriculum construído à volta dos teus casos reais. Nada de slides genéricos — trabalhamos com os teus dados.',
  },
  {
    icon: Zap,
    title: 'Execução',
    body: 'Sessões práticas presenciais ou online, com workshops, sprints e entregáveis validados em cada módulo.',
  },
  {
    icon: LineChart,
    title: 'Medição e follow-up',
    body: '30 dias de acompanhamento pós-formação com métricas antes/depois e ajustes ao playbook operacional.',
  },
];

const OUTCOMES = [
  'Redução de tempo em tarefas repetitivas (média 30–60%)',
  'Playbooks internos documentados e prontos a escalar',
  'Adopção real de ferramentas — sem "formação de gaveta"',
  'Equipa autónoma para iterar sem depender de fornecedores',
  'KPIs mensuráveis antes/depois do programa',
  'Alinhamento entre marketing, vendas e operações',
];

const PROGRAMS = [
  {
    icon: Sparkles,
    title: 'IA aplicada ao negócio',
    body: 'Como integrar LLMs, agentes e automações em processos reais — vendas, suporte, operações, conteúdo.',
    duration: '16–24 h',
  },
  {
    icon: TrendingUp,
    title: 'Growth & Performance',
    body: 'Aquisição paga, CRO, funis e analytics. Da estratégia à execução com orçamento real.',
    duration: '12–20 h',
  },
  {
    icon: Building2,
    title: 'Automação operacional',
    body: 'n8n, Make, Zapier e integrações. Automatizar o que consome tempo e não dá margem.',
    duration: '12–18 h',
  },
  {
    icon: Handshake,
    title: 'Vendas B2B com IA',
    body: 'Prospecção, qualificação, follow-up e CRM. Como triplicar o output sem contratar mais.',
    duration: '10–16 h',
  },
];

const FAQS = [
  {
    q: 'Qual a dimensão mínima da equipa?',
    a: 'A partir de 4 pessoas. Abaixo disso recomendamos mentoria 1:1 ou formação em turma aberta.',
  },
  {
    q: 'Presencial ou online?',
    a: 'Ambos. Fazemos in-company em Portugal continental e ilhas, ou 100% remoto via videoconferência com dinâmicas interactivas.',
  },
  {
    q: 'Qual o investimento?',
    a: 'Depende da dimensão da equipa, carga horária e nível de customização. Programas típicos entre 3.500 € e 15.000 €. Enviamos proposta em 48h após diagnóstico.',
  },
  {
    q: 'É elegível para financiamento?',
    a: 'Sim. Emitimos toda a documentação necessária para candidaturas ao IEFP, Turismo de Portugal e fundos europeus.',
  },
  {
    q: 'Passamos certificado?',
    a: 'Sim. Certificado de conclusão com carga horária, conteúdos programáticos e avaliação individual.',
  },
];

const AcademyInCompany = () => {
  const { i18n } = useTranslation();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    cargo: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.company.trim()) {
      toast({ title: 'Nome, email e empresa são obrigatórios', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from('leads').insert({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        company: form.company.trim() || null,
        cargo: form.cargo.trim() || null,
        message: form.message.trim() || null,
        source: 'academy:in-company',
        landing_page: '/academy/formacao-empresas',
      });
      if (error) throw error;
      analytics.trackForm('academy', 'academy_in_company_form_success', {
        company: form.company.trim(),
        email: form.email.trim(),
      });
      toast({
        title: 'Pedido enviado',
        description: 'Marcamos o diagnóstico gratuito em menos de 24h.',
      });
      setForm({ name: '', email: '', phone: '', company: '', cargo: '', message: '' });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Não foi possível enviar',
        description: 'Tenta novamente daqui a instantes.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="Formação à medida para empresas — Getboost Academy"
        description="Programas de formação in-company em IA, automação e growth. Desenhados à volta dos teus KPIs, com entregáveis reais e medição antes/depois."
        canonical="/academy/formacao-empresas"
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
            maskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 30% 50%, black 20%, transparent 70%)',
          }}
        />
        <div
          aria-hidden
          className="absolute -right-40 top-1/3 h-[640px] w-[640px] rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }}
        />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-16 pb-24 md:pt-24 md:pb-32">
          <Link
            to="/academy"
            className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Academy · In-company
          </Link>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-[1.3fr,1fr] gap-14 items-start">
            <div>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
                style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}
              >
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                Formação In-Company · Diagnóstico gratuito
              </motion.span>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="mt-8 font-black leading-[0.95] tracking-tight text-[clamp(2.5rem,6vw,5.5rem)]"
              >
                Forma a tua equipa em{' '}
                <span style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>
                  produtividade real.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mt-8 max-w-2xl text-lg md:text-xl leading-relaxed text-white/75"
              >
                Programas desenhados à volta dos teus KPIs, dos teus dados e do teu stack.
                Sem slides genéricos. Sem "formação de gaveta". Entregas reais por módulo
                e medição do impacto no mês seguinte.
              </motion.p>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-10 h-px w-40 origin-left"
                style={{ background: `${ACCENT}b3` }}
              />

              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                {[
                  { k: '48h', v: 'Proposta após diagnóstico' },
                  { k: '4+', v: 'Pessoas por turma' },
                  { k: '30d', v: 'Follow-up incluído' },
                  { k: '100%', v: 'Casos reais teus' },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: ACCENT }}>
                      {s.k}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative border border-white/10 bg-white/[0.03] backdrop-blur-sm p-8"
            >
              <div
                className="absolute inset-x-0 -top-px h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }}
              />
              <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">
                Marcar diagnóstico gratuito
              </span>
              <h2 className="mt-3 text-2xl font-black tracking-tight">
                45 min para perceber onde acelerar.
              </h2>
              <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                {[
                  { key: 'name', placeholder: 'Nome', type: 'text', required: true },
                  { key: 'email', placeholder: 'Email profissional', type: 'email', required: true },
                  { key: 'company', placeholder: 'Empresa', type: 'text', required: true },
                  { key: 'cargo', placeholder: 'Cargo', type: 'text' },
                  { key: 'phone', placeholder: 'Telemóvel (opcional)', type: 'tel' },
                ].map((f) => (
                  <input
                    key={f.key}
                    type={f.type}
                    placeholder={f.placeholder}
                    value={(form as Record<string, string>)[f.key]}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    required={f.required}
                    className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4000] focus:outline-none transition-colors"
                  />
                ))}
                <textarea
                  placeholder="Dimensão da equipa e áreas a formar"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#ff4000] focus:outline-none transition-colors resize-none"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-3 border-2 px-6 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-50"
                  style={{ borderColor: ACCENT, color: '#ffb494' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {submitting ? 'A enviar…' : 'Quero o diagnóstico'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <p className="text-[10px] font-mono uppercase tracking-[0.18em] text-white/40 text-center">
                  Sem custo · Sem compromisso · Resposta em 24h
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* WHY IN-COMPANY */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr,1.4fr] gap-14">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Porquê in-company
              </span>
              <h2 className="mt-6 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">
                Formação genérica <span style={{ color: ACCENT }}>não muda</span> KPIs.
              </h2>
              <p className="mt-8 text-white/60 leading-relaxed">
                A tua equipa não precisa de mais teoria — precisa de dominar as ferramentas
                que resolvem os problemas <em className="not-italic text-white">desta</em> operação.
                Trabalhamos com os teus dados, os teus clientes e os teus processos.
                Cada sessão termina com algo pronto a usar na segunda-feira.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {OUTCOMES.map((o, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.4) }}
                  className="border border-white/10 bg-white/[0.02] p-6 flex gap-4"
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-1" style={{ color: ACCENT }} />
                  <p className="text-sm leading-relaxed text-white/85">{o}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10 pt-10 mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Programas base
            </span>
            <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight max-w-3xl">
              Quatro trilhas para <span style={{ color: ACCENT }}>combinar</span> à vontade.
            </h2>
            <p className="mt-6 text-white/60 max-w-2xl">
              Escolhe uma trilha, combina módulos de várias ou desenha algo 100% novo com o nosso lead trainer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PROGRAMS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.08, 0.4) }}
                  className="group relative border border-white/10 bg-white/[0.02] p-8 hover:border-[#ff4000]/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="h-12 w-12 rounded-full border flex items-center justify-center"
                      style={{ borderColor: `${ACCENT}66` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: ACCENT }} />
                    </div>
                    <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">
                      {p.duration}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-white/60 leading-relaxed">{p.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10 pt-10 mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Como trabalhamos
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight max-w-3xl">
              Do diagnóstico ao impacto <span style={{ color: ACCENT }}>medível</span>.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROCESS.map((p, i) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="border-t-2 pt-6" style={{ borderColor: ACCENT }}>
                  <span className="font-mono text-4xl font-black text-white/10">{String(i + 1).padStart(2, '0')}</span>
                  <Icon className="h-6 w-6 mt-4" style={{ color: ACCENT }} />
                  <h3 className="mt-4 text-xl font-bold tracking-tight">{p.title}</h3>
                  <p className="mt-3 text-sm text-white/60 leading-relaxed">{p.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* GUARANTEES */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-3 gap-10">
          {[
            { icon: Target, title: 'Foco em ROI', body: 'Cada programa é validado contra 2–3 KPIs de negócio. Se não movermos, refazemos.' },
            { icon: Users, title: 'Formadores que operam', body: 'Todos os nossos trainers têm empresas ou operações activas. Não vieram do PowerPoint.' },
            { icon: ShieldCheck, title: 'Documentação completa', body: 'Facturas, certificados, conteúdos programáticos e documentação para financiamento.' },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t border-white/10 pt-8">
              <Icon className="h-7 w-7" style={{ color: ACCENT }} />
              <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
              <p className="mt-3 text-white/60 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
            Perguntas frequentes
          </span>
          <h2 className="mt-6 text-3xl md:text-5xl font-black leading-[1.05] tracking-tight">
            As dúvidas do <span style={{ color: ACCENT }}>decisor</span>.
          </h2>
          <Accordion type="single" collapsible className="mt-12">
            {FAQS.map((f, i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-white/10">
                <AccordionTrigger className="text-left text-lg font-semibold hover:no-underline hover:text-[#ff4000]">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-white/70 leading-relaxed text-base">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0a0603] text-white py-28 md:py-40 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]">
            Marca o <span style={{ color: ACCENT }}>diagnóstico</span> gratuito.
          </h2>
          <p className="mt-8 text-white/60 text-lg">
            45 minutos para perceber onde a tua equipa pode acelerar. Proposta em 48h se fizer sentido avançar.
          </p>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#top"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Pedir diagnóstico
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              to="/academy"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors"
            >
              Ver formações abertas
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default AcademyInCompany;
