/**
 * R1C5 Wave 3 — browser contract for the trusted commercial write paths.
 *
 * This is the only place the browser is allowed to submit a lead, a booking or
 * a newsletter subscription. Every call goes to an Edge Function; no page,
 * component or hook calls `.from('leads'|'bookings'|'newsletter_subscribers')`
 * for a write.
 *
 * The functions are invoked with the publishable key only. The service-role
 * key never reaches the browser.
 */

import { supabase } from '@/integrations/supabase/client';
import type { MarketCode } from '@/config/env';

/** Field ceiling mirrored from the server, so the UI can fail early. */
export const COMMERCIAL_FIELD_LIMITS = {
  name: 300,
  email: 254,
  source: 120,
  short: 300,
  text: 4000,
} as const;

export type ConsentFlags = {
  /** Explicit marketing consent. Defaults to false when omitted. */
  marketing?: boolean;
};

export type LeadCaptureInput = {
  source: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
  landing_page?: string | null;
  service_interest?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  market?: MarketCode;
  locale?: string;
  consent?: ConsentFlags;
  /**
   * Fields the pre-2027 forms collected that Clean V1 no longer models as
   * first-class columns. They are forwarded and stored under `metadata.legacy`
   * so nothing submitted is silently lost.
   */
  legacy?: Record<string, string | null | undefined>;
};

export type BookingAction = 'lookup' | 'create' | 'reschedule';

export type BookingInput = {
  action: BookingAction;
  booking_id?: string;
  email?: string;
  name?: string;
  phone?: string | null;
  company?: string | null;
  website?: string | null;
  timezone?: string;
  start_at?: string;
  end_at?: string;
  notes?: string | null;
  market?: MarketCode;
  locale?: string;
  /**
   * Retired pre-2027 meeting/CRM fields, preserved into `metadata.legacy`
   * server-side.
   */
  legacy?: Record<string, string | null | undefined>;
};

export type RescheduleBookingInput = Omit<BookingInput, 'action'> & {
  action: 'reschedule';
  booking_id: string;
  /** The booking email — the only proof of possession a reschedule accepts. */
  email?: string;
};

export type LookupBookingInput = Omit<BookingInput, 'action'> & {
  action: 'lookup';
  booking_id: string;
};

/** Serialises a booking request, dropping keys the server ignores. */
function toBookingPayload(input: BookingInput): Record<string, unknown> {
  const { legacy = {}, ...rest } = input;
  const payload: Record<string, unknown> = { ...rest };
  for (const [key, value] of Object.entries(legacy)) {
    if (value !== undefined && value !== null && value !== '') payload[key] = value;
  }
  return payload;
}

function toLeadPayload(input: LeadCaptureInput): Record<string, unknown> {
  const { legacy = {}, consent, ...rest } = input;
  const payload: Record<string, unknown> = {
    ...rest,
    consent_marketing: consent?.marketing === true,
  };
  for (const [key, value] of Object.entries(legacy)) {
    if (value !== undefined && value !== null && value !== '') payload[key] = value;
  }
  return payload;
}

function toNewsletterPayload(input: NewsletterSubscribeInput): Record<string, unknown> {
  return { ...input };
}

export type NewsletterSubscribeInput = {
  email: string;
  source?: string;
  market?: MarketCode;
  locale?: string;
};

export type LeadCaptureResult = { lead_id: string; market: MarketCode; locale: string };
export type BookingCreateResult = {
  booking_id: string;
  market: MarketCode;
  locale: string;
};
export type BookingLookupResult = {
  booking_id: string;
  name: string;
  email_hint: string;
  timezone: string;
  start_at: string;
  end_at: string;
  reschedulable: boolean;
};
export type BookingRescheduleResult = {
  booking_id: string;
  status: string;
  rescheduled_at: string;
};
export type NewsletterResult = {
  subscriber_id?: string;
  status?: 'already_subscribed';
  subscriber_status?: 'subscribed' | 'unsubscribed' | 'bounced';
  market?: MarketCode;
  locale?: string;
};

/** Error raised by a commercial write path. */
export class CommercialWriteError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'CommercialWriteError';
    this.status = status;
  }
}

type InvokeSuccess<T> = { data: T; error: null };
type InvokeFailure = { data: null; error: CommercialWriteError };
export type InvokeOutcome<T> = InvokeSuccess<T> | InvokeFailure;

/**
 * Runs a call and normalises its failure into `{ error }`, so call sites keep a
 * single success/failure shape regardless of which transport reported it.
 */
async function attempt<T>(run: () => Promise<T>): Promise<InvokeOutcome<T>> {
  try {
    return { data: await run(), error: null };
  } catch (err) {
    const error =
      err instanceof CommercialWriteError
        ? err
        : new CommercialWriteError(err instanceof Error ? err.message : 'Erro inesperado.', 500);
    return { data: null, error };
  }
}

async function invoke<T>(fn: string, body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });

  if (error) {
    // `functions.invoke` wraps non-2xx responses in `FunctionsHttpError`; the
    // JSON body we wrote is on `error.context`.
    const context = (error as { context?: Response }).context;
    if (context && typeof context.json === 'function') {
      try {
        const parsed = (await context.json()) as { error?: string };
        throw new CommercialWriteError(parsed.error ?? error.message, context.status);
      } catch (parseError) {
        if (parseError instanceof CommercialWriteError) throw parseError;
      }
    }
    throw new CommercialWriteError(error.message, 500);
  }

  return data as T;
}

/** Submits a lead. Replaces every browser-side `leads` insert. */
export async function captureLead(
  input: LeadCaptureInput,
): Promise<InvokeOutcome<LeadCaptureResult>> {
  return attempt(() => invoke<LeadCaptureResult>('lead-capture', { ...toLeadPayload(input) }));
}

/**
 * Runs a booking action.
 *
 * A visitor arriving from an email link must confirm the booking email before
 * a reschedule is accepted.
 */
export async function submitBooking(
  input: BookingInput,
): Promise<InvokeOutcome<BookingCreateResult>> {
  return attempt(() => invoke<BookingCreateResult>('booking-request', { ...toBookingPayload(input) }));
}

/** Reschedules an existing booking. Requires the booking email. */
export async function rescheduleBooking(
  input: RescheduleBookingInput,
): Promise<InvokeOutcome<BookingRescheduleResult>> {
  return attempt(() =>
    invoke<BookingRescheduleResult>('booking-request', {
      ...toBookingPayload({ ...input, action: 'reschedule' }),
    }),
  );
}

/** Subscribes an address. Replaces the browser-side newsletter insert. */
export async function subscribeNewsletter(
  input: NewsletterSubscribeInput,
): Promise<InvokeOutcome<NewsletterResult>> {
  return attempt(() => invoke<NewsletterResult>('newsletter-subscribe', { ...toNewsletterPayload(input) }));
}

/** Looks up a booking for the reschedule pre-fill. */
export async function lookupBooking(
  input: LookupBookingInput,
): Promise<InvokeOutcome<BookingLookupResult>> {
  return attempt(() =>
    invoke<BookingLookupResult>('booking-request', { ...toBookingPayload({ ...input, action: 'lookup' }) }),
  );
}

