import { Fragment, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type Row = {
  id: string;
  created_at: string;
  location: string | null;
  template: string | null;
  click_id: string | null;
  page_url: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  issues: Record<string, string[]>;
  raw_payload: Record<string, unknown> | null;
};

const AdminCrmValidationFailures = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from('crm_validation_failures')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString());
    if (dateTo) q = q.lte('created_at', new Date(new Date(dateTo).getTime() + 86400000).toISOString());
    const { data, error } = await q;
    if (error) toast.error('Erro a carregar falhas');
    setRows((data as Row[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [dateFrom, dateTo]);

  const summary = useMemo(() => {
    const missingUtms = rows.filter((r) => !r.utm_source || !r.utm_medium || !r.utm_campaign).length;
    const missingLoc = rows.filter((r) => !r.location).length;
    const missingTpl = rows.filter((r) => !r.template).length;
    return { total: rows.length, missingUtms, missingLoc, missingTpl };
  }, [rows]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" /> Falhas de validação · CRM
          </h1>
          <p className="text-sm text-muted-foreground">Últimas rejeições do webhook <code>crm-whatsapp-lead</code>.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: summary.total },
          { label: 'Sem UTMs', value: summary.missingUtms },
          { label: 'Sem location', value: summary.missingLoc },
          { label: 'Sem template', value: summary.missingTpl },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-4">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="text-2xl font-bold">{k.value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Filtro por período</CardTitle></CardHeader>
        <CardContent className="flex gap-3 flex-wrap">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-auto" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-auto" />
          <Button variant="ghost" onClick={() => { setDateFrom(''); setDateTo(''); }}>Limpar</Button>
        </CardContent>
      </Card>

      <Card>
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
                  <TableHead>Location</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>UTMs</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const isOpen = expanded === r.id;
                  return (
                    <Fragment key={r.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(isOpen ? null : r.id)}>

                        <TableCell className="text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString('pt-PT')}</TableCell>
                        <TableCell>{r.location || <span className="text-destructive text-xs">— em falta</span>}</TableCell>
                        <TableCell>{r.template ? <Badge variant="secondary">{r.template}</Badge> : <span className="text-destructive text-xs">— em falta</span>}</TableCell>
                        <TableCell className="text-xs">
                          <div>{r.utm_source || <span className="text-destructive">source?</span>} / {r.utm_medium || <span className="text-destructive">medium?</span>}</div>
                          <div className="text-muted-foreground">{r.utm_campaign || <span className="text-destructive">campaign?</span>}</div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {Object.entries(r.issues || {}).map(([k, v]) => (
                            <div key={k}><span className="font-mono">{k}</span>: {(v as string[]).join(', ')}</div>
                          ))}
                        </TableCell>
                      </TableRow>
                      {isOpen && (
                        <TableRow key={`${r.id}-raw`}>
                          <TableCell colSpan={5} className="bg-muted/40">
                            <pre className="text-[11px] whitespace-pre-wrap max-h-64 overflow-auto">{JSON.stringify(r.raw_payload, null, 2)}</pre>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })}
                {!rows.length && (
                  <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Sem falhas no período.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCrmValidationFailures;
