
CREATE POLICY "Public read hero-banners"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-banners');

CREATE POLICY "Admins upload hero-banners"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'hero-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update hero-banners"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'hero-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete hero-banners"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'hero-banners' AND public.has_role(auth.uid(), 'admin'));
