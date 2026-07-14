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
import { supabase } from '@/integrations/supabase/client';

type Project = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  year: string;
  client: string;
  results: string;
  status: string;
  created_at: string;
};

const categories = [
  { value: 'branding', label: 'Branding' },
  { value: 'web', label: 'Web' },
  { value: 'strategy', label: 'Estratégia' },
];

const AdminProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editing, setEditing] = useState<Project | null>(null);
  const [preview, setPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '', slug: '', category: 'web', description: '',
    image: '', year: new Date().getFullYear().toString(),
    client: '', results: '', status: 'draft',
    tags: [] as string[],
  });

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Erro ao carregar projetos.');
    else setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const startNew = () => {
    setForm({
      title: '', slug: '', category: 'web', description: '',
      image: '', year: new Date().getFullYear().toString(),
      client: '', results: '', status: 'draft', tags: [],
    });
    setEditing({
      id: '', slug: '', title: '', category: 'web', description: '',
      image: '', tags: [], year: new Date().getFullYear().toString(),
      client: '', results: '', status: 'draft', created_at: new Date().toISOString(),
    });
    setPreview(false);
  };

  const startEdit = (project: Project) => {
    setForm({
      title: project.title, slug: project.slug, category: project.category,
      description: project.description, image: project.image, year: project.year,
      client: project.client, results: project.results, status: project.status,
      tags: project.tags || [],
    });
    setEditing(project);
    setPreview(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm(f => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }));
  };

  const saveProject = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Título e descrição são obrigatórios.');
      return;
    }
    if (!editing) return;

    setSaving(true);
    const slug = form.slug.trim() || generateSlug(form.title);
    const payload = {
      slug,
      title: form.title.trim(),
      category: form.category,
      description: form.description.trim(),
      image: form.image.trim(),
      tags: form.tags,
      year: form.year,
      client: form.client.trim(),
      results: form.results.trim(),
      status: form.status,
    };

    let error;
    if (editing.id) {
      ({ error } = await supabase.from('projects').update(payload).eq('id', editing.id));
    } else {
      ({ error } = await supabase.from('projects').insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error('Erro ao guardar: ' + error.message);
      return;
    }

    toast.success(form.status === 'published' ? 'Projeto publicado!' : 'Rascunho guardado!');
    setEditing(null);
    fetchProjects();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar.'); return; }
    toast.success('Projeto eliminado.');
    fetchProjects();
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Editor view
  if (editing) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar à lista
          </button>
          <div className="flex items-center gap-2">
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
              {form.image && <img src={form.image} alt={form.title} className="w-full h-64 object-cover rounded-xl mb-6" />}
              <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className="text-primary border-primary/30">
                  {categories.find(c => c.value === form.category)?.label}
                </Badge>
                <span className="text-sm text-muted-foreground">{form.year}</span>
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{form.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mb-4"><Building2 className="h-4 w-4" />{form.client}</p>
              <p className="text-foreground/80 leading-relaxed mb-4">{form.description}</p>
              <p className="font-semibold text-primary flex items-center gap-2"><TrendingUp className="h-4 w-4" />{form.results}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {form.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
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
                  setForm(f => ({ ...f, title, slug: f.slug || generateSlug(title) }));
                }} placeholder="Nome do projeto..." className="text-lg font-semibold" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="url-do-projeto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Cliente</Label>
                  <Input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Nome do cliente" />
                </div>
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">Ano</Label>
                  <Input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="2024" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Descrição *</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descreve o projeto..." className="min-h-[120px]" />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">Resultados</Label>
                <Input value={form.results} onChange={e => setForm(f => ({ ...f, results: e.target.value }))} placeholder="Ex: +200% brand recognition" />
              </div>
            </div>

            <div className="space-y-4">
              <Card className="border-border">
                <CardContent className="p-5 space-y-4">
                  <h3 className="font-semibold text-foreground text-sm">Definições</h3>
                  <div>
                    <Label className="text-sm mb-1.5 block">Estado</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Rascunho</SelectItem>
                        <SelectItem value="published">Publicado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm mb-1.5 block">Categoria</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
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
                            if (!file.type.startsWith('image/')) { toast.error('Selecione um ficheiro de imagem.'); return; }
                            if (file.size > 5 * 1024 * 1024) { toast.error('A imagem não pode exceder 5MB.'); return; }
                            setUploading(true);
                            const ext = file.name.split('.').pop();
                            const fileName = `project-${Date.now()}.${ext}`;
                            const { error } = await supabase.storage.from('blog-images').upload(fileName, file, { cacheControl: '3600', upsert: false });
                            if (error) { toast.error('Erro ao carregar: ' + error.message); setUploading(false); return; }
                            const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(fileName);
                            setForm(f => ({ ...f, image: urlData.publicUrl }));
                            toast.success('Imagem carregada!');
                            setUploading(false);
                            if (fileInputRef.current) fileInputRef.current.value = '';
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
                        <Input value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
                      </TabsContent>
                    </Tabs>
                    {form.image && (
                      <div className="relative mt-2">
                        <img src={form.image} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6"
                          onClick={() => setForm(f => ({ ...f, image: '' }))}
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
                      {form.tags.map(tag => (
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
        <Button size="sm" onClick={startNew} className="gap-1.5">
          <Plus className="h-4 w-4" /> Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: projects.length },
          { label: 'Publicados', value: projects.filter(p => p.status === 'published').length },
          { label: 'Rascunhos', value: projects.filter(p => p.status === 'draft').length },
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
            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
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
          {filtered.map(project => (
            <Card key={project.id} className="border-border hover:shadow-md transition-shadow overflow-hidden">
              {project.image && (
                <img src={project.image} alt={project.title} className="w-full h-40 object-cover" />
              )}
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    {categories.find(c => c.value === project.category)?.label}
                  </Badge>
                  <Badge variant={project.status === 'published' ? 'default' : 'secondary'} className="text-xs">
                    {project.status === 'published' ? 'Publicado' : 'Rascunho'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground text-sm">{project.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{project.client} · {project.year}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                <div className="flex items-center gap-1 mt-3">
                  <Button size="sm" variant="ghost" onClick={() => startEdit(project)}>
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
                      <p className="text-sm text-muted-foreground">Tens a certeza que queres eliminar "{project.title}"?</p>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm">Cancelar</Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteProject(project.id)}>Eliminar</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
