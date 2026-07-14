import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BOOKING_URL, cardBooking, shortenUrl, _resetShortUrlCache } from "./booking.ts";

const originalFetch = globalThis.fetch;
function stubFetch(handler: (url: string) => Response | Promise<Response>) {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    return Promise.resolve(handler(url));
  }) as typeof fetch;
}
function restoreFetch() { globalThis.fetch = originalFetch; }

Deno.test("shortenUrl returns is.gd short URL on success", async () => {
  _resetShortUrlCache();
  stubFetch(() => new Response("https://is.gd/abc123", { status: 200 }));
  try {
    const short = await shortenUrl(BOOKING_URL);
    assertEquals(short, "https://is.gd/abc123");
  } finally { restoreFetch(); }
});

Deno.test("shortenUrl caches results (single fetch for repeated calls)", async () => {
  _resetShortUrlCache();
  let calls = 0;
  stubFetch(() => { calls++; return new Response("https://is.gd/cached", { status: 200 }); });
  try {
    await shortenUrl(BOOKING_URL);
    await shortenUrl(BOOKING_URL);
    await shortenUrl(BOOKING_URL);
    assertEquals(calls, 1);
  } finally { restoreFetch(); }
});

Deno.test("shortenUrl falls back to full URL on non-2xx response", async () => {
  _resetShortUrlCache();
  stubFetch(() => new Response("rate limited", { status: 429 }));
  try {
    const short = await shortenUrl(BOOKING_URL);
    assertEquals(short, BOOKING_URL);
  } finally { restoreFetch(); }
});

Deno.test("shortenUrl falls back to full URL when provider returns non-http body", async () => {
  _resetShortUrlCache();
  stubFetch(() => new Response("Error: invalid URL", { status: 200 }));
  try {
    const short = await shortenUrl(BOOKING_URL);
    assertEquals(short, BOOKING_URL);
  } finally { restoreFetch(); }
});

Deno.test("shortenUrl falls back to full URL when fetch throws (network error)", async () => {
  _resetShortUrlCache();
  stubFetch(() => { throw new Error("network down"); });
  try {
    const short = await shortenUrl(BOOKING_URL);
    assertEquals(short, BOOKING_URL);
  } finally { restoreFetch(); }
});

Deno.test("cardBooking includes short link, full fallback URL and reply-with-day-and-hour option", async () => {
  _resetShortUrlCache();
  stubFetch(() => new Response("https://is.gd/xyz", { status: 200 }));
  try {
    const msg = await cardBooking("Maria", "2026-07-20", "15:00");
    assertStringIncludes(msg, "Reunião com Maria");
    assertStringIncludes(msg, "2026-07-20");
    assertStringIncludes(msg, "às 15:00");
    // Shortened link present
    assertStringIncludes(msg, "https://is.gd/xyz");
    // Full booking URL fallback also present
    assertStringIncludes(msg, BOOKING_URL);
    // "Responder com dia e hora" fallback option present
    assertStringIncludes(msg, "responde aqui com *dia e hora*");
    assert(msg.includes("1️⃣") && msg.includes("2️⃣"), "must show 2 options");
  } finally { restoreFetch(); }
});

Deno.test("cardBooking still shows reply-with-day-and-hour option when shortener fails", async () => {
  _resetShortUrlCache();
  stubFetch(() => new Response("bad", { status: 500 }));
  try {
    const msg = await cardBooking("João");
    // Both link occurrences collapse to the full URL when shortener fails
    assertStringIncludes(msg, BOOKING_URL);
    assertStringIncludes(msg, "responde aqui com *dia e hora*");
  } finally { restoreFetch(); }
});
