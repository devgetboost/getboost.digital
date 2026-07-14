import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, Clock, ListChecks, AlertTriangle, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HandoffRow {
  id: string;
  category: string | null;
  keyword: string | null;
  lang: string | null;
  status: string | null;
  source: string | null;
  created_at: string;
  first_human_reply_at: string | null;
  sla_breached_at: string | null;
  reassign_count: number | null;
  conversation_id: string | null;
  assigned_to: string | null;
  resolved_by: string | null;
}

interface AgentStats {
  agentId: string;
  name: string;
  total: number;
  responded: number;
  breached: number;
  avgResponseMin: number | null;
  activationShare: number;
}

const RANGES = [
  { label: 'Últimas 24h', value: 1 },
  { label: 'Últimos 7 dias', value: 7 },
  { label: 'Últimos 30 dias', value: 30 },
  { label: 'Últimos 90 dias', value: 90 },
];

function fmtMinutes(mins: number | null) {
  if (mins === null || Number.isNaN(mins)) return '—';
  if (mins < 60) return `${Math.round(mins)}min`;
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${h}h${m ? ` ${m}min` : ''}`;
}

export default function WhatsAppHandoffMetrics() {
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [handoffs, setHandoffs] = useState<HandoffRow[]>([]);
  const [totalConversations, setTotalConversations] = useState<number>(0);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [drillAgent, setDrillAgent] = useState<{ id: string; name: string } | null>(null);
  const [drillStatus, setDrillStatus] = useState<string>('all');
  const [drillCategory, setDrillCategory] = useState<string>('all');
  const [drillPage, setDrillPage] = useState(0);
  const PAGE_SIZE = 10;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const since = new Date(Date.now() - days * 86400_000).toISOString();

      const [{ data: h, error: hErr }, { count: convCount, error: cErr }] = await Promise.all([
        supabase
          .from('whatsapp_handoffs')
          .select('id, category, keyword, lang, status, source, created_at, first_human_reply_at, sla_breached_at, reassign_count, conversation_id, assigned_to, resolved_by')
          .gte('created_at', since)
          .order('created_at', { ascending: false })
          .limit(2000),
        supabase
          .from('whatsapp_conversations')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', since),
      ]);

      if (hErr) console.error('handoff metrics fetch failed', hErr);
      if (cErr) console.error('conversations count failed', cErr);

      const rows = (h as HandoffRow[]) ?? [];
      setHandoffs(rows);
      setTotalConversations(convCount ?? 0);

      const ids = Array.from(new Set(rows.flatMap((r) => [r.assigned_to, r.resolved_by]).filter(Boolean))) as string[];
      if (ids.length) {
        const { data: profs } = await supabase.from('profiles').select('id, full_name, email').in('id', ids);
        const map: Record<string, string> = {};
        (profs ?? []).forEach((p: any) => { map[p.id] = p.full_name || p.email || p.id.slice(0, 8); });
        setProfiles(map);
      } else {
        setProfiles({});
      }

      setLoading(false);
    };
    load();
  }, [days]);


  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = handoffs.length;
  const activationRate = totalConversations > 0 ? (total / totalConversations) * 100 : 0;

  const responseTimes = handoffs
    .filter((h) => h.first_human_reply_at)
    .map((h) => (new Date(h.first_human_reply_at!).getTime() - new Date(h.created_at).getTime()) / 60000);
  const avgResponse = responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : null;
  const medianResponse = responseTimes.length
    ? [...responseTimes].sort((a, b) => a - b)[Math.floor(responseTimes.length / 2)]
    : null;

  const breached = handoffs.filter((h) => h.sla_breached_at).length;
  const breachRate = total > 0 ? (breached / total) * 100 : 0;

  const byCategory = new Map<string, number>();
  const byKeyword = new Map<string, number>();
  const byStatus = new Map<string, number>();
  const byLang = new Map<string, number>();
  for (const h of handoffs) {
    byCategory.set(h.category ?? 'desconhecido', (byCategory.get(h.category ?? 'desconhecido') ?? 0) + 1);
    if (h.keyword) byKeyword.set(h.keyword, (byKeyword.get(h.keyword) ?? 0) + 1);
    byStatus.set(h.status ?? 'pending', (byStatus.get(h.status ?? 'pending') ?? 0) + 1);
    byLang.set(h.lang ?? '—', (byLang.get(h.lang ?? '—') ?? 0) + 1);
  }
  const topKeywords = [...byKeyword.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const catRows = [...byCategory.entries()].sort((a, b) => b[1] - a[1]);
  const statusRows = [...byStatus.entries()].sort((a, b) => b[1] - a[1]);

  // Breakdown por agente responsável (assigned_to || resolved_by)
  const agentMap = new Map<string, { total: number; responded: number; breached: number; responseTimes: number[] }>();
  for (const h of handoffs) {
    const agentId = h.assigned_to || h.resolved_by;
    if (!agentId) continue;
    const s = agentMap.get(agentId) ?? { total: 0, responded: 0, breached: 0, responseTimes: [] };
    s.total += 1;
    if (h.sla_breached_at) s.breached += 1;
    if (h.first_human_reply_at) {
      s.responded += 1;
      s.responseTimes.push((new Date(h.first_human_reply_at).getTime() - new Date(h.created_at).getTime()) / 60000);
    }
    agentMap.set(agentId, s);
  }
  const agentStats: AgentStats[] = [...agentMap.entries()]
    .map(([agentId, s]) => ({
      agentId,
      name: profiles[agentId] || `Agente ${agentId.slice(0, 8)}`,
      total: s.total,
      responded: s.responded,
      breached: s.breached,
      avgResponseMin: s.responseTimes.length
        ? s.responseTimes.reduce((a, b) => a + b, 0) / s.responseTimes.length
        : null,
      activationShare: total > 0 ? (s.total / total) * 100 : 0,
    }))
    .sort((a, b) => b.total - a.total);


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Métricas de Escalonamento</h2>
          <p className="text-sm text-muted-foreground">
            Taxa de ativação, tempo até resposta humana e motivos mais comuns.
          </p>
        </div>
        <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map((r) => (
              <SelectItem key={r.value} value={String(r.value)}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Taxa de ativação"
          value={`${activationRate.toFixed(1)}%`}
          hint={`${total} handoffs / ${totalConversations} conversas`}
        />
        <MetricCard
          icon={<Clock className="h-4 w-4" />}
          label="Tempo médio até resposta"
          value={fmtMinutes(avgResponse)}
          hint={`mediana ${fmtMinutes(medianResponse)} · ${responseTimes.length} respondidos`}
        />
        <MetricCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="SLA violado"
          value={`${breachRate.toFixed(1)}%`}
          hint={`${breached} de ${total} handoffs`}
        />
        <MetricCard
          icon={<ListChecks className="h-4 w-4" />}
          label="Pendentes"
          value={String(byStatus.get('pending') ?? 0)}
          hint={`em revisão ${byStatus.get('in_review') ?? 0} · resolvidos ${byStatus.get('resolved') ?? 0}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Motivos por categoria</CardTitle>
            <CardDescription>Distribuição dos escalonamentos por tipo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {catRows.length === 0 && <p className="text-sm text-muted-foreground">Sem dados no período.</p>}
            {catRows.map(([cat, n]) => (
              <BarRow key={cat} label={cat} value={n} total={total} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top palavras-chave</CardTitle>
            <CardDescription>Termos do cliente que mais dispararam handoff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {topKeywords.length === 0 && <p className="text-sm text-muted-foreground">Sem dados no período.</p>}
            {topKeywords.map(([kw, n]) => (
              <BarRow key={kw} label={kw} value={n} total={total} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado dos handoffs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {statusRows.map(([s, n]) => (
              <Badge key={s} variant="secondary" className="gap-1">
                {s} <span className="font-semibold">{n}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Idiomas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...byLang.entries()].map(([l, n]) => (
              <Badge key={l} variant="outline" className="gap-1">
                {l} <span className="font-semibold">{n}</span>
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Por agente responsável</CardTitle>
          <CardDescription>
            Distribuição, SLA e tempo até resposta por pessoa atribuída (ou que resolveu o handoff).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {agentStats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem handoffs atribuídos no período.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 pr-4">Agente</th>
                    <th className="text-right py-2 pr-4">Handoffs</th>
                    <th className="text-right py-2 pr-4">% do total</th>
                    <th className="text-right py-2 pr-4">Respondidos</th>
                    <th className="text-right py-2 pr-4">SLA violado</th>
                    <th className="text-right py-2">Tempo médio</th>
                  </tr>
                </thead>
                <tbody>
                  {agentStats.map((a) => {
                    const breachPct = a.total > 0 ? (a.breached / a.total) * 100 : 0;
                    const respondedPct = a.total > 0 ? (a.responded / a.total) * 100 : 0;
                    return (
                      <tr
                        key={a.agentId}
                        className="border-b last:border-b-0 cursor-pointer hover:bg-muted/40"
                        onClick={() => { setDrillAgent({ id: a.agentId, name: a.name }); setDrillStatus('all'); setDrillCategory('all'); setDrillPage(0); }}
                      >
                        <td className="py-2 pr-4 font-medium">{a.name}</td>
                        <td className="py-2 pr-4 text-right">{a.total}</td>
                        <td className="py-2 pr-4 text-right text-muted-foreground">{a.activationShare.toFixed(0)}%</td>
                        <td className="py-2 pr-4 text-right">{a.responded} <span className="text-muted-foreground">({respondedPct.toFixed(0)}%)</span></td>
                        <td className={`py-2 pr-4 text-right ${breachPct > 20 ? 'text-destructive font-semibold' : ''}`}>
                          {a.breached} ({breachPct.toFixed(0)}%)
                        </td>
                        <td className="py-2 text-right">{fmtMinutes(a.avgResponseMin)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="text-xs text-muted-foreground mt-2">Clica numa linha para ver os handoffs desse agente.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AgentDrillDown
        agent={drillAgent}
        onClose={() => setDrillAgent(null)}
        handoffs={handoffs}
        status={drillStatus}
        category={drillCategory}
        onStatusChange={(v) => { setDrillStatus(v); setDrillPage(0); }}
        onCategoryChange={(v) => { setDrillCategory(v); setDrillPage(0); }}
        page={drillPage}
        onPageChange={setDrillPage}
        pageSize={PAGE_SIZE}
      />

    </div>
  );
}


function MetricCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2">{icon}{label}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function BarRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="truncate mr-2">{label}</span>
        <span className="text-muted-foreground">{value} · {pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 rounded bg-muted overflow-hidden">
        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function AgentDrillDown({
  agent, onClose, handoffs, status, category, onStatusChange, onCategoryChange, page, onPageChange, pageSize,
}: {
  agent: { id: string; name: string } | null;
  onClose: () => void;
  handoffs: HandoffRow[];
  status: string;
  category: string;
  onStatusChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  page: number;
  onPageChange: (n: number) => void;
  pageSize: number;
}) {
  const filtered = useMemo(() => {
    if (!agent) return [] as HandoffRow[];
    return handoffs.filter((h) => {
      const owner = h.assigned_to || h.resolved_by;
      if (owner !== agent.id) return false;
      if (status !== 'all' && (h.status ?? 'pending') !== status) return false;
      if (category !== 'all' && (h.category ?? '') !== category) return false;
      return true;
    });
  }, [agent, handoffs, status, category]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages - 1);
  const slice = filtered.slice(current * pageSize, current * pageSize + pageSize);

  return (
    <Dialog open={!!agent} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Handoffs de {agent?.name}</DialogTitle>
          <DialogDescription>{filtered.length} handoff(s) no período selecionado.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="in_review">Em revisão</SelectItem>
              <SelectItem value="resolved">Resolvido</SelectItem>
              <SelectItem value="forwarded">Reencaminhado</SelectItem>
            </SelectContent>
          </Select>
          <Select value={category} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              <SelectItem value="urgency">Urgência</SelectItem>
              <SelectItem value="complaint_legal">Reclamação/Jurídico</SelectItem>
              <SelectItem value="human_request">Pedido de humano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="max-h-[420px] overflow-y-auto border rounded">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground bg-muted/40 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2">Data</th>
                <th className="text-left px-3 py-2">Motivo</th>
                <th className="text-left px-3 py-2">Estado</th>
                <th className="text-right px-3 py-2">Tempo até resposta</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {slice.length === 0 && (
                <tr><td colSpan={5} className="text-center py-6 text-muted-foreground">Sem resultados.</td></tr>
              )}
              {slice.map((h) => {
                const responseMin = h.first_human_reply_at
                  ? (new Date(h.first_human_reply_at).getTime() - new Date(h.created_at).getTime()) / 60000
                  : null;
                return (
                  <tr key={h.id} className="border-t">
                    <td className="px-3 py-2 whitespace-nowrap">{new Date(h.created_at).toLocaleString('pt-PT')}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col">
                        <Badge variant="outline" className="w-fit">{h.category ?? '—'}</Badge>
                        {h.keyword && <span className="text-xs text-muted-foreground mt-1">"{h.keyword}"</span>}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant={h.sla_breached_at ? 'destructive' : 'secondary'}>{h.status ?? 'pending'}</Badge>
                    </td>
                    <td className="px-3 py-2 text-right">{responseMin === null ? '—' : fmtMinutes(responseMin)}</td>
                    <td className="px-3 py-2 text-right">
                      {h.conversation_id && (
                        <a
                          href={`/admin/whatsapp?conv=${h.conversation_id}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline text-xs"
                        >
                          Abrir <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Página {current + 1} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={current === 0} onClick={() => onPageChange(current - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" disabled={current >= totalPages - 1} onClick={() => onPageChange(current + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

