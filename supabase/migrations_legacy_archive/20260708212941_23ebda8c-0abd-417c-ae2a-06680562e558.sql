DROP POLICY IF EXISTS "View: public reads approved comments" ON public.blog_comments;
REVOKE SELECT ON public.blog_comments FROM anon;
GRANT SELECT ON public.blog_comments_public TO anon, authenticated;