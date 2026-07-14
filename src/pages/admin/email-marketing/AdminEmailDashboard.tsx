import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBrevoAccount, useBrevoEmailStats, useBrevoLists, useBrevoCampaigns } from "@/hooks/useBrevo";
import { Users, Send, MailOpen, MousePointerClick, AlertTriangle, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminEmailDashboard() {
  const { data: account, isLoading: loadingAccount } = useBrevoAccount();
  const { data: stats, isLoading: loadingStats } = useBrevoEmailStats();
  const { data: lists, isLoading: loadingLists } = useBrevoLists(50, 0);
  const { data: campaigns, isLoading: loadingCampaigns } = useBrevoCampaigns(10, 0);

  const plan = account?.plan?.[0];
  const totalContacts = lists?.lists?.reduce((sum: number, l: any) => sum + (l.totalSubscribers || 0), 0) || 0;
  const totalLists = lists?.count || 0;
  const totalCampaigns = campaigns?.count || 0;

  const openRate = stats?.requests
    ? ((stats.uniqueOpens || 0) / stats.requests * 100).toFixed(1)
    : "0";
  const clickRate = stats?.requests
    ? ((stats.uniqueClicks || 0) / stats.requests * 100).toFixed(1)
    : "0";
  const bounceRate = stats?.requests
    ? (((stats.hardBounces || 0) + (stats.softBounces || 0)) / stats.requests * 100).toFixed(1)
    : "0";

  const isLoading = loadingAccount || loadingStats || loadingLists || loadingCampaigns;

  const statCards = [
    { label: "Total de Contactos", value: totalContacts, icon: Users, color: "text-blue-500" },
    { label: "Listas", value: totalLists, icon: Users, color: "text-indigo-500" },
    { label: "Campanhas", value: totalCampaigns, icon: Send, color: "text-green-500" },
    { label: "Emails Enviados", value: stats?.requests || 0, icon: Send, color: "text-primary" },
    { label: "Taxa de Abertura", value: `${openRate}%`, icon: MailOpen, color: "text-emerald-500" },
    { label: "Taxa de Cliques", value: `${clickRate}%`, icon: MousePointerClick, color: "text-orange-500" },
    { label: "Taxa de Rejeição", value: `${bounceRate}%`, icon: AlertTriangle, color: "text-red-500" },
    { label: "Plano Brevo", value: plan?.type || "N/A", icon: TrendingUp, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-7 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Campanhas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingCampaigns ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : campaigns?.campaigns?.length > 0 ? (
            <div className="space-y-3">
              {campaigns.campaigns.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-sm">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.subject}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      c.status === "sent" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      c.status === "draft" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {c.status === "sent" ? "Enviada" : c.status === "draft" ? "Rascunho" : c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma campanha encontrada</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
