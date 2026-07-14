import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ArrowRight, Zap, Shield, Globe, Smartphone, Tag, Lock, Share2, Cookie,
  Clock, Image as ImageIcon, Link2, AlertTriangle, AlertCircle, CheckCircle2,
  Download, RotateCcw, Grid2x2, Minus, Circle, Code, FileText,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import { Link as RouterLink } from 'react-router-dom';

const ACCENT = '#ff4000';

interface SEOResult {
  url: string;
  overallScore: number;
  rating: string;
  scores: { onPage: number; technical: number; performance: number; security: number };
  metrics: Record<string, { value: number; label: string }>;
  details: { pageLoadTime: string; imageOptimization: string; internalLinks: number; sslStatus: string };
  issues: { critical: { title: string; description: string }[]; warnings: { title: string; description: string }[] };
  passed: string[];
}

const manifestoLines = ['Deixa de adivinhar.', 'Passa a decidir com dados.'];

type Pillar = {
  eyebrow: string;
  title: string;
  tags: string[];
  body: string;
};

const pillars: Pillar[] = [
  {
    eyebrow: 'SEO Técnico',
    title: 'Fundações que o Google consegue ler',
    tags: ['Crawlability', 'robots.txt & sitemap', 'Canonical & hreflang', 'Dados estruturados'],
    body: 'Verificamos se os motores de busca conseguem descobrir, rastrear e indexar cada página do teu site. Analisamos redirecionamentos, códigos HTTP, sitemap, robots e schema — os detalhes técnicos que separam sites que rankeiam dos que ficam invisíveis.',
  },
  {
    eyebrow: 'SEO On-Page',
    title: 'Conteúdo alinhado com a intenção real',
    tags: ['Title & Meta', 'Hierarquia de H1–H3', 'Densidade & semântica', 'Links internos'],
    body: 'Auditamos titles, meta descriptions, cabeçalhos e estrutura de conteúdo. Detetamos canibalização entre páginas, oportunidades de linking interno e blocos de conteúdo que precisam de reescrita para responderem à query real do utilizador.',
  },
  {
    eyebrow: 'Core Web Vitals',
    title: 'Performance que não custa conversões',
    tags: ['LCP', 'INP', 'CLS', 'Otimização de imagens'],
    body: 'Cada 100 ms extra de carregamento custa vendas. Medimos LCP, INP e CLS, identificamos assets pesados, JavaScript bloqueante e imagens sem lazy-loading — e dizemos exatamente o que remover, comprimir ou adiar.',
  },
  {
    eyebrow: 'Segurança & Confiança',
    title: 'Sinais que Google e utilizadores premeiam',
    tags: ['SSL válido', 'HTTPS forçado', 'Headers de segurança', 'Cookie consent'],
    body: 'HTTPS, HSTS, política de cookies e cabeçalhos como CSP e X-Frame-Options são fatores diretos de confiança e ranking. Confirmamos que o teu site cumpre RGPD e as boas práticas modernas de segurança web.',
  },
  {
    eyebrow: 'Mobile & UX',
    title: 'Mobile-first, sempre',
    tags: ['Responsividade real', 'Tap targets', 'Viewport correto', 'Legibilidade'],
    body: 'O Google indexa a versão mobile do teu site — se ela falha, todo o resto falha. Testamos viewport, tamanho de fontes, áreas de toque e comportamento em ecrãs pequenos, com recomendações práticas por breakpoint.',
  },
];

const metricIcons: Record<string, React.ElementType> = {
  pageSpeed: Zap,
  mobileOptimization: Smartphone,
  metaTags: Tag,
  sslCertificate: Lock,
  socialTags: Share2,
  cookieConsent: Cookie,
};

const detailIcons = [
  { key: 'pageLoadTime', icon: Clock, label: 'Velocidade da Página', sub: 'Quão rápido a tua página carrega' },
  { key: 'imageOptimization', icon: ImageIcon, label: 'Otimização de Imagens', sub: 'Tags alt e compressão' },
  { key: 'internalLinks', icon: Link2, label: 'Links Internos', sub: 'Estrutura de linking interno' },
  { key: 'sslStatus', icon: Lock, label: 'Certificado SSL', sub: 'Segurança HTTPS' },
];

const ScoreCircle = ({ score, size = 80, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#eab308' :
    score >= 40 ? ACCENT : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ color, fontSize: size * 0.24 }}>
        {score}
      </span>
    </div>
  );
};

const MetricBar = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => {
  const color = value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <Icon className="h-4 w-4 text-white/50 flex-shrink-0" />
      <span className="text-sm text-white/80 flex-1">{label}</span>
      <span className="text-sm font-semibold text-white w-10 text-right">{value}</span>
      <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
};

const SEOAnalyzer = () => {
  const { i18n } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number>(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SEOResult | null>(null);
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !url.trim()) {
      toast.error('Preenche todos os campos obrigatórios.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Por favor insere um email válido.');
      return;
    }

    setLoading(true);
    setResult(null);

    let normalizedUrl = url.trim();
    if (!/^https?:\/\//i.test(normalizedUrl)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    await supabase.from('leads').insert({
      source: 'seo-analyzer',
      name: name.trim(),
      email: email.trim(),
      website: normalizedUrl,
      resource_id: '7',
      resource_name: 'Análise SEO Gratuita',
    });
    analytics.trackForm('seo_analyzer', 'seo_analyzer_form_success', { website: normalizedUrl, email: email.trim() });

    try {
      const { data, error } = await supabase.functions.invoke('seo-analyzer', {
        body: { url: normalizedUrl, email: email.trim() },
      });

      if (error || (data as { error?: string })?.error) {
        toast.error((data as { error?: string })?.error || 'Erro ao analisar. Tenta novamente.');
        setLoading(false);
        return;
      }

      setResult(data as SEOResult);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch {
      toast.error('Erro ao analisar o website.');
    }
    setLoading(false);
  };

  const handleReset = () => {
    setResult(null);
    setUrl('');
  };

  const handleExportPDF = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(resultsRef.current, { scale: 2, useCORS: true, logging: false, backgroundColor: '#0a0603' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 277;
      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = -(imgHeight - heightLeft) + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const domain = result?.url ? new URL(result.url).hostname : 'website';
      pdf.save(`analise-seo-${domain}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar o PDF.');
    }
    setExporting(false);
  };

  return (
    <Layout>
      <SEO
        title="Análise SEO — Auditoria Técnica Gratuita | Getboost Digital"
        description="Auditoria SEO completa e gratuita: técnica, on-page, Core Web Vitals, segurança e mobile. Recebe um plano de ação priorizado para o teu site."
        canonical="/tools/seo-analyzer"
        lang={i18n.language as 'pt' | 'en' | 'es'}
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
            SEO · Auditoria técnica · Grátis · 60 segundos
          </motion.div>

          <h1 className="mt-8 font-black leading-[0.92] tracking-tight text-[clamp(2.5rem,7.5vw,6.5rem)]">
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
                ) : line}
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
            A tua página vai ser inspecionada como o Google a vê: rastreabilidade, arquitetura,
            performance real, segurança e mobile. Devolvemos-te uma pontuação 0–100 e as ações
            concretas que mais impacto vão ter — por ordem de retorno.
          </motion.p>

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-12 max-w-3xl"
          >
            <form
              onSubmit={handleAnalyze}
              className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 md:p-8 space-y-5"
            >
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-2 block">Nome</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="O teu nome"
                    className="h-12 bg-transparent border-white/15 text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                    required maxLength={100} />
                </div>
                <div>
                  <Label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-2 block">Email</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@empresa.pt"
                    className="h-12 bg-transparent border-white/15 text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                    required maxLength={255} />
                </div>
              </div>
              <div>
                <Label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60 mb-2 block">URL do site</Label>
                <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://oteusite.pt"
                  className="h-12 bg-transparent border-white/15 text-white placeholder:text-white/30 focus-visible:ring-[#ff4000]/40"
                  required maxLength={500} />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-none border-2 bg-transparent font-mono text-xs uppercase tracking-[0.24em] hover:!text-white"
                style={{ borderColor: ACCENT, color: '#ffb494' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                {loading ? (
                  <span className="flex items-center gap-3">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    A auditar…
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Search className="h-4 w-4" /> Auditar o meu site
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-6 border-t border-white/10 pt-8"
          >
            {[
              { k: '5', v: 'Pilares auditados' },
              { k: '30+', v: 'Verificações por análise' },
              { k: '60s', v: 'Tempo médio de scan' },
              { k: '0€', v: 'Custo, sem cartão' },
            ].map((s) => (
              <div key={s.k}>
                <div className="font-mono text-3xl md:text-4xl font-bold" style={{ color: ACCENT }}>{s.k}</div>
                <div className="mt-1 text-xs uppercase tracking-widest text-white/50">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PILLARS — accordion */}
      <section className="bg-[#0a0603] text-white py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="mb-14">
            <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
              O que auditamos
            </span>
            <h2 className="mt-4 font-black leading-[0.95] tracking-tight text-[clamp(2rem,5vw,4rem)] max-w-3xl">
              Cinco pilares. Uma única leitura clara.
            </h2>
          </div>
          <div className="border-t border-white/10">
            {pillars.map((f, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={f.title} className="border-b border-white/10">
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 py-10 md:py-14 text-left transition-colors hover:bg-white/[0.02]"
                  >
                    <div>
                      <div className="flex items-start gap-5">
                        <span className="mt-3 shrink-0" style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)' }}>
                          {isOpen ? <Circle className="h-4 w-4 fill-current" /> : <Grid2x2 className="h-5 w-5" />}
                        </span>
                        <h3 className="text-3xl md:text-5xl font-bold leading-[1.05] tracking-tight">{f.title}</h3>
                      </div>
                      <div className="mt-8 ml-0 md:ml-10 flex flex-wrap gap-3">
                        {f.tags.map((tag) => (
                          <span key={tag} className="rounded-full border border-white/25 px-4 py-1.5 text-xs md:text-sm text-white/80">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-start justify-between gap-6">
                        <span
                          className="font-mono text-[11px] md:text-xs uppercase tracking-[0.22em]"
                          style={{ color: isOpen ? ACCENT : 'rgba(255,255,255,0.6)' }}
                        >
                          {f.eyebrow}
                        </span>
                        <Minus
                          className="h-6 w-6 shrink-0 transition-transform"
                          style={{
                            color: isOpen ? ACCENT : 'rgba(255,255,255,0.5)',
                            transform: isOpen ? 'rotate(0deg)' : 'rotate(90deg)',
                          }}
                        />
                      </div>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.p
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.35 }}
                            className="overflow-hidden text-sm md:text-base leading-relaxed text-white/70"
                          >
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

      {/* RESULTS */}
      {result && (
        <section className="bg-[#0a0603] text-white py-20 md:py-28 border-t border-white/10">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-[0.22em]" style={{ color: ACCENT }}>
                  Relatório · {new Date().toLocaleDateString('pt-PT')}
                </span>
                <h2 className="text-3xl md:text-4xl font-bold mt-2">Resultado da auditoria SEO</h2>
                <p className="text-white/60 text-sm mt-1">{result.url}</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleReset}
                  className="bg-transparent border-white/20 text-white hover:bg-white/5 hover:text-white">
                  <RotateCcw className="w-4 h-4 mr-2" /> Nova análise
                </Button>
                <Button size="sm" onClick={handleExportPDF} disabled={exporting}
                  style={{ background: ACCENT }} className="text-white hover:opacity-90">
                  <Download className="w-4 h-4 mr-2" /> {exporting ? 'A exportar…' : 'Descarregar PDF'}
                </Button>
              </div>
            </motion.div>

            <div ref={resultsRef} className="space-y-6">
              {/* Overall */}
              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/50">Pontuação global</p>
                    <h3 className="text-2xl font-bold mt-2 text-white">{result.rating}</h3>
                    <p className="text-white/60 text-sm mt-2 max-w-md">
                      Combinação ponderada de SEO técnico, on-page, performance e segurança.
                    </p>
                  </div>
                  <ScoreCircle score={result.overallScore} size={140} strokeWidth={10} />
                </CardContent>
              </Card>

              {/* Category scores */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'On-Page', score: result.scores.onPage, Icon: FileText },
                  { label: 'Técnico', score: result.scores.technical, Icon: Code },
                  { label: 'Performance', score: result.scores.performance, Icon: Zap },
                  { label: 'Segurança', score: result.scores.security, Icon: Shield },
                ].map((item) => (
                  <Card key={item.label} className="bg-white/[0.03] border-white/10">
                    <CardContent className="p-6 flex flex-col items-center gap-3">
                      <item.Icon className="w-4 h-4" style={{ color: ACCENT }} />
                      <ScoreCircle score={item.score} size={72} strokeWidth={6} />
                      <span className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/60">{item.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Metrics */}
              <Card className="bg-white/[0.03] border-white/10">
                <CardContent className="p-8">
                  <h3 className="text-lg font-bold mb-6 text-white">Métricas detalhadas</h3>
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
                    {Object.entries(result.metrics).map(([key, m]) => (
                      <MetricBar key={key} label={m.label} value={m.value} icon={metricIcons[key] || Globe} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Detail cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {detailIcons.map((d) => {
                  const val = result.details[d.key as keyof typeof result.details];
                  return (
                    <Card key={d.key} className="bg-white/[0.03] border-white/10">
                      <CardContent className="p-5">
                        <d.icon className="w-5 h-5 mb-2" style={{ color: ACCENT }} />
                        <p className="text-[11px] text-white/50 uppercase tracking-widest">{d.label}</p>
                        <p className="text-base font-bold mt-1 text-white">{String(val)}</p>
                        <p className="text-[11px] text-white/40 mt-1">{d.sub}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Issues */}
              {(result.issues.critical.length > 0 || result.issues.warnings.length > 0) && (
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-white">
                      <AlertCircle className="w-5 h-5" style={{ color: ACCENT }} /> Problemas encontrados
                    </h3>

                    {result.issues.critical.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-semibold flex items-center gap-1.5 mb-3" style={{ color: ACCENT }}>
                          <AlertTriangle className="w-4 h-4" /> Crítico ({result.issues.critical.length})
                        </p>
                        <div className="space-y-3">
                          {result.issues.critical.map((issue, i) => (
                            <div key={i} className="border rounded-xl p-4"
                              style={{ background: 'rgba(255,64,0,0.06)', borderColor: 'rgba(255,64,0,0.25)' }}>
                              <p className="font-semibold text-sm text-white">{issue.title}</p>
                              <p className="text-sm text-white/60 mt-1">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {result.issues.warnings.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-yellow-400 flex items-center gap-1.5 mb-3">
                          <AlertTriangle className="w-4 h-4" /> Aviso ({result.issues.warnings.length})
                        </p>
                        <div className="space-y-3">
                          {result.issues.warnings.map((issue, i) => (
                            <div key={i} className="bg-yellow-500/[0.06] border border-yellow-500/25 rounded-xl p-4">
                              <p className="font-semibold text-sm text-yellow-200">{issue.title}</p>
                              <p className="text-sm text-white/60 mt-1">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Passed */}
              {result.passed.length > 0 && (
                <Card className="bg-white/[0.03] border-white/10">
                  <CardContent className="p-8">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                      <CheckCircle2 className="w-5 h-5 text-green-500" /> Verificações aprovadas ({result.passed.length})
                    </h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {result.passed.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-green-500/[0.06] border border-green-500/20 rounded-lg px-4 py-2.5">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-white/80">{p}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CTA FINAL */}
      <section className="bg-black text-white py-24 md:py-32 border-t border-white/10">
        <div className="max-w-6xl mx-auto px-6 md:px-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-black leading-[0.95] tracking-tight text-[clamp(2rem,6vw,5rem)]"
          >
            Já tens o relatório. Falta{' '}
            <span style={{ color: ACCENT }}>executar</span> as{' '}
            <span style={{ color: ACCENT }}>ações certas</span>.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 max-w-2xl mx-auto text-white/70"
          >
            Podemos implementar as recomendações contigo — sem contratos longos, sem lock-in.
            Marca uma conversa de 30 minutos e mostramos-te por onde começar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12"
          >
            <RouterLink
              to="/booking"
              className="inline-flex items-center gap-3 border-2 px-10 py-5 font-mono text-xs uppercase tracking-[0.28em] transition-all hover:!text-white"
              style={{ borderColor: ACCENT, color: ACCENT }}
              onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Marcar consultoria
              <ArrowRight className="h-4 w-4" />
            </RouterLink>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default SEOAnalyzer;
