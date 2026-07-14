import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, ChevronLeft, ChevronRight, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { listAgents, deleteAgent, type Agent } from '@/lib/agenticAgents';
import { useAgenticPermissions } from '@/hooks/useAgenticPermissions';

type StatusFilter = 'all' | 'active' | 'draft';
type SortKey = 'updated_desc' | 'updated_asc' | 'name_asc' | 'name_desc' | 'status';
const PAGE_SIZE = 9;

const SORT_LABELS: Record<SortKey, string> = {
  updated_desc: 'Atualização (recente)',
  updated_asc: 'Atualização (antigo)',
  name_asc: 'Nome (A–Z)',
  name_desc: 'Nome (Z–A)',
  status: 'Estado (ativos primeiro)',
};

export default function AdminAgenticAI() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canExecute } = useAgenticPermissions();

  useEffect(() => { listAgents().then(setAgents).catch(() => setAgents([])); }, []);
  useEffect(() => { setPage(1); }, [q, status]);

  const [sort, setSort] = useState<SortKey>('updated_desc');

  useEffect(() => { listAgents().then(setAgents).catch(() => setAgents([])); }, []);
  useEffect(() => { setPage(1); }, [q, status, sort]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = agents.filter(a => {
      if (status !== 'all' && a.status !== status) return false;
      if (!needle) return true;
      return (
        a.name.toLowerCase().includes(needle) ||
        a.description.toLowerCase().includes(needle) ||
        a.model.toLowerCase().includes(needle)
      );
    });
    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case 'name_asc': return a.name.localeCompare(b.name, 'pt');
        case 'name_desc': return b.name.localeCompare(a.name, 'pt');
        case 'status': {
          const rank = (s: string) => (s === 'active' ? 0 : 1);
          const d = rank(a.status) - rank(b.status);
          return d !== 0 ? d : a.name.localeCompare(b.name, 'pt');
        }
        case 'updated_asc': return a.updatedAt.localeCompare(b.updatedAt);
        case 'updated_desc':
        default: return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
    return sorted;
  }, [agents, q, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este agente?')) return;
    try {
      await deleteAgent(id);
      setAgents(await listAgents());
      toast({ title: 'Agente eliminado' });
    } catch (e: any) {
      toast({ title: 'Acesso negado', description: e?.message ?? 'Requer admin', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2"><Bot className="h-6 w-6" /> Agentic AI</h1>
          <p className="text-sm text-muted-foreground">Os teus agentes de IA — cria, gere e monitoriza.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate('/admin/agentic-ai/cenarios')} className="gap-2">
            Cenários
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/agentic-ai/cenarios/runs')} className="gap-2">
            Runs diários
          </Button>
          <Button variant="outline" onClick={() => navigate('/admin/agentic-ai/monitoring')} className="gap-2">
            Monitorização
          </Button>
          {canExecute && (
            <Button onClick={() => navigate('/admin/agentic-ai/novo')} className="gap-2">
              <Plus className="h-4 w-4" /> Novo agente
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar por nome, descrição ou modelo..." className="pl-9" />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="draft">Rascunhos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
              <SelectItem key={k} value={k}>{SORT_LABELS[k]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground ml-auto">
          {filtered.length} {filtered.length === 1 ? 'agente' : 'agentes'}
        </p>
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-4">
            <Sparkles className="h-10 w-10 mx-auto text-muted-foreground" />
            <div>
              <p className="font-medium">{agents.length === 0 ? 'Ainda não tens agentes' : 'Sem resultados'}</p>
              <p className="text-sm text-muted-foreground">
                {agents.length === 0 ? 'Cria o teu primeiro agente para começar.' : 'Ajusta a pesquisa ou o filtro de estado.'}
              </p>
            </div>
            {agents.length === 0 && canExecute && (
              <Button onClick={() => navigate('/admin/agentic-ai/novo')} className="gap-2">
                <Plus className="h-4 w-4" /> Criar agente
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map(agent => (
              <Card key={agent.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 truncate">
                        <Bot className="h-4 w-4 shrink-0" /> {agent.name}
                      </CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{agent.description || 'Sem descrição'}</CardDescription>
                    </div>
                    <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                      {agent.status === 'active' ? 'Ativo' : 'Rascunho'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{agent.model}</span>
                  <div className="flex gap-2">
                    {canExecute && (
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(agent.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Link to={`/admin/agentic-ai/${agent.id}`}>
                      <Button variant="outline" size="sm">Ver detalhes</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="gap-1">
                  <ChevronLeft className="h-4 w-4" /> Anterior
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="gap-1">
                  Próxima <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
