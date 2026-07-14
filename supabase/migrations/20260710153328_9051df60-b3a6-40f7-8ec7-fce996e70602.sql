CREATE TABLE public.lead_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  conversation_id uuid,
  contact_phone text,
  external_id text,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender text NOT NULL CHECK (sender IN ('user','assistant','human','system')),
  content text NOT NULL,
  message_type text DEFAULT 'text',
  metadata jsonb DEFAULT '{}'::jsonb,
  sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.lead_conversation_messages TO authenticated;
GRANT ALL ON public.lead_conversation_messages TO service_role;

ALTER TABLE public.lead_conversation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view lead conversation messages"
  ON public.lead_conversation_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role manages lead conversation messages"
  ON public.lead_conversation_messages FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE INDEX idx_lead_conv_msgs_lead_id ON public.lead_conversation_messages(lead_id, sent_at DESC);
CREATE INDEX idx_lead_conv_msgs_conversation_id ON public.lead_conversation_messages(conversation_id, sent_at DESC);
CREATE INDEX idx_lead_conv_msgs_contact_phone ON public.lead_conversation_messages(contact_phone);
CREATE UNIQUE INDEX idx_lead_conv_msgs_external_id ON public.lead_conversation_messages(external_id) WHERE external_id IS NOT NULL;
