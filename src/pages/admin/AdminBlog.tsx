import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Plus, Search, Edit, Trash2, Star, Calendar, Loader2, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { useBlogCategories, type BlogCategory } from '@/hooks/useBlogCategories';
import MarketTabs from '@/components/admin/MarketTabs';
import {
  deleteCategory,
  deleteEntry,
  listEntries,
  logAdminAction,
  saveCategoryWithLocalization,
  createCategoryWithLocalization,
  slugify,
  STATUS_LABELS,
  type AdminContentError,
  type CategoryLocalizationRow,
  type EntryLocalizationRow,
  type EntryRow,
  type MarketCode,
} from '@/lib/adminContent';
import { MARKET_LOCALE } from '@/lib/markets';
import { mediaUrl } from '@/lib/contentApi';
import type { MarketCode as EnvMarketCode } from '@/config/env';
import BlogEditor from '@/components/admin/blog-editor/BlogEditor';

type EntryListRow = {
  entry: EntryRow;
  localization: EntryLocalizationRow | null;
};

/**
 * R1C8 — blog administration over the Clean V1 `content_entries` (type
 * `insight`) + `content_localizations` tables.
 *
 * One row per (entry, localization): a market tab scopes the list, and the
 * editor always saves exactly one market at a time. The retired `blog_posts`
 * table (slug/category/image/read_time/meta_* columns) is no longer read or
 * written anywhere on this page.
 */
const AdminBlog = () => {
  const [rows, setRows] = useState<EntryListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [marketFilter, setMarketFilter] = useState<MarketCode | 'all'>('all');
  const [editing, setEditing] = useState<{ entryId: string | null; market: MarketCode } | null>(null);
  const { categories, refetch: refetchCategories } = useBlogCategories();
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [newCatKey, setNewCatKey] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [catMarket, setCatMarket] = useState<MarketCode>('PT');
  const [editingCat, setEditingCat] = useState<BlogCategory | null>(null);
  const [editCatKey, setEditCatKey] = useState('');
  const [editCatName, setEditCatName] = useState('');

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const entries = await listEntries('insight');
      const flattened: EntryListRow[] = [];
      for (const { entry, localizations } of entries) {
        if (localizations.length === 0) flattened.push({ entry, localization: null });
        else for (const localization of localizations) flattened.push({ entry, localization });
      }
      setRows(flattened);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar artigos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const startNew = () => {
    setEditing({ entryId: null, market: marketFilter === 'all' ? 'PT' : marketFilter });
  };

  const startEdit = (row: EntryListRow) => {
    setEditing({ entryId: row.entry.id, market: (row.localization?.market as MarketCode) ?? 'PT' });
  };

  const deletePost = async (entryId: string, title: string) => {
    try {
      await deleteEntry(entryId);
      toast.success('Artigo eliminado.');
      void logAdminAction('content.delete', 'content_entry', entryId, { title });
      fetchPosts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar.');
    }
  };

  const addCategory = async () => {
    const key = newCatKey.trim();
    const name = newCatName.trim();
    if (!key || !name) return;
    try {
      await createCategoryWithLocalization(
        { key, sort_order: categories.length + 1 },
        { market: catMarket, locale: MARKET_LOCALE[catMarket], name, slug: slugify(name), description: null },
      );
      toast.success('Categoria criada!');
      setNewCatKey('');
      setNewCatName('');
      refetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar categoria.');
    }
  };

  const updateCategory = async () => {
    if (!editingCat || !editCatKey.trim() || !editCatName.trim()) return;
    try {
      await saveCategoryWithLocalization(
        editingCat.id,
        { key: editCatKey.trim(), sort_order: editingCat.sort_order },
        {
          market: catMarket,
          locale: MARKET_LOCALE[catMarket],
          name: editCatName.trim(),
          slug: slugify(editCatName.trim()),
          description: null,
        },
      );
      toast.success('Categoria atualizada!');
      setEditingCat(null);
      refetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar.');
    }
  };

  const removeCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success('Categoria eliminada!');
      refetchCategories();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar.');
    }
  };

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const title = row.localization?.title ?? '(sem localização)';
        const matchSearch = title.toLowerCase().includes(search.toLowerCase());
        const matchCategory =
          categoryFilter === 'all' ||
          row.entry.category_id === categoryFilter;
        const matchMarket =
          marketFilter === 'all' || row.localization?.market === marketFilter;
        return matchSearch && matchCategory && matchMarket;
      }),
    [rows, search, categoryFilter, marketFilter],
  );

  const published = rows.filter((r) => r.localization?.status === 'published').length;
  const drafts = rows.filter((r) => !r.localization || r.localization.status !== 'published').length;

  // Editor view
  if (editing) {
    return (
      <BlogEditor
        entryId={editing.entryId}
        market={editing.market}
        contentType="insight"
        onBack={() => setEditing(null)}
        onSaved={() => { setEditing(null); fetchPosts(); }}
      />
    );
  }

  // List view
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Blog</h2>
        <div className="flex items-center gap-2">
          <MarketTabs value={marketFilter} onChange={setMarketFilter} />
          <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1.5">
                <Settings className="h-4 w-4" /> Categorias
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Gerir Categorias</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <MarketTabs value={catMarket} onChange={(m) => m !== 'all' && setCatMarket(m)} allowAll={false} />
                <div className="flex gap-2">
                  <Input
                    value={newCatKey}
                    onChange={e => setNewCatKey(e.target.value)}
                    placeholder="Chave (ex: marketing)..."
                    className="h-9 text-sm"
                  />
                  <Input
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    placeholder="Nome..."
                    className="h-9 text-sm"
                    onKeyDown={e => e.key === 'Enter' && addCategory()}
                  />
                  <Button size="sm" onClick={addCategory} disabled={!newCatKey.trim() || !newCatName.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-secondary/30">
                      {editingCat?.id === cat.id ? (
                        <>
                          <Input
                            value={editCatName}
                            onChange={e => setEditCatName(e.target.value)}
                            className="h-8 text-sm flex-1"
                            onKeyDown={e => e.key === 'Enter' && updateCategory()}
                            autoFocus
                          />
                          <Button size="sm" variant="ghost" onClick={updateCategory} className="h-8 px-2 text-primary">
                            Guardar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingCat(null)} className="h-8 px-2">
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-foreground block truncate">{cat.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{cat.key}</span>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setEditingCat(cat); setEditCatName(cat.name); setEditCatKey(cat.key); }}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground hover:text-destructive" onClick={() => removeCategory(cat.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada.</p>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" onClick={startNew} className="gap-1.5">
            <Plus className="h-4 w-4" /> Novo Artigo
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total', value: rows.length },
          { label: 'Publicados', value: published },
          { label: 'Rascunhos', value: drafts },
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
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar artigos..." className="pl-10" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Nenhum artigo encontrado.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ entry, localization }) => {
            const title = localization?.title ?? '(sem localização neste mercado)';
            const cover = mediaUrl(localization?.og_image_path ?? entry.cover_media_path);
            const status = (localization?.status ?? 'draft') as keyof typeof STATUS_LABELS;
            return (
              <Card key={`${entry.id}:${localization?.id ?? 'none'}`} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center gap-4">
                  {cover && <img src={cover} alt={title} className="w-20 h-14 object-cover rounded-lg shrink-0 hidden sm:block" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-foreground text-sm truncate">{title}</h3>
                      {entry.featured && <Star className="h-3.5 w-3.5 text-yellow-500 shrink-0" />}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {localization && (
                        <Badge variant="outline" className="text-xs">{localization.market}</Badge>
                      )}
                      <Badge variant={status === 'published' ? 'default' : 'secondary'} className="text-xs">
                        {STATUS_LABELS[status] ?? status}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(localization?.updated_at ?? entry.updated_at), "d MMM yyyy", { locale: pt })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEdit({ entry, localization })}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Eliminar artigo?</DialogTitle>
                        </DialogHeader>
                        <p className="text-sm text-muted-foreground">Tens a certeza que queres eliminar "{title}"? Todas as localizações serão eliminadas. Esta ação não pode ser revertida.</p>
                        <div className="flex justify-end gap-2 mt-4">
                          <DialogClose asChild>
                            <Button variant="outline" size="sm">Cancelar</Button>
                          </DialogClose>
                          <Button variant="destructive" size="sm" onClick={() => deletePost(entry.id, title)}>Eliminar</Button>
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

export default AdminBlog;
