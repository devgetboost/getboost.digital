import { useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Plus, Send, Users, Clock, Image as ImageIcon, FileText, Upload, Trash2, X,
  Eye, Save, Sparkles, Pencil,
} from 'lucide-react';

type LeadRow = {
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  service: string | null;
  cargo: string | null;
  business_area: string | null;
};

type Recipient = {
  name: string;
  phone: string;
  source: string;
  selected: boolean;
  vars: Record<string, string>;
};

type MediaItem = {
  id: string;
  name: string;
  url: string;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  tags: string[] | null;
};

type Template = {
  id: string;
  name: string;
  content: string;
  media_url: string | null;
  media_mime: string | null;
};

const VARIABLE_TOKENS = [
  { key: 'nome', label: 'Nome' },
  { key: 'email', label: 'Email' },
  { key: 'telefone', label: 'Telefone' },
  { key: 'empresa', label: 'Empresa' },
  { key: 'servico', label: 'Serviço' },
  { key: 'cargo', label: 'Cargo' },
  { key: 'area', label: 'Área' },
];

function renderTemplate(tpl: string, vars: Record<string, string>) {
  return tpl.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k: string) => {
    const v = vars[k.toLowerCase()] ?? vars[k];
    return v !== undefined && v !== null && v !== '' ? String(v) : `{{${k}}}`;
  });
}

export default function WhatsAppSend() {
  const qc = useQueryClient();
  const [instanceId, setInstanceId] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sourceMode, setSourceMode] = useState('manual');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [message, setMessage] = useState('');
  const [delaySeconds, setDelaySeconds] = useState('5');
  const [sending, setSending] = useState(false);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const messageRef = useRef<HTMLTextAreaElement>(null);

  const { data: instances = [] } = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_instances').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-for-whatsapp'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('name, email, phone, company, service, cargo, business_area')
        .not('phone', 'is', null);
      if (error) throw error;
      return data as LeadRow[];
    },
  });

  const { data: media = [], refetch: refetchMedia } = useQuery({
    queryKey: ['whatsapp-media'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_media').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['whatsapp-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_templates').select('*').order('updated_at', { ascending: false });
      if (error) throw error;
      return data as Template[];
    },
  });

  const addRecipient = () => {
    if (!newPhone.trim()) return;
    setRecipients(r => [...r, {
      name: newName.trim(),
      phone: newPhone.trim(),
      source: 'manual',
      selected: true,
      vars: { nome: newName.trim(), telefone: newPhone.trim() },
    }]);
    setNewName(''); setNewPhone('');
  };

  const handleSourceChange = (mode: string) => {
    setSourceMode(mode);
    if (mode === 'leads') {
      const newRecips: Recipient[] = leads
        .filter(l => l.phone && !recipients.some(r => r.phone === l.phone))
        .map(l => ({
          name: l.name || '',
          phone: l.phone!,
          source: 'CRM',
          selected: true,
          vars: {
            nome: l.name || '',
            email: l.email || '',
            telefone: l.phone || '',
            empresa: l.company || '',
            servico: l.service || '',
            cargo: l.cargo || '',
            area: l.business_area || '',
          },
        }));
      setRecipients(r => [...r, ...newRecips]);
      toast.success(`${newRecips.length} leads importados`);
    }
  };

  const toggleRecipient = (idx: number) =>
    setRecipients(r => r.map((rec, i) => i === idx ? { ...rec, selected: !rec.selected } : rec));
  const toggleAll = (c: boolean) => setRecipients(r => r.map(rec => ({ ...rec, selected: c })));
  const removeRecipient = (idx: number) => setRecipients(r => r.filter((_, i) => i !== idx));

  const selectedRecipients = recipients.filter(r => r.selected);
  const selectedCount = selectedRecipients.length;

  const insertVariable = (key: string) => {
    const ta = messageRef.current;
    const token = `{{${key}}}`;
    if (!ta) { setMessage(m => m + token); return; }
    const start = ta.selectionStart ?? message.length;
    const end = ta.selectionEnd ?? message.length;
    const next = message.slice(0, start) + token + message.slice(end);
    setMessage(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = ta.selectionEnd = start + token.length;
    });
  };

  const previewVars = selectedRecipients[0]?.vars || {
    nome: 'João Silva', email: 'joao@exemplo.com', telefone: '351912345678',
    empresa: 'Acme', servico: 'Branding', cargo: 'CEO', area: 'Tecnologia',
  };
  const previewMessage = renderTemplate(message, previewVars);

  const selectedInstance = instances.find((i: any) => i.id === instanceId);

  // ─── Media upload ──────────────────────────────────────────────
  const uploadMedia = async (file: File) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Apenas imagens ou vídeos'); return;
    }
    if (file.size > 16 * 1024 * 1024) {
      toast.error('Tamanho máximo 16MB'); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user?.id || 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const up = await supabase.storage.from('whatsapp-media').upload(path, file, {
      cacheControl: '3600', upsert: false, contentType: file.type,
    });
    if (up.error) { toast.error(up.error.message); return; }
    const { data: signed, error: signErr } = await supabase.storage
      .from('whatsapp-media').createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signErr || !signed) { toast.error(signErr?.message || 'Falha ao assinar URL'); return; }
    const { error } = await supabase.from('whatsapp_media').insert({
      name: file.name, url: signed.signedUrl, storage_path: path,
      mime_type: file.type, size_bytes: file.size, created_by: user?.id || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Imagem carregada');
    refetchMedia();
  };

  const deleteMedia = async (m: MediaItem) => {
    if (!confirm(`Eliminar "${m.name}"?`)) return;
    await supabase.storage.from('whatsapp-media').remove([m.storage_path]);
    await supabase.from('whatsapp_media').delete().eq('id', m.id);
    if (selectedMedia?.id === m.id) setSelectedMedia(null);
    refetchMedia();
    toast.success('Eliminado');
  };

  const renameMedia = async (m: MediaItem) => {
    const next = prompt('Novo nome:', m.name);
    if (!next || next === m.name) return;
    await supabase.from('whatsapp_media').update({ name: next }).eq('id', m.id);
    refetchMedia();
  };

  // ─── Templates ─────────────────────────────────────────────────
  const saveTemplate = async () => {
    if (!newTemplateName.trim() || !message.trim()) {
      toast.error('Nome e conteúdo são obrigatórios'); return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('whatsapp_templates').insert({
      name: newTemplateName.trim(),
      content: message,
      media_url: selectedMedia?.url || null,
      media_mime: selectedMedia?.mime_type || null,
      created_by: user?.id || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Modelo guardado');
    setNewTemplateName('');
    setSaveTemplateOpen(false);
    qc.invalidateQueries({ queryKey: ['whatsapp-templates'] });
  };

  const loadTemplate = (t: Template) => {
    setMessage(t.content);
    if (t.media_url) {
      const m = media.find(mm => mm.url === t.media_url);
      setSelectedMedia(m || {
        id: 'tpl', name: 'Imagem do modelo', url: t.media_url,
        storage_path: '', mime_type: t.media_mime, size_bytes: null, tags: null,
      });
    }
    setTemplateDialogOpen(false);
    toast.success(`Modelo "${t.name}" carregado`);
  };

  const deleteTemplate = async (t: Template) => {
    if (!confirm(`Eliminar modelo "${t.name}"?`)) return;
    await supabase.from('whatsapp_templates').delete().eq('id', t.id);
    qc.invalidateQueries({ queryKey: ['whatsapp-templates'] });
  };

  // ─── Send ──────────────────────────────────────────────────────
  const sendMessages = async () => {
    if (!instanceId || selectedCount === 0 || !message.trim()) {
      toast.error('Preencha todos os campos'); return;
    }
    if (selectedInstance?.status !== 'online') {
      toast.error('A instância não está conectada.'); return;
    }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-proxy?action=send-messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            instance_id: instanceId,
            recipients: selectedRecipients.map(r => ({
              name: r.name, phone: r.phone, variables: r.vars,
            })),
            message,
            media_url: selectedMedia?.url || null,
            media_mime: selectedMedia?.mime_type || null,
            delay_seconds: parseInt(delaySeconds) || 5,
          }),
        },
      );
      const result = await res.json();
      if (res.ok) {
        const sent = result.results?.filter((r: any) => r.status === 'sent').length || 0;
        const failed = result.results?.filter((r: any) => r.status === 'failed').length || 0;
        toast.success(`Enviadas: ${sent} | Falhadas: ${failed}`);
        setRecipients([]); setMessage(''); setSelectedMedia(null);
      } else {
        toast.error(result.error || 'Erro ao enviar');
      }
    } catch {
      toast.error('Erro de rede');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 mt-4">
      <div className="space-y-6 min-w-0">
        {/* Instância */}
        <Card>
          <CardHeader><CardTitle className="text-base">API de Envio</CardTitle></CardHeader>
          <CardContent>
            <Select value={instanceId} onValueChange={setInstanceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar instância">
                  {selectedInstance && (
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Evolution</Badge>
                      {selectedInstance.name}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {instances.map((inst: any) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Evolution</Badge>
                      {inst.name} {inst.status === 'online' ? '🟢' : '🔴'}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Destinatários */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" /> Destinatários
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={sourceMode} onValueChange={handleSourceChange}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="leads">Leads do CRM</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">Telefone</Label>
                <Input value={newPhone} onChange={e => setNewPhone(e.target.value)}
                  placeholder="351912345678"
                  onKeyDown={e => e.key === 'Enter' && addRecipient()} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Nome (opcional)</Label>
                <Input value={newName} onChange={e => setNewName(e.target.value)}
                  placeholder="Nome"
                  onKeyDown={e => e.key === 'Enter' && addRecipient()} />
              </div>
              <Button size="icon" onClick={addRecipient} disabled={!newPhone.trim()} className="shrink-0">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {recipients.length > 0 && (
              <>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">
                          <Checkbox
                            checked={selectedCount === recipients.length && recipients.length > 0}
                            onCheckedChange={(c) => toggleAll(!!c)} />
                        </TableHead>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipients.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Checkbox checked={r.selected} onCheckedChange={() => toggleRecipient(i)} />
                          </TableCell>
                          <TableCell className="text-sm">{r.name || '—'}</TableCell>
                          <TableCell className="text-sm font-mono">{r.phone}</TableCell>
                          <TableCell><Badge variant="secondary" className="text-xs">{r.source}</Badge></TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => removeRecipient(i)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedCount} de {recipients.length} selecionados
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Mensagem */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Mensagem</CardTitle>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={() => setTemplateDialogOpen(true)}>
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Modelos
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSaveTemplateOpen(true)}
                disabled={!message.trim()}>
                <Save className="h-3.5 w-3.5 mr-1.5" /> Guardar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Variable chips */}
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" /> Inserir variável dinâmica
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {VARIABLE_TOKENS.map(v => (
                  <Button key={v.key} variant="outline" size="sm"
                    className="h-7 text-xs font-mono"
                    onClick={() => insertVariable(v.key)}
                    type="button">
                    {`{{${v.key}}}`}
                  </Button>
                ))}
              </div>
            </div>

            <Textarea
              ref={messageRef}
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 4096))}
              placeholder={"Olá {{nome}}, tudo bem?\n\nViemos do {{empresa}} para falar sobre {{servico}}..."}
              rows={7}
            />
            <p className="text-xs text-muted-foreground">{message.length} / 4096 caracteres</p>

            {/* Image selection */}
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1.5">
                <ImageIcon className="h-3 w-3" /> Imagem (opcional)
              </Label>
              {selectedMedia ? (
                <div className="flex items-center gap-3 p-2 border rounded-lg">
                  {selectedMedia.mime_type?.startsWith('image/') ? (
                    <img src={selectedMedia.url} alt="" className="h-14 w-14 rounded object-cover" />
                  ) : (
                    <div className="h-14 w-14 rounded bg-muted flex items-center justify-center">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedMedia.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedMedia.mime_type}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setMediaDialogOpen(true)}>Alterar</Button>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedMedia(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setMediaDialogOpen(true)} className="w-full">
                  <ImageIcon className="h-4 w-4 mr-2" /> Escolher imagem da biblioteca
                </Button>
              )}
            </div>

            {/* Delay */}
            <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <Label className="text-xs font-medium">Intervalo entre envios</Label>
                <p className="text-[11px] text-muted-foreground">Tempo de espera entre cada mensagem para evitar bloqueio</p>
              </div>
              <Select value={delaySeconds} onValueChange={setDelaySeconds}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[3, 5, 10, 15, 20, 30, 45, 60].map(s => (
                    <SelectItem key={s} value={String(s)}>
                      {s >= 60 ? `${s / 60} minuto` : `${s} segundos`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col items-end gap-2">
              {selectedInstance && selectedInstance.status !== 'online' && (
                <p className="text-xs text-destructive">
                  ⚠️ Instância "{selectedInstance.name}" não está conectada ao WhatsApp.
                </p>
              )}
              <Button
                onClick={sendMessages}
                disabled={sending || !instanceId || selectedCount === 0 || !message.trim() || selectedInstance?.status !== 'online'}
                className="gap-2">
                <Send className="h-4 w-4" />
                {sending ? 'A enviar...' : `Enviar ${selectedCount > 0 ? `(${selectedCount})` : ''}`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live preview sidebar */}
      <div className="lg:sticky lg:top-4 lg:self-start">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Eye className="h-4 w-4" /> Pré-visualização
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {selectedRecipients[0]
                ? <>Como vai aparecer para <strong>{selectedRecipients[0].name || selectedRecipients[0].phone}</strong></>
                : 'Exemplo (selecione um destinatário para preview real)'}
            </p>
          </CardHeader>
          <CardContent>
            <div className="bg-[#0b141a] rounded-xl p-3 min-h-[200px]">
              <div className="bg-[#005c4b] text-white rounded-lg rounded-tr-sm px-3 py-2 ml-auto max-w-[90%] shadow-sm">
                {selectedMedia?.mime_type?.startsWith('image/') && (
                  <img src={selectedMedia.url} alt=""
                    className="rounded-md mb-2 max-h-48 w-full object-cover" />
                )}
                {selectedMedia && !selectedMedia.mime_type?.startsWith('image/') && (
                  <div className="bg-black/20 rounded p-2 mb-2 text-xs flex items-center gap-2">
                    <FileText className="h-4 w-4" /> {selectedMedia.name}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {previewMessage || <span className="opacity-60">A sua mensagem aparece aqui…</span>}
                </p>
                <p className="text-[10px] text-white/60 text-right mt-1">12:34 ✓✓</p>
              </div>
            </div>

            {/* Variables found in template */}
            {message && (
              <div className="mt-3 text-xs space-y-1">
                <p className="font-medium text-muted-foreground">Variáveis detetadas:</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(new Set([...message.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].map(m => m[1].toLowerCase()))).map(k => {
                    const has = !!previewVars[k];
                    return (
                      <Badge key={k} variant={has ? 'secondary' : 'destructive'}
                        className="text-[10px] font-mono">
                        {`{{${k}}}`}{!has && ' (vazio)'}
                      </Badge>
                    );
                  })}
                  {[...message.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)].length === 0 && (
                    <span className="text-muted-foreground">— nenhuma</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ───── Media library dialog ───── */}
      <MediaLibraryDialog
        open={mediaDialogOpen}
        onOpenChange={setMediaDialogOpen}
        media={media}
        onPick={(m) => { setSelectedMedia(m); setMediaDialogOpen(false); }}
        onUpload={uploadMedia}
        onDelete={deleteMedia}
        onRename={renameMedia}
        selectedId={selectedMedia?.id}
      />

      {/* ───── Templates dialog ───── */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modelos de mensagem</DialogTitle>
            <DialogDescription>Carregue um modelo guardado para reutilizar.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-2">
            {templates.length === 0 && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Sem modelos guardados. Escreva uma mensagem e clique em "Guardar" para criar o primeiro.
              </p>
            )}
            {templates.map(t => (
              <div key={t.id} className="border rounded-lg p-3 hover:bg-muted/40 transition">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{t.content}</p>
                    {t.media_url && (
                      <Badge variant="outline" className="mt-1.5 text-[10px]">
                        <ImageIcon className="h-2.5 w-2.5 mr-1" /> com imagem
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => loadTemplate(t)}>Usar</Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8"
                      onClick={() => deleteTemplate(t)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ───── Save template dialog ───── */}
      <Dialog open={saveTemplateOpen} onOpenChange={setSaveTemplateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar modelo</DialogTitle>
            <DialogDescription>Reutilize esta mensagem mais tarde.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Nome do modelo</Label>
              <Input value={newTemplateName} onChange={e => setNewTemplateName(e.target.value)}
                placeholder="Ex: Boas-vindas, Follow-up..." />
            </div>
            <div className="text-xs text-muted-foreground p-2 bg-muted/40 rounded border">
              {message.slice(0, 200)}{message.length > 200 ? '…' : ''}
            </div>
            {selectedMedia && (
              <p className="text-xs text-muted-foreground">
                <ImageIcon className="inline h-3 w-3 mr-1" /> Imagem incluída: {selectedMedia.name}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveTemplateOpen(false)}>Cancelar</Button>
            <Button onClick={saveTemplate} disabled={!newTemplateName.trim()}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Media library dialog component ───────────────────────────────
function MediaLibraryDialog({
  open, onOpenChange, media, onPick, onUpload, onDelete, onRename, selectedId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  media: MediaItem[];
  onPick: (m: MediaItem) => void;
  onUpload: (f: File) => Promise<void>;
  onDelete: (m: MediaItem) => void;
  onRename: (m: MediaItem) => void;
  selectedId?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const filtered = useMemo(
    () => media.filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase())),
    [media, search],
  );

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await onUpload(f);
    } finally { setUploading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Biblioteca de imagens</DialogTitle>
          <DialogDescription>Selecione, carregue ou organize imagens para enviar pelo WhatsApp.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input placeholder="Procurar..." value={search} onChange={e => setSearch(e.target.value)} />
          <input ref={inputRef} type="file" accept="image/*,video/*" multiple
            className="hidden" onChange={e => { handleFiles(e.target.files); e.target.value = ''; }} />
          <Button onClick={() => inputRef.current?.click()} disabled={uploading} className="gap-2 shrink-0">
            <Upload className="h-4 w-4" /> {uploading ? 'A carregar...' : 'Carregar'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
              {media.length === 0 ? 'Nenhuma imagem ainda. Carregue a primeira.' : 'Sem resultados.'}
            </div>
          )}
          {filtered.map(m => {
            const isImg = m.mime_type?.startsWith('image/');
            return (
              <div key={m.id}
                className={`group border rounded-lg overflow-hidden bg-muted/30 ${
                  selectedId === m.id ? 'ring-2 ring-primary' : ''
                }`}>
                <button onClick={() => onPick(m)} className="block w-full">
                  {isImg ? (
                    <img src={m.url} alt={m.name}
                      className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square flex items-center justify-center bg-muted">
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                </button>
                <div className="p-2 flex items-center gap-1">
                  <p className="text-xs flex-1 truncate" title={m.name}>{m.name}</p>
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => onRename(m)} title="Renomear">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6"
                    onClick={() => onDelete(m)} title="Eliminar">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
