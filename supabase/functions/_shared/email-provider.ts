// Provider-neutral transactional email layer (R2C).
//
// Before R2C the queue dispatcher called `sendLovableEmail` from
// `npm:@lovable.dev/email-js`, with the endpoint, auth key and error taxonomy
// hard-wired to Lovable. This module is the single place that knows how to
// send an email:
//
//   - `sendEmail()` resolves the active provider from `EMAIL_PROVIDER`
//     (default `resend`), maps the queue payload onto the provider request,
//     and returns the provider's message id.
//   - Failures throw `EmailProviderError`, which carries the HTTP `status` and
//     an optional `retryAfterSeconds` so the queue's existing retry taxonomy
//     (429 → cooldown, 401/403 → DLQ, else counted retry) works unchanged.
//   - A missing provider key throws a CONFIG error that matches none of the
//     retry branches — it surfaces as a counted failure and DLQs after the
//     normal budget, exactly like any other permanent sender failure.
//
// To add a provider: add its name to `EmailProviderName`, its sender to
// `PROVIDER_SENDERS`, and its key name to `providerKeyName()`. No call site
// changes.

export type EmailProviderName = "resend";

export const DEFAULT_EMAIL_PROVIDER: EmailProviderName = "resend";

const RESEND_API_URL = "https://api.resend.com/emails";

/** Reads the active provider. Anything unrecognised falls back to default. */
export function resolveEmailProvider(): EmailProviderName {
  const raw = (Deno.env.get("EMAIL_PROVIDER") ?? "").trim().toLowerCase();
  if (raw === "resend") return "resend";
  return DEFAULT_EMAIL_PROVIDER;
}

function providerKeyName(provider: EmailProviderName): string {
  return "RESEND_API_KEY";
}

export type SendEmailRequest = {
  to: string;
  from: string;
  subject: string;
  html?: string | null;
  text?: string | null;
  /** Passed as `Idempotency-Key`; the provider dedupes redeliveries. */
  idempotencyKey?: string | null;
  /**
   * When present, RFC 8058 one-click List-Unsubscribe headers are attached,
   * pointing at our own unsubscribe endpoint. The token itself is never sent
   * anywhere except inside that URL.
   */
  unsubscribeToken?: string | null;
  headers?: Record<string, string>;
};

export type SendEmailResult = {
  /** The provider's message id. */
  id: string;
  provider: EmailProviderName;
};

/**
 * Structured send failure. `status` mirrors the provider HTTP status so the
 * queue can route: 429 → cooldown, 401/403 → DLQ, anything else → retry.
 */
export class EmailProviderError extends Error {
  readonly status?: number;
  readonly retryAfterSeconds?: number | null;

  constructor(message: string, status?: number, retryAfterSeconds?: number | null) {
    super(message);
    this.name = "EmailProviderError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds ?? null;
  }
}

function configError(provider: EmailProviderName): EmailProviderError {
  return new EmailProviderError(`${providerKeyName(provider)} not configured`);
}

/** Builds the List-Unsubscribe URL for a token, or null when unavailable. */
export function unsubscribeUrlForToken(token: string): string | null {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  if (!supabaseUrl) return null;
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`;
}

async function sendViaResend(req: SendEmailRequest, apiKey: string): Promise<SendEmailResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    ...(req.idempotencyKey ? { "Idempotency-Key": req.idempotencyKey } : {}),
  };

  const emailHeaders: Record<string, string> = { ...(req.headers ?? {}) };
  if (req.unsubscribeToken) {
    const url = unsubscribeUrlForToken(req.unsubscribeToken);
    if (url) {
      emailHeaders["List-Unsubscribe"] = `<${url}>`;
      emailHeaders["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
  }

  const body: Record<string, unknown> = {
    from: req.from,
    to: [req.to],
    subject: req.subject,
  };
  if (req.html != null) body.html = req.html;
  if (req.text != null) body.text = req.text;
  if (Object.keys(emailHeaders).length > 0) body.headers = emailHeaders;

  let response: Response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (e) {
    throw new EmailProviderError(`Email send failed: ${(e as Error).message}`);
  }

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    let retryAfter: number | null = null;
    const retryHeader = response.headers.get("retry-after");
    if (retryHeader) {
      const parsed = Number(retryHeader);
      retryAfter = Number.isFinite(parsed) ? parsed : null;
    }
    throw new EmailProviderError(
      `Email send failed (${response.status}): ${errText.slice(0, 500) || response.statusText}`,
      response.status,
      retryAfter,
    );
  }

  const json = await response.json().catch(() => ({} as Record<string, unknown>));
  const id = typeof json?.id === "string" ? json.id : "";
  return { id, provider: "resend" };
}

/**
 * Sends one transactional email through the active provider.
 *
 * Returns the provider message id. Throws `EmailProviderError` on any
 * failure — including a missing provider key — so callers keep a single
 * try/catch send path.
 */
export async function sendEmail(req: SendEmailRequest): Promise<SendEmailResult> {
  const provider = resolveEmailProvider();
  const apiKey = Deno.env.get(providerKeyName(provider));
  if (!apiKey) throw configError(provider);
  return sendViaResend(req, apiKey);
}
