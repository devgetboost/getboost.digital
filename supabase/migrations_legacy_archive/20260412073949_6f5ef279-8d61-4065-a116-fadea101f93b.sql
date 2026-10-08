
-- Chat conversations
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_name text NOT NULL DEFAULT 'Visitante',
  visitor_email text,
  status text NOT NULL DEFAULT 'active',
  channel text NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read their own conversation by id"
  ON public.chat_conversations FOR SELECT
  USING (true);

CREATE POLICY "Admins can update conversations"
  ON public.chat_conversations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Chat messages
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can read messages"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Admins can update messages"
  ON public.chat_messages FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Assistant settings (singleton)
CREATE TABLE public.assistant_settings (
  id integer PRIMARY KEY DEFAULT 1,
  assistant_name text NOT NULL DEFAULT 'Assistente Virtual',
  greeting_message text NOT NULL DEFAULT 'Olá! 👋 Sou a assistente virtual do Nuno Cruz. Como posso ajudar hoje? Pode perguntar sobre os nossos serviços, processo de trabalho, ou agendar uma conversa.',
  system_prompt text NOT NULL DEFAULT 'És a assistente virtual do Nuno Cruz, um especialista em marketing digital e desenvolvimento web com mais de 20 anos de experiência. Responde de forma simpática, profissional e concisa em português de Portugal. Ajuda os visitantes com informações sobre serviços, preços, processo de trabalho e agendamento de reuniões. Se o utilizador precisar de ajuda mais detalhada ou quiser falar com o Nuno, sugere agendar uma reunião.',
  knowledge_base text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assistant_settings_singleton CHECK (id = 1)
);

ALTER TABLE public.assistant_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read assistant settings"
  ON public.assistant_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can update assistant settings"
  ON public.assistant_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert assistant settings"
  ON public.assistant_settings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.assistant_settings (id) VALUES (1);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_conversations;

-- Indexes
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_conversations_status ON public.chat_conversations(status);
