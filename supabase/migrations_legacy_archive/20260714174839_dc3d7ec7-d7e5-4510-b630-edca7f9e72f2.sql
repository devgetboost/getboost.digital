-- Finish missing schema pieces reported by the TypeScript build

ALTER VIEW public.blog_comments_public SET (security_invoker = true);

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS gallery text[] NOT NULL DEFAULT '{}';

ALTER TABLE public.podcast_episodes
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS episode_number integer,
  ADD COLUMN IF NOT EXISTS eyebrow text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.email_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  template_name text,
  recipient_email text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_send_log TO authenticated;
GRANT ALL ON public.email_send_log TO service_role;
ALTER TABLE public.email_send_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage email send log" ON public.email_send_log;
CREATE POLICY "Admins manage email send log"
  ON public.email_send_log FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_email_send_log_updated_at ON public.email_send_log;
CREATE TRIGGER update_email_send_log_updated_at
  BEFORE UPDATE ON public.email_send_log
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.email_link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  template_name text,
  recipient_email text,
  url text,
  kind text,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_link_clicks TO authenticated;
GRANT ALL ON public.email_link_clicks TO service_role;
ALTER TABLE public.email_link_clicks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage email link clicks" ON public.email_link_clicks;
CREATE POLICY "Admins manage email link clicks"
  ON public.email_link_clicks FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.email_opens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id text,
  template_name text,
  recipient_email text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_opens TO authenticated;
GRANT ALL ON public.email_opens TO service_role;
ALTER TABLE public.email_opens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage email opens" ON public.email_opens;
CREATE POLICY "Admins manage email opens"
  ON public.email_opens FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.email_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  provider text NOT NULL DEFAULT 'gmail',
  status text NOT NULL DEFAULT 'connected',
  connection_key text,
  display_name text,
  sync_enabled boolean NOT NULL DEFAULT true,
  last_sync_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_accounts TO authenticated;
GRANT ALL ON public.email_accounts TO service_role;
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage email accounts" ON public.email_accounts;
CREATE POLICY "Admins manage email accounts"
  ON public.email_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
DROP TRIGGER IF EXISTS update_email_accounts_updated_at ON public.email_accounts;
CREATE TRIGGER update_email_accounts_updated_at
  BEFORE UPDATE ON public.email_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_email_send_log_template_created ON public.email_send_log(template_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_link_clicks_template_clicked ON public.email_link_clicks(template_name, clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_opens_template_opened ON public.email_opens(template_name, opened_at DESC);
