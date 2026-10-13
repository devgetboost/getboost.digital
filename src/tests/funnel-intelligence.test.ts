import { describe, expect, it } from "vitest";
import {
  attributeJourney,
  detectLeaks,
  extractJourneys,
  getFormStats,
  getFunnelStats,
  getIntelligenceReport,
  getPillarStats,
  getScrollStats,
  getTopCTAs,
  getTopJourneys,
  getTopPages,
  getTopProducts,
  pillarForPath,
  rankBy,
  type FunnelInputEvent,
} from "../lib/funnel-intelligence";

/**
 * R20.2 — funnel intelligence guards.
 * Pure unit tests over synthetic fixtures (no PII anywhere): attribution,
 * rankings, funnel/leak math, forms, scroll, pillars and the debug report.
 */
const page = (path: string): FunnelInputEvent => ({ name: "page_view", path, title: path });
const click = (category: string, label: string): FunnelInputEvent => ({
  name: "cta_click",
  category,
  label,
});
const submitSuccess = (category: string, journey?: string[]): FunnelInputEvent => ({
  name: "form_submission",
  category,
  label: `${category}_form_success`,
  data: journey ? { journey } : {},
});

describe("R20.2 — attribution", () => {
  it("resolves pillars per path (market prefixes tolerated)", () => {
    expect(pillarForPath("/agentes-ia")).toBe("ai");
    expect(pillarForPath("/br/agentes-ia")).toBe("ai");
    expect(pillarForPath("/solucoes/integracoes-erp-crm")).toBe("automation");
    expect(pillarForPath("/en/solucoes/desenvolvimento-software")).toBe("software");
    expect(pillarForPath("/solucoes/marketing-digital")).toBe("growth");
    expect(pillarForPath("/")).toBeNull();
    expect(pillarForPath("/blog/x")).toBeNull();
    expect(pillarForPath(undefined)).toBeNull();
  });

  it("attributes origin, last page and last pillar", () => {
    expect(attributeJourney(["/", "/agentes-ia", "/booking"])).toEqual({
      origin: "/",
      lastPage: "/booking",
      lastPillar: "ai",
      pillarTouched: true,
      length: 3,
    });
    expect(attributeJourney([])).toEqual({
      origin: "direct",
      lastPage: "direct",
      lastPillar: null,
      pillarTouched: false,
      length: 0,
    });
  });

  it("extracts conversion journeys from success payloads only", () => {
    const events: FunnelInputEvent[] = [
      submitSuccess("booking", ["/", "/ai"]),
      submitSuccess("contact"),
      page("/"),
    ];
    expect(extractJourneys(events)).toEqual([["/", "/ai"]]);
  });
});

describe("R20.2 — rankings", () => {
  it("ranks by frequency with deterministic ties", () => {
    expect(rankBy(["b", "a", "b", "a", "c"])).toEqual([
      { key: "a", count: 2 },
      { key: "b", count: 2 },
      { key: "c", count: 1 },
    ]);
    expect(rankBy([])).toEqual([]);
  });

  it("tops pages, CTAs, products and journeys", () => {
    const events: FunnelInputEvent[] = [
      page("/"),
      page("/"),
      page("/agentes-ia"),
      click("hero", "hero_booking"),
      click("hero", "hero_booking"),
      click("ai_hero", "ai_booking"),
      { name: "product_interaction", category: "products", label: "qook_click", data: { product: "qook" } },
      { name: "product_interaction", category: "products", label: "qook_click", data: { product: "qook" } },
      { name: "product_interaction", category: "products", label: "x_click", data: { product: "pikto" } },
    ];
    expect(getTopPages(events)[0]).toEqual({ key: "/", count: 2 });
    expect(getTopCTAs(events)[0]).toEqual({ key: "hero.hero_booking", count: 2 });
    expect(getTopProducts(events)[0]).toEqual({ key: "qook", count: 2 });
    expect(
      getTopJourneys([[ "/", "/booking" ], ["/", "/booking"], ["/", "/contact"]])[0],
    ).toEqual({ key: "/ → /booking", count: 2 });
  });
});

describe("R20.2 — funnel stats and leaks", () => {
  const events: FunnelInputEvent[] = [
    ...Array.from({ length: 100 }, () => page("/")),
    ...Array.from({ length: 40 }, () => click("hero", "hero_booking")),
    ...Array.from({ length: 10 }, () => click("homepage", "audit_open")),
    ...Array.from({ length: 8 }, () => ({ name: "form_step", category: "booking", label: "booking_start" }) as FunnelInputEvent),
    ...Array.from({ length: 5 }, () => ({ name: "form_step", category: "booking", label: "booking_submit" }) as FunnelInputEvent),
    ...Array.from({ length: 2 }, () => submitSuccess("booking")),
  ];

  it("counts stages", () => {
    expect(getFunnelStats(events)).toEqual({
      views: 100,
      ctaClicks: 50,
      intents: 10,
      formStarts: 8,
      submits: 5,
      successes: 2,
    });
  });

  it("finds the biggest loss first with null-safe rates", () => {
    const leaks = detectLeaks(getFunnelStats(events));
    expect(leaks[0]).toEqual({ from: "views", to: "cta", rate: 0.5, loss: 50 });
    expect(detectLeaks(getFunnelStats([])).every((l) => l.rate === null)).toBe(true);
  });
});

describe("R20.2 — form intelligence", () => {
  it("computes completion and abandon rates per form", () => {
    const events: FunnelInputEvent[] = [
      ...Array.from({ length: 10 }, () => ({ name: "form_step", category: "booking", label: "booking_start" }) as FunnelInputEvent),
      ...Array.from({ length: 6 }, () => ({ name: "form_step", category: "booking", label: "booking_submit" }) as FunnelInputEvent),
      ...Array.from({ length: 4 }, () => submitSuccess("booking")),
      ...Array.from({ length: 3 }, () => ({ name: "form_step", category: "booking", label: "booking_abandon" }) as FunnelInputEvent),
      { name: "form_submission", category: "contact", label: "contact_form_error" },
    ];
    expect(getFormStats(events, "booking")).toEqual({
      form: "booking",
      starts: 10,
      submits: 6,
      successes: 4,
      abandons: 3,
      errors: 0,
      completionRate: 0.4,
      abandonRate: 0.3,
    });
    expect(getFormStats(events, "contact")).toMatchObject({ errors: 1, completionRate: null });
    expect(getFormStats([], "booking")).toMatchObject({ completionRate: null, abandonRate: null });
  });
});

describe("R20.2 — scroll intelligence", () => {
  it("distributes depth and names the weakest zone", () => {
    const depth = (location: string, d: number, n: number): FunnelInputEvent[] =>
      Array.from({ length: n }, () => ({ name: "scroll_depth", category: "engagement", label: `${location}_${d}` }) as FunnelInputEvent);
    const events = [
      ...depth("homepage", 25, 10),
      ...depth("homepage", 50, 8),
      ...depth("homepage", 75, 3),
      ...depth("homepage", 100, 3),
    ];
    const [stats] = getScrollStats(events);
    expect(stats).toMatchObject({ location: "homepage", p25: 10, p50: 8, p75: 3, p100: 3 });
    expect(stats.weakestZone).toBe("50→75");
    expect(getScrollStats([])).toEqual([]);
  });
});

describe("R20.2 — pillar performance", () => {
  it("rolls up views, depth, CTAs, intent and attributed conversions", () => {
    const events: FunnelInputEvent[] = [
      page("/agentes-ia"),
      page("/agentes-ia"),
      page("/solucoes/marketing-digital"),
      { name: "scroll_depth", category: "engagement", label: "ai_agents_50" } as FunnelInputEvent,
      { name: "scroll_depth", category: "engagement", label: "ai_agents_100" } as FunnelInputEvent,
      click("ai_hero", "ai_booking"),
      { name: "cta_click", category: "ai_agents", label: "audit_open" } as FunnelInputEvent,
      click("growth_cta", "growth_booking"),
    ];
    const stats = getPillarStats(events, [[ "/", "/agentes-ia", "/booking" ]]);
    expect(stats.ai).toMatchObject({
      views: 2,
      depth50: 1,
      depth100: 1,
      ctaClicks: 1,
      intents: 1,
      conversions: 1,
    });
    expect(stats.growth).toMatchObject({ views: 1, ctaClicks: 1, conversions: 0 });
    expect(stats.software).toMatchObject({ views: 0, conversions: 0 });
  });
});

describe("R20.2 — debug report", () => {
  it("summarizes tops, funnel and biggest leak", () => {
    const events: FunnelInputEvent[] = [
      page("/"),
      page("/agentes-ia"),
      click("hero", "hero_booking"),
      submitSuccess("booking", ["/", "/agentes-ia", "/booking"]),
    ];
    const report = getIntelligenceReport(events);
    expect(report.events).toBe(4);
    expect(report.topPage).toEqual({ key: "/", count: 1 });
    expect(report.topCta).toEqual({ key: "hero.hero_booking", count: 1 });
    expect(report.topJourney).toEqual({ key: "/ → /agentes-ia → /booking", count: 1 });
    expect(report.topProduct).toBeNull();
    expect(report.funnel).toMatchObject({ views: 2, successes: 1 });
    expect(report.biggestLeak).toMatchObject({ from: "views", to: "cta" });
    expect(typeof report.generatedAt).toBe("string");
  });
});
