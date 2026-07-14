
-- social_media_drafts: add missing columns
ALTER TABLE public.social_media_drafts
  ADD COLUMN IF NOT EXISTS brand jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS validation jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS created_by uuid;

-- solucao_routing: change notify_email to text + add missing columns
ALTER TABLE public.solucao_routing ALTER COLUMN notify_email DROP DEFAULT;
ALTER TABLE public.solucao_routing ALTER COLUMN notify_email TYPE text USING notify_email::text;
ALTER TABLE public.solucao_routing
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS cc_emails text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS crm_pipeline text,
  ADD COLUMN IF NOT EXISTS crm_stage text,
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notes text;

-- vip_subscribers
CREATE TABLE IF NOT EXISTS public.vip_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  source text NOT NULL DEFAULT 'website',
  status text NOT NULL DEFAULT 'active',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vip_subscribers TO authenticated;
GRANT ALL ON public.vip_subscribers TO service_role;
ALTER TABLE public.vip_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage vip_subscribers" ON public.vip_subscribers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can subscribe VIP" ON public.vip_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE TRIGGER vip_subscribers_updated_at BEFORE UPDATE ON public.vip_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
