import { describe, it, expect } from 'vitest';
import { CampaignStrategistOutput, containsPtBr } from '../../src/lib/agenticSchemas';

async function mockRun(goal: 'nurturing' | 'promo' | 'reengage') {
  return {
    segment: goal === 'reengage' ? 'inativos 90d' : 'leads utm=linkedin',
    estimatedReach: 1240,
    subjectLines: [
      'O que muda em 2026 para PMEs',
      'Guia rápido: IA sem enganos',
      'Pequenos passos, grande impacto',
      'A tua vantagem competitiva',
      'Estás a perder isto?',
    ],
    preheader: 'Curto, útil, direto ao ponto.',
    firstParagraph: 'Olá — este mês reunimos os aprendizados que mais impacto tiveram nos nossos clientes.',
  };
}

describe('Campaign Strategist', () => {
  it('valida contrato', async () => {
    const out = await mockRun('nurturing');
    expect(CampaignStrategistOutput.safeParse(out).success).toBe(true);
  });

  it('gera pelo menos 3 subject lines', async () => {
    const out = await mockRun('promo');
    expect(out.subjectLines.length).toBeGreaterThanOrEqual(3);
  });

  it('subject lines dentro do limite recomendado', async () => {
    const out = await mockRun('promo');
    out.subjectLines.forEach((s) => expect(s.length).toBeLessThanOrEqual(60));
  });

  it('não usa PT-BR', async () => {
    const out = await mockRun('reengage');
    expect(containsPtBr(out.firstParagraph)).toBe(false);
    expect(containsPtBr(out.preheader)).toBe(false);
  });
});
