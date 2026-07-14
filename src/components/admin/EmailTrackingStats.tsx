import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, MousePointerClick, RefreshCw, Download, CalendarIcon, GitCompare, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip } from "recharts";

type LogRow = {
  message_id: string;
  status: string;
  recipient_email: string | null;
  rede: string | null;
};

const TEMPLATE = "social-media-draft-status";
const STATUS_BUCKETS = {
  sent: ["sent", "delivered", "opened", "clicked"],
  failed: ["failed", "dlq", "bounced"],
  suppressed: ["suppressed"],
} as const;

type StatusFilter = "all" | keyof typeof STATUS_BUCKETS;
type RangeMode = "7" | "30" | "custom";

export function EmailTrackingStats() {
  const [rangeMode, setRangeMode] = useState<RangeMode>("30");
  const [customRange, setCustomRange] = useState<DateRange | undefined>();
  const [rede, setRede] = useState<string>("all");
  const [recipient, setRecipient] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [compare, setCompare] = useState<boolean>(false);

  const [rows, setRows] = useState<LogRow[]>([]);
  const [clicks, setClicks] = useState<{ url: string | null; kind: string | null; message_id: string | null; recipient_email: string | null }[]>([]);
  const [opens, setOpens] = useState<{ message_id: string | null; recipient_email: string | null; opened_at: string }[]>([]);
  const [prevRows, setPrevRows] = useState<LogRow[]>([]);
  const [prevClicks, setPrevClicks] = useState<{ url: string | null; kind: string | null; message_id: string | null; recipient_email: string | null }[]>([]);
  const [prevOpens, setPrevOpens] = useState<{ message_id: string | null; recipient_email: string | null; opened_at: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const resolvedRange = useMemo(() => {
    if (rangeMode === "custom" && customRange?.from) {
      const from = new Date(customRange.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(customRange.to ?? customRange.from);
      to.setHours(23, 59, 59, 999);
      return { from, to };
    }
    const days = rangeMode === "7" ? 7 : 30;
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 3600 * 1000);
    return { from, to };
  }, [rangeMode, customRange]);

  const previousRange = useMemo(() => {
    const durationMs = resolvedRange.to.getTime() - resolvedRange.from.getTime();
    const to = new Date(resolvedRange.from.getTime() - 1);
    const from = new Date(to.getTime() - durationMs);
    return { from, to };
  }, [resolvedRange]);

  const fetchWindow = async (fromIso: string, toIso: string) => {
    const { data: logs } = await supabase
      .from("email_send_log")
      .select("message_id,status,recipient_email,metadata,created_at")
      .eq("template_name", TEMPLATE)
      .gte("created_at", fromIso)
      .lte("created_at", toIso)
      .order("created_at", { ascending: false })
      .limit(2000);

    const latest = new Map<string, LogRow>();
    for (const r of logs ?? []) {
      if (!r.message_id || latest.has(r.message_id)) continue;
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const redeVal = typeof meta.rede === "string" ? meta.rede : null;
      latest.set(r.message_id, {
        message_id: r.message_id,
        status: r.status,
        recipient_email: r.recipient_email,
        rede: redeVal,
      });
    }

    const { data: clickRows } = await supabase
      .from("email_link_clicks")
      .select("url,kind,message_id,recipient_email")
      .eq("template_name", TEMPLATE)
      .gte("clicked_at", fromIso)
      .lte("clicked_at", toIso)
      .limit(5000);

    const { data: openRows } = await supabase
      .from("email_opens")
      .select("message_id,recipient_email,opened_at")
      .eq("template_name", TEMPLATE)
      .gte("opened_at", fromIso)
      .lte("opened_at", toIso)
      .limit(5000);

    return { rows: Array.from(latest.values()), clicks: clickRows ?? [], opens: openRows ?? [] };
  };

  const load = async () => {
    setLoading(true);
    try {
      const cur = await fetchWindow(resolvedRange.from.toISOString(), resolvedRange.to.toISOString());
      setRows(cur.rows);
      setClicks(cur.clicks);
      setOpens(cur.opens);
      if (compare) {
        const prev = await fetchWindow(previousRange.from.toISOString(), previousRange.to.toISOString());
        setPrevRows(prev.rows);
        setPrevClicks(prev.clicks);
        setPrevOpens(prev.opens);
      } else {
        setPrevRows([]);
        setPrevClicks([]);
        setPrevOpens([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rangeMode === "custom" && !customRange?.from) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeMode, customRange?.from?.getTime(), customRange?.to?.getTime(), compare]);

  const redes = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => r.rede && s.add(r.rede));
    return Array.from(s).sort();
  }, [rows]);

  const recipients = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => r.recipient_email && s.add(r.recipient_email));
    return Array.from(s).sort();
  }, [rows]);

  const computeStats = (srcRows: LogRow[], srcClicks: typeof clicks, srcOpens: typeof opens) => {
    const bucketOf = (status: string): StatusFilter => {
      if ((STATUS_BUCKETS.sent as readonly string[]).includes(status)) return "sent";
      if ((STATUS_BUCKETS.failed as readonly string[]).includes(status)) return "failed";
      if ((STATUS_BUCKETS.suppressed as readonly string[]).includes(status)) return "suppressed";
      return "all";
    };

    const filtered = srcRows.filter(r => {
      if (rede !== "all" && r.rede !== rede) return false;
      if (recipient !== "all" && r.recipient_email !== recipient) return false;
      if (statusFilter !== "all" && bucketOf(r.status) !== statusFilter) return false;
      return true;
    });

    let sent = 0, suppressed = 0, failed = 0;
    for (const r of filtered) {
      const b = bucketOf(r.status);
      if (b === "sent") sent++;
      else if (b === "failed") failed++;
      else if (b === "suppressed") suppressed++;
    }

    const allowedMsgIds = new Set(filtered.map(r => r.message_id));
    const allowedRecipients = new Set(filtered.map(r => r.recipient_email).filter(Boolean) as string[]);

    const clicksByKind: Record<string, number> = {};
    let clicksTotal = 0;
    for (const c of srcClicks) {
      const matchesMsg = c.message_id ? allowedMsgIds.has(c.message_id) : false;
      const matchesRecipient = c.recipient_email ? allowedRecipients.has(c.recipient_email) : false;
      if (!matchesMsg && !matchesRecipient) continue;
      clicksTotal++;
      const k = c.kind || "link";
      clicksByKind[k] = (clicksByKind[k] ?? 0) + 1;
    }

    // Unique opens: dedupe by message_id (fallback to recipient) so multiple pixel
    // loads for the same email count once.
    const openedMsgIds = new Set<string>();
    for (const o of srcOpens) {
      const matchesMsg = o.message_id ? allowedMsgIds.has(o.message_id) : false;
      const matchesRecipient = o.recipient_email ? allowedRecipients.has(o.recipient_email) : false;
      if (!matchesMsg && !matchesRecipient) continue;
      const key = o.message_id || `r:${o.recipient_email ?? ""}`;
      if (key) openedMsgIds.add(key);
    }
    const opensTotal = openedMsgIds.size;

    return {
      total: filtered.length,
      sent, suppressed, failed,
      clicks: clicksTotal,
      clicksByKind,
      opens: opensTotal,
    };
  };

  const stats = useMemo(() => computeStats(rows, clicks, opens), [rows, clicks, opens, rede, recipient, statusFilter]);
  const prevStats = useMemo(() => computeStats(prevRows, prevClicks, prevOpens), [prevRows, prevClicks, prevOpens, rede, recipient, statusFilter]);


  const deliveryRate = stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0;
  const clickRate = stats.sent > 0 ? Math.round((stats.clicks / stats.sent) * 100) : 0;
  const openRate = stats.sent > 0 ? Math.round((stats.opens / stats.sent) * 100) : 0;
  const prevDeliveryRate = prevStats.total > 0 ? Math.round((prevStats.sent / prevStats.total) * 100) : 0;
  const prevClickRate = prevStats.sent > 0 ? Math.round((prevStats.clicks / prevStats.sent) * 100) : 0;
  const prevOpenRate = prevStats.sent > 0 ? Math.round((prevStats.opens / prevStats.sent) * 100) : 0;
  const hasData = stats.total > 0 || stats.clicks > 0 || stats.opens > 0;

  // Time series: unique opens per bucket (day if range ≤ 31 days, otherwise ISO week).
  const openTimeline = useMemo(() => {
    const from = resolvedRange.from;
    const to = resolvedRange.to;
    const spanDays = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 3600 * 1000)));
    const useWeek = spanDays > 31;

    const bucketKey = (d: Date) => {
      if (!useWeek) {
        return format(d, "yyyy-MM-dd");
      }
      // ISO week bucket: Monday of the week
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      const day = (x.getDay() + 6) % 7; // 0=Mon
      x.setDate(x.getDate() - day);
      return format(x, "yyyy-MM-dd");
    };
    const bucketLabel = (key: string) =>
      useWeek ? `Sem ${format(new Date(key), "dd/MM")}` : format(new Date(key), "dd/MM");

    // Seed all buckets so the chart shows zeros for empty days/weeks.
    const buckets = new Map<string, { key: string; label: string; opens: number; _seen: Set<string> }>();
    const cursor = new Date(from);
    cursor.setHours(0, 0, 0, 0);
    while (cursor <= to) {
      const k = bucketKey(cursor);
      if (!buckets.has(k)) buckets.set(k, { key: k, label: bucketLabel(k), opens: 0, _seen: new Set() });
      cursor.setDate(cursor.getDate() + (useWeek ? 7 : 1));
    }

    for (const o of opens) {
      if (!o.opened_at) continue;
      const d = new Date(o.opened_at);
      if (d < from || d > to) continue;
      const k = bucketKey(d);
      let b = buckets.get(k);
      if (!b) {
        b = { key: k, label: bucketLabel(k), opens: 0, _seen: new Set() };
        buckets.set(k, b);
      }
      const dedupeKey = o.message_id || `r:${o.recipient_email ?? ""}|${k}`;
      if (b._seen.has(dedupeKey)) continue;
      b._seen.add(dedupeKey);
      b.opens += 1;
    }

    return {
      granularity: useWeek ? "week" as const : "day" as const,
      data: Array.from(buckets.values())
        .sort((a, b) => a.key.localeCompare(b.key))
        .map(({ key, label, opens }) => ({ key, label, opens })),
    };
  }, [opens, resolvedRange]);


  const linkBreakdown = useMemo(() => {
    // Build allowed message_id/recipient sets from current filters
    const bucketOf = (status: string): StatusFilter => {
      if ((STATUS_BUCKETS.sent as readonly string[]).includes(status)) return "sent";
      if ((STATUS_BUCKETS.failed as readonly string[]).includes(status)) return "failed";
      if ((STATUS_BUCKETS.suppressed as readonly string[]).includes(status)) return "suppressed";
      return "all";
    };
    const filteredRows = rows.filter(r => {
      if (rede !== "all" && r.rede !== rede) return false;
      if (recipient !== "all" && r.recipient_email !== recipient) return false;
      if (statusFilter !== "all" && bucketOf(r.status) !== statusFilter) return false;
      return true;
    });
    const rowByMsgId = new Map(filteredRows.map(r => [r.message_id, r]));
    const allowedRecipients = new Set(filteredRows.map(r => r.recipient_email).filter(Boolean) as string[]);
    const sentDen = filteredRows.filter(r => bucketOf(r.status) === "sent").length;

    type Agg = {
      url: string;
      kind: string;
      clicks: number;
      uniqueRecipients: Set<string>;
      byRecipient: Map<string, number>;
      byStatus: Record<string, number>;
    };
    const map = new Map<string, Agg>();
    for (const c of clicks) {
      const inScope = (c.message_id && rowByMsgId.has(c.message_id))
        || (c.recipient_email && allowedRecipients.has(c.recipient_email));
      if (!inScope) continue;
      const url = c.url || "(sem url)";
      const kind = c.kind || "link";
      const key = `${kind}|${url}`;
      let agg = map.get(key);
      if (!agg) {
        agg = { url, kind, clicks: 0, uniqueRecipients: new Set(), byRecipient: new Map(), byStatus: {} };
        map.set(key, agg);
      }
      agg.clicks++;
      if (c.recipient_email) {
        agg.uniqueRecipients.add(c.recipient_email);
        agg.byRecipient.set(c.recipient_email, (agg.byRecipient.get(c.recipient_email) ?? 0) + 1);
      }
      const rowMatch = c.message_id ? rowByMsgId.get(c.message_id) : undefined;
      const statusKey = rowMatch ? bucketOf(rowMatch.status) : "unknown";
      agg.byStatus[statusKey] = (agg.byStatus[statusKey] ?? 0) + 1;
    }
    return {
      sentDen,
      items: Array.from(map.values())
        .map(a => ({
          ...a,
          uniqueRecipientsCount: a.uniqueRecipients.size,
          topRecipient: Array.from(a.byRecipient.entries()).sort((x, y) => y[1] - x[1])[0],
          ctrPct: sentDen > 0 ? +((a.clicks / sentDen) * 100).toFixed(2) : 0,
        }))
        .sort((x, y) => y.clicks - x.clicks),
    };
  }, [rows, clicks, rede, recipient, statusFilter]);

  const periodLabel =
    rangeMode === "custom"
      ? `${format(resolvedRange.from, "yyyy-MM-dd")}_${format(resolvedRange.to, "yyyy-MM-dd")}`
      : `${rangeMode}d`;

  const exportCSV = () => {
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const pct = (num: number, den: number) => (den > 0 ? +((num / den) * 100).toFixed(2) : 0);
    const kinds = Object.keys(stats.clicksByKind).sort();

    const deliveryRatePct = pct(stats.sent, stats.total);
    const failRatePct = pct(stats.failed, stats.total);
    const suppressedRatePct = pct(stats.suppressed, stats.total);
    const clickRatePct = pct(stats.clicks, stats.sent);

    const delta = (cur: number, prev: number) =>
      prev > 0 ? +(((cur - prev) / prev) * 100).toFixed(2) : (cur > 0 ? 100 : 0);

    const header = [
      "period", "from", "to", "rede", "recipient", "status_filter",
      "total", "sent", "failed", "suppressed",
      "delivery_rate_num", "delivery_rate_den", "delivery_rate_pct",
      "fail_rate_num", "fail_rate_den", "fail_rate_pct",
      "suppressed_rate_num", "suppressed_rate_den", "suppressed_rate_pct",
      "clicks",
      "click_rate_num", "click_rate_den", "click_rate_pct",
      "opens", "open_rate_num", "open_rate_den", "open_rate_pct",
      ...(compare ? [
        "prev_sent", "prev_opens", "prev_open_rate_pct",
        "opens_delta_pct", "open_rate_delta_pp",
      ] : []),
      ...kinds.flatMap(k => [`clicks_${k}`, `click_rate_${k}_num`, `click_rate_${k}_den`, `click_rate_${k}_pct`]),
    ];
    const row = [
      periodLabel, resolvedRange.from.toISOString(), resolvedRange.to.toISOString(),
      rede, recipient, statusFilter,
      stats.total, stats.sent, stats.failed, stats.suppressed,
      stats.sent, stats.total, deliveryRatePct,
      stats.failed, stats.total, failRatePct,
      stats.suppressed, stats.total, suppressedRatePct,
      stats.clicks,
      stats.clicks, stats.sent, clickRatePct,
      stats.opens, stats.opens, stats.sent, openRate,
      ...(compare ? [
        prevStats.sent, prevStats.opens, prevOpenRate,
        delta(stats.opens, prevStats.opens),
        +(openRate - prevOpenRate).toFixed(2),
      ] : []),
      ...kinds.flatMap(k => {
        const n = stats.clicksByKind[k] ?? 0;
        return [n, n, stats.sent, pct(n, stats.sent)];
      }),
    ];
    const csv = [header, row].map(r => r.map(esc).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-tracking-${periodLabel}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const customLabel = customRange?.from
    ? customRange.to && customRange.to.getTime() !== customRange.from.getTime()
      ? `${format(customRange.from, "dd/MM")} – ${format(customRange.to, "dd/MM")}`
      : format(customRange.from, "dd/MM/yyyy")
    : "Personalizado";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-2 flex-wrap">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Tracking de emails (rascunhos social media)
        </CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-md border overflow-hidden text-xs">
            {(["7", "30"] as const).map(d => (
              <button
                key={d}
                onClick={() => setRangeMode(d)}
                className={`px-2 py-1 ${rangeMode === d ? "bg-primary text-primary-foreground" : "bg-background"}`}
              >
                {d}d
              </button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  onClick={() => setRangeMode("custom")}
                  className={cn(
                    "px-2 py-1 flex items-center gap-1 border-l",
                    rangeMode === "custom" ? "bg-primary text-primary-foreground" : "bg-background"
                  )}
                >
                  <CalendarIcon className="h-3 w-3" />
                  {rangeMode === "custom" ? customLabel : "Personalizado"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={customRange}
                  onSelect={(r) => { setCustomRange(r); setRangeMode("custom"); }}
                  numberOfMonths={2}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            size="sm"
            variant={compare ? "default" : "ghost"}
            onClick={() => setCompare(v => !v)}
            title="Comparar com período anterior"
          >
            <GitCompare className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={exportCSV} disabled={!hasData} title="Exportar CSV">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <FilterSelect
            label="Rede"
            value={rede}
            onChange={setRede}
            options={[{ value: "all", label: "Todas as redes" }, ...redes.map(r => ({ value: r, label: r }))]}
          />
          <FilterSelect
            label="Destinatário"
            value={recipient}
            onChange={setRecipient}
            options={[{ value: "all", label: "Todos" }, ...recipients.map(r => ({ value: r, label: r }))]}
          />
          <FilterSelect
            label="Estado"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as StatusFilter)}
            options={[
              { value: "all", label: "Todos" },
              { value: "sent", label: "Entregues" },
              { value: "failed", label: "Falhados" },
              { value: "suppressed", label: "Suprimidos" },
            ]}
          />
        </div>

        {compare && (
          <p className="text-[11px] text-muted-foreground">
            A comparar {format(resolvedRange.from, "dd/MM")}–{format(resolvedRange.to, "dd/MM")} vs {format(previousRange.from, "dd/MM")}–{format(previousRange.to, "dd/MM")}
          </p>
        )}

        {!hasData ? (
          <p className="text-xs text-muted-foreground">Sem dados para os filtros seleccionados.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-sm">
              <Stat
                label="Enviados"
                value={stats.total}
                prev={compare ? prevStats.total : undefined}
                tooltip={"Total de emails únicos (deduplicados por message_id) no período.\nΔ% = (atual − anterior) / anterior × 100, comparado com o período de igual duração imediatamente anterior."}
              />
              <Stat
                label="Entregues"
                value={stats.sent}
                hint={`${deliveryRate}%`}
                prev={compare ? prevStats.sent : undefined}
                prevHint={compare ? `${prevDeliveryRate}%` : undefined}
                tooltip={"Emails com estado 'sent/delivered/opened/clicked'.\nTaxa de entrega = entregues / enviados × 100.\nΔ% compara contagens de entregues (atual vs período anterior de igual duração)."}
              />
              <Stat
                label="Falhados"
                value={stats.failed}
                prev={compare ? prevStats.failed : undefined}
                invertDelta
                tooltip={"Emails com estado 'failed/dlq/bounced'.\nΔ% = (atual − anterior) / anterior × 100. Aqui uma descida é positiva (verde)."}
              />
              <Stat
                label="Suprimidos"
                value={stats.suppressed}
                prev={compare ? prevStats.suppressed : undefined}
                invertDelta
                tooltip={"Emails bloqueados por lista de supressão.\nΔ% = (atual − anterior) / anterior × 100. Uma descida é positiva (verde)."}
              />
              <Stat
                label="Aberturas"
                value={stats.opens}
                hint={`Abertura ${openRate}%`}
                prev={compare ? prevStats.opens : undefined}
                prevHint={compare ? `Abertura ${prevOpenRate}%` : undefined}
                tooltip={"Aberturas únicas por email (deduplicadas por message_id) detectadas via pixel 1×1.\nTaxa de abertura = aberturas / entregues × 100.\nNota: clientes de email que bloqueiam imagens (ou Apple Mail Privacy Protection) subestimam ou inflacionam este valor."}
              />
              <Stat
                label="Cliques"
                value={stats.clicks}
                hint={`CTR ${clickRate}%`}
                prev={compare ? prevStats.clicks : undefined}
                prevHint={compare ? `CTR ${prevClickRate}%` : undefined}
                tooltip={"Cliques únicos nos links rastreados dos emails do período.\nCTR = cliques / entregues × 100.\nΔ% compara contagens de cliques (atual vs período anterior de igual duração)."}
              />

            </div>
            {openTimeline.data.length > 0 && (
              <div className="rounded-md border p-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    Evolução de aberturas ({openTimeline.granularity === "week" ? "por semana" : "por dia"})
                  </p>
                  <p className="text-[11px] text-muted-foreground">Total {stats.opens}</p>
                </div>
                <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={openTimeline.data} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={32} />
                      <ReTooltip
                        contentStyle={{ fontSize: 12, background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                        labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                        formatter={(v: number) => [v, "Aberturas"]}
                      />
                      <Line type="monotone" dataKey="opens" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            {Object.keys(stats.clicksByKind).length > 0 && (
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(stats.clicksByKind).map(([k, n]) => (
                  <span key={k} className="inline-flex items-center gap-1 rounded-md border px-2 py-0.5">
                    <MousePointerClick className="h-3 w-3" /> {k}: <strong>{n}</strong>
                  </span>
                ))}
              </div>
            )}
            {linkBreakdown.items.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <div className="px-2 py-1.5 border-b bg-muted/40 text-[11px] uppercase tracking-wide text-muted-foreground">
                  Detalhe por link ({linkBreakdown.items.length}) — CTR = cliques / entregues ({linkBreakdown.sentDen}) × 100
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/20 text-muted-foreground">
                      <tr>
                        <th scope="col" className="text-left px-2 py-1.5 font-medium">Tipo</th>
                        <th scope="col" className="text-left px-2 py-1.5 font-medium">URL</th>
                        <th scope="col" className="text-right px-2 py-1.5 font-medium">Cliques</th>
                        <th scope="col" className="text-right px-2 py-1.5 font-medium">Únicos</th>
                        <th scope="col" className="text-right px-2 py-1.5 font-medium">CTR</th>
                        <th scope="col" className="text-left px-2 py-1.5 font-medium">Top destinatário</th>
                        <th scope="col" className="text-left px-2 py-1.5 font-medium">Por estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkBreakdown.items.map((it) => (
                        <tr key={`${it.kind}|${it.url}`} className="border-t">
                          <td className="px-2 py-1.5">
                            <span className="inline-flex items-center gap-1">
                              <MousePointerClick className="h-3 w-3" /> {it.kind}
                            </span>
                          </td>
                          <td className="px-2 py-1.5 max-w-[280px]">
                            {it.url.startsWith("http") ? (
                              <a
                                href={it.url}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="text-primary hover:underline block truncate"
                                title={it.url}
                              >
                                {it.url}
                              </a>
                            ) : (
                              <span className="block truncate text-muted-foreground" title={it.url}>{it.url}</span>
                            )}
                          </td>
                          <td className="px-2 py-1.5 text-right font-medium">{it.clicks}</td>
                          <td className="px-2 py-1.5 text-right">{it.uniqueRecipientsCount}</td>
                          <td className="px-2 py-1.5 text-right">{it.ctrPct}%</td>
                          <td className="px-2 py-1.5 truncate max-w-[180px]" title={it.topRecipient?.[0] ?? ""}>
                            {it.topRecipient ? `${it.topRecipient[0]} (${it.topRecipient[1]})` : "—"}
                          </td>
                          <td className="px-2 py-1.5">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(it.byStatus).map(([s, n]) => (
                                <span key={s} className="rounded border px-1.5 py-0.5">{s}: <strong>{n}</strong></span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function FilterSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Stat({
  label, value, hint, prev, prevHint, invertDelta, tooltip,
}: {
  label: string;
  value: number;
  hint?: string;
  prev?: number;
  prevHint?: string;
  invertDelta?: boolean;
  tooltip?: string;
}) {
  let deltaNode: ReactNode = null;
  if (prev !== undefined) {
    const diff = value - prev;
    const pct = prev > 0 ? (diff / prev) * 100 : (value > 0 ? 100 : 0);
    const isFlat = diff === 0;
    const isUp = diff > 0;
    const good = isFlat ? true : invertDelta ? !isUp : isUp;
    const Icon = isFlat ? Minus : isUp ? ArrowUpRight : ArrowDownRight;
    const cls = isFlat
      ? "text-muted-foreground"
      : good
        ? "text-emerald-600"
        : "text-red-600";
    const sign = isFlat ? "" : isUp ? "+" : "";
    deltaNode = (
      <p className={`text-[11px] flex items-center gap-0.5 ${cls}`}>
        <Icon className="h-3 w-3" />
        {sign}{Math.round(pct)}% <span className="text-muted-foreground">(ant. {prev}{prevHint ? ` · ${prevHint}` : ""})</span>
      </p>
    );
  }

  return (
    <div className="rounded-md border p-2">
      <div className="flex items-center gap-1">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        {tooltip && (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`Como é calculado: ${label}`}
                  className="inline-flex items-center justify-center h-5 w-5 rounded-sm text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                >
                  <Info className="h-3 w-3" aria-hidden="true" />
                  <span className="sr-only">Como é calculado: {label}</span>
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                role="tooltip"
                className="max-w-[min(320px,calc(100vw-2rem))] max-h-[50vh] overflow-y-auto text-xs leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere]"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      <p className="text-lg font-semibold leading-tight">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {deltaNode}
    </div>
  );
}
