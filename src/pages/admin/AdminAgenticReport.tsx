import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, RefreshCw, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid, Cell,
} from 'recharts';

type AgentRow = {
  agent_id: string; agent_name: string; function_slug: string | null;
  runs: number; errors: number; error_pct: number;
  input_tokens: number; output_tokens: number; total_tokens: number;
  cost_credits: number; avg_latency_ms: number; p95_latency_ms: number;
};
type ScenarioRow = {
  agent_fn: string; scenario_id: string; scenario_label: string | null;
  runs: number; pass: number; fail: number; errors: number;
  error_pct: number; avg_latency_ms: number;
};
type AgentErrorRow = {
  agent_id: string; agent_name: string; function_slug: string | null;
  error_type: string; error_message: string;
  occurrences: number; last_occurred_at: string; sample_output: string | null;
};
type ScenarioErrorRow = {
  agent_fn: string; scenario_id: string; scenario_label: string | null;
  status: string; reason: string;
  occurrences: number; last_occurred_at: string;
  last_http_status: number | null; sample_error: string | null;
};

const RANGES = [
  { value: '1', label: 'Últimas 24h' },
  { value: '7', label: 'Últimos 7 dias' },
  { value: '30', label: 'Últimos 30 dias' },
  { value: '90', label: 'Últimos 90 dias' },
];

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = (v: unknown) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(','), ...rows.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
}

function download(name: string, content: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export default function AdminAgenticReport() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [range, setRange] = useState('7');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentRow[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [agentErrors, setAgentErrors] = useState<AgentErrorRow[]>([]);
  const [scenarioErrors, setScenarioErrors] = useState<ScenarioErrorRow[]>([]);

  const load = async () => {
    setLoading(true);
    const since = new Date(Date.now() - Number(range) * 86400000).toISOString();
    const [{ data: a, error: ae }, { data: s, error: se }, { data: ea, error: eae }, { data: es, error: ese }] = await Promise.all([
      supabase.rpc('get_agentic_report_by_agent' as any, { _since: since }),
      supabase.rpc('get_agentic_report_by_scenario' as any, { _since: since }),
      supabase.rpc('get_agentic_error_samples_by_agent' as any, { _since: since, _limit: 50 }),
      supabase.rpc('get_agentic_error_samples_by_scenario' as any, { _since: since, _limit: 50 }),
    ]);
    if (ae) toast({ title: 'Erro (agentes)', description: ae.message, variant: 'destructive' });
    if (se) toast({ title: 'Erro (cenários)', description: se.message, variant: 'destructive' });
    if (eae) toast({ title: 'Erros por agente', description: eae.message, variant: 'destructive' });
    if (ese) toast({ title: 'Erros por cenário', description: ese.message, variant: 'destructive' });
    setAgents((a ?? []) as AgentRow[]);
    setScenarios((s ?? []) as ScenarioRow[]);
    setAgentErrors((ea ?? []) as AgentErrorRow[]);
    setScenarioErrors((es ?? []) as ScenarioErrorRow[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [range]);

  const totals = useMemo(() => agents.reduce((acc, r) => ({
    runs: acc.runs + Number(r.runs),
    errors: acc.errors + Number(r.errors),
    tokens: acc.tokens + Number(r.total_tokens),
    cost: acc.cost + Number(r.cost_credits),
  }), { runs: 0, errors: 0, tokens: 0, cost: 0 }), [agents]);

  const fmtCost = (n: number) => Number(n).toFixed(4);

  const errorColor = (pct: number) => (pct >= 20 ? 'hsl(0 84% 60%)' : pct >= 5 ? 'hsl(38 92% 50%)' : 'hsl(142 71% 45%)');

  const agentChart = useMemo(() => agents.map(r => ({
    name: r.function_slug ?? r.agent_name,
    runs: Number(r.runs),
    errors: Number(r.errors),
    error_pct: Number(r.error_pct),
    cost: Number(r.cost_credits),
    input_tokens: Number(r.input_tokens),
    output_tokens: Number(r.output_tokens),
    avg_ms: Math.round(Number(r.avg_latency_ms)),
    p95_ms: Math.round(Number(r.p95_latency_ms)),
  })), [agents]);

  const scenarioChart = useMemo(() => scenarios.map(r => ({
    name: `${r.agent_fn} · ${r.scenario_id}`,
    runs: Number(r.runs),
    pass: Number(r.pass),
    fail: Number(r.fail),
    errors: Number(r.errors),
    error_pct: Number(r.error_pct),
    avg_ms: Math.round(Number(r.avg_latency_ms)),
  })), [scenarios]);


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/agentic-ai')} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Relatório Agentic AI</h1>
            <p className="text-sm text-muted-foreground">Custo, tokens e taxa de erro agregados por agente e por cenário.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>{RANGES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { k: 'Execuções', v: totals.runs },
          { k: 'Erros', v: totals.errors, c: 'text-red-600' },
          { k: 'Tokens totais', v: totals.tokens.toLocaleString('pt-PT') },
          { k: 'Custo (créditos)', v: fmtCost(totals.cost) },
        ].map(s => (
          <Card key={s.k}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{s.k}</div>
            <div className={`text-2xl font-semibold ${s.c ?? ''}`}>{s.v}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Taxa de erro por agente (%)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {agentChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="error_pct" name="Erro %">
                    {agentChart.map((d, i) => <Cell key={i} fill={errorColor(d.error_pct)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Custo (créditos) por agente</CardTitle></CardHeader>
          <CardContent className="h-64">
            {agentChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="cost" name="Créditos" fill="hsl(24 100% 50%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Tokens por agente (input vs output)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {agentChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="input_tokens" stackId="t" name="Input" fill="hsl(210 90% 55%)" />
                  <Bar dataKey="output_tokens" stackId="t" name="Output" fill="hsl(160 70% 45%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Latência por agente (avg / p95, ms)</CardTitle></CardHeader>
          <CardContent className="h-64">
            {agentChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={agentChart}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="ms" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avg_ms" name="Média" fill="hsl(210 90% 55%)" />
                  <Bar dataKey="p95_ms" name="p95" fill="hsl(280 70% 55%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Taxa de erro por cenário (%)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {scenarioChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioChart} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} height={60} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip />
                  <Bar dataKey="error_pct" name="Erro %">
                    {scenarioChart.map((d, i) => <Cell key={i} fill={errorColor(d.error_pct)} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Pass / Fail / Error por cenário</CardTitle></CardHeader>
          <CardContent className="h-72">
            {scenarioChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioChart} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="pass" stackId="s" name="Pass" fill="hsl(142 71% 45%)" />
                  <Bar dataKey="fail" stackId="s" name="Fail" fill="hsl(0 84% 60%)" />
                  <Bar dataKey="errors" stackId="s" name="Error" fill="hsl(38 92% 50%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Latência média por cenário (ms)</CardTitle></CardHeader>
          <CardContent className="h-72">
            {scenarioChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">Sem dados.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioChart} margin={{ bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" interval={0} height={60} />
                  <YAxis tick={{ fontSize: 11 }} unit="ms" />
                  <Tooltip />
                  <Bar dataKey="avg_ms" name="Latência média" fill="hsl(210 90% 55%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>


      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Por agente ({agents.length})</CardTitle>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => download(`agentic-por-agente-${range}d.csv`, toCsv(agents as any))}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Agente</th>
                  <th className="text-left p-3">Slug</th>
                  <th className="text-right p-3">Runs</th>
                  <th className="text-right p-3">Erros</th>
                  <th className="text-right p-3">Erro %</th>
                  <th className="text-right p-3">Input tk</th>
                  <th className="text-right p-3">Output tk</th>
                  <th className="text-right p-3">Custo</th>
                  <th className="text-right p-3">Latência (avg / p95)</th>
                </tr>
              </thead>
              <tbody>
                {agents.map(r => (
                  <tr key={r.agent_id} className="border-t">
                    <td className="p-3">{r.agent_name}</td>
                    <td className="p-3 font-mono text-xs">{r.function_slug ?? '—'}</td>
                    <td className="p-3 text-right">{r.runs}</td>
                    <td className="p-3 text-right text-red-600">{r.errors}</td>
                    <td className="p-3 text-right">{Number(r.error_pct).toFixed(1)}%</td>
                    <td className="p-3 text-right">{Number(r.input_tokens).toLocaleString('pt-PT')}</td>
                    <td className="p-3 text-right">{Number(r.output_tokens).toLocaleString('pt-PT')}</td>
                    <td className="p-3 text-right">{fmtCost(r.cost_credits)}</td>
                    <td className="p-3 text-right text-xs text-muted-foreground">
                      {Math.round(Number(r.avg_latency_ms))} / {Math.round(Number(r.p95_latency_ms))} ms
                    </td>
                  </tr>
                ))}
                {agents.length === 0 && !loading && (
                  <tr><td colSpan={9} className="p-8 text-center text-muted-foreground">Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Por cenário ({scenarios.length})</CardTitle>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => download(`agentic-por-cenario-${range}d.csv`, toCsv(scenarios as any))}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Agente</th>
                  <th className="text-left p-3">Cenário</th>
                  <th className="text-right p-3">Runs</th>
                  <th className="text-right p-3">Pass</th>
                  <th className="text-right p-3">Fail</th>
                  <th className="text-right p-3">Error</th>
                  <th className="text-right p-3">Erro %</th>
                  <th className="text-right p-3">Latência média</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((r, i) => (
                  <tr key={`${r.agent_fn}-${r.scenario_id}-${i}`} className="border-t">
                    <td className="p-3 font-mono text-xs">{r.agent_fn}</td>
                    <td className="p-3">{r.scenario_label ?? r.scenario_id}</td>
                    <td className="p-3 text-right">{r.runs}</td>
                    <td className="p-3 text-right text-green-600">{r.pass}</td>
                    <td className="p-3 text-right text-red-600">{r.fail}</td>
                    <td className="p-3 text-right text-amber-600">{r.errors}</td>
                    <td className="p-3 text-right">{Number(r.error_pct).toFixed(1)}%</td>
                    <td className="p-3 text-right text-xs text-muted-foreground">{Math.round(Number(r.avg_latency_ms))} ms</td>
                  </tr>
                ))}
                {scenarios.length === 0 && !loading && (
                  <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Sem cenários no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Top erros por agente ({agentErrors.length})</CardTitle>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => download(`agentic-erros-por-agente-${range}d.csv`, toCsv(agentErrors as any))}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Agente</th>
                  <th className="text-left p-3">Tipo</th>
                  <th className="text-left p-3">Mensagem</th>
                  <th className="text-right p-3">Ocorrências</th>
                  <th className="text-left p-3">Última</th>
                </tr>
              </thead>
              <tbody>
                {agentErrors.map((r, i) => (
                  <tr key={`${r.agent_id}-${i}`} className="border-t align-top">
                    <td className="p-3 font-mono text-xs">{r.function_slug ?? r.agent_name}</td>
                    <td className="p-3 text-xs"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700">{r.error_type}</span></td>
                    <td className="p-3 max-w-xl">
                      <div className="text-xs">{r.error_message}</div>
                      {r.sample_output && (
                        <div className="mt-1 text-[10px] text-muted-foreground font-mono truncate" title={r.sample_output}>
                          ↳ {r.sample_output}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right font-semibold">{r.occurrences}</td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {r.last_occurred_at ? new Date(r.last_occurred_at).toLocaleString('pt-PT') : '—'}
                    </td>
                  </tr>
                ))}
                {agentErrors.length === 0 && !loading && (
                  <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Sem erros no período. 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Top erros por cenário ({scenarioErrors.length})</CardTitle>
          <Button variant="outline" size="sm" className="gap-2"
            onClick={() => download(`agentic-erros-por-cenario-${range}d.csv`, toCsv(scenarioErrors as any))}>
            <Download className="h-4 w-4" /> CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Agente</th>
                  <th className="text-left p-3">Cenário</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Motivo</th>
                  <th className="text-right p-3">HTTP</th>
                  <th className="text-right p-3">Ocorrências</th>
                  <th className="text-left p-3">Última</th>
                </tr>
              </thead>
              <tbody>
                {scenarioErrors.map((r, i) => (
                  <tr key={`${r.agent_fn}-${r.scenario_id}-${i}`} className="border-t align-top">
                    <td className="p-3 font-mono text-xs">{r.agent_fn}</td>
                    <td className="p-3 text-xs">{r.scenario_label ?? r.scenario_id}</td>
                    <td className="p-3 text-xs">
                      <span className={`px-2 py-0.5 rounded ${r.status === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{r.status}</span>
                    </td>
                    <td className="p-3 max-w-md">
                      <div className="text-xs">{r.reason}</div>
                      {r.sample_error && (
                        <div className="mt-1 text-[10px] text-muted-foreground font-mono truncate" title={r.sample_error}>
                          ↳ {r.sample_error}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-right text-xs">{r.last_http_status ?? '—'}</td>
                    <td className="p-3 text-right font-semibold">{r.occurrences}</td>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                      {r.last_occurred_at ? new Date(r.last_occurred_at).toLocaleString('pt-PT') : '—'}
                    </td>
                  </tr>
                ))}
                {scenarioErrors.length === 0 && !loading && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Sem erros de cenários no período. 🎉</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
