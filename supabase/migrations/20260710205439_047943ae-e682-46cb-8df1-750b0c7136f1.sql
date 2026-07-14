
ALTER TABLE public.campaign_recipients
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS failed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_campaign_recipients_provider_msg
  ON public.campaign_recipients(provider_message_id)
  WHERE provider_message_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.recompute_campaign_stats(_campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns c
  SET stats = jsonb_build_object(
    'sent',      (SELECT count(*) FROM public.campaign_recipients WHERE campaign_id = _campaign_id AND status IN ('sent','delivered','opened','clicked')),
    'delivered', (SELECT count(*) FROM public.campaign_recipients WHERE campaign_id = _campaign_id AND status IN ('delivered','opened','clicked')),
    'opened',    (SELECT count(*) FROM public.campaign_recipients WHERE campaign_id = _campaign_id AND (opened_at IS NOT NULL OR status IN ('opened','clicked'))),
    'clicked',   (SELECT count(*) FROM public.campaign_recipients WHERE campaign_id = _campaign_id AND (clicked_at IS NOT NULL OR status = 'clicked')),
    'failed',    (SELECT count(*) FROM public.campaign_recipients WHERE campaign_id = _campaign_id AND status IN ('failed','bounced'))
  ),
  updated_at = now()
  WHERE c.id = _campaign_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_recompute_campaign_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recompute_campaign_stats(COALESCE(NEW.campaign_id, OLD.campaign_id));
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS campaign_recipients_recompute ON public.campaign_recipients;
CREATE TRIGGER campaign_recipients_recompute
AFTER INSERT OR UPDATE OR DELETE ON public.campaign_recipients
FOR EACH ROW EXECUTE FUNCTION public.trg_recompute_campaign_stats();
