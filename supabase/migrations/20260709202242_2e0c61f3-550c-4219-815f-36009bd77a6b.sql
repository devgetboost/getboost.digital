
-- 1) Revoke EXECUTE from anon/authenticated on internal-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.check_email_delivery_health() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_email_send_log_alert() FROM PUBLIC, anon, authenticated;

-- 2) Set explicit search_path on functions currently without one
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- 3) booking_settings: replace public-role policy with explicit anon+authenticated scope
DROP POLICY IF EXISTS "Anyone can read booking settings" ON public.booking_settings;
CREATE POLICY "Public can read booking settings"
  ON public.booking_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 4) leads: drop redundant RESTRICTIVE policy; PERMISSIVE admin-only SELECT already restricts access
DROP POLICY IF EXISTS "Restrict leads SELECT to admins" ON public.leads;
