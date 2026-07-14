
CREATE OR REPLACE FUNCTION public.dispatch_crm_lead(_payload jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://asqdfrzhakgnlfhnzfyu.supabase.co/functions/v1/crm-whatsapp-lead',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key'
      )
    ),
    body := _payload
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'dispatch_crm_lead failed: %', SQLERRM;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_booking_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.dispatch_crm_lead(jsonb_build_object(
    'event', 'form_conversion',
    'location', 'booking:booking_server_success',
    'template', 'booking',
    'click_id', NEW.id::text,
    'utms', jsonb_build_object(
      'utm_source', COALESCE(NEW.utm_source, 'direct'),
      'utm_medium', COALESCE(NEW.utm_medium, 'booking'),
      'utm_campaign', COALESCE(NEW.utm_campaign, 'agendamento')
    ),
    'data', jsonb_build_object(
      'booking_id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'company', NEW.company,
      'website', NEW.website,
      'meeting_type', NEW.meeting_type,
      'meeting_date', NEW.meeting_date,
      'meeting_time', NEW.meeting_time,
      'challenges', NEW.challenges,
      'timezone', NEW.timezone
    )
  ));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_booking_crm failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS bookings_crm_forward ON public.bookings;
CREATE TRIGGER bookings_crm_forward
AFTER INSERT ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.trg_booking_crm();

CREATE OR REPLACE FUNCTION public.trg_lead_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  PERFORM public.dispatch_crm_lead(jsonb_build_object(
    'event', 'form_conversion',
    'location', COALESCE('lead:' || NEW.source, 'lead:server_success'),
    'template', COALESCE(NEW.source, 'lead'),
    'click_id', NEW.id::text,
    'utms', jsonb_build_object(
      'utm_source', COALESCE(NEW.utm_source, 'direct'),
      'utm_medium', COALESCE(NEW.utm_medium, 'form'),
      'utm_campaign', COALESCE(NEW.utm_campaign, COALESCE(NEW.source, 'lead'))
    ),
    'data', jsonb_build_object(
      'lead_id', NEW.id,
      'name', NEW.name,
      'email', NEW.email,
      'phone', NEW.phone,
      'company', NEW.company,
      'service', NEW.service,
      'cargo', NEW.cargo,
      'source', NEW.source,
      'resource_id', NEW.resource_id,
      'message', NEW.message
    )
  ));
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'trg_lead_crm failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_crm_forward ON public.leads;
CREATE TRIGGER leads_crm_forward
AFTER INSERT ON public.leads
FOR EACH ROW EXECUTE FUNCTION public.trg_lead_crm();
