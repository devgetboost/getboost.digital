-- 1. Add alert_type to distinguish per-email vs aggregate spike alerts
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS alert_type text NOT NULL DEFAULT 'individual';
ALTER TABLE public.email_alerts ADD COLUMN IF NOT EXISTS metadata jsonb;

CREATE INDEX IF NOT EXISTS email_alerts_type_unack_idx
  ON public.email_alerts (alert_type, created_at DESC) WHERE acknowledged = false;

-- 2. Health check function: detects spikes in failures/bounces/complaints
CREATE OR REPLACE FUNCTION public.check_email_delivery_health()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  window_start timestamptz := now() - interval '1 hour';
  total_count int;
  failed_count int;
  bounced_count int;
  complained_count int;
  failure_rate numeric;
  should_alert boolean := false;
  alert_reason text;
  alert_severity text := 'warning';
BEGIN
  -- Latest status per message_id in last hour
  WITH latest AS (
    SELECT DISTINCT ON (message_id) status
    FROM public.email_send_log
    WHERE message_id IS NOT NULL AND created_at >= window_start
    ORDER BY message_id, created_at DESC
  )
  SELECT
    count(*),
    count(*) FILTER (WHERE status IN ('failed','dlq')),
    count(*) FILTER (WHERE status = 'bounced'),
    count(*) FILTER (WHERE status = 'complained')
  INTO total_count, failed_count, bounced_count, complained_count
  FROM latest;

  IF total_count = 0 THEN
    RETURN;
  END IF;

  failure_rate := (failed_count::numeric / total_count) * 100;

  -- Rule 1: complaints (spam) are the strongest SPF/DKIM/DMARC signal
  IF complained_count > 1 THEN
    should_alert := true;
    alert_severity := 'critical';
    alert_reason := format('%s queixas de spam na última hora — possível falha SPF/DKIM/DMARC', complained_count);
  -- Rule 2: bounce spike
  ELSIF bounced_count > 3 THEN
    should_alert := true;
    alert_severity := 'critical';
    alert_reason := format('%s bounces na última hora — verificar alinhamento de autenticação', bounced_count);
  -- Rule 3: high failure rate (min 5 emails to avoid noise)
  ELSIF total_count >= 5 AND failure_rate > 20 THEN
    should_alert := true;
    alert_reason := format('Taxa de falhas %s%% (%s de %s emails) na última hora', round(failure_rate,1), failed_count, total_count);
  END IF;

  IF NOT should_alert THEN
    RETURN;
  END IF;

  -- Deduplicate: skip if an unacknowledged spike alert already exists in last hour
  IF EXISTS (
    SELECT 1 FROM public.email_alerts
    WHERE alert_type = 'threshold_spike'
      AND acknowledged = false
      AND created_at >= window_start
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.email_alerts (
    alert_type, status, template_name, recipient_email, error_message, metadata
  ) VALUES (
    'threshold_spike',
    alert_severity,
    'aggregate',
    'system',
    alert_reason,
    jsonb_build_object(
      'total', total_count,
      'failed', failed_count,
      'bounced', bounced_count,
      'complained', complained_count,
      'failure_rate_pct', round(failure_rate,2),
      'window_start', window_start,
      'window_end', now()
    )
  );

  RAISE WARNING 'EMAIL_HEALTH_ALERT severity=% reason=% total=% failed=% bounced=% complained=%',
    alert_severity, alert_reason, total_count, failed_count, bounced_count, complained_count;
END;
$$;

-- 3. Cron every 15 minutes
DO $$ BEGIN
  PERFORM cron.unschedule('email-delivery-health-check');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'email-delivery-health-check',
  '*/15 * * * *',
  $cron$ SELECT public.check_email_delivery_health(); $cron$
);