import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Users, Search, Mail, Phone, Globe, Building2, Calendar, Eye, Trash2, Loader2, MessageSquare, Download, BarChart3, Filter, AlertTriangle, Settings2, Tag as TagIcon, Zap, LayoutList, KanbanSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import LeadTagsManager from '@/components/admin/LeadTagsManager';
import LeadTagPicker from '@/components/admin/LeadTagPicker';
import LeadAutomationTimeline from '@/components/admin/LeadAutomationTimeline';

type Lead = {
  id: string;
  source: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  service: string | null;
  budget: string | null;
  timeline: string | null;
  message: string | null;
  resource_id: string | null;
  resource_name: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800 border-blue-200',
  contacted: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  qualified: 'bg-green-100 text-green-800 border-green-200',
  converted: 'bg-primary/10 text-primary border-primary/30',
  lost: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  converted: 'Convertido',
  lost: 'Perdido',
};

const sourceLabels: Record<string, string> = {
  contact: 'Contacto',
  resource: 'Recurso',
};

const AdminLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [notes, setNotes] = useState('');
  const [showMetrics, setShowMetrics] = useState(false);
  const [metricsType, setMetricsType] = useState<'source' | 'medium' | 'campaign' | 'combined' | 'referrer' | 'landing_page'>('source');
  const [tagsManagerOpen, setTagsManagerOpen] = useState(false);
  const [allTags, setAllTags] = useState<{ id: string; label: string; color: string }[]>([]);
  const [leadTagMap, setLeadTagMap] = useState<Record<string, { id: string; label: string; color: string }[]>>({});
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(() => (localStorage.getItem('leads_view_mode') as 'list' | 'kanban') || 'list');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [conversionThreshold, setConversionThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('conversion_threshold');
    return saved ? Number(saved) : 5;
  });

  useEffect(() => { localStorage.setItem('leads_view_mode', viewMode); }, [viewMode]);

  const utmMetrics = useMemo(() => {
    const stats: Record<string, { leads: number; converted: number }> = {};
    
    leads.forEach(l => {
      let key = 'direct';
      if (metricsType === 'source') key = l.utm_source || 'direct';
      else if (metricsType === 'medium') key = l.utm_medium || 'direct';
      else if (metricsType === 'campaign') key = l.utm_campaign || 'direct';
      else if (metricsType === 'referrer') key = l.referrer || 'direct';
      else if (metricsType === 'landing_page') key = l.landing_page || 'unknown';
      else if (metricsType === 'combined') {
        key = `${l.utm_source || 'direct'} / ${l.utm_medium || 'direct'} / ${l.utm_campaign || 'direct'}`;
      }

      if (!stats[key]) stats[key] = { leads: 0, converted: 0 };
      stats[key].leads++;
      if (l.status === 'converted') stats[key].converted++;
    });

    return Object.entries(stats)
      .map(([key, data]) => ({
        key,
        leads: data.leads,
        converted: data.converted,
        rate: data.leads > 0 ? (data.converted / data.leads) * 100 : 0
      }))
      .sort((a, b) => b.leads - a.leads);
  }, [leads, metricsType]);

  const fetchLeads = async () => {
    setLoading(true);
    const [leadsRes, tagsRes, assignRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('lead_tags').select('id, label, color').order('label'),
      supabase.from('lead_tag_assignments').select('lead_id, lead_tags(id, label, color)'),
    ]);
    if (leadsRes.error) toast.error('Erro ao carregar leads.');
    else setLeads(leadsRes.data || []);
    setAllTags((tagsRes.data || []) as any);
    const map: Record<string, { id: string; label: string; color: string }[]> = {};
    ((assignRes.data || []) as any[]).forEach((row) => {
      if (!row.lead_tags) return;
      (map[row.lead_id] ||= []).push(row.lead_tags);
    });
    setLeadTagMap(map);
    setLoading(false);
  };

  useEffect(() => { fetchLeads(); }, []);


  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) { toast.error('Erro ao atualizar.'); return; }
    toast.success(`Estado atualizado para "${statusLabels[status]}".`);
    fetchLeads();
  };

  const saveNotes = async () => {
    if (!selectedLead) return;
    const { error } = await supabase.from('leads').update({ notes }).eq('id', selectedLead.id);
    if (error) { toast.error('Erro ao guardar notas.'); return; }
    toast.success('Notas guardadas.');
    fetchLeads();
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from('leads').delete().eq('id', id);
    if (error) { toast.error('Erro ao eliminar.'); return; }
    toast.success('Lead eliminado.');
    fetchLeads();
  };

  const exportCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Empresa', 'Origem', 'Estado', 'Serviço', 'Data', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Referrer', 'Landing Page'];
    const rows = filtered.map(l => [
      l.name, l.email, l.phone || '', l.company || '',
      sourceLabels[l.source] || l.source, statusLabels[l.status] || l.status,
      l.service || '', format(new Date(l.created_at), 'dd/MM/yyyy'),
      l.utm_source || '', l.utm_medium || '', l.utm_campaign || '',
      l.referrer || '', l.landing_page || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = leads.filter(l => {
    const matchSearch = l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || l.status === statusFilter;
    const matchSource = sourceFilter === 'all' || l.source === sourceFilter;
    const matchTag = tagFilter === 'all' || (leadTagMap[l.id] || []).some(t => t.id === tagFilter);
    return matchSearch && matchStatus && matchSource && matchTag;
  });


  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Leads</h2>
        <div className="flex gap-2 items-center flex-wrap">
          <div className="inline-flex rounded-md border border-border bg-background p-0.5">
            <Button size="sm" variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="h-8 px-2.5 gap-1.5">
              <LayoutList className="h-4 w-4" /> Lista
            </Button>
            <Button size="sm" variant={viewMode === 'kanban' ? 'secondary' : 'ghost'} onClick={() => setViewMode('kanban')} className="h-8 px-2.5 gap-1.5">
              <KanbanSquare className="h-4 w-4" /> Kanban
            </Button>
          </div>
          <Button size="sm" variant="outline" onClick={() => setTagsManagerOpen(true)} className="gap-1.5">
            <TagIcon className="h-4 w-4" /> Tags
          </Button>
          <Button size="sm" variant={showMetrics ? "secondary" : "outline"} onClick={() => setShowMetrics(!showMetrics)} className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Métricas UTM
          </Button>
          <Button size="sm" variant="outline" onClick={exportCSV} className="gap-1.5">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        </div>
      </div>


      {showMetrics && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Performance por Parâmetros e Origem
                </h3>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Configurações de Alerta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="threshold">Limite de Alerta de Conversão (%)</Label>
                        <Input 
                          id="threshold" 
                          type="number" 
                          value={conversionThreshold} 
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setConversionThreshold(val);
                            localStorage.setItem('conversion_threshold', String(val));
                          }}
                        />
                        <p className="text-xs text-muted-foreground">
                          As métricas com taxa de conversão abaixo deste valor serão destacadas.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="flex flex-wrap gap-2 bg-background p-1 rounded-lg border border-border">
                {(['source', 'medium', 'campaign', 'referrer', 'landing_page', 'combined'] as const).map((type) => (
                  <Button
                    key={type}
                    size="sm"
                    variant={metricsType === type ? "default" : "ghost"}
                    onClick={() => setMetricsType(type)}
                    className="text-xs h-8 px-3"
                  >
                    {type === 'landing_page' ? 'Página' : 
                     type === 'referrer' ? 'Referrer' :
                     type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {utmMetrics.slice(0, 12).map((m) => (
                <div key={m.key} className={`bg-background p-4 rounded-xl border shadow-sm group transition-colors relative ${m.rate < conversionThreshold && m.leads >= 5 ? 'border-destructive/50 bg-destructive/5' : 'border-border hover:border-primary/30'}`}>
                  {m.rate < conversionThreshold && m.leads >= 5 && (
                    <div className="absolute top-2 right-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    </div>
                  )}
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    {metricsType === 'combined' ? 'Source / Medium / Campaign' : metricsType}
                  </p>
                  <p className="text-sm font-bold text-foreground truncate mb-3 pr-6" title={m.key}>
                    {m.key}
                  </p>
                  <div className="flex items-end justify-between border-t border-border/50 pt-3">
                    <div>
                      <p className="text-2xl font-bold leading-none">{m.leads}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Leads Totais</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold leading-none ${m.rate < conversionThreshold && m.leads >= 5 ? 'text-destructive' : 'text-primary'}`}>{m.rate.toFixed(1)}%</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Taxa Conversão</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {utmMetrics.length === 0 && (
              <p className="text-center py-6 text-muted-foreground italic">Sem dados de UTM suficientes para métricas.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {Object.entries(statusLabels).map(([key, label]) => (
          <Card key={key} className="border-border cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}>
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-xl font-bold text-foreground">{leads.filter(l => l.status === key).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Pesquisar por nome ou email..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as origens</SelectItem>
            {Object.entries(sourceLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={tagFilter} onValueChange={setTagFilter}>
          <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as tags</SelectItem>
            {allTags.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>

      </div>

      {/* Leads list or Kanban */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nenhum lead encontrado.</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {Object.entries(statusLabels).map(([statusKey, statusLabel]) => {
            const colLeads = filtered.filter(l => l.status === statusKey);
            const isOver = dragOverCol === statusKey;
            return (
              <div
                key={statusKey}
                onDragOver={(e) => { e.preventDefault(); setDragOverCol(statusKey); }}
                onDragLeave={() => setDragOverCol(prev => prev === statusKey ? null : prev)}
                onDrop={(e) => {
                  e.preventDefault();
                  const id = e.dataTransfer.getData('text/lead-id') || draggingId;
                  setDragOverCol(null);
                  setDraggingId(null);
                  if (!id) return;
                  const lead = leads.find(l => l.id === id);
                  if (!lead || lead.status === statusKey) return;
                  updateStatus(id, statusKey);
                }}
                className={`rounded-lg border ${isOver ? 'border-primary bg-primary/5' : 'border-border bg-muted/30'} transition-colors flex flex-col min-h-[200px]`}
              >
                <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between sticky top-0 bg-inherit rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <Badge className={`text-[10px] ${statusColors[statusKey]}`}>{statusLabel}</Badge>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{colLeads.length}</span>
                </div>
                <div className="p-2 space-y-2 flex-1">
                  {colLeads.length === 0 && (
                    <p className="text-[11px] text-muted-foreground/70 italic text-center py-6">Arrasta cards para aqui</p>
                  )}
                  {colLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/lead-id', lead.id);
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingId(lead.id);
                      }}
                      onDragEnd={() => { setDraggingId(null); setDragOverCol(null); }}
                      className={`bg-background border border-border rounded-md p-2.5 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/40 transition ${draggingId === lead.id ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-foreground truncate">{lead.name}</p>
                        <Badge variant="outline" className="text-[9px] shrink-0">{sourceLabels[lead.source] || lead.source}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3 shrink-0" />{lead.email}
                      </p>
                      {lead.company && (
                        <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                          <Building2 className="h-3 w-3 shrink-0" />{lead.company}
                        </p>
                      )}
                      {(leadTagMap[lead.id] || []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(leadTagMap[lead.id] || []).slice(0, 3).map(t => (
                            <Badge key={t.id} className="text-[9px] border-0 px-1.5" style={{ backgroundColor: t.color + "22", color: t.color }}>
                              {t.label}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                        {format(new Date(lead.created_at), "d MMM", { locale: pt })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(lead => (
            <Card key={lead.id} className="border-border hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <h3 className="font-semibold text-foreground text-sm">{lead.name}</h3>
                      <Badge className={`text-xs ${statusColors[lead.status]}`}>{statusLabels[lead.status]}</Badge>
                      <Badge variant="outline" className="text-xs">{sourceLabels[lead.source] || lead.source}</Badge>
                      {lead.resource_name && <Badge variant="secondary" className="text-xs">{lead.resource_name}</Badge>}
                      {(leadTagMap[lead.id] || []).map(t => (
                        <Badge key={t.id} className="text-[10px] border-0" style={{ backgroundColor: t.color + "22", color: t.color }}>
                          {t.label}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>
                      {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
                      {lead.company && <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{lead.company}</span>}
                      {lead.website && <span className="flex items-center gap-1"><Globe className="h-3 w-3" />{lead.website}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(lead.created_at), "d MMM yyyy HH:mm", { locale: pt })}</span>
                    </div>
                    {lead.message && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-1 flex items-center gap-1">
                        <MessageSquare className="h-3 w-3 shrink-0" /> {lead.message}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Status change */}
                    <Select value={lead.status} onValueChange={v => updateStatus(lead.id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    {/* View details */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedLead(lead); setNotes(lead.notes || ''); }}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between gap-3">
                            <span>{lead.name}</span>
                            <LeadTagPicker leadId={lead.id} onChanged={fetchLeads} />
                          </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 text-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Email:</span> <a href={`mailto:${lead.email}`} className="text-primary font-medium">{lead.email}</a></div>
                            {lead.phone && <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Telefone:</span> <span className="font-medium">{lead.phone}</span></div>}
                            {lead.company && <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Empresa:</span> <span className="font-medium">{lead.company}</span></div>}
                            {lead.website && <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Website:</span> <span className="font-medium">{lead.website}</span></div>}
                            {lead.service && <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Serviço:</span> <span className="font-medium">{lead.service}</span></div>}
                            {lead.budget && <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Orçamento:</span> <span className="font-medium">{lead.budget}€</span></div>}
                            {lead.timeline && <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Timeline:</span> <span className="font-medium">{lead.timeline}</span></div>}
                            <div><span className="text-muted-foreground block text-[10px] uppercase font-bold">Origem:</span> <span className="font-medium">{sourceLabels[lead.source] || lead.source}</span></div>
                          </div>

                          <div className="p-3 bg-muted/50 rounded-xl border border-border/50">
                            <h4 className="text-[10px] uppercase font-bold text-muted-foreground mb-2 flex items-center gap-1">
                              <Filter className="h-3 w-3" /> Rastreamento de Marketing
                            </h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <p className="text-[9px] text-muted-foreground uppercase">Source</p>
                                <p className="font-mono text-[11px] truncate" title={lead.utm_source || 'direct'}>{lead.utm_source || 'direct'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-muted-foreground uppercase">Medium</p>
                                <p className="font-mono text-[11px] truncate" title={lead.utm_medium || 'direct'}>{lead.utm_medium || 'direct'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] text-muted-foreground uppercase">Campaign</p>
                                <p className="font-mono text-[11px] truncate" title={lead.utm_campaign || 'direct'}>{lead.utm_campaign || 'direct'}</p>
                              </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-border/50">
                              <p className="text-[9px] text-muted-foreground uppercase">Referrer</p>
                              <p className="text-[10px] truncate" title={lead.referrer || 'Direct'}>{lead.referrer || 'Direct'}</p>
                            </div>
                          </div>
                          {lead.message && (
                            <div>
                              <span className="text-muted-foreground">Mensagem:</span>
                              <p className="mt-1 p-3 bg-muted rounded-lg text-foreground whitespace-pre-wrap">{lead.message}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-sm mb-1.5 block">Notas internas</Label>
                            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Adiciona notas sobre este lead..." className="min-h-[80px]" />
                            <Button size="sm" className="mt-2" onClick={saveNotes}>Guardar notas</Button>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="text-sm font-bold mb-2 flex items-center gap-1.5">
                              <Zap className="h-4 w-4 text-primary" /> Automação WhatsApp
                            </h4>
                            <LeadAutomationTimeline leadId={lead.id} leadName={lead.name} leadPhone={lead.phone} />
                          </div>
                        </div>
                      </DialogContent>

                    </Dialog>

                    {/* Delete */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Eliminar lead?</DialogTitle></DialogHeader>
                        <p className="text-sm text-muted-foreground">Tens a certeza que queres eliminar o lead de "{lead.name}"?</p>
                        <div className="flex justify-end gap-2 mt-4">
                          <Button variant="outline" size="sm">Cancelar</Button>
                          <Button variant="destructive" size="sm" onClick={() => deleteLead(lead.id)}>Eliminar</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <LeadTagsManager open={tagsManagerOpen} onOpenChange={setTagsManagerOpen} onChanged={fetchLeads} />
    </div>
  );
};

export default AdminLeads;
