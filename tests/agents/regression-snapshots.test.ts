import { describe, it, expect } from 'vitest';
import {
  LeadQualifierOutput,
  WhatsAppConciergeOutput,
  BookingAssistantOutput,
  ContentEditorOutput,
  CampaignStrategistOutput,
} from '../../src/lib/agenticSchemas';

/**
 * Testes de regressão com snapshots.
 * Cada agente tem inputs-âncora determinísticos. As respostas dos mocks
 * (representativas do formato esperado da versão aprovada) são gravadas como
 * snapshots. Uma alteração no contrato ou no output "canónico" quebra o teste
 * e força revisão manual antes de aprovar a nova versão.
 *
 * Para correr contra o modelo real, substituir os mocks por wrappers que
 * invoquem a edge function `agentic-agent-test` e mantenham temperatura 0.
 */

// ---------- Mocks determinísticos ----------
async function runLeadQualifier(input: { cargo?: string; utm_source?: string }) {
  const senior = /ceo|cto|director|founder/i.test(input.cargo ?? '');
  return {
    classification: senior ? 'quente' : 'morno',
    justification: senior ? 'Cargo decisor sénior' : 'Contacto de nível médio',
    tags: ['channel-direct', input.utm_source ? `utm-${input.utm_source}` : 'utm-none'],
    nextAction: senior ? 'Agendar demo' : 'Nutrir com conteúdo',
    score: senior ? 80 : 45,
  };
}

async function runWhatsApp(msg: string) {
  const urgency = /urgente|processo|advogado/i.test(msg);
  return {
    reply: urgency ? 'Vou passar já a um colega humano.' : 'Olá! Como posso ajudar?',
    handoff: urgency,
    handoffCategory: urgency ? ('urgency' as const) : ('none' as const),
  };
}

async function runBooking() {
  return {
    message: 'Confirmamos a tua reunião para amanhã às 10h.',
    action: 'confirm' as const,
    includesLink: true,
  };
}

async function runContentEditor() {
  return {
    title: 'Como escalar operações com IA em 2026',
    metaDescription: 'Guia prático para PMEs adotarem IA sem enganos, com passos claros e métricas.',
    slug: 'escalar-operacoes-ia-2026',
    outline: ['Contexto', 'Onde começar', 'Erros comuns', 'Métricas'],
    body: 'Este artigo cobre os passos essenciais para escalar operações com IA.',
    tags: ['ia', 'operacoes', 'pmes'],
    cta: 'Fala connosco para um diagnóstico gratuito.',
  };
}

async function runCampaign() {
  return {
    segment: 'leads utm=linkedin',
    estimatedReach: 1240,
    subjectLines: ['Guia rápido: IA sem enganos', 'A tua vantagem competitiva', 'Pequenos passos'],
    preheader: 'Curto, útil, direto ao ponto.',
    firstParagraph: 'Olá — este mês reunimos os aprendizados com mais impacto.',
  };
}

describe('Regressão — snapshots de respostas', () => {
  it('Lead Qualifier — cargo sénior', async () => {
    const out = await runLeadQualifier({ cargo: 'CEO', utm_source: 'linkedin' });
    expect(LeadQualifierOutput.parse(out)).toMatchSnapshot();
  });

  it('Lead Qualifier — cargo médio', async () => {
    const out = await runLeadQualifier({ cargo: 'Analista' });
    expect(LeadQualifierOutput.parse(out)).toMatchSnapshot();
  });

  it('WhatsApp Concierge — mensagem normal', async () => {
    const out = await runWhatsApp('Olá, quero saber preços.');
    expect(WhatsAppConciergeOutput.parse(out)).toMatchSnapshot();
  });

  it('WhatsApp Concierge — handoff urgência', async () => {
    const out = await runWhatsApp('É urgente, tenho um processo do advogado.');
    expect(WhatsAppConciergeOutput.parse(out)).toMatchSnapshot();
  });

  it('Booking Assistant — confirmação', async () => {
    const out = await runBooking();
    expect(BookingAssistantOutput.parse(out)).toMatchSnapshot();
  });

  it('Content Editor — artigo base', async () => {
    const out = await runContentEditor();
    expect(ContentEditorOutput.parse(out)).toMatchSnapshot();
  });

  it('Campaign Strategist — nurturing', async () => {
    const out = await runCampaign();
    expect(CampaignStrategistOutput.parse(out)).toMatchSnapshot();
  });
});
