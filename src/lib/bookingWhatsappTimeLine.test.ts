import { describe, it, expect } from 'vitest';
import { convertSlotToTz, formatSlotWithTz, parseMeetingDate } from './bookingTime';

// Garante que a linha "Hora" enviada em mensagens WhatsApp respeita o formato
// `HH:MM · Fuso (HH:MM Lisboa)` em todos os fusos suportados.
// A função `formatSlotWithTz` é a fonte única usada por email e WhatsApp.

const SUMMER = '2026-07-15';
const WINTER = '2026-01-15';
const HORA_LINE = /^Hora: \d{2}:\d{2} · .+ \(\d{2}:\d{2} Lisboa\)$/;

/** Simula o render de uma mensagem WhatsApp usando o mesmo helper partilhado. */
function renderWhatsappMessage(
  date: string,
  slot: string,
  tz: 'lisbon' | 'madeira' | 'azores' | 'brazil',
  tzLabel: string,
): string {
  return [
    'Olá Maria,',
    `Data: ${date}`,
    `Hora: ${formatSlotWithTz(date, slot, tz, tzLabel)}`,
  ].join('\n');
}

describe('WhatsApp "Hora" line rendering', () => {
  it('Lisboa: "Hora: HH:MM · Lisboa" (sem parenteses)', () => {
    const msg = renderWhatsappMessage(SUMMER, '15:00', 'lisbon', 'Lisboa');
    expect(msg).toContain('Hora: 15:00 · Lisboa');
    expect(msg).not.toMatch(/Lisboa\)/);
  });

  it('Brasil (verão, -4h): "Hora: 11:00 · Brasília (15:00 Lisboa)"', () => {
    const msg = renderWhatsappMessage(SUMMER, '15:00', 'brazil', 'Brasília');
    expect(msg).toContain('Hora: 11:00 · Brasília (15:00 Lisboa)');
    const line = msg.split('\n').find(l => l.startsWith('Hora:'))!;
    expect(line).toMatch(HORA_LINE);
  });

  it('Brasil (inverno, -3h): "Hora: 12:00 · Brasília (15:00 Lisboa)"', () => {
    const msg = renderWhatsappMessage(WINTER, '15:00', 'brazil', 'Brasília');
    expect(msg).toContain('Hora: 12:00 · Brasília (15:00 Lisboa)');
  });

  it('Açores (verão, -1h): "Hora: 14:00 · Açores (15:00 Lisboa)"', () => {
    const msg = renderWhatsappMessage(SUMMER, '15:00', 'azores', 'Açores');
    expect(msg).toContain('Hora: 14:00 · Açores (15:00 Lisboa)');
  });

  it('Madeira: "Hora: 15:00 · Madeira (15:00 Lisboa)" (mesmo relógio de Lisboa)', () => {
    const msg = renderWhatsappMessage(SUMMER, '15:00', 'madeira', 'Madeira');
    expect(msg).toContain('Hora: 15:00 · Madeira (15:00 Lisboa)');
  });

  it('todos os fusos não-Lisboa cumprem o regex `HH:MM · Fuso (HH:MM Lisboa)`', () => {
    const cases: Array<{ tz: 'brazil' | 'azores' | 'madeira'; label: string }> = [
      { tz: 'brazil', label: 'Brasília' },
      { tz: 'azores', label: 'Açores' },
      { tz: 'madeira', label: 'Madeira' },
    ];
    for (const { tz, label } of cases) {
      const msg = renderWhatsappMessage(SUMMER, '09:30', tz, label);
      const line = msg.split('\n').find(l => l.startsWith('Hora:'))!;
      expect(line).toMatch(HORA_LINE);
      expect(line).toContain(`· ${label} `);
      expect(line.endsWith('(09:30 Lisboa)')).toBe(true);
    }
  });

  it('data em DD/MM/YYYY produz a mesma linha que ISO (parity com backend)', () => {
    const iso = renderWhatsappMessage(SUMMER, '15:00', 'brazil', 'Brasília');
    const dmy = renderWhatsappMessage('15/07/2026', '15:00', 'brazil', 'Brasília');
    // A "Data:" difere (string bruta), a "Hora:" deve ser idêntica.
    const isoHora = iso.split('\n').find(l => l.startsWith('Hora:'));
    const dmyHora = dmy.split('\n').find(l => l.startsWith('Hora:'));
    expect(isoHora).toBe(dmyHora);
  });

  it('helper paridade: WhatsApp usa exactamente o mesmo output que email/UI', () => {
    // convertSlotToTz é a fonte para email, UI e WhatsApp: qualquer divergência
    // implicaria fusos diferentes entre canais.
    const parsed = parseMeetingDate(SUMMER)!;
    const email = convertSlotToTz(parsed, '15:00', 'brazil');
    const whatsapp = formatSlotWithTz(SUMMER, '15:00', 'brazil', 'Brasília');
    expect(whatsapp.startsWith(email)).toBe(true);
  });
});
