import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MarketTabs from '@/components/admin/MarketTabs';
import {
  deleteSubscriber,
  listSubscribers,
  logAdminAction,
  SUBSCRIBER_STATUS_LABELS,
  type MarketCode,
  type SubscriberRow,
} from '@/lib/adminContent';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, Search, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

/**
 * R1C8: subscribers are Clean V1 `newsletter_subscribers` rows. The retired
 * `name`/`consent`/`consented_at` columns are gone: consent is `consent_at` and
 * the lifecycle is `subscribed|unsubscribed|bounced`. The retired table is no
 * longer read or written anywhere on this page.
 */
export default function AdminNewsletterSubscribers() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [marketFilter, setMarketFilter] = useState<MarketCode | 'all'>('all');

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async (): Promise<SubscriberRow[]> => listSubscribers(),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteSubscriber(id);
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast.success('Subscritor removido.');
      void logAdminAction('subscriber.delete', 'newsletter_subscriber', id);
    },
  });

  const filtered = subscribers.filter(
    (s) =>
      (marketFilter === 'all' || s.market === marketFilter) &&
      s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = () => {
    const csv = ['Email,Estado,Mercado,Fonte,Data'].concat(
      subscribers.map((s) => `"${s.email}","${SUBSCRIBER_STATUS_LABELS[s.status]}","${s.market}","${s.source ?? ''}","${format(new Date(s.created_at), 'dd/MM/yyyy')}"`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'subscritores-newsletter.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="border-border/30">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Subscritores da Newsletter ({subscribers.length})</CardTitle>
        <div className="flex items-center gap-2">
          <MarketTabs value={marketFilter} onChange={setMarketFilter} />
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="rounded-lg border border-border/30 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Mercado</TableHead>
                <TableHead>Fonte</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">A carregar...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Sem subscritores</TableCell></TableRow>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.email}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === 'subscribed' ? 'default' : 'secondary'} className="text-[10px]">
                        {SUBSCRIBER_STATUS_LABELS[s.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{s.market} · {s.locale}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{s.source ?? '—'}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {format(new Date(s.created_at), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMutation.mutate(s.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}