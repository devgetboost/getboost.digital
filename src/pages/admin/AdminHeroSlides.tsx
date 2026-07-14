import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, ArrowUp, ArrowDown, ImageIcon, Loader2,
} from 'lucide-react';
import type { HeroSlide } from '@/components/HeroCarousel';

const MAX_ACTIVE = 5;

type Editable = Omit<HeroSlide, 'id'> & { id?: string };

const empty: Editable = {
  image_url: '',
  title: '',
  subtitle: '',
  badge_new: false,
  badge_label: '',
  cta_primary_label: '',
  cta_primary_href: '',
  cta_secondary_label: '',
  cta_secondary_href: '',
  order_index: 0,
  is_active: true,
};

export default function AdminHeroSlides() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Editable>(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hero_slides').select('*').order('order_index', { ascending: true });
    if (error) toast.error(error.message);
    setSlides((data as HeroSlide[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const activeCount = slides.filter(s => s.is_active).length;

  const openNew = () => {
    setEditing({ ...empty, order_index: slides.length });
    setOpen(true);
  };
  const openEdit = (s: HeroSlide) => {
    setEditing({ ...s });
    setOpen(true);
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('hero-banners').upload(path, file, {
      cacheControl: '3600', upsert: false,
    });
    if (error) {
      toast.error(`Erro no upload: ${error.message}`);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('hero-banners').getPublicUrl(path);
    setEditing(prev => ({ ...prev, image_url: data.publicUrl }));
    setUploading(false);
    toast.success('Imagem carregada');
  };

  const save = async () => {
    if (!editing.title.trim() || !editing.image_url) {
      toast.error('Título e imagem são obrigatórios');
      return;
    }
    if (editing.is_active && !editing.id) {
      if (activeCount >= MAX_ACTIVE) {
        toast.error(`Máximo ${MAX_ACTIVE} banners ativos. Desativa um primeiro.`);
        return;
      }
    }
    setSaving(true);
    const payload = {
      image_url: editing.image_url,
      title: editing.title.trim(),
      subtitle: editing.subtitle?.trim() || null,
      badge_new: editing.badge_new,
      badge_label: editing.badge_label?.trim() || null,
      cta_primary_label: editing.cta_primary_label?.trim() || null,
      cta_primary_href: editing.cta_primary_href?.trim() || null,
      cta_secondary_label: editing.cta_secondary_label?.trim() || null,
      cta_secondary_href: editing.cta_secondary_href?.trim() || null,
      order_index: editing.order_index,
      is_active: editing.is_active,
    };
    const { error } = editing.id
      ? await supabase.from('hero_slides').update(payload).eq('id', editing.id)
      : await supabase.from('hero_slides').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(editing.id ? 'Banner atualizado' : 'Banner criado');
    setOpen(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Apagar este banner?')) return;
    const { error } = await supabase.from('hero_slides').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Banner apagado');
    load();
  };

  const toggleActive = async (s: HeroSlide) => {
    if (!s.is_active && activeCount >= MAX_ACTIVE) {
      toast.error(`Máximo ${MAX_ACTIVE} banners ativos`);
      return;
    }
    await supabase.from('hero_slides').update({ is_active: !s.is_active }).eq('id', s.id);
    load();
  };

  const move = async (s: HeroSlide, dir: -1 | 1) => {
    const sorted = [...slides].sort((a, b) => a.order_index - b.order_index);
    const idx = sorted.findIndex(x => x.id === s.id);
    const swap = sorted[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from('hero_slides').update({ order_index: swap.order_index }).eq('id', s.id),
      supabase.from('hero_slides').update({ order_index: s.order_index }).eq('id', swap.id),
    ]);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banners do Hero</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gere até {MAX_ACTIVE} banners rotativos no topo da página inicial.
            Ativos: <b>{activeCount}/{MAX_ACTIVE}</b>
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />Novo banner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : slides.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          Ainda não há banners. Cria o primeiro para começar.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {slides.map((s, i) => (
            <Card key={s.id} className={s.is_active ? '' : 'opacity-60'}>
              <CardContent className="p-4 flex gap-4 items-center">
                <div className="w-32 h-20 rounded-md overflow-hidden bg-muted flex-shrink-0">
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full"><ImageIcon className="h-6 w-6 text-muted-foreground" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{s.title}</p>
                  {s.subtitle && <p className="text-sm text-muted-foreground truncate">{s.subtitle}</p>}
                  <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                    <span>Ordem: {s.order_index}</span>
                    <span>·</span>
                    <span>{s.is_active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Switch checked={s.is_active} onCheckedChange={() => toggleActive(s)} />
                  <Button size="icon" variant="ghost" disabled={i === 0} onClick={() => move(s, -1)}><ArrowUp className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" disabled={i === slides.length - 1} onClick={() => move(s, 1)}><ArrowDown className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing.id ? 'Editar banner' : 'Novo banner'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Imagem *</Label>
              {editing.image_url && (
                <div className="mb-2 aspect-[16/6] w-full rounded-md overflow-hidden bg-muted">
                  <img src={editing.image_url} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
              <Input type="file" accept="image/*" disabled={uploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
              {uploading && <p className="text-xs text-muted-foreground mt-1">A carregar…</p>}
            </div>
            <div>
              <Label>Título *</Label>
              <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} maxLength={120} />
            </div>
            <div>
              <Label>Subtítulo</Label>
              <Textarea value={editing.subtitle || ''} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} maxLength={300} rows={2} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={editing.badge_new} onCheckedChange={(v) => setEditing({ ...editing, badge_new: v })} />
              <Label>Mostrar etiqueta "Novo"</Label>
            </div>
            <div>
              <Label>Texto da etiqueta</Label>
              <Input value={editing.badge_label || ''} onChange={(e) => setEditing({ ...editing, badge_label: e.target.value })} maxLength={60} placeholder="Ex: Transformação Digital & IA" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>CTA principal — texto</Label>
                <Input value={editing.cta_primary_label || ''} onChange={(e) => setEditing({ ...editing, cta_primary_label: e.target.value })} maxLength={60} />
              </div>
              <div>
                <Label>CTA principal — link</Label>
                <Input value={editing.cta_primary_href || ''} onChange={(e) => setEditing({ ...editing, cta_primary_href: e.target.value })} placeholder="/booking" />
              </div>
              <div>
                <Label>CTA secundário — texto</Label>
                <Input value={editing.cta_secondary_label || ''} onChange={(e) => setEditing({ ...editing, cta_secondary_label: e.target.value })} maxLength={60} />
              </div>
              <div>
                <Label>CTA secundário — link</Label>
                <Input value={editing.cta_secondary_href || ''} onChange={(e) => setEditing({ ...editing, cta_secondary_href: e.target.value })} placeholder="/portfolio" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Ordem</Label>
                <Input type="number" value={editing.order_index} onChange={(e) => setEditing({ ...editing, order_index: Number(e.target.value) })} />
              </div>
              <div className="flex items-end gap-3">
                <Switch checked={editing.is_active} onCheckedChange={(v) => setEditing({ ...editing, is_active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving || uploading}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
