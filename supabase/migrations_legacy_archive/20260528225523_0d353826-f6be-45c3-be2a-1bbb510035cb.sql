
-- Remove overly permissive SELECT policies that exposed all visitor PII
DROP POLICY IF EXISTS "Anyone can read their own conversation by id" ON public.chat_conversations;
DROP POLICY IF EXISTS "Anyone can read messages" ON public.chat_messages;

-- Restrict reads to admins only
CREATE POLICY "Admins can read conversations"
  ON public.chat_conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can read messages"
  ON public.chat_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Visitor self-service: fetch messages for a known conversation id
-- (the id lives only in their sessionStorage; guessing a uuid v4 is infeasible)
CREATE OR REPLACE FUNCTION public.get_chat_messages_by_id(_conversation_id uuid)
RETURNS TABLE (
  id uuid,
  conversation_id uuid,
  role text,
  content text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.id, m.conversation_id, m.role, m.content, m.created_at
  FROM public.chat_messages m
  WHERE m.conversation_id = _conversation_id
  ORDER BY m.created_at ASC
$$;

GRANT EXECUTE ON FUNCTION public.get_chat_messages_by_id(uuid) TO anon, authenticated;
