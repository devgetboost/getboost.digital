import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Loader2, RefreshCw, Users, CalendarCheck, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Lead = { id: string; created_at: string; name: string | null; email: string | null; phone: string | null; source: string | null };
type Booking = { id: string; created_at: string; name: string | null; email: string | null; phone: string | null };
type Failure = {
  id: string; created_at: string; location: string | null; template: string | null;
  click_id: string | null; issues: Record<string, string[]> | null;
  raw_payload: Record<string, unknown> | null;
};

type Row = {
  kind: 'lead' | 'booking';
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  failure?: Failure;
};

const MATCH_WINDOW_MS = 5 * 60 * 1000;

const PERIOD_OPTIONS = [
  { key: '24h', label: 'Últimas 24h', days: 1 },
  { key: '7d', label: '7 dias', days: 7 },
  { key: '30d', label: '30 dias', days: 30 },
] as const;
type PeriodKey = typeof PERIOD_OPTIONS[number]['key'];

const extractEmail = (f: Failure): string | null => {
  const raw = (f.raw_payload || {}) as Record<string, any>;
  const data = (raw.data || {}) as Record<string, any>;
  return (typeof data.email === 'string' ? data.email : null) || null;
};

const AdminCrmDeliveryStatus = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed'>('all');
  const [period, setPeriod] = useState<PeriodKey>('7d');
  const [detail, setDetail] = useState<Row | null>(null);

  const load = async (days: number) => {
    setLoading(true);
    const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
    const [leadsRes, bookingsRes, failuresRes] = await Promise.all([
      supabase.from('leads').select('id,created_at,name,email,phone,source').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
      supabase.from('bookings').select('id,created_at,name,email,phone').gte('created_at', since).order('created_at', { ascending: false }).limit(200),
      supabase.from('crm_validation_failures').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(1000),
    ]);
    if (leadsRes.error || bookingsRes.error || failuresRes.error) {
      toast.error('Erro a carregar dados de entrega ao CRM');
    }
    const failures = (failuresRes.data as Failure[]) || [];

    const matchFailure = (email: string | null, createdAt: string): Failure | undefined => {
      if (!email) return undefined;
      const t = new Date(createdAt).getTime();
      return failures.find((f) => {
        const fe = extractEmail(f);
        if (!fe || fe.toLowerCase() !== email.toLowerCase()) return false;
        return Math.abs(new Date(f.created_at).getTime() - t) <= MATCH_WINDOW_MS;
      });
    };

    const leadRows: Row[] = ((leadsRes.data as Lead[]) || []).map((l) => ({
      kind: 'lead', id: l.id, created_at: l.created_at, name: l.name, email: l.email, phone: l.phone,
      source: l.source, failure: matchFailure(l.email, l.created_at),
    }));
    const bookingRows: Row[] = ((bookingsRes.data as Booking[]) || []).map((b) => ({
      kind: 'booking', id: b.id, created_at: b.created_at, name: b.name, email: b.email, phone: b.phone,
      source: 'booking', failure: matchFailure(b.email, b.created_at),
    }));

    const merged = [...leadRows, ...bookingRows].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => {
    const p = PERIOD_OPTIONS.find((o) => o.key === period)!;
    load(p.days);
  }, [period]);

  const stats = useMemo(() => ({
    total: rows.length,
    leads: rows.filter((r) => r.kind === 'lead').length,
    bookings: rows.filter((r) => r.kind === 'booking').length,
    failed: rows.filter((r) => r.failure).length,
  }), [rows]);

  const visible = rows.filter((r) => {
    if (filter === 'sent') return !r.failure;
    if (filter === 'failed') return !!r.failure;
    return true;
  });

  const currentPeriod = PERIOD_OPTIONS.find((o) => o.key === period)!;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Envio para o CRM · Estado</h1>
          <p className="text-sm text-muted-foreground">
            Leads e bookings com estado de entrega ao CRM (sales.getboost.digital).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/crm-validation-failures">Ver falhas detalhadas</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => load(currentPeriod.days)} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, icon: Users },
          { label: 'Leads', value: stats.leads, icon: Users },
          { label: 'Bookings', value: stats.bookings, icon: CalendarCheck },
          { label: 'Com falha', value: stats.failed, icon: XCircle },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-bold">{k.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-base">Submissões recentes</CardTitle>
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-1" role="group" aria-label="Período">
              {PERIOD_OPTIONS.map((p) => (
                <Button key={p.key} size="sm" variant={period === p.key ? 'default' : 'outline'} onClick={() => setPeriod(p.key)}>
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="flex gap-1" role="group" aria-label="Estado">
              {(['all', 'sent', 'failed'] as const).map((f) => (
                <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>
                  {f === 'all' ? 'Todos' : f === 'sent' ? 'Enviados' : 'Com falha'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>CRM</TableHead>
                  <TableHead>Erro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((r) => (
                  <TableRow key={`${r.kind}-${r.id}`}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(r.created_at).toLocaleString('pt-PT')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.kind === 'booking' ? 'default' : 'secondary'}>{r.kind}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{r.name || '—'}</TableCell>
                    <TableCell className="text-xs">{r.email || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.source || '—'}</TableCell>
                    <TableCell>
                      {r.failure ? (
                        <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                          <XCircle className="h-3.5 w-3.5" /> Falhou
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Enviado
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs max-w-md">
                      {r.failure ? (
                        <div className="space-y-0.5">
                          {Object.entries(r.failure.issues || {}).slice(0, 3).map(([k, v]) => (
                            <div key={k} className="truncate">
                              <span className="font-mono text-muted-foreground">{k}</span>: {(v as string[]).join(', ')}
                            </div>
                          ))}
                          {!r.failure.issues && <span className="text-muted-foreground">—</span>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setDetail(r)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!visible.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      Sem submissões no período.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Nota: "Enviado" indica que não foi registada falha de validação no webhook <code>crm-whatsapp-lead</code> para
        este email nos ±5min. Falhas de rede/CRM downstream ficam nos logs da edge function.
      </p>

      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhes da submissão · {detail?.kind}
            </DialogTitle>
            <DialogDescription>
              {detail?.created_at && new Date(detail.created_at).toLocaleString('pt-PT')}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-xs text-muted-foreground">Nome</div><div>{detail.name || '—'}</div></div>
                <div><div className="text-xs text-muted-foreground">Email</div><div>{detail.email || '—'}</div></div>
                <div><div className="text-xs text-muted-foreground">Telefone</div><div>{detail.phone || '—'}</div></div>
                <div><div className="text-xs text-muted-foreground">Origem</div><div>{detail.source || '—'}</div></div>
                <div><div className="text-xs text-muted-foreground">ID</div><div className="font-mono text-xs break-all">{detail.id}</div></div>
                <div>
                  <div className="text-xs text-muted-foreground">CRM</div>
                  {detail.failure ? (
                    <span className="inline-flex items-center gap-1 text-destructive text-xs font-medium">
                      <XCircle className="h-3.5 w-3.5" /> Falhou
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Enviado
                    </span>
                  )}
                </div>
              </div>

              {detail.failure && (
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold mb-1">Erros de validação</div>
                    <div className="rounded-md border bg-muted/40 p-3 space-y-1 text-xs">
                      {Object.entries(detail.failure.issues || {}).map(([k, v]) => (
                        <div key={k}>
                          <span className="font-mono text-muted-foreground">{k}</span>: {(v as string[]).join(', ')}
                        </div>
                      ))}
                      {!detail.failure.issues && <span className="text-muted-foreground">Sem detalhes.</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold mb-1">Payload enviado</div>
                    <pre className="rounded-md border bg-muted/40 p-3 text-[11px] overflow-x-auto max-h-64">
{JSON.stringify(detail.failure.raw_payload, null, 2)}
                    </pre>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><div className="text-muted-foreground">Location</div><div>{detail.failure.location || '—'}</div></div>
                    <div><div className="text-muted-foreground">Template</div><div>{detail.failure.template || '—'}</div></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCrmDeliveryStatus;
