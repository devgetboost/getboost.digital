import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

const BOOKING = read("src/pages/Booking.tsx");
const CONTACT = read("src/pages/Contact.tsx");

/**
 * R19.4 — Booking + Contact premium migration guards.
 * Light heroes, storytelling sections and authority strips on the frozen
 * systems; forms, validation, tracking, SEO and routes untouched.
 */
describe("R19.4 — booking + contact premium migration", () => {
  it("both heroes are light (no legacy dark manifesto)", () => {
    for (const [name, page] of [["Booking", BOOKING], ["Contact", CONTACT]] as const) {
      const hero = page.slice(page.indexOf("HERO — R19.4"), page.indexOf("AUTHORITY STRIP"));
      expect(hero.length, `${name} hero block found`).toBeGreaterThan(500);
      expect(hero, `${name} hero must be light`).toContain("gb-surface-page");
      expect(hero, `${name} hero must not be dark`).not.toContain("bg-[#0a0603]");
      expect(hero, `${name} scan beam must be gone`).not.toContain("repeat: Infinity");
    }
  });

  it("both pages carry the process MiniFlow and authority strip", () => {
    for (const [name, page] of [["Booking", BOOKING], ["Contact", CONTACT]] as const) {
      expect(page, `${name} MiniFlow`).toContain("<MiniFlow");
      expect(page, `${name} authority strip`).toContain("AUTHORITY STRIP");
      expect(page, `${name} data-driven counts`).toContain("${PRODUCTS.length}");
    }
    expect(BOOKING).toContain("{['IA', 'Software', 'Automação', 'Growth']");
    expect(CONTACT).toContain("{['IA', 'Automação', 'Software', 'Growth']");
  });

  it("conversion logic is byte-preserved (submit/capture/tracking/SEO)", () => {
    expect(BOOKING).toContain("await submitBooking({");
    expect(BOOKING).toContain("analytics.trackBooking('booking', 'booking_success'");
    expect(BOOKING).toContain('canonical="/booking"');
    expect(CONTACT).toContain("await captureLead({");
    expect(CONTACT).toContain("analytics.trackWhatsApp('contact_hero', 'generic')");
    expect(CONTACT).toContain('canonical="/contact"');
  });

  it("runs on the frozen systems (no new animation or style categories)", () => {
    for (const [name, page] of [["Booking", BOOKING], ["Contact", CONTACT]] as const) {
      expect(page, name).toContain("gb-card");
      expect(page, name).toContain("gb-chip");
      expect(page, name).toContain("gb-hairline-accent");
      expect(page, name).not.toContain("setInterval");
    }
  });
});
