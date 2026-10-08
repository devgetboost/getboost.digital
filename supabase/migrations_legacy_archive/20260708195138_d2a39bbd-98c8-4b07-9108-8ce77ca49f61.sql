
-- Remove public SELECT policy exposing sensitive columns
DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.blog_comments;

-- Create a safe public view exposing only non-sensitive columns
CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker = true) AS
SELECT id, blog_post_id, author_name, content, created_at, parent_id, status
FROM public.blog_comments
WHERE status = 'approved';

GRANT SELECT ON public.blog_comments_public TO anon, authenticated;

-- Re-add a restricted SELECT policy on the base table for the view to work under security_invoker
CREATE POLICY "Public can read approved comments (safe cols via view)"
ON public.blog_comments
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Revoke access to sensitive columns from anon/authenticated on the base table
REVOKE SELECT ON public.blog_comments FROM anon, authenticated;
GRANT SELECT (id, blog_post_id, author_name, content, created_at, parent_id, status)
  ON public.blog_comments TO anon, authenticated;
