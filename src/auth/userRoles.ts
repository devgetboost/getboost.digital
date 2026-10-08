/**
 * R1C4 Wave 2 — `user_roles` access against the Clean V1 contract.
 *
 * `user_roles` uses a composite primary key `(user_id, role)`, has no surrogate
 * `id` and no `created_at`, and restricts `role` to the three authoritative
 * values. RLS allows a user to read their own rows and admins to read all;
 * writes are admin-or-service-role only, so the browser can never grant itself
 * a role.
 *
 * Roles are read directly rather than through `has_role` when a *list* is
 * needed (e.g. deciding which area a user owns), because `has_role` answers
 * one question at a time.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { AUTHORITATIVE_ROLES, type AppRole } from './roles';

type UserRoleRow = Database['public']['Tables']['user_roles']['Row'];

/** Columns the application reads from `user_roles`. */
export const USER_ROLES_SELECT = 'user_id, role';
export type UserRole = Pick<UserRoleRow, 'user_id' | 'role'>;

const normalize = (rows: readonly string[] | null | undefined): string[] =>
  (rows ?? []).filter((role): role is string => typeof role === 'string');

/**
 * Reads the caller's own roles.
 *
 * Retired values (`user`, `moderator`) are dropped here rather than mapped:
 * they are not authoritative and must not authorise anything.
 */
export async function fetchOwnRoles(): Promise<AppRole[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return fetchRolesForUser(user.id);
}

/** Reads the roles granted to an explicit user id. */
export async function fetchRolesForUser(userId: string): Promise<AppRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select(USER_ROLES_SELECT)
    .eq('user_id', userId);
  if (error) throw error;

  const roles = normalize((data as UserRole[] | null)?.map((r) => r.role));
  return roles.filter((role): role is AppRole =>
    (AUTHORITATIVE_ROLES as readonly string[]).includes(role),
  );
}

/**
 * Reads every user that holds a specific role. Admin-only by RLS.
 *
 * Kept as an explicit helper because the previous ad-hoc call filtered on the
 * retired `'user'` value, which Clean V1 rejects.
 */
export async function fetchUserIdsWithRole(role: AppRole): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select(USER_ROLES_SELECT)
    .eq('role', role);
  if (error) throw error;
  return ((data as UserRole[] | null) ?? []).map((r) => r.user_id);
}

/** True when the caller holds the given authoritative role. */
export async function currentUserHasRole(role: AppRole): Promise<boolean> {
  const roles = await fetchOwnRoles();
  return roles.includes(role);
}
