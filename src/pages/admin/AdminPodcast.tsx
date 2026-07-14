import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Upload, Save, X, Mic, Loader2, Play } from 'lucide-react';

type Episode = {
  id: string;
  episode_number: number | null;
  title: string;
  eyebrow: string | null;
  description: string | null;
  tags: string[];
  audio_url: string | null;
  cover_url: string | null;
  duration_seconds: number | null;
  published: boolean;
  sort_order: number;
};

const empty: Omit<Episode, 'id'> = {
  episode_number: null,
  title: '',
  eyebrow: '',
  description: '',
  tags: [],
  audio_url: null,
  cover_url: null,
  duration_seconds: null,
  published: true,
  sort_order: 0,
};

const fmtDur = (s: number | null) => {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
};

const AdminPodcast = () => {
  const [items, setItems] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<(Omit<Episode, 'id'> & { id?: string }) | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('podcast_episodes')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) return toast.error(error.message);
    setItems((data as Episode[]) || []);
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (file: File) => {
    if (!editing) return;
    setUploading(true);
    const ext = file.name.split('.').pop() || 'mp3';
    const path = `episodes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from('podcast-audio').upload(path, file, {
      contentType: file.type || 'audio/mpeg',
      upsert: false,
    });
    setUploading(false);
    if (error) return toast.error(`Upload falhou: ${error.message}`);

    // duration
    let duration: number | null = null;
    try {
      duration = await new Promise<number>((resolve, reject) => {
        const audio = new Audio();
        audio.preload = 'metadata';
        audio.onloadedmetadata = () => resolve(Math.round(audio.duration));
        audio.onerror = reject;
        audio.src = URL.createObjectURL(file);
      });
    } catch { /* ignore */ }

    setEditing({ ...editing, audio_url: path, duration_seconds: duration ?? editing.duration_seconds });
    toast.success('Áudio carregado');
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) return toast.error('Título é obrigatório');
    const payload = { ...editing };
    const { id, ...rest } = payload;
    const query = id
      ? supabase.from('podcast_episodes').update(rest).eq('id', id)
      : supabase.from('podcast_episodes').insert(rest);
    const { error } = await query;
    if (error) return toast.error(error.message);
    toast.success('Guardado');
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminar este episódio?')) return;
    const { error } = await supabase.from('podcast_episodes').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Eliminado');
    load();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mic className="h-6 w-6" /> Podcast BoostTalks</h1>
          <p className="text-sm text-muted-foreground">Gere episódios e áudios do podcast.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty, sort_order: items.length })}>
          <Plus className="h-4 w-4 mr-2" /> Novo episódio
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : (
        <div className="grid gap-3">
          {items.map((ep) => (
            <Card key={ep.id}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 text-center font-mono text-lg font-bold text-primary">
                  {ep.episode_number ?? '—'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">{ep.title}</h3>
                    {ep.published ? <Badge variant="default">Publicado</Badge> : <Badge variant="secondary">Rascunho</Badge>}
                    {ep.audio_url ? (
                      <Badge variant="outline" className="text-green-600"><Play className="h-3 w-3 mr-1" />Áudio</Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600">Sem áudio</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">{fmtDur(ep.duration_seconds)}</span>
                  </div>
                  {ep.eyebrow && <p className="text-xs text-muted-foreground mt-0.5">{ep.eyebrow}</p>}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setEditing(ep)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(ep.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground py-12">Ainda não há episódios. Cria o primeiro.</p>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <Card className="w-full max-w-2xl my-8">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing.id ? 'Editar episódio' : 'Novo episódio'}</h2>
                <Button size="sm" variant="ghost" onClick={() => setEditing(null)}><X className="h-4 w-4" /></Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Nº episódio</label>
                  <Input
                    type="number"
                    value={editing.episode_number ?? ''}
                    onChange={(e) => setEditing({ ...editing, episode_number: e.target.value ? parseInt(e.target.value) : null })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Ordem</label>
                  <Input
                    type="number"
                    value={editing.sort_order}
                    onChange={(e) => setEditing({ ...editing, sort_order: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Título *</label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Eyebrow / Categoria</label>
                <Input
                  value={editing.eyebrow || ''}
                  onChange={(e) => setEditing({ ...editing, eyebrow: e.target.value })}
                  placeholder="Ex: Episódio 01 · Estratégia"
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Descrição</label>
                <Textarea
                  rows={4}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Tags</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {editing.tags.map((t, i) => (
                    <Badge key={i} variant="secondary" className="gap-1">
                      {t}
                      <button onClick={() => setEditing({ ...editing, tags: editing.tags.filter((_, j) => j !== i) })}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Adicionar tag e Enter"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && tagInput.trim()) {
                        e.preventDefault();
                        setEditing({ ...editing, tags: [...editing.tags, tagInput.trim()] });
                        setTagInput('');
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold mb-1 block">Ficheiro de áudio</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {editing.audio_url ? 'Substituir áudio' : 'Carregar áudio'}
                  </Button>
                  {editing.audio_url && (
                    <span className="text-xs text-muted-foreground truncate">
                      ✓ {editing.audio_url.split('/').pop()} — {fmtDur(editing.duration_seconds)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editing.published}
                    onCheckedChange={(v) => setEditing({ ...editing, published: v })}
                  />
                  <span className="text-sm">Publicado</span>
                </div>
                <Button onClick={save}>
                  <Save className="h-4 w-4 mr-2" /> Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminPodcast;
