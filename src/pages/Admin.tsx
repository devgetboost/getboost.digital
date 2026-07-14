import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';
import { CalendarIcon, Clock, User, Mail, Phone, Building2, Globe, LogOut, Video, Trash2, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

type Booking = {
  id: string;
  meeting_type: string;
  meeting_date: string;
  meeting_time: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  website: string | null;
  challenges: string;
  timezone: string;
  status: string;
  jitsi_room: string | null;
  created_at: string;
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
  completed: 'bg-blue-100 text-blue-800 border-blue-200',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente',
  confirmed: 'Confirmada',
  cancelled: 'Cancelada',
  completed: 'Concluída',
};

const meetingLabels: Record<string, string> = {
  discovery: 'Consulta de Descoberta (30 min)',
  strategy: 'Sessão de Estratégia (60 min)',
};

const Admin = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jitsiRoom, setJitsiRoom] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchBookings();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/login');
      return;
    }
    // Check admin role
    const { data: roles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin');
    if (!roles || roles.length === 0) {
      toast.error('Acesso restrito a administradores.');
      await supabase.auth.signOut();
      navigate('/login');
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('meeting_date', { ascending: false });
    if (error) {
      toast.error('Erro ao carregar reuniões');
    } else {
      setBookings(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const updates: { status: string; jitsi_room?: string } = { status };
    if (status === 'confirmed') {
      updates.jitsi_room = `nuno-cruz-${id.slice(0, 8)}`;
    }
    const { error } = await supabase.from('bookings').update(updates).eq('id', id);
    if (error) {
      toast.error('Erro ao atualizar');
    } else {
      toast.success(`Reunião ${statusLabels[status]?.toLowerCase() || status}`);
      fetchBookings();
    }
  };

  const deleteBooking = async (id: string) => {
    const { error } = await supabase.from('bookings').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao eliminar');
    } else {
      toast.success('Reunião eliminada');
      fetchBookings();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const filtered = bookings.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(search.toLowerCase()) || b.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold">Painel Administrativo</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, color: 'text-foreground' },
            { label: 'Pendentes', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Confirmadas', value: stats.confirmed, color: 'text-green-600' },
            { label: 'Concluídas', value: stats.completed, color: 'text-blue-600' },
          ].map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar por nome ou email..." className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmadas</SelectItem>
              <SelectItem value="cancelled">Canceladas</SelectItem>
              <SelectItem value="completed">Concluídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bookings list */}
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">A carregar...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">Nenhuma reunião encontrada.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking) => (
              <Card key={booking.id} className="border-border hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold text-foreground">{booking.name}</h3>
                        <Badge variant="outline" className={statusColors[booking.status]}>
                          {statusLabels[booking.status] || booking.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" />{format(new Date(booking.meeting_date), "d 'de' MMMM, yyyy", { locale: pt })}</span>
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{booking.meeting_time}</span>
                        <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{booking.email}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{meetingLabels[booking.meeting_type] || booking.meeting_type}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {booking.status === 'pending' && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-green-600 border-green-200 hover:bg-green-50" onClick={() => updateStatus(booking.id, 'confirmed')}>
                          <CheckCircle className="h-3.5 w-3.5" /> Confirmar
                        </Button>
                      )}
                      {booking.status === 'confirmed' && (
                        <>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" className="gap-1.5" onClick={() => setJitsiRoom(booking.jitsi_room)}>
                                <Video className="h-3.5 w-3.5" /> Jitsi Meet
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl h-[80vh]">
                              <DialogHeader>
                                <DialogTitle>Reunião com {booking.name}</DialogTitle>
                              </DialogHeader>
                              <iframe
                                src={`https://meet.jit.si/${booking.jitsi_room || `nuno-cruz-${booking.id.slice(0, 8)}`}`}
                                className="w-full flex-1 rounded-lg border border-border"
                                style={{ height: 'calc(80vh - 80px)' }}
                                allow="camera; microphone; fullscreen; display-capture"
                              />
                            </DialogContent>
                          </Dialog>
                          <Button size="sm" variant="outline" className="gap-1.5 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => updateStatus(booking.id, 'completed')}>
                            <CheckCircle className="h-3.5 w-3.5" /> Concluir
                          </Button>
                        </>
                      )}
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <Button size="sm" variant="outline" className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50" onClick={() => updateStatus(booking.id, 'cancelled')}>
                          <XCircle className="h-3.5 w-3.5" /> Cancelar
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-600" onClick={() => deleteBooking(booking.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    {booking.phone && <span className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{booking.phone}</span>}
                    {booking.company && <span className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5" />{booking.company}</span>}
                    {booking.website && <span className="flex items-center gap-1.5 text-muted-foreground"><Globe className="h-3.5 w-3.5" />{booking.website}</span>}
                    <div className="md:col-span-2">
                      <p className="text-muted-foreground"><strong>Desafios:</strong> {booking.challenges}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
