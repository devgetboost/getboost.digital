import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, XCircle, MailCheck, Grid2x2, Minus, Circle,
  Search, Zap, Target, Bot, Globe, RotateCcw, Sparkles,
} from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ACCENT = '#ff4000';

type Check = { id: string; label: string; pass: boolean; hint?: string };
type Pillar = { key: string; label: string; score: number; weight: number; checks: Check[] };
type AuditResult = {
  url: string;
  overallScore: number;
  rating: string;
  pillars: Pillar[];
  priorities: (Check & { pillar: string; weight: number })[];
  meta: { title: string; metaDesc: string; loadMs: number; statusCode: number; isHttps: boolean };
};

const PILLAR_ICONS: Record<string, React.ElementType> = {
  website: Globe, seo: Search, tracking: Zap, conversion: Target, aiVisibility: Bot,
};

const pillarsInfo = [
  { eyebrow: 'Fundação Técnica', title: 'Website & Experiência', tags: ['HTTPS', 'CTAs', 'Mobile-first', 'Velocidade'], body: 'Avaliamos a base do teu site — segurança, navegação, contactos visíveis, CTAs e tempo de resposta. Se a fundação falha, todo o resto perde eficácia.' },
  { eyebrow: 'Descoberta Orgânica', title: 'SEO On-Page & Técnico', tags: ['Title/Meta', 'H1/H2', 'Sitemap', 'Robots', 'Canonical'], body: 'Verificamos títulos, meta descrições, hierarquia de headings, robots, sitemap, canonical e alt em imagens. As bases que decidem se apareces no Google.' },
  { eyebrow: 'Medição', title: 'Tracking & Consentimento', tags: ['GA4', 'GTM', 'Meta Pixel', 'CMP', 'Consent Mode v2'], body: 'Sem medição, sem otimização. Detetamos GTM, GA4, Meta Pixel, banner de cookies e Google Consent Mode v2 — a stack mínima para operar em conformidade RGPD.' },
  { eyebrow: 'Geração de Negócio', title: 'Conversão & Prova Social', tags: ['Formulários', 'WhatsApp', 'Testemunhos', 'Pricing'], body: 'Analisamos formulários, WhatsApp, testemunhos, prova social e transparência de preços. Os elementos que transformam visitas em conversas comerciais.' },
  { eyebrow: 'Nova Camada', title: 'Visibilidade em IA (LLM Ready)', tags: ['Schema.org', 'FAQPage', 'Breadcrumbs', '/llms.txt'], body: 'Os LLMs (ChatGPT, Gemini, Copilot) escolhem quem citar. Verificamos schema Organization, FAQ, Service, breadcrumbs, Open Graph e ficheiro /llms.txt para acelerar visibilidade em IA.' },
];

const scoreColor = (n: number) =>
  n >= 80 ? 'text-emerald-400' : n >= 60 ? 'text-yellow-400' : n >= 40 ? 'text-orange-400' : 'text-red-400';

const ScoreDial = ({ score, size = 160 }: { score: number; size?: number }) => {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : score >= 40 ? ACCENT : '#ef4444';
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black" style={{ color }}>{score}</span>
        <span className="text-[10px] uppercase tracking-widest text-white/50">/100</span>
      </div>
    </div>
  );
};

type UIState = 'form' | 'sent' | 'running' | 'result';
type ProgressStage = 'queued' | 'analyzing' | 'scoring' | 'done';

const STAGES: { key: ProgressStage; label: string; hint: string }[] = [
  { key: 'queued', label: 'Em fila', hint: 'Autorizado. A preparar o motor de análise.' },
  { key: 'analyzing', label: 'A analisar', hint: 'A percorrer o teu site, SEO, tracking e sinais de conversão.' },
  { key: 'scoring', label: 'A calcular pontuação', hint: 'A ponderar pilares e a priorizar correções.' },
  { key: 'done', label: 'Concluído', hint: 'Relatório pronto. A abrir os resultados.' },
];

const DigitalAudit = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenParam = params.get('token');
  const emailParam = params.get('email');
  const urlParam = params.get('url');

  const [state, setState] = useState<UIState>(tokenParam && emailParam && urlParam ? 'running' : 'form');
  const [url, setUrl] = useState(urlParam || '');
  const [company, setCompany] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(emailParam || '');
  const [sector, setSector] = useState('');
  const [goal, setGoal] = useState('');
  const [loading, setLoading] = useState(false);
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [stage, setStage] = useState<ProgressStage>('queued');

  const runAudit = useMemo(() => async (u: string, e: string, t: string) => {
    setLoading(true);
    setState('running');
    setStage('queued');
    // Simulated progression so the user sees feedback while the audit runs
    const t1 = window.setTimeout(() => setStage('analyzing'), 900);
    const t2 = window.setTimeout(() => setStage('scoring'), 6000);
    try {
      const { data, error } = await supabase.functions.invoke('digital-audit', {
        body: { url: u, email: e, token: t },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setResult(data as AuditResult);
      try {
        sessionStorage.setItem('digital-audit-result', JSON.stringify(data));
        sessionStorage.removeItem('digital-audit-progress');
      } catch { /* noop */ }
      setStage('done');
      setState('result');
      window.setTimeout(() => navigate('/tools/digital-audit/resultados'), 700);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao correr a auditoria.');
      setState('form');
    } finally {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (tokenParam && emailParam && urlParam) {
      try {
        sessionStorage.setItem(
          'digital-audit-progress',
          JSON.stringify({ url: urlParam, email: emailParam, token: tokenParam, startedAt: Date.now() }),
        );
      } catch { /* noop */ }
      runAudit(urlParam, emailParam, tokenParam);
    }
  }, [tokenParam, emailParam, urlParam, runAudit]);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url || !email || !company) {
      toast.error('Preenche URL, empresa e email.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-request-access', {
        body: {
          url, email: email.trim(), name, company, sector, goal,
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setState('sent');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao pedir a auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setState('form');
    window.history.replaceState({}, '', '/tools/digital-audit');
  };

  return (
    <Layout>
      <SEO
        title="Auditoria Digital 360º — Website, SEO, Tracking, Conversão & IA | Getboost"
        description="Diagnóstico automático em 5 pilares: Website, SEO, Tracking, Conversão e Visibilidade em IA. Recebe pontuação global e prioridades acionáveis por email."
        canonical="/tools/digital-audit"
      />

      {/* HERO — dark manifesto */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div aria-hidden className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 70% 40%, black 20%, transparent 70%)',
          }} />
        <div aria-hidden className="absolute -right-40 top-1/2 h-[720px] w-[720px] -translate-y-1/2 rounded-full blur-3xl opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(255,64,0,0.55) 0%, rgba(10,6,3,0) 65%)' }} />
        <motion.div aria-hidden
          initial={{ y: '-100%' }} animate={{ y: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="pointer-events-none absolute inset-x-0 h-40 bg-gradient-to-b from-transparent via-[#ff4000]/10 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-[11px] font-mono uppercase tracking-[0.22em]"
            style={{ borderColor: `${ACCENT}66`, color: '#ffb494' }}>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
            Auditoria Digital 360º · 5 Pilares · IA Ready
          </motion.div>

          <div className="mt-8 grid lg:grid-cols-[1.1fr_1fr] gap-12 items-start">
            {/* LEFT: manifesto */}
            <div>
              <h1 className="font-black leading-[0.95] tracking-tight text-[clamp(2.5rem,6.5vw,5.5rem)]">
                <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="block">
                  O teu site tem um
                </motion.span>
                <motion.span initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }} className="block"
                  style={{ color: ACCENT, textShadow: '0 0 40px rgba(255,64,0,0.4)' }}>
                  problema invisível.
                </motion.span>
              </h1>
              <motion.div initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
                className="mt-8 h-px w-40 origin-left" style={{ background: `${ACCENT}b3` }} />
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 max-w-xl text-lg leading-relaxed text-white/75">
                Descobre em segundos porque é que o teu website atrai visitas, mas não gera clientes.
                Auditoria automática em <strong className="text-white">5 pilares críticos</strong> — Website, SEO, Tracking,
                Conversão e Visibilidade em IA. Relatório gratuito no teu email.
              </motion.p>

              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 border-t border-white/10 pt-8">
                {[
                  { k: '5', v: 'Pilares analisados' },
                  { k: '<2 min', v: 'Diagnóstico completo' },
                  { k: '60+', v: 'Verificações técnicas' },
                  { k: '100%', v: 'Grátis, sem cartão' },
                ].map((s) => (
                  <div key={s.k}>
                    <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: ACCENT }}>{s.k}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">{s.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: form / sent / running / result-preview */}
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="relative rounded-2xl border p-8 backdrop-blur-sm"
              style={{ borderColor: `${ACCENT}55`, background: 'linear-gradient(180deg, rgba(255,64,0,0.05) 0%, rgba(10,6,3,0.6) 100%)' }}>

              {state === 'form' && (
                <form onSubmit={submitForm} className="space-y-4">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: '#ffb494' }}>
                    <Sparkles className="w-3.5 h-3.5" style={{ color: ACCENT }} /> Pedir auditoria
                  </div>
                  <h2 className="text-2xl font-bold">Recebe o teu diagnóstico.</h2>
                  <p className="text-sm text-white/60 -mt-2">Confirmamos o teu email e libertamos o motor de análise.</p>

                  <div>
                    <Label htmlFor="url" className="text-white/80">URL do website *</Label>
                    <Input id="url" placeholder="exemplo.pt" value={url} onChange={(e) => setUrl(e.target.value)} required
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="name" className="text-white/80">Nome</Label>
                      <Input id="name" placeholder="João" value={name} onChange={(e) => setName(e.target.value)}
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-white/80">Empresa *</Label>
                      <Input id="company" placeholder="Lda." value={company} onChange={(e) => setCompany(e.target.value)} required
                        className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white/80">Email *</Label>
                    <Input id="email" type="email" placeholder="voce@empresa.pt" value={email} onChange={(e) => setEmail(e.target.value)} required
                      className="bg-white/5 border-white/15 text-white placeholder:text-white/30" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/80">Setor</Label>
                      <Select value={sector} onValueChange={setSector}>
                        <SelectTrigger className="bg-white/5 border-white/15 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {['Serviços', 'E-commerce', 'SaaS', 'Restauração', 'Saúde', 'Educação', 'Indústria', 'Outro'].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/80">Objetivo</Label>
                      <Select value={goal} onValueChange={setGoal}>
                        <SelectTrigger className="bg-white/5 border-white/15 text-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {['Gerar leads', 'Vender online', 'Aumentar tráfego', 'Melhorar SEO', 'Automatizar', 'Rebrand'].map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="group w-full inline-flex items-center justify-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all hover:!text-white disabled:opacity-50"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    {loading ? 'A enviar…' : 'Enviar-me o link de acesso'}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <p className="text-[11px] text-center text-white/50">
                    Recebes um email para confirmar. O link corre a auditoria automaticamente.
                  </p>
                </form>
              )}

              {state === 'sent' && (
                <div className="py-8 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-6"
                    style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}66` }}>
                    <MailCheck className="w-8 h-8" style={{ color: ACCENT }} />
                  </div>
                  <h2 className="text-2xl font-bold">Verifica o teu email.</h2>
                  <p className="mt-3 text-white/70 max-w-sm mx-auto">
                    Enviámos um link para <strong className="text-white">{email}</strong>.
                    Clica no botão do email para confirmar e abrir a auditoria completa.
                  </p>
                  <p className="mt-6 text-[11px] text-white/40">Não vês o email? Verifica spam/promoções. Link válido 72h.</p>
                  <button onClick={() => setState('form')} className="mt-6 text-xs font-mono uppercase tracking-widest text-white/60 hover:text-white transition-colors">
                    ← Voltar ao formulário
                  </button>
                </div>
              )}

              {state === 'running' && (
                <div className="py-8">
                  <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: '#ffb494' }}>
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: ACCENT }} />
                    Auditoria em execução
                  </div>
                  <h2 className="mt-3 text-2xl font-bold">A analisar {urlParam || url}</h2>
                  <p className="mt-2 text-white/60 text-sm">
                    Podes deixar esta janela aberta — quando terminar, o relatório abre automaticamente.
                  </p>

                  <ol className="mt-8 space-y-4">
                    {STAGES.map((s, i) => {
                      const currentIdx = STAGES.findIndex((x) => x.key === stage);
                      const isDone = i < currentIdx;
                      const isActive = i === currentIdx;
                      return (
                        <li key={s.key} className="flex items-start gap-4">
                          <div className="relative flex-shrink-0 mt-0.5">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-all"
                              style={{
                                background: isDone ? ACCENT : isActive ? `${ACCENT}22` : 'rgba(255,255,255,0.06)',
                                color: isDone ? '#fff' : isActive ? ACCENT : 'rgba(255,255,255,0.4)',
                                border: `1px solid ${isDone || isActive ? ACCENT : 'rgba(255,255,255,0.12)'}`,
                              }}>
                              {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : isActive
                                ? <span className="h-2 w-2 rounded-full animate-pulse" style={{ background: ACCENT }} />
                                : i + 1}
                            </div>
                            {i < STAGES.length - 1 && (
                              <div className="absolute left-1/2 top-7 -translate-x-1/2 w-px h-6"
                                style={{ background: isDone ? ACCENT : 'rgba(255,255,255,0.1)' }} />
                            )}
                          </div>
                          <div className="pb-2">
                            <div className={`text-sm font-bold ${isActive ? 'text-white' : isDone ? 'text-white/70' : 'text-white/40'}`}>
                              {s.label}
                            </div>
                            <div className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-white/40'}`}>
                              {s.hint}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="mt-8 h-1 w-full rounded-full bg-white/5 overflow-hidden">
                    <div className="h-full transition-all duration-700"
                      style={{
                        width: `${((STAGES.findIndex((x) => x.key === stage) + 1) / STAGES.length) * 100}%`,
                        background: ACCENT,
                      }} />
                  </div>
                </div>
              )}

              {state === 'result' && result && (
                <div className="text-center py-6">
                  <ScoreDial score={result.overallScore} />
                  <div className="mt-4 text-xs uppercase tracking-widest text-white/50">Pontuação Global</div>
                  <div className={`mt-1 text-2xl font-black ${scoreColor(result.overallScore)}`}>{result.rating}</div>
                  <a href={result.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm break-all"
                    style={{ color: ACCENT }}>{result.url}</a>
                  <button onClick={reset}
                    className="mt-6 inline-flex items-center gap-2 border px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.24em] text-white/70 hover:text-white transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                    <RotateCcw className="w-3.5 h-3.5" /> Nova auditoria
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* RESULT DETAIL (when we have it) */}
      {state === 'result' && result && (
        <section className="bg-[#0a0603] text-white py-20 md:py-28 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {result.pillars.map((p) => {
                const Icon = PILLAR_ICONS[p.key] || Globe;
                return (
                  <div key={p.key} className="rounded-xl border border-white/10 bg-white/[0.02] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <Icon className="w-5 h-5" style={{ color: ACCENT }} />
                      <span className="text-[10px] font-mono font-bold uppercase text-white/50">{p.weight}%</span>
                    </div>
                    <div className="text-sm font-bold">{p.label}</div>
                    <div className={`text-3xl font-black mt-1 ${scoreColor(p.score)}`}>
                      {p.score}<span className="text-sm text-white/40">/100</span>
                    </div>
                    <ul className="mt-4 space-y-1.5 text-xs">
                      {p.checks.slice(0, 5).map((c) => (
                        <li key={c.id} className="flex items-start gap-1.5">
                          {c.pass
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                            : <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />}
                          <span className={c.pass ? 'text-white/50' : 'text-white/90'}>{c.label}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>

            {result.priorities.length > 0 && (
              <div className="mt-12 rounded-2xl border p-8 md:p-10"
                style={{ borderColor: `${ACCENT}55`, background: `linear-gradient(180deg, ${ACCENT}12 0%, rgba(10,6,3,0.5) 100%)` }}>
                <div className="text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: '#ffb494' }}>
                  Top prioridades
                </div>
                <h3 className="mt-2 text-2xl md:text-3xl font-black">As correcções com maior impacto na tua nota.</h3>
                <div className="mt-8 grid md:grid-cols-2 gap-4">
                  {result.priorities.map((p, i) => (
                    <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                      <div className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: ACCENT }}>{p.pillar}</div>
                      <div className="text-sm font-bold mt-1">{p.label}</div>
                      {p.hint && <div className="text-xs text-white/60 mt-1.5">{p.hint}</div>}
                    </div>
                  ))}
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/booking"
                    className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all"
                    style={{ borderColor: ACCENT, color: '#ffb494' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    Agendar sessão estratégica
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link to="/solucoes"
                    className="inline-flex items-center gap-2 px-2 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors">
                    Ver serviços
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* PILLARS EXPLAINED — accordion (only on form/sent) */}
      {state !== 'result' && (
        <section className="bg-[#0a0603] text-white py-24 md:py-32">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="max-w-3xl">
              <div className="text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: '#ffb494' }}>
                Metodologia · 5 Pilares
              </div>
              <h2 className="mt-4 text-4xl md:text-6xl font-black leading-[1.02] tracking-tight">
                5 áreas críticas. <span style={{ color: ACCENT }}>Uma única nota.</span>
              </h2>
              <p className="mt-6 text-white/70 text-lg">
                Cada pilar tem peso proporcional ao impacto real na geração de negócio.
                Somamos, ponderamos e devolvemos uma pontuação /100 accionável.
              </p>
            </div>

            <div className="mt-14 border-t border-white/10">
              {pillarsInfo.map((f, i) => {
                const isOpen = openIndex === i;
                return (
                  <div key={f.title} className="border-b border-white/10">
                    <button type="button" onClick={() => setOpenIndex(isOpen ? -1 : i)}
                      className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-white/[0.02]">
                      <div>
                        <div className="flex items-start gap-5">
                          <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                            {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                          </span>
                          <h3 className="text-2xl md:text-4xl font-bold leading-[1.05] tracking-tight">{f.title}</h3>
                        </div>
                        <div className="mt-6 ml-0 md:ml-10 flex flex-wrap gap-2.5">
                          {f.tags.map((tag) => (
                            <span key={tag} className="rounded-full border border-white/25 px-3.5 py-1.5 text-xs text-white/80">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-start justify-between gap-6">
                          <span className="font-mono text-[11px] uppercase tracking-[0.22em]"
                            style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.6)' }}>
                            {f.eyebrow}
                          </span>
                          <Minus className="h-6 w-6 shrink-0 transition-transform"
                            style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)', transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)' }} />
                        </div>
                        <AnimatePresence initial={false}>
                          {isOpen && (
                            <motion.p
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 20 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.35 }}
                              className="overflow-hidden text-sm md:text-base leading-relaxed text-white/70">
                              {f.body}
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]">
            Descobre o que trava o teu crescimento{' '}
            <span style={{ color: ACCENT }}>agora</span>.
          </motion.h2>
          <p className="mt-8 text-white/70 max-w-2xl mx-auto">
            Auditoria imediata, relatório no teu email e prioridades ordenadas por impacto.
          </p>
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setState('form'); }}
            className="group mt-12 inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all"
            style={{ borderColor: ACCENT, color: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT, e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = ACCENT)}>
            Pedir a minha auditoria
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </Layout>
  );
};

export default DigitalAudit;
