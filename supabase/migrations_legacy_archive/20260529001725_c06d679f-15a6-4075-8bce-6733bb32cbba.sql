
-- Storage bucket for WhatsApp media
INSERT INTO storage.buckets (id, name, public) VALUES ('whatsapp-media', 'whatsapp-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "WA media public read" ON storage.objects FOR SELECT USING (bucket_id = 'whatsapp-media');
CREATE POLICY "WA media admin write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'whatsapp-media' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "WA media admin update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'whatsapp-media' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "WA media admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'whatsapp-media' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- Templates table
CREATE TABLE public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL,
  media_url text,
  media_mime text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_templates TO authenticated;
GRANT ALL ON public.whatsapp_templates TO service_role;

ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage templates" ON public.whatsapp_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_whatsapp_templates_updated_at
BEFORE UPDATE ON public.whatsapp_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Media library table (catalog of uploaded images)
CREATE TABLE public.whatsapp_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  size_bytes integer,
  tags text[] DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_media TO authenticated;
GRANT ALL ON public.whatsapp_media TO service_role;

ALTER TABLE public.whatsapp_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage media" ON public.whatsapp_media FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_whatsapp_media_updated_at
BEFORE UPDATE ON public.whatsapp_media
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add media columns to whatsapp_messages for tracking
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS media_mime text;
