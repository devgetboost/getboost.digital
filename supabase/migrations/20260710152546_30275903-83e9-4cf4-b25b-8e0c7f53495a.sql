
-- Remove eventuais duplicados existentes mantendo o mais antigo
DELETE FROM public.whatsapp_chat_messages a
USING public.whatsapp_chat_messages b
WHERE a.external_id IS NOT NULL
  AND a.external_id = b.external_id
  AND a.ctid > b.ctid;

CREATE UNIQUE INDEX IF NOT EXISTS whatsapp_chat_messages_external_id_unique
  ON public.whatsapp_chat_messages (external_id)
  WHERE external_id IS NOT NULL;
