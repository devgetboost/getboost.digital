
DROP VIEW IF EXISTS public.blog_comments_public;

-- Recreate public read policy for approved rows; column privileges restrict what's actually visible
CREATE POLICY "Anyone can read approved comments"
ON public.blog_comments
FOR SELECT
TO anon, authenticated
USING (status = 'approved');

-- Column-level lockdown: strip broad SELECT then grant only safe columns
REVOKE SELECT ON public.blog_comments FROM anon, authenticated;

GRANT SELECT (id, blog_post_id, parent_id, author_name, content, status, created_at)
  ON public.blog_comments TO anon, authenticated;

-- Admins keep full access via existing "Admins can view all comments" policy;
-- ensure the authenticated role can still read sensitive columns when acting as admin.
GRANT SELECT (author_email, ip_address, updated_at)
  ON public.blog_comments TO authenticated;

-- Insert path already scoped by existing "Anyone can submit comments" policy;
-- make sure inserts can still write all needed columns.
GRANT INSERT ON public.blog_comments TO anon, authenticated;
