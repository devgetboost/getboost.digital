
CREATE TABLE IF NOT EXISTS public.crm_handoff_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid,
  handoff_id uuid REFERENCES public.whatsapp_handoffs(id) ON DELETE SET NULL,
  conversation_id uuid,
  contact_phone text,
  contact_name text,
  category text,
  keyword text,
  lang text,
  motivo text,
  last_message_id uuid,
  last_message_text text,
  source text,
  status_code int,
  response_body text,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.crm_handoff_events TO authenticated;
GRANT ALL ON public.crm_handoff_events TO service_role;

ALTER TABLE public.crm_handoff_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view CRM handoff events"
  ON public.crm_handoff_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_crm_handoff_events_conversation ON public.crm_handoff_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_crm_handoff_events_phone ON public.crm_handoff_events(contact_phone);
CREATE INDEX IF NOT EXISTS idx_crm_handoff_events_handoff ON public.crm_handoff_events(handoff_id);
CREATE INDEX IF NOT EXISTS idx_crm_handoff_events_category ON public.crm_handoff_events(category);
CREATE INDEX IF NOT EXISTS idx_crm_handoff_events_created ON public.crm_handoff_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_handoff_events_event_id ON public.crm_handoff_events(event_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_conversation ON public.whatsapp_handoffs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_phone ON public.whatsapp_handoffs(contact_phone);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_category ON public.whatsapp_handoffs(category);
CREATE INDEX IF NOT EXISTS idx_whatsapp_handoffs_status_created ON public.whatsapp_handoffs(status, created_at DESC);
