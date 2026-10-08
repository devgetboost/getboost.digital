
CREATE TABLE public.agentic_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  system_prompt text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active','draft')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agentic_agents TO authenticated;
GRANT ALL ON public.agentic_agents TO service_role;

ALTER TABLE public.agentic_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view agentic agents"
  ON public.agentic_agents FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert agentic agents"
  ON public.agentic_agents FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update agentic agents"
  ON public.agentic_agents FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete agentic agents"
  ON public.agentic_agents FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agentic_agents_updated_at
  BEFORE UPDATE ON public.agentic_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
