
DROP POLICY IF EXISTS "Public can read approved comments (safe cols via view)" ON public.blog_comments;
REVOKE SELECT ON public.blog_comments FROM anon, authenticated;

-- Ensure the public view has SELECT on the base cols it needs (security_invoker uses the caller's rights;
-- so grant column-level SELECT to anon/authenticated only for safe cols to let the view resolve).
GRANT SELECT (id, blog_post_id, author_name, content, created_at, parent_id, status)
  ON public.blog_comments TO anon, authenticated;

-- Row-level access for the view: an RLS policy limited to approved rows, still no email/ip exposure due to column grants.
CREATE POLICY "View: public reads approved comments"
ON public.blog_comments
FOR SELECT
TO anon, authenticated
USING (status = 'approved');
