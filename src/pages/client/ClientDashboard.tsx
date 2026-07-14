import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, CreditCard, LifeBuoy, Bell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const statusColors: Record<string, string> = {
  in_progress: 'bg-blue-500/10 text-blue-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  pending: 'bg-amber-500/10 text-amber-600',
  awaiting_approval: 'bg-purple-500/10 text-purple-600',
};

const statusLabels: Record<string, string> = {
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  pending: 'Pendente',
  awaiting_approval: 'Aguarda Aprovação',
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const uid = session.user.id;

    const { data: profile } = await supabase.from('profiles').select('display_name').eq('user_id', uid).maybeSingle();
    setUserName(profile?.display_name || session.user.email?.split('@')[0] || 'Cliente');

    const [svc, inv, tkt, notif] = await Promise.all([
      supabase.from('client_services').select('*').eq('user_id', uid).order('created_at', { ascending: false }).limit(5),
      supabase.from('client_invoices').select('*').eq('user_id', uid).eq('status', 'pending').order('due_date', { ascending: true }).limit(5),
      supabase.from('support_tickets').select('*').eq('user_id', uid).neq('status', 'closed').order('created_at', { ascending: false }).limit(5),
      supabase.from('client_notifications').select('*').eq('user_id', uid).eq('is_read', false).order('created_at', { ascending: false }).limit(5),
    ]);
    setServices(svc.data || []);
    setInvoices(inv.data || []);
    setTickets(tkt.data || []);
    setNotifications(notif.data || []);
  };

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  })();

  const stats = [
    { label: 'Serviços Ativos', value: services.filter(s => s.status !== 'completed').length, icon: Briefcase, color: 'text-blue-600 bg-blue-500/10' },
    { label: 'Pagamentos Pendentes', value: invoices.length, icon: CreditCard, color: 'text-amber-600 bg-amber-500/10' },
    { label: 'Tickets Abertos', value: tickets.length, icon: LifeBuoy, color: 'text-emerald-600 bg-emerald-500/10' },
    { label: 'Notificações', value: notifications.length, icon: Bell, color: 'text-purple-600 bg-purple-500/10' },
  ];

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-2xl font-bold text-foreground">{greeting}, {userName}!</h2>
        <p className="text-muted-foreground text-sm mt-1">Resumo da tua conta</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Services */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Serviços Recentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cliente/servicos')} className="text-xs gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem serviços ativos</p>
            ) : services.map(s => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{s.service_name}</p>
                  <p className="text-xs text-muted-foreground">{s.visible_notes || s.description}</p>
                </div>
                <Badge variant="secondary" className={statusColors[s.status] || ''}>
                  {statusLabels[s.status] || s.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Invoices */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Pagamentos Pendentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cliente/financeiro')} className="text-xs gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Tudo em dia! 🎉</p>
            ) : invoices.map(inv => (
              <div key={inv.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{inv.description}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{inv.amount}€</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tickets */}
        <Card className="border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Tickets de Suporte</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/cliente/suporte')} className="text-xs gap-1">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem tickets abertos</p>
            ) : tickets.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.subject}</p>
                  <p className="text-xs text-muted-foreground">Prioridade: {t.priority}</p>
                </div>
                <Badge variant="secondary">{t.status === 'open' ? 'Aberto' : t.status === 'in_progress' ? 'Em Curso' : t.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Notificações Recentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notifications.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Sem novas notificações</p>
            ) : notifications.map(n => (
              <div key={n.id} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ClientDashboard;
