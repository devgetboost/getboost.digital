-- Restrict user_roles: only service_role can INSERT, UPDATE, DELETE
-- This prevents privilege escalation where any authenticated user could grant themselves admin

CREATE POLICY "Only service role can insert roles"
ON public.user_roles
FOR INSERT
TO public
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can update roles"
ON public.user_roles
FOR UPDATE
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Only service role can delete roles"
ON public.user_roles
FOR DELETE
TO public
USING (auth.role() = 'service_role');