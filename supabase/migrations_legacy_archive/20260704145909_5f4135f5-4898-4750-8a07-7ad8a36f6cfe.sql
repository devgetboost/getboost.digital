
-- =========================================================================
-- 1. Fix mutable search_path on remaining SECURITY DEFINER functions
-- =========================================================================
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

-- =========================================================================
-- 2. Lock down EXECUTE on SECURITY DEFINER functions
--    - Revoke from PUBLIC/anon/authenticated everywhere
--    - Keep has_role callable by authenticated (used in RLS)
--    - Keep get_chat_messages_by_id callable by authenticated (admin panel)
--    - Grant service_role explicitly everywhere it's used from edge functions
-- =========================================================================
REVOKE ALL ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;

REVOKE ALL ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;

REVOKE ALL ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.dispatch_whatsapp_trigger(text, text, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_whatsapp_trigger(text, text, uuid, text, text, jsonb) TO service_role;

REVOKE ALL ON FUNCTION public.cron_whatsapp_reminders_24h() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_whatsapp_reminders_24h() TO service_role;

-- Trigger-only functions: no callers need EXECUTE
REVOKE ALL ON FUNCTION public.auto_tag_lead() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_booking_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_booking_completed_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_lead_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.trg_lead_tag_whatsapp() FROM PUBLIC, anon, authenticated;

-- get_chat_messages_by_id: allow only authenticated (RLS in query is gated in-app to admins)
REVOKE ALL ON FUNCTION public.get_chat_messages_by_id(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_chat_messages_by_id(uuid) TO authenticated, service_role;

-- has_role: needed in RLS across the app
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

-- =========================================================================
-- 3. Helper: check chat conversation exists (bypasses RLS for validation)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.chat_conversation_exists(_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_conversations WHERE id = _conversation_id)
$$;
REVOKE ALL ON FUNCTION public.chat_conversation_exists(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.chat_conversation_exists(uuid) TO anon, authenticated, service_role;

-- =========================================================================
-- 4. Replace permissive INSERT policies with validated ones
-- =========================================================================

-- chat_conversations
DROP POLICY IF EXISTS "Anyone can create conversations" ON public.chat_conversations;
CREATE POLICY "Anyone can create conversations"
ON public.chat_conversations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  visitor_name IS NOT NULL
  AND length(btrim(visitor_name)) BETWEEN 1 AND 100
  AND (visitor_email IS NULL OR visitor_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
  AND (visitor_email IS NULL OR length(visitor_email) <= 254)
);

-- chat_messages: bind insert to an existing conversation and clamp fields
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;
CREATE POLICY "Anyone can insert messages"
ON public.chat_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (
  role IN ('user', 'assistant', 'system')
  AND content IS NOT NULL
  AND length(content) BETWEEN 1 AND 8000
  AND conversation_id IS NOT NULL
  AND public.chat_conversation_exists(conversation_id)
);

-- leads
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  name IS NOT NULL
  AND length(btrim(name)) BETWEEN 1 AND 120
  AND email IS NOT NULL
  AND length(email) <= 254
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
);

-- bookings
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings"
ON public.bookings
FOR INSERT
TO anon, authenticated
WITH CHECK (
  jitsi_room IS NULL
  AND name IS NOT NULL
  AND length(btrim(name)) BETWEEN 1 AND 120
  AND email IS NOT NULL
  AND length(email) <= 254
  AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  AND meeting_date >= (CURRENT_DATE - INTERVAL '1 day')
  AND length(coalesce(challenges, '')) BETWEEN 1 AND 5000
);

-- =========================================================================
-- 5. Retarget service-role-only policies to TO service_role
-- =========================================================================

-- email_send_state
DROP POLICY IF EXISTS "Service role can manage send state" ON public.email_send_state;
CREATE POLICY "Service role can manage send state"
ON public.email_send_state
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- email_send_log
DROP POLICY IF EXISTS "Service role can insert send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can read send log" ON public.email_send_log;
DROP POLICY IF EXISTS "Service role can update send log" ON public.email_send_log;
CREATE POLICY "Service role manages send log"
ON public.email_send_log
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- suppressed_emails
DROP POLICY IF EXISTS "Service role can insert suppressed emails" ON public.suppressed_emails;
DROP POLICY IF EXISTS "Service role can read suppressed emails" ON public.suppressed_emails;
CREATE POLICY "Service role manages suppressed emails"
ON public.suppressed_emails
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- email_unsubscribe_tokens
DROP POLICY IF EXISTS "Service role can insert tokens" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can mark tokens as used" ON public.email_unsubscribe_tokens;
DROP POLICY IF EXISTS "Service role can read tokens" ON public.email_unsubscribe_tokens;
CREATE POLICY "Service role manages unsubscribe tokens"
ON public.email_unsubscribe_tokens
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- user_roles (retarget INSERT/UPDATE/DELETE; keep read policies)
DROP POLICY IF EXISTS "Only service role can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service role can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only service role can delete roles" ON public.user_roles;
CREATE POLICY "Service role manages user roles"
ON public.user_roles
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =========================================================================
-- 6. Storage: drop broad SELECT policies on public-flag buckets
--    (CDN downloads still work for buckets with public=true).
--    Also drop public read on whatsapp-media; the bucket will be flipped
--    to private via the storage tool and served through signed URLs.
-- =========================================================================
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Email assets are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "WA media public read" ON storage.objects;
