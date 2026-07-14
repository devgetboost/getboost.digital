
DO $$
DECLARE
  fn text;
  internal_fns text[] := ARRAY[
    'public.trg_lead_whatsapp()',
    'public.trg_booking_whatsapp()',
    'public.trg_booking_completed_whatsapp()',
    'public.trg_lead_tag_whatsapp()',
    'public.dispatch_whatsapp_trigger(text,text,uuid,text,text,jsonb)',
    'public.cron_whatsapp_reminders_24h()',
    'public.handle_new_user_role()',
    'public.validate_demo_lead_product()',
    'public.auto_tag_lead()',
    'public.update_updated_at_column()',
    'public.move_to_dlq(text,text,bigint,jsonb)',
    'public.read_email_batch(text,integer,integer)',
    'public.enqueue_email(text,jsonb)',
    'public.delete_email(text,bigint)'
  ];
BEGIN
  FOREACH fn IN ARRAY internal_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn);
  END LOOP;
END $$;
