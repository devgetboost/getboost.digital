
CREATE TABLE public.podcast_episodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  episode_number INT,
  title TEXT NOT NULL,
  eyebrow TEXT,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  audio_url TEXT,
  cover_url TEXT,
  duration_seconds INT,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.podcast_episodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.podcast_episodes TO authenticated;
GRANT ALL ON public.podcast_episodes TO service_role;

ALTER TABLE public.podcast_episodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published episodes"
  ON public.podcast_episodes FOR SELECT
  USING (published = true);

CREATE POLICY "Admins can view all episodes"
  ON public.podcast_episodes FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert episodes"
  ON public.podcast_episodes FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update episodes"
  ON public.podcast_episodes FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete episodes"
  ON public.podcast_episodes FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_podcast_episodes_updated_at
  BEFORE UPDATE ON public.podcast_episodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage policies for podcast-audio bucket
CREATE POLICY "Public can read podcast audio"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'podcast-audio');

CREATE POLICY "Admins can upload podcast audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'podcast-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update podcast audio"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'podcast-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete podcast audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'podcast-audio' AND public.has_role(auth.uid(), 'admin'));
