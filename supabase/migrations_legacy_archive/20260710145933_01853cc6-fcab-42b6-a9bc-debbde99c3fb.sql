
ALTER TABLE public.whatsapp_handoffs
  ADD COLUMN IF NOT EXISTS sla_minutes int NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS queue_priority int NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS reassigned_from uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reassigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS reassign_reason text,
  ADD COLUMN IF NOT EXISTS reassign_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_human_reply_at timestamptz,
  ADD COLUMN IF NOT EXISTS sla_breached_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_wa_handoffs_sla ON public.whatsapp_handoffs(status, sla_due_at)
  WHERE status IN ('pending','in_review');

-- Calcula SLA e prioridade no insert
CREATE OR REPLACE FUNCTION public.set_handoff_sla()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.sla_minutes IS NULL OR NEW.sla_minutes = 120 THEN
    NEW.sla_minutes := CASE NEW.category
      WHEN 'urgency' THEN 30
      WHEN 'complaint_legal' THEN 30
      WHEN 'human_request' THEN 120
      ELSE 120
    END;
  END IF;
  NEW.queue_priority := CASE NEW.category
    WHEN 'urgency' THEN 1
    WHEN 'complaint_legal' THEN 1
    WHEN 'human_request' THEN 2
    ELSE 3
  END;
  IF NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := NEW.created_at + (NEW.sla_minutes || ' minutes')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_handoff_sla ON public.whatsapp_handoffs;
CREATE TRIGGER trg_set_handoff_sla
  BEFORE INSERT ON public.whatsapp_handoffs
  FOR EACH ROW EXECUTE FUNCTION public.set_handoff_sla();

-- Ao receber resposta humana, marca handoffs pendentes como "em revisão"
CREATE OR REPLACE FUNCTION public.mark_handoff_acknowledged()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.direction = 'outbound' AND NEW.sender = 'human' AND NEW.conversation_id IS NOT NULL THEN
    UPDATE public.whatsapp_handoffs
      SET status = CASE WHEN status = 'pending' THEN 'in_review' ELSE status END,
          first_human_reply_at = COALESCE(first_human_reply_at, now())
    WHERE conversation_id = NEW.conversation_id
      AND status IN ('pending','in_review')
      AND first_human_reply_at IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_handoff_ack ON public.whatsapp_chat_messages;
CREATE TRIGGER trg_mark_handoff_ack
  AFTER INSERT ON public.whatsapp_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.mark_handoff_acknowledged();

-- Backfill SLA para registos existentes
UPDATE public.whatsapp_handoffs
  SET sla_minutes = CASE category WHEN 'urgency' THEN 30 WHEN 'complaint_legal' THEN 30 ELSE 120 END,
      queue_priority = CASE category WHEN 'urgency' THEN 1 WHEN 'complaint_legal' THEN 1 WHEN 'human_request' THEN 2 ELSE 3 END,
      sla_due_at = COALESCE(sla_due_at, created_at + CASE category WHEN 'urgency' THEN interval '30 min' WHEN 'complaint_legal' THEN interval '30 min' ELSE interval '120 min' END)
  WHERE sla_due_at IS NULL;
