
-- Fase 2: Monitorização

CREATE TABLE public.agentic_run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL,
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success','error','timeout')),
  model text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  latency_ms integer,
  input_tokens integer,
  output_tokens integer,
  cost_credits numeric,
  error_type text,
  error_message text,
  input_hash text,
  output_preview text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agentic_run_logs_agent_time ON public.agentic_run_logs(agent_id, created_at DESC);
CREATE INDEX idx_agentic_run_logs_status ON public.agentic_run_logs(status) WHERE status <> 'success';
CREATE INDEX idx_agentic_run_logs_run ON public.agentic_run_logs(run_id);

GRANT SELECT ON public.agentic_run_logs TO authenticated;
GRANT ALL ON public.agentic_run_logs TO service_role;
ALTER TABLE public.agentic_run_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view run logs"
  ON public.agentic_run_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert run logs"
  ON public.agentic_run_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.agentic_agent_metrics_hourly (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  hour timestamptz NOT NULL,
  runs integer NOT NULL DEFAULT 0,
  errors integer NOT NULL DEFAULT 0,
  avg_latency_ms numeric,
  p95_latency_ms numeric,
  total_input_tokens bigint DEFAULT 0,
  total_output_tokens bigint DEFAULT 0,
  total_cost_credits numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, hour)
);

CREATE INDEX idx_agentic_metrics_hourly_agent_hour ON public.agentic_agent_metrics_hourly(agent_id, hour DESC);

GRANT SELECT ON public.agentic_agent_metrics_hourly TO authenticated;
GRANT ALL ON public.agentic_agent_metrics_hourly TO service_role;
ALTER TABLE public.agentic_agent_metrics_hourly ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view hourly metrics"
  ON public.agentic_agent_metrics_hourly FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
