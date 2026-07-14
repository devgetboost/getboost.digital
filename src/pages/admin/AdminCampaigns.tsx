import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Plus, Search, Filter, MoreHorizontal, Megaphone, MessageSquare, Mail } from 'lucide-react';
import { toast } from 'sonner';

type Campaign = {
  id: string;
  name: string;
  channel: 'whatsapp' | 'email';
  status: string;
  scheduled_at: string | null;
  sent_at: string | null;
  total_recipients: number;
  stats: { sent?: number; opened?: number; delivered?: number; failed?: number };
  created_at: string;
};

const statusStyles: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground border-border',
  scheduled: 'bg-orange-100 text-orange-700 border-orange-200',
  sending: 'bg-blue-100 text-blue-700 border-blue-200',
  sent: 'bg-green-100 text-green-700 border-green-200',
  failed: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  draft: 'Rascunho', scheduled: 'Agendada', sending: 'A enviar',
  sent: 'Enviada', failed: 'Falhou', cancelled: 'Cancelada',
};

export default function AdminCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error(error.message);
    setCampaigns((data as Campaign[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel('campaigns-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = campaigns.filter((c) => {
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const remove = async (id: string) => {
    if (!confirm('Eliminar esta campanha?')) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) toast.error(error.message); else { toast.success('Campanha eliminada'); load(); }
  };

  const duplicate = async (c: Campaign) => {
    const { data: full } = await supabase.from('campaigns').select('*').eq('id', c.id).maybeSingle();
    if (!full) return;
    const { id, created_at, updated_at, sent_at, stats, total_recipients, status, ...rest } = full as any;
    const { data: newC, error } = await supabase.from('campaigns').insert({
      ...rest, name: `${rest.name} (cópia)`, status: 'draft',
    }).select().single();
    if (error) toast.error(error.message);
    else { toast.success('Campanha duplicada'); navigate(`/admin/campanhas/${newC.id}`); }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-[#ff4000]" /> Campanhas
          </h1>
          <p className="text-muted-foreground mt-1">Gere e envia campanhas de WhatsApp e Email</p>
        </div>
        <Button onClick={() => navigate('/admin/campanhas/nova')} className="bg-[#ff4000] hover:bg-[#e63900] text-white gap-2">
          <Plus className="w-4 h-4" /> Nova Campanha
        </Button>
      </div>

      <Card className="p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Procurar campanhas..." className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-52">
            <div className="flex items-center gap-2"><Filter className="w-4 h-4" /><SelectValue /></div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Data agendada</TableHead>
              <TableHead>Destinatários</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">A carregar...</TableCell></TableRow>
            )}
            {!loading && filtered.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                Ainda não há campanhas. Clica em "Nova Campanha" para começar.
              </TableCell></TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id} className="cursor-pointer" onClick={() => navigate(`/admin/campanhas/${c.id}`)}>
                <TableCell className="font-medium text-[#ff4000]">{c.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {c.channel === 'whatsapp' ? <MessageSquare className="w-4 h-4 text-green-600" /> : <Mail className="w-4 h-4 text-blue-600" />}
                    <span className="capitalize">{c.channel}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={statusStyles[c.status]}>{statusLabels[c.status] || c.status}</Badge>
                </TableCell>
                <TableCell>{c.scheduled_at ? new Date(c.scheduled_at).toLocaleString('pt-PT') : '—'}</TableCell>
                <TableCell>{c.total_recipients}</TableCell>
                <TableCell className="text-sm">
                  {c.stats?.sent
                    ? <>Enviados: {c.stats.sent}<br />Falhas: {c.stats.failed || 0}</>
                    : '—'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/admin/campanhas/${c.id}`)}>Ver detalhes</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => duplicate(c)}>Duplicar</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => remove(c.id)}>Eliminar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <div className="text-sm text-muted-foreground mt-4">
        {filtered.length} de {campaigns.length} campanhas
      </div>
    </div>
  );
}
