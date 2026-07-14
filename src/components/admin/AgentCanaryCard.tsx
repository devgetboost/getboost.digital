import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Rocket, OctagonX, RefreshCw } from 'lucide-react';

type Row = {
  id: string;
  function_slug: string | null;
  active_version_id: string | null;
  canary_version_id: string | null;
  canary_percent: number;
  canary_started_at: string | null;
  canary_halted_at: string | null;
  canary_halted_reason: string | null;
  canary_min_samples: number;
  canary_min_minutes: number;
  canary_error_threshold_pct: number;
  canary_auto_promote: boolean;
};

export default function AgentCanaryCard({ agentId }: { agentId: string }) {
  const { toast } = useToast();
  const [row, setRow] = useState<Row | null>(null);
  const [total, setTotal] = useState(0);
  const [errors, setErrors] = useState(0);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('agentic_agents')
      .select('id,function_slug,active_version_id,canary_version_id,canary_percent,canary_started_at,canary_halted_at,canary_halted_reason,canary_min_samples,canary_min_minutes,canary_error_threshold_pct,canary_auto_promote')
      .eq('id', agentId)
      .maybeSingle();
    if (!data) { setRow(null); return; }
    setRow(data as Row);
    if (data.canary_version_id && data.canary_started_at) {
      const { data: logs } = await supabase
        .from('agentic_run_logs')
        .select('status')
        .eq('version_id', data.canary_version_id)
        .gte('created_at', data.canary_started_at);
      const rows = (logs ?? []) as { status: string }[];
      setTotal(rows.length);
      setErrors(rows.filter((r) => r.status === 'error').length);
    } else { setTotal(0); setErrors(0); }
  }, [agentId]);

  useEffect(() => { load(); }, [load]);

  if (!row) return null;

  const hasCanary = !!row.canary_version_id && row.canary_percent > 0;
  const halted = !!row.canary_halted_at;
  const ageMin = row.canary_started_at
    ? Math.max(0, (Date.now() - new Date(row.canary_started_at).getTime()) / 60000) : 0;
  const errorPct = total > 0 ? (errors / total) * 100 : 0;
  const samplesPct = Math.min(100, (total / Math.max(1, row.canary_min_samples)) * 100);
  const timePct = Math.min(100, (ageMin / Math.max(1, row.canary_min_minutes)) * 100);
  const promoteEligible = hasCanary && !halted
    && total >= row.canary_min_samples
    && ageMin >= row.canary_min_minutes
    && errorPct <= row.canary_error_threshold_pct;

  const promote = async () => {
    if (!row.canary_version_id) return;
    if (!confirm('Promover a versão canary para 100% agora?')) return;
    setBusy(true);
    const { error } = await supabase.from('agentic_agents').update({
      active_version_id: row.canary_version_id,
      canary_version_id: null,
      canary_percent: 0,
      canary_started_at: null,
      canary_halted_at: null,
      canary_halted_reason: null,
    }).eq('id', agentId);
    setBusy(false);
    if (error) toast({ title: 'Erro ao promover', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Canary promovido a 100%' }); load(); }
  };

  const halt = async () => {
    const reason = prompt('Motivo do halt manual:', 'Halt manual pelo admin');
    if (reason == null) return;
    setBusy(true);
    const { error } = await supabase.from('agentic_agents').update({
      canary_halted_at: new Date().toISOString(),
      canary_halted_reason: reason || 'Halt manual',
    }).eq('id', agentId);
    setBusy(false);
    if (error) toast({ title: 'Erro ao interromper', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Canary interrompido' }); load(); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          Canary & Deploy
          {row.function_slug && <Badge variant="outline" className="font-mono text-xs">{row.function_slug}</Badge>}
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={busy}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasCanary ? (
          <p className="text-sm text-muted-foreground">Sem canary ativo. Ativa numa versão em <em>Versões</em>.</p>
        ) : (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant={halted ? 'destructive' : 'default'}>
                {halted ? 'Halted' : `Canary ${row.canary_percent}%`}
              </Badge>
              {row.canary_auto_promote && !halted && (
                <Badge variant="secondary">Auto-promote on</Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Erro {errorPct.toFixed(1)}% / limite {row.canary_error_threshold_pct}%
              </span>
            </div>

            {halted && row.canary_halted_reason && (
              <div className="text-xs rounded-md border border-destructive/40 bg-destructive/10 p-2 text-destructive">
                {row.canary_halted_reason}
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Amostras</span><span>{total} / {row.canary_min_samples}</span>
              </div>
              <Progress value={samplesPct} />
              <div className="flex justify-between text-xs text-muted-foreground pt-2">
                <span>Tempo mínimo</span><span>{Math.round(ageMin)} / {row.canary_min_minutes} min</span>
              </div>
              <Progress value={timePct} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button size="sm" onClick={promote} disabled={busy || halted} className="gap-2">
                <Rocket className="h-4 w-4" /> Promover agora
                {!promoteEligible && !halted && <span className="text-xs opacity-70">(critérios não atingidos)</span>}
              </Button>
              <Button size="sm" variant="destructive" onClick={halt} disabled={busy || halted} className="gap-2">
                <OctagonX className="h-4 w-4" /> Halt
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
