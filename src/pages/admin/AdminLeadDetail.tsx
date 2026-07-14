import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, MessageSquare, Phone, Send, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analytics, buildWhatsAppUrl } from '@/lib/analytics';



type Lead = Record<string, any>;
type TriggerLog = {
  id: string;
  created_at: string;
  trigger_event: string | null;
  status: string | null;
  template_id: string | null;
  message_sent: string | null;
  error_message: string | null;
};
type EmailEvent = {
  id: string;
  direction: "inbound" | "outbound";
  content: string;
  sent_at: string;
  metadata: Record<string, any> | null;
};

type TagAssignment = {
  id: string;
  assigned_at: string;
  assigned_by: string | null;
  lead_tags: { label: string; slug: string; color: string | null } | null;
};

const Field = ({ label, value }: { label: string; value: any }) => (
  <div className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-0 text-sm">
    <div className="text-muted-foreground">{label}</div>
    <div className="col-span-2 break-words">{value == null || value === '' ? '—' : String(value)}</div>
  </div>
);

const AdminLeadDetail = () => {
  const { id } = useParams();
  const [lead, setLead] = useState<Lead | null>(null);
  const [logs, setLogs] = useState<TriggerLog[]>([]);
  const [emails, setEmails] = useState<EmailEvent[]>([]);
  const [tags, setTags] = useState<TagAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<{ summary: string; bullet_count: number; message_count: number; conversation_id: string } | null>(null);
  const [editedSummary, setEditedSummary] = useState('');
  const [saving, setSaving] = useState(false);

  const editedBullets = editedSummary.split('\n').filter((l) => l.trim().startsWith('-')).length;
  const bulletsOk = editedBullets >= 4 && editedBullets <= 6;

  const runPreview = async () => {
    if (!id) return;
    setPreviewLoading(true);
    setPreviewData(null);
    setEditedSummary('');
    setPreviewOpen(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-assistant-reply', {
        body: { preview_lead_id: id },
      });
      if (error) throw error;
      if ((data as any)?.error) { toast.error((data as any).error); setPreviewOpen(false); return; }
      setPreviewData(data as any);
      setEditedSummary((data as any)?.summary || '');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gerar preview');
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const saveSummary = async () => {
    if (!id || !previewData) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-assistant-reply', {
        body: {
          save_summary_lead_id: id,
          save_summary: editedSummary,
          save_summary_conversation_id: previewData.conversation_id,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) { toast.error((data as any).error); return; }
      toast.success('Resumo gravado em notas ✓');
      setPreviewOpen(false);
      // refresh lead
      const { data: fresh } = await supabase.from('leads').select('*').eq('id', id).maybeSingle();
      if (fresh) setLead(fresh);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao gravar');
    } finally {
      setSaving(false);
    }
  };


  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const [leadRes, logsRes, tagsRes, emailsRes] = await Promise.all([
        supabase.from('leads').select('*').eq('id', id).maybeSingle(),
        supabase
          .from('whatsapp_trigger_logs')
          .select('id, created_at, trigger_event, status, template_id, message_sent, error_message')
          .eq('source_id', id)
          .order('created_at', { ascending: false })
          .limit(50),

        supabase
          .from('lead_tag_assignments')
          .select('id, assigned_at, assigned_by, lead_tags(label, slug, color)')
          .eq('lead_id', id),

        supabase
          .from('lead_conversation_messages')
          .select('id, direction, content, sent_at, metadata')
          .eq('lead_id', id)
          .eq('message_type', 'email')
          .order('sent_at', { ascending: false })
          .limit(100),
      ]);
      if (leadRes.error) toast.error('Erro a carregar lead');
      setLead(leadRes.data);
      setLogs((logsRes.data as TriggerLog[]) || []);
      setTags((tagsRes.data as TagAssignment[]) || []);
      setEmails((emailsRes.data as EmailEvent[]) || []);
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10 flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> A carregar…
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="p-6">
        <Button variant="ghost" asChild><Link to="/admin/leads-analytics"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link></Button>
        <p className="mt-6 text-muted-foreground">Lead não encontrado.</p>
      </div>
    );
  }

  const utms = {
    utm_source: lead.utm_source,
    utm_medium: lead.utm_medium,
    utm_campaign: lead.utm_campaign,
  };
  const formData = {
    service: lead.service,
    budget: lead.budget,
    timeline: lead.timeline,
    company: lead.company,
    website: lead.website,
    cargo: lead.cargo,
    business_area: lead.business_area,
    resource_id: lead.resource_id,
    resource_name: lead.resource_name,
    message: lead.message,
    notes: lead.notes,
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/leads-analytics"><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{lead.name || '—'}</h1>
            <p className="text-xs text-muted-foreground">
              Criado {new Date(lead.created_at).toLocaleString('pt-PT')} · id {lead.id}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{lead.source || '—'}</Badge>
          <Badge variant="outline">{lead.status || 'novo'}</Badge>
          {tags.map((t) => (
            <Badge key={t.id} style={t.lead_tags?.color ? { backgroundColor: t.lead_tags.color, color: '#fff' } : undefined}>
              <Tag className="h-3 w-3 mr-1" />{t.lead_tags?.label || t.lead_tags?.slug}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-2">
        {(() => {
          const digits = String(lead.phone || '').replace(/\D/g, '');
          const invalid = digits.length < 9;
          return (
            <div>
              <Button
                size="sm"
                disabled={invalid}
                aria-disabled={invalid}
                title={invalid ? 'Lead sem telefone válido' : 'Reenviar WhatsApp'}
                onClick={() => {
                  if (invalid) {
                    toast.warning('Este lead não tem telefone válido — não é possível reenviar WhatsApp.');
                    return;
                  }
                  const msg =
                    `Olá ${lead.name?.split(' ')[0] || ''}, sou da Getboost. ` +
                    `Estou a dar seguimento ao teu contacto${lead.service ? ` sobre ${lead.service}` : ''}. Podemos falar?`;
                  const url = buildWhatsAppUrl(digits, msg);
                  analytics.trackWhatsApp('admin_lead_detail', 'resend', { lead_id: lead.id });
                  window.open(url, '_blank', 'noopener,noreferrer');
                  toast.success('WhatsApp aberto');
                }}
              >
                <Send className="h-4 w-4 mr-2" /> Reenviar WhatsApp
              </Button>
              {invalid && (
                <p className="text-xs text-destructive mt-1">
                  {lead.phone
                    ? `Telefone inválido (${lead.phone}). Atualiza o contacto antes de reenviar.`
                    : 'Este lead não tem telefone registado.'}
                </p>
              )}
            </div>
          );
        })()}
        <Button size="sm" variant="outline" onClick={runPreview} disabled={previewLoading}>
          {previewLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Preview Resumo IA
        </Button>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Contacto</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{lead.email || '—'}</div>
            <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{lead.phone || '—'}</div>
            <Field label="Empresa" value={lead.company} />
            <Field label="Cargo" value={lead.cargo} />
            <Field label="Website" value={lead.website} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Origem & UTMs</CardTitle></CardHeader>
          <CardContent>
            <Field label="Template / source" value={lead.source} />
            <Field label="utm_source" value={utms.utm_source} />
            <Field label="utm_medium" value={utms.utm_medium} />
            <Field label="utm_campaign" value={utms.utm_campaign} />
            <Field label="Landing page" value={lead.landing_page} />
            <Field label="Referrer" value={lead.referrer} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-base">Dados do formulário</CardTitle></CardHeader>
          <CardContent>
            {Object.entries(formData).map(([k, v]) => <Field key={k} label={k} value={v} />)}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4" />Histórico WhatsApp / automações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {logs.length === 0 && <p className="text-sm text-muted-foreground">Sem eventos registados.</p>}
            {logs.map((log) => (
              <div key={log.id} className="border rounded-md p-3 text-sm">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{log.trigger_event || '—'}</Badge>
                    {log.template_id && <Badge variant="secondary">template: {log.template_id}</Badge>}
                    <Badge variant={log.status === 'sent' ? 'default' : 'outline'}>{log.status || '—'}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-PT')}</span>
                </div>
                {(log.message_sent || log.error_message) && <p className="mt-2 text-xs text-muted-foreground whitespace-pre-wrap">{log.message_sent || log.error_message}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Mail className="h-4 w-4" />Timeline de Emails</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {emails.length === 0 && <p className="text-sm text-muted-foreground">Sem emails registados.</p>}
            {emails.map((e) => {
              const inbound = e.direction === 'inbound';
              const status = (e.metadata?.status as string) || (inbound ? 'received' : 'sent');
              const threadId = e.metadata?.thread_id as string | undefined;
              const [firstLine, ...rest] = (e.content || '').split('\n');
              return (
                <div key={e.id} className={`border-l-4 rounded-md p-3 text-sm ${inbound ? 'border-l-blue-500 bg-blue-50/40' : 'border-l-emerald-500 bg-emerald-50/40'}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{inbound ? 'Recebido' : 'Enviado'}</Badge>
                      <Badge variant={status === 'unread' ? 'destructive' : status === 'sent' ? 'default' : 'secondary'}>{status}</Badge>
                      {e.metadata?.from && <span className="text-xs text-muted-foreground">de {e.metadata.from}</span>}
                      {e.metadata?.to && <span className="text-xs text-muted-foreground">para {e.metadata.to}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(e.sent_at).toLocaleString('pt-PT')}</span>
                  </div>
                  <p className="mt-2 font-medium">{firstLine || '(sem assunto)'}</p>
                  {rest.length > 0 && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">{rest.join('\n')}</p>}
                  {threadId && (
                    <div className="mt-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/admin/inbox-mail?thread=${encodeURIComponent(threadId)}`}>Abrir thread</Link>
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>



      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4" /> Preview do Resumo (não gravado)</DialogTitle>
            <DialogDescription>
              Confirma a qualidade do resumo IA antes de gravar em notas. Alvo: 4-6 bullets.
            </DialogDescription>
          </DialogHeader>
          {previewLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <Loader2 className="h-4 w-4 animate-spin" /> A gerar resumo…
            </div>
          )}
          {previewData && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant={bulletsOk ? 'default' : 'destructive'}>
                  {editedBullets} bullets {bulletsOk ? '✓' : '(precisa 4-6)'}
                </Badge>
                <Badge variant="outline">{previewData.message_count} msgs</Badge>
                <Badge variant="secondary" className="font-mono text-[10px]">conv {previewData.conversation_id.slice(0, 8)}</Badge>
              </div>
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={10}
                className="w-full border rounded-md p-3 bg-muted/30 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="- bullet 1&#10;- bullet 2&#10;..."
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={runPreview} disabled={previewLoading || saving}>
                  Regenerar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(editedSummary); toast.success('Copiado'); }}>
                  Copiar
                </Button>
                <Button size="sm" onClick={saveSummary} disabled={!bulletsOk || saving || previewLoading}>
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Confirmar e gravar em notas
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Edita se necessário. A gravação substitui o bloco <code>whatsapp-context</code> em <code>notes</code>.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeadDetail;
