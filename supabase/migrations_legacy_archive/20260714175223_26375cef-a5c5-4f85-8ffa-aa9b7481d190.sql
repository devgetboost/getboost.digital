
-- 1) crm_validation_failures: add missing tracking columns
ALTER TABLE public.crm_validation_failures
  ADD COLUMN IF NOT EXISTS referrer text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;

-- 2) podcast_episodes: make slug optional (auto-generated when missing)
ALTER TABLE public.podcast_episodes ALTER COLUMN slug DROP NOT NULL;

-- 3) whatsapp_chat_messages: add external_id
ALTER TABLE public.whatsapp_chat_messages
  ADD COLUMN IF NOT EXISTS external_id text;

-- 4) product_knowledge
CREATE TABLE IF NOT EXISTS public.product_knowledge (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_slug text NOT NULL UNIQUE,
  product_name text NOT NULL,
  pitch text,
  pricing jsonb NOT NULL DEFAULT '{}'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  tone text,
  icp text,
  objections jsonb NOT NULL DEFAULT '[]'::jsonb,
  cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_knowledge TO authenticated;
GRANT ALL ON public.product_knowledge TO service_role;
ALTER TABLE public.product_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_knowledge" ON public.product_knowledge
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER product_knowledge_updated_at BEFORE UPDATE ON public.product_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) product_knowledge_versions
CREATE TABLE IF NOT EXISTS public.product_knowledge_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_knowledge_id uuid NOT NULL REFERENCES public.product_knowledge(id) ON DELETE CASCADE,
  version_number int NOT NULL,
  product_name text,
  pitch text,
  pricing jsonb,
  faq jsonb,
  tone text,
  icp text,
  objections jsonb,
  cases jsonb,
  extra jsonb,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_knowledge_versions TO authenticated;
GRANT ALL ON public.product_knowledge_versions TO service_role;
ALTER TABLE public.product_knowledge_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage product_knowledge_versions" ON public.product_knowledge_versions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6) social_media_author_limits
CREATE TABLE IF NOT EXISTS public.social_media_author_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  rede text NOT NULL,
  max_chars int,
  hashtags_min int,
  hashtags_max int,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rede)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_author_limits TO authenticated;
GRANT ALL ON public.social_media_author_limits TO service_role;
ALTER TABLE public.social_media_author_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own author limits" ON public.social_media_author_limits
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER social_media_author_limits_updated_at BEFORE UPDATE ON public.social_media_author_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
