import { useEffect, useRef, useState } from 'react';
import { Send, Play, RefreshCw, AlertTriangle, CheckCircle2, XCircle, User, Bot, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

type Role = 'user' | 'assistant';
type Checks = {
  sentenceCount: number;
  withinSentenceLimit: boolean;
  handoffDetected: string | null;
  handoffTriggered: boolean;
  meetingOfferPresent: boolean;
  lang: string;
  charCount: number;
};
type Msg = { role: Role; content: string; checks?: Checks; source?: string };

const SCENARIOS: { label: string; message: string; expectHandoff?: string }[] = [
  { label: 'Saudação inicial', message: 'Olá, boa tarde 👋' },
  { label: 'Pedido de preço', message: 'Quanto custa uma landing page premium?' },
  { label: 'Discovery — SaaS', message: 'Preciso de um SaaS para gerir clínicas dentárias.' },
  { label: 'Urgência (deve escalar)', message: 'Isto é urgente!!! preciso já de resposta', expectHandoff: 'urgency' },
  { label: 'Falar com humano', message: 'Quero falar com o Nuno agora, por favor', expectHandoff: 'human_request' },
  { label: 'Reclamação', message: 'Quero um reembolso, vou chamar o meu advogado', expectHandoff: 'complaint_legal' },
];

export default function WhatsAppConciergeSimulator() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [expectedHandoff, setExpectedHandoff] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text: string, expect?: string | null) => {
    const clean = text.trim();
    if (!clean || busy) return;
    setBusy(true);
    setExpectedHandoff(expect ?? null);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    const next: Msg[] = [...messages, { role: 'user', content: clean }];
    setMessages(next);
    setInput('');
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-concierge-simulate', {
        body: { message: clean, history },
      });
      if (error) throw new Error(error.message);
      if (!data?.ok) throw new Error(data?.error ?? 'Erro no simulador');
      setMessages([...next, { role: 'assistant', content: data.reply, checks: data.checks, source: data.source }]);
    } catch (e: any) {
      toast({ title: 'Falha na simulação', description: e?.message ?? 'Erro', variant: 'destructive' });
      setMessages(next);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setMessages([]); setExpectedHandoff(null); };

  const totals = messages.reduce(
    (acc, m) => {
      if (m.role !== 'assistant' || !m.checks) return acc;
      acc.total++;
      if (m.checks.withinSentenceLimit) acc.sentenceOk++;
      if (m.checks.handoffTriggered) acc.handoff++;
      return acc;
    },
    { total: 0, sentenceOk: 0, handoff: 0 },
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Simulador de conversa</CardTitle>
            <CardDescription>
              Dry-run: usa a mesma deteção de handoff e o system prompt do agente WhatsApp Concierge.
              Nada é enviado, guardado ou persistido em conversas reais.
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={reset} disabled={busy || messages.length === 0}>
            <RefreshCw className="h-4 w-4 mr-1" /> Limpar
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map(s => (
              <Button
                key={s.label}
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => send(s.message, s.expectHandoff ?? null)}
                className="gap-1"
              >
                <Play className="h-3 w-3" /> {s.label}
              </Button>
            ))}
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 min-h-[320px] max-h-[520px] overflow-y-auto space-y-3">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-10">
                Escreve uma mensagem ou escolhe um cenário para começar.
              </p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'assistant' && <Bot className="h-5 w-5 text-primary shrink-0 mt-1" />}
                <div className={`max-w-[80%] ${m.role === 'user' ? 'order-1' : ''}`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'
                    }`}
                  >
                    {m.content}
                  </div>
                  {m.role === 'assistant' && m.checks && (
                    <ChecksRow checks={m.checks} source={m.source} expected={expectedHandoff} isLast={i === messages.length - 1} />
                  )}
                </div>
                {m.role === 'user' && <User className="h-5 w-5 text-muted-foreground shrink-0 mt-1 order-2" />}
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> A gerar resposta…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escreve como se fosses o cliente no WhatsApp…"
              rows={2}
              disabled={busy}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
              }}
            />
            <Button onClick={() => send(input)} disabled={busy || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {totals.total > 0 && (
            <div className="text-xs text-muted-foreground flex flex-wrap gap-3 pt-1 border-t">
              <span>Respostas do bot: <b>{totals.total}</b></span>
              <span>≤ 3 frases: <b>{totals.sentenceOk}/{totals.total}</b></span>
              <span>Handoffs disparados: <b>{totals.handoff}</b></span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ChecksRow({
  checks, source, expected, isLast,
}: { checks: Checks; source?: string; expected: string | null; isLast: boolean }) {
  const sentenceOk = checks.withinSentenceLimit;
  const expectedMet = !isLast || !expected ? true : checks.handoffDetected === expected;
  return (
    <div className="mt-1 flex flex-wrap gap-1.5 items-center">
      <Badge variant={sentenceOk ? 'secondary' : 'destructive'} className="gap-1">
        {sentenceOk ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
        {checks.sentenceCount} frase{checks.sentenceCount === 1 ? '' : 's'}
      </Badge>
      {checks.handoffTriggered && (
        <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-500">
          <AlertTriangle className="h-3 w-3" /> Handoff: {checks.handoffDetected}
        </Badge>
      )}
      {checks.meetingOfferPresent && <Badge variant="outline">Reunião</Badge>}
      <Badge variant="outline">{checks.lang.toUpperCase()}</Badge>
      <Badge variant="outline">{checks.charCount} car.</Badge>
      {source === 'ai' && <Badge variant="outline">IA</Badge>}
      {source === 'handoff_canned' && <Badge variant="outline">Canned</Badge>}
      {isLast && expected && (
        <Badge variant={expectedMet ? 'secondary' : 'destructive'} className="gap-1">
          {expectedMet ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          Esperado: {expected}
        </Badge>
      )}
    </div>
  );
}
