import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Save, Plus, Trash2 } from 'lucide-react';

interface Row {
  segment: string;
  idle_minutes: number;
  fallback_message: string;
  booking_url: string;
  enabled: boolean;
  sms_reminder_enabled: boolean;
  _isNew?: boolean;
}

const DEFAULTS: Row = {
  segment: 'default',
  idle_minutes: 30,
  fallback_message:
    'Olá{{name}}! Notei que a nossa conversa ficou parada há algum tempo. Podes agendar aqui: {{booking_url}} — respondo pessoalmente. 🙌',
  booking_url: 'https://getboost.digital/booking',
  enabled: true,
  sms_reminder_enabled: false,
};

const KNOWN_SEGMENTS = ['default', 'whatsapp', 'instagram', 'facebook', 'linkedin', 'x'];

export default function WhatsAppFallbackSettings() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSegment, setNewSegment] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('whatsapp_fallback_settings' as never)
      .select('segment, idle_minutes, fallback_message, booking_url, enabled, sms_reminder_enabled')
      .order('segment');
    if (error) {
      toast.error('Erro a carregar: ' + error.message);
    } else {
      const list = (data as any[]) ?? [];
      if (!list.find((r) => r.segment === 'default')) list.unshift({ ...DEFAULTS });
      setRows(list);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const update = (segment: string, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r) => (r.segment === segment ? { ...r, ...patch } : r)));

  const addSegment = () => {
    const seg = newSegment.trim().toLowerCase();
    if (!seg) return;
    if (rows.find((r) => r.segment === seg)) {
      toast.error('Esse segmento já existe.');
      return;
    }
    setRows((prev) => [...prev, { ...DEFAULTS, segment: seg, _isNew: true }]);
    setNewSegment('');
  };

  const removeSegment = async (segment: string) => {
    if (segment === 'default') return;
    if (!confirm(`Remover configuração do segmento "${segment}"?`)) return;
    const row = rows.find((r) => r.segment === segment);
    if (row && !row._isNew) {
      const { error } = await supabase.from('whatsapp_fallback_settings' as never).delete().eq('segment', segment);
      if (error) { toast.error('Erro: ' + error.message); return; }
    }
    setRows((prev) => prev.filter((r) => r.segment !== segment));
    toast.success('Segmento removido.');
  };

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = rows.map(({ _isNew, ...r }) => ({
      ...r,
      idle_minutes: Math.min(10080, Math.max(1, Number(r.idle_minutes) || 30)),
      updated_by: u.user?.id ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from('whatsapp_fallback_settings' as never)
      .upsert(payload as any, { onConflict: 'segment' });
    setSaving(false);
    if (error) toast.error('Erro a guardar: ' + error.message);
    else {
      toast.success('Configuração guardada. O cron usa os novos valores no próximo ciclo.');
      load();
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Fallback automático (silêncio)</h2>
        <p className="text-sm text-muted-foreground">
          Se a IA responder e o cliente ficar em silêncio, o cron envia esta mensagem com o link de agendamento antes de escalar.
          O segmento <code>default</code> aplica-se a canais sem configuração específica.
          Placeholders: <code>{'{{name}}'}</code> e <code>{'{{booking_url}}'}</code>.
        </p>
      </div>

      <div className="grid gap-4">
        {rows.map((r) => (
          <Card key={r.segment}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Segmento: {r.segment}</CardTitle>
                <CardDescription>
                  {r.segment === 'default' ? 'Aplica-se quando não há configuração específica para o canal.' : `Aplica-se a conversas com channel="${r.segment}".`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={r.enabled} onCheckedChange={(v) => update(r.segment, { enabled: v })} />
                  <span className="text-xs text-muted-foreground">{r.enabled ? 'Activo' : 'Desligado'}</span>
                </div>
                {r.segment !== 'default' && (
                  <Button variant="ghost" size="icon" onClick={() => removeSegment(r.segment)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Idle (minutos)</Label>
                <Input
                  type="number" min={1} max={10080}
                  value={r.idle_minutes}
                  onChange={(e) => update(r.segment, { idle_minutes: Number(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Booking URL</Label>
                <Input
                  type="url"
                  value={r.booking_url}
                  onChange={(e) => update(r.segment, { booking_url: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Mensagem</Label>
                <Textarea
                  rows={4}
                  value={r.fallback_message}
                  onChange={(e) => update(r.segment, { fallback_message: e.target.value })}
                />
              </div>
              <div className="sm:col-span-2 flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
                <div>
                  <Label className="text-sm">Lembrete por SMS</Label>
                  <p className="text-xs text-muted-foreground">
                    Envia SMS de reforço se o cliente não responder à escolha de horário em 30 min.
                  </p>
                </div>
                <Switch
                  checked={r.sms_reminder_enabled}
                  onCheckedChange={(v) => update(r.segment, { sms_reminder_enabled: v })}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar segmento</CardTitle>
          <CardDescription>Cria uma configuração específica para um canal (ex.: instagram, facebook).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-2">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <Label>Segmento</Label>
            <Input
              list="fallback-segments"
              placeholder="instagram"
              value={newSegment}
              onChange={(e) => setNewSegment(e.target.value)}
            />
            <datalist id="fallback-segments">
              {KNOWN_SEGMENTS.filter((s) => !rows.find((r) => r.segment === s)).map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <Button variant="outline" onClick={addSegment} className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar
        </Button>
      </div>
    </div>
  );
}
