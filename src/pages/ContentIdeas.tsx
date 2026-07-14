import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Sparkles, ArrowLeft, ArrowRight, Instagram, Film, FileText, LayoutGrid, MessageSquare, Hash, Clock, Type, Target, RotateCcw, Copy, Check, Download, Zap, TrendingUp } from 'lucide-react';
import Layout from '@/components/Layout';
import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import { Link as RouterLink } from 'react-router-dom';

interface ContentIdeas {
  posts: { title: string; description: string; hashtags: string[]; bestTime: string }[];
  reels: { title: string; description: string; hook: string; duration: string }[];
  articles: { title: string; description: string; keywords: string[]; estimatedWords: string }[];
  stories: { title: string; description: string; type: string }[];
  carousels: { title: string; slides: string[]; cta: string }[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4 } }),
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1.5 rounded-md hover:bg-muted transition-colors" title="Copiar">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
};

const analyzeItems = [
  { icon: Instagram, title: 'Posts para Redes Sociais', desc: '5 ideias com hashtags, descrição e melhor hora para publicar' },
  { icon: Film, title: 'Reels & Vídeos Curtos', desc: '4 conceitos com hooks criativos, duração e formato ideal' },
  { icon: FileText, title: 'Artigos de Blog', desc: '3 tópicos com palavras-chave, estrutura e estimativa de palavras' },
  { icon: LayoutGrid, title: 'Stories & Carrosséis', desc: '6 ideias interativas com slides e CTAs prontos a usar' },
];

const ContentIdeasPage = () => {
  const [niche, setNiche] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<ContentIdeas | null>(null);
  const [analyzedNiche, setAnalyzedNiche] = useState('');
  const [exporting, setExporting] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!niche.trim()) { toast.error('Insere o teu nicho ou indústria.'); return; }
    if (!name.trim() || !email.trim()) { toast.error('Preenche o nome e email.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('Email inválido.'); return; }

    setLoading(true);
    setIdeas(null);

    // Save lead
    await supabase.from('leads').insert({
      source: 'content-ideas',
      name: name.trim(),
      email: email.trim(),
      resource_id: '8',
      resource_name: 'Gerador de Ideias de Conteúdo com IA',
      message: `Nicho: ${niche.trim()}`,
    });
    analytics.trackForm('content_ideas', 'content_ideas_form_success', { niche: niche.trim(), email: email.trim() });

    try {
      const { data, error } = await supabase.functions.invoke('content-ideas', {
        body: { niche: niche.trim(), language: 'pt', email: email.trim() },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setIdeas(data.ideas);
      setAnalyzedNiche(niche.trim());
      toast.success('Ideias geradas com sucesso!');
    } catch (err: any) {
      toast.error(err?.message || 'Erro ao gerar ideias. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setIdeas(null);
    setAnalyzedNiche('');
    setNiche('');
  };

  const handleExportPDF = async () => {
    if (!resultsRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(resultsRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });
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

      pdf.save(`ideias-conteudo-${analyzedNiche.replace(/\s+/g, '-').toLowerCase()}.pdf`);
      toast.success('Relatório PDF exportado com sucesso!');
    } catch {
      toast.error('Erro ao exportar o PDF.');
    }
    setExporting(false);
  };

  const totalIdeas = ideas
    ? (ideas.posts?.length || 0) + (ideas.reels?.length || 0) + (ideas.articles?.length || 0) + (ideas.stories?.length || 0) + (ideas.carousels?.length || 0)
    : 0;

  return (
    <Layout>
      <SEO title="Gerador de Ideias de Conteúdo com IA — Getboost Digital" description="Gera ideias criativas para posts, reels, artigos e stories com inteligência artificial. Ferramenta gratuita." canonical="/tools/content-ideas" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-background" />
        <div className="relative max-w-5xl mx-auto px-6 md:px-12 pt-28 md:pt-36 pb-16 md:pb-24 text-center">
          <motion.div initial="hidden" animate="visible">
            <motion.span variants={fadeUp} custom={0} className="inline-block text-xs font-semibold tracking-widest uppercase text-primary bg-primary/10 px-4 py-1.5 rounded-full mb-6">
              🤖 Powered by AI
            </motion.span>
            <motion.h1 variants={fadeUp} custom={1} className="text-3xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Gerador de Ideias de Conteúdo
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-muted-foreground text-lg md:text-xl mt-4 max-w-2xl mx-auto">
              Escreve o teu nicho e recebe dezenas de ideias criativas
            </motion.p>
            <motion.p variants={fadeUp} custom={3} className="text-muted-foreground mt-2 max-w-2xl mx-auto">
              A inteligência artificial gera ideias para posts, reels, artigos, stories e carrosséis tudo personalizado para o teu negócio, prontas a usar.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {!ideas ? (
        /* Form + What We Generate */
        <section className="section-padding pt-0">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
              {/* Form */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="border-2 border-border">
                  <CardContent className="p-8">
                    <h2 className="text-xl md:text-2xl font-bold mb-2">Gera as Tuas Ideias Grátis</h2>
                    <p className="text-muted-foreground text-sm mb-8">Insere o teu nicho e recebe ideias criativas e prontas a usar para todas as plataformas.</p>
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Nicho ou Indústria *</Label>
                        <Input value={niche} onChange={e => setNiche(e.target.value)} placeholder="Ex: Fitness, Restauração, Imobiliário, Moda..." className="h-12" required maxLength={200} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">O Teu Nome *</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Insira o teu nome" className="h-12" required maxLength={100} />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-1.5 block">Endereço de Email *</Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="h-12" required maxLength={255} />
                      </div>
                      <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold" disabled={loading}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            A gerar ideias…
                          </span>
                        ) : (
                          <>
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Gerar Ideias de Conteúdo
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </motion.div>

              {/* What We Generate */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <h2 className="text-xl md:text-2xl font-bold mb-6">O Que Geramos</h2>
                <div className="space-y-4">
                  {analyzeItems.map((item, i) => (
                    <motion.div key={item.title} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
                      <Card className="border-border hover:border-primary/20 transition-colors">
                        <CardContent className="p-5 flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : (
        /* Results */
        <section className="section-padding pt-0">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold">Ideias de Conteúdo</h2>
                <p className="text-muted-foreground text-sm mt-1">Nicho: <span className="font-medium text-primary">{analyzedNiche}</span></p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" onClick={handleReset}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Nova Pesquisa
                </Button>
                <Button size="sm" onClick={handleExportPDF} disabled={exporting}>
                  <Download className="w-4 h-4 mr-2" /> {exporting ? 'A exportar…' : 'Descarregar Relatório (PDF)'}
                </Button>
              </div>
            </motion.div>

            <div ref={resultsRef}>

            {/* Stats Summary */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-2 border-border mb-8">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-bold mb-1">Resumo das Ideias Geradas</h3>
                      <p className="text-sm text-muted-foreground">{name} — Gerado por Inteligência Artificial</p>
                    </div>
                    <div className="grid grid-cols-5 gap-4 text-center">
                      {[
                        { label: 'Posts', count: ideas.posts?.length || 0, icon: Instagram },
                        { label: 'Reels', count: ideas.reels?.length || 0, icon: Film },
                        { label: 'Artigos', count: ideas.articles?.length || 0, icon: FileText },
                        { label: 'Stories', count: ideas.stories?.length || 0, icon: MessageSquare },
                        { label: 'Carrosséis', count: ideas.carousels?.length || 0, icon: LayoutGrid },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center gap-1">
                          <s.icon className="w-5 h-5 text-primary" />
                          <span className="text-2xl font-bold">{s.count}</span>
                          <span className="text-[11px] text-muted-foreground">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span><strong className="text-foreground">{totalIdeas} ideias</strong> geradas para o nicho <strong className="text-primary">{analyzedNiche}</strong></span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Tabs with content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid grid-cols-5 w-full mb-6">
                  <TabsTrigger value="posts" className="gap-1.5 text-xs sm:text-sm"><Instagram className="w-4 h-4 hidden sm:block" /> Posts</TabsTrigger>
                  <TabsTrigger value="reels" className="gap-1.5 text-xs sm:text-sm"><Film className="w-4 h-4 hidden sm:block" /> Reels</TabsTrigger>
                  <TabsTrigger value="articles" className="gap-1.5 text-xs sm:text-sm"><FileText className="w-4 h-4 hidden sm:block" /> Artigos</TabsTrigger>
                  <TabsTrigger value="stories" className="gap-1.5 text-xs sm:text-sm"><MessageSquare className="w-4 h-4 hidden sm:block" /> Stories</TabsTrigger>
                  <TabsTrigger value="carousels" className="gap-1.5 text-xs sm:text-sm"><LayoutGrid className="w-4 h-4 hidden sm:block" /> Carrosséis</TabsTrigger>
                </TabsList>

                {/* Posts */}
                <TabsContent value="posts">
                  <div className="space-y-4">
                    {ideas.posts?.map((p, i) => (
                      <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                        <Card className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-lg">{p.title}</h3>
                              <CopyButton text={`${p.title}\n\n${p.description}\n\n${p.hashtags?.join(' ') || ''}`} />
                            </div>
                            <p className="text-muted-foreground text-sm mt-2">{p.description}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              {p.hashtags?.map((h, j) => (
                                <Badge key={j} variant="secondary" className="text-xs"><Hash className="w-3 h-3 mr-0.5" />{h.replace('#', '')}</Badge>
                              ))}
                            </div>
                            {p.bestTime && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                                <Clock className="w-3.5 h-3.5" /> Melhor hora: {p.bestTime}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Reels */}
                <TabsContent value="reels">
                  <div className="space-y-4">
                    {ideas.reels?.map((r, i) => (
                      <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                        <Card className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-lg">{r.title}</h3>
                              <CopyButton text={`${r.title}\n\nHook: ${r.hook}\n\n${r.description}`} />
                            </div>
                            <p className="text-muted-foreground text-sm mt-2">{r.description}</p>
                            {r.hook && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
                                <p className="text-sm"><span className="font-medium text-primary">🎬 Hook:</span> "{r.hook}"</p>
                              </div>
                            )}
                            {r.duration && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                                <Clock className="w-3.5 h-3.5" /> Duração: {r.duration}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Articles */}
                <TabsContent value="articles">
                  <div className="space-y-4">
                    {ideas.articles?.map((a, i) => (
                      <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                        <Card className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-lg">{a.title}</h3>
                              <CopyButton text={`${a.title}\n\n${a.description}\n\nPalavras-chave: ${a.keywords?.join(', ')}`} />
                            </div>
                            <p className="text-muted-foreground text-sm mt-2">{a.description}</p>
                            <div className="flex flex-wrap gap-2 mt-3">
                              {a.keywords?.map((k, j) => (
                                <Badge key={j} variant="outline" className="text-xs"><Target className="w-3 h-3 mr-1" />{k}</Badge>
                              ))}
                            </div>
                            {a.estimatedWords && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-3">
                                <Type className="w-3.5 h-3.5" /> ~{a.estimatedWords} palavras
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Stories */}
                <TabsContent value="stories">
                  <div className="space-y-4">
                    {ideas.stories?.map((s, i) => (
                      <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                        <Card className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-lg">{s.title}</h3>
                              <CopyButton text={`${s.title}\n\n${s.description}`} />
                            </div>
                            <p className="text-muted-foreground text-sm mt-2">{s.description}</p>
                            {s.type && <Badge className="mt-3" variant="secondary">{s.type}</Badge>}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>

                {/* Carousels */}
                <TabsContent value="carousels">
                  <div className="space-y-4">
                    {ideas.carousels?.map((c, i) => (
                      <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" animate="visible">
                        <Card className="border-border hover:border-primary/20 transition-colors">
                          <CardContent className="p-5">
                            <div className="flex justify-between items-start gap-2">
                              <h3 className="font-semibold text-lg">{c.title}</h3>
                              <CopyButton text={`${c.title}\n\nSlides:\n${c.slides?.map((s, j) => `${j + 1}. ${s}`).join('\n')}\n\nCTA: ${c.cta}`} />
                            </div>
                            <div className="mt-3 space-y-2">
                              {c.slides?.map((slide, j) => (
                                <div key={j} className="flex items-start gap-2 text-sm">
                                  <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{j + 1}</span>
                                  <span className="text-muted-foreground">{slide}</span>
                                </div>
                              ))}
                            </div>
                            {c.cta && (
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mt-3">
                                <p className="text-sm"><span className="font-medium text-primary">CTA:</span> {c.cta}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>

            {/* CTA */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8">
              <Card className="bg-primary text-primary-foreground border-0">
                <CardContent className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold">Queres Transformar Estas Ideias Em Resultados?</h3>
                    <p className="text-primary-foreground/80 mt-2">A nossa equipa pode criar e gerir todo o teu conteúdo digital — do planeamento à publicação.</p>
                  </div>
                  <RouterLink to="/booking">
                    <Button size="lg" className="bg-white text-foreground hover:bg-white/90 whitespace-nowrap">
                      Agendar Reunião <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </RouterLink>
                </CardContent>
              </Card>
            </motion.div>

            </div>{/* end resultsRef */}
          </div>
        </section>
      )}
    </Layout>
  );
};

export default ContentIdeasPage;
