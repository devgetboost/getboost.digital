
CREATE TABLE public.agentic_alert_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_name text NOT NULL,
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  window_hours int NOT NULL DEFAULT 24 CHECK (window_hours > 0 AND window_hours <= 720),
  error_rate_pct numeric NOT NULL DEFAULT 5 CHECK (error_rate_pct >= 0 AND error_rate_pct <= 100),
  avg_latency_ms int NOT NULL DEFAULT 4000 CHECK (avg_latency_ms >= 0),
  min_runs int NOT NULL DEFAULT 5 CHECK (min_runs >= 1),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_alert_thresholds TO authenticated;
GRANT ALL ON public.agentic_alert_thresholds TO service_role;

ALTER TABLE public.agentic_alert_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alert thresholds"
ON public.agentic_alert_thresholds FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_agentic_alert_thresholds_agent
  ON public.agentic_alert_thresholds (agent_id, window_hours) WHERE enabled;

CREATE TRIGGER trg_agentic_alert_thresholds_updated
BEFORE UPDATE ON public.agentic_alert_thresholds
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.agentic_alert_thresholds (profile_name, agent_id, window_hours, error_rate_pct, avg_latency_ms, min_runs)
VALUES ('Default 24h', NULL, 24, 5, 4000, 5);
