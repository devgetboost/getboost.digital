import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Bot, User, UserCog, ShieldAlert, CheckCircle2, Send, Save } from "lucide-react";


type Check = {
  id: string;
  conversation_id: string | null;
  turn_index: number | null;
  persona_ok: boolean;
  single_question_ok: boolean;
  pt_pt_ok: boolean;
  question_count: number;
  overridden: boolean;
  override_reason: string | null;
  violations: string[] | null;
  reply_preview: string | null;
  created_at: string;
};

type Msg = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender: "contact" | "assistant" | "human";
  content: string;
  created_at: string;
};

type ConvMeta = { id: string; contact_phone: string | null; contact_name: string | null; channel: string | null };

type Handoff = {
  id: string;
  conversation_id: string | null;
  status: string;
  notes: string | null;
  forwarded_to: string | null;
  resolved_at: string | null;
  forwarded_at: string | null;
};


type TimelineItem =
  | { kind: "msg"; at: string; data: Msg }
  | { kind: "check"; at: string; data: Check };

export default function ViolationDrilldownDialog({
  open, onOpenChange, category, from, to,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  category: string | null;
  from: Date;
  to: Date;
}) {
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [convs, setConvs] = useState<Map<string, ConvMeta>>(new Map());
  const [handoffs, setHandoffs] = useState<Map<string, Handoff>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [forwardDraft, setForwardDraft] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);


  useEffect(() => {
    if (!open || !category) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setExpanded(null);
      const { data: raw } = await supabase
        .from("whatsapp_concierge_checks")
        .select("id,conversation_id,turn_index,persona_ok,single_question_ok,pt_pt_ok,question_count,overridden,override_reason,violations,reply_preview,created_at")
        .gte("created_at", from.toISOString())
        .lt("created_at", to.toISOString())
        .order("created_at", { ascending: true })
        .limit(5000);
      const filtered = ((raw || []) as Check[]).filter(c =>
        (c.violations || []).some(v => v.split(":")[0].trim() === category)
      );
      const ids = Array.from(new Set(filtered.map(c => c.conversation_id).filter((x): x is string => !!x)));
      const [{ data: convRows }, { data: msgRows }] = await Promise.all([
        ids.length
          ? supabase.from("whatsapp_conversations").select("id,contact_phone,contact_name,channel").in("id", ids)
          : Promise.resolve({ data: [] as ConvMeta[] }),
        ids.length
          ? supabase.from("whatsapp_chat_messages")
              .select("id,conversation_id,direction,sender,content,created_at")
              .in("conversation_id", ids)
              .gte("created_at", from.toISOString())
              .lt("created_at", to.toISOString())
              .order("created_at", { ascending: true })
              .limit(5000)
          : Promise.resolve({ data: [] as Msg[] }),
      ]);
      if (cancelled) return;
      const map = new Map<string, ConvMeta>();
      for (const c of (convRows || []) as ConvMeta[]) map.set(c.id, c);
      setConvs(map);
      setChecks(filtered);
      setMessages((msgRows || []) as Msg[]);

      // Load latest handoff per conversation
      const hMap = new Map<string, Handoff>();
      if (ids.length) {
        const { data: hRows } = await supabase
          .from("whatsapp_handoffs")
          .select("id,conversation_id,status,notes,forwarded_to,resolved_at,forwarded_at,created_at")
          .in("conversation_id", ids)
          .order("created_at", { ascending: false });
        for (const h of (hRows || []) as (Handoff & { created_at: string })[]) {
          if (h.conversation_id && !hMap.has(h.conversation_id)) hMap.set(h.conversation_id, h);
        }
      }
      if (cancelled) return;
      setHandoffs(hMap);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, category, from, to]);

  const upsertHandoff = async (
    cid: string,
    patch: { status?: string; notes?: string; forwarded_to?: string | null }
  ) => {
    const existing = handoffs.get(cid);
    const meta = convs.get(cid);

    // ---- Validation ----
    if (!cid || cid === "sem-id") {
      toast.error("Conversa sem ID — não é possível atualizar o handoff.");
      return;
    }
    if (patch.status === "resolved" && existing?.status === "resolved") {
      toast.info("Já está marcado como resolvido.");
      return;
    }
    if (patch.status === "forwarded") {
      const dest = (patch.forwarded_to || "").trim();
      if (!dest) {
        toast.error("Indica para quem estás a encaminhar antes de confirmar.");
        return;
      }
      if (dest.length > 200) {
        toast.error("Destinatário demasiado longo (máx. 200 caracteres).");
        return;
      }
      patch.forwarded_to = dest;
    }
    if (patch.notes !== undefined) {
      const note = (patch.notes || "").trim();
      if (!note) {
        toast.error("A nota não pode estar vazia.");
        return;
      }
      if (note.length > 2000) {
        toast.error("Nota demasiado longa (máx. 2000 caracteres).");
        return;
      }
      patch.notes = note;
    }

    setSavingId(cid);
    try {
      const now = new Date().toISOString();
      const nextNotes =
        patch.notes !== undefined
          ? [existing?.notes, `[${new Date().toLocaleString("pt-PT")}] ${patch.notes}`]
              .filter(Boolean)
              .join("\n---\n")
          : existing?.notes ?? null;

      const payload: Record<string, string | null> = { updated_at: now };
      if (patch.status) {
        payload.status = patch.status;
        if (patch.status === "resolved") payload.resolved_at = now;
        if (patch.status === "forwarded") payload.forwarded_at = now;
      }
      if (patch.forwarded_to !== undefined) payload.forwarded_to = patch.forwarded_to;
      if (patch.notes !== undefined) payload.notes = nextNotes;

      let saved: Handoff | null = null;
      if (existing) {
        const { data, error } = await supabase
          .from("whatsapp_handoffs")
          .update(payload as never)
          .eq("id", existing.id)
          .select("id,conversation_id,status,notes,forwarded_to,resolved_at,forwarded_at")
          .single();
        if (error) throw error;
        saved = data as Handoff;
      } else {
        const { data, error } = await supabase
          .from("whatsapp_handoffs")
          .insert({
            conversation_id: cid,
            contact_phone: meta?.contact_phone || null,
            contact_name: meta?.contact_name || null,
            category: category || "audit",
            source: "audit_drilldown",
            status: patch.status || "in_review",
            notes: patch.notes ? `[${new Date().toLocaleString("pt-PT")}] ${patch.notes}` : null,
            forwarded_to: patch.forwarded_to ?? null,
            resolved_at: patch.status === "resolved" ? now : null,
            forwarded_at: patch.status === "forwarded" ? now : null,
          })
          .select("id,conversation_id,status,notes,forwarded_to,resolved_at,forwarded_at")
          .single();
        if (error) throw error;
        saved = data as Handoff;
      }
      if (!saved) throw new Error("Sem resposta do servidor ao atualizar o handoff.");

      setHandoffs(prev => {
        const n = new Map(prev);
        n.set(cid, saved!);
        return n;
      });
      if (patch.notes !== undefined) setNoteDraft(prev => ({ ...prev, [cid]: "" }));
      if (patch.status === "forwarded") setForwardDraft(prev => ({ ...prev, [cid]: "" }));

      const successMsg =
        patch.status === "resolved" ? "Conversa marcada como resolvida"
        : patch.status === "forwarded" ? `Encaminhada para ${patch.forwarded_to}`
        : patch.notes !== undefined ? "Nota adicionada ao log"
        : "Handoff atualizado";
      toast.success(successMsg);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao guardar";
      console.error("upsertHandoff failed", { cid, patch, error: e });
      toast.error(`Não foi possível atualizar: ${msg}`);
    } finally {
      setSavingId(null);
    }
  };



  const grouped = useMemo(() => {
    const g = new Map<string, { checks: Check[]; total: number }>();
    for (const c of checks) {
      const cid = c.conversation_id || "sem-id";
      const prev = g.get(cid) || { checks: [], total: 0 };
      prev.checks.push(c);
      prev.total++;
      g.set(cid, prev);
    }
    return [...g.entries()].sort((a, b) => b[1].total - a[1].total);
  }, [checks]);

  const timelineFor = (cid: string): TimelineItem[] => {
    const items: TimelineItem[] = [];
    for (const m of messages) if (m.conversation_id === cid) items.push({ kind: "msg", at: m.created_at, data: m });
    for (const c of checks) if (c.conversation_id === cid) items.push({ kind: "check", at: c.created_at, data: c });
    return items.sort((a, b) => a.at.localeCompare(b.at));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Drill-down: {category || "—"}
          </DialogTitle>
          <DialogDescription>
            Conversas afectadas pela violação <strong>{category}</strong> em{" "}
            {from.toLocaleString("pt-PT")} → {to.toLocaleString("pt-PT")}.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar…
          </div>
        ) : grouped.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground text-center">Sem conversas afectadas.</div>
        ) : (
          <ScrollArea className="flex-1 pr-3">
            <div className="space-y-3">
              {grouped.map(([cid, info]) => {
                const meta = convs.get(cid);
                const isOpen = expanded === cid;
                const h = handoffs.get(cid);
                const busy = savingId === cid;
                return (
                  <div key={cid} className="border rounded-md">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : cid)}
                      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 text-left"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {meta?.contact_name || meta?.contact_phone || cid}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {meta?.channel || "—"} · {meta?.contact_phone || cid}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {h?.status && (
                          <Badge variant="outline" className="capitalize">{h.status}</Badge>
                        )}
                        <Badge variant="destructive">{info.total} violaç{info.total === 1 ? "ão" : "ões"}</Badge>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t p-3 space-y-3 bg-muted/20">
                        <div className="rounded border bg-background p-3 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              size="sm"
                              variant="default"
                              disabled={busy || h?.status === "resolved"}
                              onClick={() => upsertHandoff(cid, { status: "resolved" })}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Marcar resolvido
                            </Button>
                            <div className="flex items-center gap-1">
                              <input
                                className="h-8 text-xs rounded border bg-background px-2 w-40"
                                placeholder="Encaminhar para…"
                                value={forwardDraft[cid] ?? h?.forwarded_to ?? ""}
                                onChange={e => setForwardDraft(p => ({ ...p, [cid]: e.target.value }))}
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={busy}
                                onClick={() => upsertHandoff(cid, {
                                  status: "forwarded",
                                  forwarded_to: (forwardDraft[cid] ?? h?.forwarded_to ?? "").trim() || null,
                                })}
                              >
                                <Send className="h-3.5 w-3.5 mr-1" /> Encaminhar
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Textarea
                              rows={2}
                              placeholder="Adicionar nota ao log da conversa…"
                              value={noteDraft[cid] ?? ""}
                              onChange={e => setNoteDraft(p => ({ ...p, [cid]: e.target.value }))}
                              className="text-xs"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy || !(noteDraft[cid] || "").trim()}
                                onClick={() => upsertHandoff(cid, { notes: (noteDraft[cid] || "").trim() })}
                              >
                                <Save className="h-3.5 w-3.5 mr-1" /> Guardar nota
                              </Button>
                            </div>
                            {h?.notes && (
                              <pre className="text-[11px] whitespace-pre-wrap bg-muted/40 rounded p-2 text-muted-foreground max-h-40 overflow-auto">
{h.notes}
                              </pre>
                            )}
                          </div>
                        </div>

                        {timelineFor(cid).map((it, i) => (
                          <TimelineRow key={`${it.kind}-${it.kind === "msg" ? it.data.id : it.data.id}-${i}`} item={it} highlight={category} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TimelineRow({ item, highlight }: { item: TimelineItem; highlight: string | null }) {
  const when = new Date(item.at).toLocaleString("pt-PT");
  if (item.kind === "msg") {
    const m = item.data;
    const Icon = m.sender === "contact" ? User : m.sender === "human" ? UserCog : Bot;
    const align = m.direction === "inbound" ? "items-start" : "items-end";
    return (
      <div className={`flex flex-col ${align}`}>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Icon className="h-3 w-3" /> {m.sender} · {when}
        </div>
        <div className="text-sm bg-background border rounded px-3 py-2 max-w-[85%] whitespace-pre-wrap">
          {m.content}
        </div>
      </div>
    );
  }
  const c = item.data;
  const isValid = c.persona_ok && c.single_question_ok && c.pt_pt_ok && !c.overridden;
  const catViolations = (c.violations || []).filter(v => v.split(":")[0].trim() === highlight);
  return (
    <div className="rounded border border-dashed p-2 bg-background">
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        {isValid ? <CheckCircle2 className="h-3 w-3 text-green-600" /> : <ShieldAlert className="h-3 w-3 text-destructive" />}
        Turno {c.turn_index ?? "?"} · perguntas: {c.question_count} · {when}
      </div>
      {catViolations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {catViolations.map((v, i) => (
            <Badge key={i} variant="outline" className="border-destructive/40 text-destructive text-[10px]">{v}</Badge>
          ))}
        </div>
      )}
      {c.overridden && c.override_reason && (
        <div className="text-[11px] text-orange-600 mt-1">Override: {c.override_reason}</div>
      )}
      {c.reply_preview && (
        <div className="text-xs mt-1 italic text-muted-foreground line-clamp-2">"{c.reply_preview}"</div>
      )}
    </div>
  );
}
