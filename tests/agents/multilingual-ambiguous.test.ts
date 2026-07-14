import { describe, it, expect } from 'vitest';
import {
  LeadQualifierOutput,
  WhatsAppConciergeOutput,
  BookingAssistantOutput,
  containsPtBr,
  validateBusinessRules,
} from '../../src/lib/agenticSchemas';

/**
 * Testes multi-idioma (pt/en/es) e de entradas ambíguas.
 * Objetivo: confirmar que cada agente:
 *  - deteta corretamente o idioma / intenção mesmo com input ruidoso;
 *  - devolve saídas válidas contra o schema;
 *  - responde sempre em PT-PT (nunca PT-BR);
 *  - lida com casos ambíguos sem colapsar (fallback conservador).
 *
 * Mocks representativos — substituir por chamada real à edge function para
 * validação end-to-end contra a versão aprovada.
 */

type Lang = 'pt' | 'en' | 'es';

function detectLang(text: string): Lang {
  if (/\b(hola|gracias|reunión|quisiera|España)\b/i.test(text)) return 'es';
  if (/\b(hello|thanks|meeting|would like|price)\b/i.test(text)) return 'en';
  return 'pt';
}

// ---------- Lead Qualifier ----------
async function runLead(input: { message: string; cargo?: string }) {
  const senior = /ceo|cto|director|founder|fundador/i.test(input.cargo ?? '');
  const ambiguous = input.message.trim().length < 15 || /\?{2,}|maybe|talvez|quizá/i.test(input.message);
  return {
    classification: ambiguous ? 'frio' : senior ? 'quente' : 'morno',
    justification: ambiguous ? 'Mensagem ambígua, requer follow-up' : senior ? 'Cargo decisor' : 'Perfil intermédio',
    tags: [`lang-${detectLang(input.message)}`, ambiguous ? 'ambiguous' : 'clear'],
    nextAction: ambiguous ? 'Pedir mais contexto' : 'Agendar chamada',
    score: ambiguous ? 20 : senior ? 80 : 50,
  };
}

// ---------- WhatsApp ----------
async function runWhatsApp(msg: string) {
  const urgency = /urgente|urgent|urgente!|emergencia|emergência/i.test(msg);
  const legal = /advogado|lawyer|abogado|processo|lawsuit|demanda/i.test(msg);
  const humanReq = /humano|human|persona|agente real/i.test(msg);
  const handoff = urgency || legal || humanReq;
  const category = urgency ? 'urgency' : legal ? 'complaint_legal' : humanReq ? 'human_request' : 'none';
  return {
    reply: handoff ? 'Vou passar a um colega humano de imediato.' : 'Olá! Em que posso ajudar?',
    handoff,
    handoffCategory: category as 'urgency' | 'complaint_legal' | 'human_request' | 'none',
  };
}

// ---------- Booking ----------
async function runBooking(msg: string) {
  const reschedule = /remarcar|reagendar|reschedule|cambiar|mover/i.test(msg);
  return {
    message: reschedule
      ? 'Sem problema — indica-me a nova data e hora.'
      : 'Confirmamos a tua reunião. Até já!',
    action: (reschedule ? 'reschedule' : 'confirm') as 'reschedule' | 'confirm',
    includesLink: !reschedule,
  };
}

describe('Multi-idioma — deteção e saída correta por agente', () => {
  describe('Lead Qualifier', () => {
    const cases: Array<{ label: string; input: { message: string; cargo?: string }; lang: Lang }> = [
      { label: 'PT claro', input: { message: 'Bom dia, sou CEO e procuro uma solução de CRM.', cargo: 'CEO' }, lang: 'pt' },
      { label: 'EN claro', input: { message: 'Hello, I would like a meeting about pricing.', cargo: 'Founder' }, lang: 'en' },
      { label: 'ES claro', input: { message: 'Hola, quisiera una reunión sobre precios.', cargo: 'Director' }, lang: 'es' },
      { label: 'ambíguo curto', input: { message: 'olá??', cargo: 'analista' }, lang: 'pt' },
      { label: 'ambíguo com talvez', input: { message: 'talvez me interesse, não sei ainda' }, lang: 'pt' },
    ];
    for (const c of cases) {
      it(`${c.label}`, async () => {
        const out = await runLead(c.input);
        expect(LeadQualifierOutput.parse(out)).toBeTruthy();
        expect(validateBusinessRules('Lead Qualifier', out).ok).toBe(true);
        expect(out.tags).toContain(`lang-${c.lang}`);
        expect(containsPtBr(out.justification)).toBe(false);
      });
    }
  });

  describe('WhatsApp Concierge', () => {
    const cases: Array<{ label: string; msg: string; handoff: boolean; category?: string }> = [
      { label: 'PT saudação', msg: 'Olá, quero saber preços', handoff: false },
      { label: 'EN saudação', msg: 'Hello, can I get pricing info?', handoff: false },
      { label: 'ES saudação', msg: 'Hola, ¿me pueden dar precios?', handoff: false },
      { label: 'PT urgência', msg: 'É urgente!!! preciso já', handoff: true, category: 'urgency' },
      { label: 'EN legal', msg: 'I will contact my lawyer', handoff: true, category: 'complaint_legal' },
      { label: 'ES humano', msg: 'quiero hablar con una persona real', handoff: true, category: 'human_request' },
      { label: 'ambíguo emoji-only', msg: '😅😅', handoff: false },
    ];
    for (const c of cases) {
      it(`${c.label}`, async () => {
        const out = await runWhatsApp(c.msg);
        expect(WhatsAppConciergeOutput.parse(out)).toBeTruthy();
        expect(out.handoff).toBe(c.handoff);
        if (c.category) expect(out.handoffCategory).toBe(c.category);
        expect(validateBusinessRules('WhatsApp Concierge', out).ok).toBe(true);
        expect(containsPtBr(out.reply)).toBe(false);
      });
    }
  });

  describe('Booking Assistant', () => {
    const cases: Array<{ label: string; msg: string; action: 'confirm' | 'reschedule' }> = [
      { label: 'PT confirmar', msg: 'Confirmo a reunião de amanhã', action: 'confirm' },
      { label: 'EN reschedule', msg: 'Can we reschedule to Friday?', action: 'reschedule' },
      { label: 'ES remarcar', msg: 'Necesito cambiar la reunión', action: 'reschedule' },
      { label: 'PT remarcar', msg: 'quero reagendar por favor', action: 'reschedule' },
      { label: 'ambíguo vago', msg: 'ok', action: 'confirm' },
    ];
    for (const c of cases) {
      it(`${c.label}`, async () => {
        const out = await runBooking(c.msg);
        expect(BookingAssistantOutput.parse(out)).toBeTruthy();
        expect(out.action).toBe(c.action);
        expect(containsPtBr(out.message)).toBe(false);
      });
    }
  });
});
