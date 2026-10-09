import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  CalendarIcon, Users, CheckCircle, Clock, FileText, FolderKanban,
  TrendingUp, ArrowUpRight, AlertTriangle, Mail, BookOpen,
  ArrowUp, ArrowDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays, isAfter } from 'date-fns';
import { pt } from 'date-fns/locale';

/**
 * R1C8: the dashboard reads Clean V1 tables. Content counts come from
 * `content_entries` (insight/guide) and `case_studies`; the retired
 * `blog_posts`, `projects` and `resources` tables are no longer queried.
 * Bookings carry absolute `start_at` instants instead of `meeting_date`/`time`.
 */
interface Lead { id: string; created_at: string; status: string; name: string; email: string; source: string }
interface Booking { id: string; start_at: string; status: string; name: string; created_at: string }
interface ContentItem { id: string; market: string; status: string; updated_at: string; slug: string | null; title: string | null }

const COLORS = ['hsl(var(--primary))', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [posts, setPosts] = useState<ContentItem[]>([]);
  const [projects, setProjects] = useState<ContentItem[]>([]);
  const [resourceCount, setResourceCount] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      const [leadsRes, bookingsRes, insightsRes, guidesRes, casesRes] = await Promise.all([
        supabase.from('leads').select('id, created_at, status, name, email, source').order('created_at', { ascending: false }).limit(100),
        supabase.from('bookings').select('id, start_at, status, name, created_at').order('created_at', { ascending: false }).limit(100),
        supabase.from('content_entries').select('id, status, updated_at, content_localizations!inner(market, status, slug, title)').eq('content_type', 'insight').order('updated_at', { ascending: false }).limit(20),
        supabase.from('content_entries').select('id', { count: 'exact', head: true }).eq('content_type', 'guide'),
        supabase.from('case_studies').select('id, status, updated_at, case_study_localizations!inner(market, status, slug, title)').order('updated_at', { ascending: false }).limit(20),
      ]);
      setLeads((leadsRes.data || []) as Lead[]);
      setBookings((bookingsRes.data || []) as Booking[]);
      setPosts(((insightsRes.data || []) as any[]).map((row) => ({
        id: row.id,
        market: row.content_localizations?.[0]?.market ?? '?',
        status: row.content_localizations?.[0]?.status ?? row.status,
        updated_at: row.updated_at,
        slug: row.content_localizations?.[0]?.slug ?? null,
        title: row.content_localizations?.[0]?.title ?? null,
      })));
      setProjects(((casesRes.data || []) as any[]).map((row) => ({
        id: row.id,
        market: row.case_study_localizations?.[0]?.market ?? '?',
        status: row.case_study_localizations?.[0]?.status ?? row.status,
        updated_at: row.updated_at,
        slug: row.case_study_localizations?.[0]?.slug ?? null,
        title: row.case_study_localizations?.[0]?.title ?? null,
      })));
      setResourceCount(guidesRes.count || 0);
    };
    fetchAll();
  }, []);

  // --- KPI calculations ---
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const fourteenDaysAgo = subDays(now, 14);

  const leadsTotal = leads.length;
  const leadsNew7d = leads.filter(l => isAfter(new Date(l.created_at), sevenDaysAgo)).length;
  const leadsPrev7d = leads.filter(l => {
    const d = new Date(l.created_at);
    return isAfter(d, fourteenDaysAgo) && !isAfter(d, sevenDaysAgo);
  }).length;
  const leadsTrend = leadsNew7d - leadsPrev7d;

  const bookingsPending = bookings.filter(b => b.status === 'requested').length;
  const bookingsConfirmed = bookings.filter(b => b.status === 'confirmed').length;
  const bookingsCompleted = bookings.filter(b => b.status === 'completed').length;
  const activeProjects = projects.filter(p => p.status === 'published').length;

  const leadsNewStatus = leads.filter(l => l.status === 'new').length;
  const conversion = leadsTotal > 0
    ? ((leads.filter(l => l.status === 'converted').length / leadsTotal) * 100).toFixed(1)
    : '0';

  const kpis = [
    { label: 'Leads Totais', value: leadsTotal, icon: Users, trend: leadsTrend, color: 'text-primary', bg: 'bg-primary/8' },
    { label: 'Leads (7 dias)', value: leadsNew7d, icon: TrendingUp, trend: leadsTrend, color: 'text-emerald-500', bg: 'bg-emerald-500/8' },
    { label: 'Reuniões Agendadas', value: bookingsPending + bookingsConfirmed, icon: CalendarIcon, color: 'text-blue-500', bg: 'bg-blue-500/8' },
    { label: 'Reuniões Concluídas', value: bookingsCompleted, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/8' },
    { label: 'Projetos Ativos', value: activeProjects, icon: FolderKanban, color: 'text-indigo-500', bg: 'bg-indigo-500/8' },
    { label: 'Artigos', value: posts.length, icon: FileText, color: 'text-violet-500', bg: 'bg-violet-500/8' },
    { label: 'Recursos', value: resourceCount, icon: BookOpen, color: 'text-amber-500', bg: 'bg-amber-500/8' },
    { label: 'Taxa Conversão', value: `${conversion}%`, icon: TrendingUp, color: 'text-pink-500', bg: 'bg-pink-500/8' },
  ];

  // --- Charts data ---
  const leadsByDay = (() => {
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(now, i), 'dd/MM');
      days[d] = 0;
    }
    leads.forEach(l => {
      const d = format(new Date(l.created_at), 'dd/MM');
      if (days[d] !== undefined) days[d]++;
    });
    return Object.entries(days).map(([day, count]) => ({ day, leads: count }));
  })();

  const leadsBySource = (() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { map[l.source] = (map[l.source] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const bookingsByStatus = [
    { name: 'Pendentes', value: bookingsPending },
    { name: 'Confirmadas', value: bookingsConfirmed },
    { name: 'Concluídas', value: bookingsCompleted },
  ].filter(s => s.value > 0);

  // --- Alerts ---
  const alerts: { text: string; type: 'warning' | 'info'; url: string }[] = [];
  if (leadsNewStatus > 0) alerts.push({ text: `${leadsNewStatus} lead(s) sem resposta`, type: 'warning', url: '/admin/leads' });
  if (bookingsPending > 0) alerts.push({ text: `${bookingsPending} reunião(ões) pendente(s)`, type: 'warning', url: '/admin/agenda' });
  const draftPosts = posts.filter(p => p.status === 'draft').length;
  if (draftPosts > 0) alerts.push({ text: `${draftPosts} artigo(s) por publicar`, type: 'info', url: '/admin/blog' });
  const draftProjects = projects.filter(p => p.status === 'draft').length;
  if (draftProjects > 0) alerts.push({ text: `${draftProjects} projeto(s) em rascunho`, type: 'info', url: '/admin/projetos' });

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground mt-1">Visão geral do teu negócio</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {alerts.map((a, i) => (
            <Card
              key={i}
              className={`cursor-pointer border-dashed transition-all hover:shadow-md ${
                a.type === 'warning' ? 'border-amber-500/30 bg-amber-500/5' : 'border-blue-500/30 bg-blue-500/5'
              }`}
              onClick={() => navigate(a.url)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className={`h-4 w-4 shrink-0 ${a.type === 'warning' ? 'text-amber-500' : 'text-blue-500'}`} />
                <p className="text-xs font-medium text-foreground">{a.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-border/30 hover:border-border/60 transition-all duration-300 hover:shadow-lg hover:shadow-black/5 group">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                {kpi.trend !== undefined && kpi.trend !== 0 && (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 gap-0.5 ${kpi.trend > 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                    {kpi.trend > 0 ? <ArrowUp className="h-2.5 w-2.5" /> : <ArrowDown className="h-2.5 w-2.5" />}
                    {Math.abs(kpi.trend)}
                  </Badge>
                )}
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads Growth */}
        <Card className="lg:col-span-2 border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Crescimento de Leads (7 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={leadsByDay} barSize={24}>
                <XAxis dataKey="day" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Pie */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Origem dos Contactos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {leadsBySource.length > 0 ? (
              <div className="w-full">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={leadsBySource} cx="50%" cy="50%" outerRadius={60} innerRadius={35} dataKey="value" paddingAngle={3}>
                      {leadsBySource.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                  {leadsBySource.map((s, i) => (
                    <span key={s.name} className="text-[10px] flex items-center gap-1 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                      {s.name} ({s.value})
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reuniões Chart + Acesso Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings by Status */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Reuniões por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {bookingsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={bookingsByStatus} cx="50%" cy="50%" outerRadius={65} innerRadius={40} dataKey="value" paddingAngle={3}>
                    {bookingsByStatus.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-12">Sem reuniões</p>
            )}
            <div className="flex flex-wrap gap-3 justify-center">
              {bookingsByStatus.map((s, i) => (
                <span key={s.name} className="text-[11px] flex items-center gap-1.5 text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                  {s.name}: {s.value}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card className="border-border/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Acesso Rápido</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Recent leads */}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Últimos Leads</p>
            {leads.slice(0, 3).map(l => (
              <div
                key={l.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 hover:border-border/60 cursor-pointer transition-all group"
                onClick={() => navigate('/admin/leads')}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{l.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{l.email}</p>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
              </div>
            ))}

            {/* Recent bookings */}
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pt-2">Próximas Reuniões</p>
            {bookings.filter(b => b.status !== 'completed').slice(0, 2).map(b => (
              <div
                key={b.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-border/30 hover:border-border/60 cursor-pointer transition-all group"
                onClick={() => navigate('/admin/agenda')}
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{b.name}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(b.start_at).toLocaleString('pt-PT')}</p>
                </div>
                <Badge variant="outline" className="text-[9px] h-4 shrink-0">
                  {b.status === 'requested' ? 'Pendente' : b.status === 'confirmed' ? 'Confirmada' : b.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
