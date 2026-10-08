
CREATE TABLE public.agentic_agent_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  version_id uuid REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_status text,
  to_status text,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_agentic_agent_audit_agent ON public.agentic_agent_audit(agent_id, created_at DESC);

GRANT SELECT ON public.agentic_agent_audit TO authenticated;
GRANT ALL ON public.agentic_agent_audit TO service_role;

ALTER TABLE public.agentic_agent_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit"
  ON public.agentic_agent_audit FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role writes audit"
  ON public.agentic_agent_audit FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Trigger: audita criação e mudanças em agentic_agent_versions
CREATE OR REPLACE FUNCTION public.trg_audit_agent_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.agentic_agent_audit (agent_id, version_id, action, to_status, actor_id, metadata)
    VALUES (NEW.agent_id, NEW.id, 'version_created', NEW.status, auth.uid(),
            jsonb_build_object('version', NEW.version, 'model', NEW.model));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.agentic_agent_audit (agent_id, version_id, action, from_status, to_status, actor_id, metadata)
      VALUES (NEW.agent_id, NEW.id, 'status_changed', OLD.status, NEW.status, auth.uid(),
              jsonb_build_object('version', NEW.version));
    ELSIF NEW.system_prompt IS DISTINCT FROM OLD.system_prompt
       OR NEW.model IS DISTINCT FROM OLD.model
       OR NEW.temperature IS DISTINCT FROM OLD.temperature
       OR NEW.max_tokens IS DISTINCT FROM OLD.max_tokens
       OR NEW.fast_mode IS DISTINCT FROM OLD.fast_mode THEN
      INSERT INTO public.agentic_agent_audit (agent_id, version_id, action, to_status, actor_id, metadata)
      VALUES (NEW.agent_id, NEW.id, 'version_edited', NEW.status, auth.uid(),
              jsonb_build_object(
                'version', NEW.version,
                'prompt_changed', NEW.system_prompt IS DISTINCT FROM OLD.system_prompt,
                'model_changed', NEW.model IS DISTINCT FROM OLD.model
              ));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_agent_version ON public.agentic_agent_versions;
CREATE TRIGGER trg_audit_agent_version
  AFTER INSERT OR UPDATE ON public.agentic_agent_versions
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_agent_version();

-- Trigger: audita ativação/desativação da versão em produção
CREATE OR REPLACE FUNCTION public.trg_audit_agent_active_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.active_version_id IS DISTINCT FROM OLD.active_version_id THEN
    INSERT INTO public.agentic_agent_audit (agent_id, version_id, action, actor_id, metadata)
    VALUES (NEW.id, NEW.active_version_id, 'version_activated', auth.uid(),
            jsonb_build_object('previous_version_id', OLD.active_version_id));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_agent_active_version ON public.agentic_agents;
CREATE TRIGGER trg_audit_agent_active_version
  AFTER UPDATE OF active_version_id ON public.agentic_agents
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_agent_active_version();
