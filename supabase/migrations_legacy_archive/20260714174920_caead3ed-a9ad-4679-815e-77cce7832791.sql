ALTER TABLE public.email_labels ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text, ADD COLUMN IF NOT EXISTS company text, ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.podcast_episodes ADD COLUMN IF NOT EXISTS cover_url text;

ALTER TABLE public.agentic_scenario_runs
  ADD COLUMN IF NOT EXISTS batch_id uuid,
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS error text;

ALTER TABLE public.commercial_audit_reports
  ADD COLUMN IF NOT EXISTS lead_id uuid,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_company text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS report jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS report_status text NOT NULL DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS verdict text,
  ADD COLUMN IF NOT EXISTS admin_notes text;

ALTER TABLE public.bookings_lead_status_audit
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.crm_validation_failures
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS template text,
  ADD COLUMN IF NOT EXISTS click_id text,
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS issues jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS raw_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS field_name text,
  ADD COLUMN IF NOT EXISTS expected text,
  ADD COLUMN IF NOT EXISTS received text,
  ADD COLUMN IF NOT EXISTS severity text DEFAULT 'warning';

ALTER TABLE public.social_media_notification_settings
  ADD COLUMN IF NOT EXISTS statuses text[] NOT NULL DEFAULT '{approved,rejected,scheduled}';

ALTER TABLE public.social_media_drafts
  ADD COLUMN IF NOT EXISTS action text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS output jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.social_media_drafts_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid REFERENCES public.social_media_drafts(id) ON DELETE CASCADE,
  actor_email text,
  action text NOT NULL,
  from_status text,
  to_status text,
  scheduled_at timestamptz,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_drafts_audit TO authenticated;
GRANT ALL ON public.social_media_drafts_audit TO service_role;
ALTER TABLE public.social_media_drafts_audit ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage social draft audit" ON public.social_media_drafts_audit;
CREATE POLICY "Admins manage social draft audit"
  ON public.social_media_drafts_audit FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
