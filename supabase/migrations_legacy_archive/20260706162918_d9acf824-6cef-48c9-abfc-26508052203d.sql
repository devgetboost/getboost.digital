
CREATE TABLE public.commercial_audit_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_company TEXT,
  contact_phone TEXT,
  industry TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  score INTEGER,
  verdict TEXT,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_status TEXT NOT NULL DEFAULT 'generated',
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_audit_reports TO authenticated;
GRANT ALL ON public.commercial_audit_reports TO service_role;

ALTER TABLE public.commercial_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage commercial audit reports"
ON public.commercial_audit_reports
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_commercial_audit_reports_created_at ON public.commercial_audit_reports (created_at DESC);
CREATE INDEX idx_commercial_audit_reports_score ON public.commercial_audit_reports (score);
CREATE INDEX idx_commercial_audit_reports_status ON public.commercial_audit_reports (report_status);

CREATE TRIGGER trg_commercial_audit_reports_updated_at
BEFORE UPDATE ON public.commercial_audit_reports
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
