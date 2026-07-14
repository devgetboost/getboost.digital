import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ADMIN_SIDEBAR_STYLE } from "@/components/admin/layout-constants";

const AdminLayout = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/login"); return; }
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: session.user.id,
        _role: "admin",
      });
      if (!isAdmin) {
        toast.error("Acesso restrito ao admin.");
        navigate("/");
        return;
      }
      setReady(true);
    })();
  }, [navigate]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  return (
    <SidebarProvider style={ADMIN_SIDEBAR_STYLE}>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <NavLink to="/admin" className="text-sm font-semibold">Admin</NavLink>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />Sair
            </Button>
          </header>
          <main className="p-4 md:p-6 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;