
CREATE OR REPLACE FUNCTION public.validate_campaign_scheduled_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- The scheduled_at column is TIMESTAMPTZ, so Postgres already normalizes any
  -- ISO string with a timezone offset (e.g. "...Z" or "+01:00") to UTC on
  -- insert. This trigger rejects values that lack that guarantee at the app
  -- boundary: naive/past values that would indicate a client-side bug.
  IF NEW.scheduled_at IS NOT NULL THEN
    -- Must be in the future (allow 1 minute of clock skew).
    IF NEW.scheduled_at < (now() - interval '1 minute') THEN
      RAISE EXCEPTION 'scheduled_at must be a future UTC timestamp (got % , now %). Send an ISO 8601 string with a timezone offset (e.g. 2026-01-01T10:00:00Z).',
        NEW.scheduled_at, now()
        USING ERRCODE = '22007';
    END IF;

    -- Only meaningful when actually scheduling.
    IF NEW.status NOT IN ('draft','scheduled') THEN
      RAISE EXCEPTION 'scheduled_at can only be set when status is draft or scheduled (got status=%).', NEW.status
        USING ERRCODE = '22023';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS campaigns_validate_scheduled_at ON public.campaigns;
CREATE TRIGGER campaigns_validate_scheduled_at
BEFORE INSERT OR UPDATE OF scheduled_at, status ON public.campaigns
FOR EACH ROW EXECUTE FUNCTION public.validate_campaign_scheduled_at();

COMMENT ON COLUMN public.campaigns.scheduled_at IS
  'UTC instant do envio agendado. Enviar sempre ISO 8601 com timezone (ex.: 2026-01-01T10:00:00Z). O tipo timestamptz normaliza automaticamente para UTC.';
