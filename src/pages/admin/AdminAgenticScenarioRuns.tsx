import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, PlayCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AgenticCronStatusCard } from '@/components/admin/AgenticCronStatusCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';

type Run = {
  id: string;
  batch_id: string | null;
  agent_fn: string;
  scenario_id: string;
  scenario_label: string | null;
  status: 'pass' | 'fail' | 'error';
  http_status: number | null;
  duration_ms: number | null;
  reason: string | null;
  error: string | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  pass: 'hsl(142 71% 45%)',
  fail: 'hsl(0 84% 60%)',
  error: 'hsl(38 92% 50%)',
};

const RANGES = [
  { value: '1', label: 'Últimas 24h' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
];

export default function AdminAgenticScenarioRuns() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [range, setRange] = useState('7');
  const [agent, setAgent] = useState<string>('all');
  const [scenario, setScenario] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(range) * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('agentic_scenario_runs')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) toast({ title: 'Erro ao carregar', description: error.message, variant: 'destructive' });
    setRows((data ?? []) as Run[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);

  const agents = useMemo(() => Array.from(new Set(rows.map(r => r.agent_fn))).sort(), [rows]);
  const scenarios = useMemo(
    () => Array.from(new Set(rows.filter(r => agent === 'all' || r.agent_fn === agent).map(r => r.scenario_id))).sort(),
    [rows, agent],
  );

  const filtered = useMemo(() => rows.filter(r =>
    (agent === 'all' || r.agent_fn === agent) &&
    (scenario === 'all' || r.scenario_id === scenario) &&
    (status === 'all' || r.status === status)
  ), [rows, agent, scenario, status]);

  const summary = useMemo(() => {
    const s = { pass: 0, fail: 0, error: 0, total: filtered.length, avgMs: 0 };
    let sum = 0, n = 0;
    for (const r of filtered) {
      s[r.status] = (s[r.status] ?? 0) + 1;
      if (r.duration_ms != null) { sum += r.duration_ms; n++; }
    }
    s.avgMs = n ? Math.round(sum / n) : 0;
    return s;
  }, [filtered]);

  const chartData = useMemo(() => {
    const useDay = Number(range) > 1;
    const bucketOf = (iso: string) => {
      const d = new Date(iso);
      if (useDay) return d.toISOString().slice(0, 10);
      return `${d.toISOString().slice(0, 13)}:00`;
    };
    const map = new Map<string, { bucket: string; pass: number; fail: number; error: number }>();
    for (const r of filtered) {
      const k = bucketOf(r.created_at);
      const cur = map.get(k) ?? { bucket: k, pass: 0, fail: 0, error: 0 };
      (cur as any)[r.status]++;
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.bucket.localeCompare(b.bucket));
  }, [filtered, range]);

  const triggerCron = async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('agentic-scenario-cron', { body: {} });
      if (error) throw error;
      toast({ title: 'Execução concluída', description: `Batch ${data?.batchId ?? ''} — ${JSON.stringify(data?.summary ?? {})}` });
      await load();
    } catch (e: any) {
      toast({ title: 'Falha ao executar', description: e?.message, variant: 'destructive' });
    } finally { setRunning(false); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/agentic-ai')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Runs de Cenários (Fase 3)</h1>
            <p className="text-sm text-muted-foreground">Histórico diário automatizado — pass/fail, latência e erros.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button size="sm" onClick={triggerCron} disabled={running} className="gap-2">
            <PlayCircle className="h-4 w-4" /> {running ? 'A executar…' : 'Executar agora'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={agent} onValueChange={(v) => { setAgent(v); setScenario('all'); }}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Agente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os agentes</SelectItem>
            {agents.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={scenario} onValueChange={setScenario}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Cenário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cenários</SelectItem>
            {scenarios.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pass">Pass</SelectItem>
            <SelectItem value="fail">Fail</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { k: 'Total', v: summary.total },
          { k: 'Pass', v: summary.pass, c: 'text-green-600' },
          { k: 'Fail', v: summary.fail, c: 'text-red-600' },
          { k: 'Error', v: summary.error, c: 'text-amber-600' },
          { k: 'Latência média', v: `${summary.avgMs} ms` },
        ].map((s) => (
          <Card key={s.k}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{s.k}</div>
            <div className={`text-2xl font-semibold ${s.c ?? ''}`}>{s.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Pass / Fail ao longo do tempo</CardTitle></CardHeader>
        <CardContent className="h-72">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados no período.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pass" stackId="a" fill={STATUS_COLORS.pass} />
                <Bar dataKey="fail" stackId="a" fill={STATUS_COLORS.fail} />
                <Bar dataKey="error" stackId="a" fill={STATUS_COLORS.error} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <AgenticCronStatusCard />



      <Card>
        <CardHeader><CardTitle className="text-base">Execuções ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Quando</th>
                  <th className="text-left p-3">Agente</th>
                  <th className="text-left p-3">Cenário</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">HTTP</th>
                  <th className="text-left p-3">Latência</th>
                  <th className="text-left p-3">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 300).map(r => (
                  <tr key={r.id} className="border-t">
                    <td className="p-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString('pt-PT')}</td>
                    <td className="p-3 font-mono text-xs">{r.agent_fn}</td>
                    <td className="p-3">{r.scenario_label ?? r.scenario_id}</td>
                    <td className="p-3">
                      <Badge variant={r.status === 'pass' ? 'default' : 'destructive'} className="capitalize">{r.status}</Badge>
                    </td>
                    <td className="p-3">{r.http_status ?? '—'}</td>
                    <td className="p-3">{r.duration_ms != null ? `${r.duration_ms} ms` : '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground max-w-[420px] truncate" title={r.error ?? r.reason ?? ''}>
                      {r.error ?? r.reason ?? '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && !loading && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sem runs para os filtros selecionados.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
