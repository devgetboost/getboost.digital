import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, AlertTriangle, Calendar, Link2 } from "lucide-react";

type Row = {
  persona_ok: boolean;
  single_question_ok: boolean;
  pt_pt_ok: boolean;
  has_meeting_invite: boolean;
  has_booking_link: boolean;
  overridden: boolean;
  violations: string[];
  created_at: string;
};

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

const WINDOWS = { "24h": 1, "7d": 7, "30d": 30 } as const;
type WindowKey = keyof typeof WINDOWS;

export default function WhatsAppConciergeMetrics() {
  const [win, setWin] = useState<WindowKey>("7d");
  const [loading, setLoading] = useState(true);
  const [m, setM] = useState<Metrics | null>(null);
  const [topViolations, setTopViolations] = useState<{ reason: string; count: number }[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date(Date.now() - WINDOWS[win] * 24 * 3600 * 1000).toISOString();
      const [{ data: rows }, { count: bookingsCreated }] = await Promise.all([
        supabase
          .from("whatsapp_concierge_checks")
          .select("persona_ok,single_question_ok,pt_pt_ok,has_meeting_invite,has_booking_link,overridden,violations,created_at")
          .gte("created_at", since)
          .order("created_at", { ascending: false })
          .limit(5000),
        supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since),
      ]);

      const r = (rows || []) as Row[];
      const total = r.length;
      const valid = r.filter(x => x.persona_ok && x.single_question_ok && x.pt_pt_ok && !x.overridden).length;
      const metrics: Metrics = {
        total,
        valid,
        validPct: total ? Math.round((valid / total) * 100) : 0,
        personaViolations: r.filter(x => !x.persona_ok).length,
        multiQuestionViolations: r.filter(x => !x.single_question_ok).length,
        ptBrViolations: r.filter(x => !x.pt_pt_ok).length,
        overrides: r.filter(x => x.overridden).length,
        meetingInvites: r.filter(x => x.has_meeting_invite).length,
        bookingLinks: r.filter(x => x.has_booking_link).length,
        bookingsCreated: bookingsCreated ?? 0,
      };
      setM(metrics);

      const bucket = new Map<string, number>();
      for (const row of r) for (const v of row.violations || []) {
        const key = v.split(":")[0].trim();
        bucket.set(key, (bucket.get(key) || 0) + 1);
      }
      setTopViolations([...bucket.entries()].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 6));
      setLoading(false);
    })();
  }, [win]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Métricas Concierge</h2>
          <p className="text-sm text-muted-foreground">Performance das respostas da Sofia (persona, perguntas, agendamento).</p>
        </div>
        <Select value={win} onValueChange={(v) => setWin(v as WindowKey)}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Últimas 24h</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
            <SelectItem value="30d">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading || !m ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar…</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Kpi icon={<CheckCircle2 className="h-4 w-4 text-green-600" />} label="Respostas válidas" value={`${m.validPct}%`} sub={`${m.valid} / ${m.total}`} />
            <Kpi icon={<AlertTriangle className="h-4 w-4 text-red-600" />} label="Violações totais" value={String(m.personaViolations + m.multiQuestionViolations + m.ptBrViolations)} sub={`${m.overrides} overrides do gate`} />
            <Kpi icon={<Calendar className="h-4 w-4 text-blue-600" />} label="Convites de reunião" value={String(m.meetingInvites)} sub={`${m.bookingLinks} com link booking`} />
            <Kpi icon={<Link2 className="h-4 w-4 text-orange-600" />} label="Bookings criados" value={String(m.bookingsCreated)} sub="no mesmo período" />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Detalhe de violações</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Row label="Persona (frases proibidas)" value={m.personaViolations} total={m.total} />
              <Row label="Mais de 1 pergunta por mensagem" value={m.multiQuestionViolations} total={m.total} />
              <Row label="Markers PT-BR" value={m.ptBrViolations} total={m.total} />
              <Row label="Gate: agendamento antes de 2 perguntas" value={m.overrides} total={m.total} />
            </CardContent>
          </Card>

          {topViolations.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Top categorias detectadas</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {topViolations.map(v => (
                  <Badge key={v.reason} variant="outline">{v.reason} — {v.count}</Badge>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div>
        <div className="text-3xl font-semibold mt-2">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="flex items-center justify-between text-sm">
      <span>{label}</span>
      <span className="text-muted-foreground">{value} <span className="text-xs">({pct}%)</span></span>
    </div>
  );
}
