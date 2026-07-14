import { z } from 'zod';
import { assertAdmin } from './agenticGuard';

export type AgentProvider =
  | 'lovable'
  | 'openai'
  | 'google'
  | 'openai_direct'
  | 'anthropic_direct'
  | 'google_direct';

export type AgentSettings = {
  provider: AgentProvider;
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  fastMode: boolean;
};

export type SettingsErrors = Partial<Record<keyof AgentSettings, string>>;

const KEY = 'agentic_ai_settings_v1';

const DEFAULTS: AgentSettings = {
  provider: 'lovable',
  defaultModel: 'google/gemini-3-flash-preview',
  temperature: 0.7,
  maxTokens: 2048,
  fastMode: false,
};

// Models that support fast mode (priority serving tier).
export const FAST_MODE_SUPPORTED = ['openai/gpt-5', 'openai/gpt-5-mini', 'openai/gpt-5-nano'];

export const settingsSchema = z
  .object({
    provider: z.enum(
      ['lovable', 'openai', 'google', 'openai_direct', 'anthropic_direct', 'google_direct'],
      { errorMap: () => ({ message: 'Fornecedor inválido' }) },
    ),
    defaultModel: z.string().trim().min(1, 'Seleciona um modelo padrão'),
    temperature: z
      .number({ invalid_type_error: 'Temperatura tem de ser um número' })
      .min(0, 'Temperatura mínima é 0')
      .max(2, 'Temperatura máxima é 2'),
    maxTokens: z
      .number({ invalid_type_error: 'Máx. tokens tem de ser um número' })
      .int('Máx. tokens tem de ser inteiro')
      .min(128, 'Mínimo 128 tokens')
      .max(32000, 'Máximo 32000 tokens'),
    fastMode: z.boolean(),
  })
  .refine((v) => !v.fastMode || FAST_MODE_SUPPORTED.includes(v.defaultModel), {
    message: 'Fast mode só é suportado pelos modelos OpenAI GPT-5*',
    path: ['fastMode'],
  });

export function validateSettings(values: unknown): {
  ok: boolean;
  data?: AgentSettings;
  errors?: SettingsErrors;
} {
  const parsed = settingsSchema.safeParse(values);
  if (parsed.success) return { ok: true, data: parsed.data as AgentSettings };
  const errors: SettingsErrors = {};
  for (const issue of parsed.error.issues) {
    const k = issue.path[0] as keyof AgentSettings | undefined;
    if (k && !errors[k]) errors[k] = issue.message;
  }
  return { ok: false, errors };
}

// Secret name validation for API keys added via chat.
const SECRET_NAME_RE = /^[A-Z][A-Z0-9_]{2,63}$/;
export function validateSecretName(name: string): string | null {
  if (!name.trim()) return 'Nome da chave é obrigatório';
  if (!SECRET_NAME_RE.test(name.trim()))
    return 'Nome inválido. Usa MAIÚSCULAS, dígitos e "_" (ex: OPENAI_API_KEY)';
  return null;
}

export function getSettings(): AgentSettings {
  if (typeof window === 'undefined') return DEFAULTS;
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return DEFAULTS; }
}

export async function saveSettings(s: AgentSettings): Promise<void> {
  const result = validateSettings(s);
  if (!result.ok) {
    const first = Object.values(result.errors ?? {})[0] ?? 'Configurações inválidas';
    throw new Error(first);
  }
  await assertAdmin();
  localStorage.setItem(KEY, JSON.stringify(result.data!));
}

export const PROVIDERS = [
  { id: 'lovable', label: 'Lovable AI Gateway', description: 'Padrão. Sem chave necessária.', requiresKey: null },
  { id: 'openai', label: 'OpenAI (via Lovable)', description: 'Modelos GPT via gateway.', requiresKey: null },
  { id: 'google', label: 'Google (via Lovable)', description: 'Modelos Gemini via gateway.', requiresKey: null },
  { id: 'openai_direct', label: 'OpenAI (direto)', description: 'Chamadas diretas à API OpenAI. Requer OPENAI_API_KEY.', requiresKey: 'OPENAI_API_KEY' },
  { id: 'anthropic_direct', label: 'Anthropic (direto)', description: 'Chamadas diretas à API Anthropic. Requer ANTHROPIC_API_KEY.', requiresKey: 'ANTHROPIC_API_KEY' },
  { id: 'google_direct', label: 'Google AI (direto)', description: 'Chamadas diretas à API Google. Requer GOOGLE_API_KEY.', requiresKey: 'GOOGLE_API_KEY' },
] as const;

export const MODELS: { id: string; label: string; providers: AgentProvider[] }[] = [
  // Via Lovable gateway
  { id: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview) — padrão', providers: ['lovable', 'google'] },
  { id: 'google/gemini-3.5-flash', label: 'Gemini 3.5 Flash', providers: ['lovable', 'google'] },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', providers: ['lovable', 'google'] },
  { id: 'google/gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite', providers: ['lovable', 'google'] },
  { id: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', providers: ['lovable', 'google'] },
  { id: 'openai/gpt-5', label: 'GPT-5', providers: ['lovable', 'openai'] },
  { id: 'openai/gpt-5-mini', label: 'GPT-5 Mini', providers: ['lovable', 'openai'] },
  { id: 'openai/gpt-5-nano', label: 'GPT-5 Nano', providers: ['lovable', 'openai'] },
  // Direct providers
  { id: 'gpt-5', label: 'GPT-5 (direto)', providers: ['openai_direct'] },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini (direto)', providers: ['openai_direct'] },
  { id: 'gpt-4o', label: 'GPT-4o (direto)', providers: ['openai_direct'] },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (direto)', providers: ['openai_direct'] },
  { id: 'claude-opus-4', label: 'Claude Opus 4 (direto)', providers: ['anthropic_direct'] },
  { id: 'claude-sonnet-4', label: 'Claude Sonnet 4 (direto)', providers: ['anthropic_direct'] },
  { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet (direto)', providers: ['anthropic_direct'] },
  { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku (direto)', providers: ['anthropic_direct'] },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (direto)', providers: ['google_direct'] },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (direto)', providers: ['google_direct'] },
];

export function modelsForProvider(provider: AgentProvider) {
  return MODELS.filter(m => m.providers.includes(provider));
}
