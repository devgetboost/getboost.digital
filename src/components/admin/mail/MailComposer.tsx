import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2, Send, User, Paperclip, X, Bold, Italic, Underline, Link2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, Smile, Image as ImageIcon, Undo2, Redo2, Type, Strikethrough,
  Quote, Trash2,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { invokeIntegration } from "@/lib/integrationDiag";
import { toast } from "sonner";

export type ComposerInitial = {
  to?: string;
  cc?: string;
  subject?: string;
  body?: string;
  inReplyToMessageId?: string | null;
  threadId?: string | null;
  accountId: string;
  provider?: "gmail" | "outlook" | "imap";
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ComposerInitial | null;
  onSent?: () => void;
};

type LeadMatch = { id: string; name: string | null; email: string };

const EMOJIS = ["😀","😃","😄","😁","😊","😉","🙂","😍","🤩","😎","🤝","👍","👏","🙏","🎉","🚀","💡","✅","⚠️","❤️","🔥","📎","📅","💬","✉️","📞"];

export function MailComposer({ open, onOpenChange, initial, onSent }: Props) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState(""); // HTML
  const [sending, setSending] = useState(false);
  const [linkedLead, setLinkedLead] = useState<LeadMatch | null>(null);
  const [attachments, setAttachments] = useState<{ name: string; type: string; size: number; base64: string }[]>([]);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    const r = savedRangeRef.current;
    if (r) {
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(r);
    } else {
      editorRef.current?.focus();
    }
  };
  const exec = (cmd: string, val?: string) => {
    restoreSelection();
    document.execCommand(cmd, false, val);
    setBody(editorRef.current?.innerHTML ?? "");
    editorRef.current?.focus();
  };

  const MAX_TOTAL_BYTES = 20 * 1024 * 1024;
  const fileToBase64 = (f: File) => new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      resolve(s.includes(",") ? s.split(",")[1] : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(f);
  });

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = [...attachments];
    let total = next.reduce((n, a) => n + a.size, 0);
    for (const f of Array.from(files)) {
      if (total + f.size > MAX_TOTAL_BYTES) { toast.error(`Excedes 20MB de anexos (${f.name}).`); continue; }
      const base64 = await fileToBase64(f);
      next.push({ name: f.name, type: f.type || "application/octet-stream", size: f.size, base64 });
      total += f.size;
    }
    setAttachments(next);
  };

  const insertInlineImage = async (file: File) => {
    const base64 = await fileToBase64(file);
    const src = `data:${file.type};base64,${base64}`;
    exec("insertHTML", `<img src="${src}" alt="${file.name}" style="max-width:100%;height:auto;" />`);
  };

  const insertLink = () => {
    const url = prompt("URL do link:");
    if (!url) return;
    exec("createLink", url);
  };

  const draftKey = initial
    ? `mail-draft:${initial.accountId}:${initial.threadId ?? initial.inReplyToMessageId ?? "new"}`
    : null;
  const [restored, setRestored] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const idKey = draftKey ? `${draftKey}:id` : null;

  const splitAddrs = (s: string) => s.split(/[,;]/).map((x) => x.trim()).filter(Boolean);
  const htmlToText = (html: string) =>
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, "\n\n")
      .trim();

  useEffect(() => {
    if (!open || !initial || !draftKey) return;
    let cancelled = false;
    (async () => {
      let local: any = null;
      try { const raw = localStorage.getItem(draftKey); if (raw) local = JSON.parse(raw); } catch { /* */ }
      const cachedId = idKey ? localStorage.getItem(idKey) : null;
      let server: any = null;
      try {
        let q = supabase.from("email_drafts").select("*").eq("account_id", initial.accountId);
        if (cachedId) q = q.eq("id", cachedId);
        else if (initial.threadId) q = q.eq("provider_thread_id", initial.threadId);
        else if (initial.inReplyToMessageId) q = q.eq("in_reply_to_message_id", initial.inReplyToMessageId);
        else q = q.is("provider_thread_id", null).is("in_reply_to_message_id", null);
        const { data } = await q.order("updated_at", { ascending: false }).limit(1).maybeSingle();
        server = data;
      } catch { /* */ }
      if (cancelled) return;
      const localTs = local?.savedAt ?? 0;
      const serverTs = server ? new Date(server.updated_at).getTime() : 0;
      const useServer = server && serverTs >= localTs;
      const src = useServer
        ? {
            to: (server.to_addresses ?? []).join(", "),
            cc: (server.cc_addresses ?? []).join(", "),
            bcc: (server.bcc_addresses ?? []).join(", "),
            subject: server.subject ?? "",
            body: server.body_html ?? "",
          }
        : local;

      setTo(src?.to ?? initial.to ?? "");
      setCc(src?.cc ?? initial.cc ?? "");
      setBcc(src?.bcc ?? "");
      setShowCc(!!(src?.cc ?? initial.cc));
      setShowBcc(!!(src?.bcc));
      setSubject(src?.subject ?? initial.subject ?? "");
      const initHtml = src?.body ?? (initial.body ? initial.body.replace(/\n/g, "<br/>") : "");
      setBody(initHtml);
      if (editorRef.current) editorRef.current.innerHTML = initHtml;
      setLinkedLead(null);
      setRestored(!!src);
      setDraftId(server?.id ?? cachedId ?? null);
      if (server?.id && idKey) localStorage.setItem(idKey, server.id);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  useEffect(() => {
    if (!open || !draftKey || !initial) return;
    const hasContent = to || cc || bcc || subject || body;
    const t = setTimeout(async () => {
      try {
        if (hasContent) localStorage.setItem(draftKey, JSON.stringify({ to, cc, bcc, subject, body, savedAt: Date.now() }));
        else localStorage.removeItem(draftKey);
      } catch { /* */ }
      if (!hasContent) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const payload: any = {
        user_id: userData.user.id,
        account_id: initial.accountId,
        to_addresses: splitAddrs(to),
        cc_addresses: splitAddrs(cc),
        subject,
        body_html: body,
        in_reply_to_message_id: initial.inReplyToMessageId ?? null,
        provider_thread_id: initial.threadId ?? null,
      };
      if (draftId) await supabase.from("email_drafts").update(payload).eq("id", draftId);
      else {
        const { data } = await supabase.from("email_drafts").insert(payload).select("id").maybeSingle();
        if (data?.id) { setDraftId(data.id); if (idKey) localStorage.setItem(idKey, data.id); }
      }
    }, 1200);
    return () => clearTimeout(t);
  }, [open, draftKey, to, cc, bcc, subject, body, draftId, initial, idKey]);

  const clearDraft = async () => {
    if (draftKey) { try { localStorage.removeItem(draftKey); } catch { /* */ } }
    if (idKey) { try { localStorage.removeItem(idKey); } catch { /* */ } }
    if (draftId) { try { await supabase.from("email_drafts").delete().eq("id", draftId); } catch { /* */ } setDraftId(null); }
  };

  useEffect(() => {
    const email = to.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0]?.toLowerCase();
    if (!email) return setLinkedLead(null);
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("leads").select("id,name,email").ilike("email", email).limit(1).maybeSingle();
      if (!cancelled) setLinkedLead(data ?? null);
    })();
    return () => { cancelled = true; };
  }, [to]);

  const send = async () => {
    if (!initial) return;
    if (!to.trim() || !subject.trim()) { toast.error("Preenche destinatário e assunto."); return; }
    setSending(true);
    try {
      const fnName = initial.provider === "imap" ? "email-imap-smtp-send" : "email-gmail-proxy";
      const plain = htmlToText(body);
      const { data, error } = await invokeIntegration(fnName, {
        body: {
          action: "send",
          account_id: initial.accountId,
          to,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject,
          body_text: plain,
          body_html: body || undefined,
          in_reply_to_message_id: initial.inReplyToMessageId ?? undefined,
          thread_id: initial.threadId ?? undefined,
          lead_id: linkedLead?.id ?? undefined,
          attachments: attachments.length ? attachments : undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Email enviado.");
      setAttachments([]);
      clearDraft();
      onOpenChange(false);
      onSent?.();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar email.");
    } finally {
      setSending(false);
    }
  };

  const ToolbarBtn = ({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) => (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Nova mensagem</DialogTitle>
        </DialogHeader>
        {restored && (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-xs">
            <span>Rascunho restaurado automaticamente.</span>
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() => {
                clearDraft(); setTo(""); setCc(""); setBcc(""); setSubject(""); setBody("");
                if (editorRef.current) editorRef.current.innerHTML = "";
                setAttachments([]); setRestored(false);
              }}
            >
              Descartar
            </button>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="to" className="w-12 text-xs text-muted-foreground">Para</Label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="destinatario@exemplo.com" className="flex-1" />
            <div className="flex items-center gap-2 text-xs">
              {!showCc && <button type="button" onClick={() => setShowCc(true)} className="text-muted-foreground hover:text-foreground">Cc</button>}
              {!showBcc && <button type="button" onClick={() => setShowBcc(true)} className="text-muted-foreground hover:text-foreground">Bcc</button>}
            </div>
          </div>
          {linkedLead && (
            <div className="flex items-center gap-1.5 text-xs text-primary pl-14">
              <User className="h-3 w-3" />
              Associado ao lead: <strong>{linkedLead.name ?? linkedLead.email}</strong>
            </div>
          )}
          {showCc && (
            <div className="flex items-center gap-2">
              <Label htmlFor="cc" className="w-12 text-xs text-muted-foreground">Cc</Label>
              <Input id="cc" value={cc} onChange={(e) => setCc(e.target.value)} className="flex-1" />
              <button type="button" onClick={() => { setShowCc(false); setCc(""); }} aria-label="Remover Cc" className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          {showBcc && (
            <div className="flex items-center gap-2">
              <Label htmlFor="bcc" className="w-12 text-xs text-muted-foreground">Bcc</Label>
              <Input id="bcc" value={bcc} onChange={(e) => setBcc(e.target.value)} className="flex-1" />
              <button type="button" onClick={() => { setShowBcc(false); setBcc(""); }} aria-label="Remover Bcc" className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Label htmlFor="subject" className="w-12 text-xs text-muted-foreground">Assunto</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} className="flex-1" />
          </div>

          {/* Editor */}
          <div className="rounded-md border">
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={(e) => setBody((e.target as HTMLDivElement).innerHTML)}
              onBlur={saveSelection}
              onKeyUp={saveSelection}
              onMouseUp={saveSelection}
              className="min-h-[220px] max-h-[380px] overflow-y-auto p-3 text-sm focus:outline-none prose prose-sm max-w-none"
              data-placeholder="Escreve a tua mensagem…"
            />
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 border-t bg-muted/40 px-2 py-1.5">
              <ToolbarBtn label="Desfazer" onClick={() => exec("undo")}><Undo2 className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Refazer" onClick={() => exec("redo")}><Redo2 className="h-4 w-4" /></ToolbarBtn>
              <select
                aria-label="Tamanho"
                onMouseDown={saveSelection}
                onChange={(e) => { exec("fontSize", e.target.value); e.target.value = ""; }}
                className="h-8 rounded bg-transparent px-1 text-xs text-muted-foreground hover:text-foreground"
                defaultValue=""
              >
                <option value="" disabled>Tamanho</option>
                <option value="2">Pequeno</option>
                <option value="3">Normal</option>
                <option value="5">Grande</option>
                <option value="6">Título</option>
              </select>
              <ToolbarBtn label="Negrito" onClick={() => exec("bold")}><Bold className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Itálico" onClick={() => exec("italic")}><Italic className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Sublinhado" onClick={() => exec("underline")}><Underline className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Riscado" onClick={() => exec("strikeThrough")}><Strikethrough className="h-4 w-4" /></ToolbarBtn>
              <label className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Cor do texto" aria-label="Cor do texto">
                <Type className="h-4 w-4" />
                <input type="color" className="sr-only" onMouseDown={saveSelection} onChange={(e) => exec("foreColor", e.target.value)} />
              </label>
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarBtn label="Alinhar à esquerda" onClick={() => exec("justifyLeft")}><AlignLeft className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Centrar" onClick={() => exec("justifyCenter")}><AlignCenter className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Alinhar à direita" onClick={() => exec("justifyRight")}><AlignRight className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Lista com marcadores" onClick={() => exec("insertUnorderedList")}><List className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Lista numerada" onClick={() => exec("insertOrderedList")}><ListOrdered className="h-4 w-4" /></ToolbarBtn>
              <ToolbarBtn label="Citação" onClick={() => exec("formatBlock", "blockquote")}><Quote className="h-4 w-4" /></ToolbarBtn>
              <div className="mx-1 h-5 w-px bg-border" />
              <ToolbarBtn label="Inserir link" onClick={insertLink}><Link2 className="h-4 w-4" /></ToolbarBtn>
              <label className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Imagem inline" aria-label="Imagem inline">
                <ImageIcon className="h-4 w-4" />
                <input type="file" accept="image/*" className="sr-only" onMouseDown={saveSelection} onChange={(e) => { const f = e.target.files?.[0]; if (f) insertInlineImage(f); e.currentTarget.value = ""; }} />
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" onMouseDown={saveSelection} className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Emoji" aria-label="Emoji">
                    <Smile className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="end">
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((e) => (
                      <button key={e} type="button" className="text-lg hover:bg-muted rounded" onClick={() => exec("insertText", e)}>{e}</button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <label className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer" title="Anexar ficheiro" aria-label="Anexar ficheiro">
                <Paperclip className="h-4 w-4" />
                <input type="file" multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.currentTarget.value = ""; }} />
              </label>
              <div className="ml-auto" />
              <ToolbarBtn label="Limpar formatação" onClick={() => exec("removeFormat")}><Trash2 className="h-4 w-4" /></ToolbarBtn>
            </div>
          </div>

          {attachments.length > 0 && (
            <ul className="space-y-1">
              {attachments.map((a, i) => (
                <li key={i} className="flex items-center justify-between text-xs rounded border bg-muted/40 px-2 py-1">
                  <span className="truncate flex items-center gap-1.5"><Paperclip className="h-3 w-3" />{a.name} <span className="text-muted-foreground">({Math.round(a.size / 1024)} KB)</span></span>
                  <button type="button" aria-label={`Remover ${a.name}`} onClick={() => setAttachments(attachments.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancelar</Button>
          <Button onClick={send} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Enviar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
