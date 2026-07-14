
CREATE TABLE IF NOT EXISTS public.email_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  template_name text,
  recipient_email text,
  status text NOT NULL,
  error_message text,
  acknowledged boolean NOT NULL DEFAULT false,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.email_alerts TO authenticated;
GRANT ALL ON public.email_alerts TO service_role;

ALTER TABLE public.email_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view email alerts"
ON public.email_alerts FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update email alerts"
ON public.email_alerts FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete email alerts"
ON public.email_alerts FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS email_alerts_unack_idx
  ON public.email_alerts (created_at DESC) WHERE acknowledged = false;

CREATE INDEX IF NOT EXISTS email_send_log_status_created_idx
  ON public.email_send_log (status, created_at DESC);

CREATE OR REPLACE FUNCTION public.trg_email_send_log_alert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('failed','dlq','bounced','complained') THEN
    INSERT INTO public.email_alerts (message_id, template_name, recipient_email, status, error_message)
    VALUES (NEW.message_id, NEW.template_name, NEW.recipient_email, NEW.status, NEW.error_message);

    RAISE WARNING 'EMAIL_ALERT status=% template=% recipient=% message_id=% error=%',
      NEW.status, NEW.template_name, NEW.recipient_email, NEW.message_id, COALESCE(NEW.error_message,'');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS email_send_log_alert ON public.email_send_log;
CREATE TRIGGER email_send_log_alert
AFTER INSERT ON public.email_send_log
FOR EACH ROW EXECUTE FUNCTION public.trg_email_send_log_alert();
