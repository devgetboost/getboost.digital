import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Trash2 } from "lucide-react";

type AuditRow = {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  account_id: string | null;
  provider: string | null;
  thread_ids: string[];
  subjects: string[];
  thread_count: number;
  created_at: string;
};

export default function AdminEmailDeletionAudit() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_deletion_audit" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows((data ?? []) as any as AuditRow[]);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao carregar registos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = rows.filter((r) => {
    if (!q) return true;
    const needle = q.toLowerCase();
    return (
      (r.actor_email ?? "").toLowerCase().includes(needle) ||
      (r.provider ?? "").toLowerCase().includes(needle) ||
      (r.subjects ?? []).some((s) => s?.toLowerCase().includes(needle)) ||
      (r.thread_ids ?? []).some((t) => t?.toLowerCase().includes(needle))
    );
  });

  const fmt = (iso: string) =>
    new Intl.DateTimeFormat("pt-PT", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(new Date(iso));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Trash2 className="h-5 w-5" /> Auditoria de eliminações de email
          </h1>
          <p className="text-sm text-muted-foreground">Quem eliminou, quando e quais threads.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Filtrar por email, assunto ou thread…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-64"
          />
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-2 font-medium">Data</th>
                <th className="px-4 py-2 font-medium">Utilizador</th>
                <th className="px-4 py-2 font-medium">Provider</th>
                <th className="px-4 py-2 font-medium text-center">Threads</th>
                <th className="px-4 py-2 font-medium">Assuntos</th>
                <th className="px-4 py-2 font-medium">IDs</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? "A carregar…" : "Sem registos."}
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-4 py-2 whitespace-nowrap">{fmt(r.created_at)}</td>
                  <td className="px-4 py-2">{r.actor_email ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-2">{r.provider ?? "—"}</td>
                  <td className="px-4 py-2 text-center">{r.thread_count}</td>
                  <td className="px-4 py-2 max-w-md">
                    <div className="flex flex-col gap-0.5">
                      {(r.subjects ?? []).slice(0, 3).map((s, i) => (
                        <span key={i} className="truncate">{s || "(sem assunto)"}</span>
                      ))}
                      {(r.subjects?.length ?? 0) > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{(r.subjects?.length ?? 0) - 3} mais
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground max-w-xs truncate">
                    {(r.thread_ids ?? []).join(", ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
