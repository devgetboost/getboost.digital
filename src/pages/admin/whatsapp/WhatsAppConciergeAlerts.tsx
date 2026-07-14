import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, PlayCircle, Bell, Plus, X, Check } from "lucide-react";

type Settings = {
  id: number;
  enabled: boolean;
  recipients: string[];
  slack_webhook_urls: string[];
  telegram_chat_ids: string[];
  valid_pct_min: number;
  violations_spike_pct: number;
  invites_drop_pct: number;
  bookings_drop_pct: number;
  min_samples: number;
  cooldown_hours: number;
};

type LogRow = {
  id: string; kind: string; severity: string; message: string;
  created_at: string;
};

export default function WhatsAppConciergeAlerts() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [s, setS] = useState<Settings | null>(null);
  const [recipientsText, setRecipientsText] = useState("");
  const [slackText, setSlackText] = useState("");
  const [telegramText, setTelegramText] = useState("");
  const [telegramDraft, setTelegramDraft] = useState("");
  const [log, setLog] = useState<LogRow[]>([]);

  const load = async () => {
    setLoading(true);
    const [{ data: settings, error: settingsErr }, { data: logs }] = await Promise.all([
      supabase.from("whatsapp_concierge_alert_settings").select("*").eq("id", 1).maybeSingle(),
      supabase.from("whatsapp_concierge_alert_log")
        .select("id,kind,severity,message,created_at")
        .order("created_at", { ascending: false }).limit(30),
    ]);
    if (settingsErr) {
      console.error("[concierge-alerts] load failed", settingsErr);
      toast({ title: "Não foi possível carregar", description: settingsErr.message, variant: "destructive" });
    }
    let row = settings as Settings | null;
    // Auto-seed the singleton row on first open so a fresh env still renders the form.
    if (!row) {
      const { data: inserted, error: insErr } = await supabase
        .from("whatsapp_concierge_alert_settings")
        .insert({ id: 1 })
        .select("*")
        .maybeSingle();
      if (insErr) {
        console.error("[concierge-alerts] seed failed", insErr);
        toast({ title: "Falha a inicializar", description: insErr.message, variant: "destructive" });
      } else {
        row = inserted as Settings | null;
      }
    }
    if (row) {
      setS(row);
      setRecipientsText((row.recipients || []).join(", "));
      setSlackText((row.slack_webhook_urls || []).join("\n"));
      setTelegramText((row.telegram_chat_ids || []).join(", "));
    }
    setLog((logs || []) as LogRow[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const slackEntries = slackText.split(/[\n,]/).map(x => x.trim()).filter(Boolean);
  const telegramEntries = telegramText.split(",").map(x => x.trim()).filter(Boolean);

  const isValidSlackWebhook = (u: string) =>
    /^https:\/\/hooks\.slack\.com\/services\/T[A-Z0-9]+\/B[A-Z0-9]+\/[A-Za-z0-9]{20,}$/.test(u);
  const isValidTelegramChatId = (id: string) =>
    /^(-100\d{6,}|-?\d{5,})$/.test(id) || /^@[A-Za-z][A-Za-z0-9_]{4,}$/.test(id);

  const slackErrors = slackEntries.filter(u => !isValidSlackWebhook(u));
  const telegramErrors = telegramEntries.filter(id => !isValidTelegramChatId(id));

  const save = async () => {
    if (!s) return;
    if (slackErrors.length || telegramErrors.length) {
      toast({
        title: "Formato inválido",
        description: [
          slackErrors.length ? `${slackErrors.length} webhook(s) Slack inválido(s)` : null,
          telegramErrors.length ? `${telegramErrors.length} chat ID(s) Telegram inválido(s)` : null,
        ].filter(Boolean).join(" · "),
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const recipients = recipientsText.split(",").map(x => x.trim()).filter(Boolean);
    const { error } = await supabase.from("whatsapp_concierge_alert_settings").update({
      enabled: s.enabled,
      recipients,
      slack_webhook_urls: slackEntries,
      telegram_chat_ids: telegramEntries,
      valid_pct_min: s.valid_pct_min,
      violations_spike_pct: s.violations_spike_pct,
      invites_drop_pct: s.invites_drop_pct,
      bookings_drop_pct: s.bookings_drop_pct,
      min_samples: s.min_samples,
      cooldown_hours: s.cooldown_hours,
      updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setSaving(false);
    if (error) toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    else toast({ title: "Configuração guardada" });
  };


  const runNow = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-concierge-alerts-check");
    setRunning(false);
    if (error) toast({ title: "Falhou", description: error.message, variant: "destructive" });
    else toast({ title: "Verificação executada", description: `Alertas enviados: ${(data as any)?.sent ?? 0}` });
    load();
  };

  if (loading || !s) {
    return <div className="flex items-center py-16 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar…</div>;
  }

  const num = (key: keyof Settings) => (
    <Input type="number" min={0} max={100}
      value={String(s[key] as number)}
      onChange={(e) => setS({ ...s, [key]: parseInt(e.target.value || "0", 10) } as Settings)}
      className="h-9 w-24" />
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2"><Bell className="h-5 w-5" /> Alertas — WhatsApp Concierge</h2>
          <p className="text-sm text-muted-foreground">
            Verifica picos de violações e quedas de convites/bookings nas últimas 24h e notifica a lista abaixo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={runNow} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <PlayCircle className="h-4 w-4 mr-2" />} Executar agora
          </Button>
          <Button size="sm" onClick={save} disabled={saving || slackErrors.length > 0 || telegramErrors.length > 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />} Guardar
          </Button>

        </div>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Configuração</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Alertas ativos</Label>
              <p className="text-xs text-muted-foreground">Desligar suspende o envio e a verificação agendada.</p>
            </div>
            <Switch checked={s.enabled} onCheckedChange={(v) => setS({ ...s, enabled: v })} />
          </div>

          <div>
            <Label>Emails (separados por vírgula)</Label>
            <Input value={recipientsText} onChange={(e) => setRecipientsText(e.target.value)}
              placeholder="ops@empresa.pt, nuno@empresa.pt" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">
              Se vazio, usa o secret <code>AGENTIC_ALERT_RECIPIENTS</code>.
            </p>
          </div>

          <div>
            <Label>Slack — Incoming Webhook URLs (uma por linha)</Label>
            <textarea
              value={slackText}
              onChange={(e) => setSlackText(e.target.value)}
              placeholder="https://hooks.slack.com/services/T00.../B00.../XXX"
              rows={2}
              className={`mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm font-mono ${slackErrors.length ? "border-destructive" : ""}`}
              aria-invalid={slackErrors.length > 0}
            />
            {slackErrors.length > 0 ? (
              <p className="text-xs text-destructive mt-1">
                {slackErrors.length} URL(s) inválido(s). Formato esperado: <code>https://hooks.slack.com/services/T…/B…/…</code>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {slackEntries.length > 0 && `${slackEntries.length} webhook(s) válido(s). `}
                Cria em Slack &rarr; Apps &rarr; Incoming Webhooks.
              </p>
            )}
          </div>

          <div>
            <Label>Telegram — Chat IDs</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={telegramDraft}
                onChange={(e) => setTelegramDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = telegramDraft.trim();
                    if (!v) return;
                    if (!isValidTelegramChatId(v)) {
                      toast({ title: "Chat ID inválido", description: `Usa um ID numérico (ex.: -1001234567890) ou @utilizador. Recebido: ${v}`, variant: "destructive" });
                      return;
                    }
                    if (telegramEntries.includes(v)) {
                      toast({ title: "Já existe", description: `${v} já está na lista.` });
                      setTelegramDraft("");
                      return;
                    }
                    setTelegramText([...telegramEntries, v].join(", "));
                    setTelegramDraft("");
                  }
                }}
                placeholder="-1001234567890 ou @meucanal"
                className={`font-mono ${telegramDraft && !isValidTelegramChatId(telegramDraft.trim()) ? "border-destructive" : ""}`}
                aria-invalid={telegramDraft.length > 0 && !isValidTelegramChatId(telegramDraft.trim())}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const v = telegramDraft.trim();
                  if (!v) return;
                  if (!isValidTelegramChatId(v)) {
                    toast({ title: "Chat ID inválido", description: `Usa um ID numérico (ex.: -1001234567890) ou @utilizador.`, variant: "destructive" });
                    return;
                  }
                  if (telegramEntries.includes(v)) {
                    toast({ title: "Já existe", description: `${v} já está na lista.` });
                    setTelegramDraft("");
                    return;
                  }
                  setTelegramText([...telegramEntries, v].join(", "));
                  setTelegramDraft("");
                }}
                disabled={!telegramDraft.trim() || !isValidTelegramChatId(telegramDraft.trim())}
              >
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
            </div>
            {telegramDraft && !isValidTelegramChatId(telegramDraft.trim()) && (
              <p className="text-xs text-destructive mt-1">
                Formato inválido. Usa um ID numérico (ex.: <code>-1001234567890</code>) ou <code>@utilizador</code>.
              </p>
            )}

            {telegramEntries.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {telegramEntries.map((id) => {
                  const valid = isValidTelegramChatId(id);
                  return (
                    <Badge
                      key={id}
                      variant={valid ? "secondary" : "destructive"}
                      className="gap-1 pl-2 pr-1 py-1 font-mono text-xs"
                    >
                      {valid ? <Check className="h-3 w-3" /> : null}
                      {id}
                      <button
                        type="button"
                        aria-label={`Remover ${id}`}
                        onClick={() => setTelegramText(telegramEntries.filter((x) => x !== id).join(", "))}
                        className="ml-1 hover:bg-background/50 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-2">
                Sem chat IDs. Adiciona um ID numérico ou <code>@utilizador</code> e carrega em Adicionar.
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {telegramErrors.length > 0
                ? <span className="text-destructive">{telegramErrors.length} entrada(s) inválida(s) — remove antes de guardar.</span>
                : <>Requer o secret <code>TELEGRAM_BOT_TOKEN</code> e o bot adicionado ao chat.</>}
            </p>
          </div>



          <div className="grid gap-4 md:grid-cols-3">
            <div><Label className="text-xs">Mín. % respostas válidas</Label>{num("valid_pct_min")}</div>
            <div><Label className="text-xs">Subida de violações (%)</Label>{num("violations_spike_pct")}</div>
            <div><Label className="text-xs">Queda de convites (%)</Label>{num("invites_drop_pct")}</div>
            <div><Label className="text-xs">Queda de bookings (%)</Label>{num("bookings_drop_pct")}</div>
            <div><Label className="text-xs">Nº mínimo de respostas</Label>{num("min_samples")}</div>
            <div><Label className="text-xs">Cooldown (horas)</Label>{num("cooldown_hours")}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico de alertas (últimos 30)</CardTitle></CardHeader>
        <CardContent>
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem alertas registados.</p>
          ) : (
            <div className="space-y-2">
              {log.map((a) => (
                <div key={a.id} className="flex items-start justify-between gap-3 border-b pb-2 last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={a.severity === "critical" ? "destructive" : "secondary"}>{a.severity}</Badge>
                      <span className="text-xs text-muted-foreground">{a.kind}</span>
                    </div>
                    <p className="text-sm mt-1">{a.message}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(a.created_at).toLocaleString("pt-PT")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
