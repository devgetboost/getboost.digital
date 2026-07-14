import { supabase } from '@/integrations/supabase/client';
import { getSettings } from './agenticSettings';

export type Agent = {
  id: string;
  name: string;
  description: string;
  model: string;
  systemPrompt: string;
  status: 'active' | 'draft';
  temperature: number;
  maxTokens: number;
  fastMode: boolean;
  createdAt: string;
  updatedAt: string;
  /** True when the agent inherits this field from the global defaults. */
  inherited: { model: boolean; temperature: boolean; maxTokens: boolean; fastMode: boolean };
};

type Row = {
  id: string;
  name: string;
  description: string | null;
  model: string | null;
  system_prompt: string | null;
  status: 'active' | 'draft';
  temperature: number | null;
  max_tokens: number | null;
  fast_mode: boolean | null;
  created_at: string;
  updated_at: string;
};

const fromRow = (r: Row): Agent => {
  const defaults = getSettings();
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    model: r.model ?? defaults.defaultModel,
    systemPrompt: r.system_prompt ?? '',
    status: r.status,
    temperature: r.temperature ?? defaults.temperature,
    maxTokens: r.max_tokens ?? defaults.maxTokens,
    fastMode: r.fast_mode ?? defaults.fastMode,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    inherited: {
      model: r.model == null,
      temperature: r.temperature == null,
      maxTokens: r.max_tokens == null,
      fastMode: r.fast_mode == null,
    },
  };
};


export async function listAgents(): Promise<Agent[]> {
  const { data, error } = await supabase
    .from('agentic_agents')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function getAgent(id: string): Promise<Agent | undefined> {
  const { data, error } = await supabase.from('agentic_agents').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : undefined;
}

export async function createAgent(
  input: Omit<Agent, 'id' | 'createdAt' | 'updatedAt' | 'inherited'>
): Promise<Agent> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('agentic_agents')
    .insert({
      name: input.name,
      description: input.description,
      model: input.model,
      system_prompt: input.systemPrompt,
      status: input.status,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      fast_mode: input.fastMode,
      created_by: user?.id ?? null,

    })
    .select('*')
    .single();
  if (error) throw error;
  return fromRow(data as Row);
}

export type AgentPatch = Partial<{
  name: string;
  description: string;
  systemPrompt: string;
  status: 'active' | 'draft';
  model: string | null;
  temperature: number | null;
  maxTokens: number | null;
  fastMode: boolean | null;
}>;

export async function updateAgent(id: string, patch: AgentPatch): Promise<Agent | undefined> {
  const row: Partial<Row> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.model !== undefined) row.model = patch.model;
  if (patch.systemPrompt !== undefined) row.system_prompt = patch.systemPrompt;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.temperature !== undefined) row.temperature = patch.temperature;
  if (patch.maxTokens !== undefined) row.max_tokens = patch.maxTokens;
  if (patch.fastMode !== undefined) row.fast_mode = patch.fastMode;

  const { data, error } = await supabase
    .from('agentic_agents')
    .update(row)
    .eq('id', id)
    .select('*')
    .maybeSingle();
  if (error) throw error;
  return data ? fromRow(data as Row) : undefined;
}

export async function deleteAgent(id: string): Promise<void> {
  const { error } = await supabase.from('agentic_agents').delete().eq('id', id);
  if (error) throw error;
}
