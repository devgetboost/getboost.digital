import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, DollarSign, Timer, Gauge, ExternalLink, ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { listAgents, type Agent } from '@/lib/agenticAgents';
import { listRecentLogs, getMetricsSummary, type RunLog } from '@/lib/agenticRun';

// Limiares de alerta (podem ser tornados configuráveis mais tarde)
const THRESHOLDS = {
  errorRatePct: 5,     // taxa de erro >5%
  avgLatencyMs: 4000,  // latência média >4s
  minRuns: 5,          // ignora agentes com <5 execuções para evitar falsos positivos
};

type PerAgentSummary = { agentId: string; name: string; runs: number; errors: number; errorRate: number; avgLatencyMs: number };

export default function AdminAgenticMonitoring() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState<string>('all');
  const [hours, setHours] = useState<number>(24);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [errorTypeFilter, setErrorTypeFilter] = useState<string>('all');
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getMetricsSummary>> | null>(null);
  const [logs, setLogs] = useState<RunLog[]>([]);
  const [perAgent, setPerAgent] = useState<PerAgentSummary[]>([]);
  const [selected, setSelected] = useState<RunLog | null>(null);

  useEffect(() => { listAgents().then(setAgents).catch(() => {}); }, []);

  useEffect(() => {
    const filter = agentId === 'all' ? undefined : agentId;
    Promise.all([getMetricsSummary(hours, filter), listRecentLogs(200, filter)])
      .then(([s, l]) => { setSummary(s); setLogs(l); })
      .catch(() => { setSummary(null); setLogs([]); });
  }, [agentId, hours]);

  const filteredLogs = useMemo(() => {
    return logs.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (errorTypeFilter !== 'all' && (l.errorType ?? '—') !== errorTypeFilter) return false;
      return true;
    });
  }, [logs, statusFilter, errorTypeFilter]);

  const errorTypeGroups = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of logs) {
      if (l.status !== 'error') continue;
      const k = l.errorType ?? 'unknown';
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [logs]);

  const statusCounts = useMemo(() => {
    let s = 0, e = 0;
    for (const l of logs) { if (l.status === 'success') s++; else if (l.status === 'error') e++; }
    return { success: s, error: e };
  }, [logs]);

  // Métricas por agente para alertas (sempre agregadas sobre todos os agentes)
  useEffect(() => {
    if (agents.length === 0) { setPerAgent([]); return; }
    Promise.all(
      agents.map(async (a) => {
        try {
          const s = await getMetricsSummary(hours, a.id);
          const errorRate = s.runs > 0 ? (s.errors / s.runs) * 100 : 0;
          return { agentId: a.id, name: a.name, runs: s.runs, errors: s.errors, errorRate, avgLatencyMs: s.avgLatencyMs };
        } catch {
          return { agentId: a.id, name: a.name, runs: 0, errors: 0, errorRate: 0, avgLatencyMs: 0 };
        }
      })
    ).then(setPerAgent);
  }, [agents, hours]);

  const alerts = useMemo(() => {
    const out: { agent: string; kind: 'error' | 'latency'; value: string; detail: string }[] = [];
    for (const p of perAgent) {
      if (p.runs < THRESHOLDS.minRuns) continue;
      if (p.errorRate > THRESHOLDS.errorRatePct) {
        out.push({ agent: p.name, kind: 'error', value: `${p.errorRate.toFixed(1)}%`, detail: `${p.errors}/${p.runs} execuções falharam` });
      }
      if (p.avgLatencyMs > THRESHOLDS.avgLatencyMs) {
        out.push({ agent: p.name, kind: 'latency', value: `${Math.round(p.avgLatencyMs)} ms`, detail: `limiar ${THRESHOLDS.avgLatencyMs} ms` });
      }
    }
    return out;
  }, [perAgent]);

  const errorRate = summary && summary.runs > 0 ? ((summary.errors / summary.runs) * 100).toFixed(1) : '0';
  const agentName = (id: string | null) => agents.find((a) => a.id === id)?.name ?? '—';

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Activity className="h-6 w-6" /> Monitorização de Agentes
        </h1>
        <p className="text-sm text-muted-foreground">Execuções, custo, latência e falhas em tempo quase real.</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <Select value={agentId} onValueChange={setAgentId}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="Agente" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os agentes</SelectItem>
            {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24">Últimas 24h</SelectItem>
            <SelectItem value="168">Últimos 7 dias</SelectItem>
            <SelectItem value="720">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados ({logs.length})</SelectItem>
            <SelectItem value="success">Sucesso ({statusCounts.success})</SelectItem>
            <SelectItem value="error">Erro ({statusCounts.error})</SelectItem>
          </SelectContent>
        </Select>
        <Select value={errorTypeFilter} onValueChange={setErrorTypeFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Tipo de erro" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos de erro</SelectItem>
            {errorTypeGroups.map(([k, n]) => (
              <SelectItem key={k} value={k}>{k} ({n})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {errorTypeGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center">Agrupar por erro:</span>
          <Badge
            variant={errorTypeFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setErrorTypeFilter('all')}
          >
            Todos ({statusCounts.error})
          </Badge>
          {errorTypeGroups.map(([k, n]) => (
            <Badge
              key={k}
              variant={errorTypeFilter === k ? 'destructive' : 'outline'}
              className="cursor-pointer"
              onClick={() => { setErrorTypeFilter(k); setStatusFilter('error'); }}
            >
              {k}: {n}
            </Badge>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>
            {alerts.length} alerta{alerts.length > 1 ? 's' : ''} nas últimas {hours}h
            {' '}(limiares: erro &gt;{THRESHOLDS.errorRatePct}%, latência &gt;{THRESHOLDS.avgLatencyMs} ms)
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {alerts.map((a, i) => (
                <li key={i}>
                  <strong>{a.agent}</strong> — {a.kind === 'error' ? 'taxa de erro' : 'latência média'}: <strong>{a.value}</strong> ({a.detail})
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Activity className="h-4 w-4" />} label="Execuções" value={summary?.runs ?? 0} />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Taxa de erro"
          value={`${errorRate}%`}
          tone={Number(errorRate) > 5 ? 'danger' : 'default'}
        />
        <StatCard
          icon={<Timer className="h-4 w-4" />}
          label="Latência média"
          value={`${Math.round(summary?.avgLatencyMs ?? 0)} ms`}
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="Custo (créditos)"
          value={(summary?.totalCostCredits ?? 0).toFixed(3)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Gauge className="h-5 w-5" /> Últimas execuções</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Agente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead className="text-right">Latência</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead>Erro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((l) => (
                <TableRow
                  key={l.id}
                  className="cursor-pointer hover:bg-muted/40"
                  onClick={() => setSelected(l)}
                >
                  <TableCell className="text-xs">
                    {new Date(l.startedAt).toLocaleString('pt-PT')}
                  </TableCell>
                  <TableCell className="text-sm">{agentName(l.agentId)}</TableCell>
                  <TableCell>
                    <Badge variant={l.status === 'success' ? 'secondary' : 'destructive'} className="text-xs">
                      {l.status}
                    </Badge>
                    {l.errorType && (
                      <Badge variant="outline" className="text-xs ml-1">{l.errorType}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.model ?? '—'}</TableCell>
                  <TableCell className="text-right text-xs">{l.latencyMs ?? '—'} ms</TableCell>
                  <TableCell className="text-right text-xs">
                    {(l.inputTokens ?? 0) + (l.outputTokens ?? 0) || '—'}
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-[240px] truncate">
                    {l.errorMessage ?? ''}
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                    Sem execuções para os filtros seleccionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5" /> Detalhes da execução
                </SheetTitle>
                <SheetDescription>
                  {agentName(selected.agentId)} · run <code className="text-xs">{selected.runId}</code>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 space-y-4 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant={selected.status === 'success' ? 'secondary' : 'destructive'}>
                    {selected.status}
                  </Badge>
                  {selected.errorType && <Badge variant="outline">{selected.errorType}</Badge>}
                  {selected.model && <Badge variant="outline">{selected.model}</Badge>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Início">{new Date(selected.startedAt).toLocaleString('pt-PT')}</Field>
                  <Field label="Fim">
                    {selected.finishedAt ? new Date(selected.finishedAt).toLocaleString('pt-PT') : '—'}
                  </Field>
                  <Field label="Latência">{selected.latencyMs ?? '—'} ms</Field>
                  <Field label="Custo">{(selected.costCredits ?? 0).toFixed(4)} créditos</Field>
                  <Field label="Tokens entrada">{selected.inputTokens ?? '—'}</Field>
                  <Field label="Tokens saída">{selected.outputTokens ?? '—'}</Field>
                </div>

                {selected.errorMessage && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Erro
                    </div>
                    <pre className="text-xs bg-destructive/10 text-destructive p-3 rounded border border-destructive/20 whitespace-pre-wrap break-words max-h-64 overflow-auto">
                      {selected.errorMessage}
                    </pre>
                  </div>
                )}

                {selected.outputPreview && (
                  <div>
                    <div className="text-xs font-medium text-muted-foreground mb-1">Pré-visualização do output</div>
                    <pre className="text-xs bg-muted p-3 rounded whitespace-pre-wrap break-words max-h-64 overflow-auto">
                      {selected.outputPreview}
                    </pre>
                  </div>
                )}

                <Link
                  to={`/admin/agentic-ai/monitoring/${selected.id}`}
                  className="text-primary hover:underline inline-flex items-center gap-1 text-sm"
                >
                  Abrir página completa <ExternalLink className="h-3 w-3" />
                </Link>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function StatCard({ icon, label, value, tone = 'default' }: { icon: React.ReactNode; label: string; value: React.ReactNode; tone?: 'default' | 'danger' }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between text-muted-foreground text-xs">
          <span className="flex items-center gap-1">{icon} {label}</span>
        </div>
        <div className={`text-2xl font-semibold mt-2 ${tone === 'danger' ? 'text-destructive' : ''}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{children}</div>
    </div>
  );
}
