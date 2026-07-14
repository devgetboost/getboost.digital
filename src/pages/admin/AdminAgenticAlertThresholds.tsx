import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Plus, Copy } from "lucide-react";

type Row = {
  id: string;
  profile_name: string;
  agent_id: string | null;
  window_hours: number | null;
  window_runs: number | null;
  error_rate_pct: number;
  avg_latency_ms: number;
  min_runs: number;
  enabled: boolean;
};
type Agent = { id: string; name: string };

const empty = (): Omit<Row, "id"> => ({
  profile_name: "",
  agent_id: null,
  window_hours: 24,
  window_runs: null,
  error_rate_pct: 5,
  avg_latency_ms: 4000,
  min_runs: 5,
  enabled: true,
});

export default function AdminAgenticAlertThresholds() {
  const [rows, setRows] = useState<Row[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [draft, setDraft] = useState(empty());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [t, a] = await Promise.all([
      (supabase.from as any)("agentic_alert_thresholds").select("*").order("window_hours").order("profile_name"),
      supabase.from("agentic_agents").select("id,name").order("name"),
    ]);
    setRows((t.data as Row[]) ?? []);
    setAgents((a.data as Agent[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!draft.profile_name.trim()) return toast.error("Nome do perfil obrigatório");
    const { error } = await (supabase.from as any)("agentic_alert_thresholds").insert(draft);
    if (error) return toast.error(error.message);
    toast.success("Perfil criado");
    setDraft(empty());
    load();
  };

  const update = async (id: string, patch: Partial<Row>) => {
    const { error } = await (supabase.from as any)("agentic_alert_thresholds").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const remove = async (id: string) => {
    if (!confirm("Eliminar perfil?")) return;
    const { error } = await (supabase.from as any)("agentic_alert_thresholds").delete().eq("id", id);
    if (error) toast.error(error.message);
    else load();
  };

  const duplicate = async (r: Row) => {
    const { id: _omit, ...rest } = r;
    const copy = { ...rest, profile_name: `${r.profile_name} (cópia)`, enabled: false };
    const { error } = await (supabase.from as any)("agentic_alert_thresholds").insert(copy);
    if (error) toast.error(error.message);
    else { toast.success("Perfil duplicado (desativado)"); load(); }
  };

  const agentName = (id: string | null) => (id ? agents.find((a) => a.id === id)?.name ?? "—" : "Todos (default)");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Limiares de Alerta</h1>
          <p className="text-muted-foreground text-sm">Perfis por agente e janela temporal usados pelo verificador de alertas.</p>
        </div>
        <a href="/admin/agentic-ai/alertas/definicoes" className="text-sm underline text-primary shrink-0">Definições gerais →</a>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Novo perfil</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
          <div className="md:col-span-2">
            <Label>Nome</Label>
            <Input value={draft.profile_name} onChange={(e) => setDraft({ ...draft, profile_name: e.target.value })} placeholder="Ex: Estrito 1h" />
          </div>
          <div>
            <Label>Agente</Label>
            <Select value={draft.agent_id ?? "all"} onValueChange={(v) => setDraft({ ...draft, agent_id: v === "all" ? null : v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos (default)</SelectItem>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Janela (h)</Label>
            <Input type="number" min={1} value={draft.window_hours ?? ''} disabled={!!draft.window_runs}
              onChange={(e) => setDraft({ ...draft, window_hours: e.target.value ? +e.target.value : null })} />
          </div>
          <div>
            <Label title="Se preenchido, sobrepõe a janela em horas e avalia as últimas N execuções">Últimas N exec.</Label>
            <Input type="number" min={1} value={draft.window_runs ?? ''} placeholder="—"
              onChange={(e) => setDraft({ ...draft, window_runs: e.target.value ? +e.target.value : null })} />
          </div>
          <div><Label>Erro %</Label><Input type="number" step="0.1" value={draft.error_rate_pct} onChange={(e) => setDraft({ ...draft, error_rate_pct: +e.target.value })} /></div>
          <div><Label>Latência (ms)</Label><Input type="number" value={draft.avg_latency_ms} onChange={(e) => setDraft({ ...draft, avg_latency_ms: +e.target.value })} /></div>
          <div><Label>Mín. exec.</Label><Input type="number" min={1} value={draft.min_runs} onChange={(e) => setDraft({ ...draft, min_runs: +e.target.value })} /></div>
          <div className="md:col-span-7"><Button onClick={create}><Plus className="h-4 w-4 mr-1" />Criar</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Perfis existentes</CardTitle></CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">A carregar…</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Perfil</TableHead><TableHead>Agente</TableHead>
                  <TableHead>Janela (h)</TableHead><TableHead>Últ. N exec.</TableHead>
                  <TableHead>Erro %</TableHead><TableHead>Latência ms</TableHead><TableHead>Mín. exec.</TableHead>
                  <TableHead>Ativo</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.profile_name}</TableCell>
                    <TableCell className="text-sm">{agentName(r.agent_id)}</TableCell>
                    <TableCell><Input className="w-20" type="number" defaultValue={r.window_hours ?? ''} disabled={!!r.window_runs} onBlur={(e) => update(r.id, { window_hours: e.target.value ? +e.target.value : null })} /></TableCell>
                    <TableCell><Input className="w-20" type="number" defaultValue={r.window_runs ?? ''} placeholder="—" onBlur={(e) => update(r.id, { window_runs: e.target.value ? +e.target.value : null })} /></TableCell>
                    <TableCell><Input className="w-20" type="number" step="0.1" defaultValue={r.error_rate_pct} onBlur={(e) => update(r.id, { error_rate_pct: +e.target.value })} /></TableCell>
                    <TableCell><Input className="w-24" type="number" defaultValue={r.avg_latency_ms} onBlur={(e) => update(r.id, { avg_latency_ms: +e.target.value })} /></TableCell>
                    <TableCell><Input className="w-20" type="number" defaultValue={r.min_runs} onBlur={(e) => update(r.id, { min_runs: +e.target.value })} /></TableCell>
                    <TableCell><Switch checked={r.enabled} onCheckedChange={(v) => update(r.id, { enabled: v })} /></TableCell>
                    <TableCell className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => duplicate(r)} title="Duplicar"><Copy className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)} title="Eliminar"><Trash2 className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground text-sm py-6">Sem perfis configurados.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
