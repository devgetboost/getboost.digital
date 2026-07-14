import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Power, Calendar, UserPlus, Bell, CheckCircle2, Zap, MessageSquare, Send, Tag as TagIcon, BookOpen } from "lucide-react";
import WhatsAppTemplateLibrary from "./WhatsAppTemplateLibrary";
import type { TemplatePreset } from "./templateLibrary";

type TriggerEvent = "meeting_scheduled" | "lead_created" | "lead_tagged" | "meeting_reminder" | "meeting_completed" | "custom";

interface Template {
  id: string;
  name: string;
  content: string;
  trigger_event: TriggerEvent;
  is_active: boolean;
  priority: number;
  variables: string[];
  media_url: string | null;
  media_mime: string | null;
  tag_id: string | null;
  created_at: string;
  updated_at: string;
}

interface LeadTag { id: string; label: string; color: string; slug: string; }


interface TriggerLog {
  id: string;
  template_id: string | null;
  trigger_event: string;
  recipient_name: string;
  recipient_phone: string;
  message_sent: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

const TRIGGER_EVENTS: { value: TriggerEvent; label: string; icon: typeof Calendar; description: string }[] = [
  { value: "meeting_scheduled", label: "Reunião Agendada", icon: Calendar, description: "Dispara quando um cliente agenda em /booking" },
  { value: "lead_created", label: "Novo Lead", icon: UserPlus, description: "Dispara quando entra um lead via formulários" },
  { value: "lead_tagged", label: "Lead recebe Tag", icon: TagIcon, description: "Dispara quando uma tag (origem, formulário, canal) é atribuída a um lead" },
  { value: "meeting_reminder", label: "Lembrete 24h", icon: Bell, description: "Cron diário envia lembrete antes da reunião" },
  { value: "meeting_completed", label: "Reunião Concluída", icon: CheckCircle2, description: "Dispara quando a reunião muda para concluída" },
  { value: "custom", label: "Personalizado", icon: Zap, description: "Acionado manualmente via API" },
];


const VAR_SUGGESTIONS = [
  "{{nome}}", "{{email}}", "{{telefone}}", "{{empresa}}",
  "{{meeting_date}}", "{{meeting_time}}", "{{meeting_link}}",
  "{{servico}}", "{{cargo}}",
];

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  sent: "default", delivered: "default", failed: "destructive", pending: "secondary", preview: "outline",
};
const STATUS_LABEL: Record<string, string> = {
  sent: "Enviado", delivered: "Entregue", failed: "Falhou", pending: "Pendente", preview: "Pré-visualização",
};

function extractVariables(text: string): string[] {
  const matches = text.match(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g) || [];
  return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}|\s/g, ""))));
}

export default function WhatsAppAutomation() {
  const [tab, setTab] = useState("templates");
  const [templates, setTemplates] = useState<Template[]>([]);

  const [logs, setLogs] = useState<TriggerLog[]>([]);
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    trigger_event: "meeting_scheduled" as TriggerEvent,
    content: "",
    is_active: true,
    priority: 1,
    tag_id: null as string | null,
  });
  const [testPhone, setTestPhone] = useState("");
  const [testName, setTestName] = useState("");

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [t, l, tg] = await Promise.all([
      supabase.from("whatsapp_templates").select("*").order("priority", { ascending: true }),
      supabase.from("whatsapp_trigger_logs").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("lead_tags").select("id, label, color, slug").order("label"),
    ]);
    if (t.data) setTemplates(t.data as any);
    if (l.data) setLogs(l.data as any);
    if (tg.data) setTags(tg.data as any);
    setLoading(false);
  }

  function openNew() {
    setEditing(null);
    setForm({ name: "", trigger_event: "meeting_scheduled", content: "", is_active: true, priority: 1, tag_id: null });
    setModalOpen(true);
  }

  function openEdit(tpl: Template) {
    setEditing(tpl);
    setForm({
      name: tpl.name,
      trigger_event: tpl.trigger_event,
      content: tpl.content,
      is_active: tpl.is_active,
      priority: tpl.priority,
      tag_id: tpl.tag_id,
    });
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim() || !form.content.trim()) {
      toast({ title: "Preenche nome e mensagem", variant: "destructive" });
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      trigger_event: form.trigger_event,
      content: form.content,
      is_active: form.is_active,
      priority: form.priority,
      variables: extractVariables(form.content),
      tag_id: form.trigger_event === "lead_tagged" ? form.tag_id : null,
    };
    const res = editing
      ? await supabase.from("whatsapp_templates").update(payload).eq("id", editing.id)
      : await supabase.from("whatsapp_templates").insert(payload);

    setSaving(false);
    if (res.error) {
      toast({ title: "Erro ao guardar", description: res.error.message, variant: "destructive" });
      return;
    }
    toast({ title: editing ? "Modelo actualizado" : "Modelo criado" });
    setModalOpen(false);
    void loadAll();
  }

  async function toggleActive(tpl: Template) {
    const { error } = await supabase
      .from("whatsapp_templates").update({ is_active: !tpl.is_active }).eq("id", tpl.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setTemplates(ts => ts.map(t => t.id === tpl.id ? { ...t, is_active: !t.is_active } : t));
  }

  async function remove(tpl: Template) {
    if (!confirm(`Apagar o modelo "${tpl.name}"?`)) return;
    const { error } = await supabase.from("whatsapp_templates").delete().eq("id", tpl.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Modelo apagado" });
    void loadAll();
  }

  async function testDispatch() {
    if (!testPhone.trim()) {
      toast({ title: "Indica um telefone para teste", variant: "destructive" });
      return;
    }
    if (!form.content.trim()) {
      toast({ title: "Escreve a mensagem antes de testar", variant: "destructive" });
      return;
    }
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-trigger-dispatch", {
      body: {
        trigger_event: form.trigger_event,
        contact: {
          name: testName || "Teste",
          phone: testPhone.replace(/\D/g, ""),
          variables: {
            meeting_date: "amanhã",
            meeting_time: "10:00",
            meeting_link: "https://getboost.digital/booking",
            empresa: "Empresa Teste",
          },
        },
        test_mode: false,
        // Envia o rascunho actual directamente (não precisa de estar gravado/activo)
        test_template: {
          name: form.name || "rascunho",
          content: form.content,
        },
      },
    });
    setTesting(false);
    if (error) {
      toast({ title: "Erro no envio", description: error.message, variant: "destructive" });
      return;
    }
    const list = Array.isArray(data?.dispatched) ? data.dispatched : [];
    const sentCount = list.filter((d: any) => d.status === "sent").length;
    const failed = list.find((d: any) => d.status === "failed");
    if (sentCount > 0) {
      toast({ title: "Mensagem enviada", description: `${sentCount} mensagem(ns) entregues à API.` });
    } else if (failed) {
      toast({ title: "Falha no envio", description: failed.error || "Erro desconhecido", variant: "destructive" });
    } else {
      toast({ title: "Sem envios", description: data?.reason || "Verifica a instância WhatsApp e o conteúdo." });
    }
    void loadAll();
  }

  function insertVar(v: string) {
    setForm(p => ({ ...p, content: p.content + v }));
  }

  const previewText = useMemo(() => {
    return form.content
      .replace(/\{\{\s*nome\s*\}\}/gi, testName || "João Silva")
      .replace(/\{\{\s*meeting_date\s*\}\}/gi, "20/06")
      .replace(/\{\{\s*meeting_time\s*\}\}/gi, "14:00")
      .replace(/\{\{\s*meeting_link\s*\}\}/gi, "https://getboost.digital/booking")
      .replace(/\{\{\s*empresa\s*\}\}/gi, "Acme Lda")
      .replace(/\{\{\s*telefone\s*\}\}/gi, testPhone || "+351 963 574 400");
  }, [form.content, testName, testPhone]);

  const stats = {
    total: templates.length,
    active: templates.filter(t => t.is_active).length,
    sent: logs.filter(l => l.status === "sent" || l.status === "delivered").length,
    failed: logs.filter(l => l.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Modelos</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-primary">{stats.active}</div>
          <div className="text-xs text-muted-foreground">Activos</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-green-600">{stats.sent}</div>
          <div className="text-xs text-muted-foreground">Enviadas</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-2xl font-bold text-destructive">{stats.failed}</div>
          <div className="text-xs text-muted-foreground">Falhas</div>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="templates" className="gap-2"><MessageSquare className="h-4 w-4" />Modelos</TabsTrigger>
          <TabsTrigger value="library" className="gap-2"><BookOpen className="h-4 w-4" />Biblioteca</TabsTrigger>
          <TabsTrigger value="triggers" className="gap-2"><Zap className="h-4 w-4" />Triggers</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><Send className="h-4 w-4" />Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="library">
          <WhatsAppTemplateLibrary
            onImport={(preset: TemplatePreset) => {
              setEditing(null);
              setForm({
                name: preset.name,
                trigger_event: preset.trigger_event,
                content: preset.content,
                is_active: true,
                priority: 1,
                tag_id: null,
              });
              setModalOpen(true);
              setTab("templates");
            }}
          />
        </TabsContent>

        {/* ── Templates ── */}
        <TabsContent value="templates" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Modelos de Mensagem</h2>
              <p className="text-sm text-muted-foreground">Disparados automaticamente em eventos do sistema</p>
            </div>
            <Button onClick={openNew}><Plus className="h-4 w-4" />Novo Modelo</Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : templates.length === 0 ? (
            <Card><CardContent className="p-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-semibold mb-1">Sem modelos</h3>
              <p className="text-sm text-muted-foreground mb-4">Cria o primeiro modelo de mensagem automática</p>
              <Button onClick={openNew}><Plus className="h-4 w-4" />Criar Modelo</Button>
            </CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {templates.map(tpl => {
                const ev = TRIGGER_EVENTS.find(e => e.value === tpl.trigger_event);
                const Icon = ev?.icon ?? Zap;
                return (
                  <Card key={tpl.id}>
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Icon className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{tpl.name}</h3>
                            <Badge variant={tpl.is_active ? "default" : "secondary"}>
                              {tpl.is_active ? "Activo" : "Inactivo"}
                            </Badge>
                            <Badge variant="outline">{ev?.label ?? tpl.trigger_event}</Badge>
                            {tpl.tag_id && (() => {
                              const t = tags.find(x => x.id === tpl.tag_id);
                              return t ? (
                                <Badge className="border-0 text-[10px]" style={{ backgroundColor: t.color + "22", color: t.color }}>
                                  <TagIcon className="h-2.5 w-2.5 mr-1" />{t.label}
                                </Badge>
                              ) : null;
                            })()}

                          </div>
                          <p className="text-sm text-muted-foreground bg-muted rounded-md p-3 font-mono whitespace-pre-wrap line-clamp-3">
                            {tpl.content}
                          </p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            <span>{tpl.variables.length} variáveis</span>
                            <span>Prioridade {tpl.priority}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="icon" variant="ghost" onClick={() => toggleActive(tpl)} title="Ligar/Desligar">
                            <Power className={`h-4 w-4 ${tpl.is_active ? "text-primary" : "text-muted-foreground"}`} />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openEdit(tpl)} title="Editar">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(tpl)} title="Apagar">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ── Triggers explain ── */}
        <TabsContent value="triggers" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Eventos disponíveis</h2>
            <p className="text-sm text-muted-foreground">Como cada evento aciona o envio</p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {TRIGGER_EVENTS.map(ev => {
              const related = templates.filter(t => t.trigger_event === ev.value);
              const Icon = ev.icon;
              return (
                <Card key={ev.value}>
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{ev.label}</h3>
                        <p className="text-xs text-muted-foreground">{ev.description}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase">Modelos associados</p>
                      {related.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum</p>
                      ) : related.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-muted rounded-md px-3 py-2 text-sm">
                          <span>{t.name}</span>
                          <span className={`h-2 w-2 rounded-full ${t.is_active ? "bg-primary" : "bg-muted-foreground/30"}`} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ── Logs ── */}
        <TabsContent value="logs" className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Histórico de disparos</h2>
            <p className="text-sm text-muted-foreground">Últimas 100 execuções automáticas</p>
          </div>
          <Card><CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Mensagem</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Sem registos ainda
                  </TableCell></TableRow>
                ) : logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.recipient_name || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{log.recipient_phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TRIGGER_EVENTS.find(e => e.value === log.trigger_event)?.label ?? log.trigger_event}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-muted-foreground" title={log.message_sent}>
                      {log.message_sent}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[log.status] ?? "secondary"}>
                        {STATUS_LABEL[log.status] ?? log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString("pt-PT")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Modelo" : "Novo Modelo de Mensagem"}</DialogTitle>
          </DialogHeader>

          <div className="grid md:grid-cols-2 gap-6 py-2">
            <div className="space-y-4">
              <div>
                <Label>Nome do Modelo</Label>
                <Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Confirmação de Reunião" />
              </div>

              <div>
                <Label>Evento que dispara</Label>
                <Select value={form.trigger_event} onValueChange={(v: TriggerEvent) => setForm(p => ({ ...p, trigger_event: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_EVENTS.map(e => (
                      <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.trigger_event === "lead_tagged" && (
                <div>
                  <Label className="flex items-center gap-1.5"><TagIcon className="h-3.5 w-3.5" /> Tag associada</Label>
                  <Select value={form.tag_id ?? "any"} onValueChange={v => setForm(p => ({ ...p, tag_id: v === "any" ? null : v }))}>
                    <SelectTrigger><SelectValue placeholder="Qualquer tag" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Qualquer tag</SelectItem>
                      {tags.map(t => (
                        <SelectItem key={t.id} value={t.id}>
                          <span className="inline-flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                            {t.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">Variáveis disponíveis: {"{{tag}}, {{utm_source}}, {{utm_campaign}}"}</p>
                </div>
              )}


              <div>
                <Label>Mensagem</Label>
                <Textarea rows={6} value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="Olá {{nome}}! A tua reunião está confirmada para {{meeting_date}} às {{meeting_time}}." />
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Inserir variável</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {VAR_SUGGESTIONS.map(v => (
                    <button key={v} type="button" onClick={() => insertVar(v)}
                      className="px-2 py-1 text-xs font-mono bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors">
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_active} onCheckedChange={c => setForm(p => ({ ...p, is_active: c }))} />
                  <Label className="cursor-pointer">Activo</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Prioridade</Label>
                  <Input type="number" min={1} max={99} className="w-20"
                    value={form.priority}
                    onChange={e => setForm(p => ({ ...p, priority: parseInt(e.target.value) || 1 }))} />
                </div>
              </div>
            </div>

            {/* Preview & Test */}
            <div className="space-y-4">
              <div>
                <Label>Pré-visualização</Label>
                <div className="rounded-xl bg-[#e5ddd5] p-4 min-h-[180px]">
                  <div className="bg-white rounded-lg p-3 shadow-sm max-w-[85%] text-sm whitespace-pre-wrap">
                    {previewText || <span className="text-muted-foreground">Escreve a mensagem para ver a pré-visualização</span>}
                    <div className="text-[10px] text-muted-foreground text-right mt-1">agora</div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <Label className="text-sm font-semibold">Enviar teste real</Label>
                <Input placeholder="Nome (opcional)" value={testName} onChange={e => setTestName(e.target.value)} />
                <Input placeholder="+351 963 574 400" value={testPhone} onChange={e => setTestPhone(e.target.value)} />
                <Button variant="outline" className="w-full" onClick={testDispatch} disabled={testing}>
                  <Send className="h-4 w-4" />
                  {testing ? "A enviar…" : "Disparar agora"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Usa o evento e os modelos activos. Guarda antes de testar para incluir alterações.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "A guardar…" : editing ? "Guardar Alterações" : "Criar Modelo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
