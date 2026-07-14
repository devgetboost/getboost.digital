import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function WhatsAppHistory() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const { data: instances = [] } = useQuery({
    queryKey: ['whatsapp-instances'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whatsapp_instances').select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['whatsapp-history', statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_messages')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { messages: data, total: count || 0 };
    },
  });

  const messages = data?.messages || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getInstanceName = (id: string) => {
    const inst = instances.find((i: any) => i.id === id);
    return inst?.name || '—';
  };

  const exportCSV = () => {
    if (messages.length === 0) return;
    const headers = ['Status', 'Destinatário', 'Telefone', 'Mensagem', 'Data'];
    const rows = messages.map((m: any) => [
      m.status,
      m.recipient_name,
      m.recipient_phone,
      `"${m.message.replace(/"/g, '""')}"`,
      m.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ m }: { m: any }) => {
    if (m.status === 'failed') {
      return <Badge variant="destructive" className="gap-1 text-xs"><XCircle className="h-3 w-3" /> Falhou</Badge>;
    }
    if (m.status === 'pending') {
      return <Badge variant="secondary" className="gap-1 text-xs"><Clock className="h-3 w-3" /> Pendente</Badge>;
    }
    // sent
    if (m.read_at) {
      return <Badge className="gap-1 text-xs bg-blue-600 hover:bg-blue-600"><CheckCircle className="h-3 w-3" /> Lida</Badge>;
    }
    if (m.delivered_at) {
      return <Badge className="gap-1 text-xs bg-emerald-600 hover:bg-emerald-600"><CheckCircle className="h-3 w-3" /> Entregue</Badge>;
    }
    return <Badge variant="default" className="gap-1 text-xs"><CheckCircle className="h-3 w-3" /> Enviada</Badge>;
  };

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Histórico de Envios</h2>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="sent">Enviados</SelectItem>
              <SelectItem value="failed">Falhados</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={exportCSV} disabled={messages.length === 0} className="gap-1">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <p className="p-6 text-sm text-muted-foreground text-center">A carregar...</p>
          ) : messages.length === 0 ? (
            <p className="p-12 text-sm text-muted-foreground text-center">Nenhuma mensagem encontrada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Status</TableHead>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Instância</TableHead>
                  <TableHead className="w-32">Enviada</TableHead>
                  <TableHead className="w-32">Entregue / Lida</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messages.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell><StatusBadge m={m} /></TableCell>
                    <TableCell className="text-sm">{m.recipient_name || '—'}</TableCell>
                    <TableCell className="text-sm font-mono">{m.recipient_phone}</TableCell>
                    <TableCell className="text-sm max-w-[200px] truncate">{m.message}</TableCell>
                    <TableCell className="text-sm">{getInstanceName(m.instance_id)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(m.created_at), "dd MMM HH:mm", { locale: pt })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {m.read_at
                        ? `Lida ${format(new Date(m.read_at), "HH:mm", { locale: pt })}`
                        : m.delivered_at
                        ? `Entregue ${format(new Date(m.delivered_at), "HH:mm", { locale: pt })}`
                        : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>



      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{total} mensagens</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage(p => p - 1)} disabled={page === 0}>Anterior</Button>
            <span className="text-sm text-muted-foreground flex items-center">{page + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>Seguinte</Button>
          </div>
        </div>
      )}
    </div>
  );
}
