import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Trash2, MessageSquare, Mail } from 'lucide-react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export default function AdminCampaignDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [recipients, setRecipients] = useState<any[]>([]);
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data: c } = await supabase.from('campaigns').select('*').eq('id', id!).maybeSingle();
    const { data: r } = await supabase.from('campaign_recipients').select('*').eq('campaign_id', id!).order('created_at').limit(500);
    setCampaign(c);
    setRecipients(r || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`campaign-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaigns', filter: `id=eq.${id}` }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campaign_recipients', filter: `campaign_id=eq.${id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const send = async () => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke('send-campaign', { body: { campaign_id: id } });
    setSending(false);
    if (error) toast.error(error.message);
    else toast.success(`Enviados: ${data?.sent || 0}, Falhas: ${data?.failed || 0}`);
  };

  const remove = async () => {
    if (!confirm('Eliminar campanha?')) return;
    await supabase.from('campaigns').delete().eq('id', id!);
    navigate('/admin/campanhas');
  };

  if (!campaign) return <div className="p-8">A carregar...</div>;

  const stats = campaign.stats || {};
  const canSend = campaign.status === 'draft' || campaign.status === 'scheduled' || campaign.status === 'failed';

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/campanhas')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {campaign.channel === 'whatsapp' ? <MessageSquare className="w-5 h-5 text-green-600" /> : <Mail className="w-5 h-5 text-blue-600" />}
            <h1 className="text-2xl font-bold">{campaign.name}</h1>
            <Badge variant="outline">{campaign.status}</Badge>
          </div>
        </div>
        {canSend && (
          <Button onClick={send} disabled={sending} className="bg-[#ff4000] hover:bg-[#e63900] text-white gap-2">
            <Send className="w-4 h-4" /> {sending ? 'A enviar...' : 'Enviar agora'}
          </Button>
        )}
        <Button variant="outline" onClick={remove} className="gap-2">
          <Trash2 className="w-4 h-4" /> Eliminar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Destinatários" value={campaign.total_recipients} />
        <Stat label="Enviados" value={stats.sent || 0} color="text-green-600" />
        <Stat label="Falhas" value={stats.failed || 0} color="text-red-600" />
        <Stat label="Abertos" value={stats.opened || 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Assunto</div>
          <div className="font-medium">{campaign.subject || '—'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground mb-1">Agendado</div>
          <div className="font-medium">{campaign.scheduled_at ? new Date(campaign.scheduled_at).toLocaleString('pt-PT') : 'Imediato'}</div>
        </Card>
      </div>

      <Card className="p-4 mb-6">
        <div className="text-sm text-muted-foreground mb-2">Corpo da mensagem</div>
        <pre className="whitespace-pre-wrap text-sm bg-muted/30 p-3 rounded max-h-64 overflow-auto">{campaign.body}</pre>
      </Card>

      <Card>
        <div className="p-4 border-b font-semibold">Destinatários ({recipients.length})</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Enviado</TableHead>
              <TableHead>Erro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recipients.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.contact_name || '—'}</TableCell>
                <TableCell>{r.contact_email || r.contact_phone || '—'}</TableCell>
                <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                <TableCell>{r.sent_at ? new Date(r.sent_at).toLocaleString('pt-PT') : '—'}</TableCell>
                <TableCell className="text-red-600 text-xs">{r.error || ''}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function Stat({ label, value, color = '' }: { label: string; value: number; color?: string }) {
  return (
    <Card className="p-4">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </Card>
  );
}
