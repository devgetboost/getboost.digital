
-- email_accounts: add email_address alias column
ALTER TABLE public.email_accounts
  ADD COLUMN IF NOT EXISTS email_address text;
UPDATE public.email_accounts SET email_address = email WHERE email_address IS NULL;

-- email_lead_links: add account_id
ALTER TABLE public.email_lead_links
  ADD COLUMN IF NOT EXISTS account_id uuid;

-- email_stars
CREATE TABLE IF NOT EXISTS public.email_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  account_id uuid NOT NULL,
  message_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, account_id, message_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_stars TO authenticated;
GRANT ALL ON public.email_stars TO service_role;
ALTER TABLE public.email_stars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own email stars" ON public.email_stars
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- whatsapp_assistant_config: add missing config fields
ALTER TABLE public.whatsapp_assistant_config
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  ADD COLUMN IF NOT EXISTS business_hours_only boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS business_hours jsonb NOT NULL DEFAULT '{"start":"09:00","end":"18:00","days":[1,2,3,4,5],"tz":"Europe/Lisbon"}'::jsonb,
  ADD COLUMN IF NOT EXISTS offline_message text NOT NULL DEFAULT 'Estamos offline. Respondemos brevemente.',
  ADD COLUMN IF NOT EXISTS max_replies_per_hour int NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS chunk_strategy text NOT NULL DEFAULT 'paragraph',
  ADD COLUMN IF NOT EXISTS chunk_max_chars int NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS chunk_delay_ms int NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS max_chunks_per_reply int NOT NULL DEFAULT 5;

-- whatsapp_concierge_alert_settings: add missing thresholds/recipients
ALTER TABLE public.whatsapp_concierge_alert_settings
  ADD COLUMN IF NOT EXISTS recipients text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS slack_webhook_urls text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS valid_pct_min numeric NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS violations_spike_pct numeric NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS invites_drop_pct numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS bookings_drop_pct numeric NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS min_samples int NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS cooldown_hours int NOT NULL DEFAULT 6;

-- whatsapp_handoffs: add missing fields
ALTER TABLE public.whatsapp_handoffs
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS trigger_message text,
  ADD COLUMN IF NOT EXISTS canned_reply text,
  ADD COLUMN IF NOT EXISTS sla_minutes int,
  ADD COLUMN IF NOT EXISTS reassign_reason text;

-- whatsapp_instance_agent_map: add notes
ALTER TABLE public.whatsapp_instance_agent_map
  ADD COLUMN IF NOT EXISTS notes text;

-- whatsapp_instances: add provider fields
ALTER TABLE public.whatsapp_instances
  ADD COLUMN IF NOT EXISTS server_url text,
  ADD COLUMN IF NOT EXISTS api_key text,
  ADD COLUMN IF NOT EXISTS instance_name text,
  ADD COLUMN IF NOT EXISTS qrcode_base64 text,
  ADD COLUMN IF NOT EXISTS qrcode_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS pairing_code text,
  ADD COLUMN IF NOT EXISTS last_connected_at timestamptz,
  ADD COLUMN IF NOT EXISTS webhook_configured boolean NOT NULL DEFAULT false;
