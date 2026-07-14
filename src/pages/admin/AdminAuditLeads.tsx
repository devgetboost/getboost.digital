import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Search, Loader2, Eye, Trash2, Zap, Download, Mail, Phone, Building2, Sparkles, Send, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type ReportJSON = {
  score?: number;
  verdict?: string;
  strengths?: string[];
  gaps?: { title: string; detail: string }[];
  recommendations?: { title: string; impact: string; effort: string; detail: string }[];
  projection?: { revenueUplift?: string; timeSaved?: string; paybackMonths?: string };
  nextStep?: string;
};

type AuditRow = {
  id: string;
  lead_id: string | null;
  contact_name: string;
  contact_email: string;
  contact_company: string | null;
  contact_phone: string | null;
  industry: string | null;
  answers: Record<string, string>;
  score: number | null;
  verdict: string | null;
  report: ReportJSON;
  report_status: string;
  admin_notes: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  generated: 'Gerado',
  emailed: 'Enviado',
  reviewed: 'Revisto',
  contacted: 'Contactado',
  archived: 'Arquivado',
  error: 'Erro',
};

const STATUS_COLOR: Record<string, string> = {
  generated: 'bg-blue-100 text-blue-800 border-blue-200',
  emailed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  reviewed: 'bg-purple-100 text-purple-800 border-purple-200',
  contacted: 'bg-amber-100 text-amber-800 border-amber-200',
  archived: 'bg-muted text-muted-foreground border-border',
  error: 'bg-red-100 text-red-800 border-red-200',
};

const scoreClass = (s: number | null) => {
  if (s == null) return 'bg-muted text-muted-foreground';
  if (s >= 75) return 'bg-emerald-100 text-emerald-800';
  if (s >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
};

const AdminAuditLeads = () => {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [scoreBand, setScoreBand] = useState<string>('all');
  const [selected, setSelected] = useState<AuditRow | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('commercial_audit_reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar auditorias');
      console.error(error);
    } else {
      setRows((data || []) as AuditRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (status !== 'all' && r.report_status !== status) return false;
      if (scoreBand !== 'all' && r.score != null) {
        if (scoreBand === 'low' && r.score >= 50) return false;
        if (scoreBand === 'mid' && (r.score < 50 || r.score >= 75)) return false;
        if (scoreBand === 'high' && r.score < 75) return false;
      }
      if (scoreBand !== 'all' && r.score == null) return false;
      if (q.trim()) {
        const s = q.toLowerCase();
        if (
          !r.contact_name.toLowerCase().includes(s) &&
          !r.contact_email.toLowerCase().includes(s) &&
          !(r.contact_company || '').toLowerCase().includes(s) &&
          !(r.industry || '').toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [rows, q, status, scoreBand]);

  const stats = useMemo(() => {
    const total = rows.length;
    const avg = total ? Math.round(rows.reduce((a, r) => a + (r.score || 0), 0) / total) : 0;
    const high = rows.filter((r) => (r.score || 0) >= 75).length;
    const pending = rows.filter((r) => r.report_status === 'generated').length;
    return { total, avg, high, pending };
  }, [rows]);

  const updateRow = async (id: string, patch: Partial<AuditRow>) => {
    const { error } = await supabase.from('commercial_audit_reports').update(patch).eq('id', id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    if (selected?.id === id) setSelected((s) => (s ? { ...s, ...patch } : s));
    toast.success('Atualizado');
  };

  const deleteRow = async (id: string) => {
    if (!confirm('Apagar este relatório?')) return;
    const { error } = await supabase.from('commercial_audit_reports').delete().eq('id', id);
    if (error) { toast.error('Erro ao apagar'); return; }
    setRows((r) => r.filter((x) => x.id !== id));
    setSelected(null);
  };

  const resendEmail = async (id: string) => {
    setResendingId(id);
    const { error } = await supabase.functions.invoke('resend-audit-report', { body: { reportId: id } });
    setResendingId(null);
    if (error) {
      toast.error('Falha ao reenviar email');
      setRows((r) => r.map((x) => (x.id === id ? { ...x, report_status: 'error' } : x)));
      return;
    }
    toast.success('Relatório reenviado por email');
    setRows((r) => r.map((x) => (x.id === id ? { ...x, report_status: 'emailed' } : x)));
    if (selected?.id === id) setSelected((s) => (s ? { ...s, report_status: 'emailed' } : s));
  };

  const exportCsv = () => {
    const headers = ['Data', 'Nome', 'Email', 'Empresa', 'Telefone', 'Indústria', 'Score', 'Estado', 'Veredicto'];
    const lines = [headers.join(',')];
    filtered.forEach((r) => {
      const row = [
        format(new Date(r.created_at), 'yyyy-MM-dd HH:mm'),
        r.contact_name, r.contact_email, r.contact_company || '',
        r.contact_phone || '', r.industry || '',
        String(r.score ?? ''), r.report_status, (r.verdict || '').replace(/"/g, "'"),
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`);
      lines.push(row.join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditorias-comerciais-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Auditorias Comerciais
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Leads e relatórios gerados pela Auditoria Comercial 7 min.
          </p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Score médio</div>
          <div className="text-2xl font-bold mt-1">{stats.avg}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Alta maturidade (≥75)</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600">{stats.high}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Por rever</div>
          <div className="text-2xl font-bold mt-1 text-blue-600">{stats.pending}</div>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <Card><CardContent className="p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Procurar por nome, email, empresa, indústria..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scoreBand} onValueChange={setScoreBand}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os scores</SelectItem>
            <SelectItem value="high">Alto (≥75)</SelectItem>
            <SelectItem value="mid">Médio (50-74)</SelectItem>
            <SelectItem value="low">Baixo (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
      </CardContent></Card>

      {/* List */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-muted-foreground">
          <Zap className="h-8 w-8 mx-auto mb-3 opacity-40" />
          Nenhuma auditoria encontrada.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`shrink-0 h-14 w-14 rounded-full flex flex-col items-center justify-center font-bold ${scoreClass(r.score)}`}>
                  <span className="text-lg leading-none">{r.score ?? '—'}</span>
                  <span className="text-[9px] font-normal opacity-70">/100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold">{r.contact_name}</span>
                    {r.contact_company && (
                      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                        <Building2 className="h-3 w-3" /> {r.contact_company}
                      </span>
                    )}
                    <Badge variant="outline" className={STATUS_COLOR[r.report_status] || ''}>
                      {STATUS_LABEL[r.report_status] || r.report_status}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{r.contact_email}</span>
                    {r.contact_phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{r.contact_phone}</span>}
                    <span>{format(new Date(r.created_at), "d MMM yyyy 'às' HH:mm", { locale: pt })}</span>
                    {r.industry && <span>· {r.industry}</span>}
                  </div>
                  {r.verdict && <p className="text-sm mt-1.5 line-clamp-1 text-muted-foreground">{r.verdict}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => setSelected(r)}>
                    <Eye className="h-4 w-4 mr-1" /> Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resendEmail(r.id)}
                    disabled={resendingId === r.id}
                    title="Reenviar relatório por email"
                  >
                    {resendingId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" title="Mudar estado">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Mudar estado</DropdownMenuLabel>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (
                        <DropdownMenuItem
                          key={k}
                          disabled={r.report_status === k}
                          onClick={() => updateRow(r.id, { report_status: k })}
                        >
                          {v}
                          {r.report_status === k && <span className="ml-auto text-xs text-muted-foreground">actual</span>}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => resendEmail(r.id)}>
                        <Send className="h-4 w-4 mr-2" /> Reenviar email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteRow(r.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Apagar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className={`h-10 w-10 rounded-full flex items-center justify-center font-bold ${scoreClass(selected.score)}`}>
                    {selected.score ?? '—'}
                  </span>
                  {selected.contact_name}
                  {selected.contact_company && <span className="text-sm text-muted-foreground font-normal">· {selected.contact_company}</span>}
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><Label className="text-xs">Email</Label><p>{selected.contact_email}</p></div>
                <div><Label className="text-xs">Telefone</Label><p>{selected.contact_phone || '—'}</p></div>
                <div><Label className="text-xs">Indústria</Label><p>{selected.industry || '—'}</p></div>
                <div><Label className="text-xs">Data</Label><p>{format(new Date(selected.created_at), "d MMM yyyy HH:mm", { locale: pt })}</p></div>
              </div>

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <Label className="text-xs">Estado do relatório</Label>
                  <Select value={selected.report_status} onValueChange={(v) => updateRow(selected.id, { report_status: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(STATUS_LABEL).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => resendEmail(selected.id)}
                  disabled={resendingId === selected.id}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {resendingId === selected.id ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> A enviar...</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Reenviar email</>
                  )}
                </Button>
              </div>

              <div>
                <Label className="text-xs">Respostas do quiz</Label>
                <div className="mt-1 rounded-md border p-3 bg-muted/30 text-xs grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(selected.answers).map(([k, v]) => (
                    <div key={k}><span className="font-mono text-muted-foreground">{k}:</span> {String(v)}</div>
                  ))}
                </div>
              </div>

              {selected.verdict && (
                <div>
                  <Label className="text-xs">Diagnóstico</Label>
                  <p className="mt-1 font-semibold">{selected.verdict}</p>
                </div>
              )}

              {selected.report?.gaps?.length ? (
                <div>
                  <Label className="text-xs">Gaps identificados</Label>
                  <ul className="mt-1 space-y-2">
                    {selected.report.gaps.map((g, i) => (
                      <li key={i} className="rounded-md border p-3">
                        <div className="font-medium text-sm">{g.title}</div>
                        <p className="text-xs text-muted-foreground mt-1">{g.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selected.report?.recommendations?.length ? (
                <div>
                  <Label className="text-xs">Recomendações</Label>
                  <ul className="mt-1 space-y-2">
                    {selected.report.recommendations.map((r, i) => (
                      <li key={i} className="rounded-md border p-3">
                        <div className="font-medium text-sm">{r.title}</div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline">Impacto: {r.impact}</Badge>
                          <Badge variant="outline">Esforço: {r.effort}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{r.detail}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {selected.report?.nextStep && (
                <div className="rounded-md border-2 border-primary/40 bg-primary/5 p-3">
                  <Label className="text-xs">Próximo passo sugerido</Label>
                  <p className="text-sm font-medium mt-1">{selected.report.nextStep}</p>
                </div>
              )}

              <div>
                <Label className="text-xs">Notas internas</Label>
                <Textarea
                  value={selected.admin_notes || ''}
                  onChange={(e) => setSelected({ ...selected, admin_notes: e.target.value })}
                  onBlur={() => updateRow(selected.id, { admin_notes: selected.admin_notes })}
                  placeholder="Notas privadas sobre este lead..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditLeads;
