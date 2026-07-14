import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Filter, Loader2, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';


type Lead = {
  id: string;
  created_at: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source: string | null;
  service: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  status: string | null;
  landing_page: string | null;
  referrer: string | null;
};

const ALL = '__all__';

const CSV_COLUMNS: Array<keyof Lead> = [
  'created_at', 'name', 'email', 'phone', 'company', 'source', 'service',
  'utm_source', 'utm_medium', 'utm_campaign', 'status', 'landing_page', 'referrer', 'id',
];

const csvEscape = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const toCSV = (rows: Lead[]) => {
  const header = CSV_COLUMNS.join(',');
  const body = rows.map((r) => CSV_COLUMNS.map((c) => csvEscape(r[c])).join(',')).join('\n');
  return `${header}\n${body}`;
};

const AdminLeadsAnalytics = () => {
  const navigate = useNavigate();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [template, setTemplate] = useState<string>(ALL);
  const [utmSource, setUtmSource] = useState<string>(ALL);
  const [utmMedium, setUtmMedium] = useState<string>(ALL);
  const [utmCampaign, setUtmCampaign] = useState<string>(ALL);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [sortKey, setSortKey] = useState<keyof Lead>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);


  const fetchLeads = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('leads')
      .select('id, created_at, name, email, phone, company, source, service, utm_source, utm_medium, utm_campaign, status, landing_page, referrer')
      .order('created_at', { ascending: false })
      .limit(2000);
    if (error) {
      toast.error('Erro a carregar leads');
      console.error(error);
    } else {
      setLeads((data as Lead[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);

  const unique = (key: keyof Lead) =>
    Array.from(new Set(leads.map((l) => l[key]).filter(Boolean) as string[])).sort();

  const templates = useMemo(() => unique('source'), [leads]);
  const utmSources = useMemo(() => unique('utm_source'), [leads]);
  const utmMediums = useMemo(() => unique('utm_medium'), [leads]);
  const utmCampaigns = useMemo(() => unique('utm_campaign'), [leads]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = dateFrom ? new Date(dateFrom).getTime() : null;
    const to = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null;
    return leads.filter((l) => {
      if (template !== ALL && l.source !== template) return false;
      if (utmSource !== ALL && l.utm_source !== utmSource) return false;
      if (utmMedium !== ALL && l.utm_medium !== utmMedium) return false;
      if (utmCampaign !== ALL && l.utm_campaign !== utmCampaign) return false;
      const ts = new Date(l.created_at).getTime();
      if (from && ts < from) return false;
      if (to && ts > to) return false;
      if (q) {
        const hay = [l.name, l.email, l.phone, l.company, l.service, l.landing_page]
          .filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [leads, search, template, utmSource, utmMedium, utmCampaign, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      let cmp = 0;
      if (sortKey === 'created_at') {
        cmp = new Date(av as string).getTime() - new Date(bv as string).getTime();
      } else {
        cmp = String(av).localeCompare(String(bv), 'pt', { sensitivity: 'base' });
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  useEffect(() => { setPage(1); }, [search, template, utmSource, utmMedium, utmCampaign, dateFrom, dateTo, pageSize]);

  const toggleSort = (key: keyof Lead) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const exportCSV = () => {
    if (!filtered.length) return toast.error('Sem leads para exportar');
    const blob = new Blob([toCSV(sorted)], { type: 'text/csv;charset=utf-8;' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filtered.length} leads exportados`);
  };

  const clearFilters = () => {
    setSearch(''); setTemplate(ALL); setUtmSource(ALL); setUtmMedium(ALL);
    setUtmCampaign(ALL); setDateFrom(''); setDateTo('');
  };

  const drillTo = (opts: { template?: string; utmCampaign?: string; utmSource?: string; utmMedium?: string }) => {
    if (opts.template) setTemplate(opts.template);
    if (opts.utmCampaign) setUtmCampaign(opts.utmCampaign);
    if (opts.utmSource) setUtmSource(opts.utmSource);
    if (opts.utmMedium) setUtmMedium(opts.utmMedium);
    setPage(1);
    setTimeout(() => {
      document.getElementById('leads-drilldown-table')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };


  const CHART_COLORS = ['#ff4000', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'];

  const groupTop = (key: keyof Lead, topN = 8) => {
    const map = new Map<string, number>();
    for (const l of filtered) {
      const v = (l[key] as string) || '—';
      map.set(v, (map.get(v) || 0) + 1);
    }
    const arr = Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    if (arr.length <= topN) return arr;
    const head = arr.slice(0, topN);
    const rest = arr.slice(topN).reduce((s, x) => s + x.value, 0);
    return [...head, { name: 'Outros', value: rest }];
  };

  const byTemplate = useMemo(() => groupTop('source'), [filtered]);
  const byCampaign = useMemo(() => groupTop('utm_campaign'), [filtered]);

  const byDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of filtered) {
      const d = new Date(l.created_at).toISOString().slice(0, 10);
      map.set(d, (map.get(d) || 0) + 1);
    }
    return Array.from(map, ([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date));
  }, [filtered]);

  const kpis = useMemo(() => {
    const total = filtered.length;
    const uniqueTemplates = new Set(filtered.map((l) => l.source).filter(Boolean)).size;
    const uniqueCampaigns = new Set(filtered.map((l) => l.utm_campaign).filter(Boolean)).size;
    const topTemplate = byTemplate[0]?.name ?? '—';
    return { total, uniqueTemplates, uniqueCampaigns, topTemplate };
  }, [filtered, byTemplate]);


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Leads · Analytics & Export</h1>
          <p className="text-sm text-muted-foreground">Filtra por template/origem, UTMs e campanha. Exporta em CSV.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchLeads} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
          <Button size="sm" onClick={exportCSV} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV ({filtered.length})
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Filter className="h-4 w-4" /> Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Input placeholder="Pesquisar nome/email/empresa…" value={search} onChange={(e) => setSearch(e.target.value)} />

          <Select value={template} onValueChange={setTemplate}>
            <SelectTrigger><SelectValue placeholder="Template / origem" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos os templates</SelectItem>
              {templates.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={utmSource} onValueChange={setUtmSource}>
            <SelectTrigger><SelectValue placeholder="utm_source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos utm_source</SelectItem>
              {utmSources.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={utmMedium} onValueChange={setUtmMedium}>
            <SelectTrigger><SelectValue placeholder="utm_medium" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos utm_medium</SelectItem>
              {utmMediums.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={utmCampaign} onValueChange={setUtmCampaign}>
            <SelectTrigger><SelectValue placeholder="utm_campaign" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas as campanhas</SelectItem>
              {utmCampaigns.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          <Button variant="ghost" onClick={clearFilters}>Limpar filtros</Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total leads', value: kpis.total, onClick: () => clearFilters() },
          { label: 'Templates ativos', value: kpis.uniqueTemplates, onClick: undefined },
          { label: 'Campanhas', value: kpis.uniqueCampaigns, onClick: undefined },
          {
            label: 'Top template',
            value: kpis.topTemplate,
            onClick: kpis.topTemplate && kpis.topTemplate !== '—'
              ? () => drillTo({ template: kpis.topTemplate })
              : undefined,
          },
        ].map((k) => (
          <Card
            key={k.label}
            onClick={k.onClick}
            className={k.onClick ? 'cursor-pointer hover:border-primary transition-colors' : ''}
          >
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{k.label}</div>
              <div className="text-2xl font-bold truncate">{k.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Volume diário</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={byDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#ff4000" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads por template</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byTemplate}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={80}
                  label={{ fontSize: 10 }}
                  onClick={(entry: any) => entry?.name && entry.name !== 'Outros' && drillTo({ template: entry.name })}
                  className="cursor-pointer"
                >
                  {byTemplate.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="pb-2"><CardTitle className="text-base">Leads por utm_campaign</CardTitle></CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byCampaign}
                onClick={(state: any) => {
                  const name = state?.activePayload?.[0]?.payload?.name;
                  if (name && name !== 'Outros') drillTo({ utmCampaign: name });
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#ff4000" radius={[4, 4, 0, 0]} className="cursor-pointer" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>




      <Card id="leads-drilldown-table">

        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {([
                    ['created_at', 'Data'],
                    ['name', 'Nome'],
                    ['email', 'Contacto'],
                    ['source', 'Template'],
                    ['utm_source', 'UTM source / medium'],
                    ['utm_campaign', 'Campanha'],
                    ['status', 'Status'],
                  ] as Array<[keyof Lead, string]>).map(([key, label]) => (
                    <TableHead key={key}>
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center gap-1 hover:text-foreground"
                      >
                        {label}
                        <ArrowUpDown className={`h-3 w-3 ${sortKey === key ? 'opacity-100' : 'opacity-40'}`} />
                        {sortKey === key && (
                          <span className="text-[10px]">{sortDir === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/leads/${l.id}`)}>
                    <TableCell className="text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString('pt-PT')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{l.name || '—'}</div>
                      {l.company && <div className="text-xs text-muted-foreground">{l.company}</div>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>{l.email || '—'}</div>
                      <div className="text-muted-foreground">{l.phone || ''}</div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{l.source || '—'}</Badge></TableCell>
                    <TableCell className="text-xs">
                      <div>{l.utm_source || '—'}</div>
                      <div className="text-muted-foreground">{l.utm_medium || ''}</div>
                    </TableCell>
                    <TableCell className="text-xs">{l.utm_campaign || '—'}</TableCell>
                    <TableCell><Badge variant="outline">{l.status || 'novo'}</Badge></TableCell>
                  </TableRow>
                ))}
                {!sorted.length && (
                  <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Sem resultados</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
          {sorted.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap p-3 border-t text-xs">
              <div className="text-muted-foreground">
                {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, sorted.length)} de {sorted.length}
              </div>
              <div className="flex items-center gap-2">
                <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                  <SelectTrigger className="h-8 w-[90px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[25, 50, 100, 200].map((n) => <SelectItem key={n} value={String(n)}>{n} / pág</SelectItem>)}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="tabular-nums">{currentPage} / {totalPages}</span>
                <Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLeadsAnalytics;
