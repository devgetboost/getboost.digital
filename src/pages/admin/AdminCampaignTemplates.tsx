import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Copy, FileText, MessageSquare, Mail, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type WaTemplate = {
  id: string; name: string; content: string; variables: string[] | null;
  trigger_event: string | null; is_active: boolean; updated_at: string;
};
type EmailTemplate = {
  id: string; name: string; subject: string; html: string; preview_text: string | null;
  variables: string[] | null; category: string | null; updated_at: string;
};

function extractVariables(text: string): string[] {
  const re = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
  const set = new Set<string>();
  let m; while ((m = re.exec(text)) !== null) set.add(m[1]);
  return Array.from(set);
}

export default function AdminCampaignTemplates() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'whatsapp' | 'email'>('whatsapp');
  const [search, setSearch] = useState('');

  const [waList, setWaList] = useState<WaTemplate[]>([]);
  const [emailList, setEmailList] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const [waOpen, setWaOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [waEdit, setWaEdit] = useState<Partial<WaTemplate> | null>(null);
  const [emailEdit, setEmailEdit] = useState<Partial<EmailTemplate> | null>(null);

  const load = async () => {
    setLoading(true);
    const [wa, em] = await Promise.all([
      supabase.from('whatsapp_templates').select('*').order('updated_at', { ascending: false }),
      supabase.from('email_templates').select('*').order('updated_at', { ascending: false }),
    ]);
    if (wa.error) toast.error('WhatsApp: ' + wa.error.message);
    if (em.error) toast.error('Email: ' + em.error.message);
    setWaList((wa.data as WaTemplate[]) || []);
    setEmailList((em.data as EmailTemplate[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const waFiltered = useMemo(
    () => waList.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.content?.toLowerCase().includes(search.toLowerCase())),
    [waList, search]
  );
  const emailFiltered = useMemo(
    () => emailList.filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject?.toLowerCase().includes(search.toLowerCase())),
    [emailList, search]
  );

  // ---- WhatsApp CRUD ----
  const saveWa = async () => {
    if (!waEdit?.name || !waEdit?.content) { toast.error('Nome e conteúdo obrigatórios'); return; }
    const payload: any = {
      name: waEdit.name,
      content: waEdit.content,
      trigger_event: waEdit.trigger_event || 'manual',
      is_active: waEdit.is_active ?? true,
      variables: extractVariables(waEdit.content),
    };
    const q = waEdit.id
      ? supabase.from('whatsapp_templates').update(payload).eq('id', waEdit.id)
      : supabase.from('whatsapp_templates').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success('Modelo guardado');
    setWaOpen(false); setWaEdit(null); load();
  };
  const removeWa = async (id: string) => {
    if (!confirm('Eliminar este modelo?')) return;
    const { error } = await supabase.from('whatsapp_templates').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Eliminado'); load(); }
  };

  // ---- Email CRUD ----
  const saveEmail = async () => {
    if (!emailEdit?.name || !emailEdit?.subject || !emailEdit?.html) { toast.error('Nome, assunto e HTML obrigatórios'); return; }
    const payload: any = {
      name: emailEdit.name,
      subject: emailEdit.subject,
      html: emailEdit.html,
      preview_text: emailEdit.preview_text || null,
      category: emailEdit.category || null,
      variables: Array.from(new Set([
        ...extractVariables(emailEdit.subject),
        ...extractVariables(emailEdit.html),
        ...extractVariables(emailEdit.preview_text || ''),
      ])),
    };
    const q = emailEdit.id
      ? supabase.from('email_templates').update(payload).eq('id', emailEdit.id)
      : supabase.from('email_templates').insert({ ...payload, created_by: (await supabase.auth.getUser()).data.user?.id });
    const { error } = await q;
    if (error) return toast.error(error.message);
    toast.success('Modelo guardado');
    setEmailOpen(false); setEmailEdit(null); load();
  };
  const removeEmail = async (id: string) => {
    if (!confirm('Eliminar este modelo?')) return;
    const { error } = await supabase.from('email_templates').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Eliminado'); load(); }
  };

  const duplicateWa = (t: WaTemplate) => {
    setWaEdit({ name: `${t.name} (cópia)`, content: t.content, trigger_event: t.trigger_event, is_active: t.is_active });
    setWaOpen(true);
  };
  const duplicateEmail = (t: EmailTemplate) => {
    setEmailEdit({ name: `${t.name} (cópia)`, subject: t.subject, html: t.html, preview_text: t.preview_text, category: t.category });
    setEmailOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="w-7 h-7 text-[#ff4000]" /> Modelos
          </h1>
          <p className="text-muted-foreground mt-1">
            Cria e reutiliza modelos de WhatsApp e Email com variáveis dinâmicas <code className="text-xs">{'{{nome}}'}</code>
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/admin/campanhas')}>← Campanhas</Button>
      </div>

      <Card className="p-4 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Procurar modelos..." className="pl-10" />
        </div>
      </Card>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="whatsapp" className="gap-2"><MessageSquare className="w-4 h-4" /> WhatsApp ({waList.length})</TabsTrigger>
            <TabsTrigger value="email" className="gap-2"><Mail className="w-4 h-4" /> Email ({emailList.length})</TabsTrigger>
          </TabsList>
          {tab === 'whatsapp' ? (
            <Button className="bg-[#ff4000] hover:bg-[#e63900] text-white gap-2"
              onClick={() => { setWaEdit({ is_active: true, trigger_event: 'manual' }); setWaOpen(true); }}>
              <Plus className="w-4 h-4" /> Novo modelo WhatsApp
            </Button>
          ) : (
            <Button className="bg-[#ff4000] hover:bg-[#e63900] text-white gap-2"
              onClick={() => { setEmailEdit({}); setEmailOpen(true); }}>
              <Plus className="w-4 h-4" /> Novo modelo Email
            </Button>
          )}
        </div>

        <TabsContent value="whatsapp">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Preview</TableHead><TableHead>Variáveis</TableHead>
                <TableHead>Evento</TableHead><TableHead>Estado</TableHead><TableHead className="w-32">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">A carregar...</TableCell></TableRow>}
                {!loading && waFiltered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Sem modelos.</TableCell></TableRow>}
                {waFiltered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.content}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(t.variables || []).map(v => <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{t.trigger_event || 'manual'}</Badge></TableCell>
                    <TableCell>{t.is_active ? <Badge className="bg-green-100 text-green-700 border-green-200">Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setWaEdit(t); setWaOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicateWa(t)}><Copy className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => removeWa(t.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <Table>
              <TableHeader><TableRow>
                <TableHead>Nome</TableHead><TableHead>Assunto</TableHead><TableHead>Variáveis</TableHead>
                <TableHead>Categoria</TableHead><TableHead className="w-32">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loading && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">A carregar...</TableCell></TableRow>}
                {!loading && emailFiltered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Sem modelos.</TableCell></TableRow>}
                {emailFiltered.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground">{t.subject}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(t.variables || []).map(v => <Badge key={v} variant="secondary" className="text-[10px]">{v}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell>{t.category ? <Badge variant="outline">{t.category}</Badge> : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => { setEmailEdit(t); setEmailOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => duplicateEmail(t)}><Copy className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-red-600" onClick={() => removeEmail(t.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Editor */}
      <Dialog open={waOpen} onOpenChange={setWaOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{waEdit?.id ? 'Editar' : 'Novo'} modelo WhatsApp</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input value={waEdit?.name || ''} onChange={e => setWaEdit({ ...waEdit, name: e.target.value })} />
            </div>
            <div>
              <Label>Evento (opcional)</Label>
              <Input value={waEdit?.trigger_event || ''} placeholder="manual, lead_created, meeting_scheduled..."
                onChange={e => setWaEdit({ ...waEdit, trigger_event: e.target.value })} />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea rows={8} value={waEdit?.content || ''} onChange={e => setWaEdit({ ...waEdit, content: e.target.value })}
                placeholder="Olá {{nome}}, obrigado pelo interesse em {{servico}}!" />
              <p className="text-xs text-muted-foreground mt-1">
                Variáveis detectadas: {extractVariables(waEdit?.content || '').join(', ') || '—'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWaOpen(false)}>Cancelar</Button>
            <Button className="bg-[#ff4000] hover:bg-[#e63900] text-white" onClick={saveWa}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Editor */}
      <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{emailEdit?.id ? 'Editar' : 'Novo'} modelo Email</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nome</Label>
                <Input value={emailEdit?.name || ''} onChange={e => setEmailEdit({ ...emailEdit, name: e.target.value })} />
              </div>
              <div>
                <Label>Categoria</Label>
                <Input value={emailEdit?.category || ''} placeholder="ex: onboarding, promo"
                  onChange={e => setEmailEdit({ ...emailEdit, category: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={emailEdit?.subject || ''} onChange={e => setEmailEdit({ ...emailEdit, subject: e.target.value })} />
            </div>
            <div>
              <Label>Preview text</Label>
              <Input value={emailEdit?.preview_text || ''} onChange={e => setEmailEdit({ ...emailEdit, preview_text: e.target.value })} />
            </div>
            <div>
              <Label>HTML</Label>
              <Textarea rows={12} className="font-mono text-xs" value={emailEdit?.html || ''}
                onChange={e => setEmailEdit({ ...emailEdit, html: e.target.value })}
                placeholder="<h1>Olá {{nome}}</h1><p>Bem-vindo à {{empresa}}!</p>" />
              <p className="text-xs text-muted-foreground mt-1">
                Variáveis detectadas: {Array.from(new Set([
                  ...extractVariables(emailEdit?.subject || ''),
                  ...extractVariables(emailEdit?.html || ''),
                  ...extractVariables(emailEdit?.preview_text || ''),
                ])).join(', ') || '—'}
              </p>
            </div>
            {emailEdit?.html && (
              <div>
                <Label>Preview</Label>
                <div className="border rounded p-4 bg-white max-h-64 overflow-auto" dangerouslySetInnerHTML={{ __html: emailEdit.html }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailOpen(false)}>Cancelar</Button>
            <Button className="bg-[#ff4000] hover:bg-[#e63900] text-white" onClick={saveEmail}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
