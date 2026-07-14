import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock } from 'lucide-react';

type CronRow = {
  jobname: string;
  schedule: string;
  active: boolean;
  last_start: string | null;
  last_end: string | null;
  last_status: string | null;
  last_message: string | null;
  last_runid: number | null;
};

export function AgenticCronStatusCard() {
  const [rows, setRows] = useState<CronRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase.rpc('get_agentic_cron_status');
    if (error) setErr(error.message);
    setRows((data ?? []) as CronRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const fmt = (v: string | null) => (v ? new Date(v).toLocaleString('pt-PT') : '—');
  const statusVariant = (s: string | null) =>
    s === 'succeeded' ? 'default' : s === 'failed' ? 'destructive' : 'secondary';

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Estado dos crons Agentic
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {err && <div className="p-4 text-sm text-destructive">Sem acesso: {err}</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-left p-3">Job</th>
                <th className="text-left p-3">Schedule</th>
                <th className="text-left p-3">Ativo</th>
                <th className="text-left p-3">Última execução</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Mensagem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.jobname} className="border-t">
                  <td className="p-3 font-mono text-xs">{r.jobname}</td>
                  <td className="p-3 font-mono text-xs">{r.schedule}</td>
                  <td className="p-3">{r.active ? 'sim' : 'não'}</td>
                  <td className="p-3 whitespace-nowrap">{fmt(r.last_start)}</td>
                  <td className="p-3">
                    {r.last_status
                      ? <Badge variant={statusVariant(r.last_status)}>{r.last_status}</Badge>
                      : <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="p-3 text-xs text-muted-foreground max-w-[420px] truncate" title={r.last_message ?? ''}>
                    {r.last_message ?? '—'}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !loading && !err && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Sem jobs agendados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
