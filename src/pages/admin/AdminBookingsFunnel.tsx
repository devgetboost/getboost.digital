import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

const STATUS_FILL: Record<string, string> = {
  new: "#94a3b8",
  contacted: "#3b82f6",
  booked: "#f59e0b",
  completed: "#10b981",
  cancelled: "#ef4444",
};

type Booking = {
  id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  status: string | null;
  lead_status: string | null;
  language: string | null;
  meeting_link: string | null;
  jitsi_room: string | null;
  created_at: string;
};

const LEAD_STATUSES = ["new", "contacted", "booked", "completed", "cancelled"] as const;
const LANGUAGES = ["pt", "en", "es"] as const;
const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
  { value: "all", label: "Sempre" },
] as const;

const STATUS_COLOR: Record<string, string> = {
  new: "bg-slate-100 text-slate-800",
  contacted: "bg-blue-100 text-blue-900",
  booked: "bg-amber-100 text-amber-900",
  completed: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

export default function AdminBookingsFunnel() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadStatus, setLeadStatus] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");
  const [period, setPeriod] = useState<string>("30");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("bookings")
      .select("id,name,email,company,meeting_date,meeting_time,status,lead_status,language,meeting_link,jitsi_room,created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (period !== "all") {
      const since = new Date();
      since.setDate(since.getDate() - Number(period));
      q = q.gte("created_at", since.toISOString());
    }
    if (leadStatus !== "all") q = q.eq("lead_status", leadStatus);
    if (language !== "all") q = q.eq("language", language);

    const { data, error } = await q;
    if (error) toast.error(error.message);
    else setRows((data as Booking[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [leadStatus, language, period]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();
    return rows.filter((r) =>
      [r.name, r.email, r.company].filter(Boolean).some((v) => v!.toLowerCase().includes(s)),
    );
  }, [rows, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: filtered.length };
    for (const s of LEAD_STATUSES) c[s] = 0;
    filtered.forEach((r) => { if (r.lead_status) c[r.lead_status] = (c[r.lead_status] ?? 0) + 1; });
    return c;
  }, [filtered]);

  const funnelData = useMemo(
    () => LEAD_STATUSES.map((s) => ({ status: s, count: counts[s] ?? 0 })),
    [counts],
  );

  const meetingUrl = (r: Booking) =>
    r.meeting_link || (r.jitsi_room ? `https://meet.jit.si/${r.jitsi_room}` : null);

  const exportCountsCsv = () => {
    const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? period;
    const langLabel = language === "all" ? "todos" : language.toUpperCase();
    const statusLabel = leadStatus === "all" ? "todos" : leadStatus;
    const generatedAt = new Date().toISOString();
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["periodo", "idioma", "lead_status_filtro", "gerado_em"].join(","),
      [periodLabel, langLabel, statusLabel, generatedAt].map(esc).join(","),
      "",
      ["lead_status", "count"].join(","),
      ["total", counts.total].map(esc).join(","),
      ...LEAD_STATUSES.map((s) => [s, counts[s] ?? 0].map(esc).join(",")),
    ];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funil-bookings_${period}_${language}_${leadStatus}_${generatedAt.slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Funil de Bookings</h1>
          <p className="text-muted-foreground text-sm">
            Filtra por <code>lead_status</code>, idioma e período. Vê contagens e o meeting_link.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportCountsCsv} disabled={loading}>
            <Download className="h-3.5 w-3.5 mr-1" />Exportar CSV
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />Refrescar
          </Button>
        </div>

      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card><CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Total</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{counts.total}</p></CardContent></Card>
        {LEAD_STATUSES.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{s}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{counts[s] ?? 0}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funil por lead_status</CardTitle>
          <p className="text-xs text-muted-foreground">
            Contagens no período selecionado ({PERIODS.find((p) => p.value === period)?.label ?? period}).
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="status" width={90} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelData.map((d) => (
                    <Cell key={d.status} fill={STATUS_FILL[d.status] ?? "#64748b"} />
                  ))}
                  <LabelList dataKey="count" position="right" className="fill-foreground text-xs" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <CardTitle className="text-base">Filtros</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Input className="w-64" placeholder="Procurar (nome, email, empresa)"
                value={search} onChange={(e) => setSearch(e.target.value)} />
              <Select value={leadStatus} onValueChange={setLeadStatus}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os idiomas</SelectItem>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-sm text-muted-foreground">A carregar…</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Criado</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Reunião</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Idioma</TableHead>
                <TableHead>Meeting link</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const url = meetingUrl(r);
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs whitespace-nowrap">
                        <Link to={`/admin/bookings-funnel/${r.id}`} className="text-primary hover:underline">
                          {new Date(r.created_at).toLocaleString("pt-PT")}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="font-medium">{r.name ?? "—"}</div>
                        <div className="text-muted-foreground">{r.email ?? ""}</div>
                        {r.company && <div className="text-muted-foreground">{r.company}</div>}
                      </TableCell>
                      <TableCell className="text-xs whitespace-nowrap">
                        {r.meeting_date ?? "—"}{r.meeting_time ? ` · ${r.meeting_time}` : ""}
                      </TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col gap-1">
                          <Badge className={STATUS_COLOR[r.lead_status ?? ""] ?? ""} variant="secondary">
                            {r.lead_status ?? "—"}
                          </Badge>
                          {r.status && <span className="text-[10px] text-muted-foreground">booking: {r.status}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{(r.language ?? "—").toUpperCase()}</TableCell>
                      <TableCell className="text-xs max-w-xs truncate">
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer"
                             className="inline-flex items-center gap-1 text-primary hover:underline">
                            <ExternalLink className="h-3 w-3" />
                            <span className="truncate">{url}</span>
                          </a>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-6">
                    Sem bookings com esses filtros.
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
