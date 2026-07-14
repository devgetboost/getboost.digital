import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { CheckCircle2, XCircle, Calendar, Eye, History, RotateCcw, Activity, AlertTriangle, Play, Mail, MessageSquareWarning, Sparkles, Plus, Link as LinkIcon, Wrench } from "lucide-react";
import { Label } from "@/components/ui/label";

const NEW_ACCOUNT_REDES = [
  "instagram", "instagram_stories", "facebook", "linkedin",
  "tiktok", "youtube", "youtube_shorts", "x",
] as const;
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { translateDraftError } from "@/lib/socialMediaDraftErrors";
import { applyVideoUrlToOutput } from "@/lib/tiktokVideoUrl";
import { shouldNotify } from "@/lib/adminNotificationPrefs";

type AuditEntry = {
  id: string;
  actor_email: string | null;
  actor_id: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
};

type Draft = {
  id: string;
  rede: string | null;
  action: string;
  status: string;
  brand: any;
  payload: any;
  output: any;
  validation: any;
  notes: string | null;
  model: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  approved_at: string | null;
  created_at: string;
  created_by: string | null;
};

// Espelha os defaults do edge function `social-media-agent` e da página de limites por autor.
const BASE_LIMITS: Record<string, { max_chars: number; hashtags_min: number; hashtags_max: number }> = {
  instagram:         { max_chars: 2200, hashtags_min: 5, hashtags_max: 10 },
  instagram_stories: { max_chars: 200,  hashtags_min: 0, hashtags_max: 3 },
  facebook:          { max_chars: 2000, hashtags_min: 0, hashtags_max: 3 },
  linkedin:          { max_chars: 3000, hashtags_min: 0, hashtags_max: 3 },
  tiktok:            { max_chars: 150,  hashtags_min: 3, hashtags_max: 8 },
  youtube:           { max_chars: 5000, hashtags_min: 0, hashtags_max: 15 },
  youtube_shorts:    { max_chars: 100,  hashtags_min: 1, hashtags_max: 5 },
  x:                 { max_chars: 280,  hashtags_min: 0, hashtags_max: 2 },
};

type AuthorLimitRow = {
  max_chars: number | null;
  hashtags_min: number | null;
  hashtags_max: number | null;
};


// Compara output anterior vs. novo e categoriza issues resolvidas / remanescentes / novas.
function computeRegenDiff(
  prev: any,
  next: any,
  prevIssues: any[],
  newIssues: any[],
) {
  const keys = new Set<string>([
    ...Object.keys(prev && typeof prev === "object" ? prev : {}),
    ...Object.keys(next && typeof next === "object" ? next : {}),
  ]);
  const changedFields: { key: string; before: unknown; after: unknown }[] = [];
  for (const k of keys) {
    const a = prev?.[k];
    const b = next?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changedFields.push({ key: k, before: a, after: b });
    }
  }
  const sig = (i: any) =>
    typeof i === "string" ? i : JSON.stringify({ field: i?.field, code: i?.code, message: i?.message });
  const prevSigs = new Set(prevIssues.map(sig));
  const newSigs = new Set(newIssues.map(sig));
  return {
    changedFields,
    resolvedIssues: prevIssues.filter(i => !newSigs.has(sig(i))),
    remainingIssues: newIssues.filter(i => prevSigs.has(sig(i))),
    newIssues: newIssues.filter(i => !prevSigs.has(sig(i))),
  };
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  needs_revision: "Correções pedidas",
  approved: "Aprovado",
  rejected: "Rejeitado",
  scheduled: "Agendado",
  publishing: "A publicar…",
  published: "Publicado",
  rescheduled: "Reagendado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-900",
  needs_revision: "bg-orange-100 text-orange-900",
  approved: "bg-green-100 text-green-900",
  rejected: "bg-red-100 text-red-900",
  scheduled: "bg-blue-100 text-blue-900",
  published: "bg-slate-200 text-slate-700",
};

export default function AdminSocialMediaDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [redeFilter, setRedeFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Draft | null>(null);
  const [scheduleFor, setScheduleFor] = useState<Draft | null>(null);
  const [scheduleAt, setScheduleAt] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [videoUrlEdit, setVideoUrlEdit] = useState<string>("");
  const [savingVideoUrl, setSavingVideoUrl] = useState(false);
  const [decisionFor, setDecisionFor] = useState<Draft | null>(null);
  const [decisionStatus, setDecisionStatus] = useState<"approved" | "rejected" | "needs_revision">("approved");
  const [decisionNotes, setDecisionNotes] = useState<string>("");
  const openDecision = (d: Draft, status: "approved" | "rejected" | "needs_revision") => {
    // Bloqueia aprovação se a conta associada não estiver conectada.
    if (status === "approved") {
      const block = publishBlockReason(d);
      if (block) { toast.error(block); return; }
    }
    setDecisionFor(d);
    setDecisionStatus(status);
    setDecisionNotes(d.notes ?? "");
  };

  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkScheduleOpen, setBulkScheduleOpen] = useState(false);
  const [linkFor, setLinkFor] = useState<Draft | null>(null);
  const [linkAllOpen, setLinkAllOpen] = useState(false);
  const [newAccountOpen, setNewAccountOpen] = useState(false);
  const [newAccountSaving, setNewAccountSaving] = useState(false);
  const [newAccount, setNewAccount] = useState({
    rede: "linkedin" as string,
    account_label: "",
    handle: "",
    connector_id: "",
    connection_id: "",
  });

  const createAccountQuick = async () => {
    if (!newAccount.account_label.trim()) {
      toast.error("Falta a etiqueta da conta");
      return;
    }
    setNewAccountSaving(true);
    const { error } = await supabase.from("social_media_accounts").insert({
      rede: newAccount.rede,
      account_label: newAccount.account_label.trim(),
      handle: newAccount.handle.trim() || null,
      connector_id: newAccount.connector_id.trim() || null,
      connection_id: newAccount.connection_id.trim() || null,
      status: "active",
    });
    setNewAccountSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Conta social criada");
    setLinkedRedes(prev => new Set(prev).add(newAccount.rede.toLowerCase()));
    // A conta acabou de ser criada como active mas ainda sem connection_status="connected".
    // Não a adicionamos a publishableRedes — publicação continua bloqueada até validar credenciais.
    setNewAccount({ rede: "linkedin", account_label: "", handle: "", connector_id: "", connection_id: "" });
    setNewAccountOpen(false);
  };
  const [bulkScheduleAt, setBulkScheduleAt] = useState<string>("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState<"approved" | "rejected" | "scheduled" | null>(null);
  const [regenBusy, setRegenBusy] = useState<string | null>(null);
  type RegenDiff = {
    changedFields: { key: string; before: unknown; after: unknown }[];
    resolvedIssues: any[];
    remainingIssues: any[];
    newIssues: any[];
  };
  const [regenDiffs, setRegenDiffs] = useState<Record<string, RegenDiff>>({});
  const toggleOne = (id: string) => setSelectedIds(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });
  const clearSelection = () => setSelectedIds(new Set());





  const [appliedLimits, setAppliedLimits] = useState<{
    rede: string;
    author_id: string | null;
    override: AuthorLimitRow | null;
    effective: { max_chars: number; hashtags_min: number; hashtags_max: number };
    base: { max_chars: number; hashtags_min: number; hashtags_max: number };
  } | null>(null);

  // Carrega os limites personalizados do autor do rascunho selecionado, se existirem,
  // para mostrar um indicador de quais overrides estão em vigor.
  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!selected?.rede) { setAppliedLimits(null); return; }
      const redeKey = selected.rede.trim().toLowerCase();
      const base = BASE_LIMITS[redeKey];
      if (!base) { setAppliedLimits(null); return; }
      let override: AuthorLimitRow | null = null;
      if (selected.created_by) {
        const { data } = await supabase
          .from("social_media_author_limits")
          .select("max_chars,hashtags_min,hashtags_max")
          .eq("user_id", selected.created_by)
          .eq("rede", redeKey)
          .maybeSingle();
        override = (data as AuthorLimitRow | null) ?? null;
      }
      if (cancel) return;
      setAppliedLimits({
        rede: redeKey,
        author_id: selected.created_by,
        override,
        base,
        effective: {
          max_chars: override?.max_chars ?? base.max_chars,
          hashtags_min: override?.hashtags_min ?? base.hashtags_min,
          hashtags_max: override?.hashtags_max ?? base.hashtags_max,
        },
      });
    })();
    return () => { cancel = true; };
  }, [selected?.id, selected?.rede, selected?.created_by]);


  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("social_media_drafts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setDrafts((data as Draft[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const [linkedRedes, setLinkedRedes] = useState<Set<string>>(new Set());
  // Redes with at least one account that is active AND connection_status === 'connected'.
  // Only these are safe to approve/schedule — outros bloqueiam publicação.
  const [publishableRedes, setPublishableRedes] = useState<Set<string>>(new Set());
  const loadAccountsStatus = async () => {
    const { data } = await supabase
      .from("social_media_accounts")
      .select("rede, status, connection_status")
      .eq("status", "active");
    const linked = new Set<string>();
    const ready = new Set<string>();
    (data ?? []).forEach((r: { rede: string | null; connection_status: string | null }) => {
      if (!r.rede) return;
      const k = r.rede.trim().toLowerCase();
      linked.add(k);
      if ((r.connection_status ?? "").toLowerCase() === "connected") ready.add(k);
    });
    setLinkedRedes(linked);
    setPublishableRedes(ready);
  };
  useEffect(() => {
    loadAccountsStatus();
    const onFocus = () => { loadAccountsStatus(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const publishBlockReason = (d: Draft): string | null => {
    const k = (d.rede ?? "").trim().toLowerCase();
    if (!k) return "Rascunho sem rede definida.";
    if (!linkedRedes.has(k)) return `Sem conta activa para ${k}. Cria/liga uma conta antes de publicar.`;
    if (!publishableRedes.has(k)) return `A conta de ${k} não está conectada (connection_status ≠ connected). Repõe as credenciais em Social Media Accounts.`;
    return null;
  };

  const loadAudit = async (draftId: string) => {
    setAuditLoading(true);
    const { data, error } = await (supabase as any)
      .from("social_media_drafts_audit")
      .select("*")
      .eq("draft_id", draftId)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setAudit((data as AuditEntry[]) ?? []);
    setAuditLoading(false);
  };

  const redes = useMemo(() => Array.from(new Set(drafts.map(d => d.rede).filter(Boolean))) as string[], [drafts]);

  const isTikTok = (d: Draft | null) => !!d?.rede && d.rede.trim().toLowerCase() === "tiktok";
  const getVideoUrl = (d: Draft | null): string => {
    const o = d?.output;
    if (!o || typeof o !== "object") return "";
    return (o as any).video_url ?? (o as any).media_url ?? "";
  };
  const tiktokMissingVideo = (d: Draft) => isTikTok(d) && !getVideoUrl(d);

  const saveVideoUrl = async () => {
    if (!selected) return;
    const result = applyVideoUrlToOutput(selected.output, videoUrlEdit);
    if (result.ok !== true) {
      toast.error(result.error);
      return;
    }
    setSavingVideoUrl(true);
    const nextOutput = result.output as any;
    const { error } = await supabase.from("social_media_drafts").update({ output: nextOutput }).eq("id", selected.id);
    setSavingVideoUrl(false);
    if (error) { toast.error(translateDraftError(error, selected.status)); return; }
    toast.success(nextOutput.video_url ? "URL de vídeo guardado" : "URL de vídeo removido");
    setSelected({ ...selected, output: nextOutput });
    load();
  };

  const filtered = drafts.filter(d =>
    (statusFilter === "all" || d.status === statusFilter) &&
    (redeFilter === "all" || d.rede === redeFilter));

  /**
   * Envia (ou reenvia) o email de notificação de estado.
   * - Respeita `social_media_notification_settings` (destinatários + estados).
   * - Fallback: envia para o admin actual quando não há destinatários configurados.
   * - `resend: true` acrescenta timestamp ao idempotencyKey para forçar novo envio.
   */
  const sendStatusEmail = async (
    d: Draft,
    status: string,
    opts: { scheduledAt?: string | null; notes?: string | null; selfEmail?: string | null; resend?: boolean } = {}
  ): Promise<{ sent: number; failed?: number; skipped?: string; results?: Array<{ to: string; ok: boolean; error?: string }> }> => {
    if (!["approved", "rejected", "scheduled"].includes(status)) return { sent: 0, skipped: "status" };
    const { data: cfg } = await supabase
      .from("social_media_notification_settings")
      .select("recipients,statuses,rules").eq("id", 1).maybeSingle() as any;
    const enabledStatuses = (cfg?.statuses as string[] | null) ?? ["approved", "rejected", "scheduled"];
    const base = ((cfg?.recipients as string[] | null) ?? []).map(s => (s ?? "").trim()).filter(Boolean);
    const rules = (cfg?.rules ?? {}) as { byStatus?: Record<string, string[]>; byNetwork?: Record<string, string[]> };
    const byStatus = (rules.byStatus?.[status] ?? []).map(s => (s ?? "").trim()).filter(Boolean);
    const redeKey = (d.rede ?? "").toLowerCase().trim();
    const byNetwork = (rules.byNetwork?.[redeKey] ?? []).map(s => (s ?? "").trim()).filter(Boolean);
    const self = opts.selfEmail ?? (await supabase.auth.getUser()).data.user?.email ?? null;
    const merged = Array.from(new Set([...base, ...byStatus, ...byNetwork]));
    const recipients = merged.length ? merged : (self ? [self] : []);
    if (!enabledStatuses.includes(status)) return { sent: 0, skipped: "disabled" };
    if (!recipients.length) return { sent: 0, skipped: "no-recipients" };


    const clip = (s: unknown, n = 500) => {
      const v = typeof s === "string" ? s : s == null ? "" : String(s);
      const t = v.trim();
      return t.length > n ? t.slice(0, n) + "…" : t;
    };
    const out: any = typeof d.output === "object" && d.output ? d.output : {};
    const title = clip(out.titulo ?? out.title ?? out.headline, 160);
    const body = clip(out.corpo ?? out.texto ?? out.body ?? out.caption, 800);
    const hashtags = Array.isArray(out.hashtags)
      ? out.hashtags.filter((x: unknown) => typeof x === "string").slice(0, 15).join(" ")
      : clip(out.hashtags, 200);
    const videoUrl = typeof out.video_url === "string" ? out.video_url : undefined;
    const mediaUrl = typeof out.media_url === "string" ? out.media_url : undefined;
    const preview = body || clip(JSON.stringify(out), 500);
    const resendSuffix = opts.resend ? `-resend-${Date.now()}` : "";

    const results = await Promise.all(recipients.map(async (to) => {
      const idempotencyKey = `sm-draft-${d.id}-${status}-${to}${resendSuffix}`;
      const payload = {
        templateName: "social-media-draft-status",
        recipientEmail: to,
        idempotencyKey,
        templateData: {
          status, rede: d.rede, action: d.action,
          scheduledAt: opts.scheduledAt ?? d.scheduled_at,
          notes: opts.notes ?? d.notes,
          preview, title, hashtags, videoUrl, mediaUrl,
        },
        metadata: {
          draft_id: d.id, rede: d.rede, action: d.action,
          status, resend: !!opts.resend,
        },
      };
      console.log("[social-media-draft-status] dispatch", {
        to, status, draft_id: d.id, rede: d.rede, idempotencyKey,
      });
      const { data, error } = await supabase.functions.invoke("send-transactional-email", { body: payload });
      if (error) {
        console.error("[social-media-draft-status] dispatch FAILED", { to, status, draft_id: d.id, error });
        return { to, ok: false, error: error.message };
      }
      console.log("[social-media-draft-status] dispatch OK", { to, status, draft_id: d.id, response: data });
      return { to, ok: true };
    }));
    const failed = results.filter(r => !r.ok).length;
    return { sent: recipients.length - failed, failed, results };
  };

  const resendStatusEmail = async (d: Draft) => {
    if (!["approved", "rejected", "scheduled"].includes(d.status)) {
      toast.warning("Só é possível reenviar para estados aprovado, rejeitado ou agendado.");
      return;
    }
    const t = toast.loading("A reenviar email…");
    const res = await sendStatusEmail(d, d.status, { resend: true });
    if (res.sent > 0) {
      toast.success(`Email reenviado (${res.sent} destinatário${res.sent === 1 ? "" : "s"})`, { id: t });
    } else if (res.skipped === "no-recipients") {
      toast.error("Sem destinatários configurados nem sessão activa.", { id: t });
    } else if (res.skipped === "disabled") {
      toast.warning(`Emails para "${d.status}" estão desactivados nas preferências.`, { id: t });
    } else {
      toast.error("Não foi possível reenviar.", { id: t });
    }
  };

  const patch = async (d: Draft, updates: Partial<Draft> & { status: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = { ...updates };
    if (updates.status === "scheduled") {
      const iso = (payload.scheduled_at ?? d.scheduled_at) as string | null | undefined;
      const when = iso ? new Date(iso) : null;
      if (!iso || !when || isNaN(when.getTime())) {
        toast.error("Não é possível agendar sem data/hora válida", {
          description: "Define uma data futura antes de agendar este rascunho.",
        });
        return;
      }
      if (when.getTime() <= Date.now()) {
        toast.error("Agendamento tem de ser no futuro", {
          description: `Agora: ${new Date().toLocaleString("pt-PT")}`,
        });
        return;
      }
      payload.scheduled_at = when.toISOString();
    }
    if (updates.status === "approved" || updates.status === "scheduled") {
      payload.approved_at = new Date().toISOString();
      payload.approved_by = user?.id ?? null;
    }
    if (payload.notes === undefined && notes) payload.notes = notes;
    const { error } = await supabase.from("social_media_drafts").update(payload).eq("id", d.id);
    if (error) {
      toast.error(translateDraftError(error, updates.status), {
        description: `${d.rede ?? "—"} · ${d.action}`,
      });
      return;
    }

    // Feedback imediato na UI: mensagem por estado + descrição contextual
    // (rede/acção/quando) + acção rápida para abrir a lista filtrada.
    const redeAction = `${d.rede ?? "—"} · ${d.action}`;
    const scheduledIso = payload.scheduled_at ?? d.scheduled_at;
    const openAction = {
      label: "Abrir",
      onClick: () => window.location.assign("/admin/agentic-ai/social-media-drafts"),
    };
    const allow = shouldNotify(updates.status, d.rede);
    if (updates.status === "approved") {
      if (allow) toast.success("Rascunho aprovado", { description: redeAction, action: openAction });
    } else if (updates.status === "rejected") {
      if (allow) (toast.warning?.("Rascunho rejeitado", { description: redeAction, action: openAction })
        ?? toast("Rascunho rejeitado", { description: redeAction, action: openAction }));
    } else if (updates.status === "scheduled") {
      if (allow) {
        const when = scheduledIso ? new Date(scheduledIso).toLocaleString("pt-PT") : "—";
        toast.success("Rascunho agendado", {
          description: `${redeAction} · ${when}`,
          action: openAction,
          duration: 6000,
        });
      }
    } else {
      toast.success(`Rascunho ${STATUS_LABEL[updates.status]?.toLowerCase() ?? updates.status}`, {
        description: redeAction,
      });
    }

    // Notificação por email (não bloqueia UX se falhar).
    await sendStatusEmail(d, updates.status, {
      scheduledAt: payload.scheduled_at ?? d.scheduled_at,
      notes: payload.notes ?? d.notes,
      selfEmail: user?.email ?? null,
    });

    setSelected(null); setScheduleFor(null); setScheduleAt(""); setNotes("");
    load();
  };

  // datetime-local usa hora local do browser; new Date(string) converte-a para o
  // fuso do utilizador, e .toISOString() serializa em UTC — o servidor recebe
  // sempre timestamptz correto independentemente do TZ do admin.
  const toUtcIso = (localValue: string) => new Date(localValue).toISOString();
  const nowLocalInput = () => {
    const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return d.toISOString().slice(0, 16);
  };

  const doSchedule = async () => {
    if (!scheduleFor || !scheduleAt) { toast.error("Data e hora obrigatórias"); return; }
    const when = new Date(scheduleAt);
    if (isNaN(when.getTime())) { toast.error("Data/hora inválida"); return; }
    if (when.getTime() <= Date.now()) {
      toast.error(`Agendamento tem de ser no futuro (agora: ${new Date().toLocaleString("pt-PT")})`);
      return;
    }
    await patch(scheduleFor, { status: "scheduled", scheduled_at: toUtcIso(scheduleAt) });
  };

  const runPublisherNow = async (d: Draft) => {
    const block = publishBlockReason(d);
    if (block) { toast.error(block); return; }
    const t = toast.loading(`A reexecutar publisher para ${d.rede ?? "draft"}…`);
    try {
      const { data, error } = await supabase.functions.invoke("social-media-publisher", {
        body: { draft_id: d.id },
      });
      if (error) throw error;
      const r = (data?.results?.[0]) as { status?: string; error?: string } | undefined;
      if (!r) {
        toast.warning("Publisher não devolveu resultado para este draft", { id: t });
      } else if (r.status === "published") {
        toast.success("Publicado com sucesso", { id: t });
      } else {
        toast.error(`Falhou: ${r.error ?? r.status}`, { id: t });
      }
      if (selected?.id === d.id) loadAudit(d.id);
      load();
    } catch (e: any) {
      toast.error(`Erro: ${e?.message ?? e}`, { id: t });
    }
  };

  /**
   * Pede ao agente para re-gerar apenas os campos assinalados por `validation.issues`
   * (limites de rede, hashtags, etc.), preservando o resto do output. Actualiza o
   * rascunho em `social_media_drafts` com o novo `output` + `validation`.
   */
  const regenerateWithFixes = async (d: Draft) => {
    const issues = Array.isArray(d.validation?.issues) ? d.validation.issues : [];
    if (issues.length === 0) {
      toast.info("Sem correções pendentes — validação já está limpa.");
      return;
    }
    const rede = d.rede ?? d.payload?.rede;
    if (!rede) { toast.error("Rascunho sem rede — não é possível re-gerar."); return; }
    setRegenBusy(d.id);
    const t = toast.loading(`A re-gerar (${issues.length} correção${issues.length === 1 ? "" : "ões"})…`);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data, error } = await supabase.functions.invoke("social-media-agent", {
        body: {
          action: "regenerar_com_correcoes",
          brand: d.brand ?? {},
          author_id: authUser?.id ?? null,
          payload: {
            rede,
            tema: d.payload?.tema,
            cta: d.payload?.cta,
            tom: d.payload?.tom,
            previous_output: d.output,
            issues,
          },
        },
      });
      if (error) throw error;
      if (!data?.output) throw new Error("resposta sem output");
      const { error: upErr } = await supabase.from("social_media_drafts")
        .update({ output: data.output, validation: data.validation, model: data.model ?? d.model })
        .eq("id", d.id);
      if (upErr) throw upErr;
      const prevIssues = issues;
      const newIssues = Array.isArray(data.validation?.issues) ? data.validation.issues : [];
      const diff = computeRegenDiff(d.output, data.output, prevIssues, newIssues);
      setRegenDiffs(prev => ({ ...prev, [d.id]: diff }));
      const remaining = newIssues.length;
      toast.success(
        remaining === 0
          ? `Re-gerado sem issues — ${diff.changedFields.length} campo(s) alterado(s)`
          : `Re-gerado — ${diff.resolvedIssues.length} resolvida(s), ${remaining} restante(s)`,
        { id: t },
      );
      if (selected?.id === d.id) setSelected({ ...d, output: data.output, validation: data.validation });
      load();
    } catch (e: any) {
      toast.error(`Falha na re-geração: ${e?.message ?? e}`, { id: t });
    } finally {
      setRegenBusy(null);
    }
  };



  const retryPublish = async (d: Draft) => {
    const block = publishBlockReason(d);
    if (block) { toast.error(block); return; }
    const prev = d.notes ?? "";
    const attempts = parseInt(prev.match(/\[tentativa (\d+)\]/)?.[1] ?? "0") || 0;
    // +1 minuto para garantir que o worker apanha e não fica no passado por race
    const nextRun = new Date(Date.now() + 60_000).toISOString();
    const retryNote = `[retentativa ${attempts + 1}] reencaminhado por admin — ${new Date().toISOString()}${prev ? ` | anterior: ${prev}` : ""}`;
    setNotes(retryNote);
    await patch(d, { status: "scheduled", scheduled_at: nextRun });
  };

  const selectedDrafts = useMemo(
    () => drafts.filter(d => selectedIds.has(d.id)),
    [drafts, selectedIds]
  );

  const bulkApply = async (
    status: "approved" | "rejected" | "scheduled",
    opts: { scheduledIso?: string } = {}
  ) => {
    if (selectedDrafts.length === 0) return;
    // Bloqueia TikTok sem video_url para approve/schedule (respeita trigger DB).
    const blocked = (status === "approved" || status === "scheduled")
      ? selectedDrafts.filter(tiktokMissingVideo) : [];
    const applicable = selectedDrafts.filter(d => !blocked.includes(d));
    if (applicable.length === 0) {
      toast.error("Nenhum rascunho aplicável", {
        description: "TikTok requer video_url antes de aprovar/agendar.",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const nowIso = new Date().toISOString();
    const payload: any = { status };
    if (status === "approved" || status === "scheduled") {
      payload.approved_at = nowIso;
      payload.approved_by = user?.id ?? null;
    }
    if (status === "scheduled") {
      if (!opts.scheduledIso) { toast.error("Data/hora obrigatórias"); return; }
      payload.scheduled_at = opts.scheduledIso;
    }

    setBulkBusy(true);
    const t = toast.loading(`A ${status === "approved" ? "aprovar" : status === "rejected" ? "rejeitar" : "agendar"} ${applicable.length} rascunho${applicable.length === 1 ? "" : "s"}…`);
    const ids = applicable.map(d => d.id);
    const { error } = await supabase.from("social_media_drafts").update(payload).in("id", ids);
    if (error) {
      setBulkBusy(false);
      toast.error(translateDraftError(error, status), { id: t });
      return;
    }

    // Emails em paralelo (não bloqueia UX se falhar).
    const emailResults = await Promise.all(applicable.map(d =>
      sendStatusEmail(d, status, {
        scheduledAt: payload.scheduled_at ?? d.scheduled_at,
        notes: d.notes,
        selfEmail: user?.email ?? null,
      }).catch(() => ({ sent: 0 } as any))
    ));
    const emailsSent = emailResults.reduce((n, r: any) => n + (r?.sent ?? 0), 0);

    setBulkBusy(false);
    toast.success(
      `${applicable.length} rascunho${applicable.length === 1 ? "" : "s"} ${status === "approved" ? "aprovado" : status === "rejected" ? "rejeitado" : "agendado"}${applicable.length === 1 ? "" : "s"}`,
      {
        id: t,
        description: blocked.length
          ? `${blocked.length} ignorado(s) por TikTok sem video_url · ${emailsSent} email(s)`
          : `${emailsSent} email(s) enviado(s)`,
      }
    );
    clearSelection();
    setBulkScheduleOpen(false);
    setBulkScheduleAt("");
    load();
  };

  const doBulkSchedule = async () => {
    if (!bulkScheduleAt) { toast.error("Data e hora obrigatórias"); return; }
    const when = new Date(bulkScheduleAt);
    if (isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      toast.error("Agendamento tem de ser no futuro");
      return;
    }
    await bulkApply("scheduled", { scheduledIso: when.toISOString() });
  };



  const counts = {
    pending: drafts.filter(d => d.status === "pending").length,
    approved: drafts.filter(d => d.status === "approved").length,
    scheduled: drafts.filter(d => d.status === "scheduled").length,
    rejected: drafts.filter(d => d.status === "rejected").length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Rascunhos Social Media</h1>
          <p className="text-muted-foreground text-sm">Rever, aprovar, rejeitar e agendar posts gerados pelo agente social-media.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setNewAccountOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova conta
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" onClick={() => setLinkAllOpen(true)}>
                  <LinkIcon className="h-4 w-4 mr-2" /> Ligar redes sociais
                </Button>
              </TooltipTrigger>
              <TooltipContent>Leva-te para a página Social Media Accounts</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {(() => {
        const missing = redes.filter(r => r && !linkedRedes.has(r.trim().toLowerCase()));
        if (missing.length === 0) return null;
        return (
          <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-2">
              <div>
                <div className="font-medium">Redes sem contas ligadas</div>
                <div className="text-xs mt-1">
                  Existem rascunhos para as redes abaixo mas nenhuma conta activa está registada. A publicação vai falhar até ligares uma conta.
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {missing.map(r => (
                  <Button
                    key={r}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={() => window.location.assign(
                      `/admin/agentic-ai/social-media-accounts?rede=${encodeURIComponent(r)}`
                    )}
                    title={`Ligar conta para ${r}`}
                  >
                    <LinkIcon className="h-3 w-3 mr-1" /> Ligar {r}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}


      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Pendentes</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-yellow-700">{counts.pending}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Aprovados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-green-700">{counts.approved}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Agendados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-blue-700">{counts.scheduled}</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Rejeitados</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold text-red-700">{counts.rejected}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <CardTitle className="text-base">Rascunhos</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os estados</SelectItem>
                  {Object.entries(STATUS_LABEL).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={redeFilter} onValueChange={setRedeFilter}>
                <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as redes</SelectItem>
                  {redes.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {selectedIds.size > 0 && (() => {
            const allPending = selectedDrafts.every(d => d.status === "pending");
            const blocked = selectedDrafts.map(d => publishBlockReason(d)).filter(Boolean) as string[];
            const anyBlocked = blocked.length > 0;
            const blockTitle = anyBlocked
              ? `Publicação bloqueada: ${Array.from(new Set(blocked)).slice(0, 2).join(" | ")}`
              : undefined;
            return (
              <div className="mb-3 flex flex-wrap items-center gap-2 rounded border border-primary/40 bg-primary/5 p-2">
                <span className="text-sm font-medium">{selectedIds.size} selecionado{selectedIds.size === 1 ? "" : "s"}</span>
                <div className="flex-1" />
                <Button size="sm" disabled={bulkBusy || !allPending || anyBlocked} onClick={() => setBulkConfirm("approved")}
                  title={!allPending ? "Só é possível aprovar rascunhos pendentes" : blockTitle}>
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprovar
                </Button>
                <Button size="sm" variant="outline" disabled={bulkBusy || !allPending || anyBlocked} onClick={() => setBulkConfirm("scheduled")}
                  title={!allPending ? "Só é possível agendar rascunhos pendentes" : blockTitle}>
                  <Calendar className="h-3.5 w-3.5 mr-1" />Agendar
                </Button>
                <Button size="sm" variant="outline" disabled={bulkBusy || !allPending} onClick={() => setBulkConfirm("rejected")}>
                  <XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar
                </Button>
                <Button size="sm" variant="ghost" onClick={clearSelection}>Limpar</Button>
              </div>
            );
          })()}
          {loading ? <p className="text-sm text-muted-foreground">A carregar…</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-8">
                  <Checkbox
                    checked={filtered.length > 0 && filtered.every(d => selectedIds.has(d.id))}
                    onCheckedChange={(v) => {
                      if (v) setSelectedIds(new Set(filtered.map(d => d.id)));
                      else clearSelection();
                    }}
                    aria-label="Selecionar todos"
                  />
                </TableHead>
                <TableHead>Rede</TableHead><TableHead>Ação</TableHead>
                <TableHead>Estado</TableHead><TableHead>Agendado</TableHead>
                <TableHead>Criado</TableHead><TableHead></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(d => (
                  <TableRow key={d.id} data-state={selectedIds.has(d.id) ? "selected" : undefined}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(d.id)}
                        onCheckedChange={() => toggleOne(d.id)}
                        aria-label={`Selecionar ${d.rede ?? "rascunho"}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{d.rede ?? "—"}</TableCell>
                    <TableCell className="text-xs">{d.action}</TableCell>
                    <TableCell><Badge className={STATUS_COLOR[d.status] ?? ""} variant="secondary">{STATUS_LABEL[d.status] ?? d.status}</Badge></TableCell>
                    <TableCell className="text-xs">{d.scheduled_at ? new Date(d.scheduled_at).toLocaleString("pt-PT") : "—"}</TableCell>
                    <TableCell className="text-xs">{new Date(d.created_at).toLocaleString("pt-PT")}</TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => { setSelected(d); setNotes(d.notes ?? ""); setVideoUrlEdit(getVideoUrl(d)); loadAudit(d.id); }}><Eye className="h-3.5 w-3.5" /></Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title={d.rede ? `Ligar conta ${d.rede}` : "Ligar conta"}
                          onClick={() => setLinkFor(d)}
                        >
                          <LinkIcon className="h-3.5 w-3.5 mr-1" />Ligar
                        </Button>
                        {(() => {
                          const block = publishBlockReason(d);
                          const tk = tiktokMissingVideo(d);
                          const tkMsg = "TikTok requer video_url — abre o rascunho e adiciona o URL do vídeo.";
                          const publishTitle = block ?? (tk ? tkMsg : undefined);
                          const publishDisabled = !!block || tk;
                          return (
                            <>
                              {block && d.rede && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-orange-500 text-orange-700 hover:bg-orange-50"
                                  title={`${block} — abrir Social Media Accounts para reconectar`}
                                  onClick={() => {
                                    const url = `/admin/social-media-accounts?rede=${encodeURIComponent(d.rede!.trim().toLowerCase())}&focus=reconnect`;
                                    window.open(url, "_blank", "noopener,noreferrer");
                                    toast.info("Abri Social Media Accounts noutro separador. Ao voltar, o estado é atualizado automaticamente.");
                                  }}
                                >
                                  <Wrench className="h-3.5 w-3.5 mr-1" />Reconectar
                                </Button>
                              )}
                              {d.status === "pending" && (
                                <>
                                  <Button size="sm" onClick={() => openDecision(d, "approved")}
                                    disabled={publishDisabled} title={publishTitle}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprovar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => { setScheduleFor(d); setScheduleAt(""); }}
                                    disabled={publishDisabled} title={publishTitle}>
                                    <Calendar className="h-3.5 w-3.5 mr-1" />Agendar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openDecision(d, "needs_revision")} title="Devolve o rascunho ao agente com motivo antes de publicar">
                                    <MessageSquareWarning className="h-3.5 w-3.5 mr-1" />Pedir correções
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openDecision(d, "rejected")}><XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar</Button>
                                </>
                              )}
                              {d.status === "needs_revision" && (
                                <>
                                  <Button size="sm" onClick={() => openDecision(d, "approved")}
                                    disabled={publishDisabled} title={publishTitle}>
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1" />Aprovar
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => openDecision(d, "rejected")}>
                                    <XCircle className="h-3.5 w-3.5 mr-1" />Rejeitar
                                  </Button>
                                </>
                              )}
                              {d.status === "approved" && (
                                <Button size="sm" variant="outline" onClick={() => { setScheduleFor(d); setScheduleAt(""); }}
                                  disabled={publishDisabled} title={publishTitle}>
                                  <Calendar className="h-3.5 w-3.5 mr-1" />Agendar
                                </Button>
                              )}
                              {(d.status === "rejected" || d.status === "error") && (
                                <Button size="sm" variant="outline" onClick={() => retryPublish(d)}
                                  disabled={!!block} title={block ?? undefined}>
                                  <RotateCcw className="h-3.5 w-3.5 mr-1" />Retentar
                                </Button>
                              )}
                              {(d.status === "scheduled" || d.status === "rejected" || d.status === "error") && (
                                <Button size="sm" variant="secondary" onClick={() => runPublisherNow(d)}
                                  disabled={!!block} title={block ?? "Reexecutar publisher agora"}>
                                  <Play className="h-3.5 w-3.5 mr-1" />Executar
                                </Button>
                              )}
                            </>
                          );
                        })()}
                        {d.status === "scheduled" && (
                          <Button size="sm" variant="outline" onClick={() => {
                            setScheduleFor(d);
                            // pré-preenche com o valor actual convertido para hora local do input
                            const cur = d.scheduled_at ? new Date(d.scheduled_at) : new Date();
                            const local = new Date(cur.getTime() - cur.getTimezoneOffset() * 60000);
                            setScheduleAt(local.toISOString().slice(0, 16));
                            setNotes(d.notes ?? "");
                          }}><Calendar className="h-3.5 w-3.5 mr-1" />Reagendar</Button>
                        )}
                        {["approved", "rejected", "scheduled"].includes(d.status) && (
                          <Button size="sm" variant="ghost" onClick={() => resendStatusEmail(d)} title="Reenviar email de notificação">
                            <Mail className="h-3.5 w-3.5 mr-1" />Reenviar email
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">Sem rascunhos.</TableCell></TableRow>}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Preview dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Rascunho — {selected?.rede} / {selected?.action}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">Output</p>
                <pre className="bg-muted p-3 rounded text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(selected.output, null, 2)}</pre>
              </div>
              {isTikTok(selected) && (
                <div className="rounded border p-3 space-y-2 bg-muted/30">
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    URL do vídeo (TikTok)
                  </p>
                  <p className="text-xs text-muted-foreground">
                    O TikTok requer um URL público (.mp4) acessível pela API. Sem este campo o worker não consegue publicar e o rascunho não pode ser aprovado nem agendado.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder="https://cdn.exemplo.com/video.mp4"
                      value={videoUrlEdit}
                      onChange={(e) => setVideoUrlEdit(e.target.value)}
                    />
                    <Button size="sm" onClick={saveVideoUrl} disabled={savingVideoUrl || videoUrlEdit === getVideoUrl(selected)}>
                      Guardar
                    </Button>
                  </div>
                  {tiktokMissingVideo(selected) && (
                    <p className="text-xs text-red-700">⚠ video_url em falta — aprovar/agendar será bloqueado pelo servidor.</p>
                  )}
                </div>
              )}
              {(() => {
                const issues = Array.isArray(selected.validation?.issues) ? selected.validation.issues : [];
                const canRegen = issues.length > 0 && !!(selected.rede ?? selected.payload?.rede)
                  && ["pending", "needs_revision"].includes(selected.status);
                return (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">Validação {issues.length > 0 && <span className="text-xs text-muted-foreground font-normal">— {issues.length} issue(s)</span>}</p>
                      {canRegen && (
                        <Button size="sm" variant="outline" disabled={regenBusy === selected.id} onClick={() => regenerateWithFixes(selected)}
                          title="Pede ao agente para corrigir apenas os campos assinalados, preservando o resto">
                          <Sparkles className="h-3.5 w-3.5 mr-1" />
                          {regenBusy === selected.id ? "A re-gerar…" : "Re-gerar correções"}
                        </Button>
                      )}
                    </div>
                    {appliedLimits && (() => {
                      const { base, effective, override, rede } = appliedLimits;
                      const fields: { key: "max_chars" | "hashtags_min" | "hashtags_max"; label: string }[] = [
                        { key: "max_chars", label: "máx. caracteres" },
                        { key: "hashtags_min", label: "hashtags mín." },
                        { key: "hashtags_max", label: "hashtags máx." },
                      ];
                      const hasOverride = !!override && fields.some(f => override[f.key] != null);
                      return (
                        <div className="mb-2 rounded-md border bg-muted/40 p-2 text-[11px] space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium">Limites aplicados</span>
                            <Badge variant="outline" className="capitalize">{rede.replace("_", " ")}</Badge>
                            {hasOverride ? (
                              <Badge className="bg-blue-100 text-blue-900" variant="secondary">
                                personalizado por autor
                              </Badge>
                            ) : (
                              <Badge variant="secondary">padrão da rede</Badge>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {fields.map(f => {
                              const isOverride = override?.[f.key] != null;
                              return (
                                <Badge
                                  key={f.key}
                                  variant="outline"
                                  className={isOverride ? "border-blue-300 bg-blue-50 text-blue-900" : ""}
                                  title={isOverride ? `Override do autor · padrão ${base[f.key]}` : `Padrão da rede`}
                                >
                                  {f.label}: {effective[f.key]}
                                  {isOverride && <span className="ml-1 text-muted-foreground line-through">{base[f.key]}</span>}
                                </Badge>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                    {(() => {
                      const v = selected.validation ?? {};
                      const list: Array<{ severity?: string; field?: string; message?: string; rede?: string }> = issues;
                      const errors = list.filter(i => i?.severity === "error");
                      const warnings = list.filter(i => i?.severity === "warning");
                      const others = list.filter(i => i?.severity !== "error" && i?.severity !== "warning");
                      const ok = v.ok !== false && errors.length === 0;
                      const canApprove = ok && ["pending", "needs_revision"].includes(selected.status);
                      const Row = ({ items, color, label }: { items: typeof list; color: string; label: string }) =>
                        items.length === 0 ? null : (
                          <div>
                            <p className={`text-xs font-medium mb-1 ${color}`}>{label} ({items.length})</p>
                            <ul className="text-[11px] space-y-1">
                              {items.map((i, idx) => (
                                <li key={idx} className="flex gap-2">
                                  {i.field && <Badge variant="outline" className="font-mono text-[10px] h-4 px-1">{i.field}</Badge>}
                                  <span>{i.message ?? JSON.stringify(i)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      return (
                        <div className="mb-2 rounded-md border p-3 space-y-2 bg-background">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-medium text-sm">Revisão antes de aprovar</span>
                            {ok ? (
                              <Badge className="bg-green-100 text-green-900" variant="secondary">Sem bloqueios</Badge>
                            ) : (
                              <Badge className="bg-red-100 text-red-900" variant="secondary">Bloqueado</Badge>
                            )}
                            <Badge className="bg-red-50 text-red-900 border-red-200" variant="outline">{errors.length} erro(s)</Badge>
                            <Badge className="bg-yellow-50 text-yellow-900 border-yellow-200" variant="outline">{warnings.length} aviso(s)</Badge>
                            {others.length > 0 && <Badge variant="outline">{others.length} outro(s)</Badge>}
                          </div>
                          {!canApprove && errors.length > 0 && (
                            <p className="text-[11px] text-red-800">
                              Corrige os erros antes de aprovar — os avisos são apenas informativos (corpo/hashtags já foram ajustados automaticamente quando possível).
                            </p>
                          )}
                          {list.length === 0 ? (
                            <p className="text-[11px] text-muted-foreground">Sem issues — validação limpa.</p>
                          ) : (
                            <div className="space-y-2">
                              <Row items={errors} color="text-red-800" label="Erros" />
                              <Row items={warnings} color="text-yellow-800" label="Avisos" />
                              <Row items={others} color="text-muted-foreground" label="Outros" />
                            </div>
                          )}
                          <details>
                            <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground">Ver JSON bruto</summary>
                            <pre className="bg-muted p-3 mt-1 rounded text-xs overflow-x-auto whitespace-pre-wrap">{JSON.stringify(v, null, 2)}</pre>
                          </details>
                        </div>
                      );
                    })()}


                    {regenDiffs[selected.id] && (() => {
                      const diff = regenDiffs[selected.id];
                      const fmt = (v: unknown) => {
                        if (v == null) return <span className="italic text-muted-foreground">—</span>;
                        const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
                        return <pre className="whitespace-pre-wrap break-words text-[11px]">{s}</pre>;
                      };
                      const issueLabel = (i: any) =>
                        typeof i === "string" ? i : (i?.message ?? i?.field ?? i?.code ?? JSON.stringify(i));
                      return (
                        <div className="mt-3 border rounded-md p-3 space-y-3 bg-background">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5" /> Resumo da re-geração
                            </p>
                            <button
                              className="text-[11px] text-muted-foreground hover:underline"
                              onClick={() => setRegenDiffs(prev => { const n = { ...prev }; delete n[selected.id]; return n; })}
                            >
                              descartar
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1.5 text-[11px]">
                            <Badge className="bg-green-100 text-green-900" variant="secondary">
                              {diff.resolvedIssues.length} resolvida(s)
                            </Badge>
                            <Badge className="bg-yellow-100 text-yellow-900" variant="secondary">
                              {diff.remainingIssues.length} restante(s)
                            </Badge>
                            {diff.newIssues.length > 0 && (
                              <Badge className="bg-red-100 text-red-900" variant="secondary">
                                {diff.newIssues.length} nova(s)
                              </Badge>
                            )}
                            <Badge variant="outline">{diff.changedFields.length} campo(s) alterado(s)</Badge>
                          </div>

                          {diff.resolvedIssues.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-green-800 mb-1">Issues resolvidas</p>
                              <ul className="text-[11px] list-disc pl-4 space-y-0.5 text-green-900">
                                {diff.resolvedIssues.map((i, idx) => <li key={idx}>{issueLabel(i)}</li>)}
                              </ul>
                            </div>
                          )}
                          {diff.remainingIssues.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-yellow-800 mb-1">Ainda por resolver</p>
                              <ul className="text-[11px] list-disc pl-4 space-y-0.5 text-yellow-900">
                                {diff.remainingIssues.map((i, idx) => <li key={idx}>{issueLabel(i)}</li>)}
                              </ul>
                            </div>
                          )}
                          {diff.newIssues.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-red-800 mb-1">Novas issues introduzidas</p>
                              <ul className="text-[11px] list-disc pl-4 space-y-0.5 text-red-900">
                                {diff.newIssues.map((i, idx) => <li key={idx}>{issueLabel(i)}</li>)}
                              </ul>
                            </div>
                          )}

                          {diff.changedFields.length > 0 ? (
                            <div>
                              <p className="text-xs font-medium mb-1">Campos corrigidos</p>
                              <div className="space-y-2">
                                {diff.changedFields.map((f) => (
                                  <details key={f.key} className="border rounded">
                                    <summary className="text-[11px] font-mono px-2 py-1 cursor-pointer bg-muted/50">
                                      {f.key}
                                    </summary>
                                    <div className="grid grid-cols-2 gap-2 p-2">
                                      <div>
                                        <p className="text-[10px] uppercase text-muted-foreground mb-1">Antes</p>
                                        <div className="bg-red-50 border border-red-100 rounded p-1.5 max-h-40 overflow-auto">{fmt(f.before)}</div>
                                      </div>
                                      <div>
                                        <p className="text-[10px] uppercase text-muted-foreground mb-1">Depois</p>
                                        <div className="bg-green-50 border border-green-100 rounded p-1.5 max-h-40 overflow-auto">{fmt(f.after)}</div>
                                      </div>
                                    </div>
                                  </details>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-[11px] text-muted-foreground italic">Nenhum campo alterado.</p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
              <div>
                <p className="font-medium mb-1">Notas</p>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Adicionar notas…" />
              </div>
              <PublisherExecutions draft={selected} audit={audit} />
              <div>
                <p className="font-medium mb-2 flex items-center gap-1.5"><History className="h-4 w-4" /> Audit trail</p>
                {auditLoading ? (
                  <p className="text-xs text-muted-foreground">A carregar histórico…</p>
                ) : audit.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Sem histórico registado.</p>
                ) : (
                  <ol className="space-y-2 border-l-2 border-muted pl-4">
                    {audit.map(a => (
                      <li key={a.id} className="text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="secondary" className={STATUS_COLOR[a.to_status ?? ""] ?? ""}>
                            {a.from_status ? `${STATUS_LABEL[a.from_status] ?? a.from_status} → ` : ""}
                            {STATUS_LABEL[a.to_status ?? ""] ?? a.to_status ?? a.action}
                          </Badge>
                          <span className="text-muted-foreground">
                            {new Date(a.created_at).toLocaleString("pt-PT")}
                          </span>
                          <span className="font-medium">{a.actor_email ?? (a.actor_id ? a.actor_id.slice(0, 8) : "sistema")}</span>
                        </div>
                        {a.scheduled_at && (
                          <p className="text-muted-foreground mt-0.5">Agendado para {new Date(a.scheduled_at).toLocaleString("pt-PT")}</p>
                        )}
                        {a.notes && <p className="text-muted-foreground mt-0.5 italic">"{a.notes}"</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div className="flex gap-2 justify-end">
                {selected.status === "pending" && (
                  <>
                    <Button variant="outline" onClick={() => { setSelected(null); openDecision(selected, "rejected"); }}>Rejeitar</Button>
                    <Button onClick={() => { setSelected(null); openDecision(selected, "approved"); }}>Aprovar</Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule dialog */}
      <Dialog open={!!scheduleFor} onOpenChange={(o) => !o && setScheduleFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{scheduleFor?.status === "scheduled" ? "Reagendar publicação" : "Agendar publicação"}</DialogTitle></DialogHeader>
          {(() => {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const when = scheduleAt ? new Date(scheduleAt) : null;
            const valid = when && !isNaN(when.getTime());
            const inFuture = valid && when!.getTime() > Date.now();
            const diffMs = valid ? when!.getTime() - Date.now() : 0;
            const diffMin = Math.round(diffMs / 60000);
            const relative = !valid ? "" :
              diffMin < 0 ? `${Math.abs(diffMin)} min no passado` :
              diffMin < 60 ? `daqui a ${diffMin} min` :
              diffMin < 1440 ? `daqui a ${Math.round(diffMin / 60)}h` :
              `daqui a ${Math.round(diffMin / 1440)} dias`;
            const currentIso = scheduleFor?.scheduled_at ?? null;
            const changed = valid && currentIso && new Date(currentIso).getTime() !== when!.getTime();

            return (
              <div className="space-y-3">
                <Input
                  type="datetime-local"
                  value={scheduleAt}
                  min={nowLocalInput()}
                  onChange={(e) => setScheduleAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Fuso horário do browser: <span className="font-mono">{tz}</span></p>

                {currentIso && (
                  <div className="rounded border p-2 text-xs">
                    <p className="text-[10px] uppercase text-muted-foreground mb-0.5">Agendamento actual</p>
                    <p>{new Date(currentIso).toLocaleString("pt-PT")} <span className="text-muted-foreground">({tz})</span></p>
                    <p className="text-muted-foreground font-mono">UTC {new Date(currentIso).toISOString().replace("T", " ").slice(0, 19)}Z</p>
                  </div>
                )}

                {valid && (
                  <div className={`rounded border p-2 text-xs ${inFuture ? "bg-muted/40" : "border-red-300 bg-red-50"}`}>
                    <p className="text-[10px] uppercase text-muted-foreground mb-0.5">Novo agendamento {changed ? "(alterado)" : ""}</p>
                    <p className="font-medium">{when!.toLocaleString("pt-PT")} <span className="text-muted-foreground font-normal">({tz})</span></p>
                    <p className="text-muted-foreground font-mono">UTC {when!.toISOString().replace("T", " ").slice(0, 19)}Z</p>
                    <p className={`mt-1 ${inFuture ? "text-muted-foreground" : "text-red-800"}`}>
                      {inFuture ? `▸ ${relative}` : `⚠ Data no passado (${relative})`}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setScheduleFor(null)}>Cancelar</Button>
                  <Button
                    onClick={doSchedule}
                    disabled={!valid || !inFuture}
                  >{scheduleFor?.status === "scheduled" ? "Reagendar" : "Agendar"}</Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Bulk confirm dialog */}
      <AlertDialog open={!!bulkConfirm} onOpenChange={(o) => !o && setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkConfirm === "approved" && `Aprovar ${selectedIds.size} rascunho${selectedIds.size === 1 ? "" : "s"}?`}
              {bulkConfirm === "rejected" && `Rejeitar ${selectedIds.size} rascunho${selectedIds.size === 1 ? "" : "s"}?`}
              {bulkConfirm === "scheduled" && `Agendar ${selectedIds.size} rascunho${selectedIds.size === 1 ? "" : "s"}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirm === "approved" && "Todos os rascunhos selecionados serão marcados como aprovados e o email de notificação será enviado."}
              {bulkConfirm === "rejected" && "Todos os rascunhos selecionados serão marcados como rejeitados. Esta ação fica registada no audit trail."}
              {bulkConfirm === "scheduled" && "Segue-se a escolha da data/hora de agendamento partilhada."}
              {" "}TikTok sem video_url será ignorado.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkBusy}
              onClick={async () => {
                const action = bulkConfirm;
                setBulkConfirm(null);
                if (action === "scheduled") {
                  setBulkScheduleAt("");
                  setBulkScheduleOpen(true);
                } else if (action === "approved" || action === "rejected") {
                  await bulkApply(action);
                }
              }}
            >
              {bulkConfirm === "approved" && "Aprovar"}
              {bulkConfirm === "rejected" && "Rejeitar"}
              {bulkConfirm === "scheduled" && "Continuar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!linkFor} onOpenChange={(o) => !o && setLinkFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ligar rede social{linkFor?.rede ? ` — ${linkFor.rede}` : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Vais ser levado para a página de contas sociais{linkFor?.rede ? `, com o filtro pré-aplicado a "${linkFor.rede}"` : ""}. Podes rever ou criar a ligação da conta a partir daí.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const rede = linkFor?.rede;
                setLinkFor(null);
                window.location.assign(
                  `/admin/agentic-ai/social-media-accounts${rede ? `?rede=${encodeURIComponent(rede)}` : ""}`
                );
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={linkAllOpen} onOpenChange={setLinkAllOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ir para Social Media Accounts?</AlertDialogTitle>
            <AlertDialogDescription>
              Vais sair do ecrã de rascunhos e abrir a página de gestão de contas sociais, onde podes ligar ou rever as contas associadas aos agentes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setLinkAllOpen(false);
                window.location.assign("/admin/agentic-ai/social-media-accounts");
              }}
            >
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={newAccountOpen} onOpenChange={setNewAccountOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova conta social</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rede</Label>
              <Select value={newAccount.rede} onValueChange={v => setNewAccount(f => ({ ...f, rede: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {NEW_ACCOUNT_REDES.map(r => <SelectItem key={r} value={r}>{r.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Etiqueta *</Label>
              <Input value={newAccount.account_label} onChange={e => setNewAccount(f => ({ ...f, account_label: e.target.value }))} placeholder="ex.: Marca — pessoal" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Handle</Label>
              <Input value={newAccount.handle} onChange={e => setNewAccount(f => ({ ...f, handle: e.target.value }))} placeholder="@handle" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Connector ID</Label>
              <Input value={newAccount.connector_id} onChange={e => setNewAccount(f => ({ ...f, connector_id: e.target.value }))} placeholder="linkedin, tiktok…" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Connection ID (std_…)</Label>
              <Input value={newAccount.connection_id} onChange={e => setNewAccount(f => ({ ...f, connection_id: e.target.value }))} placeholder="std_01..." />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setNewAccountOpen(false)} disabled={newAccountSaving}>Cancelar</Button>
            <Button onClick={createAccountQuick} disabled={newAccountSaving}>
              {newAccountSaving ? "A guardar…" : "Criar conta"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk schedule dialog */}
      <Dialog open={bulkScheduleOpen} onOpenChange={(o) => !o && setBulkScheduleOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Agendar {selectedIds.size} rascunho{selectedIds.size === 1 ? "" : "s"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input
              type="datetime-local"
              value={bulkScheduleAt}
              min={nowLocalInput()}
              onChange={(e) => setBulkScheduleAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Todos os rascunhos selecionados serão agendados para a mesma data/hora.
              TikTok sem <code>video_url</code> será ignorado.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setBulkScheduleOpen(false)}>Cancelar</Button>
              <Button disabled={bulkBusy || !bulkScheduleAt} onClick={doBulkSchedule}>Agendar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decision dialog: feedback obrigatório para rejeição, opcional para aprovação */}
      <Dialog open={!!decisionFor} onOpenChange={(o) => !o && setDecisionFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {decisionStatus === "approved" ? "Aprovar rascunho"
                : decisionStatus === "needs_revision" ? "Pedir correções"
                : "Rejeitar rascunho"}
              {decisionFor && <span className="text-sm text-muted-foreground font-normal ml-2">— {decisionFor.rede ?? "—"} / {decisionFor.action}</span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1">
                {decisionStatus === "approved" ? "Feedback / observações (opcional)"
                  : decisionStatus === "needs_revision" ? "O que precisa de ser corrigido"
                  : "Motivo da rejeição"}
                {decisionStatus !== "approved" && <span className="text-red-600"> *</span>}
              </label>
              <Textarea
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                placeholder={decisionStatus === "approved"
                  ? "Ex.: aprovado com nota sobre tom, imagem, etc."
                  : decisionStatus === "needs_revision"
                    ? "Ex.: encurtar o corpo, trocar CTA, ajustar hashtags para tom consultivo…"
                    : "Ex.: tom fora de brand, CTA em falta, imagem inadequada…"}
                rows={4}
                autoFocus
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {decisionStatus === "needs_revision"
                  ? "O rascunho volta ao estado \"Correções pedidas\". A razão fica no audit trail e é enviada por email."
                  : "Fica registado no audit trail do rascunho."}
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDecisionFor(null)}>Cancelar</Button>
              <Button
                variant={decisionStatus === "rejected" ? "destructive" : "default"}
                disabled={decisionStatus !== "approved" && decisionNotes.trim().length === 0}
                onClick={async () => {
                  if (!decisionFor) return;
                  const d = decisionFor;
                  const trimmed = decisionNotes.trim();
                  setNotes(trimmed);
                  setDecisionFor(null);
                  await patch({ ...d, notes: trimmed }, { status: decisionStatus, notes: trimmed } as any);
                }}
              >
                {decisionStatus === "approved" ? "Confirmar aprovação"
                  : decisionStatus === "needs_revision" ? "Enviar pedido de correções"
                  : "Confirmar rejeição"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Painel de execuções do worker social-media-publisher: extrai tentativas e
// erros do campo `notes` (formato `[tentativa N] mensagem — ISO`) e cruza com
// entradas do audit trail feitas pelo worker (actor_id null = service role).
function PublisherExecutions({ draft, audit }: { draft: Draft; audit: AuditEntry[] }) {
  const parsed = useMemo(() => {
    const raw = draft.notes ?? "";
    // aceita várias entradas separadas por " | " (o retry preserva histórico)
    const parts = raw.split(/\s\|\s/).map(s => s.trim()).filter(Boolean);
    return parts.map((p, i) => {
      const attempt = parseInt(p.match(/\[tentativa (\d+)\]/)?.[1] ?? "") || null;
      const isError = /\[erro\]/i.test(p);
      const isPublished = /^Publicado/i.test(p);
      const iso = p.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[^\s]*)/)?.[1] ?? null;
      const message = p.replace(/\[tentativa \d+\]\s*/, "").replace(/\s*—\s*\d{4}-\d{2}-\d{2}T.*$/, "").replace(/^anterior:\s*/, "");
      return { key: `${i}-${iso ?? p.slice(0, 8)}`, attempt, isError, isPublished, iso, message, raw: p };
    });
  }, [draft.notes]);

  const workerEntries = audit.filter(a => !a.actor_id);
  const attempts = parsed.filter(p => p.attempt !== null).length;
  const lastError = parsed.find(p => p.isError || (p.attempt !== null && !p.isPublished));

  return (
    <div>
      <p className="font-medium mb-2 flex items-center gap-1.5"><Activity className="h-4 w-4" /> Execuções do Publisher</p>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded border p-2">
          <p className="text-[10px] uppercase text-muted-foreground">Tentativas</p>
          <p className="text-lg font-semibold">{attempts}</p>
        </div>
        <div className="rounded border p-2">
          <p className="text-[10px] uppercase text-muted-foreground">Publicado</p>
          <p className="text-xs">{draft.published_at ? new Date(draft.published_at).toLocaleString("pt-PT") : "—"}</p>
        </div>
        <div className="rounded border p-2">
          <p className="text-[10px] uppercase text-muted-foreground">Próxima corrida</p>
          <p className="text-xs">{draft.status === "scheduled" && draft.scheduled_at ? new Date(draft.scheduled_at).toLocaleString("pt-PT") : "—"}</p>
        </div>
      </div>

      {lastError && (
        <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 p-2 mb-3 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-red-700 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-red-900">Último erro</p>
            <p className="text-red-800">{lastError.message || lastError.raw}</p>
            {lastError.iso && <p className="text-red-700/70 mt-0.5">{new Date(lastError.iso).toLocaleString("pt-PT")}</p>}
          </div>
        </div>
      )}

      {parsed.length === 0 && workerEntries.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sem execuções registadas.</p>
      ) : (
        <ol className="space-y-1.5 border-l-2 border-muted pl-4">
          {parsed.map(p => (
            <li key={p.key} className="text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className={p.isPublished ? "bg-green-100 text-green-900" : p.isError || p.attempt ? "bg-red-100 text-red-900" : ""}>
                  {p.isPublished ? "Publicado" : p.attempt ? `Tentativa ${p.attempt}` : p.isError ? "Erro" : "Nota"}
                </Badge>
                {p.iso && <span className="text-muted-foreground">{new Date(p.iso).toLocaleString("pt-PT")}</span>}
              </div>
              <p className="text-muted-foreground mt-0.5">{p.message || p.raw}</p>
            </li>
          ))}
          {workerEntries.map(a => (
            <li key={`w-${a.id}`} className="text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">worker → {a.to_status ?? a.action}</Badge>
                <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString("pt-PT")}</span>
              </div>
              {a.notes && <p className="text-muted-foreground mt-0.5 italic">"{a.notes}"</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
