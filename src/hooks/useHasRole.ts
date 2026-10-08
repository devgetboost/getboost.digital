import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toHasRoleArg } from '@/integrations/supabase/legacy-compat';

export type AppRole = 'admin' | 'user' | 'collaborator' | 'client';

export function useHasRole(role: AppRole) {
  const [state, setState] = useState<{ loading: boolean; allowed: boolean }>({ loading: true, allowed: false });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setState({ loading: false, allowed: false }); return; }
// R1C3: the legacy `AppRole` union still contains the retired `'user'` role.
// The value is forwarded unchanged; only the declared type is widened back to
// the authoritative Clean V1 signature (see legacy-compat.ts).
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: toHasRoleArg(role),
      });
      if (!active) return;
      setState({ loading: false, allowed: !error && !!data });
    })();
    return () => { active = false; };
  }, [role]);

  return state;
}
