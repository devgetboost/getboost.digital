// Shared, dependency-free helper. Used by the booking-confirmation email
// template AND by Vitest tests under src/ to guarantee the "Hora" line
// keeps the format `HH:MM · Fuso (HH:MM Lisboa)` for every timezone.

export interface BookingEmailTimeLineInput {
  meetingTime?: string;        // slot displayed to user, already converted
  timezoneLabel?: string;      // localized label, e.g. "Brasília"
  timezone?: string;           // key, e.g. "lisbon" | "brazil" | ...
  meetingTimeLisbon?: string;  // original Lisbon slot, HH:mm
}

/**
 * Produce the "Hora" value used in booking confirmation emails.
 * Format:
 *   - Lisbon:      "HH:MM · Lisboa"
 *   - Other TZs:   "HH:MM · Fuso (HH:MM Lisboa)"
 *   - Missing tz:  "HH:MM"
 */
export function formatBookingEmailTimeLine(
  input: BookingEmailTimeLineInput,
): string {
  const { meetingTime, timezoneLabel, timezone, meetingTimeLisbon } = input;
  if (!meetingTime) return '';
  let line = meetingTime;
  if (timezoneLabel) line += ` · ${timezoneLabel}`;
  if (timezone && timezone !== 'lisbon' && meetingTimeLisbon) {
    line += ` (${meetingTimeLisbon} Lisboa)`;
  }
  return line;
}
