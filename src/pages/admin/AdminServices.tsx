import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Save, X, ChevronDown, ChevronUp, Upload, Link, ImageIcon, X as XIcon } from 'lucide-react';

type BenefitItem = { title: string; desc: string };
type ProcessItem = { step: string; title: string; desc: string };
type ResultItem = { value: string; label: string };
type FaqItem = { q: string; a: string };

type Service = {
  id: string;
  key: string;
  slug: string;
  icon: string;
  price: string;
  headline: string;
  subheadline: string;
  image: string;
  pain_points: string[];
  benefits: BenefitItem[];
  process: ProcessItem[];
  results: ResultItem[];
  faq: FaqItem[];
  sort_order: number;
  status: string;
};

const emptyService: Omit<Service, 'id'> = {
  key: '',
  slug: '',
  icon: '✨',
  price: 'Sob consulta',
  headline: '',
  subheadline: '',
  image: '',
  pain_points: [''],
  benefits: [{ title: '', desc: '' }],
  process: [{ step: '01', title: '', desc: '' }],
  results: [{ value: '', label: '' }],
  faq: [{ q: '', a: '' }],
  sort_order: 0,
  status: 'draft',
};

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast.error('Erro ao carregar serviços');
    } else {
      setServices((data || []) as unknown as Service[]);
    }
    setLoading(false);
  };

  const generateSlug = (text: string) =>
    text.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const startNew = () => {
    setEditing({ ...emptyService, id: '', sort_order: services.length + 1 } as Service);
    setIsNew(true);
    setExpandedSection('basic');
  };

  const startEdit = (s: Service) => {
    setEditing({ ...s });
    setIsNew(false);
    setExpandedSection('basic');
  };

  const cancel = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.key.trim() || !editing.slug.trim() || !editing.headline.trim()) {
      toast.error('Preenche os campos obrigatórios: chave, slug e headline.');
      return;
    }

    const payload = {
      key: editing.key,
      slug: editing.slug,
      icon: editing.icon,
      price: editing.price,
      headline: editing.headline,
      subheadline: editing.subheadline,
      image: editing.image,
      pain_points: editing.pain_points.filter(p => p.trim()),
      benefits: editing.benefits.filter(b => b.title.trim()),
      process: editing.process.filter(p => p.title.trim()),
      results: editing.results.filter(r => r.value.trim()),
      faq: editing.faq.filter(f => f.q.trim()),
      sort_order: editing.sort_order,
      status: editing.status,
    };

    if (isNew) {
      const { error } = await supabase.from('services').insert(payload);
      if (error) { toast.error('Erro ao criar serviço'); return; }
      toast.success('Serviço criado!');
    } else {
      const { error } = await supabase.from('services').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar serviço'); return; }
      toast.success('Serviço atualizado!');
    }
    setEditing(null);
    setIsNew(false);
    fetchServices();
  };

  const deleteService = async (id: string) => {
    if (!confirm('Tens a certeza que queres eliminar este serviço?')) return;
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar'); return; }
    toast.success('Serviço eliminado');
    fetchServices();
  };

  const toggleStatus = async (s: Service) => {
    const newStatus = s.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('services').update({ status: newStatus }).eq('id', s.id);
    if (error) { toast.error('Erro ao atualizar estado'); return; }
    toast.success(newStatus === 'published' ? 'Serviço publicado' : 'Serviço despublicado');
    fetchServices();
  };

  const updateField = (field: string, value: unknown) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // If editing, show the editor
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{isNew ? 'Novo Serviço' : 'Editar Serviço'}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancel}><X className="h-4 w-4 mr-2" />Cancelar</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-2" />Guardar</Button>
          </div>
        </div>

        {/* Basic Info */}
        <CollapsibleSection title="Informações Básicas" section="basic" expanded={expandedSection} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Chave (key) *</label>
              <Input value={editing.key} onChange={e => updateField('key', e.target.value)} placeholder="socialMedia" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug *</label>
              <Input value={editing.slug} onChange={e => updateField('slug', e.target.value)} placeholder="gestao-redes-sociais" />
              <button type="button" className="text-xs text-primary mt-1" onClick={() => updateField('slug', generateSlug(editing.headline))}>
                Gerar do headline
              </button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ícone (emoji)</label>
              <Input value={editing.icon} onChange={e => updateField('icon', e.target.value)} placeholder="📱" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Preço</label>
              <Input value={editing.price} onChange={e => updateField('price', e.target.value)} placeholder="350€/mês" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ordem</label>
              <Input type="number" value={editing.sort_order} onChange={e => updateField('sort_order', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select value={editing.status} onValueChange={v => updateField('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Imagem</label>
              {editing.image ? (
                <div className="relative w-full max-w-xs mb-2">
                  <img src={editing.image} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => updateField('image', '')}>
                    <XIcon className="h-3 w-3" />
                  </Button>
                </div>
              ) : null}
              <Tabs defaultValue="upload" className="w-full">
                <TabsList className="mb-2">
                  <TabsTrigger value="upload" className="gap-1.5"><Upload className="h-3.5 w-3.5" />Carregar</TabsTrigger>
                  <TabsTrigger value="url" className="gap-1.5"><Link className="h-3.5 w-3.5" />URL</TabsTrigger>
                </TabsList>
                <TabsContent value="upload">
                  <ImageUploadField onUploaded={(url) => updateField('image', url)} />
                </TabsContent>
                <TabsContent value="url">
                  <Input value={editing.image} onChange={e => updateField('image', e.target.value)} placeholder="https://..." />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CollapsibleSection>

        {/* Headline & Subheadline */}
        <CollapsibleSection title="Headline & Descrição" section="headline" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Headline *</label>
              <Input value={editing.headline} onChange={e => updateField('headline', e.target.value)} placeholder="A tua marca merece ser vista." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subheadline</label>
              <Textarea value={editing.subheadline} onChange={e => updateField('subheadline', e.target.value)} rows={3} placeholder="Descrição detalhada..." />
            </div>
          </div>
        </CollapsibleSection>

        {/* Pain Points */}
        <CollapsibleSection title={`Pain Points (${editing.pain_points.length})`} section="pain" expanded={expandedSection} onToggle={toggleSection}>
          <ArrayEditor
            items={editing.pain_points}
            onUpdate={items => updateField('pain_points', items)}
            placeholder="Não tens tempo para publicar consistentemente?"
          />
        </CollapsibleSection>

        {/* Benefits */}
        <CollapsibleSection title={`Benefícios (${editing.benefits.length})`} section="benefits" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-3">
            {editing.benefits.map((b, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input value={b.title} onChange={e => {
                    const arr = [...editing.benefits];
                    arr[i] = { ...arr[i], title: e.target.value };
                    updateField('benefits', arr);
                  }} placeholder="Título" />
                  <Input value={b.desc} onChange={e => {
                    const arr = [...editing.benefits];
                    arr[i] = { ...arr[i], desc: e.target.value };
                    updateField('benefits', arr);
                  }} placeholder="Descrição" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  updateField('benefits', editing.benefits.filter((_, j) => j !== i));
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => updateField('benefits', [...editing.benefits, { title: '', desc: '' }])}>
              <Plus className="h-4 w-4 mr-1" />Adicionar
            </Button>
          </div>
        </CollapsibleSection>

        {/* Process */}
        <CollapsibleSection title={`Processo (${editing.process.length})`} section="process" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-3">
            {editing.process.map((p, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <Input value={p.step} onChange={e => {
                    const arr = [...editing.process];
                    arr[i] = { ...arr[i], step: e.target.value };
                    updateField('process', arr);
                  }} placeholder="01" className="w-20" />
                  <Input value={p.title} onChange={e => {
                    const arr = [...editing.process];
                    arr[i] = { ...arr[i], title: e.target.value };
                    updateField('process', arr);
                  }} placeholder="Título" />
                  <Input value={p.desc} onChange={e => {
                    const arr = [...editing.process];
                    arr[i] = { ...arr[i], desc: e.target.value };
                    updateField('process', arr);
                  }} placeholder="Descrição" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  updateField('process', editing.process.filter((_, j) => j !== i));
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => {
              const step = String(editing.process.length + 1).padStart(2, '0');
              updateField('process', [...editing.process, { step, title: '', desc: '' }]);
            }}>
              <Plus className="h-4 w-4 mr-1" />Adicionar
            </Button>
          </div>
        </CollapsibleSection>

        {/* Results */}
        <CollapsibleSection title={`Resultados (${editing.results.length})`} section="results" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-3">
            {editing.results.map((r, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input value={r.value} onChange={e => {
                    const arr = [...editing.results];
                    arr[i] = { ...arr[i], value: e.target.value };
                    updateField('results', arr);
                  }} placeholder="+250%" />
                  <Input value={r.label} onChange={e => {
                    const arr = [...editing.results];
                    arr[i] = { ...arr[i], label: e.target.value };
                    updateField('results', arr);
                  }} placeholder="Engagement médio" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  updateField('results', editing.results.filter((_, j) => j !== i));
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => updateField('results', [...editing.results, { value: '', label: '' }])}>
              <Plus className="h-4 w-4 mr-1" />Adicionar
            </Button>
          </div>
        </CollapsibleSection>

        {/* FAQ */}
        <CollapsibleSection title={`FAQ (${editing.faq.length})`} section="faq" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-3">
            {editing.faq.map((f, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="flex-1 space-y-2">
                  <Input value={f.q} onChange={e => {
                    const arr = [...editing.faq];
                    arr[i] = { ...arr[i], q: e.target.value };
                    updateField('faq', arr);
                  }} placeholder="Pergunta" />
                  <Textarea value={f.a} onChange={e => {
                    const arr = [...editing.faq];
                    arr[i] = { ...arr[i], a: e.target.value };
                    updateField('faq', arr);
                  }} rows={2} placeholder="Resposta" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  updateField('faq', editing.faq.filter((_, j) => j !== i));
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => updateField('faq', [...editing.faq, { q: '', a: '' }])}>
              <Plus className="h-4 w-4 mr-1" />Adicionar
            </Button>
          </div>
        </CollapsibleSection>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Serviços</h2>
          <p className="text-muted-foreground text-sm mt-1">{services.length} serviços</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Novo Serviço</Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">A carregar...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Nenhum serviço encontrado.</div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <Card key={s.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                <span className="text-2xl flex-shrink-0">{s.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.headline || s.key}</h3>
                    <Badge variant={s.status === 'published' ? 'default' : 'secondary'}>
                      {s.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>{s.price}</span>
                    <span>/{s.slug}</span>
                    <span>Ordem: {s.sort_order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" title={s.status === 'published' ? 'Despublicar' : 'Publicar'} onClick={() => toggleStatus(s)}>
                    {s.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteService(s.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// Image upload field
const ImageUploadField = ({ onUploaded }: { onUploaded: (url: string) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Ficheiro deve ser uma imagem'); return; }
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `services/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('blog-images').upload(path, file);
    if (error) { toast.error('Erro ao carregar imagem'); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from('blog-images').getPublicUrl(path);
    onUploaded(urlData.publicUrl);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="gap-2">
        <Upload className="h-4 w-4" />
        {uploading ? 'A carregar...' : 'Selecionar imagem'}
      </Button>
      <p className="text-xs text-muted-foreground mt-1">Máx. 5MB · JPG, PNG, WebP</p>
    </div>
  );
};


const CollapsibleSection = ({
  title, section, expanded, onToggle, children,
}: {
  title: string; section: string; expanded: string | null;
  onToggle: (s: string) => void; children: React.ReactNode;
}) => (
  <Card className="border-border">
    <button
      type="button"
      onClick={() => onToggle(section)}
      className="w-full flex items-center justify-between p-4 text-left"
    >
      <h3 className="font-semibold">{title}</h3>
      {expanded === section ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {expanded === section && <CardContent className="pt-0 pb-4 px-4">{children}</CardContent>}
  </Card>
);

// Simple string array editor
const ArrayEditor = ({
  items, onUpdate, placeholder,
}: {
  items: string[]; onUpdate: (items: string[]) => void; placeholder: string;
}) => (
  <div className="space-y-2">
    {items.map((item, i) => (
      <div key={i} className="flex gap-2">
        <Input
          value={item}
          onChange={e => {
            const arr = [...items];
            arr[i] = e.target.value;
            onUpdate(arr);
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button variant="ghost" size="icon" onClick={() => onUpdate(items.filter((_, j) => j !== i))}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      </div>
    ))}
    <Button variant="outline" size="sm" onClick={() => onUpdate([...items, ''])}>
      <Plus className="h-4 w-4 mr-1" />Adicionar
    </Button>
  </div>
);

export default AdminServices;
