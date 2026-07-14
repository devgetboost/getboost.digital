import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Check, Send, MessageCircle } from "lucide-react";

// Formato aceite:
//  - IDs numéricos: -100xxxxxxxxx (supergroups/channels) ou -12345 / 12345 (grupos/DMs)
//  - Usernames públicos: @username (5+ chars, [A-Za-z0-9_])
export function isValidTelegramChatId(id: string): boolean {
  return /^(-100\d{6,}|-?\d{5,})$/.test(id) || /^@[A-Za-z][A-Za-z0-9_]{4,}$/.test(id);
}

function formatHint(id: string): string {
  if (id.startsWith("@")) return "username";
  if (id.startsWith("-100")) return "canal/supergrupo";
  if (id.startsWith("-")) return "grupo";
  return "chat privado";
}

export default function TelegramChatIdsAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [ids, setIds] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("whatsapp_concierge_alert_settings")
      .select("telegram_chat_ids")
      .eq("id", 1)
      .maybeSingle();
    if (error) {
      console.error("[telegram-ids] load failed", error);
      toast.error("Não foi possível carregar", { description: error.message });
    }
    let row = data as { telegram_chat_ids: string[] | null } | null;
    if (!row) {
      const { data: inserted, error: insErr } = await supabase
        .from("whatsapp_concierge_alert_settings")
        .insert({ id: 1 })
        .select("telegram_chat_ids")
        .maybeSingle();
      if (insErr) {
        toast.error("Falha a inicializar", { description: insErr.message });
      } else {
        row = inserted as { telegram_chat_ids: string[] | null } | null;
      }
    }
    setIds((row?.telegram_chat_ids ?? []).map((v) => String(v)));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const persist = async (next: string[]) => {
    setSaving(true);
    const { error } = await supabase
      .from("whatsapp_concierge_alert_settings")
      .update({ telegram_chat_ids: next, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) {
      toast.error("Erro ao guardar", { description: error.message });
      return false;
    }
    return true;
  };

  const draftTrimmed = draft.trim();
  const draftValid = draftTrimmed.length > 0 && isValidTelegramChatId(draftTrimmed);
  const draftDuplicate = ids.includes(draftTrimmed);

  const add = async () => {
    if (!draftTrimmed) return;
    if (!isValidTelegramChatId(draftTrimmed)) {
      toast.error("Formato inválido", {
        description: "Usa @username (5+ chars) ou ID numérico (ex: -1001234567890).",
      });
      return;
    }
    if (ids.includes(draftTrimmed)) {
      toast.warning("Já existe na lista");
      setDraft("");
      return;
    }
    const next = [...ids, draftTrimmed];
    const prev = ids;
    setIds(next);
    setDraft("");
    if (await persist(next)) {
      toast.success("Chat ID adicionado", { description: draftTrimmed });
    } else {
      setIds(prev);
    }
  };

  const remove = async (id: string) => {
    const prev = ids;
    const next = ids.filter((x) => x !== id);
    setIds(next);
    if (await persist(next)) {
      toast.success("Removido", { description: id });
    } else {
      setIds(prev);
    }
  };

  const test = async (id: string) => {
    setTesting(id);
    const { data, error } = await supabase.functions.invoke("telegram-send-test", {
      body: { chat_id: id },
    });
    setTesting(null);
    if (error) {
      toast.error("Falhou o envio de teste", {
        description: error.message ?? "Verifica o TELEGRAM_BOT_TOKEN e se o bot foi adicionado ao chat.",
      });
      return;
    }
    if ((data as any)?.ok) {
      toast.success("Mensagem de teste enviada", { description: id });
    } else {
      toast.error("Telegram rejeitou o envio", {
        description: (data as any)?.error ?? "Verifica se o bot tem acesso a este chat.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageCircle className="h-5 w-5" /> Telegram — Chat IDs
        </h2>
        <p className="text-sm text-muted-foreground">
          Lista de destinos para alertas do Concierge. Aceita <code>@username</code> públicos ou IDs numéricos
          (ex: <code>-1001234567890</code>). Requer o secret <code>TELEGRAM_BOT_TOKEN</code> e o bot adicionado ao chat.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar destino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <Label htmlFor="tg-draft" className="sr-only">Chat ID</Label>
              <Input
                id="tg-draft"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
                placeholder="@getboost_alerts ou -1001234567890"
                className={`font-mono ${draftTrimmed && !draftValid ? "border-destructive" : ""}`}
                aria-invalid={draftTrimmed.length > 0 && !draftValid}
                disabled={loading || saving}
              />
            </div>
            <Button
              onClick={add}
              disabled={!draftValid || draftDuplicate || saving || loading}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </div>
          {draftTrimmed && !draftValid && (
            <p className="text-xs text-destructive">
              Formato inválido — usa <code>@username</code> (5+ caracteres) ou ID numérico (ex: <code>-1001234567890</code>).
            </p>
          )}
          {draftTrimmed && draftValid && !draftDuplicate && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Check className="h-3 w-3 text-green-600" /> Formato válido ({formatHint(draftTrimmed)}).
            </p>
          )}
          {draftDuplicate && (
            <p className="text-xs text-amber-600">Este chat ID já está na lista.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between gap-2">
            <span>Destinos configurados</span>
            <Badge variant="secondary">{ids.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar…
            </div>
          ) : ids.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Ainda não tens destinos. Adiciona o primeiro chat ID acima.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {ids.map((id) => (
                <li key={id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-sm truncate">{id}</div>
                    <div className="text-xs text-muted-foreground">{formatHint(id)}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => test(id)}
                      disabled={testing === id || saving}
                      aria-label={`Enviar teste para ${id}`}
                    >
                      {testing === id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <Send className="h-4 w-4" />}
                      <span className="ml-1 hidden sm:inline">Testar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(id)}
                      disabled={saving}
                      aria-label={`Remover ${id}`}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
