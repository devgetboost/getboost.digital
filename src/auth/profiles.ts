/**
 * R1C4 Wave 2 — profile access against the Clean V1 `public.profiles` contract.
 *
 * `profiles` is keyed on `auth.users.id` (there is no separate `user_id`
 * column) and holds only website-owned identity fields. The CRM contact block
 * (`email`, `phone`, `company`, `notes`) and the retired `avatar_url` /
 * `full_name` aliases were dropped by Clean V1; an avatar is a storage object
 * path, not a URL.
 *
 * Every access in the application goes through this module so the column names
 * and the primary key are declared exactly once.
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/** Columns the application reads from `profiles`. */
export const PROFILE_SELECT = 'id, display_name, avatar_path, preferred_market, preferred_locale';
export type Profile = Pick<ProfileRow, 'id' | 'display_name' | 'avatar_path'> &
  Partial<Pick<ProfileRow, 'preferred_market' | 'preferred_locale'>>;

/** Reads the caller's own profile. RLS restricts the result to `auth.uid() = id`. */
export async function fetchOwnProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

/** Reads profiles for an explicit set of user ids (admin surface). */
export async function fetchProfilesByIds(userIds: readonly string[]): Promise<Profile[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .in('id', [...userIds]);
  if (error) throw error;
  return (data as Profile[] | null) ?? [];
}

/**
 * Public URL for a stored avatar path.
 *
 * Storage migration is out of scope for Wave 2, so the bucket name stays
 * whatever the platform already uses; only the column semantics changed.
 */
export function avatarPathToUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  return data.publicUrl;
}
