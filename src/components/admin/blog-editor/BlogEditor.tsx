import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import MarketTabs from '@/components/admin/MarketTabs';
import { useBlogCategories } from '@/hooks/useBlogCategories';
import {
  createEntryWithLocalization,
  getEntry,
  listAuthors,
  logAdminAction,
  saveEntryWithLocalization,
  slugify,
  STATUS_LABELS,
  type AuthorRow,
  type ContentStatus,
  type MarketCode,
} from '@/lib/adminContent';
import { MARKET_LOCALE } from '@/lib/markets';

/**
 * R1C8 — entry editor for `content_entries` (insight/guide) + one market
 * localization. Replaces the previous stub, which was never implemented.
 *
 * The market tab selects which localization is edited. Editing in a market
 * that has no localization yet creates one on save. The parent entry keeps
 * the localization's status so the public read path (which requires both to
 * be published) can never disagree with what the admin sees.
 *
 * `body` is edited as rich text (markdown/HTML string). The reader accepts
 * that shape alongside block-based jsonb, so a textarea is a legitimate
 * authoring surface for now.
 */
export default function BlogEditor({
  entryId,
  market: initialMarket,
  contentType,
  onBack,
  onSaved,
}: {
  entryId: string | null;
  market: MarketCode;
  contentType: 'insight' | 'guide';
  onBack: () => void;
  onSaved: () => void;
}) {
  const { categories } = useBlogCategories();
  const [authors, setAuthors] = useState<AuthorRow[]>([]);
  const [market, setMarket] = useState<MarketCode>(initialMarket);
  const [loading, setLoading] = useState(!!entryId);
  const [saving, setSaving] = useState(false);

  const [authorId, setAuthorId] = useState<string>('none');
  const [categoryId, setCategoryId] = useState<string>('none');
  const [featured, setFeatured] = useState(false);
  const [coverPath, setCoverPath] = useState('');
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [status, setStatus] = useState<ContentStatus>('draft');

  useEffect(() => {
    listAuthors().then(setAuthors).catch(() => setAuthors([]));
  }, []);

  useEffect(() => {
    if (!entryId) return;
    setLoading(true);
    getEntry(entryId)
      .then((row) => {
        if (!row) {
          toast.error('Conteúdo não encontrado.');
          onBack();
          return;
        }
        setAuthorId(row.entry.author_id ?? 'none');
        setCategoryId(row.entry.category_id ?? 'none');
        setFeatured(row.entry.featured);
        setCoverPath(row.entry.cover_media_path ?? '');
        const loc = row.localizations.find((l) => l.market === market);
        if (loc) {
          setTitle(loc.title);
          setSlug(loc.slug);
          setSlugTouched(true);
          setExcerpt(loc.excerpt ?? '');
          setBody(typeof loc.body === 'string' ? loc.body : JSON.stringify(loc.body ?? '', null, 2));
          setSeoTitle(loc.seo_title ?? '');
          setSeoDescription(loc.seo_description ?? '');
          setStatus(loc.status);
        } else {
          setTitle('');
          setSlug('');
          setSlugTouched(false);
          setExcerpt('');
          setBody('');
          setSeoTitle('');
          setSeoDescription('');
          setStatus('draft');
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Erro ao carregar.');
        onBack();
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryId, market]);

  const save = async () => {
    if (!title.trim()) {
      toast.error('O título é obrigatório.');
      return;
    }
    const finalSlug = slug.trim() || slugify(title);
    if (!finalSlug) {
      toast.error('O slug é obrigatório.');
      return;
    }
    setSaving(true);
    try {
      const localization = {
        market,
        locale: MARKET_LOCALE[market],
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim() || null,
        body: body.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
        og_image_path: null,
        status,
      };
      const entryFields = {
        author_id: authorId === 'none' ? null : authorId,
        category_id: categoryId === 'none' ? null : categoryId,
        cover_media_path: coverPath.trim() || null,
        featured,
        status,
      };

      if (!entryId) {
        const { entry } = await createEntryWithLocalization(
          { content_type: contentType, primary_market: market, ...entryFields },
          localization,
        );
        toast.success(status === 'published' ? 'Conteúdo publicado!' : 'Rascunho guardado!');
        void logAdminAction('content.create', 'content_entry', entry.id, {
          content_type: contentType,
          market,
          status,
        });
      } else {
        await saveEntryWithLocalization(entryId, entryFields, localization);
        toast.success(status === 'published' ? 'Conteúdo publicado!' : 'Rascunho guardado!');
        void logAdminAction('content.save', 'content_entry', entryId, { market, status });
      }
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar.');
    } finally {
      setSaving(false);
    }
  };

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
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Voltar à lista
        </button>
        <div className="flex items-center gap-2">
          <MarketTabs value={market} onChange={(m) => m !== 'all' && setMarket(m)} allowAll={false} />
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Guardar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Título *</Label>
            <Input
              value={title}
              onChange={(e) => {
                const value = e.target.value;
                setTitle(value);
                if (!slugTouched) setSlug(slugify(value));
              }}
              placeholder="Título do conteúdo..."
              className="text-lg font-semibold"
            />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Slug</Label>
            <Input
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
              placeholder="url-do-conteudo"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Único por mercado. O slug define o URL: /blog/{slug || '...'} ({market}).
            </p>
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Resumo</Label>
            <Textarea value={excerpt} onChange={(e) => setExcerpt(e.target.value)} rows={2} placeholder="Resumo curto para listagens e SEO..." />
          </div>
          <div>
            <Label className="text-sm font-medium mb-1.5 block">Conteúdo</Label>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={18}
              placeholder="Texto em markdown ou HTML..."
              className="font-mono text-sm"
            />
          </div>
          <Card className="border-border">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">SEO</h3>
              <div>
                <Label className="text-sm mb-1.5 block">Título SEO</Label>
                <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder="Título para motores de pesquisa..." />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Descrição SEO</Label>
                <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} rows={2} placeholder="Meta description..." />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="border-border">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Definições</h3>
              <div>
                <Label className="text-sm mb-1.5 block">Estado</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as ContentStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Categoria</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
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
                <Label className="text-sm mb-1.5 block">Autor</Label>
                <Select value={authorId} onValueChange={setAuthorId}>
                  <SelectTrigger><SelectValue placeholder="Sem autor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem autor</SelectItem>
                    {authors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">Destaque</Label>
                <Switch checked={featured} onCheckedChange={setFeatured} />
              </div>
              <div>
                <Label className="text-sm mb-1.5 block">Imagem de capa (caminho)</Label>
                <Input value={coverPath} onChange={(e) => setCoverPath(e.target.value)} placeholder="covers/artigo.jpg" />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Caminho no bucket public-media.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
