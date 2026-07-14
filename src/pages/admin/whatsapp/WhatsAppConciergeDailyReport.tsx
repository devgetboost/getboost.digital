import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, CheckCircle2, AlertTriangle, Calendar, Link2,
  Printer, TrendingUp, TrendingDown, Minus, ShieldAlert, Filter, X,
} from "lucide-react";
import ViolationDrilldownDialog from "./ViolationDrilldownDialog";

const THRESHOLD_STORAGE_KEY = "wa-concierge-valid-threshold";
const DEFAULT_THRESHOLD = 80;

type Row = {
  conversation_id: string | null;
  persona_ok: boolean;
  single_question_ok: boolean;
  pt_pt_ok: boolean;
  has_meeting_invite: boolean;
  has_booking_link: boolean;
  overridden: boolean;
  override_reason: string | null;
  violations: string[];
  created_at: string;
};

type ConvMeta = { channel: string | null; contact_phone: string | null };

type Metrics = {
  total: number;
  valid: number;
  validPct: number;
  personaViolations: number;
  multiQuestionViolations: number;
  ptBrViolations: number;
  overrides: number;
  meetingInvites: number;
  bookingLinks: number;
  bookingsCreated: number;
};

const ONE_DAY_MS = 24 * 3600 * 1000;

function toLocalInput(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function fetchWindow(from: Date, to: Date): Promise<{ rows: Row[]; bookings: number; convMap: Map<string, ConvMeta> }> {
  const [{ data: rows }, { count }] = await Promise.all([
    supabase
      .from("whatsapp_concierge_checks")
      .select("conversation_id,persona_ok,single_question_ok,pt_pt_ok,has_meeting_invite,has_booking_link,overridden,override_reason,violations,created_at")
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString())
      .order("created_at", { ascending: true })
      .limit(5000),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString()),
  ]);

  const typedRows = (rows || []) as Row[];
  const convMap = new Map<string, ConvMeta>();
  const ids = Array.from(new Set(typedRows.map(r => r.conversation_id).filter((x): x is string => !!x)));
  if (ids.length) {
    const { data: convs } = await supabase
      .from("whatsapp_conversations")
      .select("id,channel,contact_phone")
      .in("id", ids);
    for (const c of convs || []) {
      convMap.set(c.id as string, { channel: (c as any).channel ?? null, contact_phone: (c as any).contact_phone ?? null });
    }
  }
  return { rows: typedRows, bookings: count ?? 0, convMap };
}

function computeMetrics(rows: Row[], bookings: number): Metrics {
  const total = rows.length;
  const valid = rows.filter(x => x.persona_ok && x.single_question_ok && x.pt_pt_ok && !x.overridden).length;
  return {
    total,
    valid,
    validPct: total ? Math.round((valid / total) * 100) : 0,
    personaViolations: rows.filter(x => !x.persona_ok).length,
    multiQuestionViolations: rows.filter(x => !x.single_question_ok).length,
    ptBrViolations: rows.filter(x => !x.pt_pt_ok).length,
    overrides: rows.filter(x => x.overridden).length,
    meetingInvites: rows.filter(x => x.has_meeting_invite).length,
    bookingLinks: rows.filter(x => x.has_booking_link).length,
    bookingsCreated: bookings,
  };
}

function delta(curr: number, prev: number): { pct: number; dir: "up" | "down" | "flat" } {
  if (prev === 0 && curr === 0) return { pct: 0, dir: "flat" };
  if (prev === 0) return { pct: 100, dir: "up" };
  const pct = Math.round(((curr - prev) / prev) * 100);
  return { pct, dir: pct > 0 ? "up" : pct < 0 ? "down" : "flat" };
}

export default function WhatsAppConciergeDailyReport() {
  const [loading, setLoading] = useState(true);

  // Date-range filter (drives fetch)
  const initialTo = useMemo(() => new Date(), []);
  const initialFrom = useMemo(() => new Date(initialTo.getTime() - ONE_DAY_MS), [initialTo]);
  const [dateFrom, setDateFrom] = useState<string>(toLocalInput(initialFrom));
  const [dateTo, setDateTo] = useState<string>(toLocalInput(initialTo));

  const from = useMemo(() => new Date(dateFrom), [dateFrom]);
  const to = useMemo(() => new Date(dateTo), [dateTo]);
  const rangeMs = Math.max(1, to.getTime() - from.getTime());
  const fromPrev = useMemo(() => new Date(from.getTime() - rangeMs), [from, rangeMs]);

  // Client-side filters
  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [violationFilter, setViolationFilter] = useState<string>("all");

  // Data
  const [rows, setRows] = useState<Row[]>([]);
  const [convMap, setConvMap] = useState<Map<string, ConvMeta>>(new Map());
  const [bookings, setBookings] = useState(0);
  const [prevMetrics, setPrevMetrics] = useState<Metrics | null>(null);
  const [drillCategory, setDrillCategory] = useState<string | null>(null);

  const [threshold, setThreshold] = useState<number>(() => {
    if (typeof window === "undefined") return DEFAULT_THRESHOLD;
    const raw = window.localStorage.getItem(THRESHOLD_STORAGE_KEY);
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : DEFAULT_THRESHOLD;
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(THRESHOLD_STORAGE_KEY, String(threshold));
    }
  }, [threshold]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [a, b] = await Promise.all([
        fetchWindow(from, to),
        fetchWindow(fromPrev, from),
      ]);
      if (cancelled) return;
      setRows(a.rows);
      setConvMap(a.convMap);
      setBookings(a.bookings);
      setPrevMetrics(computeMetrics(b.rows, b.bookings));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [from, to, fromPrev]);

  // Available channels + violation categories from the fetched window
  const channels = useMemo(() => {
    const s = new Set<string>();
    convMap.forEach(v => { if (v.channel) s.add(v.channel); });
    return Array.from(s).sort();
  }, [convMap]);

  const allViolationCats = useMemo(() => {
    const s = new Set<string>();
    for (const r of rows) for (const v of r.violations || []) s.add(v.split(":")[0].trim());
    return Array.from(s).sort();
  }, [rows]);

  // Apply client-side filters
  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (channelFilter !== "all") {
        const meta = r.conversation_id ? convMap.get(r.conversation_id) : null;
        if ((meta?.channel || "") !== channelFilter) return false;
      }
      if (violationFilter !== "all") {
        const cats = (r.violations || []).map(v => v.split(":")[0].trim());
        if (!cats.includes(violationFilter)) return false;
      }
      if (q) {
        const meta = r.conversation_id ? convMap.get(r.conversation_id) : null;
        const hay = [r.conversation_id || "", meta?.contact_phone || ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, convMap, search, channelFilter, violationFilter]);

  const curr = useMemo(() => computeMetrics(filteredRows, bookings), [filteredRows, bookings]);

  const hourly = useMemo(() => {
    const buckets = new Map<string, { total: number; valid: number }>();
    const bucketCount = Math.min(24, Math.max(1, Math.ceil(rangeMs / (3600 * 1000))));
    for (let i = bucketCount - 1; i >= 0; i--) {
      const d = new Date(to.getTime() - i * 3600 * 1000);
      const key = `${d.getUTCHours().toString().padStart(2, "0")}h`;
      buckets.set(key, { total: 0, valid: 0 });
    }
    for (const row of filteredRows) {
      const d = new Date(row.created_at);
      const key = `${d.getUTCHours().toString().padStart(2, "0")}h`;
      const b0 = buckets.get(key);
      if (!b0) continue;
      b0.total++;
      if (row.persona_ok && row.single_question_ok && row.pt_pt_ok && !row.overridden) b0.valid++;
    }
    return [...buckets.entries()].map(([hour, v]) => ({ hour, ...v }));
  }, [filteredRows, to, rangeMs]);

  const topViolations = useMemo(() => {
    const vBucket = new Map<string, number>();
    for (const r of filteredRows) for (const v of r.violations || []) {
      const key = v.split(":")[0].trim();
      vBucket.set(key, (vBucket.get(key) || 0) + 1);
    }
    return [...vBucket.entries()].map(([reason, count]) => ({ reason, count })).sort((x, y) => y.count - x.count).slice(0, 6);
  }, [filteredRows]);

  const topOverrides = useMemo(() => {
    const oBucket = new Map<string, number>();
    for (const r of filteredRows) if (r.overridden && r.override_reason) {
      const key = r.override_reason.split(" (")[0].trim();
      oBucket.set(key, (oBucket.get(key) || 0) + 1);
    }
    return [...oBucket.entries()].map(([reason, count]) => ({ reason, count })).sort((x, y) => y.count - x.count).slice(0, 5);
  }, [filteredRows]);

  const prev = prevMetrics ?? computeMetrics([], 0);
  const filtersActive = search.trim() !== "" || channelFilter !== "all" || violationFilter !== "all";

  const resetFilters = () => {
    setSearch("");
    setChannelFilter("all");
    setViolationFilter("all");
    setDateFrom(toLocalInput(initialFrom));
    setDateTo(toLocalInput(initialTo));
  };

  const maxHourly = Math.max(1, ...hourly.map(h => h.total));

  return (
    <div className="space-y-4 print:space-y-3">
      <div className="flex items-start justify-between print:mb-2 gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">Relatório — WhatsApp Concierge</h2>
          <p className="text-sm text-muted-foreground">
            {from.toLocaleString("pt-PT")} → {to.toLocaleString("pt-PT")} · comparado com período anterior de igual duração.
          </p>
        </div>
        <div className="flex items-end gap-3 print:hidden">
          <div>
            <Label htmlFor="valid-threshold" className="text-xs text-muted-foreground">Limiar de alerta (%)</Label>
            <Input
              id="valid-threshold"
              type="number"
              min={0}
              max={100}
              value={threshold}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                if (Number.isFinite(n)) setThreshold(Math.max(0, Math.min(100, n)));
              }}
              className="h-9 w-24"
            />
          </div>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-2" /> Imprimir / Guardar PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="print:hidden">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
            <Filter className="h-4 w-4" /> Filtros
            {filtersActive && (
              <Button variant="ghost" size="sm" className="h-7 ml-auto" onClick={resetFilters}>
                <X className="h-3 w-3 mr-1" /> Limpar
              </Button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            <div>
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Conversa / telefone</Label>
              <Input placeholder="id ou +351…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Canal</Label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Categoria de violação</Label>
              <Select value={violationFilter} onValueChange={setViolationFilter}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {allViolationCats.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar relatório…
        </div>
      ) : (
      <>
      {curr.total > 0 && curr.validPct < threshold && (
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>
            Respostas válidas em {curr.validPct}% — abaixo do limiar de {threshold}%
          </AlertTitle>
          <AlertDescription>
            <div className="mt-1 text-sm">
              {curr.valid} válidas em {curr.total} respostas no intervalo seleccionado.
              {topViolations.length > 0 && " Violações mais frequentes:"}
            </div>
            {topViolations.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {topViolations.slice(0, 5).map(v => (
                  <button key={v.reason} type="button" onClick={() => setDrillCategory(v.reason)} className="focus:outline-none">
                    <Badge variant="outline" className="border-destructive/40 text-destructive cursor-pointer hover:bg-destructive/10">
                      {v.reason} — {v.count}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-4 print:grid-cols-4">
        <TrendKpi icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Respostas válidas" value={`${curr.validPct}%`} sub={`${curr.valid} / ${curr.total}`} d={delta(curr.validPct, prev.validPct)} />
        <TrendKpi icon={<AlertTriangle className="h-4 w-4 text-red-600" />} label="Violações" value={String(curr.personaViolations + curr.multiQuestionViolations + curr.ptBrViolations)} sub={`${curr.overrides} overrides do gate`} d={delta(curr.personaViolations + curr.multiQuestionViolations + curr.ptBrViolations, prev.personaViolations + prev.multiQuestionViolations + prev.ptBrViolations)} invert />
        <TrendKpi icon={<Calendar className="h-4 w-4 text-blue-600" />} label="Convites de reunião" value={String(curr.meetingInvites)} sub={`${curr.bookingLinks} com link booking`} d={delta(curr.meetingInvites, prev.meetingInvites)} />
        <TrendKpi icon={<Link2 className="h-4 w-4 text-orange-600" />} label="Bookings criados" value={String(curr.bookingsCreated)} sub="no período (não filtrado)" d={delta(curr.bookingsCreated, prev.bookingsCreated)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tendência horária</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-32">
            {hourly.map((h) => {
              const pct = (h.total / maxHourly) * 100;
              const validPct = h.total ? (h.valid / h.total) * 100 : 0;
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1" title={`${h.hour}: ${h.valid}/${h.total} válidas`}>
                  <div className="w-full bg-muted rounded-sm relative" style={{ height: `${pct}%`, minHeight: h.total ? 4 : 0 }}>
                    <div className="absolute bottom-0 left-0 right-0 bg-green-600/70 rounded-sm" style={{ height: `${validPct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            {hourly.filter((_, i) => i % 4 === 0).map(h => <span key={h.hour}>{h.hour}</span>)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Barra: total de respostas · verde: respostas válidas.</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Detalhe de violações</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <RowLine label="Persona (frases proibidas)" value={curr.personaViolations} prev={prev.personaViolations} total={curr.total} />
            <RowLine label="Mais de 1 pergunta por mensagem" value={curr.multiQuestionViolations} prev={prev.multiQuestionViolations} total={curr.total} />
            <RowLine label="Markers PT-BR" value={curr.ptBrViolations} prev={prev.ptBrViolations} total={curr.total} />
            <RowLine label="Gate: agendamento antes das 2 perguntas" value={curr.overrides} prev={prev.overrides} total={curr.total} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Top violações & overrides</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Categorias de violação</div>
              <div className="flex flex-wrap gap-2">
                {topViolations.length ? topViolations.map(v => (
                  <button key={v.reason} type="button" onClick={() => setDrillCategory(v.reason)} className="focus:outline-none">
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">{v.reason} — {v.count}</Badge>
                  </button>
                )) : <span className="text-xs text-muted-foreground">Sem violações 🎉</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Motivos de override do gate</div>
              <div className="flex flex-wrap gap-2">
                {topOverrides.length ? topOverrides.map(v => (
                  <Badge key={v.reason} variant="secondary">{v.reason} — {v.count}</Badge>
                )) : <span className="text-xs text-muted-foreground">Sem overrides</span>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground print:mt-4">
        Relatório gerado em {new Date().toLocaleString("pt-PT")}. Fonte: <code>whatsapp_concierge_checks</code>.
      </p>
      </>
      )}

      <ViolationDrilldownDialog
        open={!!drillCategory}
        onOpenChange={(v) => { if (!v) setDrillCategory(null); }}
        category={drillCategory}
        from={from}
        to={to}
      />
    </div>
  );
}

function TrendIcon({ dir }: { dir: "up" | "down" | "flat" }) {
  if (dir === "up") return <TrendingUp className="h-3 w-3" />;
  if (dir === "down") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function TrendKpi({ icon, label, value, sub, d, invert = false }: { icon: React.ReactNode; label: string; value: string; sub?: string; d: { pct: number; dir: "up" | "down" | "flat" }; invert?: boolean }) {
  const good = invert ? d.dir === "down" : d.dir === "up";
  const bad = invert ? d.dir === "up" : d.dir === "down";
  const color = d.dir === "flat" ? "text-muted-foreground" : good ? "text-green-600" : bad ? "text-red-600" : "text-muted-foreground";
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-3xl font-semibold mt-2">{value}</div>
        <div className="flex items-center justify-between mt-1">
          {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
          <div className={`text-xs flex items-center gap-1 ${color}`}>
            <TrendIcon dir={d.dir} />
            {d.dir === "flat" ? "—" : `${d.pct > 0 ? "+" : ""}${d.pct}%`}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RowLine({ label, value, prev, total }: { label: string; value: number; prev: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  const d = delta(value, prev);
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="text-muted-foreground flex items-center gap-2">
        {value} <span className="text-xs">({pct}%)</span>
        <span className={`text-xs flex items-center gap-0.5 ${d.dir === "up" ? "text-red-600" : d.dir === "down" ? "text-green-600" : "text-muted-foreground"}`}>
          <TrendIcon dir={d.dir} />
          {d.dir === "flat" ? "—" : `${d.pct > 0 ? "+" : ""}${d.pct}%`}
        </span>
      </span>
    </div>
  );
}
