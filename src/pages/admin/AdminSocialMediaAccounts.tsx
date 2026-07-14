import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ToastAction } from "@/components/ui/toast";
import { ArrowLeft, ArrowUpDown, ChevronLeft, ChevronRight, Copy, Loader2, Plus, RefreshCw, Save, Trash2, Link2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const REDES = [
  "instagram", "instagram_stories", "facebook", "linkedin",
  "tiktok", "youtube", "youtube_shorts", "x",
] as const;
type Rede = typeof REDES[number];

type Attempt = { at: string; ok: boolean; error?: string | null };
type Account = {
  id: string;
  rede: string;
  account_label: string;
  handle: string | null;
  external_id: string | null;
  agent_id: string | null;
  connector_id: string | null;
  connection_id: string | null;
  status: string;
  notes: string | null;
  connection_status: string;
  connection_checked_at: string | null;
  last_error: string | null;
  last_error_at: string | null;
  recent_attempts: Attempt[] | null;
  metadata: {
    account_name?: string | null;
    permissions?: string[];
    last_synced_at?: string | null;
    last_sync_ok?: boolean;
    last_sync_error?: string | null;
  } | null;
};

type Agent = { id: string; name: string; function_slug: string | null };

const empty = { rede: "linkedin" as Rede, account_label: "", handle: "", external_id: "", agent_id: "", connector_id: "", connection_id: "", status: "active", notes: "" };

export default function AdminSocialMediaAccounts() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redeParam = searchParams.get("rede");
  const isValidRede = redeParam !== null && (REDES as readonly string[]).includes(redeParam);
  const redeParamInvalid = redeParam !== null && !isValidRede;
  const initialRede: Rede = isValidRede ? (redeParam as Rede) : "linkedin";
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [form, setForm] = useState({ ...empty, rede: initialRede });
  const [redeFilter, setRedeFilter] = useState<string>(isValidRede ? (redeParam as string) : "all");
  const [syncingId, setSyncingId] = useState<string | null>(null);

  useEffect(() => {
    if (redeParamInvalid) {
      toast({
        title: "Rede inválida",
        description: `"${redeParam}" não é uma rede conhecida. Filtro ignorado.`,
        variant: "destructive",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [redeTest, setRedeTest] = useState(redeParam ?? "");
  const redeTestValid = redeTest.trim() !== "" && (REDES as readonly string[]).includes(redeTest.trim());
  type SortKey = "rede" | "account_label" | "handle" | "status" | "connection_status" | "connection_checked_at";
  const [sortKey, setSortKey] = useState<SortKey>("rede");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("asc"); }
    setPage(1);
  };

  const load = async () => {
    setLoading(true);
    const [a, g] = await Promise.all([
      supabase.from("social_media_accounts").select("*").order("rede").order("account_label"),
      supabase.from("agentic_agents").select("id,name,function_slug").order("name"),
    ]);
    if (a.error) toast({ title: "Erro a carregar contas", description: a.error.message, variant: "destructive" });
    else setAccounts((a.data ?? []) as unknown as Account[]);
    if (g.error) toast({ title: "Erro a carregar agentes", description: g.error.message, variant: "destructive" });
    else setAgents((g.data ?? []) as Agent[]);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Handle return from Meta OAuth (?meta=connected|error)
  useEffect(() => {
    const status = searchParams.get("meta");
    if (!status) return;
    if (status === "connected") {
      const count = searchParams.get("count") ?? "?";
      toast({ title: "Meta ligada", description: `${count} conta(s) Facebook/Instagram sincronizadas.` });
      load();
    } else {
      toast({ title: "Falha a ligar Meta", description: searchParams.get("reason") ?? "erro desconhecido", variant: "destructive" });
    }
    // clean the URL
    const url = new URL(window.location.href);
    ["meta", "count", "reason"].forEach(k => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectMeta = async () => {
    try {
      const returnTo = `${window.location.origin}${window.location.pathname}`;
      const { data, error } = await supabase.functions.invoke("meta-oauth", {
        method: "GET",
        body: undefined,
        // pass query via headers isn't supported; use fetch directly
      } as any);
      // Fallback to explicit fetch with query params (functions.invoke doesn't forward query)
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
      void data; void error;
    } catch (e: any) {
      toast({ title: "Não foi possível iniciar OAuth Meta", description: e?.message ?? String(e), variant: "destructive" });
    }
  };


  const agentsById = useMemo(() => Object.fromEntries(agents.map(a => [a.id, a])), [agents]);

  const sortedAccounts = useMemo(() => {
    const arr = accounts.filter(a => redeFilter === "all" || a.rede === redeFilter);
    arr.sort((a, b) => {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [accounts, sortKey, sortDir, redeFilter]);

  const totalPages = Math.max(1, Math.ceil(sortedAccounts.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedAccounts = useMemo(
    () => sortedAccounts.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sortedAccounts, currentPage, pageSize]
  );

  const syncAccount = async (id: string, opts: { silent?: boolean } = {}) => {
    setSyncingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("social-media-account-sync", { body: { account_id: id } });
      if (error) throw error;
      if (data && data.ok === false && data?.sync?.error) {
        toast({ title: "Sincronização falhou", description: data.sync.error, variant: "destructive" });
      } else if (!opts.silent) {
        toast({ title: "Conta sincronizada", description: data?.metadata?.account_name ?? undefined });
      }
      await load();
    } catch (err: any) {
      toast({ title: "Erro a sincronizar", description: err?.message ?? String(err), variant: "destructive" });
    } finally {
      setSyncingId(null);
    }
  };

  const create = async () => {
    if (!form.account_label.trim()) {
      toast({ title: "Falta a etiqueta da conta", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: inserted, error } = await supabase.from("social_media_accounts").insert({
      rede: form.rede,
      account_label: form.account_label.trim(),
      handle: form.handle.trim() || null,
      external_id: form.external_id.trim() || null,
      agent_id: form.agent_id || null,
      connector_id: form.connector_id.trim() || null,
      connection_id: form.connection_id.trim() || null,
      status: form.status,
      notes: form.notes.trim() || null,
    }).select("id").maybeSingle();
    setSaving(false);
    if (error) { toast({ title: "Erro a criar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Conta social criada — a sincronizar…" });
    setForm({ ...empty });
    await load();
    if (inserted?.id) await syncAccount(inserted.id, { silent: true });
  };

  const updateField = async (id: string, patch: Partial<Account>) => {
    const { error } = await supabase.from("social_media_accounts").update(patch).eq("id", id);
    if (error) toast({ title: "Erro a guardar", description: error.message, variant: "destructive" });
    else {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
      const changedStatus = Object.prototype.hasOwnProperty.call(patch, "status");
      toast({
        title: "Actualizado",
        description: changedStatus ? "Status alterado. Voltar aos rascunhos?" : undefined,
        action: changedStatus ? (
          <ToastAction altText="Voltar aos rascunhos" onClick={() => navigate("/admin/agentic-ai/social-media-drafts")}>
            Voltar aos rascunhos
          </ToastAction>
        ) : undefined,
      });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Remover esta conta social?")) return;
    const { error } = await supabase.from("social_media_accounts").delete().eq("id", id);
    if (error) toast({ title: "Erro a remover", description: error.message, variant: "destructive" });
    else { setAccounts(prev => prev.filter(a => a.id !== id)); toast({ title: "Removida" }); }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Link to="/admin/agentic-ai/social-media-drafts" className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Voltar aos rascunhos
      </Link>
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Link2 className="h-6 w-6" /> Contas sociais & agentes
        </h1>
        <p className="text-sm text-muted-foreground">
          Regista as contas ligadas a cada rede e associa o agente responsável por gerar/aprovar os posts dessa conta.
        </p>
        <div className="mt-3">
          <Button onClick={connectMeta} size="sm" className="gap-2">
            <Link2 className="h-4 w-4" /> Ligar Instagram / Facebook (OAuth Meta)
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Autoriza a app na Meta — as páginas e contas IG ligadas ficam com <code>page_access_token</code> guardado para publicação e sync automáticos.
          </p>
        </div>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Redes suportadas</CardTitle>
          <CardDescription>
            Valores válidos para o parâmetro <code className="text-xs">?rede=</code>. Clica para copiar (útil para debug de URLs).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {REDES.map(r => (
            <Button
              key={r}
              size="sm"
              variant="outline"
              className="gap-1 font-mono text-xs"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(r);
                  toast({ title: "Copiado", description: `rede=${r}` });
                } catch {
                  toast({ title: "Não foi possível copiar", variant: "destructive" });
                }
              }}
              title={`Copiar "${r}"`}
            >
              {r} <Copy className="h-3 w-3" />
            </Button>
          ))}
        </CardContent>
        <CardContent className="pt-0 space-y-2 text-xs">
          <div className="font-medium text-muted-foreground">Exemplos</div>
          {[
            { label: "Válido (LinkedIn)", url: "/admin/agentic-ai/social-media-accounts?rede=linkedin", ok: true },
            { label: "Válido (Instagram Stories)", url: "/admin/agentic-ai/social-media-accounts?rede=instagram_stories", ok: true },
            { label: "Válido (sem filtro)", url: "/admin/agentic-ai/social-media-accounts", ok: true },
            { label: "Inválido (typo)", url: "/admin/agentic-ai/social-media-accounts?rede=linkdin", ok: false },
            { label: "Inválido (desconhecida)", url: "/admin/agentic-ai/social-media-accounts?rede=threads", ok: false },
          ].map(ex => (
            <div key={ex.url} className="flex items-center gap-2 flex-wrap">
              <Badge variant={ex.ok ? "default" : "destructive"} className="shrink-0">{ex.ok ? "válido" : "inválido"}</Badge>
              <span className="text-muted-foreground shrink-0">{ex.label}:</span>
              <code className="font-mono break-all">{ex.url}</code>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(ex.url);
                    toast({ title: "URL copiado" });
                  } catch {
                    toast({ title: "Não foi possível copiar", variant: "destructive" });
                  }
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </CardContent>
        <CardContent className="pt-0 space-y-2 text-xs">
          <div className="font-medium text-muted-foreground">Testar valor de <code>rede</code></div>
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              value={redeTest}
              onChange={e => setRedeTest(e.target.value)}
              placeholder="ex.: linkedin"
              className="h-8 max-w-[220px] font-mono text-xs"
            />
            {redeTest.trim() === "" ? (
              <Badge variant="outline">Aguarda input…</Badge>
            ) : redeTestValid ? (
              <Badge variant="default">válido</Badge>
            ) : (
              <Badge variant="destructive">inválido</Badge>
            )}
            {redeTestValid && (
              <code className="font-mono break-all">?rede={redeTest.trim()}</code>
            )}
          </div>
          {redeTest.trim() !== "" && !redeTestValid && (
            <div className="rounded border border-destructive/40 bg-destructive/5 p-2 text-destructive">
              <div className="font-medium">
                "{redeTest.trim()}" não é uma rede válida.
              </div>
              <div className="mt-1 text-muted-foreground">
                Valores aceites: {REDES.map((r, i) => (
                  <span key={r}>
                    {i > 0 && ", "}
                    <code className="font-mono">{r}</code>
                  </span>
                ))}.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Nova conta</CardTitle><CardDescription>Preenche os campos e liga a um agente existente.</CardDescription></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Rede</Label>
            <Select value={form.rede} onValueChange={v => setForm(f => ({ ...f, rede: v as Rede }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{REDES.map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Etiqueta da conta *</Label>
            <Input value={form.account_label} onChange={e => setForm(f => ({ ...f, account_label: e.target.value }))} placeholder="ex.: Nuno Cruz — pessoal" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Handle / @username</Label>
            <Input value={form.handle} onChange={e => setForm(f => ({ ...f, handle: e.target.value }))} placeholder="@nunocruz" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Agente</Label>
            <Select value={form.agent_id || "none"} onValueChange={v => setForm(f => ({ ...f, agent_id: v === "none" ? "" : v }))}>
              <SelectTrigger><SelectValue placeholder="(sem agente)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">(sem agente)</SelectItem>
                {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Connector ID</Label>
            <Input value={form.connector_id} onChange={e => setForm(f => ({ ...f, connector_id: e.target.value }))} placeholder="linkedin, tiktok, x…" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Connection ID (std_…)</Label>
            <Input value={form.connection_id} onChange={e => setForm(f => ({ ...f, connection_id: e.target.value }))} placeholder="std_01..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">External ID</Label>
            <Input value={form.external_id} onChange={e => setForm(f => ({ ...f, external_id: e.target.value }))} placeholder="URN / user id" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="inactive">inactive</SelectItem>
                <SelectItem value="error">error</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 md:col-span-3">
            <Label className="text-xs">Notas</Label>
            <Input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="md:col-span-3">
            <Button size="sm" onClick={create} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />} Criar conta
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            Contas registadas ({sortedAccounts.length}{redeFilter !== "all" ? ` de ${accounts.length}` : ""})
            {redeFilter !== "all" && (
              <Button size="sm" variant="ghost" className="ml-2 h-6 text-xs" onClick={() => setRedeFilter("all")}>
                Filtro: {redeFilter} ✕
              </Button>
            )}
          </h2>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Por página</span>
            <Select value={String(pageSize)} onValueChange={v => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {[5, 10, 25, 50].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!loading && accounts.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs border rounded-md p-2 bg-muted/30">
            <span className="text-muted-foreground mr-1">Ordenar:</span>
            {([
              ["rede", "Rede"],
              ["account_label", "Etiqueta"],
              ["handle", "Handle"],
              ["status", "Status"],
              ["connection_status", "Ligação"],
              ["connection_checked_at", "Verificado"],
            ] as [SortKey, string][]).map(([k, label]) => (
              <Button key={k} size="sm" variant={sortKey === k ? "secondary" : "ghost"} className="h-7 gap-1" onClick={() => toggleSort(k)}>
                {label} <ArrowUpDown className="h-3 w-3" />
                {sortKey === k && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
              </Button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> A carregar…</div>
        ) : accounts.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ainda sem contas registadas.</div>
        ) : pagedAccounts.map(acc => (
          <Card key={acc.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base capitalize">{acc.rede.replace("_", " ")} · {acc.account_label}</CardTitle>
                  <CardDescription className="text-xs">
                    {acc.handle ?? "sem handle"} · agente: {acc.agent_id ? (agentsById[acc.agent_id]?.name ?? acc.agent_id) : "—"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    acc.connection_status === "connected" ? "default"
                    : acc.connection_status === "error" ? "destructive"
                    : acc.connection_status === "disconnected" ? "secondary"
                    : "outline"
                  }>
                    {acc.connection_status}
                    {acc.connection_checked_at ? ` · ${new Date(acc.connection_checked_at).toLocaleString()}` : ""}
                  </Badge>
                  <Badge variant={acc.status === "active" ? "default" : acc.status === "error" ? "destructive" : "secondary"}>{acc.status}</Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncAccount(acc.id)}
                    disabled={syncingId === acc.id}
                    title="Sincronizar nome/permissões e estado da ligação"
                  >
                    {syncingId === acc.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(acc.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
              {(acc.metadata?.account_name || (acc.metadata?.permissions?.length ?? 0) > 0 || acc.metadata?.last_synced_at) && (
                <div className="mt-2 rounded border bg-muted/30 p-2 text-xs space-y-1">
                  {acc.metadata?.account_name && (
                    <div><span className="text-muted-foreground">Nome:</span> <span className="font-medium">{acc.metadata.account_name}</span></div>
                  )}
                  {acc.metadata?.permissions && acc.metadata.permissions.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-muted-foreground">Permissões:</span>
                      {acc.metadata.permissions.map(p => <Badge key={p} variant="secondary" className="font-mono text-[10px]">{p}</Badge>)}
                    </div>
                  )}
                  {acc.metadata?.last_synced_at && (
                    <div className="text-muted-foreground">
                      Último refresh: {new Date(acc.metadata.last_synced_at).toLocaleString()}
                      {acc.metadata.last_sync_ok === false && acc.metadata.last_sync_error ? ` · ${acc.metadata.last_sync_error}` : ""}
                    </div>
                  )}
                </div>
              )}
              {acc.last_error && (
                <div className="mt-2 rounded border border-destructive/40 bg-destructive/5 p-2 text-xs">
                  <div className="font-medium text-destructive">Último erro{acc.last_error_at ? ` · ${new Date(acc.last_error_at).toLocaleString()}` : ""}</div>
                  <div className="text-muted-foreground break-words">{acc.last_error}</div>
                </div>
              )}
              {Array.isArray(acc.recent_attempts) && acc.recent_attempts.length > 0 && (
                <div className="mt-2 text-xs">
                  <div className="font-medium mb-1">Tentativas recentes</div>
                  <ul className="space-y-0.5 max-h-32 overflow-auto">
                    {acc.recent_attempts.slice(0, 10).map((t, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Badge variant={t.ok ? "default" : "destructive"} className="shrink-0">{t.ok ? "ok" : "fail"}</Badge>
                        <span className="text-muted-foreground">{new Date(t.at).toLocaleString()}</span>
                        {t.error && <span className="text-destructive truncate">— {t.error}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Agente</Label>
                <Select value={acc.agent_id ?? "none"} onValueChange={v => updateField(acc.id, { agent_id: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">(sem agente)</SelectItem>
                    {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status</Label>
                <Select value={acc.status} onValueChange={v => updateField(acc.id, { status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">active</SelectItem>
                    <SelectItem value="inactive">inactive</SelectItem>
                    <SelectItem value="error">error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Handle</Label>
                <Input defaultValue={acc.handle ?? ""} onBlur={e => e.target.value !== (acc.handle ?? "") && updateField(acc.id, { handle: e.target.value || null })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Connector ID</Label>
                <Input defaultValue={acc.connector_id ?? ""} onBlur={e => e.target.value !== (acc.connector_id ?? "") && updateField(acc.id, { connector_id: e.target.value || null })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Connection ID</Label>
                <Input defaultValue={acc.connection_id ?? ""} onBlur={e => e.target.value !== (acc.connection_id ?? "") && updateField(acc.id, { connection_id: e.target.value || null })} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">External ID</Label>
                <Input defaultValue={acc.external_id ?? ""} onBlur={e => e.target.value !== (acc.external_id ?? "") && updateField(acc.id, { external_id: e.target.value || null })} />
              </div>
            </CardContent>
          </Card>
        ))}


        {!loading && accounts.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2">
            <span>
              A mostrar {(currentPage - 1) * pageSize + 1}
              –{Math.min(currentPage * pageSize, sortedAccounts.length)} de {sortedAccounts.length}
            </span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7" disabled={currentPage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                <ChevronLeft className="h-3 w-3" /> Anterior
              </Button>
              <span className="px-2">Página {currentPage} / {totalPages}</span>
              <Button size="sm" variant="outline" className="h-7" disabled={currentPage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Seguinte <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
