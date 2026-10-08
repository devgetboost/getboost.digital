import { ReactNode } from 'react';
import { useAuth } from '@/auth/hooks';
import type { AppRole } from '@/auth/roles';

/**
 * R1C4 Wave 2 — Agentic AI "view" gate.
 *
 * Previously this delegated to `RequireRole role="admin"`, which contradicted
 * `useAgenticPermissions` (any authenticated user may view, only admin may
 * execute) and blocked collaborators from the approvals screen that already
 * computes their review capability.
 *
 * Now the gate states its own rule: viewing requires admin **or**
 * collaborator. Execution continues to be guarded separately, per action.
 */
export default function RequireAgenticView({ children }: { children: ReactNode }) {
  const { status, roles } = useAuth();

  if (status === 'loading') {
    return <div className="p-8 text-sm text-muted-foreground">A verificar permissões…</div>;
  }

  const allowed = roles.some((role): role is AppRole => role === 'admin' || role === 'collaborator');
  if (!allowed) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <p className="text-sm text-muted-foreground">
          Acesso restrito: esta área é para administradores e colaboradores.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
