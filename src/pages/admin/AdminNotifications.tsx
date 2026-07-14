import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { EmailChipsInput } from "@/components/admin/EmailChipsInput";
import { EmailPreviewFrame } from "@/components/admin/EmailPreviewFrame";
import { EmailTrackingStats } from "@/components/admin/EmailTrackingStats";
import { EmailSendLogTable } from "@/components/admin/EmailSendLogTable";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Bell, Check, CheckCheck, RefreshCw, Calendar, ThumbsUp, ThumbsDown, FilePlus2, Settings2, X } from "lucide-react";
import {
  loadPrefs, savePrefs, normalizeRede,
  NOTIF_TYPES, NOTIF_NETWORKS, type AdminNotifPrefs,
} from "@/lib/adminNotificationPrefs";

type Entry = {
  id: string;
  draft_id: string;
  actor_email: string | null;
  action: string;
  from_status: string | null;
  to_status: string | null;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
  rede: string | null;
};

type Filter = "all" | "unread" | "approved" | "rejected" | "scheduled";

const ACTION_META: Record<string, { label: string; icon: any; className: string }> = {
  approved:    { label: "Aprovado",   icon: ThumbsUp,  className: "bg-green-100 text-green-900" },
  rejected:    { label: "Rejeitado",  icon: ThumbsDown,className: "bg-red-100 text-red-900" },
  scheduled:   { label: "Agendado",   icon: Calendar,  className: "bg-blue-100 text-blue-900" },
  rescheduled: { label: "Reagendado", icon: Calendar,  className: "bg-blue-100 text-blue-900" },
  created:     { label: "Criado",     icon: FilePlus2, className: "bg-slate-200 text-slate-800" },
};

// Só estas acções contam como "notificação" (o resto é ruído do audit trail).
const NOTIF_ACTIONS = ["approved", "rejected", "scheduled", "rescheduled"] as const;

export default function AdminNotifications() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [reads, setReads] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [prefs, setPrefs] = useState<AdminNotifPrefs>(() => loadPrefs());
  const [showPrefs, setShowPrefs] = useState(false);

  // Configuração de EMAIL (partilhada entre admins) — quem recebe e para que estados.
  const EMAIL_STATUSES: { key: string; label: string }[] = [
    { key: "approved", label: "Aprovado" },
    { key: "rejected", label: "Rejeitado" },
    { key: "scheduled", label: "Agendado" },
  ];
  const [emailRecipients, setEmailRecipients] = useState("");
  const [emailStatuses, setEmailStatuses] = useState<string[]>(["approved", "rejected", "scheduled"]);
  const [emailSaving, setEmailSaving] = useState(false);

  // Modo de teste — envia um email real com um draft existente para validar template + filtragem.
  const [testStatus, setTestStatus] = useState<"approved" | "rejected" | "scheduled">("approved");
  const [testSending, setTestSending] = useState(false);
  const [testOverride, setTestOverride] = useState(""); // destinatário único opcional (bypassa filtragem)
  const [testPreview, setTestPreview] = useState<null | {
    subject: string;
    recipients: string[];
    templateData: any;
    draftId: string;
    bypassedFilter: boolean;
  }>(null);
  const [testPreviewing, setTestPreviewing] = useState(false);
  const [testConfirm, setTestConfirm] = useState({ subject: false, body: false, filters: false });
  const [showEmailPreview, setShowEmailPreview] = useState(true);

  const STATUS_LABEL: Record<string, string> = { approved: "Aprovado", rejected: "Rejeitado", scheduled: "Agendado" };

  const buildTestPayload = async () => {
    setTestPreviewing(true);
    try {
      const override = testOverride.trim();
      let recipients: string[];
      let bypassed = false;
      if (override) {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(override)) {
          toast.error("Email de override inválido."); return;
        }
        recipients = [override]; bypassed = true;
      } else {
        const { data: cfg } = await supabase
          .from("social_media_notification_settings")
          .select("recipients,statuses").eq("id", 1).maybeSingle();
        const enabledStatuses = (cfg?.statuses as string[] | null) ?? ["approved", "rejected", "scheduled"];
        const configured = ((cfg?.recipients as string[] | null) ?? []).map(s => (s ?? "").trim()).filter(Boolean);
        const { data: { user } } = await supabase.auth.getUser();
        recipients = configured.length ? configured : (user?.email ? [user.email] : []);
        if (!enabledStatuses.includes(testStatus)) {
          toast.warning(`Filtragem: estado "${testStatus}" está desactivado — não seria enviado.`);
          return;
        }
        if (!recipients.length) { toast.error("Sem destinatários configurados nem sessão activa."); return; }
      }

      const { data: drafts, error: dErr } = await supabase
        .from("social_media_drafts")
        .select("id,rede,action,scheduled_at,notes,output")
        .order("created_at", { ascending: false }).limit(1);
      if (dErr) throw dErr;
      const d: any = drafts?.[0];
      if (!d) { toast.error("Nenhum rascunho encontrado para teste."); return; }

      const clip = (s: unknown, n = 500) => {
        const v = typeof s === "string" ? s : s == null ? "" : String(s);
        const x = v.trim(); return x.length > n ? x.slice(0, n) + "…" : x;
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
      const userTz = Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Lisbon";
      const templateData = {
        status: testStatus, rede: d.rede, action: d.action,
        scheduledAt: d.scheduled_at, timezone: userTz, notes: `[TESTE] ${d.notes ?? ""}`.trim(),
        preview, title, hashtags, videoUrl, mediaUrl, isTest: true,
      };
      const fmtScheduled = (iso: string, tz: string) => {
        const dt = new Date(iso);
        const s = new Intl.DateTimeFormat("pt-PT", { timeZone: tz, dateStyle: "short", timeStyle: "short" }).format(dt);
        const tzShort = new Intl.DateTimeFormat("pt-PT", { timeZone: tz, timeZoneName: "short" })
          .formatToParts(dt).find(p => p.type === "timeZoneName")?.value ?? tz;
        return `${s} (${tzShort})`;
      };
      // Assunto reproduz a lógica do template `social-media-draft-status`.
      const subject = `[Social Media] Rascunho ${STATUS_LABEL[testStatus] ?? testStatus}${d.rede ? ` · ${d.rede}` : ""}${d.scheduled_at ? ` · ${fmtScheduled(d.scheduled_at, userTz)}` : ""}`;
      setTestPreview({ subject, recipients, templateData, draftId: d.id, bypassedFilter: bypassed });
      setTestConfirm({ subject: false, body: false, filters: false });
      toast.success("Pré-visualização pronta");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao preparar pré-visualização");
    } finally {
      setTestPreviewing(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testPreview) return;
    setTestSending(true);
    const t = toast.loading("A enviar email de teste…");
    try {
      const { recipients, templateData, draftId } = testPreview;
      const stamp = Date.now();
      await Promise.all(recipients.map(async (to) => {
        const idempotencyKey = `sm-draft-test-${draftId}-${testStatus}-${to}-${stamp}`;
        console.log("[social-media-draft-status] test dispatch", { to, status: testStatus, draftId, idempotencyKey });
        const { data, error } = await supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "social-media-draft-status",
            recipientEmail: to,
            idempotencyKey,
            templateData,
            metadata: { draft_id: draftId, status: testStatus, test: true },
          },
        });
        if (error) console.error("[social-media-draft-status] test dispatch FAILED", { to, error });
        else console.log("[social-media-draft-status] test dispatch OK", { to, response: data });
      }));
      toast.success(`Email de teste enviado para ${recipients.length} destinatário${recipients.length === 1 ? "" : "s"}`, { id: t });
      setTestPreview(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no envio de teste", { id: t });
    } finally {
      setTestSending(false);
    }
  };


  // Destinatários agrupados por estado e rede social — guardados em `rules` (JSONB).
  const STATUS_KEYS = ["approved", "rejected", "scheduled"] as const;
  const NETWORK_KEYS = ["linkedin", "tiktok", "x", "facebook", "instagram", "youtube"] as const;
  type Rules = { byStatus: Record<string, string[]>; byNetwork: Record<string, string[]> };
  const emptyRules = (): Rules => ({
    byStatus: Object.fromEntries(STATUS_KEYS.map(k => [k, []])) as Record<string, string[]>,
    byNetwork: Object.fromEntries(NETWORK_KEYS.map(k => [k, []])) as Record<string, string[]>,
  });
  const [rules, setRules] = useState<Rules>(() => emptyRules());
  // Buffer de input (string) por grupo, para permitir escrita fluida antes de validar.
  const [rulesInput, setRulesInput] = useState<Record<string, string>>({});

  const parseEmails = (s: string) => s.split(/[,\s;]+/).map(x => x.trim()).filter(Boolean);
  const isEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("social_media_notification_settings")
        .select("recipients,statuses,rules").eq("id", 1).maybeSingle() as any;
      if (data) {
        setEmailRecipients(((data.recipients as string[] | null) ?? []).join(", "));
        setEmailStatuses((data.statuses as string[] | null) ?? ["approved", "rejected", "scheduled"]);
        const r = (data.rules ?? {}) as Partial<Rules>;
        const merged = emptyRules();
        STATUS_KEYS.forEach(k => { merged.byStatus[k] = r.byStatus?.[k] ?? []; });
        NETWORK_KEYS.forEach(k => { merged.byNetwork[k] = r.byNetwork?.[k] ?? []; });
        setRules(merged);
        const buf: Record<string, string> = {};
        STATUS_KEYS.forEach(k => { buf[`s:${k}`] = merged.byStatus[k].join(", "); });
        NETWORK_KEYS.forEach(k => { buf[`n:${k}`] = merged.byNetwork[k].join(", "); });
        setRulesInput(buf);
      }
    })();
  }, []);

  const saveEmailSettings = async () => {
    const list = parseEmails(emailRecipients);
    const invalid = list.filter(e => !isEmail(e));
    if (invalid.length) { toast.error(`Emails inválidos: ${invalid.join(", ")}`); return; }
    // Consolida buffers -> rules e valida cada grupo.
    const next = emptyRules();
    const badGroups: string[] = [];
    for (const k of STATUS_KEYS) {
      const arr = parseEmails(rulesInput[`s:${k}`] ?? "");
      const bad = arr.filter(e => !isEmail(e));
      if (bad.length) badGroups.push(`estado "${k}": ${bad.join(", ")}`);
      next.byStatus[k] = arr;
    }
    for (const k of NETWORK_KEYS) {
      const arr = parseEmails(rulesInput[`n:${k}`] ?? "");
      const bad = arr.filter(e => !isEmail(e));
      if (bad.length) badGroups.push(`rede "${k}": ${bad.join(", ")}`);
      next.byNetwork[k] = arr;
    }
    if (badGroups.length) { toast.error(`Emails inválidos em ${badGroups.join("; ")}`); return; }
    setEmailSaving(true);
    const { error } = await supabase.from("social_media_notification_settings")
      .upsert({ id: 1, recipients: list, statuses: emailStatuses, rules: next as any, updated_by: userId ?? undefined } as any);
    setEmailSaving(false);
    if (error) { toast.error(error.message); return; }
    setRules(next);
    toast.success("Configurações de email guardadas");
  };

  // ---- CSV import/export ---------------------------------------------------
  const [csvDedupe, setCsvDedupe] = useState(true);
  const [csvReplace, setCsvReplace] = useState(true);

  // Formato: grupo,chave,email  (grupo ∈ general|status|network; para general, chave = "-")
  const csvEscape = (v: string) => /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const exportCsv = () => {
    const rows: string[] = ["group,key,email"];
    parseEmails(emailRecipients).forEach(e => rows.push(`general,-,${csvEscape(e)}`));
    STATUS_KEYS.forEach(k => parseEmails(rulesInput[`s:${k}`] ?? "").forEach(e => rows.push(`status,${k},${csvEscape(e)}`)));
    NETWORK_KEYS.forEach(k => parseEmails(rulesInput[`n:${k}`] ?? "").forEach(e => rows.push(`network,${k},${csvEscape(e)}`)));
    const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `notif-recipients-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado");
  };

  const importCsv = async (file: File) => {
    const text = await file.text();
    const parseRow = (line: string): string[] => {
      const out: string[] = []; let cur = ""; let q = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (q) {
          if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
          else if (c === '"') q = false;
          else cur += c;
        } else {
          if (c === '"') q = true;
          else if (c === ",") { out.push(cur); cur = ""; }
          else cur += c;
        }
      }
      out.push(cur); return out;
    };
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!lines.length) { toast.error("CSV vazio"); return; }
    const start = /^group\s*,\s*key\s*,\s*email$/i.test(lines[0]) ? 1 : 0;
    const general: string[] = [];
    const byStatus: Record<string, string[]> = Object.fromEntries(STATUS_KEYS.map(k => [k, []]));
    const byNetwork: Record<string, string[]> = Object.fromEntries(NETWORK_KEYS.map(k => [k, []]));
    const bad: string[] = [];
    let unknown = 0;
    for (let i = start; i < lines.length; i++) {
      const cols = parseRow(lines[i]).map(s => s.trim());
      if (cols.length < 3) continue;
      const group = cols[0].toLowerCase();
      const key = cols[1].toLowerCase();
      const email = cols[2];
      if (!isEmail(email)) { bad.push(`linha ${i+1}: ${email}`); continue; }
      if (group === "general") general.push(email);
      else if (group === "status" && (STATUS_KEYS as readonly string[]).includes(key)) byStatus[key].push(email);
      else if (group === "network" && (NETWORK_KEYS as readonly string[]).includes(key)) byNetwork[key].push(email);
      else unknown++;
    }
    if (bad.length) { toast.error(`Emails inválidos — ${bad.slice(0,3).join("; ")}${bad.length>3?"…":""}`); return; }
    const uniq = (a: string[]) => csvDedupe ? Array.from(new Set(a)) : a;
    const merge = (existing: string[], incoming: string[]) =>
      csvReplace ? uniq(incoming) : uniq([...existing, ...incoming]);
    const removed: string[] = [];
    if (csvReplace) {
      const before = new Set(parseEmails(emailRecipients));
      const after = new Set(general);
      before.forEach(e => { if (!after.has(e)) removed.push(`general:${e}`); });
      STATUS_KEYS.forEach(k => {
        const b = new Set(parseEmails(rulesInput[`s:${k}`] ?? ""));
        const a = new Set(byStatus[k]);
        b.forEach(e => { if (!a.has(e)) removed.push(`status/${k}:${e}`); });
      });
      NETWORK_KEYS.forEach(k => {
        const b = new Set(parseEmails(rulesInput[`n:${k}`] ?? ""));
        const a = new Set(byNetwork[k]);
        b.forEach(e => { if (!a.has(e)) removed.push(`network/${k}:${e}`); });
      });
    }
    setEmailRecipients(merge(parseEmails(emailRecipients), general).join(", "));
    const buf: Record<string, string> = { ...rulesInput };
    STATUS_KEYS.forEach(k => {
      buf[`s:${k}`] = merge(parseEmails(rulesInput[`s:${k}`] ?? ""), byStatus[k]).join(", ");
    });
    NETWORK_KEYS.forEach(k => {
      buf[`n:${k}`] = merge(parseEmails(rulesInput[`n:${k}`] ?? ""), byNetwork[k]).join(", ");
    });
    setRulesInput(buf);
    const extras = [
      unknown ? `${unknown} linha(s) ignoradas` : null,
      removed.length ? `${removed.length} destinatário(s) removido(s)` : null,
    ].filter(Boolean).join(" · ");
    toast.success(`CSV importado${extras ? ` (${extras})` : ""}. Confirma e clica em "Guardar emails".`);
  };






  useEffect(() => {
    const onChange = () => setPrefs(loadPrefs());
    window.addEventListener("admin-notif-prefs-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("admin-notif-prefs-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const updatePrefs = (next: AdminNotifPrefs) => { setPrefs(next); savePrefs(next); };

  const load = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    // Janela: últimas 500 entradas relevantes (aprovar/rejeitar/agendar).
    const [auditRes, readsRes] = await Promise.all([
      supabase
        .from("social_media_drafts_audit")
        .select("id,draft_id,actor_email,action,from_status,to_status,scheduled_at,notes,created_at")
        .in("action", NOTIF_ACTIONS as unknown as string[])
        .order("created_at", { ascending: false })
        .limit(500),
      user
        ? supabase.from("admin_notification_reads").select("audit_id").eq("user_id", user.id)
        : Promise.resolve({ data: [] as { audit_id: string }[], error: null } as any),
    ]);

    if (auditRes.error) toast.error(auditRes.error.message);
    if (readsRes.error) toast.error(readsRes.error.message);

    // Enrich com `rede` via lookup nos drafts referenciados.
    const rows = (auditRes.data as Omit<Entry, "rede">[]) ?? [];
    const ids = Array.from(new Set(rows.map(r => r.draft_id).filter(Boolean)));
    const redeById = new Map<string, string | null>();
    if (ids.length) {
      const { data: drafts } = await supabase
        .from("social_media_drafts").select("id,rede").in("id", ids);
      (drafts ?? []).forEach((d: any) => redeById.set(d.id, d.rede ?? null));
    }
    setEntries(rows.map(r => ({ ...r, rede: redeById.get(r.draft_id) ?? null })));
    setReads(new Set(((readsRes.data as { audit_id: string }[]) ?? []).map(r => r.audit_id)));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, []);

  // Aplica preferências: descarta tipos e redes desativados antes de contar/filtrar.
  const visible = useMemo(() => entries.filter(e => {
    const a = e.action === "rescheduled" ? "scheduled" : e.action;
    if (a === "approved" || a === "rejected" || a === "scheduled") {
      if (!prefs.types[a as keyof typeof prefs.types]) return false;
    }
    const net = normalizeRede(e.rede);
    if (net && !prefs.networks[net]) return false;
    return true;
  }), [entries, prefs]);

  const filtered = useMemo(() => {
    return visible.filter(e => {
      if (filter === "all") return true;
      if (filter === "unread") return !reads.has(e.id);
      if (filter === "scheduled") return e.action === "scheduled" || e.action === "rescheduled";
      return e.action === filter;
    });
  }, [visible, reads, filter]);

  const counts = useMemo(() => ({
    all: visible.length,
    unread: visible.filter(e => !reads.has(e.id)).length,
    approved: visible.filter(e => e.action === "approved").length,
    rejected: visible.filter(e => e.action === "rejected").length,
    scheduled: visible.filter(e => e.action === "scheduled" || e.action === "rescheduled").length,
  }), [visible, reads]);

  const markRead = async (ids: string[]) => {
    if (!userId || ids.length === 0) return;
    const rows = ids.filter(id => !reads.has(id)).map(id => ({ user_id: userId, audit_id: id }));
    if (rows.length === 0) return;
    // Optimistic
    setReads(prev => { const n = new Set(prev); rows.forEach(r => n.add(r.audit_id)); return n; });
    const { error } = await supabase.from("admin_notification_reads").upsert(rows, { onConflict: "user_id,audit_id" });
    if (error) { toast.error(error.message); load(); }
  };

  const markUnread = async (id: string) => {
    if (!userId) return;
    setReads(prev => { const n = new Set(prev); n.delete(id); return n; });
    const { error } = await supabase.from("admin_notification_reads")
      .delete().eq("user_id", userId).eq("audit_id", id);
    if (error) { toast.error(error.message); load(); }
  };

  const markAllRead = () => markRead(visible.map(e => e.id));

  // Reenviar notificação a partir de uma entrada do histórico.
  // - Respeita `social_media_notification_settings` (destinatários + estados activos).
  // - Idempotência determinística por audit id: cliques repetidos não geram duplicados.
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendProgress, setResendProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  type ResendResult = { ok: number; fail: number; total: number; at: number; errors: string[] };
  const [resendResults, setResendResults] = useState<Record<string, ResendResult>>({});
  const resendCancelRef = useRef(false);
  const cancelResend = () => {
    if (!resendingId) return;
    if (!window.confirm("Cancelar o reenviar em curso? Pedidos já enviados podem chegar; novos serão ignorados.")) return;
    resendCancelRef.current = true;
    toast.warning("Reenviar cancelado");
    setResendingId(null);
    setResendProgress({ done: 0, total: 0 });
  };
  const resendFromHistory = async (entry: Entry) => {
    const status = entry.action === "rescheduled" ? "scheduled" : entry.action;
    if (!["approved", "rejected", "scheduled"].includes(status)) {
      toast.warning("Só é possível reenviar aprovações, rejeições ou agendamentos."); return;
    }
    if (!window.confirm(`Reenviar notificação (${STATUS_LABEL[status] ?? status}) para os destinatários actuais?`)) return;
    resendCancelRef.current = false;
    setResendingId(entry.id);
    const t = toast.loading("A reenviar…");
    try {
      const { data: cfg } = await supabase
        .from("social_media_notification_settings")
        .select("recipients,statuses,rules").eq("id", 1).maybeSingle() as any;
      const enabledStatuses = (cfg?.statuses as string[] | null) ?? ["approved", "rejected", "scheduled"];
      if (!enabledStatuses.includes(status)) {
        toast.warning(`Estado "${status}" está desactivado nas preferências.`, { id: t }); return;
      }
      const base = ((cfg?.recipients as string[] | null) ?? []).map((s: string) => (s ?? "").trim()).filter(Boolean);
      const rules = (cfg?.rules ?? {}) as { byStatus?: Record<string, string[]>; byNetwork?: Record<string, string[]> };
      const byStatus = (rules.byStatus?.[status] ?? []).map(s => s.trim()).filter(Boolean);
      const redeKey = (entry.rede ?? "").toLowerCase().trim();
      const byNetwork = (rules.byNetwork?.[redeKey] ?? []).map(s => s.trim()).filter(Boolean);
      const { data: { user } } = await supabase.auth.getUser();
      const merged = Array.from(new Set([...base, ...byStatus, ...byNetwork]));
      const recipients = merged.length ? merged : (user?.email ? [user.email] : []);
      if (!recipients.length) { toast.error("Sem destinatários configurados.", { id: t }); return; }

      const { data: d, error: dErr } = await supabase
        .from("social_media_drafts")
        .select("id,rede,action,scheduled_at,notes,output")
        .eq("id", entry.draft_id).maybeSingle();
      if (dErr) throw dErr;
      if (!d) { toast.error("Rascunho já não existe.", { id: t }); return; }

      const clip = (s: unknown, n = 500) => {
        const v = typeof s === "string" ? s : s == null ? "" : String(s);
        const x = v.trim(); return x.length > n ? x.slice(0, n) + "…" : x;
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

      setResendProgress({ done: 0, total: recipients.length });
      const results = await Promise.allSettled(recipients.map(to =>
        supabase.functions.invoke("send-transactional-email", {
          body: {
            templateName: "social-media-draft-status",
            recipientEmail: to,
            // Chave determinística por evento do histórico: repetir o clique não duplica.
            idempotencyKey: `sm-draft-history-${entry.id}-${to}`,
            templateData: {
              status, rede: d.rede, action: d.action,
              scheduledAt: d.scheduled_at ?? entry.scheduled_at,
              notes: entry.notes ?? d.notes,
              preview, title, hashtags, videoUrl, mediaUrl,
            },
            metadata: {
              draft_id: d.id, entry_id: entry.id, rede: d.rede, action: d.action,
              status, resend: true,
            },
          },
        })
          .then(({ error }) => { if (error) throw error; return to; })
          .finally(() => { if (!resendCancelRef.current) setResendProgress(p => ({ ...p, done: p.done + 1 })); })
      ));
      if (resendCancelRef.current) {
        toast.dismiss(t);
        return;
      }
      const ok = results.filter(r => r.status === "fulfilled").length;
      const failed = results
        .map((r, i) => ({ r, to: recipients[i] }))
        .filter(x => x.r.status === "rejected") as Array<{ r: PromiseRejectedResult; to: string }>;
      const fail = failed.length;
      const errors = failed.map(x => `${x.to}: ${x.r.reason?.message ?? String(x.r.reason)}`);
      setResendResults(prev => ({ ...prev, [entry.id]: { ok, fail, total: recipients.length, at: Date.now(), errors } }));
      const label = `${ok}/${recipients.length} destinatário${recipients.length === 1 ? "" : "s"}`;
      if (fail === 0) {
        toast.success(`Reenviado para ${label}`, { id: t });
      } else if (ok === 0) {
        toast.error(`Falha ao reenviar (${label}). ${errors[0] ?? ""}`.trim(), { id: t });
      } else {
        toast.warning(`Reenviado para ${label} — ${fail} falha${fail === 1 ? "" : "s"}. ${errors[0] ?? ""}`.trim(), { id: t });
      }
    } catch (e: any) {
      if (resendCancelRef.current) { toast.dismiss(t); return; }
      toast.error(e?.message ?? "Falha ao reenviar", { id: t });
      setResendResults(prev => ({ ...prev, [entry.id]: { ok: 0, fail: 0, total: 0, at: Date.now(), errors: [e?.message ?? "erro"] } }));
    } finally {
      setResendingId(null);
      setResendProgress({ done: 0, total: 0 });
      resendCancelRef.current = false;
    }
  };


  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" /> Centro de notificações
            {counts.unread > 0 && (
              <Badge className="bg-red-600 text-white ml-1">{counts.unread}</Badge>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">
            Histórico de aprovações, rejeições e agendamentos de rascunhos.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPrefs(v => !v)}>
            <Settings2 className="h-4 w-4 mr-1" />Preferências
          </Button>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />Refresh
          </Button>
          <Button size="sm" onClick={markAllRead} disabled={counts.unread === 0}>
            <CheckCheck className="h-4 w-4 mr-1" />Marcar todas como lidas
          </Button>
        </div>
      </div>

      <EmailTrackingStats />
      <EmailSendLogTable />

      {showPrefs && (
        <Card>

          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Preferências de notificação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-xs text-muted-foreground">
              Escolhe que tipos de eventos e que redes sociais disparam toasts e aparecem no histórico. Guardado localmente neste browser.
            </p>
            <div>
              <p className="text-sm font-medium mb-2">Por tipo</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {NOTIF_TYPES.map(t => (
                  <div key={t.key} className="flex items-center justify-between rounded-md border p-2">
                    <Label htmlFor={`type-${t.key}`} className="text-sm cursor-pointer">{t.label}</Label>
                    <Switch
                      id={`type-${t.key}`}
                      checked={prefs.types[t.key]}
                      onCheckedChange={(v) => updatePrefs({ ...prefs, types: { ...prefs.types, [t.key]: v } })}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Por rede social</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {NOTIF_NETWORKS.map(n => (
                  <div key={n.key} className="flex items-center justify-between rounded-md border p-2">
                    <Label htmlFor={`net-${n.key}`} className="text-sm cursor-pointer">{n.label}</Label>
                    <Switch
                      id={`net-${n.key}`}
                      checked={prefs.networks[n.key]}
                      onCheckedChange={(v) => updatePrefs({ ...prefs, networks: { ...prefs.networks, [n.key]: v } })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t space-y-3">
              <p className="text-sm font-medium">Emails de notificação (partilhado)</p>
              <p className="text-xs text-muted-foreground">
                Lista de destinatários (separados por vírgula) que recebem emails de rascunhos. Se ficar vazio, envia só para o admin que executou a ação.
              </p>
              <div className="space-y-2">
                <Label htmlFor="notif-recipients" className="text-xs">Destinatários</Label>
                <EmailChipsInput
                  id="notif-recipients"
                  value={emailRecipients}
                  onChange={setEmailRecipients}
                  placeholder="ex.: ana@empresa.pt"
                />
              </div>
              <div>
                <p className="text-xs mb-2">Estados que disparam email</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {EMAIL_STATUSES.map(s => (
                    <div key={s.key} className="flex items-center justify-between rounded-md border p-2">
                      <Label htmlFor={`estatus-${s.key}`} className="text-sm cursor-pointer">{s.label}</Label>
                      <Switch
                        id={`estatus-${s.key}`}
                        checked={emailStatuses.includes(s.key)}
                        onCheckedChange={(v) => setEmailStatuses(prev =>
                          v ? Array.from(new Set([...prev, s.key])) : prev.filter(x => x !== s.key)
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t space-y-3">
                <p className="text-sm font-medium">Destinatários adicionais por estado</p>
                <p className="text-xs text-muted-foreground">
                  Somam-se aos destinatários gerais quando o draft muda para o estado indicado.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {STATUS_KEYS.map(k => (
                    <div key={k} className="space-y-1">
                      <Label htmlFor={`rules-s-${k}`} className="text-xs capitalize">{k === "approved" ? "Aprovado" : k === "rejected" ? "Rejeitado" : "Agendado"}</Label>
                      <EmailChipsInput
                        id={`rules-s-${k}`}
                        placeholder="email@ex.pt"
                        value={rulesInput[`s:${k}`] ?? ""}
                        onChange={(v) => setRulesInput(prev => ({ ...prev, [`s:${k}`]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t space-y-3">
                <p className="text-sm font-medium">Destinatários adicionais por rede social</p>
                <p className="text-xs text-muted-foreground">
                  Somam-se aos destinatários gerais e por estado, consoante a rede do rascunho.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {NETWORK_KEYS.map(k => (
                    <div key={k} className="space-y-1">
                      <Label htmlFor={`rules-n-${k}`} className="text-xs capitalize">{k}</Label>
                      <EmailChipsInput
                        id={`rules-n-${k}`}
                        placeholder="email@ex.pt"
                        value={rulesInput[`n:${k}`] ?? ""}
                        onChange={(v) => setRulesInput(prev => ({ ...prev, [`n:${k}`]: v }))}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-4">
                <div className="flex items-center gap-2 mr-auto">
                  <div className="flex items-center gap-2">
                    <Switch id="csv-dedupe" checked={csvDedupe} onCheckedChange={setCsvDedupe} />
                    <Label htmlFor="csv-dedupe" className="text-xs cursor-pointer">Remover duplicados</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id="csv-replace" checked={csvReplace} onCheckedChange={setCsvReplace} />
                    <Label htmlFor="csv-replace" className="text-xs cursor-pointer">Substituir (limpa os que não constam)</Label>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2">

                <input
                  id="csv-import-input"
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) importCsv(f);
                    e.currentTarget.value = "";
                  }}
                />
                <Button size="sm" variant="outline" onClick={exportCsv}>
                  Exportar CSV
                </Button>
                <Button size="sm" variant="outline" onClick={() => document.getElementById("csv-import-input")?.click()}>
                  Importar CSV
                </Button>
                <Button size="sm" onClick={saveEmailSettings} disabled={emailSaving}>
                  {emailSaving ? "A guardar…" : "Guardar emails"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground text-right">
                Formato: <code>group,key,email</code> — group ∈ general|status|network; key = "-" para general, ou aprovado/rejeitado/agendado / linkedin/tiktok/…
              </p>

              <div className="pt-4 border-t space-y-2">
                <p className="text-sm font-medium">Modo de teste</p>
                <p className="text-xs text-muted-foreground">
                  Envia um email real usando o rascunho mais recente para confirmar o template e a filtragem por estado/destinatários.
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {(["approved", "rejected", "scheduled"] as const).map(s => (
                    <Button
                      key={s}
                      size="sm"
                      variant={testStatus === s ? "default" : "outline"}
                      className="h-7 text-xs"
                      onClick={() => { setTestStatus(s); setTestPreview(null); }}
                    >
                      {s === "approved" ? "Aprovado" : s === "rejected" ? "Rejeitado" : "Agendado"}
                    </Button>
                  ))}
                </div>
                <div className="space-y-1">
                  <Label htmlFor="test-override" className="text-xs">Destinatário único (opcional)</Label>
                  <Input
                    id="test-override"
                    placeholder="ex.: eu@empresa.pt — bypassa a filtragem e envia só para este endereço"
                    value={testOverride}
                    onChange={(e) => { setTestOverride(e.target.value); setTestPreview(null); }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Se preencheres, o teste ignora a filtragem por estado/rede e envia só para este email — útil para validar antes do envio em massa.
                  </p>
                </div>

                {testPreview && (() => {
                  const total = testPreview.recipients.length;
                  const SAMPLE_N = 5;
                  const sample = testPreview.recipients.slice(0, SAMPLE_N);
                  const remaining = Math.max(0, total - sample.length);
                  return (
                  <div className="rounded-md border bg-muted/30 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">Pré-visualização</p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">
                          {total} destinatário{total === 1 ? "" : "s"}
                        </Badge>
                        {testPreview.bypassedFilter && (
                          <Badge variant="secondary" className="text-[10px]">filtragem ignorada</Badge>
                        )}
                      </div>
                    </div>
                    <div><span className="text-muted-foreground">Assunto:</span> <span className="font-medium">{testPreview.subject}</span></div>
                    <div>
                      <span className="text-muted-foreground">Amostra ({sample.length} de {total}):</span>
                      <ul className="mt-1 list-disc list-inside space-y-0.5">
                        {sample.map((r) => <li key={r} className="font-mono">{r}</li>)}
                      </ul>
                      {remaining > 0 && (
                        <p className="text-muted-foreground mt-1">+{remaining} não mostrado{remaining === 1 ? "" : "s"} — o envio inclui todos.</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                      <div><span className="text-muted-foreground">Estado:</span> {STATUS_LABEL[testPreview.templateData.status] ?? testPreview.templateData.status}</div>
                      <div><span className="text-muted-foreground">Rede:</span> {testPreview.templateData.rede ?? "—"}</div>
                      {testPreview.templateData.scheduledAt && (
                        <div className="col-span-2"><span className="text-muted-foreground">Agendado para:</span> {new Intl.DateTimeFormat("pt-PT", { timeZone: testPreview.templateData.timezone || "Europe/Lisbon", dateStyle: "short", timeStyle: "short" }).format(new Date(testPreview.templateData.scheduledAt))} ({testPreview.templateData.timezone || "Europe/Lisbon"})</div>
                      )}
                    </div>
                    {testPreview.templateData.title && (
                      <div><span className="text-muted-foreground">Título:</span> <span className="font-medium">{testPreview.templateData.title}</span></div>
                    )}
                    {testPreview.templateData.preview && (
                      <div className="whitespace-pre-wrap rounded bg-background border p-2 max-h-40 overflow-auto">{testPreview.templateData.preview}</div>
                    )}
                    {testPreview.templateData.hashtags && (
                      <div className="text-muted-foreground">{testPreview.templateData.hashtags}</div>
                    )}
                    {(testPreview.templateData.videoUrl || testPreview.templateData.mediaUrl) && (
                      <div className="text-muted-foreground truncate">
                        Média: {testPreview.templateData.videoUrl ?? testPreview.templateData.mediaUrl}
                      </div>
                    )}
                    {testPreview.templateData.notes && (
                      <div className="text-muted-foreground">Notas: {testPreview.templateData.notes}</div>
                    )}
                  </div>
                  );
                })()}

                {testPreview && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Pré-visualização do email</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs"
                        onClick={() => setShowEmailPreview(v => !v)}
                      >
                        {showEmailPreview ? "Ocultar" : "Mostrar"}
                      </Button>
                    </div>
                    {showEmailPreview && (
                      <EmailPreviewFrame
                        status={testPreview.templateData.status}
                        subject={testPreview.subject}
                        rede={testPreview.templateData.rede}
                        action={testPreview.templateData.action}
                        scheduledAt={testPreview.templateData.scheduledAt}
                        timezone={testPreview.templateData.timezone}
                        notes={testPreview.templateData.notes}
                        preview={testPreview.templateData.preview}
                        title={testPreview.templateData.title}
                        hashtags={testPreview.templateData.hashtags}
                        videoUrl={testPreview.templateData.videoUrl}
                        mediaUrl={testPreview.templateData.mediaUrl}
                      />
                    )}
                  </div>
                )}




                {testPreview && (() => {
                  const allChecked = testConfirm.subject && testConfirm.body && testConfirm.filters;
                  const item = (key: "subject" | "body" | "filters", label: string) => (
                    <label className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={testConfirm[key]}
                        onCheckedChange={(v) => setTestConfirm((s) => ({ ...s, [key]: v === true }))}
                        disabled={testSending}
                        className="mt-0.5"
                      />
                      <span>{label}</span>
                    </label>
                  );
                  return (
                    <div className="rounded-md border p-3 space-y-2 text-xs">
                      <p className="font-medium text-sm">Checklist de confirmação</p>
                      {item("subject", "Validei o assunto do email.")}
                      {item("body", "Validei o corpo (título, texto, hashtags, média).")}
                      {item("filters", testPreview.bypassedFilter
                        ? "Confirmo o envio para o destinatário único (filtragem ignorada)."
                        : `Validei os filtros e destinatários (${testPreview.recipients.length}).`)}
                      {!allChecked && (
                        <p className="text-muted-foreground">Marca todos os itens para desbloquear o envio.</p>
                      )}
                    </div>
                  );
                })()}

                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={buildTestPayload} disabled={testPreviewing || testSending}>
                    {testPreviewing ? "A preparar…" : (testPreview ? "Actualizar pré-visualização" : "Pré-visualizar")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={sendTestEmail}
                    disabled={!testPreview || testSending || !(testConfirm.subject && testConfirm.body && testConfirm.filters)}
                  >
                    {testSending ? "A enviar…" : "Confirmar envio"}
                  </Button>
                </div>

              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros com contagens */}
      <div className="flex flex-wrap gap-2">
        {([
          ["all", "Todas"],
          ["unread", "Não lidas"],
          ["approved", "Aprovações"],
          ["rejected", "Rejeições"],
          ["scheduled", "Agendamentos"],
        ] as [Filter, string][]).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
            className="h-7 text-xs"
          >
            {label} <span className="ml-1 opacity-70">({counts[key]})</span>
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">A carregar…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem notificações neste filtro.</p>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead className="w-6"></TableHead>
                <TableHead className="w-32">Acção</TableHead>
                <TableHead>Por</TableHead>
                <TableHead>Detalhes</TableHead>
                <TableHead className="w-44">Quando</TableHead>
                <TableHead className="w-40 text-right">Rascunho</TableHead>
                <TableHead className="w-32"></TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map(e => {
                  const meta = ACTION_META[e.action] ?? ACTION_META.created;
                  const Icon = meta.icon;
                  const unread = !reads.has(e.id);
                  return (
                    <TableRow key={e.id} className={unread ? "bg-primary/5" : ""}>
                      <TableCell>
                        <span className={`inline-block h-2 w-2 rounded-full ${unread ? "bg-primary" : "bg-transparent"}`} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`${meta.className} inline-flex items-center gap-1`}>
                          <Icon className="h-3 w-3" />{meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{e.actor_email ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {e.from_status && e.to_status && `${e.from_status} → ${e.to_status}`}
                        {e.scheduled_at && (
                          <span className="ml-2">· agendado para {new Date(e.scheduled_at).toLocaleString("pt-PT")}</span>
                        )}
                        {e.notes && <div className="mt-0.5 truncate max-w-md">{e.notes}</div>}
                      </TableCell>
                      <TableCell className="text-xs">{new Date(e.created_at).toLocaleString("pt-PT")}</TableCell>
                      <TableCell className="text-right">
                        <Link to="/admin/agentic-ai/social-media-drafts" className="text-xs underline text-primary">
                          ver rascunho
                        </Link>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs"
                              disabled={!!resendingId || !["approved","rejected","scheduled","rescheduled"].includes(e.action)}
                              onClick={() => resendFromHistory(e)}
                              title="Reenviar email respeitando preferências (idempotente por evento)"
                            >
                              <RefreshCw className={`h-3 w-3 mr-1 ${resendingId === e.id ? "animate-spin" : ""}`} />
                              {resendingId === e.id ? "A reenviar…" : "Reenviar"}
                            </Button>
                            {resendingId === e.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs text-red-700 hover:text-red-800"
                                onClick={cancelResend}
                                title="Cancelar reenviar em curso"
                              >
                                <X className="h-3 w-3 mr-1" />Cancelar
                              </Button>
                            )}
                            {resendResults[e.id] && resendingId !== e.id && (() => {
                              const r = resendResults[e.id];
                              const variant = r.fail === 0 && r.ok > 0
                                ? "bg-green-100 text-green-800 border-green-200"
                                : r.ok === 0
                                  ? "bg-red-100 text-red-800 border-red-200"
                                  : "bg-amber-100 text-amber-900 border-amber-200";
                              const title = r.errors.length ? r.errors.join("\n") : `${r.ok}/${r.total} enviados`;
                              return (
                                <Badge variant="outline" className={`${variant} text-[10px]`} title={title}>
                                  {r.ok}/{r.total}{r.fail ? ` · ${r.fail} falha${r.fail === 1 ? "" : "s"}` : ""}
                                </Badge>
                              );
                            })()}
                            {unread ? (
                              <Button size="sm" variant="ghost" className="h-7 text-xs" disabled={!!resendingId} onClick={() => markRead([e.id])}>
                                <Check className="h-3 w-3 mr-1" />Marcar lida
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground" disabled={!!resendingId} onClick={() => markUnread(e.id)}>
                                Não lida
                              </Button>
                            )}
                          </div>
                          {resendingId === e.id && resendProgress.total > 0 && (
                            <div className="w-40 flex items-center gap-2">
                              <Progress
                                value={Math.round((resendProgress.done / resendProgress.total) * 100)}
                                className="h-1.5 flex-1"
                              />
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {resendProgress.done}/{resendProgress.total}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
