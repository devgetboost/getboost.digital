import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { invokeIntegration } from "@/lib/integrationDiag";
import { ConnectAccountCard } from "@/components/admin/mail/ConnectAccountCard";
import { MailSidebar, type MailFolder } from "@/components/admin/mail/MailSidebar";
import { MailList, type MailPreview } from "@/components/admin/mail/MailList";
import { MailReader, type ReaderMessage } from "@/components/admin/mail/MailReader";
import { MailComposer, type ComposerInitial } from "@/components/admin/mail/MailComposer";
import { AccountActions } from "@/components/admin/mail/AccountActions";
import { SiteChatPanel } from "@/components/admin/mail/SiteChatPanel";
import type { EmailLabel } from "@/hooks/useEmailLabels";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";

type Account = {
  id: string;
  provider: "gmail" | "outlook" | "imap";
  email_address: string;
  display_name: string | null;
  status: "active" | "disconnected" | "error";
};

// ---- Edge-function response shapes & type guards ----
type ThreadSummary = {
  id: string;
  from?: string;
  fromEmail?: string;
  subject?: string;
  snippet?: string;
  date?: string;
  unread?: boolean;
};
type ListThreadsResponse = { threads?: ThreadSummary[] };

type ImapMessage = {
  id?: string;
  from?: string;
  fromEmail?: string;
  subject?: string;
  date?: string;
  bodyHtml?: string;
};
type GmailHeader = { name?: string; value?: string };
type GmailMessage = {
  id?: string;
  snippet?: string;
  payload?: { headers?: GmailHeader[] };
};
type GmailThread = { id?: string; messages?: GmailMessage[] };
type GetThreadResponse = {
  message?: ImapMessage;
  thread?: GmailThread;
  lead_id?: string | null;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;
const hasThreads = (v: unknown): v is Required<ListThreadsResponse> =>
  isRecord(v) && Array.isArray((v as ListThreadsResponse).threads);
const hasImapMessage = (v: unknown): v is { message: ImapMessage; lead_id?: string | null } =>
  isRecord(v) && isRecord((v as GetThreadResponse).message);
const hasGmailThread = (v: unknown): v is { thread: GmailThread; lead_id?: string | null } =>
  isRecord(v) && isRecord((v as GetThreadResponse).thread);
const getLeadId = (v: unknown): string | null =>
  isRecord(v) && typeof (v as GetThreadResponse).lead_id === "string"
    ? ((v as GetThreadResponse).lead_id as string)
    : null;

export default function InboxMail() {
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [searchParams] = useSearchParams();
  const [folder, setFolder] = useState<MailFolder>("inbox");
  const [activeLabel, setActiveLabel] = useState<EmailLabel | null>(null);
  const [selected, setSelected] = useState<ReaderMessage | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<ComposerInitial | null>(null);
  const [starredSet, setStarredSet] = useState<Set<string>>(new Set());

  const loadAccounts = async () => {
    const { data, error } = await supabase
      .from("email_accounts")
      .select("id,provider,email_address,display_name,status")
      .eq("status", "active")
      .order("created_at", { ascending: true });
    if (error) toast.error(error.message);
    setAccounts((data ?? []) as Account[]);
  };

  useEffect(() => { loadAccounts(); }, []);

  // Load starred ids from backend per active account (with localStorage fallback cache)
  const starKey = (accId: string) => `mail_starred_${accId}`;
  useEffect(() => {
    if (!activeAccount) { setStarredSet(new Set()); return; }
    const accId = activeAccount.id;
    // Prime from cache for snappy UI
    try {
      const raw = localStorage.getItem(starKey(accId));
      if (raw) setStarredSet(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    // Then fetch authoritative list from backend
    (async () => {
      const { data, error } = await supabase
        .from("email_stars")
        .select("message_id")
        .eq("account_id", accId);
      if (error) return;
      const ids = (data ?? []).map((r: { message_id: string }) => r.message_id);
      setStarredSet(new Set(ids));
      try { localStorage.setItem(starKey(accId), JSON.stringify(ids)); } catch { /* ignore */ }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts]);

  const toggleStar = async (id: string, starred: boolean) => {
    if (!activeAccount) return;
    const accId = activeAccount.id;
    // Optimistic update
    setStarredSet(prev => {
      const next = new Set(prev);
      if (starred) next.add(id); else next.delete(id);
      try { localStorage.setItem(starKey(accId), JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id;
      if (!uid) throw new Error("not authenticated");
      if (starred) {
        const { error } = await supabase
          .from("email_stars")
          .upsert({ user_id: uid, account_id: accId, message_id: id }, { onConflict: "user_id,account_id,message_id" });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("email_stars")
          .delete()
          .eq("account_id", accId)
          .eq("message_id", id);
        if (error) throw error;
      }
    } catch (e) {
      // Revert on failure
      setStarredSet(prev => {
        const next = new Set(prev);
        if (starred) next.delete(id); else next.add(id);
        try { localStorage.setItem(starKey(accId), JSON.stringify([...next])); } catch { /* ignore */ }
        return next;
      });
      toast.error(e instanceof Error ? e.message : "Falha a atualizar estrela");
    }
  };

  const activeAccount = accounts?.[0] ?? null;
  const [items, setItems] = useState<MailPreview[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const runAction = async (
    action: "trash" | "archive" | "mark_read" | "mark_unread",
    ids: string[],
    opts: { removeFromList?: boolean; patch?: (m: MailPreview) => MailPreview } = {},
  ) => {
    if (!activeAccount || !ids.length) return;
    const isImap = activeAccount.provider === "imap";
    const fn = isImap ? "email-imap-smtp-sync" : "email-gmail-proxy";
    try {
      const { data, error } = await invokeIntegration(fn, {
        body: { action, account_id: activeAccount.id, thread_ids: ids },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      if (action === "trash") {
        try {
          const { data: userData } = await supabase.auth.getUser();
          const subjects = items.filter((m) => ids.includes(m.id)).map((m) => m.subject);
          await supabase.from("email_deletion_audit" as any).insert({
            actor_id: userData?.user?.id ?? null,
            actor_email: userData?.user?.email ?? null,
            account_id: activeAccount.id,
            provider: activeAccount.provider,
            thread_ids: ids,
            subjects,
            thread_count: ids.length,
          });
        } catch (auditErr) {
          console.warn("deletion audit failed", auditErr);
        }
      }
      if (opts.removeFromList) {
        setItems((prev) => prev.filter((m) => !ids.includes(m.id)));
        if (selectedId && ids.includes(selectedId)) { setSelectedId(null); setSelected(null); }
      } else if (opts.patch) {
        setItems((prev) => prev.map((m) => (ids.includes(m.id) ? opts.patch!(m) : m)));
      }
      loadThreads();
    } catch (e: any) {
      toast.error(e?.message ?? `Falha ao executar ${action}.`);
    }
  };

  const decodeHeader = (headers: GmailHeader[], name: string): string =>
    headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? "";

  const folderQuery = (f: MailFolder): string => {
    switch (f) {
      case "inbox": return "in:inbox";
      case "sent": return "in:sent";
      case "drafts": return "in:drafts";
      case "trash": return "in:trash";
      case "starred": return "is:starred";
      case "snoozed": return "is:snoozed";
      default: return "in:inbox";
    }
  };

  const loadThreads = async () => {
    if (!activeAccount || !["gmail", "imap"].includes(activeAccount.provider)) { setItems([]); return; }
    setLoadingList(true);
    try {
      const isImap = activeAccount.provider === "imap";
      const base = isImap ? "" : folderQuery(folder);
      const q = isImap ? query : (query ? `${base} ${query}` : base);
      const { data, error } = await invokeIntegration<ListThreadsResponse>(isImap ? "email-imap-smtp-sync" : "email-gmail-proxy", {
        body: { action: "list", account_id: activeAccount.id, query: q, folder },
      });
      if (error) throw error;
      const threads: ThreadSummary[] = hasThreads(data) ? data.threads : [];
      // Fetch minimal metadata per thread via a follow-up get is heavy; use snippet + id
      // Look up lead links in one query for badges.
      const threadIds = threads.map((t) => t.id);
      const { data: links } = threadIds.length
        ? await supabase.from("email_lead_links")
            .select("provider_thread_id, lead_id, leads(name,email)")
            .eq("account_id", activeAccount.id)
            .in("provider_thread_id", threadIds)
        : { data: [] as any[] };
      const linkMap = new Map<string, any>((links ?? []).map((l: any) => [l.provider_thread_id, l]));
      const previews: MailPreview[] = threads.map((t) => {
        const link = linkMap.get(t.id);
        return {
          id: t.id,
          from: link?.leads?.name || link?.leads?.email || t.from || t.fromEmail || "—",
          subject: t.subject || t.snippet?.split(" ").slice(0, 6).join(" ") || "(sem assunto)",
          snippet: t.snippet ?? "",
          date: t.date ? new Date(t.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }) : "",
          unread: !!t.unread,
          badge: link?.lead_id ? { label: "Lead", tone: "info" as const } : undefined,
        };
      });
      setItems(previews);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao carregar mensagens.");
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { setSelectedId(null); setSelected(null); setItems([]); loadThreads(); /* eslint-disable-next-line */ }, [activeAccount?.id, query, folder]);

  // Periodic sync: refresh thread list (and open thread) every 30s while tab visible.
  useEffect(() => {
    if (!activeAccount || !["gmail", "imap"].includes(activeAccount.provider)) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      loadThreads();
      if (selectedId) openThread(selectedId);
    };
    const id = window.setInterval(tick, 30_000);
    const onVis = () => { if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAccount?.id, query, folder, selectedId]);

  // Deep-link: open thread from ?thread=<id>
  useEffect(() => {
    const tid = searchParams.get("thread");
    if (tid && activeAccount) openThread(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, activeAccount?.id]);


  const openThread = async (threadId: string) => {
    setSelectedId(threadId);
    if (!activeAccount) return;
    try {
      const isImap = activeAccount.provider === "imap";
      const { data, error } = await invokeIntegration<GetThreadResponse>(isImap ? "email-imap-smtp-sync" : "email-gmail-proxy", {
        body: { action: "get", account_id: activeAccount.id, thread_id: threadId, folder },
      });
      if (error) throw error;
      const leadId = getLeadId(data);
      const loadLead = async (): Promise<ReaderMessage["lead"]> => {
        if (!leadId) return null;
        const { data: l } = await supabase.from("leads").select("id,name,email").eq("id", leadId).maybeSingle();
        return (l as ReaderMessage["lead"]) ?? null;
      };
      if (isImap) {
        if (!hasImapMessage(data)) throw new Error("Resposta IMAP sem mensagem.");
        const msg = data.message;
        const lead = await loadLead();
        setSelected({
          id: msg.id ?? "",
          threadId: msg.id ?? "",
          from: msg.from ?? "—",
          fromEmail: msg.fromEmail ?? "",
          subject: msg.subject ?? "(sem assunto)",
          date: msg.date ?? "",
          bodyHtml: msg.bodyHtml ?? "",
          lead,
        });
        loadThreads();
        return;
      }
      if (!hasGmailThread(data)) throw new Error("Resposta Gmail sem thread.");
      const thread = data.thread;
      const messages = thread.messages ?? [];
      const msg = messages[messages.length - 1];
      const headers: GmailHeader[] = msg?.payload?.headers ?? [];
      const fromRaw = decodeHeader(headers, "From");
      const fromEmail = fromRaw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] ?? "";
      const fromName = fromRaw.replace(/<.*>/, "").replace(/"/g, "").trim() || fromEmail;
      const subject = decodeHeader(headers, "Subject") || "(sem assunto)";
      const date = decodeHeader(headers, "Date");
      const lead = await loadLead();
      const bodyHtml = msg?.snippet ?? "";
      setSelected({
        id: msg?.id ?? "", threadId: thread.id ?? "", from: fromName, fromEmail,
        subject, date, bodyHtml, lead,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao abrir a mensagem.");
    }
  };


  const openCompose = () => {
    if (!activeAccount) {
      toast.info("Liga uma conta de email primeiro.");
      return;
    }
    setComposerInitial({ accountId: activeAccount.id, provider: activeAccount.provider });
    setComposerOpen(true);
  };

  const openReply = (mode: "reply" | "replyAll" | "forward", draft?: string) => {
    if (!activeAccount || !selected) return;
    const prefix = mode === "forward" ? "Fwd: " : "Re: ";
    const subject = selected.subject.startsWith(prefix) ? selected.subject : `${prefix}${selected.subject}`;
    const quoted = `\n\n---------- Mensagem original ----------\nDe: ${selected.from} <${selected.fromEmail}>\n${selected.bodyHtml.replace(/<[^>]+>/g, "")}`;
    const body = draft ? `${draft}${quoted}` : quoted;
    setComposerInitial({
      accountId: activeAccount.id,
      provider: activeAccount.provider,
      to: mode === "forward" ? "" : selected.fromEmail,
      subject,
      body,
      inReplyToMessageId: selected.id ?? null,
      threadId: selected.threadId ?? null,
    });
    setComposerOpen(true);
  };

  if (accounts === null) {
    return <div className="flex-1 p-10 text-sm text-muted-foreground">A carregar…</div>;
  }

  if (accounts.length === 0 && folder !== "site_chat") {
    return (
      <div className="flex-1 flex flex-col h-full">
        <header className="px-6 py-4 border-b bg-background flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Caixa de Email</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Liga a tua conta para começar a receber emails aqui.</p>
          </div>
          <button onClick={() => setFolder("site_chat")} className="text-xs underline text-primary">
            Ver Chat do site →
          </button>
        </header>
        <ConnectAccountCard onConnected={loadAccounts} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-muted/20">
      {activeAccount && (
        <header className="px-6 py-2.5 border-b bg-background flex items-center justify-between gap-3">
          <h1 className="text-sm font-semibold">Caixa de Email</h1>
          <AccountActions
            accountId={activeAccount.id}
            email={activeAccount.email_address}
            provider={activeAccount.provider}
            onChanged={loadAccounts}
          />
        </header>
      )}
      <div className="flex-1 flex min-h-0">
      <MailSidebar
        folder={folder}
        onFolderChange={setFolder}
        activeLabelId={activeLabel?.id ?? null}
        onLabelChange={setActiveLabel}
        onCompose={openCompose}
      />
      {folder === "site_chat" ? (
        <SiteChatPanel />
      ) : (
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0" autoSaveId="inbox-mail-split">
        <ResizablePanel defaultSize={38} minSize={20} maxSize={70} className="min-w-0">
          <MailList
            items={(folder === "starred"
              ? items.filter(m => starredSet.has(m.id))
              : items
            ).map(m => ({ ...m, starred: starredSet.has(m.id) }))}
            selectedId={selectedId}
            onSelect={openThread}
            onRefresh={loadThreads}
            loading={loadingList}
            query={query}
            onQueryChange={setQuery}
            onToggleStar={toggleStar}
            onDelete={async (ids) => {
              const snapshot = items.filter((m) => ids.includes(m.id));
              const wasSelected = selectedId && ids.includes(selectedId) ? { id: selectedId, msg: selected } : null;
              setItems((prev) => prev.filter((m) => !ids.includes(m.id)));
              if (wasSelected) { setSelectedId(null); setSelected(null); }

              let cancelled = false;
              const timer = window.setTimeout(async () => {
                if (cancelled) return;
                await runAction("trash", ids, { removeFromList: true });
              }, 6000);

              toast(`${ids.length > 1 ? `${ids.length} conversas movidas` : "Conversa movida"} para a Lixeira`, {
                duration: 6000,
                action: {
                  label: "Desfazer",
                  onClick: () => {
                    cancelled = true;
                    window.clearTimeout(timer);
                    setItems((prev) => {
                      const existing = new Set(prev.map((m) => m.id));
                      const restored = snapshot.filter((m) => !existing.has(m.id));
                      return [...restored, ...prev];
                    });
                    if (wasSelected?.msg) { setSelectedId(wasSelected.id); setSelected(wasSelected.msg); }
                    toast.success("Exclusão anulada");
                  },
                },
              });
            }}
            onArchive={async (ids) => {
              await runAction("archive", ids, { removeFromList: folder === "inbox" });
            }}
            onMarkRead={async (ids) => {
              await runAction("mark_read", ids, {
                patch: (m) => ({ ...m, unread: false }),
              });
            }}
          />
        </ResizablePanel>
        <ResizableHandle withHandle className="w-1.5 bg-border hover:bg-primary/40 transition-colors" />
        <ResizablePanel defaultSize={62} minSize={30} className="min-w-0">
          <MailReader
            message={selected}
            onBack={() => { setSelectedId(null); setSelected(null); }}
            onCompose={openCompose}
            onReply={openReply}
            onLinkLead={() => toast.info("Associação manual em breve.")}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      )}
      <MailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initial={composerInitial}
        onSent={() => { setSelectedId(null); loadThreads(); }}
      />
      </div>
    </div>
  );
}
