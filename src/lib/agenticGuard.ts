import { supabase } from '@/integrations/supabase/client';

/**
 * Server-verified admin check for Agentic AI actions.
 *
 * Even though the UI hides admin-only routes, we re-verify on every mutation
 * via the `has_role` RPC. The RPC is a SECURITY DEFINER function that reads
 * `public.user_roles` — a client can't spoof it by tampering with localStorage
 * or React state. Any non-admin call throws `AgenticForbiddenError`.
 */
export class AgenticForbiddenError extends Error {
  constructor(msg = 'Acesso negado: requer perfil admin.') {
    super(msg);
    this.name = 'AgenticForbiddenError';
  }
}

let cache: { at: number; allowed: boolean } | null = null;
const TTL_MS = 30_000;

export async function isAdmin(): Promise<boolean> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.allowed;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { cache = { at: Date.now(), allowed: false }; return false; }
  const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  const allowed = !error && !!data;
  cache = { at: Date.now(), allowed };
  return allowed;
}

export async function assertAdmin(): Promise<void> {
  if (!(await isAdmin())) throw new AgenticForbiddenError();
}

export async function isReviewer(): Promise<boolean> {
  if (await isAdmin()) return true;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'collaborator' });
  return !error && !!data;
}

export async function assertReviewer(): Promise<void> {
  if (!(await isReviewer())) throw new AgenticForbiddenError('Acesso negado: requer perfil revisor ou admin.');
}

export function invalidateAdminCache() { cache = null; }
