
CREATE TABLE public.crm_validation_failures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  location TEXT,
  template TEXT,
  click_id TEXT,
  page_url TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  issues JSONB NOT NULL DEFAULT '{}'::jsonb,
  raw_payload JSONB
);

GRANT SELECT, DELETE ON public.crm_validation_failures TO authenticated;
GRANT ALL ON public.crm_validation_failures TO service_role;

ALTER TABLE public.crm_validation_failures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view crm validation failures"
  ON public.crm_validation_failures FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete crm validation failures"
  ON public.crm_validation_failures FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_crm_validation_failures_created ON public.crm_validation_failures (created_at DESC);
