
-- Fase 1: Governança de versões de agentes

-- 1) Tabela de versões
CREATE TABLE public.agentic_agent_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agentic_agents(id) ON DELETE CASCADE,
  version integer NOT NULL,
  system_prompt text NOT NULL DEFAULT '',
  model text,
  temperature numeric,
  max_tokens integer,
  fast_mode boolean,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_review','approved','rejected','archived')),
  notes text,
  created_by uuid,
  approved_by uuid,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (agent_id, version)
);

CREATE INDEX idx_agentic_versions_agent ON public.agentic_agent_versions(agent_id, version DESC);
CREATE INDEX idx_agentic_versions_status ON public.agentic_agent_versions(status);

GRANT SELECT ON public.agentic_agent_versions TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.agentic_agent_versions TO authenticated;
GRANT ALL ON public.agentic_agent_versions TO service_role;

ALTER TABLE public.agentic_agent_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view versions"
  ON public.agentic_agent_versions FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert versions"
  ON public.agentic_agent_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update versions"
  ON public.agentic_agent_versions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete versions"
  ON public.agentic_agent_versions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_agentic_versions_updated_at
  BEFORE UPDATE ON public.agentic_agent_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Coluna active_version_id em agentic_agents
ALTER TABLE public.agentic_agents
  ADD COLUMN active_version_id uuid REFERENCES public.agentic_agent_versions(id) ON DELETE SET NULL;

-- 3) Trigger: ao aprovar uma versão, arquiva as anteriores approved do mesmo agente
CREATE OR REPLACE FUNCTION public.archive_previous_agent_versions()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    UPDATE public.agentic_agent_versions
       SET status = 'archived', updated_at = now()
     WHERE agent_id = NEW.agent_id
       AND id <> NEW.id
       AND status = 'approved';
    NEW.approved_at := COALESCE(NEW.approved_at, now());
    NEW.approved_by := COALESCE(NEW.approved_by, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_archive_previous_versions
  BEFORE UPDATE ON public.agentic_agent_versions
  FOR EACH ROW EXECUTE FUNCTION public.archive_previous_agent_versions();

-- 4) Backfill: cria v1 aprovada para cada agente existente e ativa-a
DO $$
DECLARE
  a RECORD;
  new_ver_id uuid;
BEGIN
  FOR a IN SELECT * FROM public.agentic_agents LOOP
    INSERT INTO public.agentic_agent_versions
      (agent_id, version, system_prompt, model, temperature, max_tokens, fast_mode, status, notes, created_by, approved_at)
    VALUES
      (a.id, 1, a.system_prompt, a.model, a.temperature, a.max_tokens, a.fast_mode, 'approved',
       'Versão inicial criada por backfill', a.created_by, now())
    RETURNING id INTO new_ver_id;

    UPDATE public.agentic_agents SET active_version_id = new_ver_id WHERE id = a.id;
  END LOOP;
END $$;
