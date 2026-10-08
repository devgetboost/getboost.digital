/**
 * R1C4 Wave 2 — route protection.
 *
 * Two guards, both driven by the single `AuthProvider` session boundary:
 *
 *  - `RequireAuth`      → any authenticated user holding at least one
 *                         authoritative role.
 *  - `RequireRoles`     → the session must hold one of the given roles
 *                         (default: admin).
 *
 * Behaviour on failure is deliberate and consistent:
 *  - no session            → redirect to `/login`
 *  - session, no roles     → redirect to `/login` (never a silent sign-out;
 *                            "no roles" is a provisioning problem, and signing
 *                            the user out makes it impossible to diagnose)
 *  - session, wrong role   → redirect to the user's own area when they have
 *                            one, otherwise home, with a toast
 */

import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useAuth } from './AuthProvider';
import { resolveLandingRoute, type AppRole } from './roles';

function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">A carregar…</p>
    </div>
  );
}

type RequireAuthProps = {
  children: ReactNode;
  /** Where an authenticated-but-roless user goes. Defaults to `/login`. */
  noRoleRedirect?: string;
};

export function RequireAuth({ children, noRoleRedirect = '/login' }: RequireAuthProps) {
  const { status, roles } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles.length === 0) {
    return <Navigate to={noRoleRedirect} replace />;
  }
  return <>{children}</>;
}

type RequireRolesProps = {
  children: ReactNode;
  /** Accepted roles. Holds any one of them → allowed. */
  anyOf: readonly AppRole[];
};

export function RequireRoles({ children, anyOf }: RequireRolesProps) {
  const { status, roles } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Loading />;
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles.length === 0) {
    return <Navigate to="/login" replace />;
  }

  const allowed = anyOf.some((role) => roles.includes(role));
  if (allowed) return <>{children}</>;

  const destination = resolveLandingRoute(roles);
  if (destination !== location.pathname) {
    toast.error('Acesso restrito: não tens permissão para esta área.');
    return <Navigate to={destination} replace />;
  }
  // Already on their own area: render nothing rather than loop.
  return <>{children}</>;
}

export default RequireAuth;
