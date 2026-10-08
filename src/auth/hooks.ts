/**
 * R1C4 Wave 2 — auth hooks and selectors.
 *
 * Kept separate from `AuthProvider.tsx` so that file exports only components
 * (React Fast Refresh requirement) and so consumers can import the hook
 * without pulling in the provider module graph.
 */

import { useAuth } from './AuthProvider';

export { useAuth };

/** Convenience selector for callers that only need the authoritative role set. */
export function useRoles(): readonly AppRole[] {
  return useAuth().roles;
}

export type {
  AuthContextValue,
  AuthState,
  AuthStatus,
} from './AuthProvider';

import type { AppRole } from './roles';
