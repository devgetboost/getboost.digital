import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Bell, Filter, MoreHorizontal, Paperclip, Phone, Search, Send, Settings,
  Smile, Wallet, Pencil, Mail, PhoneCall, UserPlus, Plus, MessageCircle, CheckCheck, Archive, Check, CalendarClock,
} from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { MailComposer, type ComposerInitial } from '@/components/admin/mail/MailComposer';


const EMOJI_SET = ['😀','😁','😂','🤣','😊','😍','😘','😉','😎','🤩','🥳','🤗','🤔','😅','😇','🙂','🙃','😌','😴','🤤','😋','😜','🤪','😏','🙄','😢','😭','😤','😡','🤯','😱','🥶','🤒','🤕','🤧','🥴','👍','👎','👏','🙏','💪','👀','🔥','✨','🎉','💯','✅','❌','❤️','💔','💙','💚','💛','🧡','💜','⭐','☀️','🌙','☕','🍕','🍔','🎂','🍺','⚽','🏆','📞','📩','📎','💬'];

interface Conversation {
  id: string;
  instance_id: string;
  contact_phone: string;
  contact_name: string | null;
  last_message_preview: string | null;
  last_message_at: string;
  assistant_enabled: boolean;
  handoff_to_human: boolean;
  unread_count: number;
  channel?: 'whatsapp' | 'instagram' | 'facebook';
}

interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound';
  sender: 'contact' | 'assistant' | 'human';
  content: string;
  status: string | null;
  created_at: string;
}

type ChannelKey = 'all' | 'whatsapp' | 'instagram' | 'facebook';

const initials = (name: string | null, phone: string) => {
  const src = (name || phone || '').trim();
  if (!src) return '?';
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
};

const timeShort = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
};

const dateLong = (iso: string) =>
  `${timeShort(iso)}, ${new Date(iso).toLocaleDateString('pt-PT')}`;

function ChannelBadge({ channel }: { channel: Conversation['channel'] }) {
  const c = channel || 'whatsapp';
  const map = {
    whatsapp: { label: 'WhatsApp', dot: 'bg-emerald-500', text: 'text-emerald-700' },
    instagram: { label: 'Instagram', dot: 'bg-pink-500', text: 'text-pink-700' },
    facebook: { label: 'Facebook', dot: 'bg-blue-500', text: 'text-blue-700' },
  }[c];
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] ${map.text}`}>
      {map.label}
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${map.dot}`} />
    </span>
  );
}

function ChannelIconDot({ channel }: { channel: Conversation['channel'] }) {
  const c = channel || 'whatsapp';
  const cls = c === 'whatsapp' ? 'bg-emerald-500' : c === 'instagram' ? 'bg-pink-500' : 'bg-blue-500';
  return (
    <span className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full ${cls} border-2 border-[hsl(var(--admin-surface))] flex items-center justify-center`}>
      <MessageCircle className="h-2 w-2 text-white" strokeWidth={3} />
    </span>
  );
}

export default function AdminInbox() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [channel, setChannel] = useState<ChannelKey>('all');
  const [search, setSearch] = useState('');
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [rightTab, setRightTab] = useState<'details' | 'notes' | 'files'>('details');
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadInfo, setLeadInfo] = useState<{ name?: string | null; email?: string | null; phone?: string | null; company?: string | null; service?: string | null; cargo?: string | null } | null>(null);
  const [leadNotes, setLeadNotes] = useState<string>('');
  const [notesDraft, setNotesDraft] = useState<string>('');
  const [notesSaving, setNotesSaving] = useState(false);
  const [allTags, setAllTags] = useState<{ id: string; label: string; color: string | null }[]>([]);
  const [leadTagIds, setLeadTagIds] = useState<Set<string>>(new Set());
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; status: string; channel: string }[]>([]);
  const [campaignPickerOpen, setCampaignPickerOpen] = useState(false);
  const [mailAccount, setMailAccount] = useState<{ id: string; provider: 'gmail' | 'outlook' | 'imap' } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerInitial, setComposerInitial] = useState<ComposerInitial | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState<'idle' | 'uploading' | 'sending' | 'done' | 'error'>('idle');
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) || null,
    [conversations, selectedId],
  );

  async function markSelectedAsRead() {
    if (!selectedId) return;
    setConversations((prev) => prev.map((c) => c.id === selectedId ? { ...c, unread_count: 0 } : c));
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .eq('id', selectedId);
    if (error) toast.error('Erro ao marcar como lida');
    else toast.success('Marcada como lida');
  }

  async function archiveSelected() {
    if (!selectedId) return;
    const id = selectedId;
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setSelectedId((cur) => (cur === id ? null : cur));
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ archived: true } as any)
      .eq('id', id);
    if (error) toast.error('Erro ao arquivar');
    else toast.success('Conversa arquivada');
  }

  async function markManyAsRead() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setConversations((prev) => prev.map((c) => ids.includes(c.id) ? { ...c, unread_count: 0 } : c));
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ unread_count: 0 })
      .in('id', ids);
    if (error) toast.error('Erro ao marcar como lidas');
    else toast.success(`${ids.length} marcadas como lidas`);
    clearSelection();
  }

  async function archiveMany() {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    setConversations((prev) => prev.filter((c) => !ids.includes(c.id)));
    setSelectedId((cur) => (cur && ids.includes(cur) ? null : cur));
    const { error } = await supabase
      .from('whatsapp_conversations')
      .update({ archived: true } as any)
      .in('id', ids);
    if (error) toast.error('Erro ao arquivar');
    else toast.success(`${ids.length} conversas arquivadas`);
    clearSelection();
  }





  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('email_accounts')
        .select('id,provider,status')
        .eq('status', 'active')
        .order('created_at', { ascending: true })
        .limit(1);
      const a = (data as any[])?.[0];
      if (a) setMailAccount({ id: a.id, provider: a.provider });
    })();
  }, []);

  useEffect(() => {

    const load = async () => {
      const { data } = await supabase
        .from('whatsapp_conversations')
        .select('*')
        .or('archived.is.null,archived.eq.false')
        .order('last_message_at', { ascending: false })
        .limit(200);
      const list = ((data as any[]) || []).map((c) => ({ ...c, channel: c.channel || 'whatsapp' })) as Conversation[];
      setConversations(list);
      if (list.length && !selectedId) setSelectedId(list[0].id);
    };
    load();
    const ch = supabase
      .channel('inbox-conv')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_conversations' }, () => load())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'whatsapp_conversations' }, (payload) => {
        const n = payload.new as Conversation & { archived?: boolean };
        const o = payload.old as { id?: string; archived?: boolean } | null;
        setConversations((prev) => {
          if (n.archived) return prev.filter((c) => c.id !== n.id);
          const exists = prev.some((c) => c.id === n.id);
          const next: Conversation = { ...n, channel: n.channel || 'whatsapp' };
          if (!exists) {
            return [next, ...prev].sort((a, b) =>
              new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
            );
          }
          return prev.map((c) => c.id === n.id ? { ...c, ...next } : c);
        });
        if (n.archived) {
          setSelectedId((cur) => (cur === n.id ? null : cur));
          setSelectedIds((prev) => {
            if (!prev.has(n.id)) return prev;
            const next = new Set(prev); next.delete(n.id); return next;
          });
        }
        // Optional: notify when an item is unarchived elsewhere
        if (o?.archived === true && n.archived === false) {
          // no-op: state already reinserted above
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'whatsapp_conversations' }, (payload) => {
        const oldId = (payload.old as { id?: string })?.id;
        if (oldId) setConversations((prev) => prev.filter((c) => c.id !== oldId));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const PAGE_SIZE = 30;
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!selectedId) { setMessages([]); setHasMore(true); return; }
    initialLoadRef.current = true;
    // Reset scroll position immediately so we don't inherit the previous
    // conversation's offset before new messages arrive.
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    restoreRef.current = null;
    const load = async () => {
      const { data } = await supabase
        .from('whatsapp_chat_messages')
        .select('*')
        .eq('conversation_id', selectedId)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);
      const rows = ((data as Message[]) || []).reverse();
      setMessages(rows);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', selectedId);
    };
    load();
    const ch = supabase
      .channel(`inbox-msg-${selectedId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'whatsapp_chat_messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
          // Conversation is open → immediately mark as read so unread counts
          // and badges reflect the current read position without a refresh.
          if (m.direction === 'inbound') {
            setConversations((prev) => prev.map((c) => c.id === selectedId ? { ...c, unread_count: 0 } : c));
            supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', selectedId).then(() => {});
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'whatsapp_chat_messages', filter: `conversation_id=eq.${selectedId}` },
        (payload) => {
          const m = payload.new as Message;
          setMessages((prev) => prev.map((x) => x.id === m.id ? m : x));
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [selectedId]);

  // Captured before older-page fetch so we can restore exact reading position
  // after React commits the prepended messages (works despite skeleton height).
  const restoreRef = useRef<{ prevHeight: number; prevTop: number } | null>(null);

  async function loadOlder() {
    if (!selectedId || loadingMore || !hasMore || messages.length === 0) return;
    const el = scrollRef.current;
    restoreRef.current = {
      prevHeight: el?.scrollHeight || 0,
      prevTop: el?.scrollTop || 0,
    };
    setLoadingMore(true);
    const oldest = messages[0].created_at;
    const { data } = await supabase
      .from('whatsapp_chat_messages')
      .select('*')
      .eq('conversation_id', selectedId)
      .lt('created_at', oldest)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);
    const older = ((data as Message[]) || []).reverse();
    setHasMore((data?.length || 0) === PAGE_SIZE);
    if (older.length) {
      setMessages((prev) => [...older, ...prev]);
    } else {
      restoreRef.current = null;
    }
    setLoadingMore(false);
  }

  // Restore reading position synchronously after prepended messages are painted.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const info = restoreRef.current;
    if (!el || !info) return;
    el.scrollTop = el.scrollHeight - info.prevHeight + info.prevTop;
    restoreRef.current = null;
  }, [messages]);

  // Throttled scroll handler (rAF + 150ms cooldown) to avoid duplicate loadOlder calls.
  const scrollTickRef = useRef(false);
  const lastLoadRef = useRef(0);
  const onMessagesScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (scrollTickRef.current) return;
    scrollTickRef.current = true;
    requestAnimationFrame(() => {
      scrollTickRef.current = false;
      if (target.scrollTop < 60) {
        const now = Date.now();
        if (now - lastLoadRef.current < 150) return;
        lastLoadRef.current = now;
        loadOlder();
      }
    });
  }, [selectedId, loadingMore, hasMore, messages]);


  // Load matching lead (by normalized phone) + notes/tag assignments for the selected conversation
  useEffect(() => {
    if (!selected) {
      setLeadId(null); setLeadInfo(null); setLeadNotes(''); setNotesDraft(''); setLeadTagIds(new Set());
      return;
    }
    const phone = (selected.contact_phone || '').replace(/\D/g, '');
    if (!phone) return;
    const last9 = phone.slice(-9);
    (async () => {
      const { data } = await supabase
        .from('leads')
        .select('id, name, email, phone, company, service, cargo, notes')
        .ilike('phone', `%${last9}`)
        .order('created_at', { ascending: false })
        .limit(1);
      const row = (data as any[])?.[0];
      setLeadId(row?.id || null);
      setLeadInfo(row ? { name: row.name, email: row.email, phone: row.phone, company: row.company, service: row.service, cargo: row.cargo } : null);
      setLeadNotes(row?.notes || '');
      setNotesDraft(row?.notes || '');
      if (row?.id) {
        const { data: ta } = await supabase.from('lead_tag_assignments').select('tag_id').eq('lead_id', row.id);
        setLeadTagIds(new Set(((ta as any[]) || []).map((r) => r.tag_id)));
      } else {
        setLeadTagIds(new Set());
      }
    })();
  }, [selected]);

  // Load available tags + campaigns once
  useEffect(() => {
    (async () => {
      const [{ data: tags }, { data: camps }] = await Promise.all([
        supabase.from('lead_tags').select('id, label, color').order('label'),
        supabase.from('campaigns').select('id, name, status, channel').order('created_at', { ascending: false }).limit(100),
      ]);
      setAllTags(((tags as any[]) || []).map((t) => ({ id: t.id, label: t.label, color: t.color })));
      setCampaigns(((camps as any[]) || []).map((c) => ({ id: c.id, name: c.name, status: c.status, channel: c.channel })));
    })();
  }, []);

  async function toggleTag(tagId: string) {
    if (!leadId) { toast.error('Sem lead associado a este contacto'); return; }
    const has = leadTagIds.has(tagId);
    const next = new Set(leadTagIds);
    has ? next.delete(tagId) : next.add(tagId);
    setLeadTagIds(next);
    if (has) {
      const { error } = await supabase.from('lead_tag_assignments').delete().eq('lead_id', leadId).eq('tag_id', tagId);
      if (error) { toast.error('Erro ao remover tag'); setLeadTagIds(leadTagIds); }
    } else {
      const { error } = await supabase.from('lead_tag_assignments').insert({ lead_id: leadId, tag_id: tagId, assigned_by: 'manual' });
      if (error) { toast.error('Erro ao adicionar tag'); setLeadTagIds(leadTagIds); }
      else toast.success('Tag adicionada');
    }
  }

  async function addToCampaign(campaignId: string, campaignName: string) {
    if (!selected) return;
    const phone = (selected.contact_phone || '').replace(/\D/g, '');
    const { error } = await supabase.from('campaign_recipients').insert({
      campaign_id: campaignId,
      contact_name: leadInfo?.name || selected.contact_name || null,
      contact_email: leadInfo?.email || null,
      contact_phone: phone || null,
      status: 'pending',
    });
    setCampaignPickerOpen(false);
    if (error) toast.error('Erro ao adicionar à campanha', { description: error.message });
    else toast.success(`Adicionado a "${campaignName}"`);
  }


  const notesList = useMemo<Array<{ text: string; at: string }>>(() => {
    const raw = (leadNotes || '').trim();
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter((n: any) => n && typeof n.text === 'string');
    } catch {}
    return [{ text: raw, at: '' }];
  }, [leadNotes]);

  async function addNote() {
    if (!leadId) { toast.error('Sem lead associado a este contacto'); return; }
    const text = notesDraft.trim();
    if (!text) return;
    setNotesSaving(true);
    try {
      const next = [{ text, at: new Date().toISOString() }, ...notesList];
      const serialized = JSON.stringify(next);
      const { error } = await supabase.from('leads').update({ notes: serialized }).eq('id', leadId);
      if (error) throw error;
      setLeadNotes(serialized);
      setNotesDraft('');
      toast.success('Nota adicionada');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao guardar');
    } finally {
      setNotesSaving(false);
    }
  }

  async function deleteNote(idx: number) {
    if (!leadId) return;
    const next = notesList.filter((_, i) => i !== idx);
    const serialized = JSON.stringify(next);
    const { error } = await supabase.from('leads').update({ notes: serialized }).eq('id', leadId);
    if (error) { toast.error('Erro ao remover'); return; }
    setLeadNotes(serialized);
    toast.success('Nota removida');
  }

  // Extract file/link items from messages (URLs are shared as message content)
  const fileItems = useMemo(() => {
    const urlRe = /(https?:\/\/[^\s]+)/gi;
    const items: { id: string; url: string; name: string; at: string; direction: string }[] = [];
    messages.forEach((m) => {
      const matches = m.content?.match(urlRe) || [];
      matches.forEach((u, i) => {
        const clean = u.replace(/[.,;)]+$/, '');
        const name = decodeURIComponent(clean.split('/').pop() || clean).slice(0, 60);
        items.push({ id: `${m.id}-${i}`, url: clean, name, at: m.created_at, direction: m.direction });
      });
    });
    return items.reverse();
  }, [messages]);


  useEffect(() => {
    const el = scrollRef.current;
    if (!el || messages.length === 0) return;
    if (initialLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      initialLoadRef.current = false;
      return;
    }
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (nearBottom) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const counts = useMemo(() => {
    const c = { whatsapp: 0, instagram: 0, facebook: 0 };
    conversations.forEach((v) => {
      const k = (v.channel || 'whatsapp') as keyof typeof c;
      if (!(k in c)) return;
      const n = Number(v.unread_count) || 0;
      if (n > 0) c[k] += n;
    });
    return c;
  }, [conversations]);

  const filtered = conversations.filter((c) => {
    if (channel !== 'all' && (c.channel || 'whatsapp') !== channel) return false;
    if (unreadOnly && (Number(c.unread_count) || 0) === 0) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return (c.contact_phone || '').includes(s) || (c.contact_name || '').toLowerCase().includes(s);
  });

  const totalUnread = conversations.reduce((n, c) => n + (Number(c.unread_count) || 0), 0);

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    const ch = (selected.channel || 'whatsapp');
    if (ch !== 'whatsapp') {
      toast.error(`Envio directo por ${ch} ainda não está disponível — usa a app nativa por agora.`);
      return;
    }
    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-proxy?action=send-messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({
            instance_id: selected.instance_id,
            recipients: [{ name: selected.contact_name || '', phone: selected.contact_phone }],
            message: reply,
            delay_seconds: 1,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'send failed');
      const result = data?.results?.[0];
      const sent = result?.status === 'sent';
      await supabase.from('whatsapp_chat_messages').insert({
        conversation_id: selected.id,
        external_id: result?.external_id || null,
        direction: 'outbound',
        sender: 'human',
        content: reply,
        status: sent ? 'sent' : 'failed',
      });
      await supabase.from('whatsapp_conversations').update({
        handoff_to_human: true,
        last_message_at: new Date().toISOString(),
        last_message_preview: reply.slice(0, 120),
      }).eq('id', selected.id);
      setReply('');
      if (sent) toast.success('Mensagem enviada'); else toast.error('Falha ao enviar');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar');
    } finally {
      setSending(false);
    }
  }

  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) { setReply((r) => r + emoji); return; }
    const start = el.selectionStart ?? reply.length;
    const end = el.selectionEnd ?? reply.length;
    const next = reply.slice(0, start) + emoji + reply.slice(end);
    setReply(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
    });
  }

  async function sendAttachment(file: File) {
    if (!selected) return;
    if ((selected.channel || 'whatsapp') !== 'whatsapp') {
      toast.error('Envio de anexos apenas suportado no WhatsApp.');
      return;
    }
    const mime = file.type || 'application/octet-stream';
    const limitMB = mime.startsWith('image/') ? 5
      : mime.startsWith('video/') ? 16
      : mime.startsWith('audio/') ? 16
      : 100; // documents
    if (file.size > limitMB * 1024 * 1024) {
      toast.error(`Ficheiro excede o limite do WhatsApp (${limitMB}MB para este tipo).`);
      return;
    }
    setUploading(true);
    setUploadPhase('uploading');
    setUploadPct(0);
    setUploadFileName(file.name);
    try {
      const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
      const path = `outbound/${selected.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      // Signed upload URL enables XHR progress events
      const { data: signed, error: signErr } = await supabase.storage
        .from('whatsapp-media').createSignedUploadUrl(path);
      if (signErr || !signed) throw signErr || new Error('Falha ao preparar upload');

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', signed.signedUrl);
        xhr.setRequestHeader('Content-Type', mime);
        xhr.setRequestHeader('x-upsert', 'false');
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) setUploadPct(Math.round((ev.loaded / ev.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300)
          ? resolve()
          : reject(new Error(`Upload falhou (${xhr.status})`));
        xhr.onerror = () => reject(new Error('Erro de rede no upload'));
        xhr.send(file);
      });

      setUploadPct(100);
      setUploadPhase('sending');

      const mediaUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/sign/whatsapp-media/${path}`;
      const caption = reply.trim();
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-proxy?action=send-messages`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
          body: JSON.stringify({
            instance_id: selected.instance_id,
            recipients: [{ name: selected.contact_name || '', phone: selected.contact_phone }],
            message: caption || file.name,
            delay_seconds: 1,
            media_url: mediaUrl,
            media_mime: mime,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'send failed');
      const result = data?.results?.[0];
      const sent = result?.status === 'sent';
      await supabase.from('whatsapp_chat_messages').insert({
        conversation_id: selected.id,
        external_id: result?.external_id || null,
        direction: 'outbound',
        sender: 'human',
        content: caption || `[Anexo] ${file.name}`,
        status: sent ? 'sent' : 'failed',
      });
      await supabase.from('whatsapp_conversations').update({
        handoff_to_human: true,
        last_message_at: new Date().toISOString(),
        last_message_preview: (caption || `📎 ${file.name}`).slice(0, 120),
      }).eq('id', selected.id);
      setReply('');
      if (sent) {
        setUploadPhase('done');
        toast.success('Anexo enviado');
      } else {
        setUploadPhase('error');
        toast.error('Falha ao enviar anexo');
      }
    } catch (e: any) {
      setUploadPhase('error');
      toast.error(e?.message || 'Erro ao enviar anexo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => { setUploadPhase('idle'); setUploadPct(0); setUploadFileName(''); }, 2500);
    }
  }

  const ChannelTab = ({ id, label, count }: { id: ChannelKey; label: string; count?: number }) => {
    const active = channel === id;
    return (
      <button
        onClick={() => setChannel(id)}
        className={`flex items-center gap-2 px-4 h-10 rounded-full text-[13px] font-medium transition-colors ${
          active
            ? 'bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))]'
            : 'text-[hsl(var(--admin-fg-muted))] hover:bg-[hsl(var(--admin-hover))]'
        }`}
      >
        {label}
        {typeof count === 'number' && count > 0 && (
          <span className={`min-w-5 h-5 px-1.5 inline-flex items-center justify-center rounded-full text-[11px] font-semibold ${
            active ? 'bg-[hsl(var(--admin-surface))] text-[hsl(var(--admin-fg))]' : 'bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))]'
          }`}>{count}</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] bg-[hsl(var(--admin-surface))] text-[hsl(var(--admin-fg))] rounded-lg border border-[hsl(var(--admin-border))] overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[hsl(var(--admin-border))] shrink-0">
        <h1 className="text-xl font-semibold mr-2">Inbox</h1>
        <ChannelTab id="all" label="All Messages" />
        <ChannelTab id="whatsapp" label="WhatsApp DM" count={counts.whatsapp} />
        <ChannelTab id="instagram" label="Instagram DM" count={counts.instagram} />
        <ChannelTab id="facebook" label="Facebook DM" count={counts.facebook} />
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-2 h-10 px-4 rounded-full border border-[hsl(var(--admin-border))] text-[13px]">
            <Wallet className="h-4 w-4 text-[hsl(var(--admin-fg-muted))]" />
            <span className="text-[hsl(var(--admin-fg-muted))]">Wallet Balance</span>
            <span className="font-semibold text-emerald-700">€0.00</span>
          </div>
          <button
            onClick={() => setUnreadOnly((v) => !v)}
            title={unreadOnly ? 'Mostrar todas' : 'Só não lidas'}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors ${unreadOnly ? 'bg-primary/15 text-primary' : 'hover:bg-[hsl(var(--admin-hover))]'}`}
          >
            <Filter className="h-4 w-4" />
          </button>
          <button
            onClick={() => toast.info(totalUnread > 0 ? `${totalUnread} mensagem(ns) por ler` : 'Sem mensagens por ler')}
            title="Notificações"
            className="relative h-10 w-10 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center"
          >
            <Bell className="h-4 w-4" />
            {totalUnread > 0 && <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-red-500" />}
          </button>
          <button
            onClick={() => { window.location.href = '/admin/inbox-calendar'; }}
            title="Calendário"
            className="h-10 w-10 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center"
          >
            <CalendarClock className="h-4 w-4" />
          </button>
          <button
            onClick={() => { window.location.href = '/admin/whatsapp'; }}
            title="Definições WhatsApp"
            className="h-10 w-10 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Body: 3 columns */}
      <div className="grid grid-cols-[320px_1fr_320px] flex-1 min-h-0">
        {/* Left: conversation list */}
        <aside className="border-r border-[hsl(var(--admin-border))] flex flex-col min-h-0">
          <div className="p-3 border-b border-[hsl(var(--admin-border))]">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-fg-subtle))]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar contactos…"
                className="w-full h-10 pl-9 pr-3 rounded-full bg-[hsl(var(--admin-hover))] text-sm placeholder:text-[hsl(var(--admin-fg-subtle))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--admin-fg))]/10"
              />
            </div>
          </div>
          {selectedIds.size > 0 && (() => {
            const visibleIds = filtered.map((c) => c.id);
            const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
            const toggleAll = () => setSelectedIds(allSelected ? new Set() : new Set(visibleIds));
            const selectedConvs = conversations.filter((c) => selectedIds.has(c.id));
            const unreadCount = selectedConvs.filter((c) => (c.unread_count || 0) > 0).length;
            const archiveCount = selectedConvs.length;
            return (
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-hover))]/50">
              <label className="flex items-center gap-1.5 cursor-pointer select-none" title={allSelected ? 'Desmarcar todas' : 'Selecionar tudo'}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-[hsl(var(--admin-border))] cursor-pointer"
                />
                <span className="text-xs font-medium">{allSelected ? 'Desmarcar' : 'Todas'}</span>
              </label>
              <span className="text-xs font-medium text-[hsl(var(--admin-fg-muted))]">· {selectedIds.size} selecionada{selectedIds.size === 1 ? '' : 's'}</span>
              <div className="ml-auto flex items-center gap-1">
                <button
                  onClick={markManyAsRead}
                  disabled={unreadCount === 0}
                  title={unreadCount === 0 ? 'Nada por marcar' : `Marcar ${unreadCount} como lida${unreadCount === 1 ? '' : 's'}`}
                  className="h-7 px-2 rounded-md text-[11px] font-medium hover:bg-[hsl(var(--admin-surface))] flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Lidas ({unreadCount})
                </button>
                <button
                  onClick={archiveMany}
                  title={`Arquivar ${archiveCount} conversa${archiveCount === 1 ? '' : 's'}`}
                  className="h-7 px-2 rounded-md text-[11px] font-medium hover:bg-[hsl(var(--admin-surface))] flex items-center gap-1"
                >
                  <Archive className="h-3.5 w-3.5" /> Arquivar ({archiveCount})
                </button>
                <button
                  onClick={clearSelection}
                  title="Cancelar"
                  className="h-7 px-2 rounded-md text-[11px] font-medium hover:bg-[hsl(var(--admin-surface))]"
                >
                  ✕
                </button>
              </div>
            </div>
            );
          })()}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="p-6 text-sm text-[hsl(var(--admin-fg-subtle))] text-center">Sem conversas.</p>
            )}
            {filtered.map((c) => {
              const active = c.id === selectedId;
              const checked = selectedIds.has(c.id);
              const selectionMode = selectedIds.size > 0;
              return (
                <div
                  key={c.id}
                  onClick={() => (selectionMode ? toggleSelect(c.id) : setSelectedId(c.id))}
                  className={`group w-full text-left px-4 py-3 flex gap-3 border-b border-[hsl(var(--admin-border))]/60 transition-colors cursor-pointer ${
                    checked
                      ? 'bg-[hsl(var(--admin-active))] ring-1 ring-inset ring-[hsl(var(--admin-fg))]/20'
                      : active
                      ? 'bg-[hsl(var(--admin-active))]/60'
                      : 'hover:bg-[hsl(var(--admin-hover))]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); toggleSelect(c.id); }}
                    aria-label={checked ? 'Desselecionar conversa' : 'Selecionar conversa'}
                    aria-pressed={checked}
                    className="relative shrink-0 h-11 w-11 rounded-full focus:outline-none focus:ring-2 focus:ring-[hsl(var(--admin-fg))]/30"
                  >
                    <div className={`h-11 w-11 rounded-full font-semibold text-sm flex items-center justify-center transition-colors ${
                      checked
                        ? 'bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))]'
                        : 'bg-[hsl(var(--admin-hover))] text-[hsl(var(--admin-fg))] group-hover:bg-[hsl(var(--admin-active))]'
                    }`}>
                      {checked ? <Check className="h-5 w-5" /> : initials(c.contact_name, c.contact_phone)}
                    </div>
                    {!checked && <ChannelIconDot channel={c.channel} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[13px] font-semibold truncate">{c.contact_name || `+${c.contact_phone}`}</p>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[11px] text-[hsl(var(--admin-fg-subtle))]">{timeShort(c.last_message_at)}</span>
                        {c.unread_count > 0 && (
                          <span className="min-w-5 h-5 px-1.5 rounded-full bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))] text-[10px] font-bold inline-flex items-center justify-center">
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <p className="text-[12px] text-[hsl(var(--admin-fg-muted))] truncate">{c.last_message_preview || '—'}</p>
                      <ChannelBadge channel={c.channel} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Middle: chat */}
        <section className="flex flex-col min-h-0 bg-[hsl(var(--admin-surface))]">
          {selected ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 px-6 h-16 border-b border-[hsl(var(--admin-border))] shrink-0">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full bg-[hsl(var(--admin-hover))] font-semibold text-sm flex items-center justify-center">
                    {initials(selected.contact_name, selected.contact_phone)}
                  </div>
                </div>
                <div>
                  <p className="text-[15px] font-semibold leading-tight">{selected.contact_name || `+${selected.contact_phone}`}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium border border-emerald-200">
                      <MessageCircle className="h-3 w-3" /> WhatsApp
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-[hsl(var(--admin-fg-muted))]">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Online
                    </span>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    onClick={markSelectedAsRead}
                    disabled={!selected || (selected.unread_count ?? 0) === 0}
                    title="Marcar como lida"
                    aria-label="Marcar como lida"
                    className="h-9 px-3 rounded-full text-xs font-medium hover:bg-[hsl(var(--admin-hover))] flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CheckCheck className="h-4 w-4" /> Marcar lida
                  </button>
                  {(() => {
                    const raw = (selected?.contact_phone || '').trim();
                    let d = raw.replace(/[^\d+]/g, '');
                    if (d.startsWith('+')) d = d.slice(1);
                    else if (d.startsWith('00')) d = d.slice(2);
                    else if (/^[0-9]{9}$/.test(d) && /^[29]/.test(d)) d = `351${d}`;
                    const valid = /^[1-9]\d{7,14}$/.test(d);
                    return (
                      <>
                        <a
                          href={valid ? `tel:+${d}` : undefined}
                          aria-disabled={!valid}
                          title={valid ? `Ligar para +${d}` : 'Sem telefone válido'}
                          className={`h-9 w-9 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center ${!valid ? 'opacity-40 pointer-events-none' : ''}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <Popover>
                          <PopoverTrigger asChild>
                            <button
                              title="Mais opções"
                              aria-label="Mais opções"
                              className="h-9 w-9 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent align="end" className="w-56 p-1">
                            <button
                              disabled={!valid}
                              onClick={() => valid && window.open(`https://wa.me/${d}`, '_blank', 'noreferrer')}
                              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[hsl(var(--admin-hover))] disabled:opacity-40 flex items-center gap-2"
                            >
                              <MessageCircle className="h-4 w-4" /> Abrir no WhatsApp
                            </button>
                            <button
                              disabled={!valid}
                              onClick={async () => { if (!valid) return; await navigator.clipboard.writeText(`+${d}`); toast.success('Número copiado'); }}
                              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[hsl(var(--admin-hover))] disabled:opacity-40 flex items-center gap-2"
                            >
                              <Paperclip className="h-4 w-4" /> Copiar número
                            </button>
                            <button
                              onClick={archiveSelected}
                              className="w-full text-left px-3 py-2 rounded-md text-sm hover:bg-[hsl(var(--admin-hover))] flex items-center gap-2"
                            >
                              <Archive className="h-4 w-4" /> Arquivar conversa
                            </button>
                          </PopoverContent>
                        </Popover>
                      </>
                    );
                  })()}
                </div>

              </div>

              {/* Messages */}
              <div
                ref={scrollRef}
                onScroll={onMessagesScroll}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
              >
                {loadingMore && (
                  <div className="space-y-3 pb-2" aria-live="polite" aria-busy="true">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`rounded-2xl px-4 py-3 animate-pulse ${
                            i % 2 === 0 ? 'bg-[hsl(var(--admin-hover))]' : 'bg-[hsl(var(--admin-active))]/70'
                          }`}
                          style={{ width: `${45 + (i * 12) % 25}%` }}
                        >
                          <div className="h-3 rounded bg-[hsl(var(--admin-fg))]/10 mb-2" />
                          <div className="h-3 rounded bg-[hsl(var(--admin-fg))]/10 w-3/4" />
                          <div className="h-2 rounded bg-[hsl(var(--admin-fg))]/10 w-16 mt-2" />
                        </div>
                      </div>
                    ))}
                    <span className="sr-only">A carregar mensagens anteriores…</span>
                  </div>
                )}
                {hasMore && !loadingMore && messages.length > 0 && (
                  <div className="text-center text-[11px] text-[hsl(var(--admin-fg-subtle))] py-2">
                    Faz scroll para cima para ver mais
                  </div>
                )}
                {messages.map((m) => {
                  const inbound = m.direction === 'inbound';
                  return (
                    <div key={m.id} className={`flex ${inbound ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[68%] rounded-2xl px-4 py-3 ${
                        inbound
                          ? 'bg-[hsl(var(--admin-hover))] text-[hsl(var(--admin-fg))]'
                          : 'bg-[hsl(var(--admin-active))] text-[hsl(var(--admin-fg))]'
                      }`}>
                        <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{m.content}</p>
                        <div className={`flex items-center gap-1 mt-1.5 text-[10px] text-[hsl(var(--admin-fg-muted))] ${inbound ? '' : 'justify-end'}`}>
                          <span>{dateLong(m.created_at)}</span>
                          {!inbound && <span className="text-emerald-700">✓✓</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {messages.length === 0 && (
                  <p className="text-center text-sm text-[hsl(var(--admin-fg-subtle))] py-10">Sem mensagens ainda.</p>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-[hsl(var(--admin-border))] p-4 shrink-0">
                <div className="rounded-2xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))] px-4 py-3">
                  <textarea
                    ref={textareaRef}
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    rows={2}
                    placeholder="Escrever mensagem WhatsApp…"
                    className="w-full resize-none bg-transparent text-[14px] placeholder:text-[hsl(var(--admin-fg-subtle))] focus:outline-none"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*,application/pdf,audio/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) sendAttachment(f);
                    }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1 text-[hsl(var(--admin-fg-muted))]">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading || !selected}
                        title="Anexar ficheiro"
                        className="h-8 w-8 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center disabled:opacity-40"
                      >
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            title="Inserir emoji"
                            className="h-8 w-8 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent align="start" side="top" className="w-72 p-2">
                          <div className="grid grid-cols-8 gap-1 max-h-56 overflow-y-auto">
                            {EMOJI_SET.map((e) => (
                              <button
                                key={e}
                                type="button"
                                onClick={() => { insertEmoji(e); }}
                                className="h-8 w-8 rounded hover:bg-[hsl(var(--admin-hover))] text-lg leading-none flex items-center justify-center"
                              >
                                {e}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                      {uploadPhase !== 'idle' && (
                        <div className="flex items-center gap-2 ml-2 min-w-[180px]">
                          <div className="h-1.5 flex-1 rounded-full bg-[hsl(var(--admin-hover))] overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                uploadPhase === 'error' ? 'bg-red-500'
                                : uploadPhase === 'done' ? 'bg-green-500'
                                : 'bg-[hsl(var(--admin-fg))]'
                              }`}
                              style={{ width: `${uploadPhase === 'sending' ? 100 : uploadPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] whitespace-nowrap text-[hsl(var(--admin-fg-muted))]">
                            {uploadPhase === 'uploading' && `A carregar ${uploadPct}%`}
                            {uploadPhase === 'sending' && 'A enviar…'}
                            {uploadPhase === 'done' && '✓ Enviado'}
                            {uploadPhase === 'error' && '✕ Falhou'}
                          </span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={sendReply}
                      disabled={sending || !reply.trim()}
                      className="inline-flex items-center gap-2 h-9 px-4 rounded-full bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))] text-[13px] font-semibold disabled:opacity-40"
                    >
                      <Send className="h-3.5 w-3.5" /> Enviar
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-1.5 mt-3 text-[11px] text-[hsl(var(--admin-fg-muted))]">
                  <MessageCircle className="h-3 w-3 text-emerald-600" />
                  Ligado via WhatsApp
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-[hsl(var(--admin-fg-subtle))]">
              Seleciona uma conversa
            </div>
          )}
        </section>

        {/* Right: contact details */}
        <aside className="border-l border-[hsl(var(--admin-border))] flex flex-col min-h-0 bg-[hsl(var(--admin-surface))]">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <h3 className="text-[15px] font-semibold">Detalhes do Contacto</h3>
            <button className="h-8 w-8 rounded-full hover:bg-[hsl(var(--admin-hover))] flex items-center justify-center"><Pencil className="h-3.5 w-3.5" /></button>
          </div>
          <div className="px-5">
            <div className="flex items-center gap-1 border-b border-[hsl(var(--admin-border))]">
              {(['details', 'notes', 'files'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setRightTab(t)}
                  className={`px-3 py-2 text-[13px] font-medium capitalize border-b-2 -mb-px transition-colors ${
                    rightTab === t
                      ? 'border-[hsl(var(--admin-fg))] text-[hsl(var(--admin-fg))]'
                      : 'border-transparent text-[hsl(var(--admin-fg-subtle))] hover:text-[hsl(var(--admin-fg))]'
                  }`}
                >
                  {t === 'details' ? 'Detalhes' : t === 'notes' ? 'Notas' : 'Ficheiros'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-[13px]">
            {rightTab === 'details' && selected && (() => {
              const rawPhone = (selected.contact_phone || leadInfo?.phone || '').trim();
              // Normaliza: remove espaços, hífens, parênteses. Aceita +DDI; converte 00DDI em DDI; assume PT (351) se nº nacional PT (9 dígitos começando 2/9) sem DDI.
              let digits = rawPhone.replace(/[^\d+]/g, '');
              if (digits.startsWith('+')) digits = digits.slice(1);
              else if (digits.startsWith('00')) digits = digits.slice(2);
              else if (/^[0-9]{9}$/.test(digits) && /^[29]/.test(digits)) digits = `351${digits}`;
              // E.164: 8–15 dígitos, primeiro não pode ser 0
              const isValidWa = /^[1-9]\d{7,14}$/.test(digits);
              const phoneDigits = isValidWa ? digits : '';
              const waHref = phoneDigits ? `https://wa.me/${phoneDigits}` : '';
              const mailHref = leadInfo?.email ? `mailto:${leadInfo.email}` : '';
              const assignedTags = allTags.filter((t) => leadTagIds.has(t.id));
              return (
              <>
                {leadInfo?.name && (
                  <div>
                    <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Nome</p>
                    <p className="mt-1 font-medium">{leadInfo.name}</p>
                  </div>
                )}
                <div>
                  <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Telefone / WhatsApp</p>
                  <p className="mt-1 font-medium">+{selected.contact_phone}</p>
                </div>
                {leadInfo?.email && (
                  <div>
                    <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Email</p>
                    <p className="mt-1 font-medium break-all">{leadInfo.email}</p>
                  </div>
                )}
                {leadInfo?.company && (
                  <div>
                    <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Empresa</p>
                    <p className="mt-1 font-medium">{leadInfo.company}</p>
                  </div>
                )}
                {leadInfo?.cargo && (
                  <div>
                    <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Cargo</p>
                    <p className="mt-1 font-medium">{leadInfo.cargo}</p>
                  </div>
                )}
                {leadInfo?.service && (
                  <div>
                    <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Serviço de interesse</p>
                    <p className="mt-1 font-medium">{leadInfo.service}</p>
                  </div>
                )}
                <div>
                  <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Origem</p>
                  <p className="mt-1 font-medium">WhatsApp</p>
                </div>
                <div>
                  <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Última mensagem</p>
                  <p className="mt-1 font-medium">{dateLong(selected.last_message_at)}</p>
                </div>
                <div>
                  <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Estado</p>
                  <p className="mt-1 font-medium">
                    {selected.handoff_to_human ? 'Handoff humano' : selected.assistant_enabled ? 'IA ativa' : 'IA pausada'}
                  </p>
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href={phoneDigits ? `tel:+${phoneDigits}` : undefined}
                    aria-disabled={!phoneDigits}
                    className={`w-full h-11 rounded-xl bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))] text-[13px] font-semibold inline-flex items-center justify-center gap-2 ${!phoneDigits ? 'opacity-40 pointer-events-none' : ''}`}
                    title={phoneDigits ? `Ligar para +${phoneDigits}` : 'Sem telefone'}
                  >
                    <PhoneCall className="h-4 w-4" /> Ligar
                  </a>
                  <a
                    href={waHref || undefined}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={!waHref}
                    className={`w-full h-11 rounded-xl border border-[hsl(var(--admin-border))] text-[13px] font-semibold inline-flex items-center justify-center gap-2 ${!waHref ? 'opacity-40 pointer-events-none' : ''}`}
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                  <button
                    type="button"
                    disabled={!leadInfo?.email}
                    onClick={() => {
                      if (!leadInfo?.email) return;
                      if (!mailAccount) { toast.error('Liga uma conta de Email em Caixa de Email primeiro.'); return; }
                      setComposerInitial({
                        accountId: mailAccount.id,
                        provider: mailAccount.provider,
                        to: leadInfo.email,
                        subject: '',
                        body: '',
                      });
                      setComposerOpen(true);
                    }}
                    className={`w-full h-11 rounded-xl border border-[hsl(var(--admin-border))] text-[13px] font-semibold inline-flex items-center justify-center gap-2 ${!leadInfo?.email ? 'opacity-40 pointer-events-none' : ''}`}
                    title={leadInfo?.email ? (mailAccount ? `Enviar email para ${leadInfo.email}` : 'Sem conta de email ligada') : 'Sem email registado no lead'}
                  >
                    <Mail className="h-4 w-4" /> {leadInfo?.email ? 'Email' : 'Email (sem endereço)'}
                  </button>

                  <Popover open={campaignPickerOpen} onOpenChange={setCampaignPickerOpen}>
                    <PopoverTrigger asChild>
                      <button className="w-full h-11 rounded-xl border border-[hsl(var(--admin-border))] text-[13px] font-semibold inline-flex items-center justify-center gap-2">
                        <UserPlus className="h-4 w-4" /> Adicionar à Campanha
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-72 p-2 max-h-80 overflow-y-auto">
                      {campaigns.length === 0 ? (
                        <p className="text-[12px] text-[hsl(var(--admin-fg-subtle))] p-2">Sem campanhas cadastradas.</p>
                      ) : campaigns.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => addToCampaign(c.id, c.name)}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[hsl(var(--admin-hover))] flex items-center justify-between gap-2"
                        >
                          <span className="text-[13px] font-medium truncate">{c.name}</span>
                          <span className="text-[10px] uppercase tracking-wide text-[hsl(var(--admin-fg-subtle))] shrink-0">{c.channel} · {c.status}</span>
                        </button>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-[hsl(var(--admin-fg-subtle))] text-[11px] uppercase tracking-wide">Tags</p>
                    <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
                      <PopoverTrigger asChild>
                        <button
                          disabled={!leadId}
                          className="inline-flex items-center gap-1 text-[12px] font-medium hover:text-[hsl(var(--admin-fg))] disabled:opacity-40"
                        >
                          <Plus className="h-3 w-3" /> Adicionar tag
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-64 p-2 max-h-80 overflow-y-auto">
                        {allTags.length === 0 ? (
                          <p className="text-[12px] text-[hsl(var(--admin-fg-subtle))] p-2">Sem tags disponíveis.</p>
                        ) : allTags.map((t) => {
                          const active = leadTagIds.has(t.id);
                          return (
                            <button
                              key={t.id}
                              onClick={() => toggleTag(t.id)}
                              className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[hsl(var(--admin-hover))] flex items-center gap-2"
                            >
                              <span className="h-3 w-3 rounded-full shrink-0" style={{ background: t.color || '#ff4000' }} />
                              <span className="text-[13px] flex-1 truncate">{t.label}</span>
                              {active && <CheckCheck className="h-3.5 w-3.5 text-emerald-600" />}
                            </button>
                          );
                        })}
                      </PopoverContent>
                    </Popover>
                  </div>
                  {assignedTags.length === 0 ? (
                    <p className="text-[12px] text-[hsl(var(--admin-fg-subtle))] mt-2">Sem tags atribuídas</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {assignedTags.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => toggleTag(t.id)}
                          title="Clica para remover"
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-hover))]"
                        >
                          <span className="h-2 w-2 rounded-full" style={{ background: t.color || '#ff4000' }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
              );
            })()}
            {rightTab === 'notes' && (
              <div className="space-y-3">
                {!leadId && (
                  <p className="text-[hsl(var(--admin-fg-subtle))] text-[12px]">
                    Sem lead associado. As notas ficam disponíveis quando o contacto tem um lead criado.
                  </p>
                )}
                <div className="space-y-2">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    disabled={!leadId}
                    rows={3}
                    placeholder="Adicionar nova nota…"
                    className="w-full resize-none rounded-xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))] p-3 text-[13px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-[hsl(var(--admin-fg))]/10 disabled:opacity-50"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-[hsl(var(--admin-fg-subtle))]">
                      {notesDraft.length} caracteres
                    </span>
                    <button
                      onClick={addNote}
                      disabled={!leadId || notesSaving || !notesDraft.trim()}
                      className="h-9 px-4 rounded-full bg-[hsl(var(--admin-fg))] text-[hsl(var(--admin-surface))] text-[12px] font-semibold disabled:opacity-40"
                    >
                      {notesSaving ? 'A guardar…' : 'Adicionar nota'}
                    </button>
                  </div>
                </div>
                {notesList.length > 0 && (
                  <ul className="space-y-2 pt-1">
                    {notesList.map((n, i) => (
                      <li key={i} className="rounded-xl border border-[hsl(var(--admin-border))] bg-[hsl(var(--admin-surface))] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap flex-1">{n.text}</p>
                          <button
                            onClick={() => deleteNote(i)}
                            className="text-[11px] text-[hsl(var(--admin-fg-subtle))] hover:text-red-600"
                            aria-label="Remover nota"
                          >
                            Remover
                          </button>
                        </div>
                        {n.at && (
                          <p className="mt-1 text-[11px] text-[hsl(var(--admin-fg-subtle))]">
                            {new Date(n.at).toLocaleString('pt-PT')}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            {rightTab === 'files' && (
              <div className="space-y-2">
                {fileItems.length === 0 && (
                  <p className="text-[hsl(var(--admin-fg-subtle))] text-[12px]">Sem ficheiros ou links partilhados.</p>
                )}
                {fileItems.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-[hsl(var(--admin-border))] hover:bg-[hsl(var(--admin-hover))] transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-[hsl(var(--admin-hover))] flex items-center justify-center shrink-0">
                      <Paperclip className="h-4 w-4 text-[hsl(var(--admin-fg-muted))]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium truncate">{f.name}</p>
                      <p className="text-[11px] text-[hsl(var(--admin-fg-subtle))]">
                        {f.direction === 'inbound' ? 'Recebido' : 'Enviado'} · {dateLong(f.at)}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )}

          </div>
        </aside>
      </div>
      <MailComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        initial={composerInitial}
        onSent={() => toast.success('Email enviado.')}
      />
    </div>

  );
}
