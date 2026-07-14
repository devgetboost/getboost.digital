// Pure helpers for the meeting invite card. Kept in a side-effect-free module
// so unit tests can import them without booting Deno.serve / Supabase client.

export const BOOKING_URL = "https://getboost.digital/booking";

// ── Timezone helpers ─────────────────────────────────────────────────────
// Aliases the assistant accepts and maps to IANA identifiers.
const TZ_ALIASES: Record<string, string> = {
  lisbon: "Europe/Lisbon", lisboa: "Europe/Lisbon", portugal: "Europe/Lisbon",
  "europe/lisbon": "Europe/Lisbon",
  madeira: "Atlantic/Madeira", "atlantic/madeira": "Atlantic/Madeira",
  azores: "Atlantic/Azores", acores: "Atlantic/Azores", "atlantic/azores": "Atlantic/Azores",
  brazil: "America/Sao_Paulo", brasil: "America/Sao_Paulo",
  brasilia: "America/Sao_Paulo", "brasília": "America/Sao_Paulo",
  "america/sao_paulo": "America/Sao_Paulo", sao_paulo: "America/Sao_Paulo",
};

export function normalizeIanaTz(input?: string): string {
  if (!input) return "Europe/Lisbon";
  const key = input.trim().toLowerCase();
  return TZ_ALIASES[key] ?? input; // pass through any other valid IANA id
}

export function tzLabel(iana: string): string {
  if (iana === "Europe/Lisbon") return "Lisboa";
  if (iana === "America/Sao_Paulo") return "Brasília";
  if (iana === "Atlantic/Madeira") return "Madeira";
  if (iana === "Atlantic/Azores") return "Açores";
  return iana;
}

/** Convert HH:mm on YYYY-MM-DD from `fromTz` into HH:mm on `toTz`. */
export function convertTime(date: string, time: string, fromTz: string, toTz: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) return time;
  if (fromTz === toTz) return time;
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  // Interpret wall time as UTC then find the fromTz offset for that instant.
  const guess = new Date(Date.UTC(y, mo - 1, d, h, mi));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: fromTz, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  }).formatToParts(guess).reduce<Record<string, string>>((a, p) => (a[p.type] = p.value, a), {});
  const asFrom = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute);
  const utc = new Date(guess.getTime() - (asFrom - guess.getTime()));
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: toTz, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(utc);
}

export function formatTimeLine(date: string | undefined, time: string | undefined, iana: string): string {
  if (!time) return "";
  const label = tzLabel(iana);
  if (iana === "Europe/Lisbon" || !date) return `${time} · ${label}`;
  const lisbon = convertTime(date, time, iana, "Europe/Lisbon");
  return `${time} · ${label} (${lisbon} Lisboa)`;
}


const shortUrlCache = new Map<string, string>();
export function _resetShortUrlCache() { shortUrlCache.clear(); }

export async function shortenUrl(url: string): Promise<string> {
  if (shortUrlCache.has(url)) return shortUrlCache.get(url)!;
  const ac = new AbortController();
  const to = setTimeout(() => ac.abort(), 2000);
  try {
    const r = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`, { signal: ac.signal });
    if (r.ok) {
      const short = (await r.text()).trim();
      if (short.startsWith("http")) {
        shortUrlCache.set(url, short);
        return short;
      }
    }
  } catch (e) {
    console.warn(JSON.stringify({ tag: "shorten_url_failed", url, error: String(e) }));
  } finally {
    clearTimeout(to);
  }
  return url;
}

export async function cardBooking(
  name: string,
  date?: string,
  time?: string,
  timezone?: string,
): Promise<string> {
  const iana = normalizeIanaTz(timezone);
  const line = date && time ? formatTimeLine(date, time, iana) : time ? `${time} · ${tzLabel(iana)}` : "";
  const when = date ? `\n📅 ${date}${line ? ` às ${line}` : ""}` : "";
  const short = await shortenUrl(BOOKING_URL);
  return [
    `📞 *Reunião com ${name}*${when}`,
    "",
    "Tens 2 formas rápidas de fechar:",
    `1️⃣ Escolhe um horário no link 👉 ${short}`,
    `   (versão completa: ${BOOKING_URL})`,
    "2️⃣ Se o link não abrir, responde aqui com *dia e hora* (ex: _quinta às 15h_) que eu trato do resto ✅",
    "",
    "_Recebes email de confirmação com o link Jitsi._",
  ].join("\n");
}

// ── Alternativas quando a janela preferida está ocupada ──────────────────
// Regra de negócio: se o slot pedido não está disponível, oferecemos até
// N alternativas próximas (mesmo dia primeiro, depois dias seguintes). Só
// mostramos o link do booking quando existirem alternativas concretas — se
// não houver, escalamos e prometemos volta manual, para nunca "empurrar" o
// link cegamente.

export type SlotCandidate = { date: string; time: string };

export type AttemptRecord = { date: string; time: string; at?: string };

export type LeadContact = {
  name: string;
  email?: string;
  phone?: string;
};

export type EscalationPayload = {
  name: string;
  email?: string;
  phone?: string;
  preferred: SlotCandidate;
  timezone: string;
  attempts: AttemptRecord[];
  reason: "no_availability";
};

export type SuggestOptions = {
  maxSameDay?: number;
  maxNextDays?: number;
  timezone?: string;
  attempts?: AttemptRecord[];
  contact?: LeadContact;
  notifyDirector?: (payload: EscalationPayload) => void | Promise<void>;
};

export type SuggestResult = {
  hasAlternatives: boolean;
  sameDay: SlotCandidate[];
  nextDays: SlotCandidate[];
  message: string;
  offerBookingLink: boolean;
  escalation?: EscalationPayload;
  validation?: ContactValidationResult;
};

export type ContactField = "name" | "email" | "phone";

export type ContactValidationResult = {
  valid: boolean;
  missing: ContactField[];
  invalid: ContactField[];
  message: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valida nome, email e telefone antes de sugerir horários. Feedback imediato. */
export function validateLeadContact(contact: Partial<LeadContact> | undefined): ContactValidationResult {
  const missing: ContactField[] = [];
  const invalid: ContactField[] = [];

  const name = (contact?.name ?? "").trim();
  const email = (contact?.email ?? "").trim();
  const phoneRaw = (contact?.phone ?? "").trim();

  if (!name) missing.push("name");
  else if (name.length < 2) invalid.push("name");

  if (!email) missing.push("email");
  else if (!EMAIL_RE.test(email) || email.length > 255) invalid.push("email");

  if (!phoneRaw) missing.push("phone");
  else {
    const hasPlus = phoneRaw.startsWith("+");
    const digits = phoneRaw.replace(/\D/g, "");
    let e164: string | null = null;
    if (hasPlus) e164 = `+${digits}`;
    else if (digits.length === 9) e164 = `+351${digits}`;
    else if (digits.length >= 10 && digits.length <= 15) e164 = `+${digits}`;
    if (!e164 || !/^\+(\d{1,3})(\d{7,13})$/.test(e164)) invalid.push("phone");
  }

  const valid = missing.length === 0 && invalid.length === 0;
  const label: Record<ContactField, string> = { name: "nome", email: "email", phone: "telefone/WhatsApp" };
  const parts: string[] = [];
  if (missing.length) parts.push(`em falta: ${missing.map((f) => label[f]).join(", ")}`);
  if (invalid.length) parts.push(`inválido: ${invalid.map((f) => label[f]).join(", ")}`);
  const message = valid
    ? ""
    : `Antes de sugerir horários preciso dos teus dados (${parts.join("; ")}). ` +
      `Podes confirmar nome, email e número de WhatsApp (com indicativo, ex: +351 912 345 678)?`;

  return { valid, missing, invalid, message };
}

function minutesOf(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

export function suggestAlternatives(
  name: string,
  preferred: SlotCandidate,
  availableByDate: Record<string, string[]>,
  opts: SuggestOptions = {},
): SuggestResult {
  const maxSameDay = opts.maxSameDay ?? 2;
  const maxNextDays = opts.maxNextDays ?? 2;

  // Feedback imediato: se o contacto foi fornecido mas está incompleto/inválido,
  // não sugerimos horários — pedimos os dados em falta primeiro.
  if (opts.contact !== undefined) {
    const validation = validateLeadContact(opts.contact);
    if (!validation.valid) {
      return {
        hasAlternatives: false,
        sameDay: [],
        nextDays: [],
        offerBookingLink: false,
        message: validation.message,
        validation,
      };
    }
  }


  const sameDaySlots = (availableByDate[preferred.date] ?? [])
    .filter((t) => t !== preferred.time)
    .sort((a, b) => Math.abs(minutesOf(a) - minutesOf(preferred.time)) - Math.abs(minutesOf(b) - minutesOf(preferred.time)))
    .slice(0, maxSameDay)
    .map((time) => ({ date: preferred.date, time }));

  const nextDayEntries = Object.keys(availableByDate)
    .filter((d) => d > preferred.date && (availableByDate[d]?.length ?? 0) > 0)
    .sort()
    .slice(0, maxNextDays)
    .map((d) => ({ date: d, time: availableByDate[d][0] }));

  const hasAlternatives = sameDaySlots.length > 0 || nextDayEntries.length > 0;
  const offerBookingLink = hasAlternatives;

  if (!hasAlternatives) {
    const escalation: EscalationPayload = {
      name,
      email: opts.contact?.email,
      phone: opts.contact?.phone,
      preferred,
      timezone: opts.timezone ?? "Europe/Lisbon",
      attempts: opts.attempts ?? [{ date: preferred.date, time: preferred.time }],
      reason: "no_availability",
    };
    if (opts.notifyDirector) {
      try {
        const p = opts.notifyDirector(escalation);
        if (p && typeof (p as Promise<void>).catch === "function") {
          (p as Promise<void>).catch((e) =>
            console.warn(JSON.stringify({ tag: "notify_director_failed", error: String(e) })),
          );
        }
      } catch (e) {
        console.warn(JSON.stringify({ tag: "notify_director_failed", error: String(e) }));
      }
    }
    return {
      hasAlternatives: false,
      sameDay: [],
      nextDays: [],
      offerBookingLink: false,
      escalation,
      message:
        `${name}, o horário ${preferred.date} às ${preferred.time} não está disponível ` +
        `e também não tenho janelas próximas nos dias a seguir. 😕\n` +
        `Deixa-me passar isto ao nosso Director Comercial para te propor alternativas — volto a ti por aqui hoje mesmo.`,
    };
  }

  const bullets: string[] = [];
  for (const s of sameDaySlots) bullets.push(`• *${s.date}* às *${s.time}* (mesmo dia)`);
  for (const s of nextDayEntries) bullets.push(`• *${s.date}* às *${s.time}*`);

  const message =
    `${name}, o horário ${preferred.date} às ${preferred.time} já está ocupado. ` +
    `Deixo-te aqui as janelas mais próximas:\n` +
    bullets.join("\n") +
    `\n\nQual destas preferes? Responde com a que te dá mais jeito que eu confirmo.`;

  return {
    hasAlternatives: true,
    sameDay: sameDaySlots,
    nextDays: nextDayEntries,
    offerBookingLink,
    message,
  };
}


