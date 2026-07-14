import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Activity, Timer, DollarSign, AlertTriangle, Hash, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type Row = {
  id: string;
  agent_id: string | null;
  version_id: string | null;
  run_id: string;
  status: string;
  model: string | null;
  started_at: string;
  finished_at: string | null;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  cost_credits: number | null;
  error_type: string | null;
  error_message: string | null;
  output_preview: string | null;
  input_hash: string | null;
  metadata: any;
  created_at: string;
};

type Handoff = {
  id: string;
  status: string | null;
  category: string | null;
  sla_due_at: string | null;
  first_human_reply_at: string | null;
  created_at: string;
};

export default function AdminAgenticRunDetail() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [agentName, setAgentName] = useState<string>('—');
  const [versionLabel, setVersionLabel] = useState<string>('—');
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('agentic_run_logs').select('*').eq('id', id).maybeSingle();
      if (error) { setError(error.message); setLoading(false); return; }
      if (!data) { setError('Execução não encontrada.'); setLoading(false); return; }
      setRow(data as Row);

      const meta = data.metadata && typeof data.metadata === 'object' ? (data.metadata as any) : null;
      const handoffId: string | null = meta?.handoff_id ?? null;
      const conversationId: string | null = meta?.conversation_id ?? null;
      const [agentRes, versionRes, handoffRes] = await Promise.all([
        data.agent_id ? supabase.from('agentic_agents').select('name').eq('id', data.agent_id).maybeSingle() : Promise.resolve({ data: null }),
        data.version_id ? supabase.from('agentic_agent_versions').select('version,status').eq('id', data.version_id).maybeSingle() : Promise.resolve({ data: null }),
        handoffId
          ? supabase.from('whatsapp_handoffs').select('id,status,category,sla_due_at,first_human_reply_at,created_at').eq('id', handoffId).maybeSingle()
          : conversationId
            ? supabase.from('whatsapp_handoffs').select('id,status,category,sla_due_at,first_human_reply_at,created_at').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(1).maybeSingle()
            : Promise.resolve({ data: null }),
      ]);
      if (agentRes.data) setAgentName((agentRes.data as any).name);
      if (versionRes.data) setVersionLabel(`v${(versionRes.data as any).version} (${(versionRes.data as any).status})`);
      if ((handoffRes as any).data) setHandoff((handoffRes as any).data as Handoff);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">A carregar…</div>;
  if (error || !row) return <div className="p-6"><Alert variant="destructive"><AlertTitle>Erro</AlertTitle><AlertDescription>{error ?? 'Sem dados.'}</AlertDescription></Alert></div>;

  const totalTokens = (row.input_tokens ?? 0) + (row.output_tokens ?? 0);
  const meta: any = row.metadata && typeof row.metadata === 'object' ? row.metadata : null;
  const inputPreview = meta?.input_preview ?? meta?.input ?? null;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin/agentic-ai/monitoring"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar à monitorização</Link>
          </Button>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Activity className="h-6 w-6" /> Execução {row.run_id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            {agentName} · {versionLabel} · {new Date(row.started_at).toLocaleString('pt-PT')}
          </p>
        </div>
        <Badge variant={row.status === 'success' ? 'secondary' : 'destructive'}>{row.status}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<Timer className="h-4 w-4" />} label="Latência" value={`${row.latency_ms ?? '—'} ms`} />
        <Stat icon={<DollarSign className="h-4 w-4" />} label="Custo (créditos)" value={(row.cost_credits ?? 0).toFixed(4)} />
        <Stat icon={<Hash className="h-4 w-4" />} label="Tokens (in/out)" value={`${row.input_tokens ?? 0} / ${row.output_tokens ?? 0}`} sub={`${totalTokens} total`} />
        <Stat icon={<Activity className="h-4 w-4" />} label="Modelo" value={row.model ?? '—'} />
      </div>

      {row.status !== 'success' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>{row.error_type ?? 'Erro'}</AlertTitle>
          <AlertDescription className="whitespace-pre-wrap text-sm">
            {row.error_message ?? 'Sem detalhe.'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Input</CardTitle></CardHeader>
          <CardContent>
            {inputPreview ? (
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-80 whitespace-pre-wrap">{typeof inputPreview === 'string' ? inputPreview : JSON.stringify(inputPreview, null, 2)}</pre>
            ) : (
              <p className="text-xs text-muted-foreground">Input não guardado (apenas hash: <code className="text-[10px]">{row.input_hash?.slice(0, 16) ?? '—'}…</code>)</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Output (preview)</CardTitle></CardHeader>
          <CardContent>
            {row.output_preview ? (
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-80 whitespace-pre-wrap">{row.output_preview}</pre>
            ) : (
              <p className="text-xs text-muted-foreground">Sem output guardado.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Handoff WhatsApp</CardTitle></CardHeader>
        <CardContent>
          {handoff ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div><div className="text-xs text-muted-foreground">Estado</div><Badge variant={handoff.status === 'resolved' ? 'secondary' : 'outline'}>{handoff.status ?? '—'}</Badge></div>
              <div><div className="text-xs text-muted-foreground">Categoria</div><div>{handoff.category ?? '—'}</div></div>
              <div><div className="text-xs text-muted-foreground">SLA até</div><div>{handoff.sla_due_at ? new Date(handoff.sla_due_at).toLocaleString('pt-PT') : '—'}</div></div>
              <div><div className="text-xs text-muted-foreground">1ª resposta humana</div><div>{handoff.first_human_reply_at ? new Date(handoff.first_human_reply_at).toLocaleString('pt-PT') : '—'}</div></div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">Sem handoff associado a este run_id.</p>
          )}
        </CardContent>
      </Card>

      {meta && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Metadata</CardTitle></CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-80">{JSON.stringify(meta, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: React.ReactNode; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">{icon} {label}</div>
        <div className="text-xl font-semibold mt-1">{value}</div>
        {sub && <div className="text-[10px] text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}
