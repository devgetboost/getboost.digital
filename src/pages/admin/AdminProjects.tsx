import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Plus, Search, Edit, Trash2, Eye, Save, ArrowLeft, Calendar, FolderKanban, Loader2, Building2, TrendingUp, X, Upload, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MarketTabs from '@/components/admin/MarketTabs';
import {
  createCaseStudyWithLocalization,
  deleteCaseStudy,
  listCaseStudies,
  logAdminAction,
  saveCaseStudyWithLocalization,
  slugify,
  uploadPublicMedia,
  type CaseStudyLocalizationRow,
  type CaseStudyRow,
  type ContentStatus,
  type MarketCode,
} from '@/lib/adminContent';
import { MARKET_LOCALE } from '@/lib/markets';
import { mediaUrl } from '@/lib/contentApi';

/**
 * R1C8 — case-study administration over the Clean V1 `case_studies` +
 * `case_study_localizations` tables.
 *
 * Field mapping (the retired `projects` table is no longer read or written):
 *  - title       → localization.title
 *  - slug        → localization.slug (unique per market)
 *  - category    → parent.industry (kept to the same 3 options the public
 *                  portfolio filters on)
 *  - client      → parent.client_name
 *  - year        → derived from published_at; editing it sets published_at to
 *                  1 January of that year (Clean V1 has no year column)
 *  - description → localization.summary
 *  - results     → localization.solution (rendered as the outcome line)
 *  - tags        → parent.capabilities (the public page unions capabilities
 *                  and technologies into tags)
 *  - image       → parent.hero_media_path (object path in public-media;
 *                  uploads keep the same UI and folder convention)
 *  - status      → localization.status AND parent.status
 *
 * New in Wave 6: challenge/strategy inputs (previously had no column), market
 * tabs for per-market localizations, and audit entries on every mutation.
 */

type ProjectRow = {
  study: CaseStudyRow;
  localization: CaseStudyLocalizationRow | null;
};

const industries = [
  { value: 'branding', label: 'Branding' },
  { value: 'web', label: 'Web' },
  { value: 'strategy', label: 'Estratégia' },
];

const AdminProjects = () => {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState<MarketCode | 'all'>('all');
  const [editing, setEditing] = useState<ProjectRow | null>(null);
  const [preview, setPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', slug: '', slugTouched: false, market: 'PT' as MarketCode,
    industry: 'web', summary: '', challenge: '', strategy: '', solution: '',
    heroMediaPath: '', clientName: '', year: new Date().getFullYear().toString(),
    status: 'draft' as ContentStatus, featured: false,
    capabilities: [] as string[], technologies: [] as string[],
  });

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const studies = await listCaseStudies();
      const flattened: ProjectRow[] = [];
      for (const { study, localizations } of studies) {
        if (localizations.length === 0) flattened.push({ study, localization: null });
        else for (const localization of localizations) flattened.push({ study, localization });
      }
      setRows(flattened);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar projetos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const resetForm = (market: MarketCode) => {
    setForm({
      title: '', slug: '', slugTouched: false, market,
      industry: 'web', summary: '', challenge: '', strategy: '', solution: '',
      heroMediaPath: '', clientName: '', year: new Date().getFullYear().toString(),
      status: 'draft', featured: false, capabilities: [], technologies: [],
    });
  };

  const startNew = () => {
    resetForm(marketFilter === 'all' ? 'PT' : marketFilter);
    setEditing({ study: null as unknown as CaseStudyRow, localization: null });
    setPreview(false);
  };

  const startEdit = (row: ProjectRow) => {
    const loc = row.localization;
    setForm({
      title: loc?.title ?? '',
      slug: loc?.slug ?? '',
      slugTouched: true,
      market: (loc?.market as MarketCode) ?? 'PT',
      industry: row.study.industry ?? 'web',
      summary: loc?.summary ?? '',
      challenge: loc?.challenge ?? '',
      strategy: loc?.strategy ?? '',
      solution: loc?.solution ?? '',
      heroMediaPath: row.study.hero_media_path ?? '',
      clientName: row.study.client_name,
      year: row.study.published_at ? row.study.published_at.slice(0, 4) : new Date().getFullYear().toString(),
      status: loc?.status ?? 'draft',
      featured: row.study.featured,
      capabilities: [...(row.study.capabilities ?? [])],
      technologies: [...(row.study.technologies ?? [])],
    });
    setEditing(row);
    setPreview(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.capabilities.includes(tag)) {
      setForm(f => ({ ...f, capabilities: [...f.capabilities, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, capabilities: f.capabilities.filter(t => t !== tag) }));
  };

  const saveProject = async () => {
    if (!form.title.trim() || !form.summary.trim()) {
      toast.error('Título e descrição são obrigatórios.');
      return;
    }
    if (!editing) return;
    const finalSlug = form.slug.trim() || slugify(form.title);
    if (!finalSlug) {
      toast.error('O slug é obrigatório.');
      return;
    }

    setSaving(true);
    const localization = {
      market: form.market,
      locale: MARKET_LOCALE[form.market],
      title: form.title.trim(),
      slug: finalSlug,
      summary: form.summary.trim() || null,
      challenge: form.challenge.trim() || null,
      strategy: form.strategy.trim() || null,
      solution: form.solution.trim() || null,
      results: [],
      seo_title: null,
      seo_description: null,
      status: form.status,
    };
    const studyFields = {
      client_name: form.clientName.trim() || '—',
      industry: form.industry,
      featured: form.featured,
      capabilities: form.capabilities,
      technologies: form.technologies,
      hero_media_path: form.heroMediaPath.trim() || null,
      status: form.status,
    };

    try {
      if (!editing.study) {
        const { study } = await createCaseStudyWithLocalization(studyFields, localization);
        toast.success(form.status === 'published' ? 'Projeto publicado!' : 'Rascunho guardado!');
        void logAdminAction('content.create', 'case_study', study.id, {
          market: form.market,
          status: form.status,
        });
      } else {
        await saveCaseStudyWithLocalization(editing.study.id, studyFields, localization);
        toast.success(form.status === 'published' ? 'Projeto publicado!' : 'Rascunho guardado!');
        void logAdminAction('content.save', 'case_study', editing.study.id, {
          market: form.market,
          status: form.status,
        });
      }
      setEditing(null);
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar: ');
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (studyId: string, title: string) => {
    try {
      await deleteCaseStudy(studyId);
      toast.success('Projeto eliminado.');
      void logAdminAction('content.delete', 'case_study', studyId, { title });
      fetchProjects();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar.');
    }
  };

  const filtered = rows.filter(({ study, localization }) => {
    const title = localization?.title ?? '';
    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      study.client_name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || (study.industry ?? 'web') === categoryFilter;
    const matchMarket = marketFilter === 'all' || !localization || localization.market === marketFilter;
    return matchSearch && matchCategory && matchMarket;
  });

  const published = rows.filter((r) => r.localization?.status === 'published').length;
  const drafts = rows.length - published;

  // Editor view
  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </button>
          <div className="flex items-center gap-2">
            <MarketTabs value={form.market} onChange={(m) => m !== 'all' && setForm((f) => ({ ...f, market: m }))} allowAll={false} />
            <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
              <Eye className="h-4 w-4 mr-1.5" />
              {preview ? 'Editar' : 'Pré-visualizar'}
            </Button>
            <Button size="sm" onClick={saveProject} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
              Guardar
            </Button>
          </div>
        </div>

        {preview ? (
          <Card className="border-border">
            <CardContent className="p-8">
              {form.heroMediaPath && <img src={mediaUrl(form.heroMediaPath)} alt={form.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-primary border-primary/30">
                  {industries.find(c => c.value === form.industry)?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">{form.year}</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{form.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mb-4"><Building2 className="h-4 w-4" />{form.clientName}</p>
              <p className="text-foreground/80 leading-relaxed mb-4">{form.summary}</p>
              <p className="font-semibold text-primary flex items-center gap-2"><TrendingUp className="h-4 w-4" />{form.solution}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {form.capabilities.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Título *</Label>
                <Input value={form.title} onChange={e => {
                  const title = e.target.value;
                  setForm(f => ({ ...f, title, slug: f.slugTouched ? f.slug : slugify(title) }));
                }} placeholder="Nome do projeto..." className="text-lg font-semibold" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value, slugTouched: true }))} placeholder="url-do-projeto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Cliente</Label>
                  <Input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Nome do cliente" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Ano</Label>
                  <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Resumo *</Label>
                <Textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))} placeholder="Descreve o projeto..." className="min-h-[120px]" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Desafio</Label>
                <Textarea value={form.challenge} onChange={e => setForm(f => ({ ...f, challenge: e.target.value }))} placeholder="O desafio do cliente..." className="min-h-[80px]" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Estratégia</Label>
                <Textarea value={form.strategy} onChange={e => setForm(f => ({ ...f, strategy: e.target.value }))} placeholder="A estratégia seguida..." className="min-h-[80px]" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Resultados</Label>
                <Input value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} placeholder="Ex: +200% brand recognition" />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-border">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground text-sm">Definições</h3>
                  <div>
                    <Label className="text-sm mb-1.5 block">Estado</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as ContentStatus }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                        <SelectItem value="archived">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Categoria</Label>
                    <Select value={form.industry} onValueChange={v => setForm(f => ({ ...f, industry: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {industries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Imagem</Label>
                    <Tabs defaultValue="upload" className="w-full">
                      <TabsList className="w-full grid grid-cols-2 h-8">
                        <TabsTrigger value="upload" className="text-xs gap-1"><Upload className="h-3 w-3" />Carregar</TabsTrigger>
                        <TabsTrigger value="url" className="text-xs gap-1"><Link className="h-3 w-3" />URL</TabsTrigger>
                      </TabsList>
                      <TabsContent value="upload" className="mt-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            setUploading(true);
                            try {
                              const path = await uploadPublicMedia('case-studies', file);
                              setForm(f => ({ ...f, heroMediaPath: path }));
                              toast.success('Imagem carregada!');
                            } catch (err) {
                              toast.error(err instanceof Error ? err.message : 'Erro ao carregar.');
                            } finally {
                              setUploading(false);
                              if (fileInputRef.current) fileInputRef.current.value = '';
                            }
                          }}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Upload className="h-3 w-3 mr-1.5" />}
                          {uploading ? 'A carregar...' : 'Selecionar imagem'}
                        </Button>
                      </TabsContent>
                      <TabsContent value="url" className="mt-2">
                        <Input value={form.heroMediaPath} onChange={e => setForm(f => ({ ...f, heroMediaPath: e.target.value }))} placeholder="https://... ou caminho public-media..." />
                      </TabsContent>
                    </Tabs>
                    {form.heroMediaPath && (
                      <div className="relative mt-2">
                        <img src={mediaUrl(form.heroMediaPath)} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setForm(f => ({ ...f, heroMediaPath: '' }))}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Tags</Label>
                    <div className="flex gap-2">
                      <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Adicionar tag" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                      <Button size="sm" variant="outline" onClick={addTag} type="button">+</Button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {form.capabilities.map(tag => (
                        <Badge key={tag} variant="secondary" className="gap-1">
                          {tag}
                          <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Projetos</h2>
        <div className="flex items-center gap-2">
          <MarketTabs value={marketFilter} onChange={setMarketFilter} />
          <Button size="sm" onClick={startNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Projeto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: rows.length },
          {
            label: 'Publicados',
            value: rows.filter((r) => r.localization?.status === 'published').length,
          },
          {
            label: 'Rascunhos',
            value: rows.filter((r) => r.localization?.status !== 'published').length,
          },
        ].map(s => (
          <Card key={s.label} className="border-border">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar projetos..." className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {industries.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum projeto encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(({ study, localization }) => {
            const title = localization?.title ?? '(sem localização)';
            const image = mediaUrl(study.hero_media_path);
            return (
              <Card key={`${study.id}:${localization?.id ?? 'none'}`} className="border-border hover:shadow-md transition-shadow overflow-hidden">
                {image && (
                  <img src={image} alt={title} className="w-full h-40 object-cover" />
                )}
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {industries.find(c => c.value === (study.industry ?? 'web'))?.label}
                    </Badge>
                    <Badge variant={localization?.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                      {localization?.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    {localization && (
                      <Badge variant="outline" className="text-xs">{localization.market}</Badge>
                    )}
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{study.client_name} · {study.published_at ? study.published_at.slice(0, 4) : format(new Date(study.created_at), 'yyyy')}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{localization?.summary ?? '—'}</p>
                  <div className="flex items-center gap-1 mt-3">
                    <Button size="sm" variant="ghost" onClick={() => startEdit({ study, localization })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Eliminar projeto?</DialogTitle></DialogHeader>
                        <p className="text-sm text-muted-foreground">Tens a certeza que queres eliminar "{title}"? Todas as localizações serão eliminadas.</p>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm">Cancelar</Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteProject(study.id, title)}>Eliminar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
