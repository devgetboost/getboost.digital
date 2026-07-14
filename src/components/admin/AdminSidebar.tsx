import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Calendar,
  Users,
  FileText,
  BookOpen,
  FolderKanban,
  Briefcase,
  Mail,
  Send,
  Bot,
  MessageSquare,
  Inbox,
  Bell,
  Settings,
  ShieldCheck,
  BarChart3,
  Image as ImageIcon,
  GraduationCap,
  Mic,
  Crown,
  Building2,
  Headphones,
  Activity,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };
type Group = { label: string; items: Item[] };

const groups: Group[] = [
  {
    label: "Visão geral",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Notificações", url: "/admin/notifications", icon: Bell },
      { title: "Diagnóstico", url: "/admin/diagnostico-integracoes", icon: Activity },
    ],
  },
  {
    label: "Agenda & Reuniões",
    items: [
      { title: "Agenda", url: "/admin/agenda", icon: Calendar },
      { title: "Funil de reuniões", url: "/admin/bookings-funnel", icon: BarChart3 },
    ],
  },
  {
    label: "CRM & Leads",
    items: [
      { title: "Leads", url: "/admin/leads", icon: Users },
      { title: "Analytics de leads", url: "/admin/leads-analytics", icon: BarChart3 },
      { title: "Auditorias CRM", url: "/admin/auditorias-crm", icon: ShieldCheck },
      { title: "Validação CRM", url: "/admin/crm-validation-failures", icon: ShieldCheck },
      { title: "Entrega CRM", url: "/admin/crm-delivery-status", icon: Send },
      { title: "Routing soluções", url: "/admin/solucoes-routing", icon: FolderKanban },
      { title: "Clientes", url: "/admin/clientes", icon: Building2 },
      { title: "Investidores", url: "/admin/investidores", icon: Crown },
      { title: "VIP", url: "/admin/vip", icon: Crown },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { title: "Blog", url: "/admin/blog", icon: FileText },
      { title: "Comentários", url: "/admin/comentarios", icon: MessageSquare },
      { title: "Recursos", url: "/admin/recursos", icon: BookOpen },
      { title: "Projetos", url: "/admin/projetos", icon: FolderKanban },
      { title: "Serviços", url: "/admin/servicos", icon: Briefcase },
      { title: "Hero banners", url: "/admin/hero-banners", icon: ImageIcon },
      { title: "Academy", url: "/admin/academy", icon: GraduationCap },
      { title: "Podcast", url: "/admin/podcast", icon: Mic },
    ],
  },
  {
    label: "Email Marketing",
    items: [
      { title: "Email Marketing", url: "/admin/email-marketing", icon: Mail },
      { title: "Campanhas", url: "/admin/campanhas", icon: Send },
      { title: "Modelos", url: "/admin/campanhas/modelos", icon: FileText },
      { title: "Email Auth", url: "/admin/email-auth", icon: ShieldCheck },
    ],
  },
  {
    label: "Inbox & Atendimento",
    items: [
      { title: "Inbox", url: "/admin/inbox", icon: Inbox },
      { title: "Inbox Mail", url: "/admin/inbox-mail", icon: Mail },
      { title: "Calendário Inbox", url: "/admin/inbox-calendar", icon: Calendar },
      { title: "Atendimento", url: "/admin/atendimento", icon: Headphones },
      { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageSquare },
    ],
  },
  {
    label: "Agentic AI",
    items: [
      { title: "Agentes", url: "/admin/agentic-ai", icon: Bot },
      { title: "Prompts", url: "/admin/agentic-ai/prompts", icon: FileText },
      { title: "Monitorização", url: "/admin/agentic-ai/monitoring", icon: Activity },
      { title: "Alertas", url: "/admin/agentic-ai/alertas", icon: Bell },
      { title: "Aprovações", url: "/admin/agentic-ai/aprovacoes", icon: ShieldCheck },
      { title: "Cenários", url: "/admin/agentic-ai/cenarios", icon: FolderKanban },
      { title: "Relatório", url: "/admin/agentic-ai/relatorio", icon: BarChart3 },
      { title: "Product Knowledge", url: "/admin/agentic-ai/product-knowledge", icon: BookOpen },
      { title: "Social drafts", url: "/admin/agentic-ai/social-media-drafts", icon: FileText },
      { title: "Social publisher", url: "/admin/agentic-ai/social-media-publisher", icon: Send },
      { title: "Social accounts", url: "/admin/agentic-ai/social-media-accounts", icon: Users },
      { title: "Meta accounts", url: "/admin/agentic-ai/meta-accounts", icon: Users },
      { title: "Configurações", url: "/admin/agentic-ai/configuracoes", icon: Settings },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Definições", url: "/admin/definicoes", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();

  const isActive = (url: string) =>
    url === "/admin" ? pathname === "/admin" : pathname === url || pathname.startsWith(url + "/");

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {groups.map((group) => {
          const groupActive = group.items.some((i) => isActive(i.url));
          return (
            <SidebarGroup key={group.label} data-active={groupActive || undefined}>
              {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                        <NavLink to={item.url} end={item.url === "/admin"} className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span className="truncate">{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}

export default AdminSidebar;