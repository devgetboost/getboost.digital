import { useState } from "react";
import { RefreshCw, Unplug, Loader2, ShieldCheck, CheckCircle2, XCircle, Send, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeIntegration } from "@/lib/integrationDiag";

type Props = {
  accountId: string;
  email: string;
  provider?: "gmail" | "outlook" | "imap";
  onChanged: () => void;
};

type CheckResult = { id: string; label: string; ok: boolean; detail: string };

export function AccountActions({ accountId, email, provider = "gmail", onChanged }: Props) {
  const [reconnecting, setReconnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [testing, setTesting] = useState(false);

  const [checks, setChecks] = useState<CheckResult[] | null>(null);
  const [sendingSmtpTest, setSendingSmtpTest] = useState(false);

  const isImap = provider === "imap";

  const runImapTest = async () => {
    setTesting(true);
    setChecks(null);
    try {
      const { data, error } = await invokeIntegration("email-imap-smtp-sync", {
        body: { action: "test_connection", account_id: accountId, folder: "inbox" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setChecks((data as any).checks as CheckResult[]);
      toast.success("Ligação IMAP OK.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao testar IMAP.");
      setChecks([{ id: "error", label: "Erro", ok: false, detail: e?.message ?? String(e) }]);
    } finally {
      setTesting(false);
    }
  };

  const sendSmtpTest = async () => {
    setSendingSmtpTest(true);
    try {
      const { data, error } = await invokeIntegration("email-imap-smtp-send", {
        body: { action: "send_test", account_id: accountId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(`Email de teste enviado para ${(data as any).to}.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar email de teste.");
    } finally {
      setSendingSmtpTest(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setChecks(null);
    try {
      const { data, error } = await invokeIntegration("email-gmail-proxy", {
        body: { action: "test_connection", account_id: accountId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setChecks((data as any).checks as CheckResult[]);
      if ((data as any).ok) toast.success("Ligação Gmail OK.");
      else toast.warning("Algumas permissões falharam. Reautoriza a conta.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao testar ligação.");
      setChecks([{ id: "error", label: "Erro", ok: false, detail: e?.message ?? String(e) }]);
    } finally {
      setTesting(false);
    }
  };

  const reconnect = async () => {
    setReconnecting(true);
    try {
      const returnUrl = `${window.location.origin}/admin/inbox-mail/oauth/callback`;
      const { data, error } = await invokeIntegration("email-gmail-proxy", {
        body: { action: "oauth_start", return_url: returnUrl },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const popup = window.open((data as any).authorization_url, "gmail-oauth", "width=520,height=680");
      if (!popup) throw new Error("Popup bloqueado. Autoriza popups para este site.");

      const onMsg = (ev: MessageEvent) => {
        if (ev.origin !== window.location.origin) return;
        if (ev.data?.type === "gmail-connected") {
          window.removeEventListener("message", onMsg);
          toast.success("Gmail reautorizado com sucesso.");
          onChanged();
        }
      };
      window.addEventListener("message", onMsg);

      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          window.removeEventListener("message", onMsg);
          setReconnecting(false);
        }
      }, 700);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao reautorizar Gmail.");
      setReconnecting(false);
    }
  };

  const disconnect = async () => {
    setDisconnecting(true);
    try {
      const { error } = await supabase
        .from("email_accounts")
        .update({ status: "disconnected", connection_key: null })
        .eq("id", accountId);
      if (error) throw error;
      toast.success("Conta desligada.");
      onChanged();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao desligar conta.");
    } finally {
      setDisconnecting(false);
    }
  };

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground hidden sm:inline">{email}</span>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Definições da conta">
            <Settings className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Definições da conta</DialogTitle>
            <DialogDescription>{email}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            {isImap ? (
              <>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={runImapTest} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Testar ligação IMAP
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={sendSmtpTest} disabled={sendingSmtpTest}>
                  {sendingSmtpTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar email de teste (SMTP)
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={runTest} disabled={testing}>
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Testar ligação Gmail
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={reconnect} disabled={reconnecting}>
                  {reconnecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Reautorizar Gmail
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              onClick={() => setConfirmDisconnect(true)}
            >
              <Unplug className="h-4 w-4" /> Desligar conta
            </Button>
          </div>

          {checks && (
            <div className="space-y-2 border-t pt-3 mt-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resultado do teste</p>
              {checks.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 rounded-md border p-2.5 text-sm">
                  {c.ok
                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                    : <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground break-words">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDisconnect} onOpenChange={setConfirmDisconnect}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desligar {email}?</AlertDialogTitle>
            <AlertDialogDescription>
              A conta deixa de sincronizar e não poderás enviar emails até reautorizares.
              Para revogar completamente o acesso, remove também esta app em{" "}
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="underline">
                myaccount.google.com/permissions
              </a>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setConfirmDisconnect(false); disconnect(); }} disabled={disconnecting}>
              {disconnecting ? "A desligar…" : "Desligar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
