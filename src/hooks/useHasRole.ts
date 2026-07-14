import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'user' | 'collaborator' | 'client';

export function useHasRole(role: AppRole) {
  const [state, setState] = useState<{ loading: boolean; allowed: boolean }>({ loading: true, allowed: false });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setState({ loading: false, allowed: false }); return; }
      const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: role });
      if (!active) return;
      setState({ loading: false, allowed: !error && !!data });
    })();
    return () => { active = false; };
  }, [role]);

  return state;
}
