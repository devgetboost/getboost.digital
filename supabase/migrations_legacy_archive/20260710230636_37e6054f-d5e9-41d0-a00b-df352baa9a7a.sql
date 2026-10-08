ALTER TABLE public.agentic_agents
  ADD COLUMN IF NOT EXISTS temperature numeric NOT NULL DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS max_tokens integer NOT NULL DEFAULT 2048;

ALTER TABLE public.agentic_agents
  DROP CONSTRAINT IF EXISTS agentic_agents_temperature_range,
  ADD CONSTRAINT agentic_agents_temperature_range CHECK (temperature >= 0 AND temperature <= 2);

ALTER TABLE public.agentic_agents
  DROP CONSTRAINT IF EXISTS agentic_agents_max_tokens_range,
  ADD CONSTRAINT agentic_agents_max_tokens_range CHECK (max_tokens >= 128 AND max_tokens <= 32000);