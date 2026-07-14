
-- 1) assistant_settings: restrict SELECT to admins; expose safe fields via view
DROP POLICY IF EXISTS "Anyone can read assistant settings" ON public.assistant_settings;
CREATE POLICY "Admins can read assistant settings"
  ON public.assistant_settings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE VIEW public.assistant_public
WITH (security_invoker = false) AS
SELECT id, assistant_name, greeting_message, is_active
FROM public.assistant_settings;

GRANT SELECT ON public.assistant_public TO anon, authenticated;

-- 2) solucao_routing: admin-only read (admins already have ALL via existing policy)
DROP POLICY IF EXISTS "solucao_routing readable by all" ON public.solucao_routing;

-- 3) Storage: whatsapp-media admin SELECT
CREATE POLICY "WA media admin read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'whatsapp-media' AND has_role(auth.uid(), 'admin'::app_role));

-- 4) Storage: email-assets admin-only writes (public read remains via bucket public flag)
CREATE POLICY "Email assets admin insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'email-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Email assets admin update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'email-assets' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Email assets admin delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'email-assets' AND has_role(auth.uid(), 'admin'::app_role));

-- 5) Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- Keep public execution for: has_role (RLS), get_chat_messages_by_id (chat widget rpc),
-- chat_conversation_exists (chat flow).
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dispatch_whatsapp_trigger(text, text, uuid, text, text, jsonb) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cron_whatsapp_reminders_24h() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_demo_lead_product() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_lead_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_booking_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_booking_completed_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_lead_tag_whatsapp() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_tag_lead() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
