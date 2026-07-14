import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

type Category = 'urgency' | 'complaint_legal' | 'human_request';

interface Row {
  category: Category;
  sla_minutes: number;
  queue_priority: number;
}

const LABELS: Record<Category, { title: string; description: string }> = {
  urgency: { title: 'Urgência', description: 'Mensagens marcadas como urgentes (ex.: "urgente", "emergência").' },
  complaint_legal: { title: 'Reclamação / Jurídico', description: 'Reclamações formais, ameaças legais ou casos sensíveis.' },
  human_request: { title: 'Pedido de humano', description: 'Cliente pede explicitamente para falar com uma pessoa.' },
};

const ORDER: Category[] = ['urgency', 'complaint_legal', 'human_request'];

export default function WhatsAppSlaSettings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('handoff_sla_settings' as never)
      .select('category, sla_minutes, queue_priority');
    if (error) {
      toast.error('Erro a carregar SLA: ' + error.message);
    } else {
      const map = new Map((data ?? []).map((r: any) => [r.category, r]));
      setRows(
        ORDER.map((cat) => {
          const r: any = map.get(cat);
          return {
            category: cat,
            sla_minutes: r?.sla_minutes ?? (cat === 'human_request' ? 120 : 30),
            queue_priority: r?.queue_priority ?? (cat === 'human_request' ? 2 : 1),
          };
        }),
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateRow = (cat: Category, patch: Partial<Row>) => {
    setRows((prev) => prev.map((r) => (r.category === cat ? { ...r, ...patch } : r)));
  };

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = rows.map((r) => ({ ...r, updated_by: u.user?.id ?? null, updated_at: new Date().toISOString() }));
    const { error } = await supabase.from('handoff_sla_settings' as never).upsert(payload as any, { onConflict: 'category' });
    setSaving(false);
    if (error) toast.error('Erro a guardar: ' + error.message);
    else toast.success('SLA atualizado. Novas escalações usam já estes valores.');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">SLA por categoria</h2>
        <p className="text-sm text-muted-foreground">
          Define quanto tempo o Nuno tem para responder antes de reatribuir/escalar.
          As alterações aplicam-se a novos escalonamentos sem redeploy.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((r) => (
          <Card key={r.category}>
            <CardHeader>
              <CardTitle>{LABELS[r.category].title}</CardTitle>
              <CardDescription>{LABELS[r.category].description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`sla-${r.category}`}>SLA (minutos)</Label>
                <Input
                  id={`sla-${r.category}`}
                  type="number"
                  min={1}
                  max={1440}
                  value={r.sla_minutes}
                  onChange={(e) => updateRow(r.category, { sla_minutes: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`prio-${r.category}`}>Prioridade na fila (1 = mais alta)</Label>
                <Input
                  id={`prio-${r.category}`}
                  type="number"
                  min={1}
                  max={5}
                  value={r.queue_priority}
                  onChange={(e) => updateRow(r.category, { queue_priority: Math.min(5, Math.max(1, Number(e.target.value) || 1)) })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
