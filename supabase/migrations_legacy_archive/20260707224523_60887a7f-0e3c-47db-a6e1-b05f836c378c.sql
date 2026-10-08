
-- 1. Restrict blog_comments public exposure: replace public SELECT with a safe view

DROP POLICY IF EXISTS "Anyone can read approved comments" ON public.blog_comments;

CREATE OR REPLACE VIEW public.blog_comments_public
WITH (security_invoker = false) AS
SELECT id, blog_post_id, parent_id, author_name, content, status, created_at
FROM public.blog_comments
WHERE status = 'approved';

GRANT SELECT ON public.blog_comments_public TO anon, authenticated;

-- 2. Lock down SECURITY DEFINER functions from public exposure

-- Revoke broad execute
REVOKE EXECUTE ON FUNCTION public.get_chat_messages_by_id(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.chat_conversation_exists(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_assistant_public() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_demo_lead_product() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_lead_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_booking_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cron_whatsapp_reminders_24h() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_tag_lead() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_booking_completed_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.dispatch_whatsapp_trigger(text, text, uuid, text, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trg_lead_tag_whatsapp() FROM PUBLIC, anon, authenticated;

-- Re-grant only where the client legitimately needs to call the function
GRANT EXECUTE ON FUNCTION public.get_assistant_public() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_chat_messages_by_id(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.chat_conversation_exists(uuid) TO anon, authenticated;

-- has_role is invoked inside RLS policies evaluated as the querying role,
-- so signed-in users must retain EXECUTE for admin/role checks to work.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
