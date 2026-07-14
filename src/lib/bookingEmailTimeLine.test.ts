import { describe, it, expect } from 'vitest';
import { formatBookingEmailTimeLine } from '../../supabase/functions/_shared/formatBookingEmailTimeLine';
import { convertSlotToTz } from './bookingTime';

// These tests guarantee the confirmation-email "Hora" line keeps the exact
// format `HH:MM · Fuso (HH:MM Lisboa)` for every non-Lisbon timezone.

const DATE = '2026-07-15'; // summer

describe('formatBookingEmailTimeLine', () => {
  it('Lisbon: "HH:MM · Lisboa" (no parenthetical)', () => {
    const line = formatBookingEmailTimeLine({
      meetingTime: '15:00',
      timezone: 'lisbon',
      timezoneLabel: 'Lisboa',
      meetingTimeLisbon: '15:00',
    });
    expect(line).toBe('15:00 · Lisboa');
  });

  it('Brazil: "HH:MM · Brasília (HH:MM Lisboa)"', () => {
    const converted = convertSlotToTz(DATE, '15:00', 'brazil');
    const line = formatBookingEmailTimeLine({
      meetingTime: converted,
      timezone: 'brazil',
      timezoneLabel: 'Brasília',
      meetingTimeLisbon: '15:00',
    });
    expect(line).toBe(`${converted} · Brasília (15:00 Lisboa)`);
    expect(line).toMatch(/^\d{2}:\d{2} · Brasília \(\d{2}:\d{2} Lisboa\)$/);
  });

  it('Azores: "HH:MM · Açores (HH:MM Lisboa)"', () => {
    const converted = convertSlotToTz(DATE, '15:00', 'azores');
    const line = formatBookingEmailTimeLine({
      meetingTime: converted,
      timezone: 'azores',
      timezoneLabel: 'Açores',
      meetingTimeLisbon: '15:00',
    });
    expect(line).toBe(`${converted} · Açores (15:00 Lisboa)`);
    expect(line).toMatch(/^\d{2}:\d{2} · Açores \(\d{2}:\d{2} Lisboa\)$/);
  });

  it('Madeira: "HH:MM · Madeira (HH:MM Lisboa)"', () => {
    const converted = convertSlotToTz(DATE, '15:00', 'madeira');
    const line = formatBookingEmailTimeLine({
      meetingTime: converted,
      timezone: 'madeira',
      timezoneLabel: 'Madeira',
      meetingTimeLisbon: '15:00',
    });
    expect(line).toBe(`${converted} · Madeira (15:00 Lisboa)`);
    expect(line).toMatch(/^\d{2}:\d{2} · Madeira \(\d{2}:\d{2} Lisboa\)$/);
  });

  it('every non-Lisbon timezone renders with the Lisboa parenthetical', () => {
    const cases: Array<{ tz: 'brazil' | 'azores' | 'madeira'; label: string }> = [
      { tz: 'brazil', label: 'Brasília' },
      { tz: 'azores', label: 'Açores' },
      { tz: 'madeira', label: 'Madeira' },
    ];
    for (const { tz, label } of cases) {
      const converted = convertSlotToTz(DATE, '09:30', tz);
      const line = formatBookingEmailTimeLine({
        meetingTime: converted,
        timezone: tz,
        timezoneLabel: label,
        meetingTimeLisbon: '09:30',
      });
      expect(line).toBe(`${converted} · ${label} (09:30 Lisboa)`);
    }
  });

  it('drops timezone label gracefully when missing', () => {
    expect(
      formatBookingEmailTimeLine({ meetingTime: '15:00' }),
    ).toBe('15:00');
  });

  it('returns empty string when meetingTime is missing', () => {
    expect(formatBookingEmailTimeLine({})).toBe('');
  });

  it('does not add parenthetical when Lisbon slot is missing', () => {
    const line = formatBookingEmailTimeLine({
      meetingTime: '11:00',
      timezone: 'brazil',
      timezoneLabel: 'Brasília',
    });
    expect(line).toBe('11:00 · Brasília');
  });
});
