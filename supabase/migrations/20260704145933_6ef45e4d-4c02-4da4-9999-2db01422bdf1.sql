
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
DROP POLICY IF EXISTS "Service role manages send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role manages suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role manages unsubscribe tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role manages user roles" ON public.user_roles;
