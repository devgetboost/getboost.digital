import { useEffect, useMemo, useState } from 'react';
import { format, isSameDay, parseISO, startOfDay } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ban, CalendarClock, Loader2, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type BlockKind = 'day' | 'range' | 'weekly';
interface Block {
  id: string;
  user_id: string;
  kind: BlockKind;
  start_date: string | null;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  weekday: number | null;
  reason: string | null;
  active: boolean;
}
interface Booking {
  id: string;
  name: string;
  meeting_date: string;
  meeting_time: string | null;
  meeting_type: string | null;
  status: string;
}

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function InboxCalendar() {
  const [userId, setUserId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = async (uid: string) => {
    setLoading(true);
    const [{ data: b }, { data: k }] = await Promise.all([
      supabase
        .from('bookings')
        .select('id, name, meeting_date, meeting_time, meeting_type, status')
        .eq('assigned_to' as never, uid as never)
        .order('meeting_date', { ascending: true }),
      supabase
        .from('admin_calendar_blocks' as never)
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
    ]);
    setBookings((b as Booking[]) || []);
    setBlocks((k as unknown as Block[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const uid = data.user?.id ?? null;
      setUserId(uid);
      if (uid) load(uid);
      else setLoading(false);
    });
  }, []);

  const bookingDays = useMemo(
    () => bookings.filter((b) => b.status !== 'cancelled').map((b) => parseISO(b.meeting_date)),
    [bookings],
  );

  const blockedDays = useMemo(() => {
    const days: Date[] = [];
    for (const b of blocks) {
      if (!b.active) continue;
      if (b.kind === 'day' && b.start_date) days.push(parseISO(b.start_date));
      if (b.kind === 'range' && b.start_date) {
        const s = parseISO(b.start_date);
        const e = b.end_date ? parseISO(b.end_date) : s;
        for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) days.push(new Date(d));
      }
    }
    return days;
  }, [blocks]);

  const dayBookings = bookings.filter((b) => isSameDay(parseISO(b.meeting_date), selected));
  const dayBlocks = blocks.filter((b) => {
    if (!b.active) return false;
    if (b.kind === 'day') return b.start_date && isSameDay(parseISO(b.start_date), selected);
    if (b.kind === 'range' && b.start_date) {
      const s = startOfDay(parseISO(b.start_date));
      const e = b.end_date ? startOfDay(parseISO(b.end_date)) : s;
      const t = startOfDay(selected);
      return t >= s && t <= e;
    }
    if (b.kind === 'weekly') return b.weekday === selected.getDay();
    return false;
  });

  const deleteBlock = async (id: string) => {
    if (!confirm('Remover este bloqueio?')) return;
    const { error } = await supabase.from('admin_calendar_blocks' as never).delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
      toast.success('Bloqueio removido');
      if (userId) load(userId);
    }
  };

  const toggleBlock = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from('admin_calendar_blocks' as never)
      .update({ active } as never)
      .eq('id', id);
    if (error) toast.error(error.message);
    else if (userId) load(userId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!userId) {
    return <div className="p-6 text-sm text-muted-foreground">Sessão não encontrada.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/inbox">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <CalendarClock className="h-6 w-6 text-primary" /> Calendário
            </h1>
            <p className="text-sm text-muted-foreground">As tuas reuniões e bloqueios de agenda. A IA usa isto para propor horários.</p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Novo bloqueio
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
        <Card>
          <CardContent className="p-3">
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => d && setSelected(d)}
              locale={pt}
              modifiers={{ booked: bookingDays, blocked: blockedDays }}
              modifiersClassNames={{
                booked: 'bg-primary/15 font-semibold text-primary',
                blocked: 'line-through text-muted-foreground opacity-70',
              }}
              className={cn('pointer-events-auto')}
            />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-primary/60" /> Reunião</span>
              <span className="flex items-center gap-1.5"><Ban className="h-3 w-3" /> Bloqueado</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{format(selected, "EEEE, d 'de' MMMM", { locale: pt })}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dayBookings.length === 0 && dayBlocks.length === 0 && (
                <p className="text-sm text-muted-foreground">Nada agendado neste dia.</p>
              )}
              {dayBookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-border/60 p-3">
                  <div>
                    <p className="text-sm font-medium">{b.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.meeting_time || '—'} · {b.meeting_type || 'reunião'}
                    </p>
                  </div>
                  <Badge variant="outline">{b.status}</Badge>
                </div>
              ))}
              {dayBlocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-md border border-dashed border-border p-3 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Ban className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {b.kind === 'day' && 'Dia inteiro bloqueado'}
                        {b.kind === 'range' && `${b.start_time || '00:00'} – ${b.end_time || '23:59'}`}
                        {b.kind === 'weekly' && `Todas as ${WEEKDAYS[b.weekday ?? 0]}s ${b.start_time || '00:00'}–${b.end_time || '23:59'}`}
                      </p>
                      {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={b.active} onCheckedChange={(v) => toggleBlock(b.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => deleteBlock(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Todos os bloqueios activos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {blocks.length === 0 && <p className="text-sm text-muted-foreground">Sem bloqueios definidos.</p>}
              {blocks.map((b) => (
                <div key={b.id} className="flex items-center justify-between text-sm border-b border-border/40 py-2 last:border-0">
                  <div>
                    <span className="font-medium">
                      {b.kind === 'day' && `Dia · ${b.start_date}`}
                      {b.kind === 'range' && `${b.start_date}${b.end_date && b.end_date !== b.start_date ? ` → ${b.end_date}` : ''} · ${b.start_time || '00:00'}–${b.end_time || '23:59'}`}
                      {b.kind === 'weekly' && `Todas as ${WEEKDAYS[b.weekday ?? 0]}s · ${b.start_time || '00:00'}–${b.end_time || '23:59'}`}
                    </span>
                    {b.reason && <span className="text-muted-foreground"> — {b.reason}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={b.active} onCheckedChange={(v) => toggleBlock(b.id, v)} />
                    <Button size="icon" variant="ghost" onClick={() => deleteBlock(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <BlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selected}
        userId={userId}
        onCreated={() => userId && load(userId)}
      />
    </div>
  );
}

function BlockDialog({
  open, onOpenChange, defaultDate, userId, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultDate: Date;
  userId: string;
  onCreated: () => void;
}) {
  const iso = format(defaultDate, 'yyyy-MM-dd');
  const [tab, setTab] = useState<BlockKind>('day');
  const [startDate, setStartDate] = useState(iso);
  const [endDate, setEndDate] = useState(iso);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [weekday, setWeekday] = useState('5');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStartDate(iso);
      setEndDate(iso);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, iso]);

  const submit = async () => {
    setSaving(true);
    const payload: Partial<Block> & { user_id: string } = { user_id: userId, kind: tab, reason: reason || null, active: true } as never;
    if (tab === 'day') payload.start_date = startDate;
    if (tab === 'range') {
      payload.start_date = startDate;
      payload.end_date = endDate || startDate;
      payload.start_time = startTime;
      payload.end_time = endTime;
    }
    if (tab === 'weekly') {
      payload.weekday = Number(weekday);
      payload.start_time = startTime;
      payload.end_time = endTime;
    }
    const { error } = await supabase.from('admin_calendar_blocks' as never).insert(payload as never);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success('Bloqueio criado');
      onOpenChange(false);
      setReason('');
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Novo bloqueio de agenda</DialogTitle>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as BlockKind)}>
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="day">Dia inteiro</TabsTrigger>
            <TabsTrigger value="range">Intervalo horário</TabsTrigger>
            <TabsTrigger value="weekly">Regra semanal</TabsTrigger>
          </TabsList>
          <TabsContent value="day" className="space-y-3 pt-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
          </TabsContent>
          <TabsContent value="range" className="space-y-3 pt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>De</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div>
                <Label>Até</Label>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <div>
                <Label>Hora início</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>Hora fim</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          </TabsContent>
          <TabsContent value="weekly" className="space-y-3 pt-3">
            <div>
              <Label>Dia da semana</Label>
              <Select value={weekday} onValueChange={setWeekday}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((w, i) => <SelectItem key={i} value={String(i)}>{w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora início</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <Label>Hora fim</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="space-y-2">
          <Label>Motivo (opcional)</Label>
          <Input placeholder="Férias, formação, foco…" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Guardar bloqueio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
