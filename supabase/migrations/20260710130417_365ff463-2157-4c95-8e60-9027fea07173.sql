CREATE TABLE public.whatsapp_tool_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID,
  contact_phone TEXT,
  lead_id UUID,
  tool_name TEXT NOT NULL,
  input JSONB,
  output JSONB,
  status TEXT NOT NULL DEFAULT 'ok',
  error TEXT,
  duration_ms INTEGER,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wtcl_conversation ON public.whatsapp_tool_call_logs(conversation_id, created_at DESC);
CREATE INDEX idx_wtcl_lead ON public.whatsapp_tool_call_logs(lead_id, created_at DESC);
CREATE INDEX idx_wtcl_tool ON public.whatsapp_tool_call_logs(tool_name, created_at DESC);

GRANT SELECT ON public.whatsapp_tool_call_logs TO authenticated;
GRANT ALL ON public.whatsapp_tool_call_logs TO service_role;

ALTER TABLE public.whatsapp_tool_call_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view tool call logs"
  ON public.whatsapp_tool_call_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));