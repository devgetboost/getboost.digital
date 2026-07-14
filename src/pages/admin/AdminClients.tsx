import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Plus, Users, Briefcase, CreditCard, LifeBuoy, Search, Send, RefreshCw, Receipt, Sparkles, Calendar, ChevronRight, CircleDot, Pencil, Upload, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import { ClientAutomationPanel } from '@/components/admin/ClientAutomationPanel';

const AdminClients = () => {
  const [clients, setClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('services');

  // Create client state
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);

  // Add service state
  const [addServiceOpen, setAddServiceOpen] = useState(false);
  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcStatus, setSvcStatus] = useState('pending');

  // Add subscription state
  const [addSubOpen, setAddSubOpen] = useState(false);
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subCycle, setSubCycle] = useState('monthly');

  // Add invoice state
  const [addInvOpen, setAddInvOpen] = useState(false);
  const [invNumber, setInvNumber] = useState('');
  const [invDesc, setInvDesc] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('');

  // Edit client state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editCompany, setEditCompany] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    const { data: roles } = await supabase.from('user_roles').select('user_id, role').eq('role', 'user');
    if (!roles || roles.length === 0) { setClients([]); setLoading(false); return; }
    const userIds = roles.map(r => r.user_id);
    const [{ data: profiles }, { data: svcAll }, { data: subAll }, { data: tktAll }, { data: invAll }] = await Promise.all([
      supabase.from('profiles').select('*').in('user_id', userIds),
      supabase.from('client_services').select('user_id, status').in('user_id', userIds),
      supabase.from('client_subscriptions').select('user_id, status, amount, billing_cycle').in('user_id', userIds),
      supabase.from('support_tickets').select('user_id, status').in('user_id', userIds),
      supabase.from('client_invoices').select('user_id, status, amount').in('user_id', userIds),
    ]);
    const enriched = (profiles || []).map((p: any) => {
      const svc = (svcAll || []).filter((s: any) => s.user_id === p.user_id);
      const sub = (subAll || []).filter((s: any) => s.user_id === p.user_id);
      const tkt = (tktAll || []).filter((t: any) => t.user_id === p.user_id);
      const inv = (invAll || []).filter((i: any) => i.user_id === p.user_id);
      const mrr = sub.filter((s: any) => s.status === 'active').reduce((acc: number, s: any) => {
        const a = Number(s.amount) || 0;
        if (s.billing_cycle === 'yearly') return acc + a / 12;
        if (s.billing_cycle === 'quarterly') return acc + a / 3;
        return acc + a;
      }, 0);
      return {
        ...p,
        _stats: {
          services: svc.length,
          activeServices: svc.filter((s: any) => s.status === 'in_progress').length,
          subscriptions: sub.filter((s: any) => s.status === 'active').length,
          openTickets: tkt.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length,
          pendingInvoices: inv.filter((i: any) => i.status === 'pending' || i.status === 'overdue').length,
          mrr,
        },
      };
    });
    setClients(enriched);
    setLoading(false);
  };

  const selectClient = async (client: any) => {
    setSelectedClient(client);
    const uid = client.user_id;
    const [svc, sub, inv, tkt] = await Promise.all([
      supabase.from('client_services').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('client_subscriptions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('client_invoices').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
    ]);
    setServices(svc.data || []);
    setSubscriptions(sub.data || []);
    setInvoices(inv.data || []);
    setTickets(tkt.data || []);
    setSelectedTicket(null);
  };

  const createClientAccount = async () => {
    if (!newEmail.trim() || !newPassword.trim() || !newName.trim()) return;
    setCreating(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const { data, error } = await supabase.functions.invoke('create-client', {
        body: {
          email: newEmail.trim(),
          password: newPassword.trim(),
          name: newName.trim(),
          phone: newPhone.trim(),
        },
      });

      if (error || data?.error) {
        toast.error('Erro ao criar conta: ' + (data?.error || error?.message));
        setCreating(false);
        return;
      }

      toast.success(`Conta criada para ${newEmail}!`);
      setCreateOpen(false);
      setNewName(''); setNewEmail(''); setNewPhone(''); setNewPassword('');
      loadClients();
    } catch (err: any) {
      toast.error('Erro ao criar conta: ' + (err?.message || 'Erro desconhecido'));
    } finally {
      setCreating(false);
    }
  };

  const addService = async () => {
    if (!selectedClient || !svcName.trim()) return;
    const { error } = await supabase.from('client_services').insert({
      user_id: selectedClient.user_id,
      service_name: svcName.trim(),
      description: svcDesc.trim(),
      status: svcStatus,
    });
    if (error) toast.error('Erro ao adicionar serviço.');
    else { toast.success('Serviço adicionado!'); setAddServiceOpen(false); setSvcName(''); setSvcDesc(''); selectClient(selectedClient); }
  };

  const addSubscription = async () => {
    if (!selectedClient || !subName.trim() || !subAmount) return;
    const { error } = await supabase.from('client_subscriptions').insert({
      user_id: selectedClient.user_id,
      name: subName.trim(),
      amount: parseFloat(subAmount),
      billing_cycle: subCycle,
    });
    if (error) toast.error('Erro ao adicionar assinatura.');
    else { toast.success('Assinatura adicionada!'); setAddSubOpen(false); setSubName(''); setSubAmount(''); selectClient(selectedClient); }
  };

  const addInvoice = async () => {
    if (!selectedClient || !invNumber.trim() || !invAmount) return;
    const { error } = await supabase.from('client_invoices').insert({
      user_id: selectedClient.user_id,
      invoice_number: invNumber.trim(),
      description: invDesc.trim(),
      amount: parseFloat(invAmount),
      due_date: invDueDate || null,
    });
    if (error) toast.error('Erro ao adicionar fatura.');
    else { toast.success('Fatura adicionada!'); setAddInvOpen(false); setInvNumber(''); setInvDesc(''); setInvAmount(''); setInvDueDate(''); selectClient(selectedClient); }
  };

  const updateServiceStatus = async (id: string, status: string) => {
    await supabase.from('client_services').update({ status }).eq('id', id);
    selectClient(selectedClient);
  };

  const openEditClient = () => {
    if (!selectedClient) return;
    setEditName(selectedClient.display_name || '');
    setEditEmail(selectedClient.email || '');
    setEditPhone(selectedClient.phone || '');
    setEditCompany(selectedClient.company || '');
    setEditNotes(selectedClient.notes || '');
    setEditAvatarUrl(selectedClient.avatar_url || '');
    setEditOpen(true);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!selectedClient || !file) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `${selectedClient.user_id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setEditAvatarUrl(data.publicUrl);
      toast.success('Foto carregada!');
    } catch (err: any) {
      toast.error('Erro ao carregar foto: ' + (err?.message || 'desconhecido'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveClientEdit = async () => {
    if (!selectedClient) return;
    setSavingEdit(true);
    try {
      const { error } = await supabase.from('profiles').update({
        display_name: editName.trim() || null,
        email: editEmail.trim() || null,
        phone: editPhone.trim() || null,
        company: editCompany.trim() || null,
        notes: editNotes.trim() || null,
        avatar_url: editAvatarUrl || null,
      }).eq('user_id', selectedClient.user_id);
      if (error) throw error;
      toast.success('Cliente atualizado!');
      setEditOpen(false);
      const updated = { ...selectedClient, display_name: editName, email: editEmail, phone: editPhone, company: editCompany, notes: editNotes, avatar_url: editAvatarUrl };
      setSelectedClient(updated);
      loadClients();
    } catch (err: any) {
      toast.error('Erro ao guardar: ' + (err?.message || 'desconhecido'));
    } finally {
      setSavingEdit(false);
    }
  };


  const updateTicketStatus = async (id: string, status: string) => {
    await supabase.from('support_tickets').update({ status, ...(status === 'closed' ? { closed_at: new Date().toISOString() } : {}) }).eq('id', id);
    selectClient(selectedClient);
  };

  const openTicketMessages = async (ticket: any) => {
    setSelectedTicket(ticket);
    const { data } = await supabase.from('ticket_messages').select('*').eq('ticket_id', ticket.id).order('created_at', { ascending: true });
    setTicketMessages(data || []);
  };

  const sendReply = async () => {
    if (!replyMessage.trim() || !selectedTicket) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: session.user.id,
      sender_role: 'admin',
      content: replyMessage.trim(),
    });
    setReplyMessage('');
    openTicketMessages(selectedTicket);
  };

  const filteredClients = clients.filter(c => 
    (c.display_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.user_id || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm text-muted-foreground">A carregar clientes...</p></div>;

  if (selectedClient) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>← Voltar</Button>
            <Avatar className="h-12 w-12 ring-2 ring-primary/10">
              <AvatarImage src={selectedClient.avatar_url || undefined} alt={selectedClient.display_name || 'Cliente'} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {(selectedClient.display_name || '?').split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold text-foreground">{selectedClient.display_name || 'Cliente'}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                {selectedClient.email && <span>{selectedClient.email}</span>}
                {selectedClient.phone && <span>· {selectedClient.phone}</span>}
                {selectedClient.company && <span>· {selectedClient.company}</span>}
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={openEditClient} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Editar Cliente
          </Button>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Editar dados do cliente</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 ring-2 ring-primary/20">
                  <AvatarImage src={editAvatarUrl || undefined} alt={editName} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                    {(editName || '?').split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload" className="text-xs text-muted-foreground">Foto do cliente</Label>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" disabled={uploadingAvatar}>
                      <label htmlFor="avatar-upload" className="cursor-pointer gap-2">
                        {uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                        {uploadingAvatar ? 'A carregar...' : 'Carregar foto'}
                      </label>
                    </Button>
                    {editAvatarUrl && (
                      <Button variant="ghost" size="sm" onClick={() => setEditAvatarUrl('')}>Remover</Button>
                    )}
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Nome</Label>
                  <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nome completo" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@dominio.pt" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone</Label>
                  <Input value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="+351..." />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Empresa</Label>
                  <Input value={editCompany} onChange={e => setEditCompany(e.target.value)} placeholder="Nome da empresa" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Notas internas</Label>
                  <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} placeholder="Notas visíveis apenas para admins" rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={saveClientEdit} disabled={savingEdit}>
                  {savingEdit ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar</> : 'Guardar alterações'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto w-full justify-start gap-1">
            <TabsTrigger value="services" className="gap-1"><Briefcase className="h-3.5 w-3.5" /> Serviços</TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-1"><RefreshCw className="h-3.5 w-3.5" /> Assinaturas</TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1"><Receipt className="h-3.5 w-3.5" /> Faturas</TabsTrigger>
            <TabsTrigger value="tickets" className="gap-1"><LifeBuoy className="h-3.5 w-3.5" /> Tickets</TabsTrigger>
            <TabsTrigger value="automation" className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Automação</TabsTrigger>
          </TabsList>

          <TabsContent value="automation" className="mt-4">
            <ClientAutomationPanel client={selectedClient} />
          </TabsContent>


          <TabsContent value="services" className="mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={addServiceOpen} onOpenChange={setAddServiceOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar Serviço</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Novo Serviço</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Nome do serviço" value={svcName} onChange={e => setSvcName(e.target.value)} />
                    <Textarea placeholder="Descrição" value={svcDesc} onChange={e => setSvcDesc(e.target.value)} />
                    <Select value={svcStatus} onValueChange={setSvcStatus}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="in_progress">Em Progresso</SelectItem>
                        <SelectItem value="completed">Concluído</SelectItem>
                        <SelectItem value="awaiting_approval">Aguarda Aprovação</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addService} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Serviço</TableHead><TableHead>Estado</TableHead><TableHead>Progresso</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
              <TableBody>
                {services.map(s => (
                  <TableRow key={s.id}>
                    <TableCell><p className="font-medium">{s.service_name}</p><p className="text-xs text-muted-foreground">{s.description}</p></TableCell>
                    <TableCell>
                      <Select value={s.status} onValueChange={v => updateServiceStatus(s.id, v)}>
                        <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="in_progress">Em Progresso</SelectItem>
                          <SelectItem value="completed">Concluído</SelectItem>
                          <SelectItem value="awaiting_approval">Aguarda Aprovação</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{s.progress}%</TableCell>
                    <TableCell>—</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="subscriptions" className="mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={addSubOpen} onOpenChange={setAddSubOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar Assinatura</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Assinatura</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Nome da assinatura" value={subName} onChange={e => setSubName(e.target.value)} />
                    <Input placeholder="Valor (€)" type="number" value={subAmount} onChange={e => setSubAmount(e.target.value)} />
                    <Select value={subCycle} onValueChange={setSubCycle}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Mensal</SelectItem>
                        <SelectItem value="yearly">Anual</SelectItem>
                        <SelectItem value="quarterly">Trimestral</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={addSubscription} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Assinatura</TableHead><TableHead>Valor</TableHead><TableHead>Ciclo</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {subscriptions.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{Number(s.amount).toFixed(2)}€</TableCell>
                    <TableCell>{s.billing_cycle}</TableCell>
                    <TableCell><Badge>{s.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="invoices" className="mt-4">
            <div className="flex justify-end mb-4">
              <Dialog open={addInvOpen} onOpenChange={setAddInvOpen}>
                <DialogTrigger asChild><Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Adicionar Fatura</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Nova Fatura</DialogTitle></DialogHeader>
                  <div className="space-y-3 mt-2">
                    <Input placeholder="Nº da fatura" value={invNumber} onChange={e => setInvNumber(e.target.value)} />
                    <Input placeholder="Descrição" value={invDesc} onChange={e => setInvDesc(e.target.value)} />
                    <Input placeholder="Valor (€)" type="number" value={invAmount} onChange={e => setInvAmount(e.target.value)} />
                    <Input type="date" value={invDueDate} onChange={e => setInvDueDate(e.target.value)} />
                    <Button onClick={addInvoice} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Table>
              <TableHeader><TableRow><TableHead>Fatura</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
              <TableBody>
                {invoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.description}</TableCell>
                    <TableCell>{Number(inv.amount).toFixed(2)}€</TableCell>
                    <TableCell>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('pt-PT') : '—'}</TableCell>
                    <TableCell><Badge>{inv.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="tickets" className="mt-4">
            {selectedTicket ? (
              <div>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)} className="mb-3">← Voltar</Button>
                <Card className="border-border/40">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base">{selectedTicket.subject}</CardTitle>
                        <p className="text-xs text-muted-foreground">{selectedTicket.description}</p>
                      </div>
                      <Select value={selectedTicket.status} onValueChange={v => updateTicketStatus(selectedTicket.id, v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Aberto</SelectItem>
                          <SelectItem value="in_progress">Em Curso</SelectItem>
                          <SelectItem value="resolved">Resolvido</SelectItem>
                          <SelectItem value="closed">Fechado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] border rounded-lg p-3 mb-3">
                      {ticketMessages.map(m => (
                        <div key={m.id} className={`mb-2 flex ${m.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${m.sender_role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-[10px] font-medium mb-0.5">{m.sender_role === 'admin' ? 'Admin' : 'Cliente'}</p>
                            <p>{m.content}</p>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input value={replyMessage} onChange={e => setReplyMessage(e.target.value)} placeholder="Responder..." onKeyDown={e => e.key === 'Enter' && sendReply()} />
                      <Button onClick={sendReply} size="icon"><Send className="h-4 w-4" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Assunto</TableHead><TableHead>Prioridade</TableHead><TableHead>Estado</TableHead><TableHead>Data</TableHead></TableRow></TableHeader>
                <TableBody>
                  {tickets.map(t => (
                    <TableRow key={t.id} className="cursor-pointer" onClick={() => openTicketMessages(t)}>
                      <TableCell className="font-medium">{t.subject}</TableCell>
                      <TableCell>{t.priority}</TableCell>
                      <TableCell><Badge>{t.status}</Badge></TableCell>
                      <TableCell>{new Date(t.created_at).toLocaleDateString('pt-PT')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestão de Clientes</h2>
          <p className="text-sm text-muted-foreground">Gere os teus clientes, serviços, assinaturas e tickets</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Conta de Cliente</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Nome completo *" value={newName} onChange={e => setNewName(e.target.value)} />
              <Input placeholder="Email *" type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
              <Input placeholder="Telefone" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
              <Input placeholder="Password temporária *" type="text" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              <p className="text-xs text-muted-foreground">O cliente receberá um email de confirmação com os dados de acesso.</p>
              <Button onClick={createClientAccount} disabled={creating || !newName.trim() || !newEmail.trim() || !newPassword.trim()} className="w-full">
                {creating ? 'A criar...' : 'Criar Conta'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Pesquisar clientes..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {filteredClients.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Sem clientes registados. Cria o primeiro cliente acima.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((c, i) => {
            const stats = c._stats || {};
            const name = c.display_name || 'Sem nome';
            const initials = name.split(' ').map((n: string) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
            const created = c.created_at ? new Date(c.created_at).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
            const hasAlerts = stats.openTickets > 0 || stats.pendingInvoices > 0;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card
                  className="group relative overflow-hidden border-border/40 cursor-pointer hover:border-primary/40 hover:shadow-lg transition-all duration-300"
                  onClick={() => selectClient(c)}
                >
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 ring-2 ring-primary/10">
                        <AvatarImage src={c.avatar_url || undefined} alt={name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-sm truncate">{name}</h3>
                          {hasAlerts && <CircleDot className="h-3 w-3 text-destructive shrink-0" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">{c.user_id.substring(0, 8)}…</p>
                        {created && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Calendar className="h-3 w-3" /> Desde {created}
                          </p>
                        )}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          <Briefcase className="h-3 w-3" /> Serviços
                        </div>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {stats.services || 0}
                          {stats.activeServices > 0 && <span className="text-[10px] text-primary font-medium ml-1">· {stats.activeServices} ativo</span>}
                        </p>
                      </div>
                      <div className="rounded-lg bg-muted/40 px-2.5 py-2">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          <RefreshCw className="h-3 w-3" /> MRR
                        </div>
                        <p className="text-sm font-bold text-foreground mt-0.5">
                          {stats.mrr ? `${stats.mrr.toFixed(0)}€` : '—'}
                          {stats.subscriptions > 0 && <span className="text-[10px] text-muted-foreground font-medium ml-1">· {stats.subscriptions}</span>}
                        </p>
                      </div>
                    </div>

                    {(stats.openTickets > 0 || stats.pendingInvoices > 0) && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {stats.openTickets > 0 && (
                          <Badge variant="secondary" className="gap-1 text-[10px] bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15">
                            <LifeBuoy className="h-3 w-3" /> {stats.openTickets} ticket{stats.openTickets > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {stats.pendingInvoices > 0 && (
                          <Badge variant="secondary" className="gap-1 text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15">
                            <Receipt className="h-3 w-3" /> {stats.pendingInvoices} fatura{stats.pendingInvoices > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminClients;
