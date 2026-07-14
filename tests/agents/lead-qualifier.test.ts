import { describe, it, expect } from 'vitest';
import { LeadQualifierOutput, validateBusinessRules, containsPtBr } from '../../src/lib/agenticSchemas';

/**
 * Suite de testes do Lead Qualifier.
 * Usa fixtures síncronas + mock de resposta do modelo. Para correr contra o
 * modelo real, substitui `mockRun` por um wrapper que invoque a edge function.
 */

type LeadInput = {
  name: string;
  email: string;
  company?: string;
  service?: string;
  message?: string;
  cargo?: string;
  utm_source?: string;
};

// Mock: em produção substituir por chamada real ao agente
async function mockRun(input: LeadInput) {
  const seniorDecider = /ceo|cto|director|founder/i.test(input.cargo ?? '');
  return {
    classification: seniorDecider ? 'quente' : 'morno',
    justification: seniorDecider ? 'Cargo decisor sénior' : 'Contacto de nível médio',
    tags: ['channel-direct', input.utm_source ? `utm-${input.utm_source}` : 'utm-none'],
    nextAction: seniorDecider ? 'Agendar demo' : 'Nutrir com conteúdo',
    score: seniorDecider ? 80 : 45,
  };
}

describe('Lead Qualifier', () => {
  it('valida contrato de saída (Zod)', async () => {
    const out = await mockRun({ name: 'X', email: 'x@x.pt', cargo: 'CEO' });
    const parsed = LeadQualifierOutput.safeParse(out);
    expect(parsed.success).toBe(true);
  });

  it('respeita regras de negócio (score, tags)', async () => {
    const out = await mockRun({ name: 'X', email: 'x@x.pt', cargo: 'CTO', utm_source: 'linkedin' });
    const check = validateBusinessRules('Lead Qualifier', out);
    expect(check.ok).toBe(true);
  });

  it('classifica cargo decisor como quente', async () => {
    const out = await mockRun({ name: 'Y', email: 'y@y.pt', cargo: 'Founder' });
    expect(out.classification).toBe('quente');
    expect(out.score).toBeGreaterThanOrEqual(60);
  });

  it('não classifica contacto júnior como quente', async () => {
    const out = await mockRun({ name: 'Z', email: 'z@z.pt', cargo: 'Estagiário' });
    expect(out.classification).not.toBe('quente');
  });

  it('rejeita output com score inválido', () => {
    const bad = { classification: 'quente' as const, justification: '', tags: ['a'], nextAction: 'x', score: 150 };
    const check = validateBusinessRules('Lead Qualifier', bad);
    expect(check.ok).toBe(false);
  });

  it('rejeita output sem tags', () => {
    const bad = { classification: 'morno' as const, justification: '', tags: [], nextAction: 'x', score: 50 };
    const check = validateBusinessRules('Lead Qualifier', bad);
    expect(check.ok).toBe(false);
  });

  it('justificação não usa PT-BR', async () => {
    const out = await mockRun({ name: 'X', email: 'x@x.pt', cargo: 'CEO' });
    expect(containsPtBr(out.justification)).toBe(false);
  });
});
