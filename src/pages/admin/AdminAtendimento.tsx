import { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageCircle, Settings, Send, RefreshCw, Users, Clock, AlertTriangle, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

type Conversation = {
  id: string;
  visitor_name: string;
  visitor_email: string | null;
  visitor_phone: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type Message = {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  created_at: string;
};

type AssistantSettings = {
  assistant_name: string;
  greeting_message: string;
  system_prompt: string;
  knowledge_base: string;
  is_active: boolean;
};

export default function AdminAtendimento() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Atendimento</h1>
        <p className="text-muted-foreground mt-1">Gestão de conversas e configuração do assistente virtual</p>
      </div>
      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="conversations" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Conversas</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configuração</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="mt-6">
          <ConversationsPanel />
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
          <SettingsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ConversationsPanel() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [replyChannel, setReplyChannel] = useState<'message' | 'email' | 'whatsapp'>('message');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchConversations = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_conversations')
      .select('*')
      .order('updated_at', { ascending: false });
    setConversations(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('admin-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
        if (selected) loadMessages(selected);
        fetchConversations();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_conversations' }, () => {
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selected]);

  const loadMessages = async (convId: string) => {
    setSelected(convId);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 100);
  };

  const sendAdminReply = async () => {
    if (!reply.trim() || !selected || sending) return;
    setSending(true);

    const conv = conversations.find(c => c.id === selected);

    if (replyChannel === 'whatsapp' && conv?.visitor_phone) {
      const msg = encodeURIComponent(reply.trim());
      const phone = conv.visitor_phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    }

    if (replyChannel === 'email' && conv?.visitor_email) {
      const subject = encodeURIComponent('Resposta - Getboost Digital Digital');
      const body = encodeURIComponent(reply.trim());
      window.open(`mailto:${conv.visitor_email}?subject=${subject}&body=${body}`, '_blank');
    }

    // Always save the message in the conversation
    const { error } = await supabase.from('chat_messages').insert({
      conversation_id: selected,
      role: 'admin',
      content: `[${replyChannel === 'email' ? 'Email' : replyChannel === 'whatsapp' ? 'WhatsApp' : 'Chat'}] ${reply.trim()}`,
    });
    if (error) toast.error('Erro ao enviar');
    else {
      setReply('');
      loadMessages(selected);
    }
    setSending(false);
  };

  const closeConversation = async (id: string) => {
    await supabase.from('chat_conversations').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('id', id);
    fetchConversations();
    toast.success('Conversa encerrada');
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    escalated: 'bg-yellow-100 text-yellow-800',
    closed: 'bg-muted text-muted-foreground',
  };

  const statusLabels: Record<string, string> = {
    active: 'Ativa',
    escalated: 'Escalada',
    closed: 'Encerrada',
  };

  const stats = {
    total: conversations.length,
    active: conversations.filter(c => c.status === 'active').length,
    escalated: conversations.filter(c => c.status === 'escalated').length,
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center">
          <Users className="h-5 w-5 mx-auto text-muted-foreground" />
          <p className="text-2xl font-bold mt-1">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <Clock className="h-5 w-5 mx-auto text-green-600" />
          <p className="text-2xl font-bold mt-1 text-green-600">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Ativas</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto text-yellow-600" />
          <p className="text-2xl font-bold mt-1 text-yellow-600">{stats.escalated}</p>
          <p className="text-xs text-muted-foreground">Escaladas</p>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" style={{ minHeight: '500px' }}>
        {/* Conversation list */}
        <Card className="lg:col-span-1">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Conversas</CardTitle>
              <Button variant="ghost" size="icon" onClick={fetchConversations}><RefreshCw className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-y-auto max-h-[500px]">
            {loading ? (
              <p className="p-4 text-sm text-muted-foreground">A carregar...</p>
            ) : conversations.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">Nenhuma conversa ainda.</p>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.id}
                  onClick={() => loadMessages(conv.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border hover:bg-muted/50 transition-colors ${selected === conv.id ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium truncate">{conv.visitor_name}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusColors[conv.status] || ''}`}>
                      {statusLabels[conv.status] || conv.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(conv.created_at), "d MMM, HH:mm", { locale: pt })}
                  </p>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Chat view */}
        <Card className="lg:col-span-2 flex flex-col">
          {!selected ? (
            <CardContent className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Seleciona uma conversa para ver as mensagens
            </CardContent>
          ) : (
            <>
              <CardHeader className="py-3 px-4 border-b space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Mensagens</CardTitle>
                  {conversations.find(c => c.id === selected)?.status !== 'closed' && (
                    <Button size="sm" variant="outline" onClick={() => closeConversation(selected)}>Encerrar</Button>
                  )}
                </div>
                {(() => {
                  const conv = conversations.find(c => c.id === selected);
                  if (!conv) return null;
                  return (
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {conv.visitor_email && (
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{conv.visitor_email}</span>
                      )}
                      {conv.visitor_phone && (
                        <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{conv.visitor_phone}</span>
                      )}
                    </div>
                  );
                })()}
              </CardHeader>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    <div className={`rounded-xl px-3 py-2 max-w-[80%] text-sm ${
                      msg.role === 'user' ? 'bg-primary text-primary-foreground' :
                      msg.role === 'admin' ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-200' :
                      'bg-muted'
                    }`}>
                      {msg.role === 'admin' && <p className="text-[10px] font-semibold mb-0.5 opacity-70">Admin</p>}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p className="text-[10px] opacity-50 mt-1">{format(new Date(msg.created_at), 'HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
              {conversations.find(c => c.id === selected)?.status !== 'closed' && (
                <div className="p-3 border-t space-y-2">
                  <div className="flex gap-1">
                    {[
                      { key: 'message' as const, label: 'Mensagem', icon: MessageCircle },
                      { key: 'email' as const, label: 'Email', icon: Mail },
                      { key: 'whatsapp' as const, label: 'WhatsApp', icon: Phone },
                    ].map(ch => {
                      const conv = conversations.find(c => c.id === selected);
                      const disabled = (ch.key === 'email' && !conv?.visitor_email) || (ch.key === 'whatsapp' && !conv?.visitor_phone);
                      return (
                        <Button
                          key={ch.key}
                          size="sm"
                          variant={replyChannel === ch.key ? 'default' : 'outline'}
                          className="gap-1 text-xs"
                          disabled={disabled}
                          onClick={() => setReplyChannel(ch.key)}
                        >
                          <ch.icon className="h-3 w-3" />
                          {ch.label}
                        </Button>
                      );
                    })}
                  </div>
                  <form onSubmit={(e) => { e.preventDefault(); sendAdminReply(); }} className="flex gap-2">
                    <Input
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder={
                        replyChannel === 'email' ? 'Escrever email...' :
                        replyChannel === 'whatsapp' ? 'Escrever mensagem WhatsApp...' :
                        'Responder como admin...'
                      }
                      maxLength={2000}
                    />
                    <Button type="submit" size="icon" disabled={!reply.trim() || sending}><Send className="h-4 w-4" /></Button>
                  </form>
                  {replyChannel === 'email' && (
                    <p className="text-[10px] text-muted-foreground">A resposta será enviada para {conversations.find(c => c.id === selected)?.visitor_email}</p>
                  )}
                  {replyChannel === 'whatsapp' && (
                    <p className="text-[10px] text-muted-foreground">A resposta será enviada via WhatsApp para {conversations.find(c => c.id === selected)?.visitor_phone}</p>
                  )}
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const [settings, setSettings] = useState<AssistantSettings>({
    assistant_name: 'Assistente Virtual',
    greeting_message: '',
    system_prompt: '',
    knowledge_base: '',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from('assistant_settings').select('*').eq('id', 1).single().then(({ data }) => {
      if (data) setSettings({
        assistant_name: data.assistant_name,
        greeting_message: data.greeting_message,
        system_prompt: data.system_prompt,
        knowledge_base: data.knowledge_base,
        is_active: data.is_active,
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('assistant_settings').update({
      ...settings,
      updated_at: new Date().toISOString(),
    }).eq('id', 1);
    if (error) toast.error('Erro ao guardar');
    else toast.success('Configurações guardadas!');
    setSaving(false);
  };

  if (loading) return <p className="text-muted-foreground">A carregar...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader><CardTitle className="text-base">Configuração do Assistente</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <Label>Assistente ativo</Label>
            <Switch checked={settings.is_active} onCheckedChange={(v) => setSettings(s => ({ ...s, is_active: v }))} />
          </div>

          <div className="space-y-2">
            <Label>Nome do assistente</Label>
            <Input value={settings.assistant_name} onChange={(e) => setSettings(s => ({ ...s, assistant_name: e.target.value }))} maxLength={100} />
          </div>

          <div className="space-y-2">
            <Label>Mensagem de boas-vindas</Label>
            <Textarea value={settings.greeting_message} onChange={(e) => setSettings(s => ({ ...s, greeting_message: e.target.value }))} rows={3} maxLength={500} />
          </div>

          <div className="space-y-2">
            <Label>Prompt do sistema (instruções para a IA)</Label>
            <Textarea value={settings.system_prompt} onChange={(e) => setSettings(s => ({ ...s, system_prompt: e.target.value }))} rows={6} maxLength={5000} />
            <p className="text-xs text-muted-foreground">Define como a assistente deve se comportar, que tom usar, e que informações deve fornecer.</p>
          </div>

          <div className="space-y-2">
            <Label>Base de conhecimento</Label>
            <Textarea value={settings.knowledge_base} onChange={(e) => setSettings(s => ({ ...s, knowledge_base: e.target.value }))} rows={8} maxLength={10000} placeholder="Cole aqui informações detalhadas sobre serviços, preços, processos, FAQ, etc. A assistente usará este conteúdo para responder." />
            <p className="text-xs text-muted-foreground">Informações adicionais que a assistente pode usar para responder de forma mais completa.</p>
          </div>

          <Button onClick={save} disabled={saving} className="w-full">{saving ? 'A guardar...' : 'Guardar Configurações'}</Button>
        </CardContent>
      </Card>
    </div>
  );
}
