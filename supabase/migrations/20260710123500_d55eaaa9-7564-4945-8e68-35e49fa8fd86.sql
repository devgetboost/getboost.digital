CREATE TABLE public.whatsapp_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_name text,
  contact_email text,
  contact_phone text NOT NULL,
  service_type text,
  project_description text,
  budget_range text,
  timeline text,
  urgency text,
  status text NOT NULL DEFAULT 'a_recolher',
  proposal_text text,
  missing_fields jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_quotes TO authenticated;
GRANT ALL ON public.whatsapp_quotes TO service_role;

ALTER TABLE public.whatsapp_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e colaboradores podem ver orçamentos"
  ON public.whatsapp_quotes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'collaborator'));

CREATE POLICY "Admins e colaboradores podem gerir orçamentos"
  ON public.whatsapp_quotes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'collaborator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'collaborator'));

CREATE TRIGGER trg_whatsapp_quotes_updated_at
  BEFORE UPDATE ON public.whatsapp_quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_whatsapp_quotes_conversation ON public.whatsapp_quotes(conversation_id);
CREATE INDEX idx_whatsapp_quotes_status ON public.whatsapp_quotes(status);