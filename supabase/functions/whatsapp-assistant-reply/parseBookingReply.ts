// Parses free-form user replies containing a day and time into
// { date: "YYYY-MM-DD", time: "HH:MM" } so the assistant can re-invoke
// `agendar_reuniao` with structured args.
//
// Supported inputs (PT/EN/ES, case-insensitive):
//   • "23/07 às 15h", "23-07-2026 15:00", "23/7 as 15h30"
//   • "2026-07-23 15:00", "2026-07-23T15:00"
//   • "quinta às 15h", "próxima terça 10:30", "amanhã às 9h"
//   • "tomorrow 10am", "next monday at 3pm", "mañana a las 15h"
//
// Reference "now" is injectable for deterministic tests.

export type ParsedBooking = {
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM (24h)
  timezone?: string;
};

const WEEKDAYS: Record<string, number> = {
  // PT
  domingo: 0, segunda: 1, terca: 2, terça: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6, sábado: 6,
  // EN
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  // ES
  domingo_es: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado_es: 6, sábado_es: 6,
};

function stripAccents(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function pad2(n: number) { return String(n).padStart(2, "0"); }

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// ── Time parsing ──────────────────────────────────────────────────────────
function parseTime(text: string): string | undefined {
  const t = text.toLowerCase();

  // 15:30 / 15h30 / 15h / 15:00
  let m = t.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/);
  if (m) return `${pad2(+m[1])}:${m[2]}`;
  m = t.match(/\b([01]?\d|2[0-3])h\b/);
  if (m) return `${pad2(+m[1])}:00`;

  // 3pm / 10 am / 3:30pm
  m = t.match(/\b(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)\b/);
  if (m) {
    let h = +m[1] % 12;
    if (m[3] === "pm") h += 12;
    return `${pad2(h)}:${m[2] ?? "00"}`;
  }

  // "às 9", "as 15", "a las 9" — bare hour after time preposition
  m = t.match(/\b(?:às|as|a las|at)\s+([01]?\d|2[0-3])\b(?!\s*[:/-])/);
  if (m) return `${pad2(+m[1])}:00`;

  return undefined;
}

// ── Date parsing ──────────────────────────────────────────────────────────
function parseExplicitDate(text: string, now: Date): string | undefined {
  // ISO YYYY-MM-DD
  let m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    if (d.getUTCDate() === +m[3] && d.getUTCMonth() === +m[2] - 1) {
      return `${m[1]}-${m[2]}-${m[3]}`;
    }
    return undefined;
  }

  // DD/MM or DD-MM optionally with year (DD/MM/YYYY, DD/MM/YY)
  m = text.match(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/);
  if (m) {
    const day = +m[1];
    const month = +m[2];
    let year = m[3] ? +m[3] : now.getFullYear();
    if (year < 100) year += 2000;
    if (month < 1 || month > 12 || day < 1 || day > 31) return undefined;
    const d = new Date(Date.UTC(year, month - 1, day));
    if (d.getUTCDate() !== day || d.getUTCMonth() !== month - 1) return undefined;
    // If no year given and the date already passed this year, roll to next year.
    if (!m[3]) {
      const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
      if (d.getTime() < todayUtc) {
        return `${year + 1}-${pad2(month)}-${pad2(day)}`;
      }
    }
    return `${year}-${pad2(month)}-${pad2(day)}`;
  }

  return undefined;
}

function parseRelativeDate(text: string, now: Date): string | undefined {
  const t = stripAccents(text.toLowerCase());

  if (/\bhoje\b|\btoday\b|\bhoy\b/.test(t)) return toIsoDate(now);
  if (/\bamanha\b|\btomorrow\b|\bmanana\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 1); return toIsoDate(d);
  }
  if (/\bdepois de amanha\b|\bday after tomorrow\b|\bpasado manana\b/.test(t)) {
    const d = new Date(now); d.setDate(d.getDate() + 2); return toIsoDate(d);
  }

  // Weekday, optionally preceded by "próxima/proximo/next"
  const wdKeys = Object.keys(WEEKDAYS).map((k) => k.replace(/_es$/, ""));
  const wdRe = new RegExp(`\\b(proxima|proximo|next)?\\s*(${wdKeys.join("|")})\\b`);
  const m = t.match(wdRe);
  if (m) {
    const target = WEEKDAYS[m[2]] ?? WEEKDAYS[`${m[2]}_es`];
    if (target === undefined) return undefined;
    const cur = now.getDay();
    let diff = (target - cur + 7) % 7;
    if (diff === 0 || m[1]) diff += 7; // "próxima X" or same weekday → next week
    if (diff === 0) diff = 7;
    const d = new Date(now); d.setDate(d.getDate() + diff);
    return toIsoDate(d);
  }

  return undefined;
}

export function parseBookingReply(
  message: string,
  now: Date = new Date(),
): ParsedBooking {
  if (!message) return {};
  const cleaned = message.trim();
  const date = parseExplicitDate(cleaned, now) ?? parseRelativeDate(cleaned, now);
  const time = parseTime(cleaned);
  return { date, time };
}

// True when the message is a confirmation reply (sim/ok/confirmo/yes/sí).
export function isConfirmation(message: string): boolean {
  if (!message) return false;
  const t = stripAccents(message.trim().toLowerCase());
  return /^(sim|ok|okay|okey|confirmo|confirmado|yes|yeah|yep|si|claro|perfeito|combinado|d'?acordo|de acordo)\b/.test(t);
}
