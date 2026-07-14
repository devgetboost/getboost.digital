import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Archive, Play, Eye } from "lucide-react";
import { listAgents, type Agent } from "@/lib/agenticAgents";
import { setVersionStatus, activateVersion, type VersionStatus } from "@/lib/agenticVersions";
import { useAgenticPermissions } from "@/hooks/useAgenticPermissions";
import { useHasRole } from "@/hooks/useHasRole";

type VRow = {
  id: string; agent_id: string; version: number; status: VersionStatus;
  notes: string | null; created_at: string; updated_at: string;
  system_prompt: string; model: string | null;
};

const STATUS_COLOR: Record<VersionStatus, string> = {
  draft: "bg-muted text-foreground",
  pending_review: "bg-yellow-100 text-yellow-900",
  reviewed: "bg-blue-100 text-blue-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  archived: "bg-slate-200 text-slate-700",
};
const STATUS_LABEL: Record<VersionStatus, string> = {
  draft: "Rascunho", pending_review: "Em revisão", reviewed: "Revista",
  approved: "Aprovada", rejected: "Rejeitada", archived: "Arquivada",
};

export default function AdminAgenticApprovals() {
  const { canExecute } = useAgenticPermissions(); // admin
  const { allowed: isCollaborator } = useHasRole("collaborator");

  return (
    <AdminAgenticApprovalsContent
      canExecute={canExecute}
      canReview={canExecute || isCollaborator}
    />
  );
}

type AdminAgenticApprovalsContentProps = {
  canExecute: boolean;
  canReview: boolean;
};

function AdminAgenticApprovalsContent({ canExecute, canReview }: AdminAgenticApprovalsContentProps) {
  const canApprove = canExecute;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [versions, setVersions] = useState<VRow[]>([]);
  const [statusFilter, setStatusFilter] = useState<VersionStatus | "all">("pending_review");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [ags, { data: vs, error }] = await Promise.all([
      listAgents(),
      supabase.from("agentic_agent_versions")
        .select("id,agent_id,version,status,notes,created_at,updated_at,system_prompt,model")
        .order("updated_at", { ascending: false }),
    ]);
    if (error) toast.error(error.message);
    setAgents(ags);
    setVersions((vs as VRow[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const agentById = useMemo(() => new Map(agents.map(a => [a.id, a])), [agents]);
  const filtered = versions.filter(v =>
    (statusFilter === "all" || v.status === statusFilter) &&
    (agentFilter === "all" || v.agent_id === agentFilter));

  const doStatus = async (v: VRow, s: VersionStatus) => {
    try { await setVersionStatus(v.id, s); toast.success(`v${v.version} → ${STATUS_LABEL[s]}`); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const doActivate = async (v: VRow) => {
    try { await activateVersion(v.agent_id, v.id); toast.success(`v${v.version} ativa em produção`); load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const toggleAgent = async (a: Agent, enabled: boolean) => {
    const { error } = await supabase.from("agentic_agents").update({ status: enabled ? "active" : "draft" }).eq("id", a.id);
    if (error) toast.error(error.message);
    else { toast.success(`${a.name} ${enabled ? "ativado" : "desativado"}`); load(); }
  };

  const pendingCount = versions.filter(v => v.status === "pending_review").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Aprovações de Agentes</h1>
        <p className="text-muted-foreground text-sm">Rever, aprovar, rejeitar e ativar em produção prompts e versões antes do release.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Em revisão</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{pendingCount}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Agentes ativos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{agents.filter((a: any) => a.status === "active").length} / {agents.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total de versões</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{versions.length}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Agentes</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead>Versões</TableHead>
              <TableHead>Pendentes</TableHead><TableHead>Ativo em produção</TableHead>
              <TableHead></TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {agents.map(a => {
                const vs = versions.filter(v => v.agent_id === a.id);
                const pend = vs.filter(v => v.status === "pending_review").length;
                const isActive = (a as any).status === "active";
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell>{vs.length}</TableCell>
                    <TableCell>{pend > 0 ? <Badge variant="secondary">{pend}</Badge> : "—"}</TableCell>
                    <TableCell><Switch checked={isActive} disabled={!canExecute} onCheckedChange={(v) => toggleAgent(a, v)} /></TableCell>
                    <TableCell><Button size="sm" variant="outline" asChild><Link to={`/admin/agentic-ai/${a.id}/versoes`}><Eye className="h-3.5 w-3.5 mr-1" />Detalhe</Link></Button></TableCell>
                  </TableRow>
                );
              })}
              {agents.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Sem agentes.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <CardTitle className="text-base">Versões</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {(Object.keys(STATUS_LABEL) as VersionStatus[]).map(s => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os agentes</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">A carregar…</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Agente</TableHead><TableHead>Versão</TableHead>
                <TableHead>Estado</TableHead><TableHead>Modelo</TableHead>
                <TableHead>Atualizada</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(v => {
                  const a = agentById.get(v.agent_id);
                  const activeId = (a as any)?.activeVersionId as string | undefined;
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{a?.name ?? "—"}</TableCell>
                      <TableCell>v{v.version} {activeId === v.id && <Badge className="ml-1" variant="outline">ativa</Badge>}</TableCell>
                      <TableCell><Badge className={STATUS_COLOR[v.status]} variant="secondary">{STATUS_LABEL[v.status]}</Badge></TableCell>
                      <TableCell className="text-xs">{v.model ?? "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(v.updated_at).toLocaleString("pt-PT")}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {canReview && v.status === "draft" && (
                            <Button size="sm" variant="outline" onClick={() => doStatus(v, "pending_review")}>Submeter</Button>
                          )}
                          {canReview && v.status === "pending_review" && (
                            <>
                              <Button size="sm" onClick={() => doStatus(v, "reviewed")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Marcar revista</Button>
                              <Button size="sm" variant="outline" onClick={() => doStatus(v, "rejected")}><XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar</Button>
                            </>
                          )}
                          {v.status === "reviewed" && (
                            canApprove ? (
                              <>
                                <Button size="sm" onClick={() => doStatus(v, "approved")}><CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprovar</Button>
                                <Button size="sm" variant="outline" onClick={() => doStatus(v, "rejected")}><XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar</Button>
                              </>
                            ) : <Badge variant="outline" className="text-xs">Aguarda admin</Badge>
                          )}
                          {canApprove && v.status === "approved" && activeId !== v.id && (
                            <Button size="sm" onClick={() => doActivate(v)}><Play className="h-3.5 w-3.5 mr-1" />Ativar</Button>
                          )}
                          {canReview && v.status !== "archived" && v.status !== "approved" && (
                            <Button size="sm" variant="ghost" onClick={() => doStatus(v, "archived")}><Archive className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button size="sm" variant="ghost" asChild><Link to={`/admin/agentic-ai/${v.agent_id}/versoes`}><Eye className="h-3.5 w-3.5" /></Link></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">Sem versões com esses filtros.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
