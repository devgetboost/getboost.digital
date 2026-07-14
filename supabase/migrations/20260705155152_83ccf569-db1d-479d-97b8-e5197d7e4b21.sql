
-- 1) chat_messages: remove permissive anon INSERT; only admins can insert via API. Edge function uses service_role and bypasses RLS.
DROP POLICY IF EXISTS "Anyone can insert messages" ON public.chat_messages;

CREATE POLICY "Admins can insert messages"
  ON public.chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) newsletter_subscribers: replace WITH CHECK (true) with validation
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 254
    AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

-- 3) vip_subscribers: same treatment
DROP POLICY IF EXISTS "Anyone can subscribe to VIP list" ON public.vip_subscribers;
CREATE POLICY "Anyone can subscribe to VIP list"
  ON public.vip_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 254
    AND email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

-- 4) Revoke EXECUTE on SECURITY DEFINER functions from anon/authenticated,
--    keep only the ones intentionally exposed via RPC.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.chat_conversation_exists(uuid) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_demo_lead_product() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_lead_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_booking_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_tag_lead() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cron_whatsapp_reminders_24h() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_booking_completed_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dispatch_whatsapp_trigger(text, text, uuid, text, text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_lead_tag_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;

-- get_chat_messages_by_id is intentionally called from the browser via RPC to read one's own conversation.
-- Keep it callable, but ensure it stays SECURITY DEFINER with search_path locked (already the case).
GRANT EXECUTE ON FUNCTION public.get_chat_messages_by_id(uuid) TO anon, authenticated;
