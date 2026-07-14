import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useHasRole, type AppRole } from '@/hooks/useHasRole';

type Props = { role?: AppRole; children: ReactNode };

export default function RequireRole({ role = 'admin', children }: Props) {
  const { loading, allowed } = useHasRole(role);

  if (loading) {
    return (
      <div className="p-8 text-sm text-muted-foreground">A verificar permissões…</div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card className="border-destructive/30">
          <CardContent className="py-10 text-center space-y-4">
            <ShieldAlert className="h-10 w-10 mx-auto text-destructive" />
            <div>
              <p className="font-semibold">Acesso restrito</p>
              <p className="text-sm text-muted-foreground">
                Precisas do perfil <code>{role}</code> para aceder a esta área.
              </p>
            </div>
            <Link to="/admin"><Button variant="outline">Voltar ao painel</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
