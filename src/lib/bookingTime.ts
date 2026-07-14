// Single source of truth for booking time-zone conversion.
// meeting_time is always stored as an HH:mm string in Europe/Lisbon local time
// alongside meeting_date (YYYY-MM-DD). Every page in the booking flow must
// derive its displayed time via convertSlotToTz to avoid divergences.

export type TimezoneKey = 'lisbon' | 'madeira' | 'azores' | 'brazil';

export const BOOKING_TIMEZONES: Record<TimezoneKey, string> = {
  lisbon: 'Europe/Lisbon',
  madeira: 'Atlantic/Madeira',
  azores: 'Atlantic/Azores',
  brazil: 'America/Sao_Paulo',
};

const TIMEZONE_ALIASES: Record<string, TimezoneKey> = {
  lisbon: 'lisbon', lisboa: 'lisbon', portugal: 'lisbon', 'europe/lisbon': 'lisbon',
  madeira: 'madeira', 'atlantic/madeira': 'madeira',
  azores: 'azores', acores: 'azores', açores: 'azores', 'atlantic/azores': 'azores',
  brazil: 'brazil', brasil: 'brazil', brasilia: 'brazil', 'brasília': 'brazil',
  'america/sao_paulo': 'brazil', 'sao_paulo': 'brazil',
};

/**
 * Normalize any user/input timezone value into a valid TimezoneKey.
 * Accepts aliases (case/accents-insensitive); falls back to 'lisbon'.
 */
export function normalizeTimezone(input: unknown): TimezoneKey {
  if (typeof input !== 'string') return 'lisbon';
  const key = input.trim().toLowerCase();
  if (!key) return 'lisbon';
  if (key in BOOKING_TIMEZONES) return key as TimezoneKey;
  return TIMEZONE_ALIASES[key] ?? 'lisbon';
}

export function isValidTimezone(input: unknown): input is TimezoneKey {
  return typeof input === 'string' && input in BOOKING_TIMEZONES;
}

/**
 * Parse a YYYY-MM-DD string or Date into a UTC-anchored Date. Native
 * `new Date(str)` is locale-dependent; this keeps parsing deterministic.
 */
export function parseMeetingDate(input: string | Date): Date | null {
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (!input) return null;
  const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
  const dmy = input.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    let year = parseInt(y);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, +m - 1, +d));
  }
  return null;
}

/**
 * Convert an HH:mm Lisbon-local slot on a given date into HH:mm in the
 * selected target timezone. Returns the original slot when the target is
 * Lisbon or when inputs are invalid.
 */
export function convertSlotToTz(
  date: string | Date,
  slot: string,
  tzKey: TimezoneKey | string,
): string {
  const tzKeyNorm = normalizeTimezone(tzKey);
  const targetTz = BOOKING_TIMEZONES[tzKeyNorm];
  if (targetTz === 'Europe/Lisbon') return slot;

  const parsed = parseMeetingDate(date);
  if (!parsed) return slot;
  const [h, m] = slot.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return slot;

  const y = parsed.getUTCFullYear();
  const mo = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const d = String(parsed.getUTCDate()).padStart(2, '0');

  // Take the wall-clock (Y-M-D h:m) tagged as UTC, then compute Lisbon's
  // offset for that same instant to find the real UTC instant that Lisbon
  // sees as h:m.
  const guess = new Date(
    `${y}-${mo}-${d}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`,
  );
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Lisbon',
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).formatToParts(guess).reduce<Record<string, string>>((a, p) => (a[p.type] = p.value, a), {});
  const asLisbon = Date.UTC(
    Number(parts.year), Number(parts.month) - 1, Number(parts.day),
    Number(parts.hour) % 24, Number(parts.minute),
  );
  const utcInstant = new Date(guess.getTime() - (asLisbon - guess.getTime()));

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: targetTz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(utcInstant);
}

/** Compose displayed slot with timezone label, e.g. "15:00 · Brasília (14:00 Lisboa)". */
export function formatSlotWithTz(
  date: string | Date,
  slot: string,
  tzKey: TimezoneKey | string,
  tzLabel: string,
  lisbonLabel = 'Lisboa',
): string {
  const tzKeyNorm = normalizeTimezone(tzKey);
  const converted = convertSlotToTz(date, slot, tzKeyNorm);
  if (tzKeyNorm === 'lisbon') return `${slot} · ${tzLabel}`;
  return `${converted} · ${tzLabel} (${slot} ${lisbonLabel})`;
}
