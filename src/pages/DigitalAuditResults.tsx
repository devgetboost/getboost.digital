import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, XCircle, Globe, Search, Zap, Target, Bot,
  RotateCcw, AlertTriangle, Lightbulb, Download, TrendingUp, Clock, Flame,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';

const ACCENT = '#ff4000';
const STORAGE_KEY = 'digital-audit-result';

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

const PILLAR_ACTIONS: Record<string, string> = {
  website: 'Corrigir a base do site: HTTPS, mobile, CTAs, contactos e performance.',
  seo: 'Reforçar SEO on-page: titles, meta, headings, sitemap e alt em imagens.',
  tracking: 'Instalar stack de medição: GTM, GA4, Meta Pixel, CMP e Consent Mode v2.',
  conversion: 'Ativar mecanismos de conversão: formulários, WhatsApp, testemunhos e pricing.',
  aiVisibility: 'Preparar o site para IA: schema Organization/FAQ, breadcrumbs e /llms.txt.',
};

// Per-check metadata: priority weight (higher = more critical) and effort in hours.
// Keys are `${pillarKey}:${checkId}`; if missing, sensible defaults apply.
const CHECK_META: Record<string, { impact: number; effort: number; action?: string }> = {
  // WEBSITE
  'website:https': { impact: 10, effort: 1, action: 'Instalar certificado SSL/TLS e forçar redirect 301 de HTTP → HTTPS.' },
  'website:nav': { impact: 6, effort: 2, action: 'Reorganizar menu principal com máx. 7 itens claros e link ativo destacado.' },
  'website:contact': { impact: 8, effort: 1, action: 'Adicionar telefone/email/morada no header e footer, com click-to-call em mobile.' },
  'website:cta': { impact: 9, effort: 2, action: 'Colocar CTA primário visível acima da dobra em todas as landing pages.' },
  'website:responsive': { impact: 9, effort: 4, action: 'Aplicar viewport meta e testar em 375/768/1440px; corrigir overflow horizontal.' },
  'website:speed': { impact: 8, effort: 6, action: 'Otimizar imagens (WebP), lazy-load, preload de fonts e ativar cache no CDN.' },
  // SEO
  'seo:title': { impact: 9, effort: 1, action: 'Reescrever <title> com 40–60 caracteres e keyword primária no início.' },
  'seo:meta': { impact: 7, effort: 1, action: 'Escrever meta description 120–155 caracteres com proposta de valor + CTA.' },
  'seo:h1': { impact: 8, effort: 1, action: 'Garantir um único H1 por página com a keyword principal.' },
  'seo:h2': { impact: 5, effort: 1, action: 'Estruturar o conteúdo em H2/H3 hierárquicos e escaneáveis.' },
  'seo:robots': { impact: 4, effort: 1, action: 'Publicar /robots.txt permitindo crawl e referenciando o sitemap.' },
  'seo:sitemap': { impact: 6, effort: 2, action: 'Gerar sitemap.xml, submeter no Google Search Console e ligar no robots.txt.' },
  'seo:canonical': { impact: 6, effort: 1, action: 'Adicionar <link rel="canonical"> apontando à URL absoluta e limpa.' },
  'seo:alt': { impact: 5, effort: 2, action: 'Preencher alt descritivo em ≥ 80% das imagens (skip decorativas).' },
  'seo:og': { impact: 4, effort: 1, action: 'Definir og:title, og:description e og:image (1200×630) em todas as páginas.' },
  // TRACKING
  'tracking:gtm': { impact: 8, effort: 2, action: 'Instalar contentor GTM no <head> e migrar todas as tags para lá.' },
  'tracking:ga4': { impact: 9, effort: 1, action: 'Criar propriedade GA4, disparar via GTM e configurar conversões-chave.' },
  'tracking:pixel': { impact: 6, effort: 2, action: 'Instalar Meta Pixel + eventos ViewContent, Lead e Purchase.' },
  'tracking:cmp': { impact: 9, effort: 3, action: 'Instalar CMP (Cookiebot/Iubenda) com opt-in explícito e categorias.' },
  'tracking:consent-mode': { impact: 7, effort: 2, action: 'Ativar Google Consent Mode v2 com defaults denied antes das tags.' },
  // CONVERSION
  'conversion:form': { impact: 9, effort: 3, action: 'Publicar formulário curto (nome, email, mensagem) com anti-spam.' },
  'conversion:whatsapp': { impact: 7, effort: 1, action: 'Adicionar botão flutuante WhatsApp com mensagem pré-preenchida.' },
  'conversion:testimonial': { impact: 6, effort: 3, action: 'Recolher e publicar 3–6 testemunhos com nome, cargo e foto.' },
  'conversion:social-proof': { impact: 5, effort: 2, action: 'Mostrar números (clientes, anos, projetos) e logos em barra dedicada.' },
  'conversion:newsletter': { impact: 4, effort: 3, action: 'Criar captura de email com lead magnet + sequência de boas-vindas.' },
  'conversion:pricing': { impact: 6, effort: 4, action: 'Publicar página de preços/planos com faixas claras e CTA.' },
  // AI VISIBILITY
  'aiVisibility:ld-org': { impact: 7, effort: 2, action: 'Adicionar JSON-LD Organization/LocalBusiness com NAP, logo e sameAs.' },
  'aiVisibility:ld-faq': { impact: 6, effort: 3, action: 'Publicar FAQ com schema FAQPage cobrindo 6–10 dúvidas reais.' },
  'aiVisibility:ld-service': { impact: 6, effort: 3, action: 'Marcar cada serviço com JSON-LD Service (name, description, provider).' },
  'aiVisibility:ld-breadcrumb': { impact: 4, effort: 2, action: 'Adicionar JSON-LD BreadcrumbList em páginas internas.' },
  'aiVisibility:og': { impact: 3, effort: 1, action: 'Completar Open Graph e Twitter Card em todas as páginas partilháveis.' },
  'aiVisibility:llms': { impact: 5, effort: 1, action: 'Publicar /llms.txt com resumo do site, links-chave e política para LLMs.' },
};

type Priority = 'high' | 'medium' | 'low';

const priorityFor = (impact: number, pillarWeight: number, isTopPriority: boolean): Priority => {
  const score = impact * 2 + pillarWeight / 5 + (isTopPriority ? 8 : 0);
  if (score >= 24) return 'high';
  if (score >= 16) return 'medium';
  return 'low';
};

const effortLabel = (hours: number) =>
  hours <= 1 ? '≤ 1 h' : hours <= 3 ? '1–3 h' : hours <= 6 ? '3–6 h' : '1 dia+';

const PRIORITY_STYLES: Record<Priority, { label: string; bg: string; color: string; border: string; icon: React.ElementType }> = {
  high:   { label: 'Alta',  bg: 'rgba(239,68,68,0.15)',  color: '#fca5a5', border: 'rgba(239,68,68,0.55)', icon: Flame },
  medium: { label: 'Média', bg: 'rgba(234,179,8,0.15)',  color: '#fde68a', border: 'rgba(234,179,8,0.55)', icon: TrendingUp },
  low:    { label: 'Baixa', bg: 'rgba(148,163,184,0.15)', color: '#cbd5e1', border: 'rgba(148,163,184,0.45)', icon: Clock },
};

const scoreColor = (n: number) =>
  n >= 80 ? 'text-emerald-400' : n >= 60 ? 'text-yellow-400' : n >= 40 ? 'text-orange-400' : 'text-red-400';

const scoreHex = (n: number) =>
  n >= 80 ? '#22c55e' : n >= 60 ? '#eab308' : n >= 40 ? ACCENT : '#ef4444';

const ScoreDial = ({ score, size = 220 }: { score: number; size?: number }) => {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (score / 100) * c;
  const color = scoreHex(score);
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 12px ${color}66)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-7xl font-black" style={{ color }}>{score}</span>
        <span className="text-xs uppercase tracking-widest text-white/50 mt-1">/100</span>
      </div>
    </div>
  );
};

const DigitalAuditResults = () => {
  const navigate = useNavigate();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setResult(JSON.parse(raw) as AuditResult);
    } catch { /* noop */ }
  }, []);

  const checklistKey = useMemo(
    () => (result ? `digital-audit-checklist:${result.url}` : null),
    [result],
  );

  useEffect(() => {
    if (!checklistKey) return;
    try {
      const raw = localStorage.getItem(checklistKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch { /* noop */ }
  }, [checklistKey]);

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      if (checklistKey) {
        try { localStorage.setItem(checklistKey, JSON.stringify(next)); } catch { /* noop */ }
      }
      return next;
    });
  };

  const priorityIds = useMemo(() => {
    if (!result) return new Set<string>();
    const labelToKey = new Map(result.pillars.map((p) => [p.label, p.key]));
    return new Set(
      (result.priorities || []).map((p) => `${labelToKey.get(p.pillar) || p.pillar}:${p.id}`),
    );
  }, [result]);

  const summary = useMemo(() => {
    if (!result) return null;
    const failed = result.pillars.reduce((acc, p) => acc + p.checks.filter((c) => !c.pass).length, 0);
    const total = result.pillars.reduce((acc, p) => acc + p.checks.length, 0);
    const weakest = [...result.pillars].sort((a, b) => a.score - b.score)[0];
    const strongest = [...result.pillars].sort((a, b) => b.score - a.score)[0];
    const doneCount = Object.values(checked).filter(Boolean).length;
    return { failed, total, weakest, strongest, doneCount };
  }, [result, checked]);

  if (!result) {
    return (
      <Layout>
        <SEO title="Resultados — Auditoria Digital 360º | Getboost" canonical="/tools/digital-audit/resultados" />
        <section className="bg-[#0a0603] text-white min-h-[70vh] flex items-center">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-6" style={{ color: ACCENT }} />
            <h1 className="text-3xl md:text-5xl font-black">Sem resultados guardados.</h1>
            <p className="mt-6 text-white/70">
              Não encontrámos uma auditoria recente nesta sessão. Executa uma nova auditoria para veres o relatório completo.
            </p>
            <button onClick={() => navigate('/tools/digital-audit')}
              className="group mt-10 inline-flex items-center gap-3 border-2 px-8 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT, e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = ACCENT)}>
              Iniciar auditoria <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO
        title={`Resultado ${result.overallScore}/100 — Auditoria Digital 360º | Getboost`}
        description={`Diagnóstico completo de ${result.url}: pontuação global ${result.overallScore}/100, prioridades acionáveis por pilar e roadmap de correções.`}
        canonical="/tools/digital-audit/resultados"
      />

      {/* HERO — score summary */}
      <section className="relative overflow-hidden bg-[#0a0603] text-white">
        <div aria-hidden className="absolute inset-0 opacity-[0.15]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,64,0,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,64,0,0.35) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)',
          }} />
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-20 md:py-28">
          <div className="text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: '#ffb494' }}>
            Relatório · Auditoria Digital 360º
          </div>
          <div className="mt-6 grid lg:grid-cols-[1fr_auto] gap-12 items-center">
            <div>
              <h1 className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,5.5vw,4.5rem)]">
                Pontuação global{' '}
                <span style={{ color: scoreHex(result.overallScore) }}>{result.rating}</span>.
              </h1>
              <p className="mt-6 text-white/70 max-w-xl">
                Análise de <a href={result.url} target="_blank" rel="noreferrer" className="underline" style={{ color: ACCENT }}>{result.url}</a>{' '}
                em 5 pilares críticos. Abaixo tens o resumo executivo e as recomendações acionáveis, pilar a pilar.
              </p>

              {summary && (
                <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6 border-t border-white/10 pt-8 max-w-2xl">
                  <div>
                    <div className="font-mono text-2xl md:text-3xl font-bold" style={{ color: ACCENT }}>{summary.total - summary.failed}<span className="text-white/40">/{summary.total}</span></div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">Verificações OK</div>
                  </div>
                  <div>
                    <div className="font-mono text-2xl md:text-3xl font-bold text-red-400">
                      {summary.failed - summary.doneCount}
                      {summary.doneCount > 0 && <span className="text-sm text-white/40"> / {summary.failed}</span>}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">
                      {summary.doneCount > 0 ? `A corrigir · ${summary.doneCount} feito` : 'A corrigir'}
                    </div>
                  </div>
                  <div>
                    <div className="font-mono text-sm md:text-base font-bold text-emerald-400 truncate">{summary.strongest.label}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">Pilar mais forte</div>
                  </div>
                  <div>
                    <div className="font-mono text-sm md:text-base font-bold text-red-400 truncate">{summary.weakest.label}</div>
                    <div className="mt-1 text-[11px] uppercase tracking-widest text-white/50">Pilar mais fraco</div>
                  </div>
                </div>
              )}

              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/booking"
                  className="group inline-flex items-center gap-3 border-2 px-7 py-4 font-mono text-xs uppercase tracking-[0.24em] transition-all"
                  style={{ borderColor: ACCENT, color: '#ffb494' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                  Agendar sessão estratégica <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <button onClick={() => window.print()}
                  className="inline-flex items-center gap-2 border px-5 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/70 hover:text-white transition-colors"
                  style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Download className="w-3.5 h-3.5" /> Guardar / imprimir
                </button>
                <Link to="/tools/digital-audit"
                  className="inline-flex items-center gap-2 px-3 py-4 font-mono text-xs uppercase tracking-[0.24em] text-white/60 hover:text-white transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Nova auditoria
                </Link>
              </div>
            </div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7 }}
              className="justify-self-center">
              <ScoreDial score={result.overallScore} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* PILLAR CARDS */}
      <section className="bg-[#0a0603] text-white py-16 md:py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">
            Pilar a pilar. <span style={{ color: ACCENT }}>Acionável.</span>
          </h2>
          <p className="mt-4 text-white/70 max-w-2xl">
            Cada pilar tem a pontuação individual, o que está a funcionar e as correções recomendadas por ordem de impacto.
          </p>

          <div className="mt-12 space-y-8">
            {result.pillars.map((p) => {
              const Icon = PILLAR_ICONS[p.key] || Globe;
              const fails = p.checks.filter((c) => !c.pass);
              const passes = p.checks.filter((c) => c.pass);
              return (
                <motion.article key={p.key}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
                  {/* Pillar header */}
                  <header className="p-6 md:p-8 border-b border-white/10 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ background: `${ACCENT}18`, border: `1px solid ${ACCENT}44` }}>
                      <Icon className="w-6 h-6" style={{ color: ACCENT }} />
                    </div>
                    <div>
                      <div className="text-[10px] font-mono uppercase tracking-widest text-white/50">Peso {p.weight}% · {passes.length}/{p.checks.length} OK</div>
                      <h3 className="text-xl md:text-2xl font-bold mt-1">{p.label}</h3>
                      <p className="text-sm text-white/60 mt-2">{PILLAR_ACTIONS[p.key]}</p>
                    </div>
                    <div className="justify-self-start md:justify-self-end text-center">
                      <div className={`text-5xl font-black ${scoreColor(p.score)}`}>{p.score}<span className="text-lg text-white/40">/100</span></div>
                      <div className="mt-2 h-1.5 w-40 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full transition-all duration-1000" style={{ width: `${p.score}%`, background: scoreHex(p.score) }} />
                      </div>
                    </div>
                  </header>

                  {/* Recommendations */}
                  <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
                    <div className="p-6 md:p-8">
                      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] mb-4"
                        style={{ color: ACCENT }}>
                        <Lightbulb className="w-3.5 h-3.5" /> Recomendações acionáveis
                      </div>
                      {fails.length === 0 ? (
                        <div className="text-sm text-emerald-400 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Nenhuma correção crítica neste pilar.
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {fails
                            .map((c) => {
                              const meta = CHECK_META[`${p.key}:${c.id}`] ?? { impact: 5, effort: 2 };
                              const isTop = priorityIds.has(`${p.key}:${c.id}`);
                              return { c, meta, isTop, priority: priorityFor(meta.impact, p.weight, isTop) };
                            })
                            .sort((a, b) => {
                              const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
                              return order[a.priority] - order[b.priority] || b.meta.impact - a.meta.impact;
                            })
                            .map(({ c, meta, priority, isTop }) => {
                              const key = `${p.key}:${c.id}`;
                              const isDone = !!checked[key];
                              const P = PRIORITY_STYLES[priority];
                              const PIcon = P.icon;
                              return (
                                <li key={c.id}
                                  className={`rounded-lg border p-4 transition-all ${isDone ? 'opacity-50' : ''}`}
                                  style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
                                  <div className="flex items-start gap-3">
                                    <Checkbox checked={isDone} onCheckedChange={() => toggle(key)}
                                      className="mt-0.5 border-white/30 data-[state=checked]:bg-[#ff4000] data-[state=checked]:border-[#ff4000]" />
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-semibold ${isDone ? 'line-through text-white/50' : 'text-white'}`}>
                                        {c.label}
                                      </div>
                                      <div className="text-xs text-white/70 mt-1.5 leading-relaxed">
                                        {meta.action || c.hint || 'Sem ação específica.'}
                                      </div>
                                      <div className="flex flex-wrap items-center gap-2 mt-3">
                                        <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest"
                                          style={{ background: P.bg, color: P.color, borderColor: P.border }}>
                                          <PIcon className="w-3 h-3" /> {P.label}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-mono text-white/70">
                                          <Clock className="w-3 h-3" /> {effortLabel(meta.effort)}
                                        </span>
                                        {isTop && (
                                          <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: ACCENT }}>
                                            · Top prioridade
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                        </ul>
                      )}
                    </div>
                    <div className="p-6 md:p-8">
                      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.22em] mb-4 text-emerald-400">
                        <TrendingUp className="w-3.5 h-3.5" /> Já está bem
                      </div>
                      {passes.length === 0 ? (
                        <div className="text-sm text-white/50">Sem verificações positivas neste pilar.</div>
                      ) : (
                        <ul className="space-y-2.5">
                          {passes.map((c) => (
                            <li key={c.id} className="flex items-start gap-2 text-sm text-white/70">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <span>{c.label}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* TOP PRIORITIES */}
      {result.priorities.length > 0 && (
        <section className="bg-[#0a0603] text-white py-16 md:py-24 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <div className="rounded-2xl border p-8 md:p-12"
              style={{ borderColor: `${ACCENT}55`, background: `linear-gradient(180deg, ${ACCENT}12 0%, rgba(10,6,3,0.5) 100%)` }}>
              <div className="text-[11px] font-mono uppercase tracking-[0.22em]" style={{ color: '#ffb494' }}>
                Top prioridades · Maior impacto na nota
              </div>
              <h3 className="mt-3 text-2xl md:text-4xl font-black">Começa por aqui.</h3>
              <div className="mt-8 grid md:grid-cols-2 gap-4">
                {result.priorities.map((p, i) => (
                  <div key={i} className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: ACCENT }}>{p.pillar}</div>
                      <div className="text-[10px] font-mono text-white/40">Peso {p.weight}%</div>
                    </div>
                    <div className="text-sm font-bold mt-2 flex items-start gap-2">
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{p.label}</span>
                    </div>
                    {p.hint && <div className="text-xs text-white/60 mt-2 ml-6">{p.hint}</div>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]">
            Quer resolver isto <span style={{ color: ACCENT }}>connosco</span>?
          </h2>
          <p className="mt-8 text-white/70 max-w-2xl mx-auto">
            Transformamos este diagnóstico num plano de ação com prazos, responsáveis e KPIs.
          </p>
          <Link to="/booking"
            className="group mt-12 inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all"
            style={{ borderColor: ACCENT, color: ACCENT }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT, e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent', e.currentTarget.style.color = ACCENT)}>
            Agendar sessão estratégica <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default DigitalAuditResults;
