
CREATE TABLE IF NOT EXISTS public.handoff_sla_settings (
  category text PRIMARY KEY,
  sla_minutes int NOT NULL CHECK (sla_minutes > 0),
  queue_priority int NOT NULL DEFAULT 2 CHECK (queue_priority BETWEEN 1 AND 5),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.handoff_sla_settings TO authenticated;
GRANT ALL ON public.handoff_sla_settings TO service_role;

ALTER TABLE public.handoff_sla_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage handoff SLA settings"
  ON public.handoff_sla_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.handoff_sla_settings (category, sla_minutes, queue_priority) VALUES
  ('urgency', 30, 1),
  ('complaint_legal', 30, 1),
  ('human_request', 120, 2)
ON CONFLICT (category) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_handoff_sla()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cfg RECORD;
BEGIN
  SELECT sla_minutes, queue_priority INTO cfg
  FROM public.handoff_sla_settings WHERE category = NEW.category;

  IF NEW.sla_minutes IS NULL OR NEW.sla_minutes = 120 THEN
    NEW.sla_minutes := COALESCE(cfg.sla_minutes,
      CASE NEW.category
        WHEN 'urgency' THEN 30
        WHEN 'complaint_legal' THEN 30
        WHEN 'human_request' THEN 120
        ELSE 120
      END);
  END IF;

  NEW.queue_priority := COALESCE(cfg.queue_priority,
    CASE NEW.category
      WHEN 'urgency' THEN 1
      WHEN 'complaint_legal' THEN 1
      WHEN 'human_request' THEN 2
      ELSE 3
    END);

  IF NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := NEW.created_at + (NEW.sla_minutes || ' minutes')::interval;
  END IF;
  RETURN NEW;
END;
$$;
