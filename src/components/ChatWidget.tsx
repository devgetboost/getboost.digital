import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, RefreshCw, Maximize2, Minimize2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { analytics, buildWhatsAppUrl } from '@/lib/analytics';
import { WHATSAPP_MESSAGES, WHATSAPP_PHONE } from '@/lib/whatsappMessages';

type Message = {
  id: string;
  role: 'user' | 'assistant' | 'admin';
  content: string;
  created_at: string;
};

type Step = 'closed' | 'bubble' | 'contact-form' | 'channel-choice' | 'chat';

const URL_REGEX = /(https?:\/\/[^\s,)]+)/g;

const renderContent = (text: string) => {
  let clean = text.replace(/\*\*/g, '');
  clean = clean.replace(/\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '$1 $2');
  clean = clean.replace(/\[([^\]]*)\]/g, '$1');
  const parts = clean.split(URL_REGEX);
  return parts.map((part, i) =>
    URL_REGEX.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="font-semibold underline break-all">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const CHAT_SESSION_KEY = 'chat_conversation_id';
const CONTACT_KEY = 'chat_contact_info';

const COUNTRY_CODES = [
  { code: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: '+55', flag: '🇧🇷', name: 'Brasil' },
  { code: '+34', flag: '🇪🇸', name: 'Espanha' },
  { code: '+44', flag: '🇬🇧', name: 'Reino Unido' },
  { code: '+1', flag: '🇺🇸', name: 'EUA' },
  { code: '+33', flag: '🇫🇷', name: 'França' },
  { code: '+49', flag: '🇩🇪', name: 'Alemanha' },
  { code: '+39', flag: '🇮🇹', name: 'Itália' },
];

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const SERVICE_CTA_MAP: Record<string, string> = {
  'gestao-redes-sociais': 'melhorar a presença da sua marca nas redes sociais',
  'desenvolvimento-web': 'criar um website profissional que converte visitantes em clientes',
  'desenvolvimento-software': 'automatizar processos com software à medida',
  'google-business-profile': 'dominar as pesquisas locais no Google',
  'google-meta-ads': 'gerar mais clientes com anúncios no Google e Meta',
  'consultoria-estrategica': 'definir uma estratégia digital clara para o seu negócio',
  'fotografia-drone': 'captar imagens aéreas profissionais para o seu negócio',
  'solucao-personalizada': 'encontrar a solução digital ideal para o seu desafio',
};

const ChatWidget = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const getCtaText = () => {
    const serviceSlug = location.pathname.match(/^\/servicos\/(.+)/)?.[1];
    const custom = serviceSlug ? SERVICE_CTA_MAP[serviceSlug] : null;
    if (custom) return <><strong>{custom}</strong>?</>;
    return <><strong>impulsionar o seu negócio</strong> com marketing digital?</>;
  };
  const [step, setStep] = useState<Step>('closed');
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState('');
  const [assistantName, setAssistantName] = useState('Assistente Virtual');
  const [isActive, setIsActive] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+351');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    supabase.rpc('get_assistant_public').then(({ data }) => {
      const row = Array.isArray(data) ? data[0] : null;
      if (row) {
        setGreeting(row.greeting_message);
        setAssistantName(row.assistant_name);
        setIsActive(row.is_active);
      }
    });
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(CHAT_SESSION_KEY);
    const contact = sessionStorage.getItem(CONTACT_KEY);
    if (stored && contact) {
      setConversationId(stored);
      const parsed = JSON.parse(contact);
      setContactName(parsed.name);
      setContactEmail(parsed.email);
      setContactPhone(parsed.phone);
      setCountryCode(parsed.countryCode);
      supabase.rpc('get_chat_messages_by_id', { _conversation_id: stored })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMessages(data as Message[]);
            setStep('chat');
          }
        });
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Realtime: receive assistant/admin replies pushed from backend (edge fn or Inbox admin)
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`chat-widget-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          const m = payload.new as Message;
          // Ignore user echoes (we already added them locally) and dedupe by id
          if (m.role === 'user') return;
          setMessages((prev) => (prev.some((p) => p.id === m.id) ? prev : [...prev, m]));
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 7 && digits.length <= 15;
  };

  const formatPhoneInput = (value: string): string => {
    // Allow only digits, spaces, and hyphens
    return value.replace(/[^\d\s\-]/g, '');
  };

  const handleContactSubmit = (channel: 'chat' | 'whatsapp') => {
    if (!contactName.trim() || !contactEmail.trim() || !contactPhone.trim()) {
      setFormError('Preencha todos os campos.');
      return;
    }
    if (contactName.trim().length < 2) {
      setFormError('Nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) {
      setFormError('Email inválido.');
      return;
    }
    if (!validatePhone(contactPhone)) {
      setFormError('Número de telefone inválido (mínimo 7 dígitos).');
      return;
    }
    setFormError('');
    const fullPhone = `${countryCode}${contactPhone.trim().replace(/\D/g, '')}`;
    const info = { name: contactName.trim(), email: contactEmail.trim(), phone: contactPhone.trim(), countryCode };
    sessionStorage.setItem(CONTACT_KEY, JSON.stringify(info));

    // Save as lead
    supabase.from('leads').insert({
      name: contactName.trim(),
      email: contactEmail.trim(),
      phone: fullPhone,
      source: channel === 'whatsapp' ? 'chat-whatsapp' : 'chat-widget',
      message: `Contacto via ${channel === 'whatsapp' ? 'WhatsApp' : 'Chat Online'}`,
    }).then(({ error }) => {
      if (error) console.error('Lead save error:', error);
      else analytics.trackForm('chat_widget', `contact_submit_${channel}`, { name: contactName });
    });

    if (channel === 'whatsapp') {
      analytics.trackWhatsApp('chat_widget', 'chatWidget', { name: contactName.trim() });
      window.open(buildWhatsAppUrl(WHATSAPP_PHONE, WHATSAPP_MESSAGES.chatWidget(contactName)), '_blank');
      setStep('closed');
    } else {
      setStep('chat');
    }
  };

  const startConversation = useCallback(async () => {
    const contact = sessionStorage.getItem(CONTACT_KEY);
    const parsed = contact ? JSON.parse(contact) : {};
    const fullPhone = parsed.phone ? `${parsed.countryCode || ''}${parsed.phone.replace(/\D/g, '')}` : null;
    const { data } = await supabase.from('chat_conversations').insert({
      visitor_name: parsed.name || 'Visitante',
      visitor_email: parsed.email || null,
      visitor_phone: fullPhone,
    }).select('id').single();
    if (data) {
      setConversationId(data.id);
      sessionStorage.setItem(CHAT_SESSION_KEY, data.id);
      return data.id;
    }
    return null;
  }, []);

  const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');

    let convId = conversationId;
    if (!convId) {
      convId = await startConversation();
      if (!convId) return;
    }

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: text, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-assistant', {
        body: { conversation_id: convId, message: text, visitor_name: contactName },
      });
      if (error) throw error;

      const paragraphs = (data.reply as string)
        .split(/\n\n+/)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 0);

      setLoading(false);

      for (let i = 0; i < paragraphs.length; i++) {
        if (i > 0) {
          setLoading(true);
          await delay(800 + Math.random() * 1200);
          setLoading(false);
        }
        const msg: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: paragraphs[i],
          created_at: new Date().toISOString(),
        };
        setMessages(prev => [...prev, msg]);
        await delay(150);
      }
    } catch {
      setLoading(false);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Ocorreu um erro. Tenta novamente.',
        created_at: new Date().toISOString(),
      }]);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setConversationId(null);
    sessionStorage.removeItem(CHAT_SESSION_KEY);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleClose = () => {
    setStep('closed');
    setExpanded(false);
  };

  if (!isActive || isAdminRoute) return null;

  return (
    <>
      {/* Floating bubble + button */}
      <AnimatePresence>
        {step === 'closed' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
          >
            <motion.button
              onClick={() => {
                setStep('bubble');
                analytics.trackClick('chat_widget', 'bubble_open');
              }}
              className="bg-background border border-border rounded-full px-5 py-3 shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-foreground"
            >
              Converse connosco
            </motion.button>
            <button
              onClick={() => {
                setStep('bubble');
                analytics.trackClick('chat_widget', 'icon_open');
              }}
              className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-shadow flex items-center justify-center"
              aria-label="Abrir chat"
            >
              <MessageCircle className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bubble popup with greeting messages + CTA */}
      <AnimatePresence>
        {step === 'bubble' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[340px]"
          >
            <div className="space-y-3 relative">
              {/* Close button */}
              <button onClick={handleClose} aria-label="Fechar chat" className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-background border border-border shadow-md flex items-center justify-center hover:bg-muted transition-colors z-10">
                <X className="h-3.5 w-3.5" />
              </button>

              {/* Avatar + first greeting bubble */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center shrink-0 ring-2 ring-primary/20">
                  <MessageCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg">
                  <p className="text-foreground text-sm leading-relaxed">
                    Olá, eu sou o {assistantName}. Tudo bem consigo?
                  </p>
                </div>
              </motion.div>

              {/* Second bubble with CTA */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="ml-[52px]"
              >
                <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg">
                  <p className="text-foreground text-sm leading-relaxed mb-4">
                    Quer {getCtaText()}
                  </p>
                  <button
                    onClick={() => {
                      setStep('contact-form');
                      analytics.trackClick('chat_widget', 'start_button');
                    }}
                    className="inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-full px-6 py-2.5 text-sm font-semibold hover:bg-primary/90 transition-colors shadow-md"
                  >
                    Sim, quero
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact form */}
      <AnimatePresence>
        {step === 'contact-form' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-[360px]"
          >
            <div className="bg-background border border-border rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent px-5 py-4 flex items-center justify-between">
              <h3 className="text-white font-semibold text-sm">Antes de começar...</h3>
              <button onClick={handleClose} className="text-white/80 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

              <div className="p-5 space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Nome *</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    placeholder="O seu nome"
                    maxLength={100}
                    className="w-full bg-muted/50 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    placeholder="seu@email.com"
                    maxLength={255}
                    className="w-full bg-muted/50 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp *</label>
                  <div className="flex gap-2">
                    <select
                      value={countryCode}
                      onChange={e => setCountryCode(e.target.value)}
                      className="bg-muted/50 rounded-lg px-2 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all w-[100px]"
                    >
                      {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={e => setContactPhone(formatPhoneInput(e.target.value))}
                      placeholder="912 345 678"
                      maxLength={15}
                      className="flex-1 bg-muted/50 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                    />
                  </div>
                </div>

                {formError && <p className="text-destructive text-xs">{formError}</p>}

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => handleContactSubmit('whatsapp')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-white rounded-full px-5 py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                    WhatsApp
                  </button>
                  <button
                    onClick={() => handleContactSubmit('chat')}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-full px-5 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Chat Online
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating close button when bubble/form is open */}
      <AnimatePresence>
        {(step === 'bubble' || step === 'contact-form') && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-3"
          >
            <button
              onClick={handleClose}
              className="w-14 h-14 rounded-full bg-foreground text-background shadow-lg flex items-center justify-center"
            >
              <X className="h-6 w-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {step === 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 flex flex-col bg-background border border-border rounded-2xl shadow-2xl overflow-hidden ${
              expanded
                ? 'inset-4 md:inset-10'
                : 'bottom-6 right-6 w-[380px] h-[520px] max-h-[80vh]'
            }`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-accent px-4 py-3 flex items-center gap-3 text-white">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm leading-tight">{assistantName}</p>
                <p className="text-white/70 text-xs">Online · Responde em segundos</p>
              </div>
              <button onClick={handleReset} className="p-1.5 hover:bg-white/10 rounded-full transition-colors" title="Nova conversa">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden md:flex">
                {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
              <button onClick={handleClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
              {messages.length === 0 && greeting && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-background rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%]">
                    <p className="text-sm text-foreground whitespace-pre-wrap">{greeting}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{formatTime(new Date().toISOString())}</p>
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                      <MessageCircle className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 shadow-sm max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-background rounded-tl-sm'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{renderContent(msg.content)}</p>
                    <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="bg-background rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground italic">A escrever</span>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-background">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escreva a sua mensagem..."
                  maxLength={2000}
                  className="flex-1 bg-muted/50 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatWidget;
