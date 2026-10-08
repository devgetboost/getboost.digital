
CREATE TABLE public.whatsapp_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  contact_phone text NOT NULL,
  contact_name text,
  category text NOT NULL,
  keyword text,
  lang text NOT NULL DEFAULT 'pt',
  trigger_message text,
  canned_reply text,
  source text NOT NULL DEFAULT 'keyword_detect',
  status text NOT NULL DEFAULT 'pending',
  notes text,
  forwarded_to text,
  forwarded_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_handoffs TO authenticated;
GRANT ALL ON public.whatsapp_handoffs TO service_role;

ALTER TABLE public.whatsapp_handoffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view handoffs"
  ON public.whatsapp_handoffs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert handoffs"
  ON public.whatsapp_handoffs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update handoffs"
  ON public.whatsapp_handoffs FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete handoffs"
  ON public.whatsapp_handoffs FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_wa_handoffs_status ON public.whatsapp_handoffs(status, created_at DESC);
CREATE INDEX idx_wa_handoffs_conv ON public.whatsapp_handoffs(conversation_id);

CREATE TRIGGER update_wa_handoffs_updated_at
  BEFORE UPDATE ON public.whatsapp_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
