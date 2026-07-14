import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { RefreshCw, AlertTriangle, Activity, CheckCircle2, Clock, XCircle, SkipForward } from "lucide-react";
import { Link } from "react-router-dom";

type Draft = {
  id: string;
  rede: string | null;
  action: string;
  status: string;
  notes: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  updated_at: string;
  created_at: string;
};

// Extrai a última mensagem de erro/tentativa do campo notes (formato usado
// pelo social-media-publisher: `[tentativa N] mensagem — ISO`).
function extractError(notes: string | null): { message: string; iso: string | null } | null {
  if (!notes) return null;
  const parts = notes.split(/\s\|\s/).map(s => s.trim()).filter(Boolean);
  const last = parts[0]; // o publisher escreve sempre o mais recente no início
  if (!last || /^Publicado/i.test(last)) return null;
  if (!/\[tentativa \d+\]|\[erro\]/i.test(last)) return null;
  const iso = last.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*)/)?.[1] ?? null;
  const message = last
    .replace(/\[tentativa \d+\]\s*/i, "")
    .replace(/\[erro\]\s*/i, "")
    .replace(/\s*—\s*\d{4}-\d{2}-\d{2}T.*$/, "")
    .trim();
  return { message: message || last, iso };
}

const STATUS_META: Record<string, { label: string; icon: any; color: string; badge: string }> = {
  scheduled:  { label: "Agendados",   icon: Clock,        color: "text-blue-700",   badge: "bg-blue-100 text-blue-900" },
  publishing: { label: "A publicar",  icon: Activity,     color: "text-amber-700",  badge: "bg-amber-100 text-amber-900" },
  published:  { label: "Publicados",  icon: CheckCircle2, color: "text-green-700",  badge: "bg-green-100 text-green-900" },
  rejected:   { label: "Falhados",    icon: XCircle,      color: "text-red-700",    badge: "bg-red-100 text-red-900" },
  error:      { label: "Erro",        icon: AlertTriangle,color: "text-red-700",    badge: "bg-red-100 text-red-900" },
  skipped:    { label: "Ignorados",   icon: SkipForward,  color: "text-slate-600",  badge: "bg-slate-200 text-slate-700" },
};

const NETWORKS = ["linkedin", "tiktok", "x", "twitter", "facebook", "instagram", "youtube"] as const;
const NETWORK_LABEL: Record<string, string> = {
  linkedin: "LinkedIn", tiktok: "TikTok", x: "X", twitter: "X",
  facebook: "Facebook", instagram: "Instagram", youtube: "YouTube",
};
const normalizeRede = (r: string | null) => {
  const v = (r ?? "").trim().toLowerCase();
  return v === "twitter" ? "x" : v;
};

export default function AdminSocialMediaPublisherMonitor() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [redeFilter, setRedeFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    // Janela de 7 dias para métricas + últimas execuções.
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const { data, error } = await supabase
      .from("social_media_drafts")
      .select("id,rede,action,status,notes,scheduled_at,published_at,updated_at,created_at")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) toast.error(error.message);
    setDrafts((data as Draft[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000); // refresh automático a cada 30s
    return () => clearInterval(t);
  }, []);

  // Filtro por rede aplicado a todas as secções (contagens, erros, publicados).
  const scoped = useMemo(
    () => (redeFilter === "all" ? drafts : drafts.filter(d => normalizeRede(d.rede) === redeFilter)),
    [drafts, redeFilter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { scheduled: 0, publishing: 0, published: 0, rejected: 0, error: 0, skipped: 0 };
    for (const d of scoped) c[d.status] = (c[d.status] ?? 0) + 1;
    return c;
  }, [scoped]);

  // Matriz rede × falhas (rejected+error) sobre o dataset completo — a matriz
  // é sempre útil independentemente do filtro activo (por isso não usa `scoped`).
  const perNetwork = useMemo(() => {
    const map = new Map<string, { total: number; failed: number; published: number; scheduled: number }>();
    for (const d of drafts) {
      const key = normalizeRede(d.rede) || "—";
      const row = map.get(key) ?? { total: 0, failed: 0, published: 0, scheduled: 0 };
      row.total += 1;
      if (d.status === "rejected" || d.status === "error") row.failed += 1;
      if (d.status === "published") row.published += 1;
      if (d.status === "scheduled" || d.status === "publishing") row.scheduled += 1;
      map.set(key, row);
    }
    return Array.from(map.entries())
      .map(([rede, v]) => ({ rede, ...v }))
      .sort((a, b) => b.failed - a.failed || b.total - a.total);
  }, [drafts]);

  // Agregação de erros: agrupa por (rede, mensagem normalizada).
  const errorGroups = useMemo(() => {
    const map = new Map<string, { rede: string; message: string; count: number; last: string; drafts: Draft[] }>();
    for (const d of scoped) {
      if (!["rejected", "error"].includes(d.status)) continue;
      const e = extractError(d.notes);
      if (!e) continue;
      const rede = normalizeRede(d.rede) || "—";
      const key = `${rede}::${e.message.slice(0, 200)}`;
      const prev = map.get(key);
      const iso = e.iso ?? d.updated_at;
      if (prev) {
        prev.count += 1;
        if (iso > prev.last) prev.last = iso;
        prev.drafts.push(d);
      } else {
        map.set(key, { rede, message: e.message, count: 1, last: iso, drafts: [d] });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 20);
  }, [scoped]);

  const recentPublished = useMemo(
    () => scoped.filter(d => d.status === "published").slice(0, 10),
    [scoped],
  );

  const runNow = async () => {
    setRunning(true);
    const t = toast.loading("A correr o publisher…");
    try {
      const { data, error } = await supabase.functions.invoke("social-media-publisher", { body: {} });
      if (error) throw error;
      toast.success(`Publisher executado — ${data?.processed ?? 0} draft(s) processado(s)`, { id: t });
      load();
    } catch (e: any) {
      toast.error(`Falha: ${e?.message ?? e}`, { id: t });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monitoring — Social Media Publisher</h1>
          <p className="text-muted-foreground text-sm">
            Estado dos drafts nas últimas 7 dias · atualiza automaticamente a cada 30s.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button size="sm" onClick={runNow} disabled={running}>
            <Activity className="h-4 w-4 mr-1" />Correr publisher agora
          </Button>
        </div>
      </div>

      {/* Filtro por rede — aplica a contagens, erros e publicados. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground mr-1">Filtrar por rede:</span>
        {(["all", ...NETWORKS.filter(n => n !== "twitter")] as string[]).map(n => {
          const active = redeFilter === n;
          const label = n === "all" ? "Todas" : NETWORK_LABEL[n] ?? n;
          const count = n === "all" ? drafts.length : drafts.filter(d => normalizeRede(d.rede) === n).length;
          return (
            <Button
              key={n}
              size="sm"
              variant={active ? "default" : "outline"}
              onClick={() => setRedeFilter(n)}
              className="h-7 text-xs"
            >
              {label} <span className="ml-1 opacity-70">({count})</span>
            </Button>
          );
        })}
      </div>

      {/* Contagens por estado */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {Object.entries(STATUS_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
                  <Icon className={`h-3.5 w-3.5 ${meta.color}`} />{meta.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${meta.color}`}>{counts[key] ?? 0}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Matriz por rede social (sempre dataset completo) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Por rede social (7 dias)</CardTitle>
        </CardHeader>
        <CardContent>
          {perNetwork.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem drafts na janela.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Rede</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Publicados</TableHead>
                <TableHead className="text-right">Agendados/A publicar</TableHead>
                <TableHead className="text-right">Falhados</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {perNetwork.map(r => (
                  <TableRow key={r.rede} className={redeFilter === r.rede ? "bg-muted/50" : ""}>
                    <TableCell className="font-medium">{NETWORK_LABEL[r.rede] ?? r.rede}</TableCell>
                    <TableCell className="text-right">{r.total}</TableCell>
                    <TableCell className="text-right text-green-700">{r.published}</TableCell>
                    <TableCell className="text-right text-blue-700">{r.scheduled}</TableCell>
                    <TableCell className="text-right">
                      {r.failed > 0
                        ? <Badge variant="secondary" className="bg-red-100 text-red-900">{r.failed}</Badge>
                        : <span className="text-muted-foreground">0</span>}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="h-6 text-xs"
                        onClick={() => setRedeFilter(redeFilter === r.rede ? "all" : r.rede)}>
                        {redeFilter === r.rede ? "Limpar" : "Filtrar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Erros agregados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-red-700" /> Últimos erros agregados
            {redeFilter !== "all" && (
              <Badge variant="outline" className="ml-2 text-xs">{NETWORK_LABEL[redeFilter] ?? redeFilter}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : errorGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem erros na janela de 7 dias 🎉</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-16">#</TableHead>
                <TableHead className="w-24">Rede</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead className="w-40">Último</TableHead>
                <TableHead>Drafts</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {errorGroups.map((g, i) => (
                  <TableRow key={i}>
                    <TableCell><Badge variant="secondary" className="bg-red-100 text-red-900">{g.count}×</Badge></TableCell>
                    <TableCell className="text-xs"><Badge variant="outline">{NETWORK_LABEL[g.rede] ?? g.rede}</Badge></TableCell>
                    <TableCell className="text-xs font-mono">{g.message}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(g.last).toLocaleString("pt-PT")}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex flex-wrap gap-1">
                        {g.drafts.slice(0, 5).map(d => (
                          <Link key={d.id} to="/admin/agentic-ai/social-media-drafts" className="underline text-primary">
                            {d.rede ?? "—"}/{d.action}
                          </Link>
                        ))}
                        {g.drafts.length > 5 && <span className="text-muted-foreground">+{g.drafts.length - 5}</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Últimos publicados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-green-700" /> Últimos publicados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentPublished.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum draft publicado ainda.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Rede</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Publicado em</TableHead>
                <TableHead>Nota</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {recentPublished.map(d => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium text-sm">{d.rede ?? "—"}</TableCell>
                    <TableCell className="text-xs">{d.action}</TableCell>
                    <TableCell className="text-xs">{d.published_at ? new Date(d.published_at).toLocaleString("pt-PT") : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-xs">{d.notes ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
