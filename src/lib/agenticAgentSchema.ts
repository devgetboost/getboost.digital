import { z } from 'zod';

export const AGENT_MODELS = [
  'google/gemini-2.5-flash',
  'google/gemini-2.5-pro',
  'openai/gpt-5-mini',
  'openai/gpt-5',
] as const;

export const AGENT_PROVIDERS = ['google', 'openai'] as const;
export type AgentProvider = (typeof AGENT_PROVIDERS)[number];

// Models that support priority/fast serving tier (see ai-models-chat catalog).
export const FAST_MODE_MODELS: readonly (typeof AGENT_MODELS)[number][] = [
  'openai/gpt-5',
  'openai/gpt-5-mini',
];

export const modelProvider = (m: string): AgentProvider =>
  (m.split('/')[0] as AgentProvider) ?? 'google';

export const modelsForProvider = (p: AgentProvider) =>
  AGENT_MODELS.filter((m) => modelProvider(m) === p);

export const agentFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Nome tem de ter pelo menos 2 caracteres').max(80, 'Nome deve ter no máximo 80 caracteres'),
    description: z.string().trim().max(240, 'Descrição deve ter no máximo 240 caracteres'),
    provider: z.enum(AGENT_PROVIDERS, { errorMap: () => ({ message: 'Fornecedor inválido' }) }),
    model: z.enum(AGENT_MODELS, { errorMap: () => ({ message: 'Modelo inválido' }) }),
    systemPrompt: z.string().trim().min(10, 'Instruções devem ter pelo menos 10 caracteres').max(8000, 'Instruções devem ter no máximo 8000 caracteres'),
    status: z.enum(['draft', 'active']),
    temperature: z.number({ invalid_type_error: 'Temperatura tem de ser um número' }).min(0, 'Temperatura mínima é 0').max(2, 'Temperatura máxima é 2'),
    maxTokens: z.number({ invalid_type_error: 'Máx. tokens tem de ser um número' }).int('Máx. tokens tem de ser inteiro').min(128, 'Mínimo 128 tokens').max(32000, 'Máximo 32000 tokens'),
    fastMode: z.boolean(),
  })
  .refine((v) => modelProvider(v.model) === v.provider, {
    message: 'O modelo não pertence ao fornecedor selecionado',
    path: ['model'],
  })
  .refine((v) => !v.fastMode || FAST_MODE_MODELS.includes(v.model), {
    message: 'Fast mode não é suportado por este modelo',
    path: ['fastMode'],
  });

export type AgentFormValues = {
  name: string;
  description: string;
  provider: AgentProvider;
  model: (typeof AGENT_MODELS)[number];
  systemPrompt: string;
  status: 'draft' | 'active';
  temperature: number;
  maxTokens: number;
  fastMode: boolean;
};


export type AgentFormErrors = Partial<Record<keyof AgentFormValues, string>>;

export function validateAgentForm(values: unknown): {
  ok: boolean;
  data?: AgentFormValues;
  errors?: AgentFormErrors;
} {
  const parsed = agentFormSchema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data as AgentFormValues };
  const errors: AgentFormErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof AgentFormValues | undefined;
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
