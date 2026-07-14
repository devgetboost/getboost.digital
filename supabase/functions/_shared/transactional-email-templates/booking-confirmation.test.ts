// Integration test: render booking-confirmation template and assert it
// includes meeting_link, meetingDate, meetingTime and timezoneLabel for
// multiple timezones.
// Run: deno test --allow-net --allow-env --allow-read supabase/functions/_shared/transactional-email-templates/booking-confirmation.test.ts

import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import * as React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { template } from "./booking-confirmation.tsx";

const BASE = {
  name: "Maria Silva",
  meetingType: "Consulta de Descoberta (30 min)",
  meetingDate: "15 de Janeiro, 2026",
  meetingLink: "https://meet.jit.si/getboost-abc12345-xyz",
  bookingId: "booking-1",
  startAtUtc: "2026-01-15T10:00:00.000Z",
  endAtUtc: "2026-01-15T10:30:00.000Z",
  company: "Empresa Exemplo",
} as const;

const CASES = [
  { timezone: "lisbon",  timezoneLabel: "Lisboa (WET/WEST)",       meetingTime: "10:00", meetingTimeLisbon: "10:00" },
  { timezone: "azores",  timezoneLabel: "Açores (AZOT/AZOST)",     meetingTime: "09:00", meetingTimeLisbon: "10:00" },
  { timezone: "madeira", timezoneLabel: "Madeira (WET/WEST)",      meetingTime: "10:00", meetingTimeLisbon: "10:00" },
  { timezone: "brazil",  timezoneLabel: "Brasil (BRT)",            meetingTime: "07:00", meetingTimeLisbon: "10:00" },
];

for (const c of CASES) {
  Deno.test(`booking-confirmation renders meeting_link/date/time/timezone (${c.timezone})`, async () => {
    const html = await renderAsync(
      React.createElement(template.component, { ...BASE, ...c, language: "pt" as const }),
    );

    assertStringIncludes(html, BASE.meetingLink);
    assertStringIncludes(html, `href="${BASE.meetingLink}"`);
    assertStringIncludes(html, BASE.meetingDate);
    assertStringIncludes(html, c.meetingTime);
    assertStringIncludes(html, c.timezoneLabel);
    // Sanity: labels appear
    assert(/Data/.test(html) && /Hora/.test(html) && /Link da reuni/i.test(html));
  });
}
