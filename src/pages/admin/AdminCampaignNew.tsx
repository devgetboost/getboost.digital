import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft, MessageSquare, Mail, ChevronRight, Send, Save,
  Users, Type, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizeToE164 } from '@/lib/whatsappPhone';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type CsvRow = { name: string; email: string; phone: string };
type CsvInvalid = { line: number; raw: string; reason: string };

type Channel = 'whatsapp' | 'email';

const TIMEZONES = [
  'Europe/Lisbon', 'Europe/Madrid', 'Europe/London', 'Europe/Paris', 'Europe/Berlin',
  'Atlantic/Azores', 'Atlantic/Madeira', 'America/New_York', 'America/Sao_Paulo',
  'America/Los_Angeles', 'Africa/Luanda', 'Africa/Maputo', 'UTC',
];

// Convert a "YYYY-MM-DDTHH:mm" wall-clock in tz into a real UTC Date.
function wallClockInTzToUtc(local: string, tz: string): Date | null {
  if (!local) return null;
  const [d, t] = local.split('T');
  if (!d || !t) return null;
  const [Y, M, D] = d.split('-').map(Number);
  const [h, m] = t.split(':').map(Number);
  // Start from UTC guess, then correct by the tz offset at that instant.
  const guess = Date.UTC(Y, M - 1, D, h, m);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asUtcOfTz = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute), Number(parts.second),
  );
  const offset = asUtcOfTz - guess; // ms tz is ahead of UTC
  return new Date(guess - offset);
}

const steps = [
  { id: 1, label: 'Canal', icon: MessageSquare },
  { id: 2, label: 'Audiência', icon: Users },
  { id: 3, label: 'Mensagem', icon: Type },
  { id: 4, label: 'Agendamento', icon: Clock },
  { id: 5, label: 'Revisão e envio', icon: CheckCircle2 },
];

export default function AdminCampaignNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [testing, setTesting] = useState(false);

  const [name, setName] = useState('');
  const [channel, setChannel] = useState<Channel>('whatsapp');

  // audience
  const [tags, setTags] = useState<{ id: string; label: string; slug: string }[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [csvText, setCsvText] = useState('');
  const [csvInvalid, setCsvInvalid] = useState<CsvInvalid[]>([]);
  const [audienceSize, setAudienceSize] = useState(0);
  const [previewRecipients, setPreviewRecipients] = useState<any[]>([]);
  const [previewIdx, setPreviewIdx] = useState<number>(0);

  // message
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [instances, setInstances] = useState<any[]>([]);
  const [instanceId, setInstanceId] = useState('');
  const [senderEmail, setSenderEmail] = useState('no-reply@getboost.digital');
  const [senderName, setSenderName] = useState('GetBoost');
  const [templates, setTemplates] = useState<any[]>([]);
  const [waTemplates, setWaTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateVars, setTemplateVars] = useState<Record<string, string>>({});
  const [varLeadFields, setVarLeadFields] = useState<Record<string, string>>({});
  const [defaultScheme, setDefaultScheme] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('campaign_default_scheme') || '{}'); } catch { return {}; }
  });
  const [globalFallback, setGlobalFallback] = useState<string>(() => localStorage.getItem('campaign_global_fallback') || '');
  const [showScheme, setShowScheme] = useState(false);

  useEffect(() => { localStorage.setItem('campaign_default_scheme', JSON.stringify(defaultScheme)); }, [defaultScheme]);
  useEffect(() => { localStorage.setItem('campaign_global_fallback', globalFallback); }, [globalFallback]);

  const LEAD_FIELDS = [
    { value: 'name', label: 'Nome' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Telefone' },
    { value: 'company', label: 'Empresa' },
    { value: 'cargo', label: 'Cargo' },
    { value: 'service', label: 'Serviço' },
  ];

  // schedule
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');
  const [scheduleTz, setScheduleTz] = useState<string>(
    Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Lisbon'
  );
  const [delaySeconds, setDelaySeconds] = useState(3);

  useEffect(() => {
    (async () => {
      const [t, w, e, wt] = await Promise.all([
        supabase.from('lead_tags').select('id,label,slug').order('label'),
        supabase.from('whatsapp_instances').select('id,instance_name,status').eq('status', 'online'),
        supabase.from('email_templates').select('*').order('name'),
        supabase.from('whatsapp_templates').select('*').eq('is_active', true).order('name'),
      ]);
      setTags((t.data as any) || []);
      setInstances(w.data || []);
      setTemplates(e.data || []);
      setWaTemplates(wt.data || []);
    })();
  }, []);

  // recompute audience
  useEffect(() => {
    (async () => {
      if (csvText.trim()) {
        const { valid, invalid } = parseCsv(csvText);
        setCsvInvalid(invalid);
        setPreviewRecipients(valid.slice(0, 5));
        setAudienceSize(valid.length);
        return;
      }
      setCsvInvalid([]);
      if (selectedTags.length === 0) {
        setAudienceSize(0); setPreviewRecipients([]); return;
      }
      // fetch leads with any of the selected tags
      const { data: assign } = await supabase
        .from('lead_tag_assignments')
        .select('lead_id')
        .in('tag_id', selectedTags);
      const leadIds = Array.from(new Set((assign || []).map((a: any) => a.lead_id)));
      if (leadIds.length === 0) { setAudienceSize(0); setPreviewRecipients([]); return; }
      const { data: leads } = await supabase
        .from('leads')
        .select('name,email,phone,company')
        .in('id', leadIds);
      const valid = (leads || []).filter((l: any) =>
        channel === 'email' ? !!l.email && EMAIL_RE.test(l.email) : !!l.phone && normalizeToE164(l.phone).valid
      );
      setAudienceSize(valid.length);
      setPreviewRecipients(valid.slice(0, 5));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTags, csvText, channel]);

  function parseCsv(txt: string): { valid: CsvRow[]; invalid: CsvInvalid[] } {
    const lines = txt.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return { valid: [], invalid: [] };
    const header = lines[0].toLowerCase().split(',').map((h) => h.trim());
    const hasHeader = header.some((h) => ['name', 'nome', 'email', 'phone', 'telefone'].includes(h));
    const nameIdx = header.findIndex((h) => h === 'name' || h === 'nome');
    const emailIdx = header.findIndex((h) => h === 'email');
    const phoneIdx = header.findIndex((h) => h === 'phone' || h === 'telefone');
    const dataLines = hasHeader ? lines.slice(1) : lines;
    const offset = hasHeader ? 2 : 1;
    const valid: CsvRow[] = [];
    const invalid: CsvInvalid[] = [];
    dataLines.forEach((l, i) => {
      const cols = l.split(',').map((c) => c.trim());
      const rawName = nameIdx >= 0 ? cols[nameIdx] : cols[0] || '';
      const rawEmail = emailIdx >= 0 ? cols[emailIdx] : (channel === 'email' ? cols[1] || '' : '');
      const rawPhone = phoneIdx >= 0 ? cols[phoneIdx] : (channel === 'whatsapp' ? cols[1] || '' : '');
      const lineNo = i + offset;
      if (channel === 'email') {
        if (!rawEmail) { invalid.push({ line: lineNo, raw: l, reason: 'Email em falta' }); return; }
        if (!EMAIL_RE.test(rawEmail)) { invalid.push({ line: lineNo, raw: l, reason: `Email inválido: ${rawEmail}` }); return; }
        valid.push({ name: rawName, email: rawEmail, phone: rawPhone });
      } else {
        if (!rawPhone) { invalid.push({ line: lineNo, raw: l, reason: 'Telefone em falta' }); return; }
        const norm = normalizeToE164(rawPhone);
        if (!norm.valid || !norm.phone) { invalid.push({ line: lineNo, raw: l, reason: norm.error || 'Telefone inválido' }); return; }
        valid.push({ name: rawName, email: rawEmail, phone: norm.phone });
      }
    });
    return { valid, invalid };
  }

  const canNext = () => {
    if (step === 1) return !!name.trim();
    if (step === 2) return audienceSize > 0;
    if (step === 3) {
      if (channel === 'whatsapp') {
        if (!body.trim() || !instanceId) return false;
      } else {
        if (!subject.trim() || !body.trim() || !senderEmail.trim()) return false;
      }
      return getUnmappedVars().length === 0 && getRecipientMissingFields().length === 0;
    }
    return true;
  };

  const buildRecipientsList = async (): Promise<any[]> => {
    if (csvText.trim()) return parseCsv(csvText).valid;
    const { data: assign } = await supabase
      .from('lead_tag_assignments').select('lead_id').in('tag_id', selectedTags);
    const leadIds = Array.from(new Set((assign || []).map((a: any) => a.lead_id)));
    if (leadIds.length === 0) return [];
    const { data: leads } = await supabase
      .from('leads').select('name,email,phone,company,cargo,service').in('id', leadIds);
    return (leads || []).filter((l: any) => channel === 'email' ? !!l.email : !!l.phone);
  };

  const sendTest = async () => {
    const to = testTo.trim();
    if (!to) { toast.error(channel === 'email' ? 'Indica um email de teste' : 'Indica um telefone de teste'); return; }
    if (channel === 'email' && !subject.trim()) { toast.error('Assunto em falta'); return; }
    if (!body.trim()) { toast.error('Mensagem em falta'); return; }
    if (channel === 'whatsapp' && !instanceId) { toast.error('Escolhe uma instância WhatsApp'); return; }

    const lead: any = (previewIdx >= 0 && previewRecipients[previewIdx]) || {
      name: 'Ana Silva', email: 'ana@exemplo.pt', company: 'Acme Lda',
      phone: '+351911000000', cargo: 'CEO', service: 'Marketing',
    };
    const vars: Record<string, string> = {
      nome: lead.name || '', name: lead.name || '',
      email: lead.email || '', empresa: lead.company || '',
      phone: lead.phone || '', telefone: lead.phone || '',
      ...templateVars,
    };
    for (const [v, field] of Object.entries(varLeadFields)) {
      if (field && lead[field]) vars[v] = String(lead[field]);
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-campaign', {
        body: {
          test_recipient: {
            contact_name: lead.name || 'Teste',
            contact_email: channel === 'email' ? to : (lead.email || ''),
            contact_phone: channel === 'whatsapp' ? to : (lead.phone || ''),
            variables: vars,
          },
          inline_campaign: {
            channel, subject, body,
            instance_id: channel === 'whatsapp' ? instanceId : null,
            delay_seconds: 1,
            audience_filter: { sender_email: senderEmail, sender_name: senderName },
          },
        },
      });
      if (error) throw error;
      if ((data as any)?.sent > 0) toast.success('Teste enviado com sucesso');
      else toast.error('Falhou: ' + ((data as any)?.error || 'sem envio'));
    } catch (e: any) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    } finally {
      setTesting(false);
    }
  };

  const AUTO_VARS = new Set(['nome', 'email', 'empresa', 'name', 'phone', 'telefone']);
  const AUTO_FIELD = (v: string): string => {
    const k = v.toLowerCase();
    if (k === 'nome' || k === 'name') return 'name';
    if (k === 'email') return 'email';
    if (k === 'empresa') return 'company';
    if (k === 'phone' || k === 'telefone') return 'phone';
    return '';
  };
  const getTemplateVars = (): string[] => {
    const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
    const found = new Set<string>();
    const scan = (s: string) => { let m; while ((m = re.exec(s || ''))) found.add(m[1]); };
    scan(body); scan(subject);
    return Array.from(found);
  };
  const getUnmappedVars = (): string[] => {
    return getTemplateVars().filter((v) => {
      if (AUTO_VARS.has(v.toLowerCase())) return false;
      const hasField = !!varLeadFields[v];
      const hasDefault = !!(templateVars[v] && templateVars[v].trim());
      return !hasField && !hasDefault;
    });
  };
  const getRecipientMissingFields = (): { variable: string; field: string }[] => {
    const lead: any = (previewIdx >= 0 && previewRecipients[previewIdx]) || null;
    if (!lead) return [];
    const missing: { variable: string; field: string }[] = [];
    for (const v of getTemplateVars()) {
      const field = varLeadFields[v] || AUTO_FIELD(v);
      if (!field) continue;
      const val = lead[field];
      if (val === undefined || val === null || String(val).trim() === '') {
        const hasDefault = !!(templateVars[v] && templateVars[v].trim());
        if (!hasDefault) missing.push({ variable: v, field });
      }
    }
    return missing;
  };

  const save = async (thenSend: boolean) => {
    if (thenSend) {
      const missing = getUnmappedVars();
      if (missing.length > 0) {
        toast.error(`Variáveis sem mapeamento nem valor por defeito: ${missing.map((v) => `{{${v}}}`).join(', ')}`);
        return;
      }
    }
    setSaving(true);

    try {
      const { data: cReq } = await supabase.auth.getUser();
      const created_by = cReq.user?.id;
      const status = thenSend ? (scheduleMode === 'later' ? 'scheduled' : 'sending') : 'draft';
      const { data: campaign, error } = await supabase.from('campaigns').insert({
        name, channel, status,
        subject: channel === 'email' ? subject : null,
        body,
        instance_id: channel === 'whatsapp' ? instanceId : null,
        delay_seconds: delaySeconds,
        scheduled_at: scheduleMode === 'later' && scheduledAt
          ? (wallClockInTzToUtc(scheduledAt, scheduleTz)?.toISOString() ?? null)
          : null,
        audience_filter: {
          tag_ids: selectedTags,
          csv: !!csvText.trim(),
          sender_email: senderEmail,
          sender_name: senderName,
        },
        total_recipients: audienceSize,
        created_by,
      }).select().single();

      if (error) throw error;

      // insert recipients
      const recipients = await buildRecipientsList();
      if (recipients.length > 0) {
        const rows = recipients.map((r: any) => {
          const vars: Record<string, string> = {
            ...templateVars,
            nome: r.name || '',
            email: r.email || '',
            empresa: r.company || '',
          };
          // Apply per-lead mappings (override static defaults with real lead field values)
          for (const [varName, field] of Object.entries(varLeadFields)) {
            if (!field) continue;
            const val = r[field];
            if (val !== undefined && val !== null && val !== '') vars[varName] = String(val);
          }
          return {
            campaign_id: campaign.id,
            contact_name: r.name || null,
            contact_email: r.email || null,
            contact_phone: r.phone || null,
            variables: vars,
          };
        });
        // insert in chunks
        for (let i = 0; i < rows.length; i += 500) {
          await supabase.from('campaign_recipients').insert(rows.slice(i, i + 500));
        }
      }

      if (thenSend && scheduleMode === 'now') {
        setSending(true);
        const { data: sendRes, error: sendErr } = await supabase.functions.invoke('send-campaign', {
          body: { campaign_id: campaign.id },
        });
        setSending(false);
        if (sendErr) {
          toast.error('Erro no envio: ' + sendErr.message);
        } else {
          toast.success(`Enviados: ${sendRes?.sent || 0}, Falhas: ${sendRes?.failed || 0}`);
        }
      } else {
        toast.success(thenSend ? 'Campanha agendada' : 'Rascunho guardado');
      }
      navigate(`/admin/campanhas/${campaign.id}`);
    } catch (e: any) {
      toast.error(e.message || 'Erro ao guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/campanhas')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold">Nova campanha</h1>
        <Badge variant="outline">Rascunho</Badge>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6">
        {/* Sidebar steps */}
        <div className="space-y-2">
          {steps.map((s) => {
            const active = s.id === step;
            const done = s.id < step;
            return (
              <button
                key={s.id}
                onClick={() => (done || s.id === step) && setStep(s.id)}
                className={`w-full text-left p-4 rounded-lg border transition ${
                  active ? 'bg-green-50 border-green-500' : done ? 'bg-white border-border' : 'bg-muted/30 border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    active ? 'bg-green-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'
                  }`}>{s.id}</div>
                  <div className="font-medium">{s.label}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <Card className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">1. Nome e canal</h2>
              <div>
                <Label>Nome da campanha</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Black Friday 2025" />
              </div>
              <div>
                <Label>Canal</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {(['whatsapp', 'email'] as Channel[]).map((c) => (
                    <button key={c}
                      onClick={() => setChannel(c)}
                      className={`p-4 rounded-lg border-2 flex items-center gap-3 transition ${
                        channel === c ? 'border-[#ff4000] bg-orange-50' : 'border-border hover:border-muted-foreground'
                      }`}>
                      {c === 'whatsapp' ? <MessageSquare className="w-6 h-6 text-green-600" /> : <Mail className="w-6 h-6 text-blue-600" />}
                      <span className="font-medium capitalize">{c}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">2. Audiência</h2>
              <div>
                <Label>Selecionar por tags de leads</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((t) => {
                    const on = selectedTags.includes(t.id);
                    return (
                      <button key={t.id}
                        onClick={() => setSelectedTags(on ? selectedTags.filter((x) => x !== t.id) : [...selectedTags, t.id])}
                        className={`px-3 py-1.5 rounded-full text-sm border ${
                          on ? 'bg-[#ff4000] text-white border-[#ff4000]' : 'bg-white border-border hover:border-[#ff4000]'
                        }`}>{t.label}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1 gap-2 flex-wrap">
                  <Label>Ou importar CSV (name,email,phone)</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="csv-file"
                      type="file"
                      accept=".csv,text/csv,text/plain"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 5 * 1024 * 1024) { toast.error('Ficheiro demasiado grande (máx. 5MB).'); return; }
                        const txt = await f.text();
                        setCsvText(txt);
                        e.target.value = '';
                      }}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById('csv-file')?.click()}>
                      Carregar ficheiro .csv
                    </Button>
                    {csvText && (
                      <Button type="button" size="sm" variant="ghost" onClick={() => setCsvText('')}>Limpar</Button>
                    )}
                  </div>
                </div>
                <Textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={5}
                  placeholder="name,email,phone&#10;João,joao@example.com,+351911111111" />
                <p className="text-xs text-muted-foreground mt-1">
                  Cabeçalho opcional. Validamos {channel === 'email' ? 'o formato do email' : 'o telefone em E.164 (assume +351 se só tiver 9 dígitos)'}.
                  Se colares um CSV, as tags acima são ignoradas.
                </p>
              </div>
              {csvText.trim() && csvInvalid.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    <div className="font-medium mb-1">{csvInvalid.length} linha(s) inválida(s) — serão ignoradas:</div>
                    <ul className="list-disc list-inside text-xs max-h-32 overflow-y-auto space-y-0.5">
                      {csvInvalid.slice(0, 10).map((r) => (
                        <li key={r.line}>Linha {r.line}: {r.reason}</li>
                      ))}
                      {csvInvalid.length > 10 && <li>… e mais {csvInvalid.length - 10}.</li>}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
              <Alert>
                <Users className="w-4 h-4" />
                <AlertDescription>
                  <strong>{audienceSize}</strong> destinatários com {channel === 'email' ? 'email' : 'telefone'} válido.
                  {previewRecipients.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Prévia: {previewRecipients.map((r) => r.name || r.email || r.phone).join(', ')}...
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">3. Mensagem</h2>

              {((channel === 'email' && templates.length > 0) || (channel === 'whatsapp' && waTemplates.length > 0)) && (
                <div>
                  <Label>Usar modelo (opcional)</Label>
                  <Select value={selectedTemplate} onValueChange={(v) => {
                    setSelectedTemplate(v);
                    if (v === '__none__') {
                      setSelectedTemplate('');
                      setTemplateVars({});
                      return;
                    }
                    if (channel === 'email') {
                      const t = templates.find((x) => x.id === v);
                      if (t) {
                        setSubject(t.subject || '');
                        setBody(t.html || '');
                      }
                    } else {
                      const t = waTemplates.find((x) => x.id === v);
                      if (t) setBody(t.content || '');
                    }
                    setTemplateVars({});
                  }}>
                    <SelectTrigger><SelectValue placeholder="Sem modelo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Sem modelo</SelectItem>
                      {(channel === 'email' ? templates : waTemplates).map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {channel === 'whatsapp' && (
                <div>
                  <Label>Instância WhatsApp</Label>
                  <Select value={instanceId} onValueChange={setInstanceId}>
                    <SelectTrigger>
                      <SelectValue placeholder={instances.length === 0 ? 'Nenhuma instância online' : 'Escolher instância'} />
                    </SelectTrigger>
                    <SelectContent>
                      {instances.map((i) => <SelectItem key={i.id} value={i.id}>{i.instance_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {channel === 'email' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Remetente (nome)</Label>
                      <Input value={senderName} onChange={(e) => setSenderName(e.target.value)} />
                    </div>
                    <div>
                      <Label>Remetente (email)</Label>
                      <Input value={senderEmail} onChange={(e) => setSenderEmail(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label>Assunto</Label>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Olá {{nome}}, ..." />
                  </div>
                </>
              )}

              <div>
                <Label>{channel === 'email' ? 'HTML do email' : 'Mensagem'}</Label>
                <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={channel === 'email' ? 10 : 6}
                  placeholder={channel === 'whatsapp'
                    ? 'Olá {{nome}}! Temos uma novidade para ti...'
                    : '<p>Olá {{nome}},</p><p>...</p>'} />
                <p className="text-xs text-muted-foreground mt-1">Auto: <code>{'{{nome}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{empresa}}'}</code> vêm do lead. Outras variáveis podem ter valor por defeito abaixo.</p>
              </div>

              {(() => {
                const unmapped = getUnmappedVars();
                const missingFields = getRecipientMissingFields();
                if (unmapped.length === 0 && missingFields.length === 0) return null;
                return (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription className="space-y-2">
                      {unmapped.length > 0 && (
                        <div>
                          <div className="font-medium">Variáveis sem mapeamento nem valor por defeito:</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {unmapped.map((v) => (
                              <code key={v} className="px-1.5 py-0.5 rounded bg-destructive/20 text-destructive-foreground text-xs">{`{{${v}}}`}</code>
                            ))}
                          </div>
                        </div>
                      )}
                      {missingFields.length > 0 && (
                        <div>
                          <div className="font-medium">Campos em falta no destinatário selecionado:</div>
                          <ul className="list-disc list-inside text-xs mt-1">
                            {missingFields.map((m) => (
                              <li key={m.variable}><code>{`{{${m.variable}}}`}</code> → campo <code>{m.field}</code> está vazio</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="text-xs opacity-90">Corrige antes de avançar no wizard.</div>
                    </AlertDescription>
                  </Alert>
                );
              })()}

              {(() => {
                const auto = new Set(['nome', 'email', 'empresa', 'name', 'phone', 'telefone']);
                const re = /\{\{\s*([\w.-]+)\s*\}\}/g;
                const found = new Set<string>();
                const scan = (s: string) => { let m; while ((m = re.exec(s || ''))) found.add(m[1]); };
                scan(body); scan(subject);
                const extras = Array.from(found).filter((v) => !auto.has(v.toLowerCase()));
                if (extras.length === 0) return null;
                return (
                  <div className="space-y-3 p-3 rounded border bg-muted/20">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <Label>Mapeamento de variáveis</Label>
                        <p className="text-xs text-muted-foreground">
                          Para cada variável, escolhe um campo do lead e/ou um valor por defeito. Podes também aplicar um esquema global de defaults.
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => setShowScheme((s) => !s)}>
                          {showScheme ? 'Fechar esquema' : 'Editar esquema'}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            const next = { ...templateVars };
                            let filled = 0;
                            for (const v of extras) {
                              if (varLeadFields[v]) continue;
                              if (next[v]) continue;
                              const val = defaultScheme[v] ?? defaultScheme[v.toLowerCase()] ?? globalFallback;
                              if (val) { next[v] = val; filled++; }
                            }
                            setTemplateVars(next);
                            toast.success(filled ? `${filled} variável(is) preenchida(s) via esquema` : 'Nada para preencher');
                          }}
                        >
                          Auto-preencher defaults
                        </Button>
                      </div>
                    </div>

                    {showScheme && (
                      <div className="p-3 rounded border bg-background space-y-2">
                        <div>
                          <Label className="text-xs">Fallback global (usado quando não há valor para a variável)</Label>
                          <Input
                            value={globalFallback}
                            onChange={(e) => setGlobalFallback(e.target.value)}
                            placeholder="ex: —"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Esquema por variável (guardado localmente)</Label>
                          <div className="space-y-1 mt-1">
                            {extras.map((v) => (
                              <div key={v} className="grid grid-cols-[140px_1fr] gap-2 items-center">
                                <code className="text-xs">{`{{${v}}}`}</code>
                                <Input
                                  value={defaultScheme[v] || ''}
                                  onChange={(e) => setDefaultScheme({ ...defaultScheme, [v]: e.target.value })}
                                  placeholder="Valor por defeito no esquema"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-[120px_180px_1fr] gap-2 text-xs font-medium text-muted-foreground px-1">
                      <div>Variável</div>
                      <div>Campo do lead</div>
                      <div>Valor por defeito</div>
                    </div>
                    {extras.map((v) => (
                      <div key={v} className="grid grid-cols-[120px_180px_1fr] gap-2 items-center">
                        <code className="text-xs">{`{{${v}}}`}</code>
                        <Select

                          value={varLeadFields[v] || '__none__'}
                          onValueChange={(val) => setVarLeadFields({
                            ...varLeadFields,
                            [v]: val === '__none__' ? '' : val,
                          })}
                        >
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">— nenhum —</SelectItem>
                            {LEAD_FIELDS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={templateVars[v] || ''}
                          onChange={(e) => setTemplateVars({ ...templateVars, [v]: e.target.value })}
                          placeholder="Valor por defeito (opcional)"
                        />
                      </div>
                    ))}
                  </div>
                );
              })()}

              {(() => {
                const selected = previewRecipients[previewIdx];
                const lead: any = selected || {
                  name: 'Ana Silva', email: 'ana@exemplo.pt', company: 'Acme Lda',
                  phone: '+351911000000', cargo: 'CEO', service: 'Marketing',
                };
                const sample: Record<string, string> = {
                  nome: lead.name || '', name: lead.name || '',
                  email: lead.email || '', empresa: lead.company || '',
                  phone: lead.phone || '', telefone: lead.phone || '',
                  ...templateVars,
                };
                // Apply lead-field mappings on top of static defaults
                for (const [v, field] of Object.entries(varLeadFields)) {
                  if (field && lead[field]) sample[v] = String(lead[field]);
                }
                const render = (s: string) =>
                  (s || '').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, k) => sample[k] ?? sample[k.toLowerCase()] ?? `{{${k}}}`);
                const rSubject = render(subject);
                const rBody = render(body);
                return (
                  <div className="space-y-2 p-3 rounded border bg-white">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Label>Pré-visualização com dados de exemplo</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Destinatário:</span>
                        <Select
                          value={previewRecipients.length ? String(previewIdx) : '__sample__'}
                          onValueChange={(v) => setPreviewIdx(v === '__sample__' ? -1 : Number(v))}
                        >
                          <SelectTrigger className="h-8 w-[240px]">
                            <SelectValue placeholder="Escolher destinatário" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__sample__">— dados fictícios —</SelectItem>
                            {previewRecipients.map((r, i) => (
                              <SelectItem key={i} value={String(i)}>
                                {r.name || r.email || r.phone || `Lead ${i + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {channel === 'email' ? (
                      <div className="border rounded overflow-hidden">
                        <div className="px-3 py-2 bg-muted/40 text-sm border-b">
                          <div><strong>De:</strong> {senderName} &lt;{senderEmail}&gt;</div>
                          <div><strong>Assunto:</strong> {rSubject || <em className="text-muted-foreground">(vazio)</em>}</div>
                        </div>
                        <iframe
                          title="Preview email"
                          className="w-full h-72 bg-white"
                          sandbox=""
                          srcDoc={rBody || '<p style="color:#999;font-family:sans-serif">(sem conteúdo)</p>'}
                        />
                      </div>
                    ) : (
                      <div className="max-w-sm bg-[#d9fdd3] text-slate-900 rounded-lg p-3 whitespace-pre-wrap text-sm shadow-sm">
                        {rBody || <em className="text-muted-foreground">(sem mensagem)</em>}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="p-3 rounded border bg-muted/20 space-y-2">
                <Label className="flex items-center gap-2"><Send className="w-4 h-4" /> Enviar teste</Label>
                <p className="text-xs text-muted-foreground">
                  Envia esta mensagem (com as variáveis do 1º destinatário/exemplo) para {channel === 'email' ? 'um email' : 'um número WhatsApp'} de teste, para confirmar a entrega.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={testTo}
                    onChange={(e) => setTestTo(e.target.value)}
                    placeholder={channel === 'email' ? 'teste@exemplo.pt' : '+351911000000'}
                  />
                  <Button onClick={sendTest} disabled={testing} className="gap-2 shrink-0">
                    <Send className="w-4 h-4" /> {testing ? 'A enviar...' : 'Enviar teste'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">4. Agendamento</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['now', 'later'] as const).map((m) => (
                  <button key={m} onClick={() => setScheduleMode(m)}
                    className={`p-4 rounded-lg border-2 text-left ${
                      scheduleMode === m ? 'border-[#ff4000] bg-orange-50' : 'border-border'
                    }`}>
                    <div className="font-medium">{m === 'now' ? 'Enviar agora' : 'Agendar'}</div>
                    <div className="text-xs text-muted-foreground">
                      {m === 'now' ? 'Envio imediato' : 'Escolhe data e hora'}
                    </div>
                  </button>
                ))}
              </div>
              {scheduleMode === 'later' && (
                <div className="space-y-3">
                  <div>
                    <Label>Data e hora</Label>
                    <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                  </div>
                  <div>
                    <Label>Fuso horário</Label>
                    <Select value={scheduleTz} onValueChange={setScheduleTz}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {(() => {
                    const utc = wallClockInTzToUtc(scheduledAt, scheduleTz);
                    if (!utc) return (
                      <Alert><AlertDescription>Escolhe data/hora para ver a simulação.</AlertDescription></Alert>
                    );
                    const fmt = (tz: string) => new Intl.DateTimeFormat('pt-PT', {
                      timeZone: tz, dateStyle: 'full', timeStyle: 'short',
                    }).format(utc);
                    const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const now = Date.now();
                    const diffMin = Math.round((utc.getTime() - now) / 60000);
                    const rel = diffMin < 0
                      ? `⚠️ ${Math.abs(diffMin)} min no passado`
                      : diffMin < 60 ? `daqui a ${diffMin} min`
                      : diffMin < 1440 ? `daqui a ${Math.round(diffMin / 60)} h`
                      : `daqui a ${Math.round(diffMin / 1440)} dias`;
                    return (
                      <Card className="p-3 bg-muted/40 text-sm space-y-1">
                        <div className="font-medium text-foreground">Simulação do envio</div>
                        <div><strong>{scheduleTz}:</strong> {fmt(scheduleTz)}</div>
                        {localTz !== scheduleTz && (
                          <div><strong>O teu fuso ({localTz}):</strong> {fmt(localTz)}</div>
                        )}
                        <div className="text-muted-foreground"><strong>UTC:</strong> {utc.toISOString()}</div>
                        <div className={diffMin < 0 ? 'text-red-600' : 'text-muted-foreground'}>{rel}</div>
                      </Card>
                    );
                  })()}
                </div>
              )}
              {channel === 'whatsapp' && (
                <div>
                  <Label>Delay entre mensagens (segundos)</Label>
                  <Input type="number" min={1} max={60} value={delaySeconds}
                    onChange={(e) => setDelaySeconds(Number(e.target.value))} />
                  <p className="text-xs text-muted-foreground mt-1">Recomendado 3–10s para evitar bloqueios.</p>
                </div>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold">5. Revisão</h2>
              <Card className="p-4 space-y-2 bg-muted/30">
                <div><strong>Nome:</strong> {name}</div>
                <div><strong>Canal:</strong> {channel}</div>
                <div><strong>Audiência:</strong> {audienceSize} destinatários</div>
                {channel === 'email' && <div><strong>Assunto:</strong> {subject}</div>}
                <div><strong>Envio:</strong> {scheduleMode === 'now' ? 'Imediato' : `Agendado para ${scheduledAt || '—'}`}</div>
              </Card>
              {channel === 'email' && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Se ainda não configuraste o Brevo (chave BREVO_API_KEY), o envio de email vai falhar.
                    A Brevo oferece até <strong>300 emails/dia grátis</strong>. Obtém a chave em brevo.com → SMTP & API.
                  </AlertDescription>
                </Alert>
              )}
              {(() => {
                const missing = getUnmappedVars();
                if (missing.length === 0) return null;
                return (
                  <Alert variant="destructive">
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      As seguintes variáveis não têm mapeamento nem valor por defeito e vão aparecer vazias:{' '}
                      <strong>{missing.map((v) => `{{${v}}}`).join(', ')}</strong>. Volta ao passo 3 para corrigir antes de agendar.
                    </AlertDescription>
                  </Alert>
                );
              })()}

            </div>
          )}

          {/* Nav buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>
              Anterior
            </Button>
            <div className="flex gap-2">
              {step === 5 ? (
                <>
                  <Button variant="outline" onClick={() => save(false)} disabled={saving} className="gap-2">
                    <Save className="w-4 h-4" /> Guardar rascunho
                  </Button>
                  <Button onClick={() => save(true)} disabled={saving || sending} className="bg-[#ff4000] hover:bg-[#e63900] text-white gap-2">
                    <Send className="w-4 h-4" />
                    {sending ? 'A enviar...' : scheduleMode === 'now' ? 'Enviar agora' : 'Agendar'}
                  </Button>
                </>
              ) : (
                <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="bg-[#ff4000] hover:bg-[#e63900] text-white gap-2">
                  Seguinte <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
