import { supabase } from '@/integrations/supabase/client';
import { fetchRolesForUser } from '@/auth/userRoles';
import type { AppRole } from '@/auth/roles';

/**
 * Server-verified admin check for Agentic AI actions.
 *
 * Even though the UI hides admin-only routes, we re-verify on every mutation
 * via `has_role`. The RPC is a SECURITY DEFINER function that reads
 * `public.user_roles` — a client can't spoof it by tampering with localStorage
 * or React state. Any non-admin call throws `AgenticForbiddenError`.
 */

export class AgenticForbiddenError extends Error {
  constructor(msg = 'Acesso negado: requer perfil admin.') {
    super(msg);
    this.name = 'AgenticForbiddenError';
  }
}

/**
 * Cache of the last verdict per user.
 *
 * R1C4: the previous single-entry cache had no invalidation on sign-out, so a
 * logout→login-as-someone-else within the TTL kept the previous verdict. It is
 * now keyed by user id and cleared by `invalidateRoleCaches()`.
 */
const cache = new Map<string, { at: number; allowed: boolean }>();
const TTL_MS = 30_000;

function readCache(key: string): boolean | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at >= TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.allowed;
}

function writeCache(key: string, allowed: boolean): boolean {
  cache.set(key, { at: Date.now(), allowed });
  return allowed;
}

/** Drops every cached role verdict. Call on sign-out and on role changes. */
export function invalidateRoleCaches(): void {
  cache.clear();
}

/** Resolves the current user id, or null when there is no session. */
async function currentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const userId = await currentUserId();
  if (!userId) return false;
  const cached = readCache(`admin:${userId}`);
  if (cached !== null) return cached;
  const roles = await fetchRolesForUser(userId).catch(() => [] as AppRole[]);
  return writeCache(`admin:${userId}`, roles.includes('admin'));
}

export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new AgenticForbiddenError();
}

export async function isReviewer(): Promise<boolean> {
  if (await isAdmin()) return true;
  const userId = await currentUserId();
  if (!userId) return false;
  const cached = readCache(`reviewer:${userId}`);
  if (cached !== null) return cached;
  const roles = await fetchRolesForUser(userId).catch(() => [] as AppRole[]);
  return writeCache(`reviewer:${userId}`, roles.includes('collaborator'));
}

export async function assertReviewer(): Promise<void> {
  if (!(await isReviewer())) throw new AgenticForbiddenError('Acesso negado: requer perfil revisor ou admin.');
}
