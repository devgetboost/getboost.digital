CREATE TABLE public.agentic_alert_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  recipients TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  window_hours INTEGER NOT NULL DEFAULT 24 CHECK (window_hours >= 1 AND window_hours <= 720),
  cooldown_hours INTEGER NOT NULL DEFAULT 6 CHECK (cooldown_hours >= 0 AND cooldown_hours <= 168),
  default_error_rate_pct NUMERIC NOT NULL DEFAULT 5,
  default_avg_latency_ms INTEGER NOT NULL DEFAULT 4000,
  default_min_runs INTEGER NOT NULL DEFAULT 5,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

GRANT SELECT, INSERT, UPDATE ON public.agentic_alert_settings TO authenticated;
GRANT ALL ON public.agentic_alert_settings TO service_role;

ALTER TABLE public.agentic_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage alert settings"
  ON public.agentic_alert_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agentic_alert_settings_updated_at
  BEFORE UPDATE ON public.agentic_alert_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.agentic_alert_settings (id) VALUES (1) ON CONFLICT DO NOTHING;