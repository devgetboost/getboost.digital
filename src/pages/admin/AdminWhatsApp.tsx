import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Send, History, Inbox, Bot, Zap, BarChart3, ShieldAlert, Timer, Sparkles, FileText, Search, Bell, MessageCircle, FlaskConical, Clock, Users } from 'lucide-react';
import WhatsAppInstanceAgentMap from './whatsapp/WhatsAppInstanceAgentMap';

import WhatsAppFallbackSettings from './whatsapp/WhatsAppFallbackSettings';
import WhatsAppConciergeAlerts from './whatsapp/WhatsAppConciergeAlerts';
import TelegramChatIdsAdmin from './whatsapp/TelegramChatIdsAdmin';
import WhatsAppInstances from './whatsapp/WhatsAppInstances';
import WhatsAppSend from './whatsapp/WhatsAppSend';
import WhatsAppHistory from './whatsapp/WhatsAppHistory';
import WhatsAppAtendimento from './whatsapp/WhatsAppAtendimento';
import WhatsAppAssistantSettings from './whatsapp/WhatsAppAssistantSettings';
import WhatsAppAutomation from './whatsapp/WhatsAppAutomation';
import WhatsAppMetrics from './whatsapp/WhatsAppMetrics';
import WhatsAppHandoffs from './whatsapp/WhatsAppHandoffs';
import WhatsAppSlaSettings from './whatsapp/WhatsAppSlaSettings';
import WhatsAppHandoffMetrics from './whatsapp/WhatsAppHandoffMetrics';
import WhatsAppConciergeMetrics from './whatsapp/WhatsAppConciergeMetrics';
import WhatsAppConciergeDailyReport from './whatsapp/WhatsAppConciergeDailyReport';
import WhatsAppConciergeAudit from './whatsapp/WhatsAppConciergeAudit';
import WhatsAppConciergeSimulator from './whatsapp/WhatsAppConciergeSimulator';


export default function AdminWhatsApp() {
  const [tab, setTab] = useState('atendimento');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">WhatsApp</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Atendimento automático com IA, automação por eventos e disparo via Evolution API
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="atendimento" className="gap-2">
            <Inbox className="h-4 w-4" /> Atendimento
          </TabsTrigger>
          <TabsTrigger value="handoffs" className="gap-2">
            <ShieldAlert className="h-4 w-4" /> Escalonamentos
          </TabsTrigger>
          <TabsTrigger value="handoff-metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Métricas Handoff
          </TabsTrigger>
          <TabsTrigger value="sla" className="gap-2">
            <Timer className="h-4 w-4" /> SLA
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <BarChart3 className="h-4 w-4" /> Métricas
          </TabsTrigger>
          <TabsTrigger value="concierge-metrics" className="gap-2">
            <Sparkles className="h-4 w-4" /> Concierge
          </TabsTrigger>
          <TabsTrigger value="concierge-report" className="gap-2">
            <FileText className="h-4 w-4" /> Relatório 24h
          </TabsTrigger>
          <TabsTrigger value="concierge-audit" className="gap-2">
            <Search className="h-4 w-4" /> Auditoria
          </TabsTrigger>
          <TabsTrigger value="concierge-alerts" className="gap-2">
            <Bell className="h-4 w-4" /> Alertas
          </TabsTrigger>
          <TabsTrigger value="concierge-simulator" className="gap-2">
            <FlaskConical className="h-4 w-4" /> Simulador
          </TabsTrigger>
          <TabsTrigger value="fallback" className="gap-2">
            <Clock className="h-4 w-4" /> Fallback
          </TabsTrigger>
          <TabsTrigger value="telegram-ids" className="gap-2">
            <MessageCircle className="h-4 w-4" /> Telegram IDs
          </TabsTrigger>


          <TabsTrigger value="assistant" className="gap-2">
            <Bot className="h-4 w-4" /> Assistente IA
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" /> Automação
          </TabsTrigger>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" /> Enviar
          </TabsTrigger>
          <TabsTrigger value="instances" className="gap-2">
            <Settings className="h-4 w-4" /> Instâncias
          </TabsTrigger>
          <TabsTrigger value="instance-agents" className="gap-2">
            <Users className="h-4 w-4" /> Agente por Instância
          </TabsTrigger>


          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="atendimento"><WhatsAppAtendimento /></TabsContent>
        <TabsContent value="handoffs"><WhatsAppHandoffs /></TabsContent>
        <TabsContent value="handoff-metrics"><WhatsAppHandoffMetrics /></TabsContent>
        <TabsContent value="sla"><WhatsAppSlaSettings /></TabsContent>
        <TabsContent value="metrics"><WhatsAppMetrics /></TabsContent>
        <TabsContent value="concierge-metrics"><WhatsAppConciergeMetrics /></TabsContent>
        <TabsContent value="concierge-report"><WhatsAppConciergeDailyReport /></TabsContent>
        <TabsContent value="concierge-audit"><WhatsAppConciergeAudit /></TabsContent>
        <TabsContent value="concierge-alerts"><WhatsAppConciergeAlerts /></TabsContent>
        <TabsContent value="concierge-simulator"><WhatsAppConciergeSimulator /></TabsContent>
        <TabsContent value="fallback"><WhatsAppFallbackSettings /></TabsContent>
        <TabsContent value="telegram-ids"><TelegramChatIdsAdmin /></TabsContent>


        <TabsContent value="assistant"><WhatsAppAssistantSettings /></TabsContent>
        <TabsContent value="automation"><WhatsAppAutomation /></TabsContent>
        <TabsContent value="send"><WhatsAppSend /></TabsContent>
        <TabsContent value="instances"><WhatsAppInstances /></TabsContent>
        <TabsContent value="instance-agents"><WhatsAppInstanceAgentMap /></TabsContent>

        <TabsContent value="history"><WhatsAppHistory /></TabsContent>
      </Tabs>
    </div>
  );
}

