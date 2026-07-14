import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Save, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';

type Resource = {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  link: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  cta_text: string;
  sort_order: number;
  status: string;
};

const emptyResource: Omit<Resource, 'id'> = {
  title: '',
  description: '',
  category: 'guides',
  icon: 'FileText',
  link: '#',
  headline: '',
  subheadline: '',
  benefits: [''],
  cta_text: 'Download',
  sort_order: 0,
  status: 'draft',
};

const categoryLabels: Record<string, string> = {
  guides: 'Guias',
  templates: 'Templates',
  tools: 'Ferramentas',
};

const iconOptions = ['CheckSquare', 'FileText', 'Calculator', 'Book', 'Calendar', 'Search'];

const AdminResources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) {
      toast.error('Erro ao carregar recursos');
    } else {
      setResources((data || []) as unknown as Resource[]);
    }
    setLoading(false);
  };

  const startNew = () => {
    setEditing({ ...emptyResource, id: '', sort_order: resources.length + 1 } as Resource);
    setIsNew(true);
    setExpandedSection('basic');
  };

  const startEdit = (r: Resource) => {
    setEditing({ ...r, benefits: Array.isArray(r.benefits) ? r.benefits : [] });
    setIsNew(false);
    setExpandedSection('basic');
  };

  const cancel = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim() || !editing.headline.trim()) {
      toast.error('Preenche os campos obrigatórios: título e headline.');
      return;
    }

    const payload = {
      title: editing.title,
      description: editing.description,
      category: editing.category,
      icon: editing.icon,
      link: editing.link,
      headline: editing.headline,
      subheadline: editing.subheadline,
      benefits: editing.benefits.filter(b => b.trim()),
      cta_text: editing.cta_text,
      sort_order: editing.sort_order,
      status: editing.status,
    };

    if (isNew) {
      const { error } = await supabase.from('resources').insert(payload);
      if (error) { toast.error('Erro ao criar recurso'); return; }
      toast.success('Recurso criado!');
    } else {
      const { error } = await supabase.from('resources').update(payload).eq('id', editing.id);
      if (error) { toast.error('Erro ao atualizar recurso'); return; }
      toast.success('Recurso atualizado!');
    }
    setEditing(null);
    setIsNew(false);
    fetchResources();
  };

  const deleteResource = async (id: string) => {
    if (!confirm('Tens a certeza que queres eliminar este recurso?')) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar'); return; }
    toast.success('Recurso eliminado');
    fetchResources();
  };

  const toggleStatus = async (r: Resource) => {
    const newStatus = r.status === 'published' ? 'draft' : 'published';
    const { error } = await supabase.from('resources').update({ status: newStatus }).eq('id', r.id);
    if (error) { toast.error('Erro ao atualizar estado'); return; }
    toast.success(newStatus === 'published' ? 'Recurso publicado' : 'Recurso despublicado');
    fetchResources();
  };

  const updateField = (field: string, value: unknown) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Editor view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{isNew ? 'Novo Recurso' : 'Editar Recurso'}</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={cancel}><X className="h-4 w-4 mr-2" />Cancelar</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-2" />Guardar</Button>
          </div>
        </div>

        {/* Basic Info */}
        <CollapsibleSection title="Informações Básicas" section="basic" expanded={expandedSection} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título *</label>
              <Input value={editing.title} onChange={e => updateField('title', e.target.value)} placeholder="Checklist de SEO On-Page" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={editing.category} onValueChange={v => updateField('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="guides">Guias</SelectItem>
                  <SelectItem value="templates">Templates</SelectItem>
                  <SelectItem value="tools">Ferramentas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ícone</label>
              <Select value={editing.icon} onValueChange={v => updateField('icon', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map(ic => (
                    <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Link do recurso</label>
              <Input value={editing.link} onChange={e => updateField('link', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Texto do CTA</label>
              <Input value={editing.cta_text} onChange={e => updateField('cta_text', e.target.value)} placeholder="Quero a Checklist!" />
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
          </div>
        </CollapsibleSection>

        {/* Headline & Description */}
        <CollapsibleSection title="Headline & Descrição" section="headline" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Headline *</label>
              <Input value={editing.headline} onChange={e => updateField('headline', e.target.value)} placeholder="Checklist de SEO On-Page" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subheadline</label>
              <Textarea value={editing.subheadline} onChange={e => updateField('subheadline', e.target.value)} rows={3} placeholder="Descrição detalhada da landing page..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Descrição curta (card)</label>
              <Textarea value={editing.description} onChange={e => updateField('description', e.target.value)} rows={2} placeholder="Lista completa com 50+ itens..." />
            </div>
          </div>
        </CollapsibleSection>

        {/* Benefits */}
        <CollapsibleSection title={`Benefícios (${editing.benefits.length})`} section="benefits" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-2">
            {editing.benefits.map((item, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={item}
                  onChange={e => {
                    const arr = [...editing.benefits];
                    arr[i] = e.target.value;
                    updateField('benefits', arr);
                  }}
                  placeholder="Benefício do recurso"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => updateField('benefits', editing.benefits.filter((_, j) => j !== i))}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => updateField('benefits', [...editing.benefits, ''])}>
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
          <h2 className="text-2xl font-bold">Recursos</h2>
          <p className="text-muted-foreground text-sm mt-1">{resources.length} recursos</p>
        </div>
        <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Novo Recurso</Button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">A carregar...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Nenhum recurso encontrado.</div>
      ) : (
        <div className="space-y-3">
          {resources.map(r => (
            <Card key={r.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{r.title}</h3>
                    <Badge variant={r.status === 'published' ? 'default' : 'secondary'}>
                      {r.status === 'published' ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    <Badge variant="outline">{categoryLabels[r.category] || r.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 truncate">{r.description}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" title={r.status === 'published' ? 'Despublicar' : 'Publicar'} onClick={() => toggleStatus(r)}>
                    {r.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(r)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteResource(r.id)}>
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

// Collapsible section component
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

export default AdminResources;
