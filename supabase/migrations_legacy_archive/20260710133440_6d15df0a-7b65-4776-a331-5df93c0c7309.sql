CREATE TABLE public.whatsapp_quote_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id uuid REFERENCES public.whatsapp_quotes(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  file_url text NOT NULL,
  file_name text,
  mime_type text,
  size_bytes integer,
  kind text NOT NULL DEFAULT 'other',
  caption text,
  external_msg_id text,
  source text NOT NULL DEFAULT 'whatsapp_inbound',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_wa_quote_attachments_quote ON public.whatsapp_quote_attachments(quote_id);
CREATE INDEX idx_wa_quote_attachments_conv ON public.whatsapp_quote_attachments(conversation_id);
CREATE INDEX idx_wa_quote_attachments_lead ON public.whatsapp_quote_attachments(lead_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_quote_attachments TO authenticated;
GRANT ALL ON public.whatsapp_quote_attachments TO service_role;

ALTER TABLE public.whatsapp_quote_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e colaboradores gerem anexos"
  ON public.whatsapp_quote_attachments
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'collaborator'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'collaborator'::app_role));