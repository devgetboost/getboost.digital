import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { analytics } from '@/lib/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, CheckCircle2, Zap, Target, BarChart3, Users, Sparkles, Send, Phone } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';

const ACCENT = '#ff4000';
const manifestoLines = ['Sem tabelas.', 'Sem surpresas.'];

const solutionTypeIds = ['new', 'upgrade', 'specific'] as const;
const solutionTypeIcons = { new: Sparkles, upgrade: Target, specific: Zap };

const serviceOptionData = [
  { id: 'website', base: 800, label: 'Website / Landing Page' },
  { id: 'social', base: 400, label: 'Gestão de Redes Sociais' },
  { id: 'google-business', base: 200, label: 'Google Business Profile' },
  { id: 'ads', base: 500, label: 'Publicidade (Meta / Google)' },
  { id: 'consultoria', base: 300, label: 'Consultoria Estratégica' },
  { id: 'software', base: 1200, label: 'Software / App / SaaS' },
  { id: 'drone', base: 350, label: 'Vídeo & Fotografia' },
  { id: 'ai', base: 600, label: 'Agentes de IA & Automação' },
];

const complexityData = [
  { id: 'basic', multiplier: 1, label: 'Essencial', desc: 'Simples, rápido, funcional.' },
  { id: 'standard', multiplier: 1.5, label: 'Standard', desc: 'Equilíbrio entre custo e desempenho.' },
  { id: 'premium', multiplier: 2.2, label: 'Premium', desc: 'Sob medida, integrações e alta escala.' },
];

const businessSizeData = [
  { id: 'freelancer', multiplier: 0.8, label: 'Freelancer / Solo' },
  { id: 'micro', multiplier: 1, label: 'Microempresa (1–5)' },
  { id: 'small', multiplier: 1.3, label: 'Pequena (6–20)' },
  { id: 'medium', multiplier: 1.6, label: 'Média (20+)' },
];

const objectiveIds = [
  { id: 'visibility', label: 'Ganhar visibilidade' },
  { id: 'leads', label: 'Gerar leads qualificadas' },
  { id: 'automate', label: 'Automatizar operações' },
  { id: 'rebrand', label: 'Reposicionar a marca' },
  { id: 'scale', label: 'Escalar o negócio' },
];

const solutionTypeLabels: Record<string, string> = {
  new: 'Começar do zero',
  upgrade: 'Melhorar o que já tenho',
  specific: 'Serviço pontual e específico',
};

const faqs = [
  { q: 'A estimativa é vinculativa?', a: 'Não. É uma referência realista baseada em projectos similares. A proposta final é entregue após uma reunião de 30 minutos onde validamos escopo e prioridades.' },
  { q: 'Trabalham com valores mensais ou por projecto?', a: 'Ambos. Serviços contínuos (marketing, IA, redes) são mensais. Desenvolvimento e branding são normalmente por projecto com marcos de pagamento.' },
  { q: 'Quanto tempo demora até ver resultados?', a: 'Setup técnico entre 2 e 6 semanas. Resultados de aquisição começam a estabilizar após 60–90 dias de execução consistente.' },
  { q: 'Posso ajustar o escopo depois?', a: 'Sim. Contratos são modulares — aumentas ou reduzes serviços mês a mês conforme resultados e prioridades.' },
];

const PriceSimulator = () => {
  const { i18n } = useTranslation();
  const [step, setStep] = useState(0);
  const [solutionType, setSolutionType] = useState('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [complexity, setComplexity] = useState('');
  const [businessSize, setBusinessSize] = useState('');
  const [objective, setObjective] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const simulatorRef = useRef<HTMLDivElement>(null);
  const leadFormRef = useRef<HTMLDivElement>(null);

  const [leadForm, setLeadForm] = useState({
    name: '', email: '', phone: '', company: '', website: '', objective: '', timeline: '', message: ''
  });

  const toggleService = (id: string) =>
    setSelectedServices(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const calculatePrice = () => {
    const servicesTotal = serviceOptionData.filter(s => selectedServices.includes(s.id)).reduce((sum, s) => sum + s.base, 0);
    const comp = complexityData.find(c => c.id === complexity);
    const biz = businessSizeData.find(b => b.id === businessSize);
    const multiplier = (comp?.multiplier || 1) * (biz?.multiplier || 1);
    const base = servicesTotal * multiplier;
    return { min: Math.round(base * 0.85), max: Math.round(base * 1.15) };
  };

  const canAdvance = () => {
    if (step === 0) return !!solutionType;
    if (step === 1) return selectedServices.length > 0;
    if (step === 2) return !!complexity;
    if (step === 3) return !!businessSize;
    if (step === 4) return !!objective;
    return false;
  };

  const handleNext = () => { if (step < 4) setStep(step + 1); else setShowResult(true); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };
  const scrollToSimulator = () => simulatorRef.current?.scrollIntoView({ behavior: 'smooth' });

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadForm.name.trim() || !leadForm.email.trim()) { toast.error('Preenche o nome e email.'); return; }
    setSubmitting(true);
    const price = calculatePrice();
    try {
      const { error } = await supabase.from('leads').insert({
        name: leadForm.name.trim().slice(0, 100),
        email: leadForm.email.trim().slice(0, 255),
        phone: leadForm.phone.trim().slice(0, 20) || null,
        company: leadForm.company.trim().slice(0, 100) || null,
        website: leadForm.website.trim().slice(0, 255) || null,
        service: selectedServices.join(', '),
        budget: `€${price.min} - €${price.max}`,
        timeline: leadForm.timeline || null,
        message: leadForm.message.trim().slice(0, 1000) || null,
        source: 'price-simulator',
      });
      if (error) throw error;

      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'lead-notification',
          recipientEmail: 'nunocruz@getboost.digital',
          templateData: {
            name: leadForm.name.trim(),
            email: leadForm.email.trim(),
            phone: leadForm.phone.trim() || null,
            company: leadForm.company.trim() || null,
            website: leadForm.website.trim() || null,
            service: selectedServices.join(', '),
            message: `Orçamento: €${price.min} - €${price.max}\nTimeline: ${leadForm.timeline}\n${leadForm.message}`,
            source: 'Simulador de Preço',
            language: i18n.language,
          }
        }
      });

      setLeadSubmitted(true);
      toast.success('Pedido enviado. Falamos em breve.');
      analytics.trackForm('price_simulator', 'simulator_form_success', {
        services: selectedServices, price_range: `€${price.min} - €${price.max}`
      });
    } catch {
      toast.error('Erro ao enviar. Tenta novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const price = calculatePrice();
  const stepLabels = ['Tipo', 'Serviços', 'Complexidade', 'Empresa', 'Objectivo'];

  const optionBtn = (active: boolean) =>
    `w-full text-left transition-all border ${active
      ? 'border-[#ff4000] bg-[#ff4000]/10 text-white'
      : 'border-white/15 bg-white/[0.02] text-white/80 hover:border-white/40 hover:bg-white/[0.05]'}`;

  const darkInput =
    'w-full bg-transparent border-0 border-b border-white/20 rounded-none h-11 px-0 text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#ff4000] transition-colors';

  return (
    <Layout>
      <SEO
        title="Simulador de Orçamento — Estimativa Realista em 2 Min | Getboost Digital"
        description="Calcula uma estimativa realista para o teu projecto digital em menos de 2 minutos. Sem compromisso, sem cadastro obrigatório."
        canonical="/simulador"
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
            Simulador · 5 perguntas · &lt; 2 minutos
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
            Um <em className="not-italic text-white">preço realista</em> em vez de uma tabela genérica.
            Respondes a 5 perguntas e recebes uma banda de investimento calculada com base em centenas
            de projectos executados. Sem inscrição obrigatória.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 flex flex-wrap items-center gap-4"
          >
            <button
              type="button"
              onClick={scrollToSimulator}
              className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: '#ffb494' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Iniciar simulação
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <a
              href="/booking"
              className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-white"
            >
              <Phone className="h-4 w-4" style={{ color: ACCENT }} />
              Prefiro falar com alguém
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '<2min', v: 'Para responder' },
              { k: '5', v: 'Perguntas objectivas' },
              { k: '±15%', v: 'Margem de precisão' },
              { k: '0€', v: 'Compromisso' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="bg-[#0a0603] text-white py-20">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/10 pt-14">
            {[
              { Icon: Target, title: 'Descreve o projecto', desc: 'Tipo de solução, serviços envolvidos, complexidade e dimensão da empresa.' },
              { Icon: BarChart3, title: 'Recebe a banda', desc: 'Estimativa mín–máx calculada com base em projectos reais executados.' },
              { Icon: Zap, title: 'Valida com a equipa', desc: 'Se avançares, marcamos 30 min gratuitos para afinar escopo e proposta final.' },
            ].map((it, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="border border-white/10 bg-white/[0.02] p-6 md:p-8"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center border"
                  style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
                >
                  <it.Icon className="h-4 w-4" />
                </div>
                <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  Passo {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-2 text-xl font-bold tracking-tight">{it.title}</h3>
                <p className="mt-3 text-sm text-white/60 leading-relaxed">{it.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULADOR */}
      <section ref={simulatorRef} className="bg-[#0a0603] text-white py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6 md:px-12">
          <div className="text-center mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              Simulação interactiva
            </span>
            <h2 className="mt-4 text-3xl md:text-5xl font-black leading-[1.02] tracking-tight">
              Quanto custa o teu <span style={{ color: ACCENT }}>projecto</span>?
            </h2>
          </div>

          {!showResult ? (
            <div className="border border-white/10 bg-white/[0.02] p-6 md:p-10">
              {/* progress */}
              <div className="flex items-center gap-2 mb-10">
                {stepLabels.map((label, i) => (
                  <div key={i} className="flex-1">
                    <div className="h-0.5" style={{ background: i <= step ? ACCENT : 'rgba(255,255,255,0.15)' }} />
                    <p
                      className={`text-[10px] mt-2 text-center font-mono uppercase tracking-[0.18em] ${i <= step ? 'text-white' : 'text-white/30'}`}
                    >
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {step === 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-6 text-white">Que tipo de solução procuras?</h3>
                      <div className="space-y-3">
                        {solutionTypeIds.map(id => {
                          const Icon = solutionTypeIcons[id];
                          const active = solutionType === id;
                          return (
                            <button key={id} onClick={() => setSolutionType(id)} className={`${optionBtn(active)} flex items-center gap-4 p-4`}>
                              <Icon className="w-5 h-5 shrink-0" style={{ color: active ? ACCENT : 'rgba(255,255,255,0.5)' }} />
                              <span className="font-medium">{solutionTypeLabels[id]}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-6 text-white">Que serviços? <span className="text-sm font-normal text-white/50">(selecciona vários)</span></h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {serviceOptionData.map(s => {
                          const active = selectedServices.includes(s.id);
                          return (
                            <button key={s.id} onClick={() => toggleService(s.id)} className={`${optionBtn(active)} flex items-center gap-3 p-3.5`}>
                              <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: active ? ACCENT : 'rgba(255,255,255,0.25)' }} />
                              <span className="text-sm font-medium">{s.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-6 text-white">Qual o nível de complexidade?</h3>
                      <div className="space-y-3">
                        {complexityData.map(c => {
                          const active = complexity === c.id;
                          return (
                            <button key={c.id} onClick={() => setComplexity(c.id)} className={`${optionBtn(active)} p-4`}>
                              <div className="font-semibold">{c.label}</div>
                              <p className="text-sm text-white/50 mt-1">{c.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-6 text-white">Dimensão da empresa?</h3>
                      <div className="space-y-3">
                        {businessSizeData.map(b => {
                          const active = businessSize === b.id;
                          return (
                            <button key={b.id} onClick={() => setBusinessSize(b.id)} className={`${optionBtn(active)} flex items-center gap-4 p-4`}>
                              <Users className="w-5 h-5 shrink-0" style={{ color: active ? ACCENT : 'rgba(255,255,255,0.5)' }} />
                              <span className="font-medium">{b.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-6 text-white">Qual o objectivo principal?</h3>
                      <div className="space-y-3">
                        {objectiveIds.map(o => {
                          const active = objective === o.id;
                          return (
                            <button key={o.id} onClick={() => setObjective(o.id)} className={`${optionBtn(active)} flex items-center gap-4 p-4`}>
                              <Target className="w-5 h-5 shrink-0" style={{ color: active ? ACCENT : 'rgba(255,255,255,0.5)' }} />
                              <span className="font-medium">{o.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex justify-between mt-10 gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canAdvance()}
                  className="group inline-flex items-center gap-2 border-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] transition-all hover:!text-white disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ borderColor: ACCENT, color: '#ffb494' }}
                  onMouseEnter={(e) => { if (canAdvance()) e.currentTarget.style.background = ACCENT; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {step === 4 ? 'Ver estimativa' : 'Seguinte'}
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          ) : !showLeadForm ? (
            <motion.div
              className="border border-white/10 bg-white/[0.02] p-8 md:p-12 text-center"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div
                className="inline-flex h-14 w-14 items-center justify-center border mb-6"
                style={{ borderColor: `${ACCENT}66`, color: ACCENT }}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                Banda de investimento estimada
              </div>
              <p className="mt-6 font-black leading-none tracking-tight text-4xl md:text-6xl">
                <span style={{ color: ACCENT }}>€{price.min.toLocaleString('pt-PT')}</span>
                <span className="text-white/40 mx-3">—</span>
                <span style={{ color: ACCENT }}>€{price.max.toLocaleString('pt-PT')}</span>
              </p>
              <p className="mt-4 text-xs uppercase tracking-widest text-white/40 font-mono">
                Sem IVA · valor de referência
              </p>

              <div className="text-left mt-10 border-t border-white/10 pt-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 mb-3">
                  Baseado em
                </p>
                <div className="flex flex-wrap gap-2">
                  {serviceOptionData.filter(s => selectedServices.includes(s.id)).map(s => (
                    <span key={s.id} className="px-3 py-1 border border-white/15 text-xs text-white/70">
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-10">
                <button
                  type="button"
                  onClick={() => { setShowLeadForm(true); setTimeout(() => leadFormRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 border-2 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.24em] transition-all hover:!text-white"
                  style={{ borderColor: ACCENT, color: '#ffb494', background: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Receber proposta detalhada <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowResult(false); setStep(0); }}
                  className="flex-1 inline-flex items-center justify-center gap-2 border border-white/20 px-6 py-4 font-mono text-[11px] uppercase tracking-[0.24em] text-white/70 hover:border-white/50 hover:text-white transition-colors"
                >
                  Simular novamente
                </button>
              </div>
            </motion.div>
          ) : null}
        </div>
      </section>

      {/* LEAD FORM */}
      {showLeadForm && (
        <section ref={leadFormRef} className="bg-[#0a0603] text-white pb-24">
          <div className="max-w-2xl mx-auto px-6 md:px-12">
            {!leadSubmitted ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="border border-white/10 bg-white/[0.02] p-6 md:p-10">
                <div className="mb-8">
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                    Briefing final
                  </span>
                  <h3 className="mt-3 text-2xl md:text-3xl font-black leading-tight tracking-tight">
                    Recebe a proposta completa por email.
                  </h3>
                </div>

                <form onSubmit={handleLeadSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Input placeholder="Nome *" value={leadForm.name} onChange={e => setLeadForm(p => ({ ...p, name: e.target.value }))} required maxLength={100} className={darkInput} />
                    <Input type="email" placeholder="Email *" value={leadForm.email} onChange={e => setLeadForm(p => ({ ...p, email: e.target.value }))} required maxLength={255} className={darkInput} />
                    <Input placeholder="Telefone" value={leadForm.phone} onChange={e => setLeadForm(p => ({ ...p, phone: e.target.value }))} maxLength={20} className={darkInput} />
                    <Input placeholder="Empresa" value={leadForm.company} onChange={e => setLeadForm(p => ({ ...p, company: e.target.value }))} maxLength={100} className={darkInput} />
                  </div>
                  <Input placeholder="Website actual (https://…)" value={leadForm.website} onChange={e => setLeadForm(p => ({ ...p, website: e.target.value }))} maxLength={255} className={darkInput} />
                  <select
                    value={leadForm.timeline}
                    onChange={e => setLeadForm(p => ({ ...p, timeline: e.target.value }))}
                    className="w-full bg-transparent border-0 border-b border-white/20 rounded-none h-11 px-0 text-white focus-visible:outline-none focus-visible:border-[#ff4000] transition-colors [&>option]:bg-[#0a0603] [&>option]:text-white"
                  >
                    <option value="">Quando queres começar?</option>
                    <option value="imediato">Imediato</option>
                    <option value="1-month">Próximo mês</option>
                    <option value="3-months">Em 3 meses</option>
                    <option value="exploring">Ainda a explorar</option>
                  </select>
                  <Textarea placeholder="Contexto adicional (opcional)" value={leadForm.message} onChange={e => setLeadForm(p => ({ ...p, message: e.target.value }))} maxLength={1000} rows={3} className="w-full bg-transparent border border-white/15 rounded-none text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:border-[#ff4000]" />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-3 border-2 px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-50"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
                    onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = ACCENT; }}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {submitting ? 'A enviar…' : 'Enviar pedido'} <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border border-white/10 bg-white/[0.02] p-10 md:p-14 text-center">
                <div className="inline-flex h-14 w-14 items-center justify-center border mb-6" style={{ borderColor: `${ACCENT}66`, color: ACCENT }}>
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight">Pedido enviado.</h3>
                <p className="text-white/60 mt-4">A proposta detalhada chega ao teu email em menos de 24h úteis.</p>
                <a
                  href="/"
                  className="mt-8 inline-flex items-center gap-2 border border-white/20 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/70 hover:border-white/50 hover:text-white transition-colors"
                >
                  Voltar ao início
                </a>
              </motion.div>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="bg-[#0a0603] text-white py-24 md:py-28">
        <div className="max-w-4xl mx-auto px-6 md:px-12">
          <div className="border-t border-white/10 pt-14 mb-10">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>Perguntas frequentes</span>
            <h2 className="mt-4 text-3xl md:text-5xl font-black leading-[1.02] tracking-tight">
              O que <span style={{ color: ACCENT }}>convém</span> saber.
            </h2>
          </div>
          <div className="border-t border-white/10">
            {faqs.map((f, i) => (
              <details key={i} className="group border-b border-white/10 py-6">
                <summary className="flex items-center justify-between gap-6 cursor-pointer list-none">
                  <span className="text-lg md:text-xl font-semibold text-white">{f.q}</span>
                  <span
                    className="shrink-0 font-mono text-lg transition-transform group-open:rotate-45"
                    style={{ color: ACCENT }}
                  >+</span>
                </summary>
                <p className="mt-4 text-white/60 leading-relaxed">{f.a}</p>
              </details>
            ))}
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
            Adoraria conhecer o teu <span style={{ color: ACCENT }}>projecto</span> e trabalhar contigo.
          </motion.h2>
          <p className="mt-8 max-w-2xl mx-auto text-white/60 text-lg">Vamos criar algo extraordinário.</p>
          <div className="mt-14 flex flex-wrap justify-center gap-4">
            <button
              type="button"
              onClick={scrollToSimulator}
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Iniciar simulação <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="/booking"
              className="inline-flex items-center gap-3 border border-white/25 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] text-white/80 hover:border-white hover:text-white transition-colors"
            >
              <Phone className="h-4 w-4" /> Falar com especialista
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PriceSimulator;
