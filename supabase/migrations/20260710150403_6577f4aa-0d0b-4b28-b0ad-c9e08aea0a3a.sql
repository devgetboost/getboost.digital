
ALTER TABLE public.admin_tasks
  ADD COLUMN IF NOT EXISTS sla_minutes int,
  ADD COLUMN IF NOT EXISTS sla_due_at timestamptz,
  ADD COLUMN IF NOT EXISTS reassigned_from uuid,
  ADD COLUMN IF NOT EXISTS reassigned_at timestamptz,
  ADD COLUMN IF NOT EXISTS reassign_count int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sla_breached_at timestamptz,
  ADD COLUMN IF NOT EXISTS escalated_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_admin_task_sla()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.sla_minutes IS NULL THEN
    NEW.sla_minutes := CASE lower(coalesce(NEW.priority,'normal'))
      WHEN 'high' THEN 60
      WHEN 'urgent' THEN 30
      WHEN 'medium' THEN 240
      WHEN 'normal' THEN 240
      ELSE 1440
    END;
  END IF;
  IF NEW.sla_due_at IS NULL THEN
    NEW.sla_due_at := coalesce(NEW.created_at, now()) + (NEW.sla_minutes || ' minutes')::interval;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_admin_task_sla ON public.admin_tasks;
CREATE TRIGGER trg_set_admin_task_sla
  BEFORE INSERT ON public.admin_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_admin_task_sla();

-- Backfill existing rows
UPDATE public.admin_tasks
SET sla_minutes = CASE lower(coalesce(priority,'normal'))
      WHEN 'high' THEN 60
      WHEN 'urgent' THEN 30
      WHEN 'medium' THEN 240
      WHEN 'normal' THEN 240
      ELSE 1440
    END
WHERE sla_minutes IS NULL;

UPDATE public.admin_tasks
SET sla_due_at = created_at + (sla_minutes || ' minutes')::interval
WHERE sla_due_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_tasks_sla_due ON public.admin_tasks(sla_due_at)
  WHERE status IN ('pending','in_progress');
