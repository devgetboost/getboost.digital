import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseBookingReply, isConfirmation } from "./parseBookingReply.ts";

// Reference "now": Monday, 2026-07-13 (matches project current date).
const NOW = new Date(2026, 6, 13, 9, 0, 0); // month is 0-indexed

Deno.test("parses DD/MM às HHh", () => {
  assertEquals(parseBookingReply("23/07 às 15h", NOW), { date: "2026-07-23", time: "15:00" });
});

Deno.test("parses DD-MM-YYYY HH:MM", () => {
  assertEquals(parseBookingReply("23-07-2026 15:30", NOW), { date: "2026-07-23", time: "15:30" });
});

Deno.test("parses ISO date + 24h time", () => {
  assertEquals(parseBookingReply("marca 2026-07-23 15:00 por favor", NOW), { date: "2026-07-23", time: "15:00" });
});

Deno.test("parses HHhMM", () => {
  assertEquals(parseBookingReply("dia 23/07 às 15h30", NOW), { date: "2026-07-23", time: "15:30" });
});

Deno.test("parses 'amanhã às 10h'", () => {
  assertEquals(parseBookingReply("amanhã às 10h", NOW), { date: "2026-07-14", time: "10:00" });
});

Deno.test("parses 'quinta às 15h' → next Thursday", () => {
  // Monday 2026-07-13 → next Thursday is 2026-07-16
  assertEquals(parseBookingReply("quinta às 15h", NOW), { date: "2026-07-16", time: "15:00" });
});

Deno.test("parses 'próxima terça 10:30' → jumps a week", () => {
  // Monday 2026-07-13 → next Tuesday = 2026-07-14, "próxima terça" = 2026-07-21
  assertEquals(parseBookingReply("próxima terça 10:30", NOW), { date: "2026-07-21", time: "10:30" });
});

Deno.test("parses English 'tomorrow at 3pm'", () => {
  assertEquals(parseBookingReply("tomorrow at 3pm", NOW), { date: "2026-07-14", time: "15:00" });
});

Deno.test("parses Spanish 'mañana a las 9h'", () => {
  assertEquals(parseBookingReply("mañana a las 9h", NOW), { date: "2026-07-14", time: "09:00" });
});

Deno.test("rolls DD/MM to next year when already past", () => {
  // Reference now = 2026-07-13; "10/03" already passed → 2027-03-10
  assertEquals(parseBookingReply("10/03 às 11h", NOW), { date: "2027-03-10", time: "11:00" });
});

Deno.test("returns empty when nothing parseable", () => {
  const r = parseBookingReply("olá, tudo bem?", NOW);
  assertEquals(r.date, undefined);
  assertEquals(r.time, undefined);
});

Deno.test("isConfirmation detects PT/EN/ES affirmatives", () => {
  assert(isConfirmation("sim"));
  assert(isConfirmation("Sim, confirmo"));
  assert(isConfirmation("ok"));
  assert(isConfirmation("yes please"));
  assert(isConfirmation("sí"));
  assert(!isConfirmation("não"));
  assert(!isConfirmation("later"));
});
