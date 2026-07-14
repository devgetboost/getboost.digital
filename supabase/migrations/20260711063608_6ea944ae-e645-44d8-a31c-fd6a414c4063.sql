
-- Allow overrides to be NULL so agents inherit global defaults
ALTER TABLE public.agentic_agents ALTER COLUMN model DROP NOT NULL;
ALTER TABLE public.agentic_agents ALTER COLUMN model DROP DEFAULT;
ALTER TABLE public.agentic_agents ALTER COLUMN temperature DROP NOT NULL;
ALTER TABLE public.agentic_agents ALTER COLUMN temperature DROP DEFAULT;
ALTER TABLE public.agentic_agents ALTER COLUMN max_tokens DROP NOT NULL;
ALTER TABLE public.agentic_agents ALTER COLUMN max_tokens DROP DEFAULT;
ALTER TABLE public.agentic_agents ALTER COLUMN fast_mode DROP NOT NULL;
ALTER TABLE public.agentic_agents ALTER COLUMN fast_mode DROP DEFAULT;

-- Backfill: agents still holding the legacy hardcoded defaults now inherit
UPDATE public.agentic_agents SET model = NULL       WHERE model = 'google/gemini-2.5-flash';
UPDATE public.agentic_agents SET temperature = NULL WHERE temperature = 0.7;
UPDATE public.agentic_agents SET max_tokens = NULL  WHERE max_tokens = 2048;
UPDATE public.agentic_agents SET fast_mode = NULL   WHERE fast_mode = false;
