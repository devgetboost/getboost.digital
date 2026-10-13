import { describe, expect, it } from "vitest";
import {
  classifyLeak,
  createExperiment,
  decideExperiment,
  getBestCTA,
  getBestPillar,
  getConversionScore,
  getCTAPerformance,
  getFormHypotheses,
  getPageContribution,
  getPillarRanking,
  getProductStats,
  getQuickWins,
  getScrollInsights,
  getTopLeaks,
  getWorstCTA,
  suggestExperiment,
  type FunnelInputEvent,
} from "../lib/cro-foundation";
import { getFormStats } from "../lib/funnel-intelligence";

/**
 * R20.3 — CRO foundation guards.
 * Pure unit tests over synthetic fixtures (zero PII): severity, CTA and
 * pillar rankings, products, hypotheses, scroll insights, quick wins,
 * experiments and the composite score.
 */
const page = (path: string): FunnelInputEvent => ({ name: "page_view", path, title: path });
const click = (category: string, label: string): FunnelInputEvent => ({
  name: "cta_click",
  category,
  label,
});
const step = (category: string, label: string): FunnelInputEvent => ({
  name: "form_step",
  category,
  label,
});
const success = (category: string, journey?: string[]): FunnelInputEvent => ({
  name: "form_submission",
  category,
  label: `${category}_form_success`,
  data: journey ? { journey } : {},
});

describe("R20.3 — leak severity", () => {
  it("classifies by rate with null-safe fallback", () => {
    expect(classifyLeak({ from: "a", to: "b", rate: 0.05, loss: 90 })).toBe("CRÍTICO");
    expect(classifyLeak({ from: "a", to: "b", rate: 0.2, loss: 10 })).toBe("ALTO");
    expect(classifyLeak({ from: "a", to: "b", rate: 0.4, loss: 5 })).toBe("MÉDIO");
    expect(classifyLeak({ from: "a", to: "b", rate: 0.9, loss: 1 })).toBe("BAIXO");
    expect(classifyLeak({ from: "a", to: "b", rate: null, loss: 0 })).toBe("BAIXO");
  });

  it("ranks leaks biggest-loss-first", () => {
    const events: FunnelInputEvent[] = [
      ...Array.from({ length: 100 }, () => page("/")),
      ...Array.from({ length: 10 }, () => click("hero", "hero_booking")),
      ...Array.from({ length: 9 }, () => click("homepage", "audit_open")),
    ];
    const [first] = getTopLeaks(events);
    expect(first.from).toBe("views");
    expect(first.severity).toBe("ALTO"); // 10/100 = 0.10
    expect(getTopLeaks([]).every((l) => l.severity === "BAIXO")).toBe(true);
  });
});

describe("R20.3 — CTA ranking", () => {
  const events: FunnelInputEvent[] = [
    ...Array.from({ length: 10 }, () => click("hero", "hero_booking")),
    ...Array.from({ length: 3 }, () => click("homepage", "audit_open")),
    click("footer", "footer_contact"),
  ];

  it("scores clicks, intent and booking CTAs", () => {
    // hero: 10/10·60 + 0 + 15 = 75 · audit: 3/10·60 + 25 + 15 = 58 · footer: 1/10·60 + 0 + 15 = 21
    const [first, second] = getCTAPerformance(events);
    expect(first).toMatchObject({ key: "hero.hero_booking", clicks: 10, score: 75 });
    expect(second).toMatchObject({ key: "homepage.audit_open", clicks: 3, isIntent: true, isBookingCTA: true, score: 58 });
  });

  it("finds best and worst (null without CTAs)", () => {
    expect(getBestCTA(events)?.key).toBe("hero.hero_booking");
    expect(getWorstCTA(events)?.key).toBe("footer.footer_contact");
    expect(getBestCTA([])).toBeNull();
    expect(getWorstCTA([])).toBeNull();
  });

  it("measures page contribution from converting journeys", () => {
    const journeys = [["/", "/agentes-ia", "/booking"], ["/", "/blog"]];
    expect(getPageContribution(journeys, "/agentes-ia")).toBe(0.5);
    expect(getPageContribution(journeys, "/missing")).toBe(0);
    expect(getPageContribution([], "/")).toBeNull();
  });
});

describe("R20.3 — pillar ranking", () => {
  it("orders by conversions, flags winner and weakest", () => {
    const events: FunnelInputEvent[] = [
      page("/agentes-ia"),
      page("/agentes-ia"),
      page("/solucoes/marketing-digital"),
      click("ai_hero", "ai_booking"),
      click("growth_cta", "growth_booking"),
    ];
    const ranked = getPillarRanking(events, [["/", "/agentes-ia", "/booking"]]);
    const [first, , , last] = ranked;
    expect(first.pillar).toBe("ai");
    expect(first.isWinner).toBe(true);
    expect(first).toMatchObject({ views: 2, ctaClicks: 1, conversions: 1, ctaRate: 0.5 });
    expect(last.isWeakest).toBe(true);
    // 'growth_cta' matches the growth_ prefix — real CTR evidence, not zero
    const growth = ranked.find((p) => p.pillar === "growth");
    expect(growth).toMatchObject({ views: 1, ctaClicks: 1, ctaRate: 1 });
  });

  it("nulls rates without views", () => {
    const [ai] = getPillarRanking([], []);
    expect(ai).toMatchObject({ ctaRate: null, bookingRate: null, submitRate: null });
  });

  it("getBestPillar follows the ranking", () => {
    expect(getBestPillar([], [])?.pillar).toBe("ai"); // all-zero tie → alpha
    expect(getBestPillar([page("/solucoes/marketing-digital")], [])?.pillar).toBe("growth");
  });
});

describe("R20.3 — product ranking", () => {
  it("rolls up views, clicks and booking contribution per catalog slug", () => {
    const events: FunnelInputEvent[] = [
      page("/qook"),
      page("/qook"),
      page("/br/qook"),
      { name: "product_interaction", category: "products", label: "qook_click", data: { product: "qook" } } as FunnelInputEvent,
      { name: "product_interaction", category: "products", label: "pikto_click", data: { product: "pikto" } } as FunnelInputEvent,
      { name: "product_interaction", category: "products", label: "pikto_interest", data: { product: "pikto", action: "interest" } } as FunnelInputEvent,
    ];
    const stats = getProductStats(events, [["/", "/qook"]]);
    const qook = stats.find((s) => s.slug === "qook");
    expect(qook).toMatchObject({ views: 3, clicks: 1, interest: 0, bookingContribution: 1, kind: "saas" });
    const pikto = stats.find((s) => s.slug === "pikto");
    expect(pikto).toMatchObject({ clicks: 1, interest: 1 });
    const descobre = stats.find((s) => s.slug === "descobre-quem-tu-es");
    expect(descobre).toMatchObject({ views: 0, clicks: 0, bookingContribution: 0 });
    expect(stats).toHaveLength(8);
  });
});

describe("R20.3 — form hypotheses", () => {
  it("fires rules by severity (healthy baseline included)", () => {
    const bad = getFormHypotheses({
      form: "booking", starts: 10, submits: 2, successes: 2,
      abandons: 6, errors: 2, completionRate: 0.2, abandonRate: 0.6,
    });
    expect(bad.map((h) => h.trigger)).toEqual(["high-abandon", "low-completion", "validation-errors"]);
    expect(
      getFormHypotheses({
        form: "contact", starts: 0, submits: 0, successes: 0,
        abandons: 0, errors: 0, completionRate: null, abandonRate: null,
      })[0].trigger,
    ).toBe("no-starts");
    const healthy = getFormStats(
      [
        ...Array.from({ length: 10 }, () => step("booking", "booking_start")),
        ...Array.from({ length: 8 }, () => success("booking")),
      ],
      "booking",
    );
    expect(getFormHypotheses(healthy).map((h) => h.trigger)).toEqual(["healthy"]);
  });
});

describe("R20.3 — scroll insights", () => {
  it("names consumed share and weakest zone with implications", () => {
    const depth = (d: number, n: number): FunnelInputEvent[] =>
      Array.from({ length: n }, () => ({ name: "scroll_depth", category: "engagement", label: `homepage_${d}` }) as FunnelInputEvent);
    const [insight] = getScrollInsights([...depth(25, 10), ...depth(50, 9), ...depth(75, 2), ...depth(100, 2)]);
    expect(insight).toMatchObject({ location: "homepage", consumed: 0.2, weakestZone: "50→75" });
    expect(insight.implication).toContain("50→75");
    expect(getScrollInsights([])).toEqual([]);
  });
});

describe("R20.3 — quick wins", () => {
  it("prioritizes the biggest leak first, capped at five", () => {
    const events: FunnelInputEvent[] = [
      ...Array.from({ length: 100 }, () => page("/")),
      ...Array.from({ length: 5 }, () => click("hero", "hero_booking")),
      ...Array.from({ length: 10 }, () => step("booking", "booking_start")),
      ...Array.from({ length: 9 }, () => step("booking", "booking_abandon")),
    ];
    const wins = getQuickWins({ events });
    expect(wins.length).toBeGreaterThan(0);
    expect(wins.length).toBeLessThanOrEqual(5);
    expect(wins[0].area).toBe("funnel");
    expect(wins[0].priority).toBe(5 / 2);
    for (let i = 1; i < wins.length; i++) {
      expect(wins[i - 1].priority).toBeGreaterThanOrEqual(wins[i].priority);
    }
    expect(getQuickWins({ events: [] })).toEqual([]);
  });
});

describe("R20.3 — conversion score", () => {
  it("composites available components with renormalized weights", () => {
    const events: FunnelInputEvent[] = [
      ...Array.from({ length: 100 }, () => page("/")),
      ...Array.from({ length: 50 }, () => click("hero", "hero_booking")),
      ...Array.from({ length: 10 }, () => click("homepage", "audit_open")),
      ...Array.from({ length: 10 }, () => success("booking")),
    ];
    const report = getConversionScore({ events });
    // (15 + 3.33 + 2.5) / 70 × 100 = 30 — missing components excluded,
    // weights renormalized over the available 70
    expect(report.score).toBe(30);
    expect(report.coverage).toBe(3);
    expect(report.components.scrollCompletion).toBeNull();
    expect(report.components.journeyQuality).toBeNull();
  });

  it("is zero without data and perfect at full conversion", () => {
    expect(getConversionScore({ events: [] })).toMatchObject({ score: 0, coverage: 0 });
  });
});

describe("R20.3 — experiment framework", () => {
  it("creates drafts, decides immutably and suggests from wins", () => {
    const exp = createExperiment("e1", "H?", "/", "ctaRate", "A actual", "B novo");
    expect(exp.status).toBe("draft");
    expect(exp.variants).toHaveLength(2);
    const decided = decideExperiment(exp, "B", "n=120, +18%");
    expect(decided).toMatchObject({ status: "decided", winner: "B" });
    expect(exp.status).toBe("draft"); // original untouched
    expect(() => decideExperiment(exp, "C" as "A", "x")).toThrow();
    const suggested = suggestExperiment(
      { area: "cta", finding: "F", recommendation: "R", impact: 4, effort: 2, priority: 2 },
      "/",
    );
    expect(suggested.status).toBe("draft");
    expect(suggested.id).toMatch(/^exp-cta-/);
  });
});
