import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

type Booking = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  website: string | null;
  challenges: string | null;
  meeting_type: string | null;
  meeting_date: string | null;
  meeting_time: string | null;
  timezone: string | null;
  status: string | null;
  lead_status: string | null;
  language: string | null;
  meeting_link: string | null;
  jitsi_room: string | null;
  created_at: string;
};

type AuditRow = {
  id: string;
  from_status: string | null;
  to_status: string;
  action: string;
  actor_email: string | null;
  source: string;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  new: "bg-slate-100 text-slate-800",
  contacted: "bg-blue-100 text-blue-900",
  booked: "bg-amber-100 text-amber-900",
  completed: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
};

export default function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: b, error: bErr }, { data: a, error: aErr }] = await Promise.all([
      supabase.from("bookings").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("bookings_lead_status_audit")
        .select("*")
        .eq("booking_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (bErr) toast.error(bErr.message);
    if (aErr) toast.error(aErr.message);
    setBooking((b as Booking) ?? null);
    setAudit((a as AuditRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const meetingUrl = booking?.meeting_link
    || (booking?.jitsi_room ? `https://meet.jit.si/${booking.jitsi_room}` : null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/bookings-funnel">
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Voltar ao funil
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} /> Refrescar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">A carregar…</p>
      ) : !booking ? (
        <p className="text-sm text-muted-foreground">Booking não encontrado.</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-xl">{booking.name ?? "—"}</CardTitle>
                <Badge className={STATUS_COLOR[booking.lead_status ?? ""] ?? ""} variant="secondary">
                  {booking.lead_status ?? "—"}
                </Badge>
                {booking.status && <Badge variant="outline">booking: {booking.status}</Badge>}
                {booking.language && <Badge variant="outline">{booking.language.toUpperCase()}</Badge>}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Email:</span> {booking.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Telefone:</span> {booking.phone ?? "—"}</div>
              <div><span className="text-muted-foreground">Empresa:</span> {booking.company ?? "—"}</div>
              <div><span className="text-muted-foreground">Website:</span> {booking.website ?? "—"}</div>
              <div><span className="text-muted-foreground">Tipo:</span> {booking.meeting_type ?? "—"}</div>
              <div><span className="text-muted-foreground">Fuso:</span> {booking.timezone ?? "—"}</div>
              <div>
                <span className="text-muted-foreground">Reunião:</span>{" "}
                {booking.meeting_date ?? "—"}{booking.meeting_time ? ` · ${booking.meeting_time}` : ""}
              </div>
              <div className="md:col-span-2">
                <div className="text-muted-foreground mb-1">Meeting link:</div>
                {meetingUrl ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all">{meetingUrl}</code>
                    <Button size="sm" variant="outline" asChild>
                      <a href={meetingUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="h-3.5 w-3.5 mr-1" /> Abrir em nova aba
                      </a>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(meetingUrl);
                          toast.success("Meeting link copiado");
                        } catch {
                          toast.error("Não foi possível copiar");
                        }
                      }}
                    >
                      <Copy className="h-3.5 w-3.5 mr-1" /> Copiar
                    </Button>
                  </div>
                ) : "—"}
              </div>
              {booking.challenges && (
                <div className="md:col-span-2">
                  <div className="text-muted-foreground">Desafios:</div>
                  <p className="whitespace-pre-wrap">{booking.challenges}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Audit trail · lead_status</CardTitle></CardHeader>
            <CardContent>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos registados.</p>
              ) : (
                <ol className="space-y-3">
                  {audit.map((e) => (
                    <li key={e.id} className="border-l-2 border-muted pl-4 py-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(e.created_at).toLocaleString("pt-PT")}
                        </span>
                        {e.from_status && (
                          <Badge variant="outline" className="text-[10px]">{e.from_status}</Badge>
                        )}
                        <span>→</span>
                        <Badge className={STATUS_COLOR[e.to_status] ?? ""} variant="secondary">
                          {e.to_status}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">{e.source}</Badge>
                        {e.actor_email && (
                          <span className="text-muted-foreground text-[11px]">por {e.actor_email}</span>
                        )}
                      </div>
                      {e.notes && <p className="text-xs text-muted-foreground mt-1">{e.notes}</p>}
                      {e.metadata && Object.keys(e.metadata).length > 0 && (
                        <details className="mt-1">
                          <summary className="text-[10px] text-muted-foreground cursor-pointer">metadata</summary>
                          <pre className="bg-muted p-2 rounded text-[10px] mt-1 overflow-x-auto whitespace-pre-wrap">
{JSON.stringify(e.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
