ALTER TABLE public.agentic_alert_thresholds ADD COLUMN IF NOT EXISTS window_runs integer;
ALTER TABLE public.agentic_alert_log ADD COLUMN IF NOT EXISTS window_runs integer;
ALTER TABLE public.agentic_alert_thresholds ALTER COLUMN window_hours DROP NOT NULL;
ALTER TABLE public.agentic_alert_thresholds ADD CONSTRAINT alert_thresholds_window_chk CHECK (window_hours IS NOT NULL OR window_runs IS NOT NULL);