import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, MessageSquare, FileText, TrendingUp, UserCheck, Users } from 'lucide-react';

type Metrics = {
  conversations: number;
  inbound: number;
  outboundAssistant: number;
  outboundHuman: number;
  responseRate: number; // % of inbound messages that got an assistant reply
  leadsGenerated: number;
  quotesCreated: number;
  quotesFinalized: number;
  handoffs: number;
  conversionRate: number; // finalized / created
};

const RANGES = [
  { v: '1', l: 'Últimas 24h' },
  { v: '7', l: 'Últimos 7 dias' },
  { v: '30', l: 'Últimos 30 dias' },
  { v: '90', l: 'Últimos 90 dias' },
];

function Stat({ icon: Icon, label, value, hint }: { icon: any; label: string; value: string | number; hint?: string }) {
  return (
    <Card className="bg-admin-card border-admin-border">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-admin-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-admin-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-admin-foreground">{value}</div>
        {hint && <p className="text-xs text-admin-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default function WhatsAppMetrics() {
  const [days, setDays] = useState('7');
  const [loading, setLoading] = useState(true);
  const [m, setM] = useState<Metrics | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - Number(days) * 86400_000).toISOString();

      const [convRes, msgRes, leadsRes, quotesRes, handoffRes] = await Promise.all([
        supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }).gte('created_at', since),
        supabase.from('whatsapp_chat_messages').select('sender, conversation_id, created_at').gte('created_at', since).limit(10000),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('source', 'whatsapp-orcamento').gte('created_at', since),
        supabase.from('whatsapp_quotes').select('status').gte('created_at', since),
        supabase.from('whatsapp_conversations').select('id', { count: 'exact', head: true }).eq('handoff_to_human', true).gte('updated_at', since),
      ]);

      const msgs = msgRes.data || [];
      const inbound = msgs.filter(x => x.sender === 'contact').length;
      const outboundAssistant = msgs.filter(x => x.sender === 'assistant').length;
      const outboundHuman = msgs.filter(x => x.sender === 'human' || x.sender === 'nuno').length;

      // Response rate: inbound conversations that received an assistant reply after last inbound
      const byConv = new Map<string, { lastInbound?: string; assistantAfter: boolean }>();
      for (const x of msgs) {
        const entry = byConv.get(x.conversation_id) || { assistantAfter: false };
        if (x.sender === 'contact') { entry.lastInbound = x.created_at; entry.assistantAfter = false; }
        else if (x.sender === 'assistant' && entry.lastInbound && x.created_at > entry.lastInbound) entry.assistantAfter = true;
        byConv.set(x.conversation_id, entry);
      }
      const convWithInbound = [...byConv.values()].filter(e => e.lastInbound);
      const responded = convWithInbound.filter(e => e.assistantAfter).length;
      const responseRate = convWithInbound.length ? Math.round((responded / convWithInbound.length) * 100) : 0;

      const quotes = quotesRes.data || [];
      const quotesCreated = quotes.length;
      const quotesFinalized = quotes.filter(q => q.status === 'pronto').length;
      const conversionRate = quotesCreated ? Math.round((quotesFinalized / quotesCreated) * 100) : 0;

      setM({
        conversations: convRes.count || 0,
        inbound, outboundAssistant, outboundHuman,
        responseRate,
        leadsGenerated: leadsRes.count || 0,
        quotesCreated, quotesFinalized,
        handoffs: handoffRes.count || 0,
        conversionRate,
      });
      setLoading(false);
    })();
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-admin-foreground">Desempenho do Agente</h2>
          <p className="text-sm text-admin-muted-foreground">Métricas das conversas do WhatsApp e da IA</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {RANGES.map(r => <SelectItem key={r.v} value={r.v}>{r.l}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading || !m ? (
        <div className="text-sm text-admin-muted-foreground">A carregar métricas…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat icon={MessageSquare} label="Conversas" value={m.conversations} hint={`${m.inbound} msgs recebidas`} />
            <Stat icon={Bot} label="Taxa de Resposta IA" value={`${m.responseRate}%`} hint={`${m.outboundAssistant} respostas da IA`} />
            <Stat icon={Users} label="Leads Gerados" value={m.leadsGenerated} hint="via WhatsApp (orçamento)" />
            <Stat icon={FileText} label="Orçamentos Criados" value={m.quotesCreated} hint={`${m.quotesFinalized} finalizados`} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Stat icon={TrendingUp} label="Taxa de Conversão" value={`${m.conversionRate}%`} hint="orçamentos finalizados / criados" />
            <Stat icon={UserCheck} label="Escalonamentos" value={m.handoffs} hint="conversas passadas para humano" />
            <Stat icon={MessageSquare} label="Respostas Humanas" value={m.outboundHuman} hint="mensagens do Nuno" />
            <Stat icon={Bot} label="Mensagens IA" value={m.outboundAssistant} hint="enviadas pelo agente" />
          </div>
        </>
      )}
    </div>
  );
}
