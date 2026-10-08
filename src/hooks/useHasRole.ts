import { useAuth } from '@/auth/hooks';
import type { AppRole } from '@/auth/roles';

/**
 * R1C4 Wave 2 — role check backed by the single auth session boundary.
 *
 * Behaviour preserved from the previous implementation: answer "does the
 * current user hold this role", expose `loading` while the session is still
 * resolving, and never authorise a user without a session.
 *
 * What changed: `AppRole` is now the authoritative Clean V1 union
 * (`admin` | `collaborator` | `client`). The retired `user` and `moderator`
 * roles are gone — they are not aliases of anything, and passing one is now a
 * compile error rather than a silent false.
 */
export type { AppRole };

export function useHasRole(role: AppRole) {
  const { status, roles } = useAuth();
  return {
    loading: status === 'loading',
    allowed: roles.includes(role),
  };
}

/** Convenience for the overwhelmingly common admin check. */
export function useIsAdmin() {
  return useHasRole('admin');
}
