/**
 * R1C4 Wave 2 — the single auth session boundary.
 *
 * Before Wave 2 every surface hand-rolled its own session check:
 * `AdminLayout` called `has_role('admin')`, `ClientLayout` read `user_roles`
 * directly, `Admin.tsx` (dead) did a third variant, `/colaborador` was
 * unguarded, and `/cliente` signed users out whenever they held no roles.
 * `onAuthStateChange` was subscribed in exactly one place.
 *
 * This provider centralises all of it:
 *  - one `getSession()` + `onAuthStateChange` subscription for the whole app,
 *  - one place where roles are read, normalised against the authoritative set,
 *  - one sign-out path that clears state before navigating,
 *  - derived flags (`isAdmin`, `isCollaborator`, `isClient`) for guards and UI.
 *
 * It reads `profiles` and `user_roles` through `./profiles` and `./userRoles`
 * so column names and primary keys are declared once.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AUTHORITATIVE_ROLES, type AppRole } from './roles';
import { fetchOwnProfile, type Profile } from './profiles';
import { fetchOwnRoles } from './userRoles';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthState {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  /** Authoritative roles only — retired values are never present. */
  roles: AppRole[];
  isAdmin: boolean;
  isCollaborator: boolean;
  isClient: boolean;
  /** True when a session exists but no authoritative role is granted. */
  hasNoRole: boolean;
}

const INITIAL_STATE: AuthState = {
  status: 'loading',
  session: null,
  profile: null,
  roles: [],
  isAdmin: false,
  isCollaborator: false,
  isClient: false,
  hasNoRole: false,
};

export interface AuthContextValue extends AuthState {
  /** Re-reads roles and profile for the current session. */
  refresh: () => Promise<void>;
  /** Signs out, clears local state and returns the post-logout route. */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveRoles(roles: readonly AppRole[]): Pick<AuthState, 'roles' | 'isAdmin' | 'isCollaborator' | 'isClient' | 'hasNoRole'> {
  return {
    roles: [...roles],
    isAdmin: roles.includes('admin'),
    isCollaborator: roles.includes('collaborator'),
    isClient: roles.includes('client'),
    hasNoRole: roles.length === 0,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);
  /** Guards against a stale async read overwriting newer state. */
  const requestId = useRef(0);

  const load = useCallback(async (session: Session | null) => {
    const id = ++requestId.current;
    if (!session) {
      setState({ ...INITIAL_STATE, status: 'anonymous', session: null });
      return;
    }

    setState((prev) => ({ ...prev, status: 'loading', session }));

    const [roles, profile] = await Promise.all([
      fetchOwnRoles().catch(() => [] as AppRole[]),
      fetchOwnProfile().catch(() => null),
    ]);
    if (id !== requestId.current) return;

    setState({
      status: 'authenticated',
      session,
      profile,
      ...deriveRoles(roles),
    });
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;
      if (error) {
        setState({ ...INITIAL_STATE, status: 'anonymous' });
        return;
      }
      await load(data.session);
    })();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      void load(session);
    });

    return () => {
      active = false;
      subscription?.subscription?.unsubscribe();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await load(data.session);
  }, [load]);

  const signOut = useCallback(async () => {
    // Clear local state first so guarded UI never renders with stale roles.
    setState({ ...INITIAL_STATE, status: 'anonymous' });
    requestId.current += 1;
    await supabase.auth.signOut();
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    await load(null);
  }, [load]);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, refresh, signOut }),
    [state, refresh, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;

/** Access the auth state. Must be called inside `<AuthProvider>`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return ctx;
}
