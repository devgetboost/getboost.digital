export interface PhoneValidationResult {
  valid: boolean;
  phone: string | null;
  error: string | null;
}

/**
 * Normaliza e valida um número de telefone para o formato E.164.
 *
 * Regras:
 * - Se começar com '+', mantém o '+' e valida o restante.
 * - Se tiver apenas 9 dígitos (PT), adiciona +351.
 * - Se tiver 10–15 dígitos sem '+', adiciona '+' (assume código de país incluído).
 * - Mínimo de dígitos após código: 7.
 * - Máximo total de dígitos: 15.
 *
 * @param raw Número bruto (ex: "912345678", "+351 912 345 678", "351912345678")
 */
export function normalizeToE164(raw: string): PhoneValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { valid: false, phone: null, error: "Número de telefone em falta." };
  }

  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");

  if (!digitsOnly) {
    return { valid: false, phone: null, error: "Número de telefone inválido (sem dígitos)." };
  }

  let e164: string;

  if (hasPlus) {
    e164 = `+${digitsOnly}`;
  } else if (digitsOnly.length === 9) {
    // Número português sem indicativo
    e164 = `+351${digitsOnly}`;
  } else if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
    // Assume código de país já presente nos dígitos
    e164 = `+${digitsOnly}`;
  } else if (digitsOnly.length < 9) {
    return { valid: false, phone: null, error: "Número demasiado curto (mín. 9 dígitos)." };
  } else {
    return { valid: false, phone: null, error: "Número demasiado longo (máx. 15 dígitos)." };
  }

  // Validação final E.164: +[1-3 dígitos de código][7-13 dígitos de número]
  const match = e164.match(/^\+(\d{1,3})(\d{7,13})$/);
  if (!match) {
    return { valid: false, phone: null, error: "Formato E.164 inválido." };
  }

  const countryCode = match[1];
  const national = match[2];
  const totalDigits = countryCode.length + national.length;

  if (totalDigits < 7 || totalDigits > 15) {
    return { valid: false, phone: null, error: "Comprimento E.164 fora dos limites (7–15 dígitos)." };
  }

  return { valid: true, phone: e164, error: null };
}

/**
 * Formata um número E.164 para visualização amigável (ex: +351 912 345 678).
 */
export function formatE164ForDisplay(e164: string): string {
  if (!e164.startsWith("+")) return e164;
  const digits = e164.slice(1);
  if (digits.startsWith("351") && digits.length === 12) {
    return `+351 ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return e164;
}
