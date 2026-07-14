
CREATE TABLE public.agentic_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('error_rate','latency')),
  window_hours int NOT NULL,
  value numeric NOT NULL,
  threshold numeric NOT NULL,
  runs int NOT NULL DEFAULT 0,
  recipients text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.agentic_alert_log TO authenticated;
GRANT ALL ON public.agentic_alert_log TO service_role;

ALTER TABLE public.agentic_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view alert log"
ON public.agentic_alert_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_agentic_alert_log_agent_kind_created
  ON public.agentic_alert_log (agent_id, kind, created_at DESC);
