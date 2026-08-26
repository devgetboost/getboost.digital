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

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type RailCategory = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  groups: NavGroup[];
};

export const ADMIN_NAV: RailCategory[] = [
  {
    id: "overview",
    label: "Geral",
    icon: LayoutDashboard,
    groups: [
      {
        label: "Visão Geral",
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
    ],
  },
  {
    id: "crm",
    label: "CRM",
    icon: Users,
    groups: [
      {
        label: "Gestão de Leads",
        items: [
          { title: "Leads", url: "/admin/leads", icon: Users },
          { title: "Analytics", url: "/admin/leads-analytics", icon: BarChart3 },
          { title: "Auditorias", url: "/admin/auditorias-crm", icon: ShieldCheck },
          { title: "Validação", url: "/admin/crm-validation-failures", icon: ShieldCheck },
          { title: "Entrega CRM", url: "/admin/crm-delivery-status", icon: Send },
        ],
      },
      {
        label: "Clientes & VIP",
        items: [
          { title: "Clientes", url: "/admin/clientes", icon: Building2 },
          { title: "Investidores", url: "/admin/investidores", icon: Crown },
          { title: "VIP", url: "/admin/vip", icon: Crown },
          { title: "Routing", url: "/admin/solucoes-routing", icon: FolderKanban },
        ],
      },
    ],
  },
  {
    id: "content",
    label: "Conteúdo",
    icon: FileText,
    groups: [
      {
        label: "Editorial",
        items: [
          { title: "Blog", url: "/admin/blog", icon: FileText },
          { title: "Comentários", url: "/admin/comentarios", icon: MessageSquare },
          { title: "Recursos", url: "/admin/recursos", icon: BookOpen },
        ],
      },
      {
        label: "Portfólio & Academy",
        items: [
          { title: "Projetos", url: "/admin/projetos", icon: FolderKanban },
          { title: "Serviços", url: "/admin/servicos", icon: Briefcase },
          { title: "Hero Banners", url: "/admin/hero-banners", icon: ImageIcon },
          { title: "Academy", url: "/admin/academy", icon: GraduationCap },
          { title: "Podcast", url: "/admin/podcast", icon: Mic },
        ],
      },
    ],
  },
  {
    id: "communication",
    label: "Comunicação",
    icon: Mail,
    groups: [
      {
        label: "Inbox Omnichannel",
        items: [
          { title: "Inbox Social", url: "/admin/inbox", icon: Inbox },
          { title: "Inbox Mail", url: "/admin/inbox-mail", icon: Mail },
          { title: "Calendário Inbox", url: "/admin/inbox-calendar", icon: Calendar },
          { title: "Atendimento", url: "/admin/atendimento", icon: Headphones },
          { title: "WhatsApp", url: "/admin/whatsapp", icon: MessageSquare },
        ],
      },
      {
        label: "Marketing",
        items: [
          { title: "Email Marketing", url: "/admin/email-marketing", icon: Mail },
          { title: "Campanhas", url: "/admin/campanhas", icon: Send },
          { title: "Modelos", url: "/admin/campanhas/modelos", icon: FileText },
          { title: "Email Auth", url: "/admin/email-auth", icon: ShieldCheck },
        ],
      },
    ],
  },
  {
    id: "ai",
    label: "Agentic AI",
    icon: Bot,
    groups: [
      {
        label: "Core AI",
        items: [
          { title: "Agentes", url: "/admin/agentic-ai", icon: Bot },
          { title: "Prompts", url: "/admin/agentic-ai/prompts", icon: FileText },
          { title: "Monitorização", url: "/admin/agentic-ai/monitoring", icon: Activity },
          { title: "Alertas", url: "/admin/agentic-ai/alertas", icon: Bell },
        ],
      },
      {
        label: "Automações",
        items: [
          { title: "Cenários", url: "/admin/agentic-ai/cenarios", icon: FolderKanban },
          { title: "Product Knowledge", url: "/admin/agentic-ai/product-knowledge", icon: BookOpen },
          { title: "Aprovações", url: "/admin/agentic-ai/aprovacoes", icon: ShieldCheck },
          { title: "Relatórios", url: "/admin/agentic-ai/relatorio", icon: BarChart3 },
        ],
      },
      {
        label: "Social AI",
        items: [
          { title: "Social Drafts", url: "/admin/agentic-ai/social-media-drafts", icon: FileText },
          { title: "Social Publisher", url: "/admin/agentic-ai/social-media-publisher", icon: Send },
          { title: "Social Accounts", url: "/admin/agentic-ai/social-media-accounts", icon: Users },
          { title: "Meta Accounts", url: "/admin/agentic-ai/meta-accounts", icon: Users },
          { title: "Configurações", url: "/admin/agentic-ai/configuracoes", icon: Settings },
        ],
      },
    ],
  },
  {
    id: "settings",
    label: "Sistema",
    icon: Settings,
    groups: [
      {
        label: "Configurações",
        items: [
          { title: "Definições", url: "/admin/definicoes", icon: Settings },
        ],
      },
    ],
  },
];
