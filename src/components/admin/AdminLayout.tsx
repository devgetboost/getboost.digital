import { useCallback } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { ADMIN_SIDEBAR_STYLE } from "@/components/admin/layout-constants";
import { useAuth } from "@/auth/AuthProvider";

/**
 * R1C4 Wave 2 — admin area shell.
 *
 * The gate is now the shared auth boundary instead of a bespoke
 * `getSession()` + `has_role()` pair: a session without the admin role is
 * bounced to the user's own area, and a session with no roles at all goes to
 * `/login` rather than being silently signed out.
 */
const AdminLayout = () => {
  const navigate = useNavigate();
  const { status, roles, signOut } = useAuth();

  const logout = useCallback(async () => {
    await signOut();
    navigate("/login");
  }, [signOut, navigate]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">A carregar...</p>
      </div>
    );
  }

  if (!roles.includes("admin")) {
    return null;
  }

  return (
    <SidebarProvider style={ADMIN_SIDEBAR_STYLE}>
      <div className="min-h-screen flex w-full bg-white admin-scope">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="h-14 border-b border-border/40 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40 bg-white/80 backdrop-blur-xl">
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
