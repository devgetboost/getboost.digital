
-- WhatsApp conversations (one per contact per instance)
CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id uuid NOT NULL,
  contact_phone text NOT NULL,
  contact_name text,
  last_message_preview text,
  last_message_at timestamptz DEFAULT now(),
  assistant_enabled boolean NOT NULL DEFAULT true,
  handoff_to_human boolean NOT NULL DEFAULT false,
  unread_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instance_id, contact_phone)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;

ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp conversations" ON public.whatsapp_conversations
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_wa_conv_last_message ON public.whatsapp_conversations (last_message_at DESC);
CREATE INDEX idx_wa_conv_instance ON public.whatsapp_conversations (instance_id);

CREATE TRIGGER trg_wa_conv_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Individual chat messages within a conversation
CREATE TABLE public.whatsapp_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  external_id text,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender text NOT NULL CHECK (sender IN ('contact','assistant','human')),
  content text NOT NULL,
  status text DEFAULT 'sent',
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_chat_messages TO authenticated;
GRANT ALL ON public.whatsapp_chat_messages TO service_role;

ALTER TABLE public.whatsapp_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp chat messages" ON public.whatsapp_chat_messages
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_wa_chat_conv ON public.whatsapp_chat_messages (conversation_id, created_at);
CREATE INDEX idx_wa_chat_external ON public.whatsapp_chat_messages (external_id);

-- Assistant config (singleton)
CREATE TABLE public.whatsapp_assistant_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT true,
  default_instance_id uuid,
  system_prompt text NOT NULL DEFAULT 'És o assistente virtual do Nuno Cruz Studio (marketing digital, web, drone, branding e automação em Portugal). Responde em português de Portugal, de forma simpática, profissional, breve (máx 3-4 frases) e útil. Quando faz sentido, convida a agendar um diagnóstico gratuito de 7 minutos em https://nunocruz.studio/booking. Não inventes preços nem prazos — usa apenas o conhecimento fornecido. Para pedidos complexos, propõe falar com o Nuno e marca handoff para humano.',
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  business_hours_only boolean NOT NULL DEFAULT false,
  business_hours jsonb NOT NULL DEFAULT '{"start":"09:00","end":"19:00","days":[1,2,3,4,5],"tz":"Europe/Lisbon"}'::jsonb,
  offline_message text NOT NULL DEFAULT 'Olá! Recebemos a sua mensagem fora do horário de atendimento (Seg-Sex 9h-19h). Respondemos assim que possível. Para urgências, agende em https://nunocruz.studio/booking',
  max_replies_per_hour integer NOT NULL DEFAULT 20,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE ON public.whatsapp_assistant_config TO authenticated;
GRANT ALL ON public.whatsapp_assistant_config TO service_role;

ALTER TABLE public.whatsapp_assistant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage whatsapp assistant config" ON public.whatsapp_assistant_config
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_wa_assistant_updated_at
  BEFORE UPDATE ON public.whatsapp_assistant_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.whatsapp_assistant_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_chat_messages;
ALTER TABLE public.whatsapp_conversations REPLICA IDENTITY FULL;
ALTER TABLE public.whatsapp_chat_messages REPLICA IDENTITY FULL;
