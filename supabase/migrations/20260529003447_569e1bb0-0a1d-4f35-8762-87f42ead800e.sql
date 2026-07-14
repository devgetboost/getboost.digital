-- 1. Extend whatsapp_templates with trigger metadata
ALTER TABLE public.whatsapp_templates
  ADD COLUMN IF NOT EXISTS trigger_event text NOT NULL DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS priority integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS trigger_conditions jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS variables text[] NOT NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_trigger
  ON public.whatsapp_templates(trigger_event, is_active, priority);

-- 2. Trigger logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  trigger_event text NOT NULL,
  source_table text,
  source_id uuid,
  recipient_name text NOT NULL DEFAULT '',
  recipient_phone text NOT NULL,
  message_sent text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  external_id text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_trigger_logs TO authenticated;
GRANT ALL ON public.whatsapp_trigger_logs TO service_role;

ALTER TABLE public.whatsapp_trigger_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp trigger logs"
  ON public.whatsapp_trigger_logs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_whatsapp_trigger_logs_created
  ON public.whatsapp_trigger_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_whatsapp_trigger_logs_status
  ON public.whatsapp_trigger_logs(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_trigger_logs_event
  ON public.whatsapp_trigger_logs(trigger_event);
