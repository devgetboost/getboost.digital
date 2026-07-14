
ALTER TABLE public.whatsapp_instances ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE public.whatsapp_media
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS storage_path text,
  ADD COLUMN IF NOT EXISTS size_bytes bigint,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
