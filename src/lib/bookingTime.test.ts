import { describe, it, expect } from 'vitest';
import { convertSlotToTz, formatSlotWithTz, parseMeetingDate, BOOKING_TIMEZONES } from './bookingTime';

// Fixed summer date (Europe/Lisbon = UTC+1, Sao_Paulo = UTC-3, Azores = UTC+0)
const SUMMER = '2026-07-15';
// Fixed winter date (Europe/Lisbon = UTC+0, Sao_Paulo = UTC-3, Azores = UTC-1)
const WINTER = '2026-01-15';

describe('convertSlotToTz', () => {
  it('returns the original slot for Lisbon target', () => {
    expect(convertSlotToTz(SUMMER, '15:00', 'lisbon')).toBe('15:00');
    expect(convertSlotToTz(WINTER, '09:30', 'lisbon')).toBe('09:30');
  });

  it('converts Lisbon slot to Brasília (summer, -4h)', () => {
    expect(convertSlotToTz(SUMMER, '15:00', 'brazil')).toBe('11:00');
  });

  it('converts Lisbon slot to Brasília (winter, -3h)', () => {
    expect(convertSlotToTz(WINTER, '15:00', 'brazil')).toBe('12:00');
  });

  it('converts Lisbon slot to Azores (summer, -1h)', () => {
    expect(convertSlotToTz(SUMMER, '15:00', 'azores')).toBe('14:00');
  });

  it('Madeira matches Lisbon wall-clock', () => {
    expect(convertSlotToTz(SUMMER, '10:00', 'madeira')).toBe('10:00');
    expect(convertSlotToTz(WINTER, '10:00', 'madeira')).toBe('10:00');
  });

  it('accepts DD/MM/YYYY date format with the same result', () => {
    expect(convertSlotToTz('15/07/2026', '15:00', 'brazil')).toBe(
      convertSlotToTz(SUMMER, '15:00', 'brazil'),
    );
  });

  it('accepts a Date object with the same result', () => {
    const d = parseMeetingDate(SUMMER)!;
    expect(convertSlotToTz(d, '15:00', 'brazil')).toBe(
      convertSlotToTz(SUMMER, '15:00', 'brazil'),
    );
  });

  it('is deterministic across repeated calls (email/CRM parity)', () => {
    const runs = Array.from({ length: 5 }, () =>
      convertSlotToTz(SUMMER, '09:30', 'brazil'),
    );
    expect(new Set(runs).size).toBe(1);
  });

  it('produces identical output for all call sites (Step4, Step5, email, admin)', () => {
    // Simulates the different pages calling the same helper with the same inputs.
    const inputs: Array<[string, string, keyof typeof BOOKING_TIMEZONES]> = [
      [SUMMER, '09:00', 'brazil'],
      [SUMMER, '15:00', 'azores'],
      [WINTER, '11:30', 'brazil'],
      [WINTER, '17:00', 'madeira'],
    ];
    for (const [date, slot, tz] of inputs) {
      const step4 = convertSlotToTz(date, slot, tz);
      const step5 = convertSlotToTz(date, slot, tz);
      const email = convertSlotToTz(date, slot, tz);
      const admin = convertSlotToTz(date, slot, tz);
      expect(step4).toBe(step5);
      expect(step5).toBe(email);
      expect(email).toBe(admin);
    }
  });

  it('falls back to the original slot on invalid inputs', () => {
    expect(convertSlotToTz('not-a-date', '15:00', 'brazil')).toBe('15:00');
    expect(convertSlotToTz(SUMMER, 'xx:yy', 'brazil')).toBe('xx:yy');
    expect(convertSlotToTz(SUMMER, '15:00', 'mars' as never)).toBe('15:00');
  });
});

describe('formatSlotWithTz', () => {
  it('shows only slot + label for Lisbon', () => {
    expect(formatSlotWithTz(SUMMER, '15:00', 'lisbon', 'Lisboa')).toBe('15:00 · Lisboa');
  });

  it('shows converted slot with Lisbon reference for other timezones', () => {
    expect(formatSlotWithTz(SUMMER, '15:00', 'brazil', 'Brasília')).toBe(
      '11:00 · Brasília (15:00 Lisboa)',
    );
  });
});

describe('parseMeetingDate', () => {
  it('parses ISO YYYY-MM-DD', () => {
    expect(parseMeetingDate('2026-07-15')?.toISOString()).toBe('2026-07-15T00:00:00.000Z');
  });
  it('parses DD/MM/YYYY', () => {
    expect(parseMeetingDate('15/07/2026')?.toISOString()).toBe('2026-07-15T00:00:00.000Z');
  });
  it('returns null on garbage', () => {
    expect(parseMeetingDate('foo')).toBeNull();
  });
});
