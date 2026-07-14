
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS qrcode_base64 text,
  ADD COLUMN IF NOT EXISTS qrcode_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS pairing_code text,
  ADD COLUMN IF NOT EXISTS last_connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_configured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS connected_number text;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS external_id text,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_external_id
  ON public.whatsapp_messages(external_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_instance_created
  ON public.whatsapp_messages(instance_id, created_at DESC);
