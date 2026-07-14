import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2, MessageSquare, ShieldCheck, ShieldAlert, User, Bot, UserCog,
  ArrowRight, HelpCircle, Link2, Calendar,
} from "lucide-react";

type Conversation = {
  id: string;
  contact_phone: string | null;
  contact_name: string | null;
  channel: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
};

type ChatMsg = {
  id: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  sender: "contact" | "assistant" | "human";
  content: string;
  created_at: string;
};

type Check = {
  id: string;
  conversation_id: string;
  turn_index: number | null;
  persona_ok: boolean;
  question_count: number;
  single_question_ok: boolean;
  has_meeting_invite: boolean;
  has_booking_link: boolean;
  pt_pt_ok: boolean;
  overridden: boolean;
  override_reason: string | null;
  violations: string[];
  reply_preview: string | null;
  created_at: string;
};

type TimelineItem =
  | { kind: "msg"; at: string; data: ChatMsg }
  | { kind: "check"; at: string; data: Check };

export default function WhatsAppConciergeAudit() {
  const [search, setSearch] = useState("");
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [checks, setChecks] = useState<Check[]>([]);

  // Load conversations
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingList(true);
      const q = search.trim();
      let query = supabase
        .from("whatsapp_conversations")
        .select("id,contact_phone,contact_name,channel,last_message_at,last_message_preview")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (q) {
        query = query.or(
          `contact_phone.ilike.%${q}%,contact_name.ilike.%${q}%,id.eq.${/^[0-9a-f-]{36}$/i.test(q) ? q : "00000000-0000-0000-0000-000000000000"}`,
        );
      }
      const { data } = await query;
      if (!cancelled) {
        setConvs((data || []) as Conversation[]);
        setLoadingList(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search]);

  // Load messages + checks for selected conversation
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    (async () => {
      setLoadingDetail(true);
      const [{ data: msgs }, { data: chks }] = await Promise.all([
        supabase
          .from("whatsapp_chat_messages")
          .select("id,conversation_id,direction,sender,content,created_at")
          .eq("conversation_id", selectedId)
          .order("created_at", { ascending: true })
          .limit(1000),
        supabase
          .from("whatsapp_concierge_checks")
          .select("*")
          .eq("conversation_id", selectedId)
          .order("created_at", { ascending: true })
          .limit(1000),
      ]);
      if (cancelled) return;
      setMessages((msgs || []) as ChatMsg[]);
      setChecks((chks || []) as Check[]);
      setLoadingDetail(false);
    })();
    return () => { cancelled = true; };
  }, [selectedId]);

  const selectedConv = convs.find(c => c.id === selectedId) || null;

  const timeline: TimelineItem[] = useMemo(() => {
    const items: TimelineItem[] = [
      ...messages.map<TimelineItem>(m => ({ kind: "msg", at: m.created_at, data: m })),
      ...checks.map<TimelineItem>(c => ({ kind: "check", at: c.created_at, data: c })),
    ];
    items.sort((a, b) => a.at.localeCompare(b.at));
    return items;
  }, [messages, checks]);

  const stats = useMemo(() => {
    const total = checks.length;
    const valid = checks.filter(c => c.persona_ok && c.single_question_ok && c.pt_pt_ok && !c.overridden).length;
    const overrides = checks.filter(c => c.overridden).length;
    const invites = checks.filter(c => c.has_meeting_invite).length;
    const bookingLinks = checks.filter(c => c.has_booking_link).length;
    const multi = checks.filter(c => !c.single_question_ok).length;
    const totalQuestions = checks.reduce((s, c) => s + (c.question_count || 0), 0);
    return { total, valid, overrides, invites, bookingLinks, multi, totalQuestions };
  }, [checks]);

  return (
    <div className="grid gap-4 md:grid-cols-[320px_1fr]">
      {/* Conversation list */}
      <Card className="h-[calc(100vh-220px)] flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversas</CardTitle>
          <Label className="text-xs text-muted-foreground mt-2">Pesquisar por telefone, nome ou ID</Label>
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="+351… / Ana / uuid" className="h-9" />
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            {loadingList ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar…
              </div>
            ) : convs.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4">Sem conversas.</div>
            ) : (
              <ul className="divide-y">
                {convs.map(c => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`w-full text-left px-3 py-2 hover:bg-muted/50 transition ${selectedId === c.id ? "bg-muted" : ""}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {c.contact_name || c.contact_phone || c.id.slice(0, 8)}
                        </span>
                        {c.channel && <Badge variant="outline" className="text-[10px]">{c.channel}</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">{c.contact_phone || "—"}</div>
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {c.last_message_preview || "—"}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Audit detail */}
      <div className="space-y-4">
        {!selectedId ? (
          <Card><CardContent className="py-16 text-center text-muted-foreground text-sm">
            Selecciona uma conversa para ver a auditoria do concierge.
          </CardContent></Card>
        ) : loadingDetail ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> A carregar auditoria…
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {selectedConv?.contact_name || selectedConv?.contact_phone || "Conversa"}
                  {selectedConv?.channel && <Badge variant="outline">{selectedConv.channel}</Badge>}
                </CardTitle>
                <p className="text-xs text-muted-foreground font-mono">{selectedId}</p>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-6 gap-3 text-sm">
                <Stat label="Respostas verificadas" value={stats.total} />
                <Stat label="Válidas" value={stats.valid} tone="good" />
                <Stat label="Gate overrides" value={stats.overrides} tone={stats.overrides ? "warn" : undefined} />
                <Stat label="Convites reunião" value={stats.invites} />
                <Stat label="Links booking" value={stats.bookingLinks} />
                <Stat label="Perguntas totais" value={stats.totalQuestions} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Timeline — mensagens & decisões do gate</CardTitle>
              </CardHeader>
              <CardContent>
                {timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem eventos.</p>
                ) : (
                  <ol className="relative border-l pl-4 space-y-3">
                    {timeline.map((item, i) => item.kind === "msg" ? (
                      <MessageRow key={`m-${item.data.id}`} m={item.data} />
                    ) : (
                      <CheckRow key={`c-${item.data.id}`} c={item.data} />
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "good" | "warn" }) {
  const color = tone === "good" ? "text-green-600" : tone === "warn" ? "text-orange-600" : "text-foreground";
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold ${color}`}>{value}</div>
    </div>
  );
}

function MessageRow({ m }: { m: ChatMsg }) {
  const Icon = m.sender === "contact" ? User : m.sender === "human" ? UserCog : Bot;
  const label = m.sender === "contact" ? "Contacto" : m.sender === "human" ? "Humano" : "Assistente";
  const dirBadge = m.direction === "inbound" ? "IN" : "OUT";
  return (
    <li className="relative">
      <span className="absolute -left-[22px] top-1 h-3 w-3 rounded-full bg-muted-foreground/40" />
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        <span>{label}</span>
        <Badge variant="outline" className="text-[10px]">{dirBadge}</Badge>
        <span>·</span>
        <span>{new Date(m.created_at).toLocaleString("pt-PT")}</span>
      </div>
      <div className="text-sm whitespace-pre-wrap mt-1 bg-muted/40 rounded p-2">{m.content}</div>
    </li>
  );
}

function CheckRow({ c }: { c: Check }) {
  const valid = c.persona_ok && c.single_question_ok && c.pt_pt_ok && !c.overridden;
  return (
    <li className="relative">
      <span className={`absolute -left-[22px] top-1 h-3 w-3 rounded-full ${valid ? "bg-green-500" : "bg-red-500"}`} />
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {valid ? <ShieldCheck className="h-3 w-3 text-green-600" /> : <ShieldAlert className="h-3 w-3 text-red-600" />}
        <span className="font-medium">Decisão do gate</span>
        {c.turn_index != null && <Badge variant="outline" className="text-[10px]">turn #{c.turn_index}</Badge>}
        <span>·</span>
        <span>{new Date(c.created_at).toLocaleString("pt-PT")}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mt-1.5">
        <Badge variant={c.persona_ok ? "outline" : "destructive"}>Persona {c.persona_ok ? "OK" : "✗"}</Badge>
        <Badge variant={c.single_question_ok ? "outline" : "destructive"} className="gap-1">
          <HelpCircle className="h-3 w-3" /> {c.question_count} pergunta{c.question_count === 1 ? "" : "s"}
        </Badge>
        <Badge variant={c.pt_pt_ok ? "outline" : "destructive"}>PT-PT {c.pt_pt_ok ? "OK" : "✗"}</Badge>
        {c.has_meeting_invite && <Badge variant="secondary" className="gap-1"><Calendar className="h-3 w-3" /> convite</Badge>}
        {c.has_booking_link && <Badge variant="secondary" className="gap-1"><Link2 className="h-3 w-3" /> booking</Badge>}
        {c.overridden && (
          <Badge variant="destructive" className="gap-1">
            <ArrowRight className="h-3 w-3" /> override
          </Badge>
        )}
      </div>
      {c.overridden && c.override_reason && (
        <div className="text-xs text-muted-foreground mt-1">
          <span className="font-medium">Motivo do override:</span> {c.override_reason}
        </div>
      )}
      {c.violations && c.violations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {c.violations.map((v, i) => (
            <Badge key={i} variant="outline" className="text-[10px] border-destructive/40 text-destructive">{v}</Badge>
          ))}
        </div>
      )}
      {c.reply_preview && (
        <div className="text-xs text-muted-foreground mt-1.5 italic line-clamp-2">"{c.reply_preview}"</div>
      )}
    </li>
  );
}
