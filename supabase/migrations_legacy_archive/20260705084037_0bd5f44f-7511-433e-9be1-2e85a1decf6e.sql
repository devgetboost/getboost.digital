
CREATE OR REPLACE FUNCTION public.validate_demo_lead_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allowed_slugs text[] := ARRAY['pikto','prosafe360','motivae','qook','hostify','trackfy','geral'];
  slug_part text;
BEGIN
  IF NEW.source IS NOT NULL AND NEW.source LIKE 'demo:%' THEN
    slug_part := lower(trim(substring(NEW.source FROM 6)));

    IF NOT (slug_part = ANY(allowed_slugs)) THEN
      slug_part := 'geral';
      NEW.source := 'demo:geral';
    END IF;

    IF NEW.resource_id IS NULL OR NOT (lower(trim(NEW.resource_id)) = ANY(allowed_slugs)) THEN
      NEW.resource_id := slug_part;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_demo_lead_product ON public.leads;
CREATE TRIGGER trg_validate_demo_lead_product
BEFORE INSERT OR UPDATE ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.validate_demo_lead_product();
