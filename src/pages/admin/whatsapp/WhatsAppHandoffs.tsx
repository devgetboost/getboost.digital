import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle2, Clock, Forward, Loader2, RefreshCw, ShieldAlert, UserRound } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

type Category = 'human_request' | 'complaint_legal' | 'urgency';
type Status = 'pending' | 'in_review' | 'resolved' | 'forwarded';

interface Handoff {
  id: string;
  conversation_id: string | null;
  contact_phone: string;
  contact_name: string | null;
  category: Category;
  keyword: string | null;
  lang: string;
  trigger_message: string | null;
  canned_reply: string | null;
  source: string;
  status: Status;
  notes: string | null;
  forwarded_to: string | null;
  forwarded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  sla_minutes: number | null;
  sla_due_at: string | null;
  sla_breached_at: string | null;
  queue_priority: number | null;
  assigned_to: string | null;
  reassign_count: number | null;
  reassign_reason: string | null;
  first_human_reply_at: string | null;
}

function slaBadge(h: Handoff): { label: string; color: string } | null {
  if (h.status === 'resolved' || h.status === 'forwarded' || h.first_human_reply_at) return null;
  if (!h.sla_due_at) return null;
  const dueMs = new Date(h.sla_due_at).getTime() - Date.now();
  if (h.sla_breached_at || dueMs <= 0) {
    const overMin = Math.max(1, Math.round(-dueMs / 60000));
    return { label: `SLA ⚠︎ +${overMin}m` + ((h.reassign_count ?? 0) > 0 ? ` · reatrib. ${h.reassign_count}×` : ''),
             color: 'bg-red-600 text-white border-red-700' };
  }
  const mins = Math.round(dueMs / 60000);
  const color = mins < 10 ? 'bg-amber-500/20 text-amber-800 border-amber-400'
                          : 'bg-emerald-500/15 text-emerald-700 border-emerald-300';
  return { label: `SLA ${mins}m`, color };
}


const CATEGORY_META: Record<Category, { label: string; icon: any; color: string }> = {
  human_request: { label: 'Pedido humano', icon: UserRound, color: 'bg-blue-500/15 text-blue-700 border-blue-300' },
  complaint_legal: { label: 'Reclamação / Jurídico', icon: ShieldAlert, color: 'bg-red-500/15 text-red-700 border-red-300' },
  urgency: { label: 'Urgência', icon: AlertTriangle, color: 'bg-amber-500/15 text-amber-700 border-amber-300' },
};

const STATUS_META: Record<Status, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-orange-500/15 text-orange-700 border-orange-300' },
  in_review: { label: 'Em revisão', color: 'bg-indigo-500/15 text-indigo-700 border-indigo-300' },
  resolved: { label: 'Resolvido', color: 'bg-emerald-500/15 text-emerald-700 border-emerald-300' },
  forwarded: { label: 'Reencaminhado', color: 'bg-purple-500/15 text-purple-700 border-purple-300' },
};

export default function WhatsAppHandoffs() {
  const [items, setItems] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<Handoff | null>(null);
  const [notes, setNotes] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [forwardMsg, setForwardMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    let q = supabase.from('whatsapp_handoffs').select('*')
      .order('queue_priority', { ascending: true })
      .order('sla_due_at', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(200);
    if (statusFilter !== 'all') q = q.eq('status', statusFilter);
    if (categoryFilter !== 'all') q = q.eq('category', categoryFilter);
    const { data, error } = await q;
    if (error) toast.error('Erro ao carregar: ' + error.message);
    setItems((data as Handoff[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [statusFilter, categoryFilter]);

  useEffect(() => {
    const ch = supabase.channel('wa-handoffs')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_handoffs' },
        () => load(),
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [statusFilter, categoryFilter]);

  const counts = useMemo(() => ({
    pending: items.filter(i => i.status === 'pending').length,
    in_review: items.filter(i => i.status === 'in_review').length,
  }), [items]);

  function openReview(h: Handoff) {
    setSelected(h);
    setNotes(h.notes || '');
    setForwardTo('');
    setForwardMsg(h.trigger_message ? `Escalonamento WhatsApp (${CATEGORY_META[h.category].label}) de ${h.contact_name || h.contact_phone}: "${h.trigger_message}"` : '');
  }

  async function updateStatus(id: string, status: Status, extra: Partial<Handoff> = {}) {
    const patch: any = { status, notes, ...extra };
    if (status === 'resolved') {
      const { data: { user } } = await supabase.auth.getUser();
      patch.resolved_by = user?.id ?? null;
      patch.resolved_at = new Date().toISOString();
    }
    const { error } = await supabase.from('whatsapp_handoffs').update(patch).eq('id', id);
    if (error) { toast.error('Falhou: ' + error.message); return false; }
    return true;
  }

  async function markInReview() {
    if (!selected) return;
    setBusy(true);
    const ok = await updateStatus(selected.id, 'in_review');
    setBusy(false);
    if (ok) { toast.success('Marcado como em revisão'); setSelected(null); }
  }

  async function markResolved() {
    if (!selected) return;
    setBusy(true);
    const ok = await updateStatus(selected.id, 'resolved');
    setBusy(false);
    if (ok) { toast.success('Marcado como resolvido'); setSelected(null); }
  }

  async function forwardToNumber() {
    if (!selected) return;
    if (!forwardTo.trim() || !forwardMsg.trim()) {
      toast.error('Indica destinatário e mensagem');
      return;
    }
    setBusy(true);
    try {
      // Reencaminha via WhatsApp usando a instância activa da conversa
      const { data: conv } = await supabase.from('whatsapp_conversations')
        .select('instance_id').eq('id', selected.conversation_id!).maybeSingle();
      if (!conv?.instance_id) throw new Error('Sem instância associada');

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
            instance_id: conv.instance_id,
            recipients: [{ name: '', phone: forwardTo.replace(/\D/g, '') }],
            message: forwardMsg,
            delay_seconds: 1,
          }),
        },
      );
      const data = await res.json();
      const sent = data?.results?.[0]?.status === 'sent';
      if (!res.ok || !sent) throw new Error(data?.error || 'Envio falhou');

      const ok = await updateStatus(selected.id, 'forwarded', {
        forwarded_to: forwardTo,
        forwarded_at: new Date().toISOString(),
      });
      if (ok) { toast.success('Reencaminhado por WhatsApp'); setSelected(null); }
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao reencaminhar');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Escalonamentos & Canned</h2>
          <p className="text-xs text-muted-foreground">
            Mensagens onde a IA passou a conversa a humano ou enviou uma resposta padrão.
            <span className="ml-2">Pendentes: <b>{counts.pending}</b> · Em revisão: <b>{counts.in_review}</b></span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <SelectTrigger className="w-[150px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_review">Em revisão</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="forwarded">Reencaminhado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
            <SelectTrigger className="w-[180px] h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="human_request">Pedido humano</SelectItem>
              <SelectItem value="complaint_legal">Reclamação / Jurídico</SelectItem>
              <SelectItem value="urgency">Urgência</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {loading && items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" /> A carregar...
          </div>
        )}
        {!loading && items.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Sem registos.</div>
        )}
        {items.map((h) => {
          const cat = CATEGORY_META[h.category];
          const st = STATUS_META[h.status];
          const Icon = cat.icon;
          return (
            <button
              key={h.id}
              onClick={() => openReview(h)}
              className="w-full text-left p-3 rounded-md border hover:bg-muted/40 transition-colors flex gap-3"
            >
              <div className="mt-0.5"><Icon className="h-4 w-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-sm truncate">
                    {h.contact_name || `+${h.contact_phone}`}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(() => { const s = slaBadge(h); return s ? (
                      <Badge variant="outline" className={`text-[10px] ${s.color}`}>{s.label}</Badge>
                    ) : null; })()}
                    <Badge variant="outline" className={`text-[10px] ${cat.color}`}>{cat.label}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  “{h.trigger_message || '—'}”
                </p>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1 flex-wrap">
                  <Clock className="h-3 w-3" />
                  {formatDistanceToNow(new Date(h.created_at), { locale: pt, addSuffix: true })}
                  {h.keyword && <span>· palavra: <code>{h.keyword}</code></span>}
                  <span>· {h.lang.toUpperCase()}</span>
                  {h.sla_minutes && <span>· SLA {h.sla_minutes}min</span>}
                  {(h.reassign_count ?? 0) > 0 && <span className="text-red-600">· reatribuído {h.reassign_count}×</span>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {CATEGORY_META[selected.category].label} — {selected.contact_name || `+${selected.contact_phone}`}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="p-3 rounded bg-muted/40 border">
                  <p className="text-[11px] uppercase font-medium text-muted-foreground mb-1">Mensagem do cliente</p>
                  <p className="whitespace-pre-wrap">{selected.trigger_message || '—'}</p>
                </div>
                <div className="p-3 rounded bg-primary/5 border border-primary/20">
                  <p className="text-[11px] uppercase font-medium text-muted-foreground mb-1">Resposta canned enviada</p>
                  <p className="whitespace-pre-wrap">{selected.canned_reply || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium">Notas internas</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                    placeholder="O que foi feito, o que ficou combinado..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-end">
                  <div>
                    <label className="text-xs font-medium">Reencaminhar por WhatsApp para</label>
                    <Input value={forwardTo} onChange={(e) => setForwardTo(e.target.value)}
                      placeholder="Ex: 351912345678" />
                  </div>
                  <Button variant="outline" size="sm" onClick={forwardToNumber} disabled={busy}>
                    <Forward className="h-4 w-4 mr-1.5" /> Reencaminhar
                  </Button>
                </div>
                <Textarea value={forwardMsg} onChange={(e) => setForwardMsg(e.target.value)} rows={2}
                  placeholder="Mensagem a enviar ao destinatário do reencaminhamento" />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={markInReview} disabled={busy}>
                  Marcar em revisão
                </Button>
                <Button onClick={markResolved} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Resolver
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
