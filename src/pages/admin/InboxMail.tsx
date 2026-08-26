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
import { LeadLinkDialog } from "@/components/admin/mail/LeadLinkDialog";
import { getGmailBody } from "@/lib/gmailBody";
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
  payload?: { headers?: GmailHeader[]; parts?: any[] };
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
  const [leadLinkOpen, setLeadLinkOpen] = useState(false);

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

  const activeAccount = accounts?.[0] ?? null;

  // Load starred ids from backend per active account
  const starKey = (accId: string) => `mail_starred_${accId}`;
  useEffect(() => {
    if (!activeAccount) { setStarredSet(new Set()); return; }
    const accId = activeAccount.id;
    try {
      const raw = localStorage.getItem(starKey(accId));
      if (raw) setStarredSet(new Set(JSON.parse(raw) as string[]));
    } catch { /* ignore */ }
    
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
  }, [activeAccount?.id]);

  const toggleStar = async (id: string, starred: boolean) => {
    if (!activeAccount) return;
    const accId = activeAccount.id;
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
        await supabase.from("email_stars").upsert({ 
          user_id: uid, 
          account_id: accId, 
          message_id: id 
        }, { onConflict: "user_id,account_id,message_id" });
      } else {
        await supabase.from("email_stars").delete().eq("account_id", accId).eq("message_id", id);
      }
      if (selected && selected.id === id) {
        setSelected({ ...selected, starred });
      }
    } catch (e) {
      toast.error("Falha a atualizar estrela");
    }
  };

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
        const subjects = items.filter((m) => ids.includes(m.id)).map((m) => m.subject);
        const { data: user } = await supabase.auth.getUser();
        await supabase.from("email_deletion_audit").insert({
          actor_id: user.user?.id,
          actor_email: user.user?.email,
          account_id: activeAccount.id,
          provider: activeAccount.provider,
          thread_ids: ids,
          subjects,
          thread_count: ids.length,
        } as any);
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

  useEffect(() => { 
    setSelectedId(null); setSelected(null); setItems([]); loadThreads(); 
  }, [activeAccount?.id, query, folder, activeLabel]);

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
          starred: starredSet.has(msg.id ?? ""),
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
      const bodyHtml = getGmailBody(msg);
      
      setSelected({
        id: msg?.id ?? "", 
        threadId: thread.id ?? "", 
        from: fromName, 
        fromEmail,
        subject, 
        date, 
        bodyHtml, 
        starred: starredSet.has(msg?.id ?? ""),
        lead,
      });
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao abrir a mensagem.");
    }
  };

  const handleLinkLead = async (leadId: string) => {
    if (!activeAccount || !selectedId) return;
    try {
      const { error } = await supabase.from("email_lead_links").upsert({
        account_id: activeAccount.id,
        provider_thread_id: selectedId,
        lead_id: leadId,
      }, { onConflict: "account_id,provider_thread_id,lead_id" });
      if (error) throw error;
      toast.success("Lead associado com sucesso.");
      openThread(selectedId);
      loadThreads();
    } catch (e: any) {
      throw e;
    }
  };

  const openCompose = () => {
    if (!activeAccount) { toast.info("Liga uma conta de email primeiro."); return; }
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
    return <div className="flex-1 p-10 text-sm text-muted-foreground bg-white">A carregar…</div>;
  }

  if (accounts.length === 0 && folder !== "site_chat") {
    return (
      <div className="flex-1 flex flex-col h-full bg-white">
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
    <div className="flex-1 flex flex-col h-full min-h-0 bg-white admin-scope">
      {activeAccount && (
        <header className="px-6 py-2.5 border-b bg-background flex items-center justify-between gap-3 shrink-0">
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
                  setItems((prev) => prev.filter((m) => !ids.includes(m.id)));
                  if (selectedId && ids.includes(selectedId)) { setSelectedId(null); setSelected(null); }

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
                onToggleStar={toggleStar}
                onLinkLead={() => setLeadLinkOpen(true)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      
      <MailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initial={composerInitial}
        onSent={() => { setSelectedId(null); loadThreads(); }}
      />
      
      <LeadLinkDialog 
        open={leadLinkOpen}
        onOpenChange={setLeadLinkOpen}
        onLink={handleLinkLead}
        initialEmail={selected?.fromEmail}
      />
    </div>
  );
}
