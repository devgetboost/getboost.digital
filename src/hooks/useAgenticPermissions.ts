import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Permissões distintas para o menu Agentic AI:
 * - canView: qualquer utilizador autenticado (admin, collaborator, client, user) — vê listas e configurações
 * - canExecute: apenas admin — cria/edita/elimina agentes, guarda settings, testa ligação, corre prompts
 */
export function useAgenticPermissions() {
  const [state, setState] = useState({ loading: true, canView: false, canExecute: false });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (active) setState({ loading: false, canView: false, canExecute: false }); return; }
      const { data, error } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      if (!active) return;
      const isAdmin = !error && !!data;
      setState({ loading: false, canView: true, canExecute: isAdmin });
    })();
    return () => { active = false; };
  }, []);

  return state;
}
