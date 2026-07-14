import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AdminNotification {
  id: string;
  type: 'lead' | 'booking' | 'blog';
  title: string;
  description: string;
  time: Date;
  read: boolean;
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const channel = supabase
      .channel('admin-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        const lead = payload.new as { id: string; name: string; email: string };
        const n: AdminNotification = {
          id: `lead-${lead.id}`,
          type: 'lead',
          title: 'Novo lead recebido',
          description: `${lead.name} (${lead.email})`,
          time: new Date(),
          read: false,
        };
        setNotifications((prev) => [n, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
        toast.info('Novo lead recebido', { description: lead.name });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        const booking = payload.new as { id: string; name: string; meeting_date: string; meeting_time: string };
        const n: AdminNotification = {
          id: `booking-${booking.id}`,
          type: 'booking',
          title: 'Nova reunião agendada',
          description: `${booking.name} — ${booking.meeting_date} às ${booking.meeting_time}`,
          time: new Date(),
          read: false,
        };
        setNotifications((prev) => [n, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
        toast.info('Nova reunião agendada', { description: booking.name });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'blog_posts' }, (payload) => {
        const post = payload.new as { id: string; title: string; status: string };
        if (post.status !== 'published') return;
        const n: AdminNotification = {
          id: `blog-${post.id}-${Date.now()}`,
          type: 'blog',
          title: 'Artigo publicado',
          description: post.title,
          time: new Date(),
          read: false,
        };
        setNotifications((prev) => [n, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
        toast.info('Artigo publicado', { description: post.title });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      initialized.current = false;
    };
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, markAllRead };
}
