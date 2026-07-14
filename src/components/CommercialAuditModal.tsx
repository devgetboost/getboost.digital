import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Loader2, Sparkles, Check, TrendingUp, Clock, Wallet } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { saveAudit, type StoredAudit } from '@/lib/auditHistory';


const ACCENT = '#ff4000';

type Answers = {
  industry: string;
  teamSize: string;
  currentCrm: string;
  leadVolume: string;
  conversionRate: string;
  biggestChallenge: string;
  automationLevel: string;
};

type Report = {
  score: number;
  verdict: string;
  strengths: string[];
  gaps: { title: string; detail: string }[];
  recommendations: { title: string; impact: string; effort: string; detail: string }[];
  projection: { revenueUplift: string; timeSaved: string; paybackMonths: string };
  nextStep: string;
};

const steps: {
  key: keyof Answers;
  label: string;
  question: string;
  options?: string[];
  input?: boolean;
  placeholder?: string;
}[] = [
  { key: 'industry', label: 'Indústria', question: 'Em que sector operas?', input: true, placeholder: 'Ex.: SaaS B2B, Retalho, Serviços profissionais...' },
  { key: 'teamSize', label: 'Equipa', question: 'Quantas pessoas na equipa comercial?', options: ['Só eu', '2 a 5', '6 a 15', '16 ou mais'] },
  { key: 'currentCrm', label: 'CRM', question: 'Que CRM usam hoje?', options: ['Nenhum / Folhas de cálculo', 'HubSpot', 'Salesforce', 'Pipedrive', 'Zoho', 'Outro'] },
  { key: 'leadVolume', label: 'Leads', question: 'Volume médio de leads por mês?', options: ['Menos de 50', '50 a 200', '200 a 1000', 'Mais de 1000'] },
  { key: 'conversionRate', label: 'Conversão', question: 'Qual a taxa de conversão actual?', options: ['Não medimos', 'Menos de 5%', '5% a 15%', '15% a 30%', 'Mais de 30%'] },
  { key: 'biggestChallenge', label: 'Desafio', question: 'Qual é hoje o maior travão comercial?', options: ['Qualificar leads', 'Follow-up consistente', 'Previsão de vendas', 'Taxa de fecho', 'Retenção de clientes'] },
  { key: 'automationLevel', label: 'Automação', question: 'Que nível de automação já têm?', options: ['Nenhuma', 'Automação básica (emails)', 'Automação moderada (fluxos)', 'IA em produção'] },
];

interface Props {
  open: boolean;
  onClose: () => void;
  preloaded?: StoredAudit | null;
}

const CommercialAuditModal = ({ open, onClose, preloaded = null }: Props) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<Answers>>({});
  const [contact, setContact] = useState({ name: '', email: '', company: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [previewMode, setPreviewMode] = useState(false); // aguarda confirmação do utilizador
  const [confirmed, setConfirmed] = useState(false);

  // Pré-carregar auditoria a partir do histórico (já confirmada — vai direto ao relatório final)
  useEffect(() => {
    if (open && preloaded) {
      setAnswers(preloaded.answers as Partial<Answers>);
      setContact({
        name: preloaded.contact.name,
        email: preloaded.contact.email,
        company: preloaded.contact.company || '',
        phone: preloaded.contact.phone || '',
      });
      setReport(preloaded.report as Report);
      setPreviewMode(false);
      setConfirmed(true);
      setStep(steps.length);
    }
  }, [open, preloaded]);

  const totalSteps = steps.length + 1;
  const isQuiz = step < steps.length;
  const isContact = step === steps.length;
  const isReport = report !== null;

  const currentStep = isQuiz ? steps[step] : null;
  const currentValue = currentStep ? (answers[currentStep.key] || '') : '';
  const canAdvance = isQuiz
    ? (currentStep!.input ? currentValue.trim().length > 1 : !!currentValue)
    : contact.name.trim().length > 1 && /\S+@\S+\.\S+/.test(contact.email);

  const reset = () => {
    setStep(0);
    setAnswers({});
    setContact({ name: '', email: '', company: '', phone: '' });
    setReport(null);
    setLoading(false);
    setPreviewMode(false);
    setConfirmed(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleSelect = (value: string) => {
    if (!currentStep) return;
    setAnswers((p) => ({ ...p, [currentStep.key]: value }));
    setTimeout(() => setStep((s) => Math.min(s + 1, totalSteps - 1)), 150);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('commercial-audit', {
        body: { answers, contact },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setReport(data.report);
      setPreviewMode(true); // mostra pré-visualização, aguarda confirmação
      setConfirmed(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro ao gerar relatório.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!report) return;
    try {
      saveAudit({
        contact: { ...contact },
        answers: answers as Record<string, string>,
        report,
      });
      setConfirmed(true);
      setPreviewMode(false);
      toast.success('Relatório confirmado e guardado no histórico.');
    } catch (err) {
      console.warn('Não foi possível guardar auditoria localmente', err);
      toast.error('Não foi possível guardar o relatório.');
    }
  };

  const handleRetake = () => {
    setReport(null);
    setPreviewMode(false);
    setConfirmed(false);
    setStep(0);
    setAnswers({});
  };



  if (!open) return null;

  const progress = isReport
    ? 100
    : Math.round(((step + (isContact ? 1 : 0)) / totalSteps) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 md:p-8 overflow-y-auto"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          transition={{ duration: 0.3 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-3xl my-auto rounded-2xl border border-white/10 bg-[#0a0603] text-white shadow-[0_20px_80px_-20px_rgba(255,64,0,0.5)] overflow-hidden"
        >
          {/* ambient */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,64,0,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.4) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
              maskImage: 'radial-gradient(ellipse at 80% 0%, black 10%, transparent 60%)',
              WebkitMaskImage: 'radial-gradient(ellipse at 80% 0%, black 10%, transparent 60%)',
            }}
          />

          <button
            onClick={handleClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* progress bar */}
          {!isReport && (
            <div className="relative h-1 w-full bg-white/5">
              <motion.div
                initial={false}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
                className="h-full"
                style={{ background: ACCENT }}
              />
            </div>
          )}

          <div className="relative p-6 md:p-10">
            {/* HEADER */}
            {!isReport && (
              <div className="flex items-center gap-3 mb-8">
                <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
                  Auditoria Comercial · 7 min
                </span>
                {isQuiz && (
                  <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                    {step + 1} / {steps.length + 1}
                  </span>
                )}
              </div>
            )}

            {/* QUIZ STEPS */}
            {isQuiz && (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
                  {currentStep!.question}
                </h2>

                {currentStep!.input ? (
                  <div className="mt-8">
                    <input
                      type="text"
                      value={currentValue}
                      onChange={(e) => setAnswers((p) => ({ ...p, [currentStep!.key]: e.target.value }))}
                      placeholder={currentStep!.placeholder}
                      autoFocus
                      className="w-full h-14 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 text-base px-5 focus:outline-none focus:border-[#ff4000]/60 focus:bg-white/10 transition-all"
                    />
                  </div>
                ) : (
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentStep!.options!.map((opt) => {
                      const active = currentValue === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelect(opt)}
                          className={`group text-left rounded-xl border px-5 py-4 transition-all ${
                            active
                              ? 'border-[#ff4000] bg-[#ff4000]/10'
                              : 'border-white/15 bg-white/[0.02] hover:border-white/40 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span className="text-sm md:text-base font-medium text-white">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* CONTACT STEP */}
            {isContact && !isReport && !loading && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight">
                  Onde enviamos o teu relatório?
                </h2>
                <p className="mt-3 text-white/60 text-sm md:text-base">
                  Preenchemos um diagnóstico personalizado com base no que respondeste. Zero spam.
                </p>
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Nome *"
                    value={contact.name}
                    onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                    className="h-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 px-5 text-sm focus:outline-none focus:border-[#ff4000]/60"
                  />
                  <input
                    type="email"
                    placeholder="Email profissional *"
                    value={contact.email}
                    onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                    className="h-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 px-5 text-sm focus:outline-none focus:border-[#ff4000]/60"
                  />
                  <input
                    type="text"
                    placeholder="Empresa"
                    value={contact.company}
                    onChange={(e) => setContact((p) => ({ ...p, company: e.target.value }))}
                    className="h-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 px-5 text-sm focus:outline-none focus:border-[#ff4000]/60"
                  />
                  <input
                    type="tel"
                    placeholder="Telefone (opcional)"
                    value={contact.phone}
                    onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                    className="h-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/30 px-5 text-sm focus:outline-none focus:border-[#ff4000]/60"
                  />
                </div>
              </motion.div>
            )}

            {/* LOADING */}
            {loading && (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-10 w-10 animate-spin" style={{ color: ACCENT }} />
                <p className="mt-6 text-lg font-semibold">A gerar o teu relatório personalizado...</p>
                <p className="mt-2 text-sm text-white/50">A IA está a cruzar as tuas respostas com benchmarks do sector.</p>
              </div>
            )}

            {/* REPORT */}
            {isReport && report && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                {/* PREVIEW BANNER — antes da confirmação */}
                {previewMode && !confirmed && (
                  <div className="mb-8 rounded-xl border-2 border-[#ff4000]/50 bg-[#ff4000]/[0.08] p-4 md:p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" style={{ color: ACCENT }} />
                      <span className="font-mono text-[10px] uppercase tracking-[0.24em]" style={{ color: ACCENT }}>
                        Pré-visualização do relatório
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-white/80">
                      Revê o conteúdo abaixo. Só é guardado no teu histórico depois de confirmares.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={handleConfirm}
                        className="inline-flex items-center gap-2 border-2 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] transition-all hover:!text-white"
                        style={{ borderColor: ACCENT, color: '#ffb494', background: 'transparent' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <Check className="h-4 w-4" /> Confirmar e guardar
                      </button>
                      <button
                        type="button"
                        onClick={handleRetake}
                        className="inline-flex items-center gap-2 px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white transition-colors"
                      >
                        Refazer quiz
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-8">
                  <Check className="h-4 w-4" style={{ color: ACCENT }} />
                  <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/60">
                    {previewMode && !confirmed ? 'Pré-visualização · ' : ''}Relatório para {contact.name}
                  </span>
                </div>


                {/* Score */}
                <div className="rounded-2xl border border-white/10 p-6 md:p-8 bg-gradient-to-br from-white/[0.04] to-transparent">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <svg width="110" height="110" viewBox="0 0 100 100" className="-rotate-90">
                        <circle cx="50" cy="50" r="42" strokeWidth="8" fill="none" stroke="rgba(255,255,255,0.08)" />
                        <motion.circle
                          cx="50" cy="50" r="42" strokeWidth="8" fill="none"
                          stroke={ACCENT} strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 42}
                          initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                          animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - report.score / 100) }}
                          transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black" style={{ color: ACCENT }}>{report.score}</span>
                        <span className="text-[10px] uppercase tracking-widest text-white/40">/100</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/50">Diagnóstico</span>
                      <p className="mt-2 text-lg md:text-xl font-semibold leading-snug">{report.verdict}</p>
                    </div>
                  </div>
                </div>

                {/* Strengths */}
                {report.strengths?.length > 0 && (
                  <section className="mt-8">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>Pontos Fortes</h3>
                    <ul className="mt-4 space-y-2">
                      {report.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm md:text-base text-white/80">
                          <Check className="h-4 w-4 mt-1 shrink-0" style={{ color: ACCENT }} />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Gaps */}
                {report.gaps?.length > 0 && (
                  <section className="mt-8">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>Onde estás a perder dinheiro</h3>
                    <div className="mt-4 space-y-3">
                      {report.gaps.map((g, i) => (
                        <div key={i} className="rounded-xl border border-white/10 p-5 bg-white/[0.02]">
                          <div className="text-white font-semibold text-base">{g.title}</div>
                          <p className="mt-1.5 text-sm text-white/70 leading-relaxed">{g.detail}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Recommendations */}
                {report.recommendations?.length > 0 && (
                  <section className="mt-8">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>Plano de acção recomendado</h3>
                    <div className="mt-4 space-y-3">
                      {report.recommendations.map((r, i) => (
                        <div key={i} className="rounded-xl border border-white/10 p-5 bg-white/[0.02]">
                          <div className="flex flex-wrap items-baseline gap-3">
                            <span className="font-mono text-xs" style={{ color: ACCENT }}>0{i + 1}</span>
                            <span className="text-white font-semibold text-base flex-1">{r.title}</span>
                          </div>
                          <p className="mt-2 text-sm text-white/70 leading-relaxed">{r.detail}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <span className="text-[11px] font-mono uppercase tracking-wider rounded-full border border-[#ff4000]/40 text-[#ffb494] px-3 py-1">
                              Impacto: {r.impact}
                            </span>
                            <span className="text-[11px] font-mono uppercase tracking-wider rounded-full border border-white/20 text-white/70 px-3 py-1">
                              Esforço: {r.effort}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Projection */}
                {report.projection && (
                  <section className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { icon: TrendingUp, label: 'Receita +', value: report.projection.revenueUplift },
                      { icon: Clock, label: 'Tempo poupado', value: report.projection.timeSaved },
                      { icon: Wallet, label: 'Payback', value: report.projection.paybackMonths },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl border border-white/10 p-5 bg-white/[0.02]">
                        <s.icon className="h-4 w-4" style={{ color: ACCENT }} />
                        <div className="mt-3 text-2xl font-black" style={{ color: ACCENT }}>{s.value}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/50">{s.label}</div>
                      </div>
                    ))}
                  </section>
                )}

                {/* Next step */}
                {report.nextStep && (
                  <section className="mt-8 rounded-xl border border-[#ff4000]/40 bg-[#ff4000]/[0.08] p-6">
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>Próximo passo</span>
                    <p className="mt-2 text-base md:text-lg font-semibold">{report.nextStep}</p>
                    <a
                      href="/contact"
                      className="mt-5 inline-flex items-center gap-2 border-2 px-6 py-3 font-mono text-[11px] uppercase tracking-[0.24em] transition-all hover:!text-white"
                      style={{ borderColor: ACCENT, color: ACCENT }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      Falar com um consultor
                      <ArrowRight className="h-4 w-4" />
                    </a>
                  </section>
                )}
              </motion.div>
            )}

            {/* NAVIGATION */}
            {!isReport && !loading && (
              <div className="mt-10 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  disabled={step === 0}
                  className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-white/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </button>

                {isContact ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canAdvance || loading}
                    className="group inline-flex items-center gap-3 border-2 px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-40 disabled:pointer-events-none"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Gerar Relatório
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : currentStep?.input ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => Math.min(s + 1, totalSteps - 1))}
                    disabled={!canAdvance}
                    className="group inline-flex items-center gap-3 border-2 px-6 py-3.5 font-mono text-[11px] uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-40 disabled:pointer-events-none"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                ) : (
                  <span className="text-[11px] font-mono uppercase tracking-[0.22em] text-white/40">
                    Seleciona uma opção
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommercialAuditModal;
