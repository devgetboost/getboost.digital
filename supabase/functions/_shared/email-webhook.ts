// Local webhook verification (R2C).
//
// Replaces `npm:@lovable.dev/webhooks-js` with a dependency-free
// reimplementation of the exact same wire protocol, so existing senders keep
// working with only a secret-value change:
//
//   - signature header `x-lovable-signature`, timestamp header
//     `x-lovable-timestamp` (names kept deliberately — renaming them would
//     break every sender);
//   - signed payload `${timestamp}.${rawBody}`, HMAC-SHA256 hex prefixed
//     `sha256=`, constant-time comparison;
//   - 5-minute timestamp tolerance, 1 MB body cap;
//   - secret rotation via the `secrets` array (primary first).
//
// Error codes mirror the library (`missing_timestamp`, `invalid_timestamp`,
// `stale_timestamp`, `body_too_large`, `missing_secret`, `invalid_signature`,
// `invalid_payload`, `invalid_json`) so callers' switch statements behave
// identically.

export class WebhookError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

const SIGNATURE_HEADER = "x-lovable-signature";
const TIMESTAMP_HEADER = "x-lovable-timestamp";
const TOLERANCE_MS = 300_000;
const MAX_BODY_BYTES = 1_048_576;

async function hmacHex(message: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return "sha256=" + Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function parseTimestamp(raw: string): number {
  const asNumber = Number(raw);
  if (Number.isFinite(asNumber)) {
    return Math.abs(asNumber) < 1e12 ? asNumber * 1000 : asNumber;
  }
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return parsed;
  throw new WebhookError("invalid_timestamp", "Invalid webhook timestamp");
}

export type VerifyWebhookOptions<T = unknown> = {
  req: Request;
  /** Primary secret. */
  secret?: string | null;
  /** Rotation secrets, tried after the primary. */
  secrets?: Array<string | null | undefined>;
  signatureHeader?: string;
  timestampHeader?: string;
  toleranceMs?: number;
  maxBodyBytes?: number;
  /** Parses the raw body. Throw to produce `invalid_payload`. */
  parser?: (raw: string) => T;
};

export async function verifyWebhookSignature(options: {
  signedPayload: string;
  signature: string | null;
  secret?: string | null;
  secrets?: Array<string | null | undefined>;
}): Promise<boolean> {
  const { signedPayload, signature, secret, secrets } = options;
  if (!signature) return false;
  const candidates = [secret, ...(secrets ?? [])].filter((s): s is string => !!s);
  if (candidates.length === 0) throw new WebhookError("missing_secret", "Missing webhook secret");
  for (const candidate of candidates) {
    if (timingSafeEqual(signature, await hmacHex(signedPayload, candidate))) return true;
  }
  return false;
}

export async function verifyWebhookRequest<T = unknown>(
  options: VerifyWebhookOptions<T>,
): Promise<{ body: string; payload: T; timestamp: string }> {
  const {
    req,
    secret,
    secrets,
    signatureHeader = SIGNATURE_HEADER,
    timestampHeader = TIMESTAMP_HEADER,
    toleranceMs = TOLERANCE_MS,
    maxBodyBytes = MAX_BODY_BYTES,
    parser,
  } = options;

  const signature = req.headers.get(signatureHeader);
  const timestampRaw = req.headers.get(timestampHeader);
  if (!timestampRaw) throw new WebhookError("missing_timestamp", "Missing webhook timestamp");

  const timestamp = parseTimestamp(timestampRaw);
  if (Math.abs(Date.now() - timestamp) > toleranceMs) {
    throw new WebhookError("stale_timestamp", "Webhook timestamp outside tolerance window");
  }

  const body = await req.text();
  if (new TextEncoder().encode(body).length > maxBodyBytes) {
    throw new WebhookError("body_too_large", "Webhook body exceeds size limit");
  }

  const valid = await verifyWebhookSignature({
    signedPayload: `${timestampRaw}.${body}`,
    signature,
    secret,
    secrets,
  });
  if (!valid) throw new WebhookError("invalid_signature", "Invalid webhook signature");

  const parse = parser ?? ((raw: string) => JSON.parse(raw) as T);
  try {
    return { body, payload: parse(body), timestamp: timestampRaw };
  } catch {
    throw new WebhookError(
      parser ? "invalid_payload" : "invalid_json",
      parser ? "Failed to parse webhook payload" : "Invalid JSON in request body",
    );
  }
}
