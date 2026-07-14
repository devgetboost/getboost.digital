import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeIntegration } from "@/lib/integrationDiag";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function GmailOAuthCallback() {
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [message, setMessage] = useState("A finalizar ligação ao Gmail…");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const params: Record<string, string> = {};
    new URLSearchParams(window.location.search).forEach((v, k) => (params[k] = v));

    (async () => {
      try {
        const { data, error } = await invokeIntegration("email-gmail-proxy", {
          body: { action: "oauth_callback", params },
        });
        if (error) throw error;
        if ((data as any)?.error) throw new Error((data as any).error);
        setState("ok");
        setMessage(`Conta ligada: ${(data as any).email}`);
        // Notify opener and close
        if (window.opener) {
          window.opener.postMessage({ type: "gmail-connected", account_id: (data as any).account_id }, window.location.origin);
          setTimeout(() => window.close(), 800);
        } else {
          setTimeout(() => (window.location.href = "/admin/inbox-mail"), 1200);
        }
      } catch (e: any) {
        setState("error");
        setMessage(e?.message ?? "Falha ao ligar Gmail.");
      }
    })();
  }, []);

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-4 rounded-lg border bg-background p-8">
        {state === "working" && <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />}
        {state === "ok" && <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500" />}
        {state === "error" && <XCircle className="mx-auto h-8 w-8 text-destructive" />}
        <h1 className="text-lg font-semibold">
          {state === "working" ? "A ligar Gmail…" : state === "ok" ? "Gmail ligado" : "Erro na ligação"}
        </h1>
        <p className="text-sm text-muted-foreground break-words">{message}</p>
      </div>
    </div>
  );
}
