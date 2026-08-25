-- Tables that existed on Lovable cloud but were never exported as CREATE migrations.
-- Create them first so the ALTER/IF NOT EXISTS statements below are safe on a fresh project.

CREATE TABLE IF NOT EXISTS public.email_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_labels TO authenticated;
GRANT ALL ON public.email_labels TO service_role;
ALTER TABLE public.email_labels ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.agentic_scenario_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_fn text NOT NULL,
  scenario_id text NOT NULL,
  scenario_label text,
  status text NOT NULL DEFAULT 'pass',
  reason text,
  http_status integer,
  latency_ms integer,
  output_preview text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  batch_id uuid,
  duration_ms integer,
  error text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_scenario_runs TO authenticated;
GRANT ALL ON public.agentic_scenario_runs TO service_role;
ALTER TABLE public.agentic_scenario_runs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.bookings_lead_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  from_status text,
  to_status text,
  action text NOT NULL DEFAULT 'status_changed',
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  source text,
  notes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings_lead_status_audit TO authenticated;
GRANT ALL ON public.bookings_lead_status_audit TO service_role;
ALTER TABLE public.bookings_lead_status_audit ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rede text NOT NULL,
  account_label text NOT NULL,
  handle text,
  external_id text,
  agent_id uuid,
  connector_id text,
  connection_id text,
  status text NOT NULL DEFAULT 'active',
  notes text,
  connection_status text NOT NULL DEFAULT 'unknown',
  connection_checked_at timestamptz,
  last_error text,
  last_error_at timestamptz,
  recent_attempts jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_accounts TO authenticated;
GRANT ALL ON public.social_media_accounts TO service_role;
ALTER TABLE public.social_media_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_media_notification_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  recipients text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  statuses text[] NOT NULL DEFAULT '{approved,rejected,scheduled}'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_notification_settings TO authenticated;
GRANT ALL ON public.social_media_notification_settings TO service_role;
ALTER TABLE public.social_media_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.social_media_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.social_media_accounts(id) ON DELETE SET NULL,
  rede text,
  content text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  published_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  action text,
  notes text,
  output jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_drafts TO authenticated;
GRANT ALL ON public.social_media_drafts TO service_role;
ALTER TABLE public.social_media_drafts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.email_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id text,
  provider_thread_id text,
  in_reply_to_message_id text,
  to_emails text[] NOT NULL DEFAULT '{}',
  cc_emails text[] NOT NULL DEFAULT '{}',
  bcc_emails text[] NOT NULL DEFAULT '{}',
  subject text,
  body_html text,
  body_text text,
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_drafts TO authenticated;
GRANT ALL ON public.email_drafts TO service_role;
ALTER TABLE public.email_drafts ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.email_lead_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  provider_message_id text,
  provider_thread_id text,
  direction text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now(),
  account_id uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_lead_links TO authenticated;
GRANT ALL ON public.email_lead_links TO service_role;
ALTER TABLE public.email_lead_links ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_concierge_alert_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  email_recipients text[] NOT NULL DEFAULT '{}',
  telegram_chat_ids text[] NOT NULL DEFAULT '{}',
  webhook_url text,
  violation_threshold integer NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  recipients text[] NOT NULL DEFAULT '{}',
  slack_webhook_urls text[] NOT NULL DEFAULT '{}',
  valid_pct_min numeric NOT NULL DEFAULT 90,
  violations_spike_pct numeric NOT NULL DEFAULT 30,
  invites_drop_pct numeric NOT NULL DEFAULT 40,
  bookings_drop_pct numeric NOT NULL DEFAULT 40,
  min_samples integer NOT NULL DEFAULT 20,
  cooldown_hours integer NOT NULL DEFAULT 6
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_concierge_alert_settings TO authenticated;
GRANT ALL ON public.whatsapp_concierge_alert_settings TO service_role;
ALTER TABLE public.whatsapp_concierge_alert_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_concierge_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text,
  severity text,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_concierge_alert_log TO authenticated;
GRANT ALL ON public.whatsapp_concierge_alert_log TO service_role;
ALTER TABLE public.whatsapp_concierge_alert_log ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_concierge_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid,
  turn_index integer DEFAULT 0,
  persona_ok boolean,
  single_question_ok boolean,
  pt_pt_ok boolean,
  has_meeting_invite boolean,
  has_booking_link boolean,
  question_count integer,
  overridden boolean NOT NULL DEFAULT false,
  override_reason text,
  violations jsonb NOT NULL DEFAULT '[]'::jsonb,
  reply_preview text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_concierge_checks TO authenticated;
GRANT ALL ON public.whatsapp_concierge_checks TO service_role;
ALTER TABLE public.whatsapp_concierge_checks ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.whatsapp_instance_agent_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id text NOT NULL,
  agent_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instance_agent_map TO authenticated;
GRANT ALL ON public.whatsapp_instance_agent_map TO service_role;
ALTER TABLE public.whatsapp_instance_agent_map ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.admin_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notification_reads TO authenticated;
GRANT ALL ON public.admin_notification_reads TO service_role;
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;

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
