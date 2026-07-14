import { FileText, BookOpen, FolderKanban, Briefcase, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

const pageInfo: Record<string, { title: string; description: string; icon: React.ElementType }> = {
  blog: { title: 'Blog', description: 'Gere os teus artigos, cria novos posts e edita conteúdos publicados.', icon: FileText },
  recursos: { title: 'Recursos', description: 'Gere os teus recursos, guias e ferramentas disponíveis para download.', icon: BookOpen },
  projetos: { title: 'Projetos', description: 'Gere o teu portfólio de projetos e casos de estudo.', icon: FolderKanban },
  servicos: { title: 'Serviços', description: 'Gere os teus serviços, preços e descrições detalhadas.', icon: Briefcase },
  leads: { title: 'Leads', description: 'Visualiza e gere os leads capturados através dos formulários do site.', icon: Users },
};

const AdminPlaceholder = ({ page }: { page: string }) => {
  const info = pageInfo[page] || { title: page, description: 'Em desenvolvimento...', icon: FileText };
  const Icon = info.icon;

  return (
    <div>
      <h2 className="text-2xl font-bold text-foreground mb-6">{info.title}</h2>
      <Card className="border-border border-dashed">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">{info.title}</h3>
          <p className="text-muted-foreground max-w-md">{info.description}</p>
          <p className="text-sm text-muted-foreground mt-4 bg-muted px-4 py-2 rounded-lg">
            🚧 Esta secção será desenvolvida em breve
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPlaceholder;
