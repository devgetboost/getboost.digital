import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, ListChecks, Send, BarChart3, AlertCircle, UserPlus } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { useBrevoAccount } from "@/hooks/useBrevo";
import AdminEmailContacts from "./email-marketing/AdminEmailContacts";
import AdminEmailLists from "./email-marketing/AdminEmailLists";
import AdminEmailCampaigns from "./email-marketing/AdminEmailCampaigns";
import AdminEmailDashboard from "./email-marketing/AdminEmailDashboard";
import AdminNewsletterSubscribers from "./email-marketing/AdminNewsletterSubscribers";

export default function AdminEmailMarketing() {
  const { error } = useBrevoAccount();
  const notConfigured = error?.message === "BREVO_NOT_CONFIGURED";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Email Marketing</h1>
        <p className="text-muted-foreground mt-1">
          Gestão de contactos, listas e campanhas via Brevo
        </p>
      </div>

      {notConfigured && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>API não configurada</AlertTitle>
          <AlertDescription>
            A chave API do Brevo ainda não foi configurada. Acede a{" "}
            <a href="https://app.brevo.com/settings/keys/api" target="_blank" rel="noopener noreferrer" className="underline font-medium">
              Brevo → Definições → Chaves API
            </a>{" "}
            para obter a tua chave e configura-a no projeto.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="subscribers" className="w-full">
        <TabsList className="grid w-full grid-cols-5 h-12">
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Subscritores</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="contacts" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Contactos</span>
          </TabsTrigger>
          <TabsTrigger value="lists" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            <span className="hidden sm:inline">Listas</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">Campanhas</span>
          </TabsTrigger>
        </TabsList>

        {notConfigured ? (
          <>
            <TabsContent value="subscribers" className="mt-6">
              <AdminNewsletterSubscribers />
            </TabsContent>
            <Card className="mt-6 border-dashed">
              <CardContent className="py-10 text-center space-y-2">
                <p className="font-medium text-foreground">Integração Brevo pronta para configuração</p>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
                  Os módulos de dashboard, contactos, listas e campanhas Brevo ficam disponíveis após configurar a chave API.
                  Os subscritores da newsletter já estão acessíveis acima.
                </p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <TabsContent value="subscribers" className="mt-6">
              <AdminNewsletterSubscribers />
            </TabsContent>
            <TabsContent value="dashboard" className="mt-6">
              <AdminEmailDashboard />
            </TabsContent>
            <TabsContent value="contacts" className="mt-6">
              <AdminEmailContacts />
            </TabsContent>
            <TabsContent value="lists" className="mt-6">
              <AdminEmailLists />
            </TabsContent>
            <TabsContent value="campaigns" className="mt-6">
              <AdminEmailCampaigns />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
