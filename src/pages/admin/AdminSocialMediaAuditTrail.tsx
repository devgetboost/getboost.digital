import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, RefreshCw, ExternalLink, Copy } from "lucide-react";
import { toast } from "sonner";

type AuditRow = {
  id: string;
  draft_id: string;
  actor_email: string | null;
  actor_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  scheduled_at: string | null;
  notes: string | null;
  metadata: any;
  created_at: string;
};

type DraftRow = {
  id: string;
  rede: string | null;
  action: string;
  status: string;
  notes: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado",
  scheduled: "Agendado", publishing: "A publicar…", published: "Publicado",
  error: "Erro", rescheduled: "Reagendado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  scheduled: "bg-blue-100 text-blue-900",
  published: "bg-slate-200 text-slate-700",
  error: "bg-red-100 text-red-900",
};

// Extrai info estruturada de erros a partir de `notes` do publisher
// (formato: `[tentativa N] mensagem — ISO` ou `[erro] ...`) + metadata do audit.
function parseErrorInfo(row: { notes: string | null; metadata: any }) {
  const raw = row.notes ?? "";
  const parts = raw.split(/\s\|\s/).map((s) => s.trim()).filter(Boolean);
  const errorPart = parts.find((p) => /\[erro\]|\[tentativa \d+\]/i.test(p));
  const attempt = errorPart?.match(/\[tentativa (\d+)\]/)?.[1] ?? null;
  const iso = errorPart?.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*)/)?.[1] ?? null;
  const message = errorPart
    ?.replace(/\[tentativa \d+\]\s*/, "")
    .replace(/\[erro\]\s*/i, "")
    .replace(/\s*—\s*\d{4}-\d{2}-\d{2}T.*$/, "")
    .trim();

  const md = row.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const requestId = md.request_id ?? md.reqId ?? md.requestId ?? null;
  const code = md.code ?? md.error_code ?? null;
  const details = md.details ?? md.error_details ?? null;

  return { attempt, iso, message, requestId, code, details, rawMd: md };
}

export default function AdminSocialMediaAuditTrail() {
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [redeFilter, setRedeFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [onlyErrors, setOnlyErrors] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: a, error: aErr } = await supabase
      .from("social_media_drafts_audit")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (aErr) { toast.error(aErr.message); setLoading(false); return; }
    const rows = (a as AuditRow[]) ?? [];
    setAudit(rows);

    const ids = [...new Set(rows.map((r) => r.draft_id))];
    if (ids.length) {
      const { data: d } = await supabase
        .from("social_media_drafts")
        .select("id,rede,action,status,notes,scheduled_at,published_at,created_at")
        .in("id", ids);
      const map: Record<string, DraftRow> = {};
      (d as DraftRow[] | null)?.forEach((r) => (map[r.id] = r));
      setDrafts(map);
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const redes = useMemo(
    () => [...new Set(Object.values(drafts).map((d) => d.rede).filter(Boolean))] as string[],
    [drafts],
  );

  const filtered = useMemo(() => audit.filter((r) => {
    const d = drafts[r.draft_id];
    if (statusFilter !== "all" && r.to_status !== statusFilter) return false;
    if (redeFilter !== "all" && d?.rede !== redeFilter) return false;
    if (onlyErrors && !(r.to_status === "error" || /\[erro\]|\[tentativa /i.test(r.notes ?? ""))) return false;
    if (search) {
      const s = search.toLowerCase();
      const hay = [r.draft_id, r.notes, r.actor_email, JSON.stringify(r.metadata ?? {}), d?.rede, d?.action]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    return true;
  }), [audit, drafts, statusFilter, redeFilter, onlyErrors, search]);

  const errorRows = useMemo(
    () => filtered.filter((r) => r.to_status === "error" || /\[erro\]|\[tentativa /i.test(r.notes ?? "")),
    [filtered],
  );

  const copy = (v: string) => { navigator.clipboard.writeText(v); toast.success("Copiado"); };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Audit trail & Erros — Social Media</h1>
          <p className="text-muted-foreground text-sm">
            Histórico de transições e falhas de publicação por rascunho, com <code>request_id</code> e <code>details</code> quando disponíveis.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />Refrescar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Eventos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{filtered.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Erros</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-red-700">{errorRows.length}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Rascunhos únicos</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{new Set(filtered.map((r) => r.draft_id)).size}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Último evento</CardTitle></CardHeader>
          <CardContent><p className="text-xs">{filtered[0] ? new Date(filtered[0].created_at).toLocaleString("pt-PT") : "—"}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input
                className="w-64"
                placeholder="Procurar (draft_id, notes, request_id…)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {Object.keys(STATUS_LABEL).map((s) => (
                    <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={redeFilter} onValueChange={setRedeFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Rede" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as redes</SelectItem>
                  {redes.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                variant={onlyErrors ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyErrors((v) => !v)}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Só erros
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">A carregar…</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Quando</TableHead>
                <TableHead>Rascunho</TableHead>
                <TableHead>Transição</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const d = drafts[r.draft_id];
                  const info = parseErrorInfo(r);
                  const isError = r.to_status === "error" || !!info.attempt;
                  return (
                    <TableRow key={r.id} className={isError ? "bg-red-50/40" : ""}>
                      <TableCell className="text-xs whitespace-nowrap">
                        {new Date(r.created_at).toLocaleString("pt-PT")}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                          <span className="font-medium">{d?.rede ?? "—"} · {d?.action ?? "—"}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">{r.draft_id.slice(0, 8)}…</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-1 flex-wrap">
                          {r.from_status && (
                            <Badge variant="outline" className="text-[10px]">{STATUS_LABEL[r.from_status] ?? r.from_status}</Badge>
                          )}
                          <span>→</span>
                          <Badge className={STATUS_COLOR[r.to_status ?? ""] ?? ""} variant="secondary">
                            {STATUS_LABEL[r.to_status ?? ""] ?? r.to_status ?? r.action}
                          </Badge>
                          {info.attempt && (
                            <Badge variant="outline" className="text-[10px]">tentativa {info.attempt}</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        {r.actor_email ?? (r.actor_id ? r.actor_id.slice(0, 8) : <span className="italic text-muted-foreground">sistema/worker</span>)}
                      </TableCell>
                      <TableCell className="text-xs max-w-md">
                        {info.message && (
                          <p className={isError ? "text-red-800" : "text-muted-foreground"}>{info.message}</p>
                        )}
                        {!info.message && r.notes && (
                          <p className="text-muted-foreground italic line-clamp-2">"{r.notes}"</p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          {info.code && <Badge variant="outline" className="text-[10px] font-mono">{info.code}</Badge>}
                          {info.requestId && (
                            <button
                              onClick={() => copy(String(info.requestId))}
                              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border hover:bg-muted"
                              title="Copiar request_id"
                            >
                              <Copy className="h-2.5 w-2.5" />req:{String(info.requestId).slice(0, 8)}
                            </button>
                          )}
                        </div>
                        {info.details != null && (
                          <details className="mt-1">
                            <summary className="text-[10px] text-muted-foreground cursor-pointer">details</summary>
                            <pre className="bg-muted p-2 rounded text-[10px] mt-1 overflow-x-auto max-w-md whitespace-pre-wrap">
{JSON.stringify(info.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/admin/agentic-ai/social-media-drafts?draft=${r.draft_id}`}>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Sem eventos com esses filtros.
                  </TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
