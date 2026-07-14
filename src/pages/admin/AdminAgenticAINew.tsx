import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { createAgent } from '@/lib/agenticAgents';
import AgentForm from '@/components/admin/AgentForm';

export default function AdminAgenticAINew() {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <Card>
        <CardHeader><CardTitle>Novo agente</CardTitle></CardHeader>
        <CardContent>
          <AgentForm
            submitLabel="Criar agente"
            onCancel={() => navigate('/admin/agentic-ai')}
            onSubmit={async (values) => {
              try {
                const agent = await createAgent(values);
                toast({ title: 'Agente criado' });
                navigate(`/admin/agentic-ai/${agent.id}`);
              } catch (e: any) {
                toast({
                  title: 'Erro ao criar agente',
                  description: e?.message ?? 'Tenta novamente',
                  variant: 'destructive',
                });
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
