import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeToE164 } from "@/lib/whatsappPhone";

export interface LeadTag {
  id: string;
  slug: string;
  label: string;
  color: string;
  category: string;
}

export interface LeadTriggerLog {
  id: string;
  template_id: string | null;
  template_name?: string | null;
  trigger_event: string;
  recipient_phone: string;
  message_sent: string;
  status: string;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export interface LeadWhatsAppMessage {
  id: string;
  message: string;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

export function useLeadAutomationHistory(leadId: string | null, phone: string | null) {
  const [tags, setTags] = useState<LeadTag[]>([]);
  const [logs, setLogs] = useState<LeadTriggerLog[]>([]);
  const [messages, setMessages] = useState<LeadWhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!leadId) return;
    setLoading(true);
    const normalized = phone ? normalizeToE164(phone) : { valid: false, phone: null, error: null };

    const searchDigits = normalized.phone
      ? normalized.phone.replace(/\D/g, "")
      : null;

    const tagsRes = await supabase
      .from("lead_tag_assignments")
      .select("tag_id, lead_tags(id, slug, label, color, category)")
      .eq("lead_id", leadId);

    const logsRes = searchDigits
      ? await supabase
          .from("whatsapp_trigger_logs")
          .select("*, whatsapp_templates(name)")
          .ilike("recipient_phone", `%${searchDigits.slice(-9)}%`)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] as any[] };

    const msgsRes = searchDigits
      ? await supabase
          .from("whatsapp_messages")
          .select("id, message, status, sent_at, delivered_at, read_at, created_at")
          .ilike("recipient_phone", `%${searchDigits.slice(-9)}%`)
          .order("created_at", { ascending: false })
          .limit(50)
      : { data: [] as LeadWhatsAppMessage[] };

    setTags(((tagsRes.data || []) as any[]).map(r => r.lead_tags).filter(Boolean));
    setLogs(((logsRes.data || []) as any[]).map(l => ({
      ...l,
      template_name: l.whatsapp_templates?.name ?? null,
    })) as LeadTriggerLog[]);
    setMessages((msgsRes.data || []) as LeadWhatsAppMessage[]);
    setLoading(false);
  }, [leadId, phone]);

  useEffect(() => { void load(); }, [load]);

  return { tags, logs, messages, loading, reload: load };
}
