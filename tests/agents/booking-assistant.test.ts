import { describe, it, expect } from 'vitest';
import { BookingAssistantOutput } from '../../src/lib/agenticSchemas';

async function mockRun(evt: 'created' | 'reminder_24h' | 'reschedule' | 'completed') {
  const link = 'https://meet.jit.si/getboost-abc';
  switch (evt) {
    case 'created': return { message: `Reunião confirmada. Link: ${link}`, action: 'confirm' as const, includesLink: true };
    case 'reminder_24h': return { message: `Lembrete: reunião amanhã. Link: ${link}`, action: 'remind' as const, includesLink: true };
    case 'reschedule': return { message: 'Aqui vão 3 slots alternativos.', action: 'reschedule' as const, includesLink: false };
    case 'completed': return { message: `Obrigado! Resumo e próximos passos: ${link}`, action: 'follow_up' as const, includesLink: true };
  }
}

describe('Booking Assistant', () => {
  it('valida contrato', async () => {
    const out = await mockRun('created');
    expect(BookingAssistantOutput.safeParse(out).success).toBe(true);
  });

  it('confirmação inclui link', async () => {
    const out = await mockRun('created');
    expect(out.includesLink).toBe(true);
    expect(out.message).toContain('http');
  });

  it('lembrete 24h identifica evento correto', async () => {
    const out = await mockRun('reminder_24h');
    expect(out.action).toBe('remind');
  });

  it('reagendamento não obriga link', async () => {
    const out = await mockRun('reschedule');
    expect(out.action).toBe('reschedule');
  });

  it('follow-up pós-reunião correto', async () => {
    const out = await mockRun('completed');
    expect(out.action).toBe('follow_up');
  });
});
