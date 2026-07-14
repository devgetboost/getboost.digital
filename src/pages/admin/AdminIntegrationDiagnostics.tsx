import { useEffect, useMemo, useState } from "react";
import { diagList, diagClear, diagSubscribe, type DiagEntry } from "@/lib/integrationDiag";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RefreshCw, Trash2, ChevronDown, ChevronRight } from "lucide-react";

const fmtJson = (v: unknown) => {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
};

export default function AdminIntegrationDiagnostics() {
  const [entries, setEntries] = useState<DiagEntry[]>(diagList());
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "ok" | "error">("all");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => diagSubscribe(setEntries), []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return entries.filter(e => {
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      if (!q) return true;
      return (
        e.source.toLowerCase().includes(q) ||
        (e.error ?? "").toLowerCase().includes(q) ||
        JSON.stringify(e.request).toLowerCase().includes(q) ||
        JSON.stringify(e.response).toLowerCase().includes(q)
      );
    });
  }, [entries, filter, statusFilter]);

  const toggle = (id: string) => setExpanded(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Diagnóstico de Integrações</h1>
          <p className="text-sm text-muted-foreground">
            Últimas chamadas a IMAP, Gmail e CRM (guardadas localmente, máx. 100).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEntries(diagList())}>
            <RefreshCw className="h-4 w-4 mr-2" />Atualizar
          </Button>
          <Button variant="outline" size="sm" onClick={() => { diagClear(); setEntries([]); }}>
            <Trash2 className="h-4 w-4 mr-2" />Limpar
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input
          placeholder="Filtrar por função, erro, payload…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
        />
        {(["all", "ok", "error"] as const).map(s => (
          <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"}
            onClick={() => setStatusFilter(s)}>
            {s === "all" ? "Todos" : s === "ok" ? "OK" : "Erro"}
          </Button>
        ))}
      </div>

      <div className="border rounded-md divide-y">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Sem eventos. Faz uma ação na Caixa de Email ou dispara uma sincronização IMAP para começar a registar.
          </div>
        )}
        {filtered.map(e => {
          const open = expanded.has(e.id);
          return (
            <div key={e.id} className="text-sm">
              <button
                onClick={() => toggle(e.id)}
                className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 text-left"
              >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Badge variant={e.status === "error" ? "destructive" : "secondary"}>
                  {e.status.toUpperCase()}
                </Badge>
                <span className="font-mono text-xs">{e.source}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(e.ts).toLocaleString()} · {e.duration_ms}ms
                </span>
                {e.error && (
                  <span className="text-xs text-destructive truncate max-w-md ml-auto">
                    {e.error}
                  </span>
                )}
              </button>
              {open && (
                <div className="grid md:grid-cols-2 gap-3 p-3 bg-muted/30">
                  <div>
                    <div className="text-xs font-medium mb-1">Pedido</div>
                    <pre className="text-xs bg-background border rounded p-2 overflow-auto max-h-80">
                      {fmtJson(e.request)}
                    </pre>
                  </div>
                  <div>
                    <div className="text-xs font-medium mb-1">Resposta {e.error ? "/ Erro" : ""}</div>
                    <pre className="text-xs bg-background border rounded p-2 overflow-auto max-h-80">
                      {e.error ? e.error + "\n\n" + fmtJson(e.response) : fmtJson(e.response)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
