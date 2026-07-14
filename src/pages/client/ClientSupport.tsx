import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { LifeBuoy, Plus, Send, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const statusLabels: Record<string, string> = { open: 'Aberto', in_progress: 'Em Curso', resolved: 'Resolvido', closed: 'Fechado' };
const statusColors: Record<string, string> = { open: 'bg-blue-500/10 text-blue-600', in_progress: 'bg-amber-500/10 text-amber-600', resolved: 'bg-emerald-500/10 text-emerald-600', closed: 'bg-muted text-muted-foreground' };
const priorityLabels: Record<string, string> = { low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente' };

const ClientSupport = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategory, setNewCategory] = useState('general');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);
  const [userId, setUserId] = useState('');

  useEffect(() => { loadTickets(); }, []);

  const loadTickets = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUserId(session.user.id);
    const { data } = await supabase.from('support_tickets').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false });
    setTickets(data || []);
    setLoading(false);
  };

  const loadMessages = async (ticketId: string) => {
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
    setMessages(data || []);
  };

  const openTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    loadMessages(ticket.id);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !userId) return;
    setSending(true);
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: userId,
      sender_role: 'client',
      content: newMessage.trim(),
    });
    if (error) { toast.error('Erro ao enviar mensagem.'); }
    else { setNewMessage(''); loadMessages(selectedTicket.id); }
    setSending(false);
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !userId) return;
    setCreating(true);
    const { error } = await supabase.from('support_tickets').insert({
      user_id: userId,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      category: newCategory,
      priority: newPriority,
    });
    if (error) { toast.error('Erro ao criar ticket.'); }
    else {
      toast.success('Ticket criado com sucesso!');
      setCreateOpen(false);
      setNewSubject(''); setNewDescription('');
      loadTickets();
    }
    setCreating(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm text-muted-foreground">A carregar...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Suporte</h2>
          <p className="text-sm text-muted-foreground mt-1">Cria e acompanha os teus pedidos de suporte</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Ticket de Suporte</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium">Assunto *</label>
                <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Descreve o problema brevemente" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Detalhes do pedido..." className="mt-1" rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Categoria</label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Geral</SelectItem>
                      <SelectItem value="technical">Técnico</SelectItem>
                      <SelectItem value="billing">Faturação</SelectItem>
                      <SelectItem value="feature">Funcionalidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Prioridade</label>
                  <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={createTicket} disabled={creating || !newSubject.trim()} className="w-full">
                {creating ? 'A criar...' : 'Criar Ticket'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {selectedTicket ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-4">← Voltar aos tickets</Button>
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{selectedTicket.subject}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTicket.description}</p>
                </div>
                <Badge className={statusColors[selectedTicket.status] || ''}>{statusLabels[selectedTicket.status] || selectedTicket.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] border border-border/30 rounded-lg p-4 mb-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Sem mensagens ainda. Envia a primeira!</p>
                ) : messages.map(m => (
                  <div key={m.id} className={`mb-3 flex ${m.sender_role === 'client' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                      m.sender_role === 'client' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                    }`}>
                      <p>{m.content}</p>
                      <p className={`text-[10px] mt-1 ${m.sender_role === 'client' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                        {new Date(m.created_at).toLocaleString('pt-PT')}
                      </p>
                    </div>
                  </div>
                ))}
              </ScrollArea>

              {selectedTicket.status !== 'closed' && (
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Escreve uma mensagem..."
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  />
                  <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="icon">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {tickets.length === 0 ? (
            <Card className="border-border/40">
              <CardContent className="py-12 text-center">
                <LifeBuoy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Sem tickets de suporte. Clica em "Novo Ticket" para criar um.</p>
              </CardContent>
            </Card>
          ) : tickets.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="border-border/40 cursor-pointer hover:shadow-md transition-shadow" onClick={() => openTicket(t)}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{t.subject}</h3>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{priorityLabels[t.priority] || t.priority}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(t.created_at).toLocaleDateString('pt-PT')}</span>
                      </div>
                    </div>
                  </div>
                  <Badge className={statusColors[t.status] || ''}>{statusLabels[t.status] || t.status}</Badge>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientSupport;
