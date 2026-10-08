/**
 * R1C4 Wave 2 — authoritative role model.
 *
 * Clean V1 (`supabase/migrations/20261008100000_clean_v1_identity.sql`) is the
 * single source of truth for role values: `public.user_roles.role` carries a
 * CHECK constraint restricted to `admin`, `collaborator`, `client`.
 *
 * The pre-2027 system used an `app_role` enum that also contained `user` and
 * `moderator`. Both are RETIRED. They are not aliases of anything: the
 * database rejects them, and every consumer of this module must treat them as
 * invalid rather than mapping them onto a Clean V1 role.
 *
 * The role *values* come from `@/config/env` so there is exactly one
 * declaration; this module adds the auth-domain semantics (where each role
 * lands, how a set of roles resolves to one landing route) on top of them.
 */

import { ROLES, type RoleCode } from '@/config/env';

/** Authoritative roles. Exactly three — no more, no less. */
export type AppRole = RoleCode;

export const AUTHORITATIVE_ROLES: readonly AppRole[] = ROLES;

/**
 * Retired legacy roles. Kept only so the migration can recognise and reject
 * them; they carry no authority and must never be sent to `has_role`.
 */
export const RETIRED_ROLES = ['user', 'moderator'] as const;
export type RetiredRole = (typeof RETIRED_ROLES)[number];

/** Type-level guard: `user` and `moderator` are not `AppRole` values. */
export type IsNotRetired<T> = T extends RetiredRole ? never : T;

export function isRetiredRole(value: unknown): value is RetiredRole {
  return typeof value === 'string' && (RETIRED_ROLES as readonly string[]).includes(value);
}

/** pt-PT labels for UI. */
export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
  client: 'Cliente',
};

/** The area each role is allowed into. Precedence: admin > collaborator > client. */
export const ROLE_HOME_ROUTE: Record<AppRole, string> = {
  admin: '/admin',
  collaborator: '/colaborador',
  client: '/cliente',
};

/** Ordered by precedence — the first match wins when a user holds several roles. */
const ROLE_PRECEDENCE: readonly AppRole[] = ['admin', 'collaborator', 'client'];

/**
 * Resolves the landing route for a set of roles.
 *
 * - `['admin']` → `/admin`
 * - `['admin', 'client']` → `/admin` (admin wins)
 * - `['collaborator']` → `/colaborador`
 * - `['client']` → `/cliente`
 * - `[]` (no roles) → `/login` (nothing is authorised)
 *
 * Retired values are ignored rather than mapped, so a leftover `'user'` row can
 * never grant access.
 */
export function resolveLandingRoute(roles: readonly string[] | null | undefined): string {
  if (!roles || roles.length === 0) return '/login';
  const normalised = roles.filter((r): r is AppRole =>
    (AUTHORITATIVE_ROLES as readonly string[]).includes(r),
  );
  if (normalised.length === 0) return '/login';
  const winner = ROLE_PRECEDENCE.find((role) => normalised.includes(role));
  return winner ? ROLE_HOME_ROUTE[winner] : '/login';
}

/** True when the role set contains at least one authoritative role. */
export function hasAnyAuthoritativeRole(roles: readonly string[] | null | undefined): boolean {
  return resolveLandingRoute(roles) !== '/login';
}
