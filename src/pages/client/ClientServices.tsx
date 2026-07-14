import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { Briefcase, Calendar, ArrowRight } from 'lucide-react';

const statusColors: Record<string, string> = {
  in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  awaiting_approval: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const statusLabels: Record<string, string> = {
  in_progress: 'Em Progresso',
  completed: 'Concluído',
  pending: 'Pendente',
  awaiting_approval: 'Aguarda Aprovação',
};

const ClientServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from('client_services')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      setServices(data || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><p className="text-sm text-muted-foreground">A carregar...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Os Meus Serviços</h2>
        <p className="text-sm text-muted-foreground mt-1">Acompanha o estado dos teus serviços contratados</p>
      </div>

      {services.length === 0 ? (
        <Card className="border-border/40">
          <CardContent className="py-12 text-center">
            <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Ainda não tens serviços atribuídos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/40 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Briefcase className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{s.service_name}</h3>
                          <p className="text-xs text-muted-foreground">{s.description}</p>
                        </div>
                      </div>

                      {s.progress > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium text-foreground">{s.progress}%</span>
                          </div>
                          <Progress value={s.progress} className="h-2" />
                        </div>
                      )}

                      {s.next_step && (
                        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                          <ArrowRight className="h-3 w-3 text-primary" />
                          <span>Próximo passo: <strong className="text-foreground">{s.next_step}</strong></span>
                        </div>
                      )}

                      {s.visible_notes && (
                        <p className="mt-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">{s.visible_notes}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
                        {s.start_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Início: {new Date(s.start_date).toLocaleDateString('pt-PT')}</span>
                        )}
                        {s.end_date && (
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Fim previsto: {new Date(s.end_date).toLocaleDateString('pt-PT')}</span>
                        )}
                      </div>
                    </div>

                    <Badge className={`${statusColors[s.status] || ''} shrink-0`}>
                      {statusLabels[s.status] || s.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientServices;
