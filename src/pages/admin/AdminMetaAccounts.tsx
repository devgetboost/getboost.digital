import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, RefreshCw, Link2, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type MetaAccount = {
  id: string;
  rede: string;
  account_label: string;
  handle: string | null;
  external_id: string | null;
  connection_status: string;
  connection_checked_at: string | null;
  last_error: string | null;
  metadata: {
    account_name?: string | null;
    permissions?: string[];
    page_access_token?: string | null;
    page_id?: string | null;
    ig_user_id?: string | null;
    last_synced_at?: string | null;
    last_sync_ok?: boolean;
    last_sync_error?: string | null;
  } | null;
};

export default function AdminMetaAccounts() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("social_media_accounts")
      .select("*")
      .in("rede", ["instagram", "facebook"])
      .order("rede")
      .order("account_label");
    if (error) toast({ title: "Erro a carregar", description: error.message, variant: "destructive" });
    else setAccounts((data ?? []) as unknown as MetaAccount[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Handle OAuth return: reload accounts and immediately validate each token
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("meta");
    if (!status) return;
    const url = new URL(window.location.href);
    ["meta", "count", "reason"].forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.toString());

    if (status === "connected") {
      toast({ title: "Meta ligada", description: `${params.get("count") ?? "?"} conta(s) autorizadas. A validar tokens…` });
      (async () => {
        setLoading(true);
        const { data } = await supabase
          .from("social_media_accounts")
          .select("*")
          .in("rede", ["instagram", "facebook"])
          .order("rede").order("account_label");
        const list = (data ?? []) as unknown as MetaAccount[];
        setAccounts(list);
        setLoading(false);
        // Fire-and-forget per-account validation to refresh token status immediately
        await Promise.all(list.map(a =>
          supabase.functions.invoke("social-media-account-sync", { body: { account_id: a.id } }).catch(() => null)
        ));
        await load();
      })();
    } else {
      toast({ title: "Falha OAuth Meta", description: params.get("reason") ?? "erro", variant: "destructive" });
    }
  }, []);

  const connectMeta = async () => {
    try {
      const returnTo = `${window.location.origin}${window.location.pathname}`;
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) { toast({ title: "Sessão expirada", variant: "destructive" }); return; }
      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-oauth?action=start&return_to=${encodeURIComponent(returnTo)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const j = await resp.json();
      if (!resp.ok || !j?.authorize_url) throw new Error(j?.error ?? `HTTP ${resp.status}`);
      window.location.href = j.authorize_url;
    } catch (e: any) {
      toast({ title: "Erro OAuth", description: e?.message ?? String(e), variant: "destructive" });
    }
  };

  const validate = async (id: string) => {
    setSyncingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("social-media-account-sync", { body: { account_id: id } });
      if (error) throw error;
      if (data?.ok === false) {
        toast({ title: "Token inválido", description: data?.sync?.error ?? "falha", variant: "destructive" });
      } else {
        toast({ title: "Token válido", description: data?.metadata?.account_name ?? "OK" });
      }
      await load();
    } catch (e: any) {
      toast({ title: "Erro a validar", description: e?.message ?? String(e), variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  const copy = async (v: string, label: string) => {
    try { await navigator.clipboard.writeText(v); toast({ title: `${label} copiado` }); } catch { /* noop */ }
  };

  const tokenStatus = (a: MetaAccount) => {
    const hasToken = !!a.metadata?.page_access_token;
    const lastOk = a.metadata?.last_sync_ok;
    if (!hasToken) return { label: "sem token", variant: "destructive" as const, icon: XCircle };
    if (lastOk === false) return { label: "token inválido", variant: "destructive" as const, icon: XCircle };
    if (lastOk === true) return { label: "token válido", variant: "default" as const, icon: CheckCircle2 };
    return { label: "por validar", variant: "outline" as const, icon: RefreshCw };
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai/social-media-accounts" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Todas as contas
      </Link>
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Link2 className="h-6 w-6" /> Instagram & Facebook — Meta OAuth
        </h1>
        <p className="text-sm text-muted-foreground">
          Liga as tuas páginas do Facebook e contas Instagram Business. Cada conta mostra o <code>external_id</code> e o estado do <code>page_access_token</code>.
        </p>
        <div className="mt-3">
          <Button onClick={connectMeta} size="sm" className="gap-2">
            <Link2 className="h-4 w-4" /> Ligar / Reautorizar Meta
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" /> A carregar…</div>
      ) : accounts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nenhuma conta Instagram/Facebook ligada. Clica em <strong>Ligar / Reautorizar Meta</strong> para autorizar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map(a => {
            const s = tokenStatus(a);
            const Icon = s.icon;
            return (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="uppercase text-[10px]">{a.rede}</Badge>
                      {a.account_label}
                    </CardTitle>
                    <Badge variant={s.variant} className="gap-1">
                      <Icon className="h-3 w-3" /> {s.label}
                    </Badge>
                  </div>
                  {a.handle && <CardDescription>{a.handle}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <Row label="external_id" value={a.external_id} onCopy={v => copy(v, "external_id")} />
                  <Row label="page_id" value={a.metadata?.page_id ?? null} onCopy={v => copy(v, "page_id")} />
                  {a.rede === "instagram" && (
                    <Row label="ig_user_id" value={a.metadata?.ig_user_id ?? null} onCopy={v => copy(v, "ig_user_id")} />
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">page_access_token</span>
                    <span className="font-mono">
                      {a.metadata?.page_access_token
                        ? `${a.metadata.page_access_token.slice(0, 6)}…${a.metadata.page_access_token.slice(-4)}`
                        : "—"}
                    </span>
                  </div>
                  {a.metadata?.permissions && a.metadata.permissions.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {a.metadata.permissions.map(p => (
                        <Badge key={p} variant="outline" className="text-[10px]">{p}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-1 text-muted-foreground">
                    <span>última validação</span>
                    <span>{a.metadata?.last_synced_at ? new Date(a.metadata.last_synced_at).toLocaleString("pt-PT") : "—"}</span>
                  </div>
                  {a.metadata?.last_sync_error && (
                    <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-destructive">
                      {a.metadata.last_sync_error}
                    </div>
                  )}
                  <div className="pt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => validate(a.id)} disabled={syncingId === a.id} className="gap-1">
                      {syncingId === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                      Validar token
                    </Button>
                    <Button size="sm" variant="secondary" onClick={connectMeta} className="gap-1">
                      <Link2 className="h-3 w-3" /> Reautorizar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ label, value, onCopy }: { label: string; value: string | null; onCopy: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1 min-w-0">
        <span className="font-mono truncate">{value ?? "—"}</span>
        {value && (
          <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => onCopy(value)}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
