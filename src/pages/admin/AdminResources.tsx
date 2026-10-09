import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Save, X, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import MarketTabs from '@/components/admin/MarketTabs';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import {
  createEntryWithLocalization,
  deleteEntry,
  listEntries,
  logAdminAction,
  saveEntryWithLocalization,
  slugify,
  STATUS_LABELS,
  type ContentStatus,
  type EntryLocalizationRow,
  type EntryRow,
  type MarketCode,
} from '@/lib/adminContent';
import { MARKET_LOCALE } from '@/lib/markets';

/**
 * R1C8 — resources administration over Clean V1 `content_entries` (type
 * `guide`) + `content_localizations`.
 *
 * Field mapping:
 *  - title        → localization.title (also the landing headline)
 *  - subheadline  → localization.excerpt (also the card description)
 *  - benefits[]   → localization.body as `{ blocks: [{type:'list',items}] }`
 *  - link/cta/icon→ localization.body.extensions (ignored by the public
 *                   renderer, which renders only blocks — see contentBody.ts)
 *  - status       → localization.status AND entry.status (public reads require
 *                   both to be published)
 *  - category     → content_categories (stable key)
 *
 * The retired `resources` table columns (`sort_order`, `cta_text`, `icon`,
 * `link` as first-class fields) have no Clean V1 carrier; list order is
 * `updated_at` desc. The retired `resources` table is no longer read or
 * written anywhere on this page.
 */

type ResourceExtensions = {
  link?: string;
  cta_text?: string;
  icon?: string;
};

type EditingResource = {
  entryId: string | null;
  market: MarketCode;
  title: string;
  slug: string;
  slugTouched: boolean;
  categoryId: string;
  status: ContentStatus;
  subheadline: string;
  benefits: string[];
  link: string;
  ctaText: string;
  icon: string;
};

const emptyEditing = (market: MarketCode): EditingResource => ({
  entryId: null,
  market,
  title: '',
  slug: '',
  slugTouched: false,
  categoryId: 'none',
  status: 'draft',
  subheadline: '',
  benefits: [''],
  link: '#',
  ctaText: 'Download',
  icon: 'FileText',
});

type ResourceListRow = {
  entry: EntryRow;
  localization: EntryLocalizationRow | null;
};

const iconOptions = ['CheckSquare', 'FileText', 'Calculator', 'Book', 'Calendar', 'Search'];

function readExtensions(body: unknown): ResourceExtensions {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return {};
  const extensions = (body as Record<string, unknown>).extensions;
  if (typeof extensions !== 'object' || extensions === null || Array.isArray(extensions)) return {};
  const out: ResourceExtensions = {};
  for (const key of ['link', 'cta_text', 'icon'] as const) {
    const value = (extensions as Record<string, unknown>)[key];
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

function readBenefitBlocks(body: unknown): string[] {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return [];
  const blocks = (body as Record<string, unknown>).blocks;
  if (!Array.isArray(blocks)) return [];
  const items: string[] = [];
  for (const block of blocks) {
    if (typeof block !== 'object' || block === null) continue;
    const record = block as Record<string, unknown>;
    if (record.type === 'list' && Array.isArray(record.items)) {
      for (const item of record.items) {
        if (typeof item === 'string') items.push(item);
      }
    }
  }
  return items;
}

function buildBody(benefits: string[], extensions: ResourceExtensions): Record<string, unknown> {
  return {
    blocks: [{ type: 'list', items: benefits.filter((b) => b.trim()) }],
    extensions,
  };
}

const AdminResources = () => {
  const [rows, setRows] = useState<ResourceListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingResource | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [marketFilter, setMarketFilter] = useState<MarketCode | 'all'>('all');
  const { categories } = useBlogCategories();

  useEffect(() => { fetchResources(); }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      const entries = await listEntries('guide');
      const flattened: ResourceListRow[] = [];
      for (const { entry, localizations } of entries) {
        if (localizations.length === 0) flattened.push({ entry, localization: null });
        else for (const localization of localizations) flattened.push({ entry, localization });
      }
      setRows(flattened);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar recursos');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          marketFilter === 'all' ||
          row.localization === null ||
          row.localization.market === marketFilter,
      ),
    [rows, marketFilter],
  );

  const startNew = () => {
    setEditing(emptyEditing(marketFilter === 'all' ? 'PT' : marketFilter));
    setIsNew(true);
    setExpandedSection('basic');
  };

  const startEdit = (row: ResourceListRow) => {
    const loc = row.localization;
    setEditing({
      entryId: row.entry.id,
      market: (loc?.market as MarketCode) ?? 'PT',
      title: loc?.title ?? '',
      slug: loc?.slug ?? '',
      slugTouched: true,
      categoryId: row.entry.category_id ?? 'none',
      status: loc?.status ?? 'draft',
      subheadline: loc?.excerpt ?? '',
      benefits: readBenefitBlocks(loc?.body),
      link: readExtensions(loc?.body).link ?? '#',
      ctaText: readExtensions(loc?.body).cta_text ?? 'Download',
      icon: readExtensions(loc?.body).icon ?? 'FileText',
    });
    setIsNew(false);
    setExpandedSection('basic');
  };

  const cancel = () => { setEditing(null); setIsNew(false); };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error('Preenche os campos obrigatórios: título.');
      return;
    }
    const finalSlug = editing.slug.trim() || slugify(editing.title);
    if (!finalSlug) {
      toast.error('O slug é obrigatório.');
      return;
    }

    const localization = {
      market: editing.market,
      locale: MARKET_LOCALE[editing.market],
      title: editing.title.trim(),
      slug: finalSlug,
      excerpt: editing.subheadline.trim() || null,
      body: buildBody(editing.benefits, {
        link: editing.link,
        cta_text: editing.ctaText,
        icon: editing.icon,
      }),
      seo_title: null,
      seo_description: null,
      og_image_path: null,
      status: editing.status,
    };
    const entryFields = {
      author_id: null,
      category_id: editing.categoryId === 'none' ? null : editing.categoryId,
      cover_media_path: null,
      featured: false,
      status: editing.status,
    };

    try {
      if (isNew || !editing.entryId) {
        const { entry } = await createEntryWithLocalization(
          { content_type: 'guide', primary_market: editing.market, ...entryFields },
          localization,
        );
        toast.success(editing.status === 'published' ? 'Recurso publicado!' : 'Recurso criado!');
        void logAdminAction('content.create', 'content_entry', entry.id, {
          content_type: 'guide',
          market: editing.market,
          status: editing.status,
        });
      } else {
        await saveEntryWithLocalization(editing.entryId, entryFields, localization);
        toast.success(editing.status === 'published' ? 'Recurso publicado!' : 'Recurso atualizado!');
        void logAdminAction('content.save', 'content_entry', editing.entryId, {
          market: editing.market,
          status: editing.status,
        });
      }
      setEditing(null);
      setIsNew(false);
      fetchResources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar.');
    }
  };

  const deleteResource = async (entryId: string, title: string) => {
    if (!confirm('Tens a certeza que queres eliminar este recurso?')) return;
    try {
      await deleteEntry(entryId);
      toast.success('Recurso eliminado');
      void logAdminAction('content.delete', 'content_entry', entryId, { title });
      fetchResources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar');
    }
  };

  const toggleStatus = async (row: ResourceListRow) => {
    const loc = row.localization;
    if (!loc) return;
    const newStatus: ContentStatus = loc.status === 'published' ? 'draft' : 'published';
    try {
      await saveEntryWithLocalization(
        row.entry.id,
        {
          author_id: row.entry.author_id,
          category_id: row.entry.category_id,
          cover_media_path: row.entry.cover_media_path,
          featured: row.entry.featured,
          status: newStatus,
        },
        {
          market: loc.market,
          locale: loc.locale,
          title: loc.title,
          slug: loc.slug,
          excerpt: loc.excerpt,
          body: loc.body,
          seo_title: loc.seo_title,
          seo_description: loc.seo_description,
          og_image_path: loc.og_image_path,
          status: newStatus,
        },
      );
      toast.success(newStatus === 'published' ? 'Recurso publicado' : 'Recurso despublicado');
      void logAdminAction('content.status', 'content_entry', row.entry.id, {
        market: loc.market,
        status: newStatus,
      });
      fetchResources();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar estado');
    }
  };

  const updateField = (field: keyof EditingResource, value: unknown) => {
    if (!editing) return;
    setEditing({ ...editing, [field]: value } as EditingResource);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const categoryName = (categoryId: string | null) =>
    categories.find((c) => c.id === categoryId)?.name ?? '—';

  // Editor view
  if (editing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{isNew ? 'Novo Recurso' : 'Editar Recurso'}</h2>
          <div className="flex gap-2 items-center">
            <MarketTabs value={editing.market} onChange={(m) => m !== 'all' && updateField('market', m)} allowAll={false} />
            <Button variant="outline" onClick={cancel}><X className="h-4 w-4 mr-2" />Cancelar</Button>
            <Button onClick={save}><Save className="h-4 w-4 mr-2" />Guardar</Button>
          </div>
        </div>

        {/* Basic Info */}
        <CollapsibleSection title="Informações Básicas" section="basic" expanded={expandedSection} onToggle={toggleSection}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Título *</label>
              <Input
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setEditing({
                    ...editing,
                    title,
                    slug: editing.slugTouched ? editing.slug : slugify(title),
                  });
                }}
                placeholder="Checklist de SEO On-Page"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Slug</label>
              <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value, slugTouched: true })} placeholder="checklist-seo" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Categoria</label>
              <Select value={editing.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
                <SelectTrigger><SelectValue placeholder="Sem categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ícone</label>
              <Select value={editing.icon} onValueChange={(v) => updateField('icon', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {iconOptions.map((ic) => (
                    <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Link do recurso</label>
              <Input value={editing.link} onChange={(e) => updateField('link', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Texto do CTA</label>
              <Input value={editing.ctaText} onChange={(e) => updateField('ctaText', e.target.value)} placeholder="Quero a Checklist!" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Estado</label>
              <Select value={editing.status} onValueChange={(v) => updateField('status', v as ContentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="published">Publicado</SelectItem>
                  <SelectItem value="archived">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleSection>

        {/* Headline & Description */}
        <CollapsibleSection title="Headline & Descrição" section="headline" expanded={expandedSection} onToggle={toggleSection}>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Subheadline</label>
              <Textarea value={editing.subheadline} onChange={(e) => updateField('subheadline', e.target.value)} rows={3} placeholder="Descrição detalhada da landing page..." />
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
                  onChange={(e) => {
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
          <p className="text-muted-foreground text-sm mt-1">{filtered.length} recursos</p>
        </div>
        <div className="flex items-center gap-2">
          <MarketTabs value={marketFilter} onChange={setMarketFilter} />
          <Button onClick={startNew}><Plus className="h-4 w-4 mr-2" />Novo Recurso</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-muted-foreground">A carregar...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Nenhum recurso encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ entry, localization }) => {
            const title = localization?.title ?? '(sem localização)';
            return (
              <Card key={`${entry.id}:${localization?.id ?? 'none'}`} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground/40 flex-shrink-0" />
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{title}</h3>
                      {localization && (
                        <Badge variant="outline">{localization.market}</Badge>
                      )}
                      <Badge variant={localization?.status === 'published' ? 'default' : 'secondary'}>
                        {localization ? STATUS_LABELS[localization.status] : 'Sem localização'}
                      </Badge>
                      <Badge variant="outline">{categoryName(entry.category_id)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 truncate">{localization?.excerpt ?? '—'}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {localization && (
                      <Button variant="ghost" size="icon" title={localization.status === 'published' ? 'Despublicar' : 'Publicar'} onClick={() => toggleStatus({ entry, localization })}>
                        {localization.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => startEdit({ entry, localization })}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteResource(entry.id, title)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
