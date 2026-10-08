import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { legacySupabase } from '@/integrations/supabase/client';
import { Bell, Home, Briefcase, CreditCard, LifeBuoy, LogOut, User, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuth } from '@/auth/hooks';
import { avatarPathToUrl } from '@/auth/profiles';

const navItems = [
  { label: 'Dashboard', icon: Home, path: '/cliente' },
  { label: 'Serviços', icon: Briefcase, path: '/cliente/servicos' },
  { label: 'Financeiro', icon: CreditCard, path: '/cliente/financeiro' },
  { label: 'Suporte', icon: LifeBuoy, path: '/cliente/suporte' },
];

const ClientLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, roles, session, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * R1C4 Wave 2 — the gate is the shared auth boundary.
   *
   * Replaces a bespoke check that (a) read `user_roles` directly, (b) filtered
   * on the retired `'user'` role, and (c) signed users out whenever they held
   * no roles at all. Now: authenticated + at least one authoritative role is
   * required, admins are sent to their own area, and a role-less session goes
   * to `/login` without being destroyed.
   */
  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'anonymous') { navigate('/login', { replace: true }); return; }
    if (roles.length === 0) { navigate('/login', { replace: true }); return; }
    if (roles.includes('admin')) { navigate('/admin', { replace: true }); return; }
  }, [status, roles, navigate]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    void loadNotifications(userId);
  }, [session?.user?.id]);

  const loadNotifications = async (userId: string) => {
    const { data } = await legacySupabase
      .from('client_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const markAllRead = async () => {
    const { data: { session } } = await legacySupabase.auth.getSession();
    if (!session) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    for (const id of unreadIds) {
      await legacySupabase.from('client_notifications').update({ is_read: true }).eq('id', id);
    }
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const handleLogout = useCallback(async () => {
    await signOut();
    navigate('/login', { replace: true });
  }, [signOut, navigate]);

  const userName =
    profile?.display_name || session?.user?.email?.split('@')[0] || 'Cliente';
  const avatarUrl = avatarPathToUrl(profile?.avatar_path);

  const authorized = status === 'authenticated' && roles.length > 0 && !roles.includes('admin');
  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center animate-pulse shadow-lg shadow-primary/20">
            <span className="text-primary-foreground font-bold text-sm">NC</span>
          </div>
          <p className="text-sm text-muted-foreground">A carregar...</p>
        </div>
      </div>
    );
  }

  const currentLabel = navItems.find(i => location.pathname === i.path)?.label || 'Área de Cliente';

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <header className="h-16 flex items-center justify-between border-b border-border/40 px-4 md:px-6 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-muted-foreground hover:text-foreground">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-xs">NC</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">{currentLabel}</h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">Área de Cliente</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground relative">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                <h4 className="text-sm font-semibold">Notificações</h4>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline">Marcar como lidas</button>
                )}
              </div>
              <ScrollArea className="max-h-60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center"><p className="text-xs text-muted-foreground">Sem notificações</p></div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {notifications.map(n => (
                      <div key={n.id} className={cn("px-4 py-3 text-xs", !n.is_read && "bg-primary/5")}>
                        <p className="font-medium text-foreground">{n.title}</p>
                        <p className="text-muted-foreground mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="flex items-center gap-2 ml-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground">{userName}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar - desktop */}
        <aside className="hidden md:flex w-56 flex-col border-r border-border/40 min-h-[calc(100vh-4rem)] sticky top-16 p-3 gap-1">
          {navItems.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full",
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </aside>

        {/* Mobile nav overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-40 md:hidden" onClick={() => setMobileOpen(false)}>
            <div className="absolute inset-0 bg-black/50" />
            <aside className="absolute left-0 top-16 bottom-0 w-56 bg-background border-r border-border/40 p-3 flex flex-col gap-1" onClick={e => e.stopPropagation()}>
              {navItems.map(item => (
                <button
                  key={item.path}
                  onClick={() => { navigate(item.path); setMobileOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left w-full",
                    location.pathname === item.path
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              ))}
            </aside>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
