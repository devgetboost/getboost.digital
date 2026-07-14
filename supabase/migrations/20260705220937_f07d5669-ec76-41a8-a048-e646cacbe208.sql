
-- Defense-in-depth: even if a permissive SELECT policy is added later,
-- this RESTRICTIVE policy still limits reads to admins only.
DROP POLICY IF EXISTS "Restrict leads SELECT to admins" ON public.leads;

CREATE POLICY "Restrict leads SELECT to admins"
ON public.leads
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role));
