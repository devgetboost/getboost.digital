import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { CreditCard, Receipt, RefreshCw, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const subStatusLabels: Record<string, string> = { active: 'Ativa', suspended: 'Suspensa', cancelled: 'Cancelada' };
const subStatusColors: Record<string, string> = { active: 'bg-emerald-500/10 text-emerald-600', suspended: 'bg-amber-500/10 text-amber-600', cancelled: 'bg-red-500/10 text-red-600' };
const invStatusLabels: Record<string, string> = { pending: 'Pendente', paid: 'Pago', overdue: 'Vencido', cancelled: 'Cancelado' };
const invStatusColors: Record<string, string> = { pending: 'bg-amber-500/10 text-amber-600', paid: 'bg-emerald-500/10 text-emerald-600', overdue: 'bg-red-500/10 text-red-600', cancelled: 'bg-muted text-muted-foreground' };

const ClientFinances = () => {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const [subs, invs] = await Promise.all([
        supabase.from('client_subscriptions').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('client_invoices').select('*').eq('user_id', uid).order('created_at', { ascending: false }),
      ]);
      setSubscriptions(subs.data || []);
      setInvoices(invs.data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm text-muted-foreground">A carregar...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
        <p className="text-sm text-muted-foreground mt-1">Consulta as tuas assinaturas, faturas e pagamentos</p>
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions" className="gap-2"><RefreshCw className="h-3.5 w-3.5" /> Assinaturas</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2"><Receipt className="h-3.5 w-3.5" /> Faturas</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions" className="mt-4 space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="border-border/40"><CardContent className="py-12 text-center"><p className="text-muted-foreground">Sem assinaturas ativas.</p></CardContent></Card>
          ) : subscriptions.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{s.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {Number(s.amount).toFixed(2)}€/{s.billing_cycle === 'monthly' ? 'mês' : s.billing_cycle === 'yearly' ? 'ano' : s.billing_cycle}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {s.renewal_date && (
                        <span className="text-xs text-muted-foreground">
                          Renovação: {new Date(s.renewal_date).toLocaleDateString('pt-PT')}
                        </span>
                      )}
                      <Badge className={subStatusColors[s.status] || ''}>{subStatusLabels[s.status] || s.status}</Badge>
                    </div>
                  </div>
                  {s.payment_method && <p className="text-xs text-muted-foreground mt-2">Método: {s.payment_method}</p>}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        <TabsContent value="invoices" className="mt-4 space-y-4">
          {invoices.length === 0 ? (
            <Card className="border-border/40"><CardContent className="py-12 text-center"><p className="text-muted-foreground">Sem faturas registadas.</p></CardContent></Card>
          ) : invoices.map((inv, i) => (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/40">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{inv.invoice_number}</h3>
                        <p className="text-xs text-muted-foreground">{inv.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">{Number(inv.amount).toFixed(2)}€</span>
                      {inv.due_date && <span className="text-xs text-muted-foreground">Vence: {new Date(inv.due_date).toLocaleDateString('pt-PT')}</span>}
                      <Badge className={invStatusColors[inv.status] || ''}>{invStatusLabels[inv.status] || inv.status}</Badge>
                      {inv.pdf_url && (
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={inv.pdf_url} target="_blank" rel="noopener noreferrer"><Download className="h-4 w-4" /></a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ClientFinances;
