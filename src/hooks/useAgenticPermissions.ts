import { useAuth } from '@/auth/hooks';

/**
 * Permissões distintas para o menu Agentic AI:
 * - canView: administrador ou colaborador autenticado — vê listas e configurações
 * - canExecute: apenas admin — cria/edita/elimina agentes, guarda settings, testa ligação, corre prompts
 *
 * R1C4: backed by the shared auth boundary so the verdict is a single read of
 * the authoritative role set, not a second `has_role` round-trip.
 */
export function useAgenticPermissions() {
  const { status, isAdmin, isCollaborator } = useAuth();
  return {
    loading: status === 'loading',
    canView: status === 'authenticated' && (isAdmin || isCollaborator),
    canExecute: status === 'authenticated' && isAdmin,
  };
}
