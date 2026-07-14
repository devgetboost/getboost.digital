import { useState } from "react";
import { ArrowLeft, Star, MoreVertical, Reply, ReplyAll, Forward, Send, User, Sparkles, AlertCircle, Check, Pencil, X, UserPlus, MessageCircle, Link2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ReaderMessage = {
  id?: string;
  threadId?: string | null;
  from: string;
  fromEmail: string;
  subject: string;
  date: string;
  bodyHtml: string;
  badges?: { label: string; tone: "danger" | "warn" | "info" | "neutral" }[];
  lead?: { id: string; name: string | null; email: string } | null;
};

type Props = {
  onBack?: () => void;
  onCompose?: () => void;
  onReply?: (mode: "reply" | "replyAll" | "forward", draft?: string) => void;
  onLinkLead?: () => void;
  message?: ReaderMessage | null;
};

const toneMap = {
  danger: "bg-red-50 text-red-700 border-red-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-muted text-muted-foreground border-border",
} as const;

function formatDatePT(input: string): string {
  if (!input) return "";
  const d = new Date(input);
  if (isNaN(d.getTime())) return input;
  return new Intl.DateTimeFormat("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

export function MailReader({ onBack, onCompose, onReply, message }: Props) {
  const [draft, setDraft] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<"pending" | "done">("pending");
  const [starred, setStarred] = useState(false);

  if (!message) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground text-sm">
        <p>Seleciona um email para o ver aqui.</p>
        {onCompose && (
          <Button onClick={onCompose} className="gap-2">
            <Send className="h-4 w-4" /> Nova mensagem
          </Button>
        )}
      </div>
    );
  }

  const suggestDraft = () => {
    const name = message.from.split(" ")[0] || "";
    setDraft(
      `Olá ${name},\n\nObrigado pela mensagem. Analisei o pedido e vou tratar do assunto. Envio actualização em breve.\n\nMelhor,`
    );
    setEditing(false);
  };

  const waPhone = (message?.lead as any)?.phone as string | undefined;

  const sendToCRM = async () => {
    if (!message) return;
    try {
      if (message.lead?.id) {
        await supabase.from("leads").update({ last_email_subject: message.subject, last_email_at: new Date().toISOString() } as any).eq("id", message.lead.id);
        toast.success("Actualizado no CRM.");
        return;
      }
      const { error } = await supabase.from("leads").insert({
        name: message.from,
        email: message.fromEmail,
        source: "inbox",
        notes: message.subject,
      } as any);
      if (error) throw error;
      toast.success("Enviado para o CRM como novo lead.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao enviar para o CRM.");
    }
  };

  const sendToWhatsApp = () => {
    if (!message) return;
    const digits = (waPhone ?? "").replace(/[^\d]/g, "");
    const text = encodeURIComponent(`Olá ${message.from.split(" ")[0]}, sobre "${message.subject}"…`);
    const url = digits ? `https://wa.me/${digits}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, "_blank", "noopener");
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(message?.fromEmail ?? "");
    toast.success("Email copiado.");
  };

  return (
    <div className="flex-1 min-w-0 flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex items-start gap-3 px-6 py-4 border-b">
        <Button size="icon" variant="ghost" onClick={onBack} aria-label="Voltar" className="mt-0.5">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold truncate">{message.subject}</h1>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-[11px] px-2.5 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-200 font-medium">
              Precisa de resposta
            </span>
            {draft && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full border bg-muted text-muted-foreground border-border">
                Existe um rascunho
              </span>
            )}
            {message.lead && (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full border bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1">
                <User className="h-3 w-3" /> Lead: {message.lead.name ?? message.lead.email}
              </span>
            )}
            {message.badges?.map((b, i) => (
              <span key={i} className={`text-[11px] px-2.5 py-0.5 rounded-full border ${toneMap[b.tone]}`}>{b.label}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">{formatDatePT(message.date)}</span>
          <Button
            size="icon"
            variant="ghost"
            aria-label={starred ? "Remover estrela" : "Marcar com estrela"}
            onClick={() => setStarred((v) => !v)}
          >
            <Star className={`h-4 w-4 ${starred ? "fill-amber-400 text-amber-400" : ""}`} />
          </Button>
          <Button size="icon" variant="ghost" aria-label="Responder" onClick={() => onReply?.("reply")}>
            <Reply className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Mais opções">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => onReply?.("reply")}>
                <Reply className="h-4 w-4 mr-2" /> Responder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReply?.("replyAll")}>
                <ReplyAll className="h-4 w-4 mr-2" /> Responder a todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReply?.("forward")}>
                <Forward className="h-4 w-4 mr-2" /> Encaminhar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={sendToCRM}>
                <UserPlus className="h-4 w-4 mr-2" /> Enviar para CRM
              </DropdownMenuItem>
              <DropdownMenuItem onClick={sendToWhatsApp}>
                <MessageCircle className="h-4 w-4 mr-2" /> Enviar por WhatsApp
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStarred((v) => !v)}>
                <Star className={`h-4 w-4 mr-2 ${starred ? "fill-amber-400 text-amber-400" : ""}`} />
                {starred ? "Remover estrela" : "Marcar com estrela"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copyEmail}>
                <Copy className="h-4 w-4 mr-2" /> Copiar endereço
              </DropdownMenuItem>
              {message.lead?.id && (
                <DropdownMenuItem asChild>
                  <a href={`/admin/leads/${message.lead.id}`}>
                    <Link2 className="h-4 w-4 mr-2" /> Abrir lead
                  </a>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-6 py-6 space-y-5">
          <div className="flex items-baseline justify-between text-sm">
            <div>
              <p className="font-semibold">{message.from}</p>
              <p className="text-xs text-muted-foreground">{message.fromEmail}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Para: mim</p>
            </div>
            <p className="text-xs text-muted-foreground">{formatDatePT(message.date)}</p>
          </div>

          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: message.bodyHtml }} />

          {/* AI draft suggestion */}
          {!draft ? (
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Precisas de ajuda? A IA pode sugerir um rascunho de resposta.
              </div>
              <Button size="sm" onClick={suggestDraft} className="gap-2">
                <Sparkles className="h-4 w-4" /> Sugerir com IA
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border-l-4 border-l-primary bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sua resposta preliminar
                  <span className="ml-2 text-[10px] font-normal normal-case px-2 py-0.5 rounded-full bg-primary/10 text-primary/80">
                    gerada por IA
                  </span>
                </div>
                <button
                  onClick={() => { setDraft(null); setEditing(false); }}
                  className="text-muted-foreground hover:text-foreground"
                  aria-label="Descartar rascunho"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="rounded-md bg-background border p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-2">Para: {message.from}</p>
                {editing ? (
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="min-h-[140px] text-sm"
                    autoFocus
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{draft}</pre>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" className="gap-2" onClick={() => onReply?.("reply", draft)}>
                  <Send className="h-4 w-4" /> Enviar resposta
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => setEditing((v) => !v)}>
                  <Pencil className="h-4 w-4" /> {editing ? "Concluir edição" : "Editar rascunho"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => { setDraft(null); setEditing(false); }}>
                  Descartar
                </Button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={() => onReply?.("reply")}>
              <Reply className="h-3.5 w-3.5" /> Responder
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium" onClick={() => onReply?.("replyAll")}>
              <ReplyAll className="h-3.5 w-3.5" /> Responder a todos
            </Button>
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs font-medium" onClick={() => onReply?.("forward")}>
              <Forward className="h-3.5 w-3.5" /> Encaminhar
            </Button>
          </div>

        </div>
      </div>

      {/* Footer status */}
      <div className="border-t bg-muted/30 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Status do acompanhamento:</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-8 px-2 rounded-md border bg-background text-sm"
          >
            <option value="pending">Precisa de resposta</option>
            <option value="done">Concluído</option>
          </select>
        </div>
        <Button
          size="sm"
          onClick={() => setStatus("done")}
          className="h-8 gap-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {status === "done" ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
          Marcar como concluído
        </Button>
      </div>
    </div>
  );
}
