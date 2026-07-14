
CREATE TABLE public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blog categories"
  ON public.blog_categories FOR SELECT TO public
  USING (true);

CREATE POLICY "Admins can manage blog categories"
  ON public.blog_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed with existing categories
INSERT INTO public.blog_categories (name, slug, sort_order) VALUES
  ('SEO', 'seo', 1),
  ('Branding', 'branding', 2),
  ('Social Media', 'social-media', 3),
  ('Email', 'email', 4),
  ('Conteúdo', 'conteudo', 5),
  ('Performance', 'performance', 6),
  ('Estratégia', 'estrategia', 7);
