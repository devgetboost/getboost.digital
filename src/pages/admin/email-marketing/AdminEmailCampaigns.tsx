import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useBrevoCampaigns, useCreateCampaign, useDeleteCampaign, useSendCampaign, useBrevoLists } from "@/hooks/useBrevo";
import { Plus, Trash2, Send, Eye, MailOpen, MousePointerClick } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import WebhookTester from "@/components/admin/WebhookTester";

export default function AdminEmailCampaigns() {
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("Getboost Digital");
  const [senderEmail, setSenderEmail] = useState("");
  const [htmlContent, setHtmlContent] = useState("<html><body><h1>Título</h1><p>Conteúdo da campanha</p></body></html>");
  const [selectedList, setSelectedList] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, error } = useBrevoCampaigns(50, 0, statusFilter);
  const { data: listsData } = useBrevoLists(50, 0);
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const sendCampaign = useSendCampaign();

  const campaigns = data?.campaigns || [];
  const lists = listsData?.lists || [];

  const handleCreate = async () => {
    if (!name || !subject || !senderEmail || !selectedList) {
      toast.error("Preenche todos os campos obrigatórios");
      return;
    }
    try {
      await createCampaign.mutateAsync({
        name,
        subject,
        sender: { name: senderName, email: senderEmail },
        htmlContent,
        recipients: { listIds: [parseInt(selectedList)] },
      });
      toast.success("Campanha criada");
      setShowCreate(false);
      resetForm();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar campanha");
    }
  };

  const resetForm = () => {
    setName("");
    setSubject("");
    setHtmlContent("<html><body><h1>Título</h1><p>Conteúdo da campanha</p></body></html>");
    setSelectedList("");
  };

  const handleDelete = async (id: number, campaignName: string) => {
    if (!confirm(`Eliminar a campanha "${campaignName}"?`)) return;
    try {
      await deleteCampaign.mutateAsync(id);
      toast.success("Campanha eliminada");
    } catch (e: any) {
      toast.error(e.message || "Erro ao eliminar");
    }
  };

  const handleSend = async (id: number, campaignName: string) => {
    if (!confirm(`Enviar a campanha "${campaignName}" agora?`)) return;
    try {
      await sendCampaign.mutateAsync(id);
      toast.success("Campanha enviada!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar");
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      draft: { label: "Rascunho", variant: "secondary" },
      sent: { label: "Enviada", variant: "default" },
      queued: { label: "Na fila", variant: "outline" },
      suspended: { label: "Suspensa", variant: "destructive" },
    };
    const s = map[status] || { label: status, variant: "outline" as const };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (error?.message === "BREVO_NOT_CONFIGURED") {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Configura a chave API do Brevo para gerir campanhas.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <WebhookTester />
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="sent">Enviadas</SelectItem>
            <SelectItem value="queued">Na fila</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Nova Campanha
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da campanha *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Newsletter Abril 2026" />
              </div>
              <div>
                <Label>Assunto *</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Assunto do email" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome do remetente</Label>
                  <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                </div>
                <div>
                  <Label>Email do remetente *</Label>
                  <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} placeholder="email@dominio.com" />
                </div>
              </div>
              <div>
                <Label>Lista de destinatários *</Label>
                <Select value={selectedList} onValueChange={setSelectedList}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleciona uma lista" />
                  </SelectTrigger>
                  <SelectContent>
                    {lists.map((l: any) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {l.name} ({l.totalSubscribers || 0} contactos)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conteúdo HTML</Label>
                <Textarea
                  value={htmlContent}
                  onChange={(e) => setHtmlContent(e.target.value)}
                  rows={8}
                  className="font-mono text-xs"
                />
              </div>
              <Button onClick={handleCreate} disabled={createCampaign.isPending} className="w-full">
                {createCampaign.isPending ? "A criar..." : "Criar Campanha"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campanha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Estatísticas</TableHead>
                <TableHead className="w-28"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : campaigns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhuma campanha encontrada
                  </TableCell>
                </TableRow>
              ) : (
                campaigns.map((c: any) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.subject}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>
                      {c.statistics ? (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><MailOpen className="h-3 w-3" />{c.statistics.uniqueOpens || 0}</span>
                          <span className="flex items-center gap-1"><MousePointerClick className="h-3 w-3" />{c.statistics.uniqueClicks || 0}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {c.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700"
                            onClick={() => handleSend(c.id, c.name)}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        {c.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(c.id, c.name)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
