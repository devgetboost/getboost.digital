
DROP VIEW IF EXISTS public.assistant_public;

CREATE OR REPLACE FUNCTION public.get_assistant_public()
RETURNS TABLE (assistant_name text, greeting_message text, is_active boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT assistant_name, greeting_message, is_active
  FROM public.assistant_settings
  WHERE id = 1
$$;

REVOKE ALL ON FUNCTION public.get_assistant_public() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_assistant_public() TO anon, authenticated;
