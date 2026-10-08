DROP POLICY IF EXISTS "Admins can view agentic agents" ON public.agentic_agents;

CREATE POLICY "Authenticated users can view agentic agents"
  ON public.agentic_agents
  FOR SELECT
  TO authenticated
  USING (true);
