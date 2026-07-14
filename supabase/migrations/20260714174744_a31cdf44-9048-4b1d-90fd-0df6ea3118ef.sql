-- Consolidated Lovable Cloud baseline for the current frontend schema

-- Roles used by the app
DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'collaborator';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (role = _role OR role = 'admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Public content
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'SEO',
  image text NOT NULL DEFAULT '',
  read_time text NOT NULL DEFAULT '5 min',
  featured boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'draft',
  scheduled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_posts TO authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published blog posts" ON public.blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage blog posts" ON public.blog_posts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.blog_categories TO authenticated;
GRANT ALL ON public.blog_categories TO service_role;
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read blog categories" ON public.blog_categories FOR SELECT USING (true);
CREATE POLICY "Admins manage blog categories" ON public.blog_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON public.blog_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.blog_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id uuid NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.blog_comments(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  author_email text NOT NULL,
  content text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.blog_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_comments TO authenticated;
GRANT ALL ON public.blog_comments TO service_role;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved comments" ON public.blog_comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Public can submit comments" ON public.blog_comments FOR INSERT WITH CHECK (status = 'pending');
CREATE POLICY "Admins manage comments" ON public.blog_comments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_blog_comments_post_id ON public.blog_comments(blog_post_id);
CREATE INDEX idx_blog_comments_status ON public.blog_comments(status);
CREATE TRIGGER update_blog_comments_updated_at BEFORE UPDATE ON public.blog_comments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE VIEW public.blog_comments_public AS
SELECT id, blog_post_id, author_name, content, status, parent_id, created_at
FROM public.blog_comments
WHERE status = 'approved';
GRANT SELECT ON public.blog_comments_public TO anon, authenticated;

CREATE TABLE public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text NOT NULL,
  subtitle text,
  badge_new boolean NOT NULL DEFAULT false,
  badge_label text,
  cta_primary_label text,
  cta_primary_href text,
  cta_secondary_label text,
  cta_secondary_href text,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hero_slides TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.hero_slides TO authenticated;
GRANT ALL ON public.hero_slides TO service_role;
ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active hero slides" ON public.hero_slides FOR SELECT USING (is_active = true);
CREATE POLICY "Admins manage hero slides" ON public.hero_slides FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON public.hero_slides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'web',
  description text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  year text NOT NULL DEFAULT '2024',
  client text NOT NULL DEFAULT '',
  results text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published projects" ON public.projects FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  icon text NOT NULL DEFAULT '✨',
  price text NOT NULL DEFAULT 'Sob consulta',
  headline text NOT NULL DEFAULT '',
  subheadline text NOT NULL DEFAULT '',
  image text NOT NULL DEFAULT '',
  pain_points jsonb NOT NULL DEFAULT '[]'::jsonb,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  process jsonb NOT NULL DEFAULT '[]'::jsonb,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published services" ON public.services FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'guides',
  icon text NOT NULL DEFAULT 'FileText',
  link text NOT NULL DEFAULT '#',
  headline text NOT NULL DEFAULT '',
  subheadline text NOT NULL DEFAULT '',
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_text text NOT NULL DEFAULT 'Download',
  sort_order integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published resources" ON public.resources FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage resources" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_resources_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  description text,
  category text,
  level text,
  duration text,
  lessons integer DEFAULT 0,
  price numeric(10,2),
  price_label text,
  cover_image text,
  tags text[] DEFAULT '{}',
  outcomes text[] DEFAULT '{}',
  external_url text,
  is_featured boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_courses TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.academy_courses TO authenticated;
GRANT ALL ON public.academy_courses TO service_role;
ALTER TABLE public.academy_courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published courses" ON public.academy_courses FOR SELECT USING (is_published = true);
CREATE POLICY "Admins manage courses" ON public.academy_courses FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_academy_courses_updated_at BEFORE UPDATE ON public.academy_courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.podcast_episodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  audio_url text,
  cover_image text,
  duration text,
  guest_name text,
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.podcast_episodes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.podcast_episodes TO authenticated;
GRANT ALL ON public.podcast_episodes TO service_role;
ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read published episodes" ON public.podcast_episodes FOR SELECT USING (status = 'published');
CREATE POLICY "Admins manage podcast episodes" ON public.podcast_episodes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_podcast_episodes_updated_at BEFORE UPDATE ON public.podcast_episodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lead capture and CRM
CREATE TABLE public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'contact',
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company text,
  website text,
  service text,
  budget text,
  timeline text,
  cargo text,
  role text,
  business_area text,
  message text,
  resource_id text,
  resource_name text,
  status text NOT NULL DEFAULT 'new',
  notes text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  landing_page text,
  lead_status text,
  crm_status text,
  crm_sent_at timestamptz,
  crm_error text,
  last_email_subject text,
  last_email_at timestamptz,
  last_automation_at timestamptz,
  automation_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit leads" ON public.leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage leads" ON public.leads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  consent boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.newsletter_subscribers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.newsletter_subscribers TO authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can subscribe" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage newsletter subscribers" ON public.newsletter_subscribers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_newsletter_subscribers_updated_at BEFORE UPDATE ON public.newsletter_subscribers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#ff4000',
  category text NOT NULL DEFAULT 'custom',
  auto_rule jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tags TO authenticated;
GRANT ALL ON public.lead_tags TO service_role;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lead tags" ON public.lead_tags FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_lead_tags_updated_at BEFORE UPDATE ON public.lead_tags FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.lead_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.lead_tags(id) ON DELETE CASCADE,
  assigned_by text,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lead_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_tag_assignments TO authenticated;
GRANT ALL ON public.lead_tag_assignments TO service_role;
ALTER TABLE public.lead_tag_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lead tag assignments" ON public.lead_tag_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_lead_tag_assignments_lead ON public.lead_tag_assignments(lead_id);

CREATE TABLE public.commercial_audit_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  email text,
  phone text,
  company text,
  website text,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer,
  status text NOT NULL DEFAULT 'new',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.commercial_audit_reports TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commercial_audit_reports TO authenticated;
GRANT ALL ON public.commercial_audit_reports TO service_role;
ALTER TABLE public.commercial_audit_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can submit audit reports" ON public.commercial_audit_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage audit reports" ON public.commercial_audit_reports FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_commercial_audit_reports_updated_at BEFORE UPDATE ON public.commercial_audit_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_validation_failures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text,
  source_id uuid,
  field text,
  value text,
  reason text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_validation_failures TO authenticated;
GRANT ALL ON public.crm_validation_failures TO service_role;
ALTER TABLE public.crm_validation_failures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage crm validation failures" ON public.crm_validation_failures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.solucao_routing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  recipients text[] NOT NULL DEFAULT '{}',
  brevo_list_id integer,
  notify_email boolean NOT NULL DEFAULT true,
  add_to_brevo boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solucao_routing TO authenticated;
GRANT ALL ON public.solucao_routing TO service_role;
ALTER TABLE public.solucao_routing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage solucao routing" ON public.solucao_routing FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_solucao_routing_updated_at BEFORE UPDATE ON public.solucao_routing FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Booking
CREATE TABLE public.booking_settings (
  id integer PRIMARY KEY DEFAULT 1,
  available_days integer[] NOT NULL DEFAULT '{1,2,3,4,5}',
  available_times text[] NOT NULL DEFAULT '{09:00,10:00,11:00,14:00,15:00,16:00}',
  buffer_minutes integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT booking_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.booking_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.booking_settings TO authenticated;
GRANT ALL ON public.booking_settings TO service_role;
ALTER TABLE public.booking_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read booking settings" ON public.booking_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage booking settings" ON public.booking_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.booking_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_type text,
  meeting_date date,
  meeting_time text,
  name text,
  email text,
  phone text,
  company text,
  website text,
  challenges text,
  timezone text DEFAULT 'lisbon',
  language text,
  lead_status text,
  status text NOT NULL DEFAULT 'pending',
  meeting_link text,
  jitsi_room text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bookings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can create bookings" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage bookings" ON public.bookings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.booking_reschedule_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  previous_meeting_date date,
  previous_meeting_time text,
  previous_timezone text,
  previous_meeting_link text,
  new_meeting_date date,
  new_meeting_time text,
  new_timezone text,
  new_meeting_link text,
  actor_source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.booking_reschedule_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_reschedule_history TO authenticated;
GRANT ALL ON public.booking_reschedule_history TO service_role;
ALTER TABLE public.booking_reschedule_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can add reschedule history" ON public.booking_reschedule_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage reschedule history" ON public.booking_reschedule_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.bookings_lead_status_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.bookings(id) ON DELETE CASCADE,
  from_status text,
  to_status text,
  action text NOT NULL DEFAULT 'status_changed',
  actor_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings_lead_status_audit TO authenticated;
GRANT ALL ON public.bookings_lead_status_audit TO service_role;
ALTER TABLE public.bookings_lead_status_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage booking status audit" ON public.bookings_lead_status_audit FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Chat assistant
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL DEFAULT 'Visitante',
  visitor_email text,
  visitor_phone text,
  status text NOT NULL DEFAULT 'active',
  channel text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
GRANT SELECT, INSERT ON public.chat_conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_conversations TO authenticated;
GRANT ALL ON public.chat_conversations TO service_role;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can create chat conversations" ON public.chat_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read chat conversations" ON public.chat_conversations FOR SELECT USING (true);
CREATE POLICY "Admins manage chat conversations" ON public.chat_conversations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_chat_conversations_updated ON public.chat_conversations(updated_at DESC);
CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.chat_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert chat messages" ON public.chat_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can read chat messages" ON public.chat_messages FOR SELECT USING (true);
CREATE POLICY "Admins manage chat messages" ON public.chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id, created_at);

CREATE TABLE public.assistant_settings (
  id integer PRIMARY KEY DEFAULT 1,
  assistant_name text NOT NULL DEFAULT 'Assistente Virtual',
  greeting_message text NOT NULL DEFAULT 'Olá! 👋 Como posso ajudar?',
  system_prompt text NOT NULL DEFAULT '',
  knowledge_base text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistant_settings_singleton CHECK (id = 1)
);
GRANT SELECT ON public.assistant_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.assistant_settings TO authenticated;
GRANT ALL ON public.assistant_settings TO service_role;
ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read assistant settings" ON public.assistant_settings FOR SELECT USING (true);
CREATE POLICY "Admins manage assistant settings" ON public.assistant_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.assistant_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_assistant_public()
RETURNS TABLE(assistant_name text, greeting_message text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.assistant_name, s.greeting_message, s.is_active
  FROM public.assistant_settings s
  WHERE s.id = 1
$$;

CREATE OR REPLACE FUNCTION public.get_chat_messages_by_id(_conversation_id uuid)
RETURNS TABLE(id uuid, role text, content text, created_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.role, m.content, m.created_at
  FROM public.chat_messages m
  WHERE m.conversation_id = _conversation_id
  ORDER BY m.created_at ASC
$$;

-- Client portal
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile and admins all" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can update own profile and admins all" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  service_name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'in_progress',
  progress integer DEFAULT 0,
  start_date date,
  end_date date,
  next_step text DEFAULT '',
  admin_notes text DEFAULT '',
  visible_notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_services TO authenticated;
GRANT ALL ON public.client_services TO service_role;
ALTER TABLE public.client_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own services and admins all" ON public.client_services FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage client services" ON public.client_services FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_client_services_updated_at BEFORE UPDATE ON public.client_services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  renewal_date date,
  status text NOT NULL DEFAULT 'active',
  payment_method text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_subscriptions TO authenticated;
GRANT ALL ON public.client_subscriptions TO service_role;
ALTER TABLE public.client_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own subscriptions and admins all" ON public.client_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage subscriptions" ON public.client_subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_client_subscriptions_updated_at BEFORE UPDATE ON public.client_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.client_subscriptions(id) ON DELETE SET NULL,
  invoice_number text NOT NULL,
  description text DEFAULT '',
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  paid_date date,
  pdf_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_invoices TO authenticated;
GRANT ALL ON public.client_invoices TO service_role;
ALTER TABLE public.client_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own invoices and admins all" ON public.client_invoices FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage invoices" ON public.client_invoices FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_client_invoices_updated_at BEFORE UPDATE ON public.client_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'open',
  priority text NOT NULL DEFAULT 'medium',
  category text DEFAULT 'general',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own tickets and admins all" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients create own tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'client',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ticket_messages TO authenticated;
GRANT ALL ON public.ticket_messages TO service_role;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ticket participants can view messages" ON public.ticket_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin') OR EXISTS (SELECT 1 FROM public.support_tickets st WHERE st.id = ticket_id AND st.user_id = auth.uid()));
CREATE POLICY "Ticket participants can add messages" ON public.ticket_messages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') OR sender_id = auth.uid());
CREATE POLICY "Admins manage ticket messages" ON public.ticket_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.client_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text DEFAULT '',
  type text NOT NULL DEFAULT 'info',
  is_read boolean NOT NULL DEFAULT false,
  link text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notifications TO authenticated;
GRANT ALL ON public.client_notifications TO service_role;
ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clients view own notifications and admins all" ON public.client_notifications FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Clients update own notifications and admins all" ON public.client_notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage notifications" ON public.client_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Campaigns and email admin
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL,
  html text NOT NULL,
  preview_text text,
  variables text[] NOT NULL DEFAULT '{}',
  category text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email templates" ON public.email_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL DEFAULT 'email',
  status text NOT NULL DEFAULT 'draft',
  subject text,
  body text,
  template_id uuid REFERENCES public.email_templates(id) ON DELETE SET NULL,
  instance_id text,
  audience_filter jsonb NOT NULL DEFAULT '{}'::jsonb,
  scheduled_at timestamptz,
  sent_at timestamptz,
  total_recipients integer NOT NULL DEFAULT 0,
  delay_seconds integer NOT NULL DEFAULT 3,
  stats jsonb NOT NULL DEFAULT '{"sent":0,"delivered":0,"opened":0,"clicked":0,"failed":0}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  contact_name text,
  contact_email text,
  contact_phone text,
  status text NOT NULL DEFAULT 'pending',
  error text,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  variables jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaign_recipients TO authenticated;
GRANT ALL ON public.campaign_recipients TO service_role;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage campaign recipients" ON public.campaign_recipients FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_campaign_recipients_updated_at BEFORE UPDATE ON public.campaign_recipients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_labels TO authenticated;
GRANT ALL ON public.email_labels TO service_role;
ALTER TABLE public.email_labels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email labels" ON public.email_labels FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_email_labels_updated_at BEFORE UPDATE ON public.email_labels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_drafts (
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
CREATE POLICY "Admins manage email drafts" ON public.email_drafts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_email_drafts_updated_at BEFORE UPDATE ON public.email_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.email_lead_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  provider_message_id text,
  provider_thread_id text,
  direction text,
  subject text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_lead_links TO authenticated;
GRANT ALL ON public.email_lead_links TO service_role;
ALTER TABLE public.email_lead_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage email lead links" ON public.email_lead_links FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.lead_conversation_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  direction text NOT NULL DEFAULT 'outbound',
  message_type text NOT NULL DEFAULT 'email',
  content text NOT NULL DEFAULT '',
  sent_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lead_conversation_messages TO authenticated;
GRANT ALL ON public.lead_conversation_messages TO service_role;
ALTER TABLE public.lead_conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage lead conversation messages" ON public.lead_conversation_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Agentic AI
CREATE TABLE public.agentic_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  function_slug text,
  model text,
  system_prompt text,
  status text NOT NULL DEFAULT 'draft',
  temperature numeric,
  max_tokens integer,
  fast_mode boolean,
  active_version_id uuid,
  canary_version_id uuid,
  canary_percent integer NOT NULL DEFAULT 0,
  canary_started_at timestamptz,
  canary_halted_at timestamptz,
  canary_halted_reason text,
  canary_min_samples integer NOT NULL DEFAULT 20,
  canary_min_minutes integer NOT NULL DEFAULT 30,
  canary_error_threshold_pct numeric NOT NULL DEFAULT 5,
  canary_auto_promote boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_agents TO authenticated;
GRANT ALL ON public.agentic_agents TO service_role;
ALTER TABLE public.agentic_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage agentic agents" ON public.agentic_agents FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_agentic_agents_updated_at BEFORE UPDATE ON public.agentic_agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.agentic_agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  system_prompt text NOT NULL DEFAULT '',
  model text,
  temperature numeric,
  max_tokens integer,
  fast_mode boolean,
  status text NOT NULL DEFAULT 'draft',
  notes text,
  created_by uuid,
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_agent_versions TO authenticated;
GRANT ALL ON public.agentic_agent_versions TO service_role;
ALTER TABLE public.agentic_agent_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage agentic versions" ON public.agentic_agent_versions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_agentic_agent_versions_updated_at BEFORE UPDATE ON public.agentic_agent_versions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.agentic_agents
  ADD CONSTRAINT agentic_agents_active_version_fk FOREIGN KEY (active_version_id) REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL,
  ADD CONSTRAINT agentic_agents_canary_version_fk FOREIGN KEY (canary_version_id) REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL;

CREATE TABLE public.agentic_run_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE SET NULL,
  version_id uuid REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL,
  run_id uuid NOT NULL DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'success',
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
GRANT SELECT, INSERT ON public.agentic_run_logs TO authenticated;
GRANT ALL ON public.agentic_run_logs TO service_role;
ALTER TABLE public.agentic_run_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view run logs" ON public.agentic_run_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert run logs" ON public.agentic_run_logs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_agentic_run_logs_agent_time ON public.agentic_run_logs(agent_id, created_at DESC);

CREATE TABLE public.agentic_agent_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.agentic_agent_audit TO authenticated;
GRANT ALL ON public.agentic_agent_audit TO service_role;
ALTER TABLE public.agentic_agent_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage agentic audit" ON public.agentic_agent_audit FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.agentic_scenario_runs (
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
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_scenario_runs TO authenticated;
GRANT ALL ON public.agentic_scenario_runs TO service_role;
ALTER TABLE public.agentic_scenario_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage scenario runs" ON public.agentic_scenario_runs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.get_agentic_cron_status()
RETURNS TABLE(jobname text, schedule text, active boolean, last_start timestamptz, last_end timestamptz, last_status text, last_message text, last_runid bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 'agentic-monitor'::text, '*/15 * * * *'::text, true, NULL::timestamptz, NULL::timestamptz, NULL::text, NULL::text, NULL::bigint
  WHERE public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.get_agentic_report_by_agent(_since timestamptz)
RETURNS TABLE(agent_id uuid, agent_name text, function_slug text, runs bigint, errors bigint, error_pct numeric, input_tokens bigint, output_tokens bigint, total_tokens bigint, cost_credits numeric, avg_latency_ms numeric, p95_latency_ms numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id, a.name, a.function_slug,
         count(l.id)::bigint,
         count(l.id) FILTER (WHERE l.status <> 'success')::bigint,
         CASE WHEN count(l.id)=0 THEN 0 ELSE round((count(l.id) FILTER (WHERE l.status <> 'success'))::numeric * 100 / count(l.id), 2) END,
         coalesce(sum(l.input_tokens),0)::bigint,
         coalesce(sum(l.output_tokens),0)::bigint,
         (coalesce(sum(l.input_tokens),0)+coalesce(sum(l.output_tokens),0))::bigint,
         coalesce(sum(l.cost_credits),0),
         coalesce(avg(l.latency_ms),0),
         coalesce(percentile_cont(0.95) WITHIN GROUP (ORDER BY l.latency_ms),0)::numeric
  FROM public.agentic_agents a
  LEFT JOIN public.agentic_run_logs l ON l.agent_id = a.id AND l.created_at >= _since
  WHERE public.has_role(auth.uid(), 'admin')
  GROUP BY a.id, a.name, a.function_slug
$$;

CREATE OR REPLACE FUNCTION public.get_agentic_report_by_scenario(_since timestamptz)
RETURNS TABLE(agent_fn text, scenario_id text, scenario_label text, runs bigint, pass bigint, fail bigint, errors bigint, error_pct numeric, avg_latency_ms numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.agent_fn, r.scenario_id, r.scenario_label,
         count(*)::bigint,
         count(*) FILTER (WHERE r.status = 'pass')::bigint,
         count(*) FILTER (WHERE r.status = 'fail')::bigint,
         count(*) FILTER (WHERE r.status NOT IN ('pass','fail'))::bigint,
         CASE WHEN count(*)=0 THEN 0 ELSE round((count(*) FILTER (WHERE r.status <> 'pass'))::numeric * 100 / count(*), 2) END,
         coalesce(avg(r.latency_ms),0)
  FROM public.agentic_scenario_runs r
  WHERE r.created_at >= _since AND public.has_role(auth.uid(), 'admin')
  GROUP BY r.agent_fn, r.scenario_id, r.scenario_label
$$;

CREATE OR REPLACE FUNCTION public.get_agentic_error_samples_by_agent(_since timestamptz, _limit integer DEFAULT 50)
RETURNS TABLE(agent_id uuid, agent_name text, function_slug text, error_type text, error_message text, occurrences bigint, last_occurred_at timestamptz, sample_output text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.agent_id, coalesce(a.name,'—')::text, a.function_slug, coalesce(l.error_type,'error')::text, coalesce(l.error_message,'')::text,
         count(*)::bigint, max(l.created_at), max(l.output_preview)
  FROM public.agentic_run_logs l
  LEFT JOIN public.agentic_agents a ON a.id = l.agent_id
  WHERE l.created_at >= _since AND l.status <> 'success' AND public.has_role(auth.uid(), 'admin')
  GROUP BY l.agent_id, a.name, a.function_slug, l.error_type, l.error_message
  ORDER BY max(l.created_at) DESC
  LIMIT _limit
$$;

CREATE OR REPLACE FUNCTION public.get_agentic_error_samples_by_scenario(_since timestamptz, _limit integer DEFAULT 50)
RETURNS TABLE(agent_fn text, scenario_id text, scenario_label text, status text, reason text, occurrences bigint, last_occurred_at timestamptz, last_http_status integer, sample_error text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.agent_fn, r.scenario_id, r.scenario_label, r.status, coalesce(r.reason,'')::text,
         count(*)::bigint, max(r.created_at), max(r.http_status), max(r.output_preview)
  FROM public.agentic_scenario_runs r
  WHERE r.created_at >= _since AND r.status <> 'pass' AND public.has_role(auth.uid(), 'admin')
  GROUP BY r.agent_fn, r.scenario_id, r.scenario_label, r.status, r.reason
  ORDER BY max(r.created_at) DESC
  LIMIT _limit
$$;

-- WhatsApp and automation
CREATE TABLE public.whatsapp_instances (
  id text PRIMARY KEY,
  name text NOT NULL,
  connected_number text,
  status text NOT NULL DEFAULT 'disconnected',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instances TO authenticated;
GRANT ALL ON public.whatsapp_instances TO service_role;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp instances" ON public.whatsapp_instances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id text REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  contact_phone text NOT NULL,
  contact_name text,
  channel text DEFAULT 'whatsapp',
  last_message_preview text,
  last_message_at timestamptz,
  assistant_enabled boolean NOT NULL DEFAULT true,
  handoff_to_human boolean NOT NULL DEFAULT false,
  unread_count integer NOT NULL DEFAULT 0,
  archived boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'open',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp conversations" ON public.whatsapp_conversations FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL,
  sender text NOT NULL DEFAULT 'contact',
  content text NOT NULL,
  status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_chat_messages TO authenticated;
GRANT ALL ON public.whatsapp_chat_messages TO service_role;
ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp chat messages" ON public.whatsapp_chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id text,
  recipient_phone text,
  recipient_name text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp messages" ON public.whatsapp_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_assistant_config (
  id integer PRIMARY KEY DEFAULT 1,
  assistant_name text NOT NULL DEFAULT 'Assistente WhatsApp',
  system_prompt text NOT NULL DEFAULT '',
  knowledge_base text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  default_instance_id text,
  escalation_email text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_assistant_config_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_assistant_config TO authenticated;
GRANT ALL ON public.whatsapp_assistant_config TO service_role;
ALTER TABLE public.whatsapp_assistant_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp assistant config" ON public.whatsapp_assistant_config FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.whatsapp_assistant_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  trigger_event text NOT NULL DEFAULT 'custom',
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 1,
  variables text[] NOT NULL DEFAULT '{}',
  media_url text,
  media_mime text,
  tag_id uuid REFERENCES public.lead_tags(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp templates" ON public.whatsapp_templates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_whatsapp_templates_updated_at BEFORE UPDATE ON public.whatsapp_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_trigger_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL,
  trigger_event text,
  source_id uuid,
  recipient_name text,
  recipient_phone text,
  message_sent text,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_trigger_logs TO authenticated;
GRANT ALL ON public.whatsapp_trigger_logs TO service_role;
ALTER TABLE public.whatsapp_trigger_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp trigger logs" ON public.whatsapp_trigger_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  mime_type text,
  file_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_media TO authenticated;
GRANT ALL ON public.whatsapp_media TO service_role;
ALTER TABLE public.whatsapp_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp media" ON public.whatsapp_media FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  contact_name text,
  contact_phone text,
  status text NOT NULL DEFAULT 'new',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_quotes TO authenticated;
GRANT ALL ON public.whatsapp_quotes TO service_role;
ALTER TABLE public.whatsapp_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp quotes" ON public.whatsapp_quotes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_whatsapp_quotes_updated_at BEFORE UPDATE ON public.whatsapp_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
  category text DEFAULT 'human_request',
  keyword text,
  lang text,
  status text NOT NULL DEFAULT 'pending',
  source text,
  notes text,
  forwarded_to text,
  forwarded_at timestamptz,
  resolved_at timestamptz,
  assigned_to uuid,
  resolved_by uuid,
  first_human_reply_at timestamptz,
  sla_due_at timestamptz,
  sla_breached_at timestamptz,
  queue_priority integer NOT NULL DEFAULT 100,
  reassign_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_handoffs TO authenticated;
GRANT ALL ON public.whatsapp_handoffs TO service_role;
ALTER TABLE public.whatsapp_handoffs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp handoffs" ON public.whatsapp_handoffs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_whatsapp_handoffs_updated_at BEFORE UPDATE ON public.whatsapp_handoffs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.whatsapp_instance_agent_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id text NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(instance_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_instance_agent_map TO authenticated;
GRANT ALL ON public.whatsapp_instance_agent_map TO service_role;
ALTER TABLE public.whatsapp_instance_agent_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage whatsapp agent maps" ON public.whatsapp_instance_agent_map FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_concierge_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
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
CREATE POLICY "Admins manage concierge checks" ON public.whatsapp_concierge_checks FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_concierge_alert_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  email_recipients text[] NOT NULL DEFAULT '{}',
  telegram_chat_ids text[] NOT NULL DEFAULT '{}',
  webhook_url text,
  violation_threshold integer NOT NULL DEFAULT 3,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_concierge_alert_settings_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_concierge_alert_settings TO authenticated;
GRANT ALL ON public.whatsapp_concierge_alert_settings TO service_role;
ALTER TABLE public.whatsapp_concierge_alert_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage concierge alert settings" ON public.whatsapp_concierge_alert_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.whatsapp_concierge_alert_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

CREATE TABLE public.whatsapp_concierge_alert_log (
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
CREATE POLICY "Admins manage concierge alert log" ON public.whatsapp_concierge_alert_log FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Social media
CREATE TABLE public.social_media_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rede text NOT NULL,
  account_label text NOT NULL,
  handle text,
  external_id text,
  agent_id uuid REFERENCES public.agentic_agents(id) ON DELETE SET NULL,
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
CREATE POLICY "Admins manage social accounts" ON public.social_media_accounts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_social_media_accounts_updated_at BEFORE UPDATE ON public.social_media_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.social_media_drafts (
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
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_drafts TO authenticated;
GRANT ALL ON public.social_media_drafts TO service_role;
ALTER TABLE public.social_media_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage social drafts" ON public.social_media_drafts FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_social_media_drafts_updated_at BEFORE UPDATE ON public.social_media_drafts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.social_media_notification_settings (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT true,
  recipients text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT social_media_notification_settings_singleton CHECK (id = 1)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_media_notification_settings TO authenticated;
GRANT ALL ON public.social_media_notification_settings TO service_role;
ALTER TABLE public.social_media_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage social notification settings" ON public.social_media_notification_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.social_media_notification_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Admin notifications
CREATE TABLE public.admin_notification_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  audit_id uuid NOT NULL,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, audit_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notification_reads TO authenticated;
GRANT ALL ON public.admin_notification_reads TO service_role;
ALTER TABLE public.admin_notification_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notification reads" ON public.admin_notification_reads FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
