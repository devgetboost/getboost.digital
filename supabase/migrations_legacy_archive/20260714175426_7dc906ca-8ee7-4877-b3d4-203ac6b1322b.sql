
ALTER TABLE public.whatsapp_media ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.whatsapp_templates ADD COLUMN IF NOT EXISTS created_by uuid;
