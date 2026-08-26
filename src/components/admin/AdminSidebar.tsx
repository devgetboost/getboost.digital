import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Search, X, ChevronRight } from "lucide-react";
import { ADMIN_NAV, RailCategory } from "./adminNav";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sidebar,
  SidebarContent,
  useSidebar,
} from "@/components/ui/sidebar";

export function AdminSidebar() {
  const { pathname } = useLocation();
  const { setOpen, open } = useSidebar();
  const [searchQuery, setSearchQuery] = useState("");

  // Determine which rail category is active based on the current URL
  const activeRailId = useMemo(() => {
    for (const cat of ADMIN_NAV) {
      for (const group of cat.groups) {
        if (group.items.some(item => 
          item.url === "/admin" ? pathname === "/admin" : pathname.startsWith(item.url)
        )) {
          return cat.id;
        }
      }
    }
    return "overview"; // Default
  }, [pathname]);

  const [selectedRailId, setSelectedRailId] = useState<string>(activeRailId);

  // Sync selected rail with active rail on navigation, 
  // but only if the user hasn't manually switched rail recently
  useEffect(() => {
    setSelectedRailId(activeRailId);
  }, [activeRailId]);

  const selectedCategory = useMemo(() => 
    ADMIN_NAV.find(c => c.id === selectedRailId) || ADMIN_NAV[0],
  [selectedRailId]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return selectedCategory.groups;
    
    const query = searchQuery.toLowerCase();
    return selectedCategory.groups.map(group => ({
      ...group,
      items: group.items.filter(item => 
        item.title.toLowerCase().includes(query) || 
        group.label.toLowerCase().includes(query)
      )
    })).filter(group => group.items.length > 0);
  }, [selectedCategory, searchQuery]);

  const isActive = (url: string) =>
    url === "/admin" ? pathname === "/admin" : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="none" className="border-r-0 flex-row w-[var(--sidebar-width)] overflow-hidden bg-background">
      {/* 1. ICON RAIL (Left) */}
      <div className="w-14 flex flex-col items-center py-4 gap-4 border-r border-border/40 bg-background shrink-0 z-20">
        {ADMIN_NAV.map((cat) => {
          const isCurrentActive = activeRailId === cat.id;
          const isSelected = selectedRailId === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedRailId(cat.id);
                if (!open) setOpen(true);
              }}
              className={cn(
                "w-10 h-10 flex items-center justify-center rounded-lg transition-all relative group",
                isSelected 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              title={cat.label}
            >
              <cat.icon className="h-5 w-5" />
              {isCurrentActive && (
                <div className="absolute left-0 w-0.5 h-6 bg-primary rounded-r-full" />
              )}
              
              {/* Tooltip on hover if sidebar is collapsed (though rail is always visible) */}
              <div className="absolute left-14 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                {cat.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* 2. CONTEXTUAL SUBPANEL (Right) */}
      <div className={cn(
        "flex-1 flex flex-col bg-background/50 backdrop-blur-sm border-r border-border/40 transition-all duration-300",
        !open ? "w-0 opacity-0 invisible" : "w-56 opacity-100 visible"
      )}>
        <div className="p-4 flex flex-col gap-4 shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground tracking-tight px-1">
              {selectedCategory.label}
            </h2>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              className="h-8 pl-8 text-xs bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1 px-2 pb-4">
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <div key={group.label} className="space-y-1">
                <h3 className="px-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const active = isActive(item.url);
                    return (
                      <NavLink
                        key={item.url}
                        to={item.url}
                        end={item.url === "/admin"}
                        className={({ isActive: linkActive }) => cn(
                          "group flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors relative",
                          active
                            ? "bg-primary/5 text-primary font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.icon && <item.icon className={cn(
                            "h-4 w-4 shrink-0 transition-colors",
                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                          )} />}
                          <span className="truncate">{item.title}</span>
                        </div>
                        {active && (
                          <div className="absolute left-0 top-1.5 bottom-1.5 w-[3px] bg-primary rounded-r-full" />
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
            
            {filteredGroups.length === 0 && searchQuery && (
              <div className="px-3 py-8 text-center">
                <p className="text-xs text-muted-foreground">Nenhum resultado encontrado.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Sidebar>
  );
}

export default AdminSidebar;
