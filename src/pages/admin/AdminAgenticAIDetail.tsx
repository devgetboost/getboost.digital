import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { getAgent, updateAgent, deleteAgent, type Agent } from '@/lib/agenticAgents';
import AgentForm from '@/components/admin/AgentForm';
import AgentTestPanel from '@/components/admin/AgentTestPanel';
import AgentCanaryCard from '@/components/admin/AgentCanaryCard';
import AgentBudgetCard from '@/components/admin/AgentBudgetCard';
import type { AgentFormValues } from '@/lib/agenticAgentSchema';

export default function AdminAgenticAIDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agent, setAgent] = useState<Agent | null>(null);

  useEffect(() => {
    if (!id) return;
    getAgent(id).then((a) => {
      if (!a) { toast({ title: 'Agente não encontrado', variant: 'destructive' }); navigate('/admin/agentic-ai'); return; }
      setAgent(a);
    }).catch(() => { toast({ title: 'Erro ao carregar', variant: 'destructive' }); navigate('/admin/agentic-ai'); });
  }, [id, navigate, toast]);

  if (!agent) return <div className="p-6">A carregar...</div>;

  const handleSave: React.ComponentProps<typeof AgentForm>['onSubmit'] = async (values, inherited) => {
    try {
      const updated = await updateAgent(agent.id, {
        name: values.name,
        description: values.description,
        systemPrompt: values.systemPrompt,
        status: values.status,
        model: inherited.model ? null : values.model,
        temperature: inherited.temperature ? null : values.temperature,
        maxTokens: inherited.maxTokens ? null : values.maxTokens,
        fastMode: inherited.fastMode ? null : values.fastMode,
      });
      if (updated) { setAgent(updated); toast({ title: 'Alterações guardadas' }); }
    } catch (e: any) {
      toast({ title: 'Erro ao guardar', description: e?.message ?? 'Tenta novamente', variant: 'destructive' });
    }
  };

  const remove = async () => {
    if (!confirm('Eliminar este agente?')) return;
    try {
      await deleteAgent(agent.id);
      toast({ title: 'Agente eliminado' });
      navigate('/admin/agentic-ai');
    } catch (e: any) {
      toast({ title: 'Erro ao eliminar', description: e?.message ?? 'Tenta novamente', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar aos agentes
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center"><Bot className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-semibold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.description || 'Sem descrição'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/admin/agentic-ai/${agent.id}/playground`} className="text-sm inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-muted">
            Playground
          </Link>
          <Link to={`/admin/agentic-ai/${agent.id}/versoes`} className="text-sm inline-flex items-center gap-1 rounded-md border px-3 py-1.5 hover:bg-muted">
            Versões
          </Link>
          <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
            {agent.status === 'active' ? 'Ativo' : 'Rascunho'}
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Configuração</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <AgentForm
            key={agent.id}
            submitLabel="Guardar"
            initialInherited={agent.inherited}
            initialValues={{
              name: agent.name,
              description: agent.description,
              provider: (agent.model.split('/')[0] as AgentFormValues['provider']) ?? 'google',
              model: agent.model as AgentFormValues['model'],
              systemPrompt: agent.systemPrompt,
              status: agent.status,
              temperature: agent.temperature,
              maxTokens: agent.maxTokens,
              fastMode: agent.fastMode,
            }}
            onSubmit={handleSave}
          />
          <div className="text-xs text-muted-foreground pt-2 border-t">
            Criado: {new Date(agent.createdAt).toLocaleString('pt-PT')} · Atualizado: {new Date(agent.updatedAt).toLocaleString('pt-PT')}
          </div>
        </CardContent>
      </Card>

      <AgentTestPanel agent={agent} />

      <AgentCanaryCard agentId={agent.id} />

      <AgentBudgetCard agentId={agent.id} />



      <div className="flex justify-end">
        <Button variant="outline" onClick={remove} className="text-destructive hover:text-destructive gap-2">
          <Trash2 className="h-4 w-4" /> Eliminar agente
        </Button>
      </div>
    </div>
  );
}
