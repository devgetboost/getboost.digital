import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import MarketTabs from '@/components/admin/MarketTabs';
import {
  BOOKING_STATUS_LABELS,
  BOOKING_STATUSES,
  listBookings,
  logAdminAction,
  type BookingAdminRow,
  type BookingStatus,
  type MarketCode,
} from '@/lib/adminContent';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from "recharts";

/**
 * R1C8: the funnel reads Clean V1 `bookings`. The retired columns
 * (`meeting_date`, `meeting_time`, `lead_status`, `language`, `meeting_link`,
 * `jitsi_room`) have no Clean V1 carrier — `bookings` stores absolute
 * `start_at`/`end_at` instants instead. The funnel now groups by the booking
 * lifecycle status and filters by market.
 */
const STATUS_FILL: Record<BookingStatus, string> = {
  requested: "#94a3b8",
  confirmed: "#3b82f6",
  completed: "#10b981",
  cancelled: "#ef4444",
  no_show: "#f59e0b",
};

type Booking = BookingAdminRow;

const BOOKING_STATUS_LIST = BOOKING_STATUSES;
const PERIODS = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
  { value: "365", label: "Último ano" },
  { value: "all", label: "Sempre" },
] as const;

const STATUS_COLOR: Record<BookingStatus, string> = {
  requested: "bg-slate-100 text-slate-800",
  confirmed: "bg-blue-100 text-blue-900",
  completed: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
  no_show: "bg-amber-100 text-amber-900",
};

export default function AdminBookingsFunnel() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [marketFilter, setMarketFilter] = useState<MarketCode | "all">("all");
  const [period, setPeriod] = useState<string>("30");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const all = await listBookings(500);
      setRows(all);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Period is a client-side window now: the shared reader returns newest-first.
  const inPeriod = (createdAt: string) => {
    if (period === "all") return true;
    const since = new Date();
    since.setDate(since.getDate() - Number(period));
    return new Date(createdAt) >= since;
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return rows.filter(
      (r) =>
        inPeriod(r.created_at) &&
        (statusFilter === "all" || r.status === statusFilter) &&
        (marketFilter === "all" || r.market === marketFilter) &&
        (!search || [r.name, r.email, r.company].filter(Boolean).some((v) => v!.toLowerCase().includes(s))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, statusFilter, marketFilter, period]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { total: filtered.length };
    for (const s of BOOKING_STATUS_LIST) c[s] = 0;
    filtered.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1; });
    return c;
  }, [filtered]);

  const funnelData = useMemo(
    () => BOOKING_STATUS_LIST.map((s) => ({ status: s, count: counts[s] ?? 0 })),
    [counts],
  );

  const meetingWhen = (r: Booking) =>
    `${new Date(r.start_at).toLocaleString("pt-PT")} → ${new Date(r.end_at).toLocaleString("pt-PT")}`;

  const exportCountsCsv = () => {
    const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? period;
    const marketLabel = marketFilter === "all" ? "todos" : marketFilter;
    const statusLabel = statusFilter === "all" ? "todos" : BOOKING_STATUS_LABELS[statusFilter];
    const generatedAt = new Date().toISOString();
    const esc = (v: string | number) => {
      const s = String(v);
      return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const lines = [
      ["periodo", "mercado", "estado_filtro", "gerado_em"].join(","),
      [periodLabel, marketLabel, statusLabel, generatedAt].map(esc).join(","),
      "",
      ["estado", "count"].join(","),
      ["total", counts.total].map(esc).join(","),
      ...BOOKING_STATUS_LIST.map((s) => [s, counts[s] ?? 0].map(esc).join(",")),
    ];
    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `funil-bookings_${period}_${marketFilter}_${statusFilter}_${generatedAt.slice(0, 10)}.csv`;
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
            Filtra por estado, mercado e período.
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
        {BOOKING_STATUS_LIST.map((s) => (
          <Card key={s}>
            <CardHeader className="pb-2"><CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">{BOOKING_STATUS_LABELS[s]}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{counts[s] ?? 0}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Funil por estado</CardTitle>
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
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as BookingStatus | "all")}>
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {BOOKING_STATUS_LIST.map((s) => <SelectItem key={s} value={s}>{BOOKING_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
              <MarketTabs value={marketFilter} onChange={setMarketFilter} />
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
                <TableHead>Mercado</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((r) => (
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
                      {meetingWhen(r)}
                      <div className="text-muted-foreground">{r.timezone}</div>
                    </TableCell>
                    <TableCell className="text-xs">
                      <Badge className={STATUS_COLOR[r.status]} variant="secondary">
                        {BOOKING_STATUS_LABELS[r.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs">{r.market} · {r.locale}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">
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
