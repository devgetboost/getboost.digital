import { describe, it, expect } from 'vitest';
import { ContentEditorOutput, validateBusinessRules, containsPtBr } from '../../src/lib/agenticSchemas';

async function mockRun(briefing: string) {
  return {
    title: 'IA para PMEs: guia prático 2026',
    metaDescription: 'Descobre como implementar IA na tua PME com passos concretos, exemplos reais e ROI mensurável.',
    slug: 'ia-para-pmes-guia-2026',
    outline: ['O que é IA aplicada', 'Casos de uso', 'Riscos e mitigações', 'Próximos passos'],
    body: `# IA para PMEs\n\nBriefing: ${briefing}\n\nConteúdo em markdown...`,
    tags: ['ia', 'pmes', 'automação'],
    cta: 'Adoraria conhecer o teu projecto e trabalhar contigo. Vamos criar algo extraordinário.',
  };
}

describe('Content Editor', () => {
  it('valida contrato', async () => {
    const out = await mockRun('IA para PMEs em Portugal');
    expect(ContentEditorOutput.safeParse(out).success).toBe(true);
  });

  it('respeita regras SEO (título, meta, CTA)', async () => {
    const out = await mockRun('teste');
    expect(validateBusinessRules('Content Editor', out).ok).toBe(true);
  });

  it('inclui CTA final obrigatório', async () => {
    const out = await mockRun('teste');
    expect(out.cta).toContain('extraordinário');
  });

  it('rejeita título demasiado longo', () => {
    const bad = { title: 'x'.repeat(100), metaDescription: 'ok', slug: 's', outline: [], body: '', tags: [], cta: 'extraordinário' };
    expect(validateBusinessRules('Content Editor', bad).ok).toBe(false);
  });

  it('rejeita meta description demasiado longa', () => {
    const bad = { title: 'ok', metaDescription: 'x'.repeat(200), slug: 's', outline: [], body: '', tags: [], cta: 'extraordinário' };
    expect(validateBusinessRules('Content Editor', bad).ok).toBe(false);
  });

  it('não usa PT-BR no corpo', async () => {
    const out = await mockRun('teste');
    expect(containsPtBr(out.body)).toBe(false);
  });
});
