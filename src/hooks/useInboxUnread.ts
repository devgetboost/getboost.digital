import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Tracks unread conversations in the inbox (based on unread_count column,
 * which is zeroed when the user opens a conversation — i.e. their "read
 * position"). Subscribes to realtime updates so badges stay in sync.
 */
export function useInboxUnread() {
  const [total, setTotal] = useState(0);
  const [byChannel, setByChannel] = useState<{ whatsapp: number; instagram: number; facebook: number }>({
    whatsapp: 0, instagram: 0, facebook: 0,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('unread_count, channel, archived')
        .or('archived.is.null,archived.eq.false');
      if (cancelled) return;
      const rows = (data as any[]) || [];
      const c = { whatsapp: 0, instagram: 0, facebook: 0 };
      let sum = 0;
      for (const r of rows) {
        const n = Number(r.unread_count) || 0;
        if (n <= 0) continue;
        sum += n;
        const k = (r.channel || 'whatsapp') as keyof typeof c;
        if (k in c) c[k] += n;
      }
      setTotal(sum);
      setByChannel(c);
    };

    load();
    const ch = supabase
      .channel('inbox-unread-badge')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversations' }, () => load())
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, []);

  return { total, byChannel };
}
