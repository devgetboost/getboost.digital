import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { invokeIntegration } from "@/lib/integrationDiag";
import { ImapSmtpForm } from "./ImapSmtpForm";

type Props = { onConnected?: () => void };

export function ConnectAccountCard({ onConnected }: Props) {
  const [loading, setLoading] = useState<"gmail" | null>(null);
  const [imapOpen, setImapOpen] = useState(false);

  const connectGmail = async () => {
    setLoading("gmail");
    try {
      const returnUrl = `${window.location.origin}/admin/inbox-mail/oauth/callback`;

      const { data, error } = await invokeIntegration("email-gmail-proxy", {
        body: { action: "oauth_start", return_url: returnUrl },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const authUrl = (data as any).authorization_url as string;
      const popup = window.open(authUrl, "gmail-oauth", "width=520,height=680");
      if (!popup) throw new Error("Popup bloqueado. Autoriza popups para este site.");

      // Listen for the callback page notifying us
      const onMsg = (ev: MessageEvent) => {
        if (ev.origin !== window.location.origin) return;
        if (ev.data?.type === "gmail-connected") {
          window.removeEventListener("message", onMsg);
          toast.success("Gmail ligado com sucesso.");
          onConnected?.();
        }
      };
      window.addEventListener("message", onMsg);

      // Cleanup when popup closes without success
      const timer = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(timer);
          window.removeEventListener("message", onMsg);
          setLoading(null);
        }
      }, 700);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao iniciar OAuth do Gmail.");
      setLoading(null);
    }
  };

  const notImplemented = (provider: string) =>
    toast.info(`Ligação ${provider} disponível numa fase seguinte.`);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <Card className="max-w-xl w-full border-dashed">
        <CardContent className="py-10 text-center space-y-5">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold">Liga a tua caixa de email</h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Recebe e envia emails diretamente aqui, associa mensagens a leads e organiza tudo
              com etiquetas personalizadas.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={connectGmail} disabled={loading === "gmail"} className="gap-2">
              {loading === "gmail" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
              )}
              Ligar Gmail
            </Button>
            <Button variant="outline" onClick={() => notImplemented("Outlook")}>Ligar Outlook</Button>
            <Button variant="outline" onClick={() => setImapOpen(true)}>IMAP/SMTP</Button>
          </div>
          <p className="text-[11px] text-muted-foreground pt-2">
            Autorizas o Gmail via Google OAuth. Os tokens são geridos pelo gateway seguro da Lovable — nunca ficam guardados na app.
          </p>
        </CardContent>
      </Card>
      <ImapSmtpForm
        open={imapOpen}
        onOpenChange={setImapOpen}
        onConnected={() => { setImapOpen(false); onConnected?.(); }}
      />
    </div>
  );
}
