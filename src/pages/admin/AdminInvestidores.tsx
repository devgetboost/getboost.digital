import { useState } from 'react';
import { investorProjects, type InvestorProject } from '@/data/investorProjects';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
  development: { label: 'Em desenvolvimento', variant: 'secondary' },
  beta: { label: 'Beta', variant: 'outline' },
  mvp: { label: 'MVP', variant: 'default' },
  'mvp-advanced': { label: 'MVP avançado', variant: 'default' },
};

const AdminInvestidores = () => {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filtered = investorProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Investidores</h2>
          <p className="text-muted-foreground text-sm mt-1">Gestão de projetos de investimento</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Pesquisar projetos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{investorProjects.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total Projetos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {investorProjects.filter((p) => p.status === 'development').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Em Desenvolvimento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {investorProjects.filter((p) => p.status === 'beta' || p.status === 'mvp' || p.status === 'mvp-advanced').length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Beta / MVP</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary font-mono">
              {investorProjects.reduce((acc, p) => {
                const min = parseInt(p.investment.ticketMin.replace(/[^\d]/g, '')) || 0;
                return acc + min;
              }, 0).toLocaleString('pt-PT')}€
            </p>
            <p className="text-xs text-muted-foreground mt-1">Ticket Mínimo Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((project) => {
          const status = statusConfig[project.status] || { label: project.statusLabel, variant: 'secondary' as const };
          return (
            <Card key={project.slug} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${project.color} flex items-center justify-center shadow-sm`}>
                      <project.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{project.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{project.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant={status.variant} className="text-[10px]">{status.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-2">{project.tagline}</p>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-muted-foreground">Ticket mín.</p>
                    <p className="font-semibold text-foreground">{project.investment.ticketMin}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2">
                    <p className="text-muted-foreground">Pricing</p>
                    <p className="font-semibold text-foreground truncate">{project.business.pricing.split('.')[0]}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-xs"
                    onClick={() => navigate(`/investidores/${project.slug}`)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver página
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="p-12 flex flex-col items-center text-center">
            <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum projeto encontrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminInvestidores;
