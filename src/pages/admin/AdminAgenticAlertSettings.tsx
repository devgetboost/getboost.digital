import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Send } from "lucide-react";

type Settings = {
  recipients: string[];
  window_hours: number;
  cooldown_hours: number;
  default_error_rate_pct: number;
  default_avg_latency_ms: number;
  default_min_runs: number;
  enabled: boolean;
};

const initial: Settings = {
  recipients: [], window_hours: 24, cooldown_hours: 6,
  default_error_rate_pct: 5, default_avg_latency_ms: 4000, default_min_runs: 5, enabled: true,
};

export default function AdminAgenticAlertSettings() {
  const [s, setS] = useState<Settings>(initial);
  const [recipientsText, setRecipientsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase.from as any)("agentic_alert_settings").select("*").eq("id", 1).maybeSingle();
      if (error) toast.error(error.message);
      if (data) {
        setS(data);
        setRecipientsText((data.recipients ?? []).join(", "));
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    const recipients = recipientsText.split(/[,\n]/).map(r => r.trim()).filter(Boolean);
    const bad = recipients.filter(r => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r));
    if (bad.length) return toast.error(`Emails inválidos: ${bad.join(", ")}`);
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase.from as any)("agentic_alert_settings")
      .update({ ...s, recipients, updated_by: user?.id }).eq("id", 1);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Definições guardadas"); setS({ ...s, recipients }); }
  };

  const testRun = async () => {
    setTesting(true);
    const { data, error } = await supabase.functions.invoke("agentic-alerts-check", { body: {} });
    setTesting(false);
    if (error) toast.error(error.message);
    else toast.success(`Verificação: ${JSON.stringify(data)}`);
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">A carregar…</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Definições de Alertas por Email</h1>
        <p className="text-muted-foreground text-sm">Destinatários, janela, cooldown e limiares padrão usados pelo verificador horário.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Destinatários</CardTitle>
          <CardDescription>Um email por linha ou separados por vírgula.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)}
            placeholder="admin@getboost.digital, ops@getboost.digital" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Janela e cooldown</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><Label>Janela padrão (horas)</Label>
            <Input type="number" min={1} max={720} value={s.window_hours}
              onChange={(e) => setS({ ...s, window_hours: +e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Usada quando um perfil não define janela.</p>
          </div>
          <div><Label>Cooldown (horas)</Label>
            <Input type="number" min={0} max={168} value={s.cooldown_hours}
              onChange={(e) => setS({ ...s, cooldown_hours: +e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">Tempo mínimo entre alertas repetidos por agente+métrica.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Limiares padrão</CardTitle>
          <CardDescription>Aplicados quando não existe perfil específico. Perfis por agente têm prioridade.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div><Label>Taxa de erro % </Label>
            <Input type="number" step="0.1" value={s.default_error_rate_pct}
              onChange={(e) => setS({ ...s, default_error_rate_pct: +e.target.value })} /></div>
          <div><Label>Latência média (ms)</Label>
            <Input type="number" value={s.default_avg_latency_ms}
              onChange={(e) => setS({ ...s, default_avg_latency_ms: +e.target.value })} /></div>
          <div><Label>Execuções mínimas</Label>
            <Input type="number" min={1} value={s.default_min_runs}
              onChange={(e) => setS({ ...s, default_min_runs: +e.target.value })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Ativação</CardTitle></CardHeader>
        <CardContent className="flex items-center gap-3">
          <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
          <span className="text-sm">Envio de alertas por email {s.enabled ? "ativo" : "desativado"}</span>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save} disabled={saving}><Save className="h-4 w-4 mr-1" />{saving ? "A guardar…" : "Guardar"}</Button>
        <Button variant="outline" onClick={testRun} disabled={testing}><Send className="h-4 w-4 mr-1" />{testing ? "A correr…" : "Correr verificação agora"}</Button>
      </div>
    </div>
  );
}
