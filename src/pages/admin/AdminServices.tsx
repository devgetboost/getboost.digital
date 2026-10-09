import { useState, useEffect } from 'react';
import MarketTabs from '@/components/admin/MarketTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Save, X, ChevronDown, ChevronUp, Upload, Link, ImageIcon, X as XIcon } from 'lucide-react';
import {
  createProductWithLocalization,
  deleteProduct,
  listProducts,
  logAdminAction,
  saveProductWithLocalization,
  slugify,
  uploadPublicMedia,
  type ContentStatus,
  type MarketCode,
  type ProductLocalizationRow,
  type ProductRow,
} from '@/lib/adminContent';
import { MARKET_LOCALE } from '@/lib/markets';
import { mediaUrl } from '@/lib/contentApi';

/**
 * R1C8 — product administration over the Clean V1 `products` +
 * `product_localizations` tables.
 *
 * Field mapping (the retired `services` table is no longer read or written):
 *  - name         → product.name
 *  - headline     → localization.tagline
 *  - subheadline  → localization.description
 *  - benefits[]   → product.capabilities (titles only: Clean V1 models one
 *                   string array, and the public page already renders desc
 *                   as empty — benefit descriptions had no live consumer)
 *  - image        → product.hero_media_path (object path in public-media)
 *  - status       → localization.status AND product.status
 *  - website_url  → product.website_url
 *
 * Dropped with no Clean V1 carrier (documented in ADMIN_TECH_DEBT): `key`
 * (superseded by the per-market slug), `icon`, `price`, `sort_order` (list
 * order is now `updated_at` desc), and the pain_points/process/results/faq
 * sections — the public page sources those from i18n copy, which takes
 * precedence over anything the old table held.
 */

type Service = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  capabilities: string[];
  heroMediaPath: string;
  market: MarketCode | null;
  status: ContentStatus;
  featured: boolean;
};

type ServiceRow = {
  product: ProductRow;
  localization: ProductLocalizationRow | null;
};

const emptyService: Omit<Service, 'id'> = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  websiteUrl: '',
  capabilities: [],
  heroMediaPath: '',
  market: null,
  status: 'draft',
  featured: false,
};

const AdminServices = () => {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [marketFilter, setMarketFilter] = useState<MarketCode | 'all'>('all');
  const [capabilityInput, setCapabilityInput] = useState('');

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const products = await listProducts();
      const flattened: ServiceRow[] = [];
      for (const { product, localizations } of products) {
        if (localizations.length === 0) flattened.push({ product, localization: null });
        else for (const localization of localizations) flattened.push({ product, localization });
      }
      setRows(flattened);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar serviços');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => slugify(text);

  const startNew = () => {
    setEditing({ ...emptyService, id: '', market: marketFilter === 'all' ? 'PT' : marketFilter } as Service);
    setIsNew(true);
    setExpandedSection('basic');
  };

  const startEdit = (row: ServiceRow) => {
    const loc = row.localization;
    setEditing({
      id: row.product.id,
      name: row.product.name,
      slug: loc?.slug ?? '',
      tagline: loc?.tagline ?? '',
      description: loc?.description ?? '',
      websiteUrl: row.product.website_url ?? '',
      capabilities: [...(row.product.capabilities ?? [])],
      heroMediaPath: row.product.hero_media_path ?? '',
      market: (loc?.market as MarketCode) ?? 'PT',
      status: loc?.status ?? 'draft',
      featured: row.product.featured,
    });
    setIsNew(false);
    setExpandedSection('basic');
  };

  const cancel = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error('Preenche os campos obrigatórios: nome.');
      return;
    }
    const finalSlug = editing.slug.trim() || generateSlug(editing.name);
    if (!finalSlug || !editing.market) {
      toast.error('O slug e o mercado são obrigatórios.');
      return;
    }

    const localization = {
      market: editing.market,
      locale: MARKET_LOCALE[editing.market],
      slug: finalSlug,
      tagline: editing.tagline.trim() || null,
      description: editing.description.trim() || null,
      seo_title: null,
      seo_description: null,
      status: editing.status,
    };
    const productFields = {
      name: editing.name.trim(),
      website_url: editing.websiteUrl.trim() || null,
      featured: editing.featured,
      logo_path: null,
      hero_media_path: editing.heroMediaPath.trim() || null,
      capabilities: editing.capabilities.filter((c) => c.trim()),
      status: editing.status,
    };

    try {
      if (isNew) {
        const { product } = await createProductWithLocalization(productFields, localization);
        toast.success(editing.status === 'published' ? 'Serviço publicado!' : 'Serviço criado!');
        void logAdminAction('content.create', 'product', product.id, {
          market: editing.market,
          status: editing.status,
        });
      } else {
        await saveProductWithLocalization(editing.id, productFields, localization);
        toast.success(editing.status === 'published' ? 'Serviço publicado!' : 'Serviço atualizado!');
        void logAdminAction('content.save', 'product', editing.id, {
          market: editing.market,
          status: editing.status,
        });
      }
      setEditing(null);
      setIsNew(false);
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar.');
    }
  };

  const deleteService = async (productId: string, name: string) => {
    if (!confirm('Tens a certeza que queres eliminar este serviço?')) return;
    try {
      await deleteProduct(productId);
      toast.success('Serviço eliminado');
      void logAdminAction('content.delete', 'product', productId, { name });
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar');
    }
  };

  const toggleStatus = async (row: ServiceRow) => {
    const loc = row.localization;
    if (!loc) return;
    const newStatus: ContentStatus = loc.status === 'published' ? 'draft' : 'published';
    try {
      await saveProductWithLocalization(
        row.product.id,
        {
          name: row.product.name,
          website_url: row.product.website_url,
          featured: row.product.featured,
          logo_path: row.product.logo_path,
          hero_media_path: row.product.hero_media_path,
          capabilities: row.product.capabilities,
          status: newStatus,
        },
        {
          market: loc.market,
          locale: loc.locale,
          slug: loc.slug,
          tagline: loc.tagline,
          description: loc.description,
          seo_title: loc.seo_title,
          seo_description: loc.seo_description,
          status: newStatus,
        },
      );
      toast.success(newStatus === 'published' ? 'Serviço publicado' : 'Serviço despublicado');
      void logAdminAction('content.status', 'product', row.product.id, {
        market: loc.market,
        status: newStatus,
      });
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar estado');
    }
  };

  const updateField = (field: string, value: unknown) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value });
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const services = rows
    .filter((row) => marketFilter === 'all' || !row.localization || row.localization.market === marketFilter)
    .map((row) => ({
      row,
      id: row.product.id,
      name: row.product.name,
      slug: row.localization?.slug ?? '(sem localização)',
      market: row.localization?.market ?? null,
      status: row.localization?.status ?? 'draft',
      tagline: row.localization?.tagline ?? '',
      heroMediaPath: row.product.hero_media_path,
    }));

  // If editing, show the editor
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{isNew ? 'Novo Serviço' : 'Editar Serviço'}</h2>
          <div className="flex gap-2 items-center">
            <MarketTabs value={editing.market ?? 'PT'} onChange={(m) => m !== 'all' && updateField('market', m)} allowAll={false} />
            <Button variant="outline" onClick={cancel}><X className="h-4 w-4 mr-2" />Cancelar</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-2" />Guardar</Button>
          </div>
        </div>

        {/* Basic Info */}
        <CollapsibleSection title="Informações Básicas" section="basic" expanded={expandedSection} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome *</label>
              <Input
                value={editing.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setEditing({ ...editing, name, slug: editing.slug || slugify(name) });
                }}
                placeholder="Gestão de Redes Sociais"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug *</label>
              <Input value={editing.slug} onChange={e => updateField('slug', e.target.value)} placeholder="gestao-redes-sociais" />
              <button type="button" className="text-xs text-primary mt-1" onClick={() => updateField('slug', generateSlug(editing.name))}>
                Gerar do nome
              </button>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Website</label>
              <Input value={editing.websiteUrl} onChange={e => updateField('websiteUrl', e.target.value)} placeholder="https://..." />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Destaque</label>
              <Switch checked={editing.featured} onCheckedChange={(v) => updateField('featured', v)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select value={editing.status} onValueChange={v => updateField('status', v as ContentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1 block">Imagem</label>
              {editing.heroMediaPath ? (
                <div className="relative w-full max-w-xs mb-2">
                  <img src={mediaUrl(editing.heroMediaPath)} alt="Preview" className="w-full h-40 object-cover rounded-lg border border-border" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => updateField('heroMediaPath', '')}>
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
                  <ImageUploadField onUploaded={(path) => updateField('heroMediaPath', path)} />
                </TabsContent>
                <TabsContent value="url">
                  <Input value={editing.heroMediaPath} onChange={e => updateField('heroMediaPath', e.target.value)} placeholder="https://... ou caminho public-media..." />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CollapsibleSection>

        {/* Headline & Subheadline */}
        <CollapsibleSection title="Headline & Descrição" section="headline" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Headline</label>
              <Input value={editing.tagline} onChange={e => updateField('tagline', e.target.value)} placeholder="A tua marca merece ser vista." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subheadline</label>
              <Textarea value={editing.description} onChange={e => updateField('description', e.target.value)} rows={3} placeholder="Descrição detalhada..." />
            </div>
          </div>
        </CollapsibleSection>

        {/* Capabilities */}
        <CollapsibleSection title={`Capacidades (${editing.capabilities.length})`} section="capabilities" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-2">
            {editing.capabilities.map((capability, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input
                  value={capability}
                  onChange={e => {
                    const arr = [...editing.capabilities];
                    arr[i] = e.target.value;
                    updateField('capabilities', arr);
                  }}
                  placeholder="Capacidade do serviço"
                  className="flex-1"
                />
                <Button variant="ghost" size="icon" onClick={() => {
                  updateField('capabilities', editing.capabilities.filter((_, j) => j !== i));
                }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                value={capabilityInput}
                onChange={(e) => setCapabilityInput(e.target.value)}
                placeholder="Nova capacidade..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (capabilityInput.trim()) {
                      updateField('capabilities', [...editing.capabilities, capabilityInput.trim()]);
                      setCapabilityInput('');
                    }
                  }
                }}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (capabilityInput.trim()) {
                    updateField('capabilities', [...editing.capabilities, capabilityInput.trim()]);
                    setCapabilityInput('');
                  }
                }}
              >
                <Plus className="h-4 w-4 mr-1" />Adicionar
              </Button>
            </div>
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
        <div className="flex items-center gap-2">
          <MarketTabs value={marketFilter} onChange={setMarketFilter} />
          <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Novo Serviço</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">A carregar...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Nenhum serviço encontrado.</div>
      ) : (
        <div className="space-y-3">
          {services.map(s => (
            <Card key={`${s.id}:${s.slug}`} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-5 flex items-center gap-4">
                <GripVertical className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                {s.heroMediaPath ? (
                  <img src={mediaUrl(s.heroMediaPath)} alt="" className="w-14 h-14 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <span className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
                    {(s.name || '?').slice(0, 1)}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{s.name || '(sem nome)'}</h3>
                    {s.market && <Badge variant="outline">{s.market}</Badge>}
                    <Badge variant={s.status === 'published' ? 'default' : 'secondary'}>
                      {s.status === 'published' ? 'Publicado' : s.status === 'archived' ? 'Arquivado' : 'Rascunho'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                    <span>/{s.slug}</span>
                    {s.tagline && <span className="truncate">{s.tagline}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(s.row)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteService(s.id, s.name)}>
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

// Image upload field — stores the object path in public-media, not a URL.
const ImageUploadField = ({ onUploaded }: { onUploaded: (path: string) => void }) => {
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const path = await uploadPublicMedia('products', file);
      onUploaded(path);
      toast.success('Imagem carregada!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar imagem');
    }
    e.target.value = '';
  };

  return (
    <div>
      <label className="inline-flex">
        <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <span className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm cursor-pointer hover:bg-accent">
          <Upload className="h-4 w-4" />
          Selecionar imagem
        </span>
      </label>
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

export default AdminServices;
