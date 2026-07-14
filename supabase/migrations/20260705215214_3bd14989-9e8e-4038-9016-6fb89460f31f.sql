
-- Revoke EXECUTE on internal SECURITY DEFINER functions from anon/authenticated.
-- Keep executable: has_role, chat_conversation_exists, get_chat_messages_by_id (used by RLS/client).

REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_demo_lead_product() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_lead_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_booking_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_booking_completed_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_lead_tag_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_tag_lead() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_whatsapp_trigger(text, text, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cron_whatsapp_reminders_24h() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
