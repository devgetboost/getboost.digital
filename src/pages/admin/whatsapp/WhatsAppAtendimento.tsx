import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, User, MessageCircle, Search, Pause, Play, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

interface Conversation {
  id: string;
  instance_id: string;
  contact_phone: string;
  contact_name: string | null;
  last_message_preview: string | null;
  last_message_at: string;
  assistant_enabled: boolean;
  handoff_to_human: boolean;
  unread_count: number;
}

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender: 'contact' | 'assistant' | 'human';
  content: string;
  status: string | null;
  created_at: string;
}

interface Instance {
  id: string;
  name: string;
}

const INSTANCE_COLORS = [
  'bg-emerald-100 text-emerald-800 border-emerald-200',
  'bg-blue-100 text-blue-800 border-blue-200',
  'bg-amber-100 text-amber-800 border-amber-200',
  'bg-purple-100 text-purple-800 border-purple-200',
  'bg-pink-100 text-pink-800 border-pink-200',
  'bg-cyan-100 text-cyan-800 border-cyan-200',
];
function instanceColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return INSTANCE_COLORS[h % INSTANCE_COLORS.length];
}

export default function WhatsAppAtendimento() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [instanceFilter, setInstanceFilter] = useState<string>(() => {
    if (typeof window === 'undefined') return 'all';
    return localStorage.getItem('wa_inbox_instance_filter') || 'all';
  });
  useEffect(() => {
    try { localStorage.setItem('wa_inbox_instance_filter', instanceFilter); } catch { /* ignore */ }
  }, [instanceFilter]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const instanceMap = useMemo(() => {
    const m = new Map<string, Instance>();
    instances.forEach(i => m.set(i.id, i));
    return m;
  }, [instances]);

  const selected = useMemo(
    () => conversations.find(c => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  const [mappedInstanceIds, setMappedInstanceIds] = useState<Set<string>>(new Set());

  // Load instances + agent mapping
  useEffect(() => {
    supabase.from('whatsapp_instances').select('id, name').then(({ data }) => {
      setInstances((data as Instance[]) || []);
    });
    supabase.from('whatsapp_instance_agent_map').select('instance_id').then(({ data }) => {
      setMappedInstanceIds(new Set(((data as { instance_id: string }[]) || []).map(r => r.instance_id)));
    });
  }, []);

  // Load conversations + realtime
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('whatsapp_conversations')
        .select('*').order('last_message_at', { ascending: false }).limit(200);
      setConversations((data as Conversation[]) || []);
    };
    load();
    const ch = supabase.channel('wa-conv')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_conversations' },
        () => load(),
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);


  // Load messages of selected conv + realtime
  useEffect(() => {
    if (!selectedId) { setMessages([]); return; }
    const load = async () => {
      const { data } = await supabase.from('whatsapp_chat_messages')
        .select('*').eq('conversation_id', selectedId)
        .order('created_at', { ascending: true });
      setMessages((data as Message[]) || []);
      // Mark as read
      await supabase.from('whatsapp_conversations')
        .update({ unread_count: 0 }).eq('id', selectedId);
    };
    load();
    const ch = supabase.channel(`wa-msg-${selectedId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'whatsapp_chat_messages', filter: `conversation_id=eq.${selectedId}` },
        () => load(),
      ).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const filtered = conversations.filter(c => {
    if (instanceFilter !== 'all' && c.instance_id !== instanceFilter) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.contact_phone || '').includes(s)
      || (c.contact_name || '').toLowerCase().includes(s);
  });


  async function toggleAssistant(conv: Conversation, enabled: boolean) {
    await supabase.from('whatsapp_conversations')
      .update({ assistant_enabled: enabled }).eq('id', conv.id);
    toast.success(enabled ? 'IA ativada para este contacto' : 'IA pausada para este contacto');
  }

  async function toggleHandoff(conv: Conversation, handoff: boolean) {
    await supabase.from('whatsapp_conversations')
      .update({ handoff_to_human: handoff }).eq('id', conv.id);
    toast.success(handoff ? 'Handoff humano ativo (IA pausada)' : 'IA retomada');
  }

  async function sendHumanReply() {
    if (!selected || !reply.trim()) return;
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
            instance_id: selected.instance_id,
            recipients: [{ name: selected.contact_name || '', phone: selected.contact_phone }],
            message: reply,
            delay_seconds: 1,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'send failed');
      const result = data?.results?.[0];
      const sent = result?.status === 'sent';

      await supabase.from('whatsapp_chat_messages').insert({
        conversation_id: selected.id,
        external_id: result?.external_id || null,
        direction: 'outbound',
        sender: 'human',
        content: reply,
        status: sent ? 'sent' : 'failed',
      });
      // Activate handoff so the bot doesn't reply again
      await supabase.from('whatsapp_conversations').update({
        handoff_to_human: true,
        last_message_at: new Date().toISOString(),
        last_message_preview: reply.slice(0, 120),
      }).eq('id', selected.id);
      setReply('');
      if (sent) toast.success('Mensagem enviada'); else toast.error('Falha ao enviar');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 h-[calc(100vh-260px)] min-h-[500px]">
      {instances.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">Filtrar por instância:</span>
          <button
            onClick={() => setInstanceFilter('all')}
            className={`text-xs px-3 py-1 rounded-full border transition-colors ${
              instanceFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted hover:bg-muted/70'
            }`}
          >
            Todas
          </button>
          {instances.map(i => (
            <button
              key={i.id}
              onClick={() => setInstanceFilter(i.id)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                instanceFilter === i.id ? instanceColor(i.id) : 'bg-muted hover:bg-muted/70 border-transparent'
              }`}
            >
              {i.name}
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 flex-1 min-h-0">
      {/* List */}
      <Card className="p-3 flex flex-col">
        <div className="relative mb-2">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar telefone ou nome"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>



        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground p-4 text-center">Sem conversas ainda.</p>
            )}
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedId === c.id ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-sm truncate">
                    {c.contact_name || `+${c.contact_phone}`}
                  </p>
                  {c.unread_count > 0 && (
                    <Badge className="bg-primary text-primary-foreground h-5 px-1.5 text-xs">
                      {c.unread_count}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {c.last_message_preview || '—'}
                </p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {instanceMap.get(c.instance_id) && (
                    <span
                      title={`Conversas via ${instanceMap.get(c.instance_id)!.name}\ninstance_id: ${c.instance_id}`}
                      className={`text-[10px] px-1.5 py-0 rounded-full border cursor-help ${instanceColor(c.instance_id)}`}
                    >
                      {instanceMap.get(c.instance_id)!.name}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(c.last_message_at), { locale: pt, addSuffix: true })}
                  </span>
                  {c.handoff_to_human && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">Humano</Badge>
                  )}
                  {!c.assistant_enabled && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">IA off</Badge>
                  )}
                  {!mappedInstanceIds.has(c.instance_id) && (
                    <span
                      title="Instância sem agente mapeado. Configure em 'Agente por Instância'."
                      className="inline-flex items-center gap-0.5 text-[10px] h-4 px-1 rounded border border-amber-300 bg-amber-50 text-amber-800"
                    >
                      <AlertTriangle className="h-3 w-3" /> sem agente
                    </span>
                  )}
                </div>

              </button>
            ))}
          </div>
        </ScrollArea>
      </Card>

      {/* Thread */}
      <Card className="flex flex-col">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>Selecione uma conversa</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {selected.contact_name || `+${selected.contact_phone}`}
                  </p>
                  {instanceMap.get(selected.instance_id) && (
                    <span
                      title={`Conversas via ${instanceMap.get(selected.instance_id)!.name}\ninstance_id: ${selected.instance_id}`}
                      className={`text-[10px] px-1.5 py-0.5 rounded-full border cursor-help ${instanceColor(selected.instance_id)}`}
                    >
                      {instanceMap.get(selected.instance_id)!.name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">+{selected.contact_phone}</p>
                {!mappedInstanceIds.has(selected.instance_id) && (
                  <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>
                      Esta instância não tem agente mapeado. A IA não responderá até definires um agente em{' '}
                      <strong>WhatsApp → Agente por Instância</strong>.
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={selected.assistant_enabled}
                    onCheckedChange={(v) => toggleAssistant(selected, v)}
                  />
                  <span className="text-xs">IA neste contacto</span>
                </div>
                {selected.handoff_to_human ? (
                  <Button size="sm" variant="outline" onClick={() => toggleHandoff(selected, false)}>
                    <Play className="h-3.5 w-3.5 mr-1" /> Retomar IA
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => toggleHandoff(selected, true)}>
                    <Pause className="h-3.5 w-3.5 mr-1" /> Pausar IA
                  </Button>
                )}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
              {messages.map(m => {
                const isOut = m.direction === 'outbound';
                return (
                  <div key={m.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                      isOut
                        ? m.sender === 'assistant'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-foreground text-background'
                        : 'bg-background border'
                    }`}>
                      <div className="flex items-center gap-1 text-[10px] opacity-70 mb-0.5">
                        {m.sender === 'assistant' && <><Bot className="h-3 w-3" /> IA</>}
                        {m.sender === 'human' && <><User className="h-3 w-3" /> Nuno</>}
                        {m.sender === 'contact' && <>{selected.contact_name || 'Contacto'}</>}
                        {instanceMap.get(selected.instance_id) && (
                          <>
                          <span>·</span>
                          <span
                            title={`Conversas via ${instanceMap.get(selected.instance_id)!.name}\ninstance_id: ${selected.instance_id}`}
                            className={`px-1 rounded border cursor-help ${instanceColor(selected.instance_id)}`}
                          >
                            {instanceMap.get(selected.instance_id)!.name}
                          </span>
                        </>
                      )}
                        <span>·</span>
                        <span>{new Date(m.created_at).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">Sem mensagens.</p>
              )}
            </div>

            <div className="border-t p-3 space-y-2">
              <Textarea
                placeholder="Responder como humano (pausa automaticamente a IA)..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    sendHumanReply();
                  }
                }}
              />
              <div className="flex justify-end">
                <Button onClick={sendHumanReply} disabled={!reply.trim() || sending} size="sm">
                  <Send className="h-4 w-4 mr-1.5" />
                  {sending ? 'A enviar...' : 'Enviar (⌘+Enter)'}
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
      </div>
    </div>
  );
}
