import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  BOOKING_STATUS_LABELS,
  deleteBooking,
  getBooking,
  listAuditForEntity,
  logAdminAction,
  updateBookingStatus,
  type AuditLogRow,
  type BookingAdminRow,
  type BookingStatus,
} from '@/lib/adminContent';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

/**
 * R1C8: booking detail over the Clean V1 `bookings` table. The retired columns
 * (`meeting_date`, `meeting_time`, `lead_status`, `language`, `meeting_link`,
 * `jitsi_room`, `phone`, `website`, `challenges`) have no Clean V1 carrier:
 * the meeting is described by its absolute `start_at`/`end_at` instants, and
 * the meeting link lives only in the confirmation email sent at booking time.
 *
 * The audit trail now reads `admin_audit_log` (entity `booking`), which is
 * where this wave records admin actions. History predating the migration is
 * not backfilled — the trail starts here.
 */
type Booking = BookingAdminRow;
type AuditRow = AuditLogRow;

const STATUS_COLOR: Record<BookingStatus, string> = {
  requested: "bg-slate-100 text-slate-800",
  confirmed: "bg-blue-100 text-blue-900",
  completed: "bg-green-100 text-green-900",
  cancelled: "bg-red-100 text-red-900",
  no_show: "bg-amber-100 text-amber-900",
};

export default function AdminBookingDetail() {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [b, a] = await Promise.all([
        getBooking(id),
        listAuditForEntity("booking", id),
      ]);
      setBooking(b);
      setAudit(a);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao carregar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  const changeStatus = async (status: BookingStatus) => {
    if (!booking) return;
    const from = booking.status;
    try {
      await updateBookingStatus(booking.id, status);
      toast.success(`Estado atualizado para "${BOOKING_STATUS_LABELS[status]}".`);
      void logAdminAction("booking.status", "booking", booking.id, {
        from_status: from,
        to_status: status,
      });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar.");
    }
  };

  const removeBooking = async () => {
    if (!booking || !confirm("Eliminar esta reserva?")) return;
    try {
      await deleteBooking(booking.id);
      toast.success("Reserva eliminada.");
      void logAdminAction("booking.delete", "booking", booking.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao eliminar.");
    }
  };

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
                <Badge className={STATUS_COLOR[booking.status]} variant="secondary">
                  {BOOKING_STATUS_LABELS[booking.status]}
                </Badge>
                <Badge variant="outline">{booking.market} · {booking.locale}</Badge>
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Email:</span> {booking.email ?? "—"}</div>
              <div><span className="text-muted-foreground">Empresa:</span> {booking.company ?? "—"}</div>
              <div><span className="text-muted-foreground">Fuso:</span> {booking.timezone ?? "—"}</div>
              <div>
                <span className="text-muted-foreground">Início:</span>{" "}
                {new Date(booking.start_at).toLocaleString("pt-PT")}
              </div>
              <div>
                <span className="text-muted-foreground">Fim:</span>{" "}
                {new Date(booking.end_at).toLocaleString("pt-PT")}
              </div>
              <div>
                <span className="text-muted-foreground">Estado:</span>{" "}
                <Select value={booking.status} onValueChange={(v) => changeStatus(v as BookingStatus)}>
                  <SelectTrigger className="h-8 w-40 mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BOOKING_STATUS_LABELS) as BookingStatus[]).map((st) => (
                      <SelectItem key={st} value={st}>{BOOKING_STATUS_LABELS[st]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {booking.notes && (
                <div className="md:col-span-2">
                  <div className="text-muted-foreground">Notas:</div>
                  <p className="whitespace-pre-wrap">{booking.notes}</p>
                </div>
              )}
              <div className="md:col-span-2 flex gap-2">
                <Button size="sm" variant="destructive" onClick={removeBooking}>
                  Eliminar reserva
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Audit trail</CardTitle></CardHeader>
            <CardContent>
              {audit.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sem eventos registados. O histórico começa com esta migração.</p>
              ) : (
                <ol className="space-y-3">
                  {audit.map((e) => (
                    <li key={e.id} className="border-l-2 border-muted pl-4 py-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-muted-foreground whitespace-nowrap">
                          {new Date(e.occurred_at).toLocaleString("pt-PT")}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{e.action}</Badge>
                        {typeof e.metadata.from_status === "string" && typeof e.metadata.to_status === "string" && (
                          <>
                            <Badge variant="outline" className="text-[10px]">{String(e.metadata.from_status)}</Badge>
                            <span>→</span>
                            <Badge variant="secondary" className="text-[10px]">{String(e.metadata.to_status)}</Badge>
                          </>
                        )}
                      </div>
                      {Object.keys(e.metadata).length > 0 && (
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
