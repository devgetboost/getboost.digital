import { describe, expect, it, vi, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  analytics,
  trackEvent,
  scrubAnalyticsData,
  recordJourneyStep,
  getJourney,
  getJourneyOrigin,
  getAnalyticsDebugLog,
} from "../lib/analytics";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");

/**
 * R20.1 — analytics foundation guards.
 * Unit-tests the taxonomy helpers (scrub, journey, dispatch, debug) and
 * pins the instrumentation coverage (scroll, lifecycle, products, audit
 * intent, outbound) so future edits cannot silently drop measurement.
 */
describe("R20.1 — taxonomy helpers", () => {
  beforeEach(() => {
    sessionStorage.clear();
    (window as unknown as { dataLayer?: unknown[] }).dataLayer = [];
    window.history.replaceState({}, "", "/");
  });

  it("scrubs PII recursively and keeps attribution fields", () => {
    const cleaned = scrubAnalyticsData({
      email: "a@b.c",
      phone: "+351",
      company: "Acme",
      message: "hello",
      nested: { email: "x@y.z", slug: "qook" },
      product: "qook",
      path: "/booking",
      utm_source: "google",
      journey: ["/", "/agentes-ia"],
    }) as Record<string, unknown>;
    for (const banned of ["email", "phone", "company", "message"]) {
      expect(cleaned, `PII key ${banned}`).not.toHaveProperty(banned);
    }
    expect((cleaned.nested as Record<string, unknown>)).not.toHaveProperty("email");
    expect(cleaned).toMatchObject({
      product: "qook",
      path: "/booking",
      utm_source: "google",
      journey: ["/", "/agentes-ia"],
    });
  });

  it("dispatches a scrubbed CustomEvent and pushes to dataLayer", () => {
    const seen: Event[] = [];
    const listener = (e: Event) => seen.push(e);
    window.addEventListener("lovable_analytics", listener);
    trackEvent({
      name: "form_submission",
      category: "booking",
      label: "booking_form_success",
      data: { email: "a@b.c", meeting_type: "diagnostico" },
    });
    window.removeEventListener("lovable_analytics", listener);
    expect(seen).toHaveLength(1);
    const detail = (seen[0] as CustomEvent).detail;
    expect(detail.data).toEqual({ meeting_type: "diagnostico" });
    const layer = (window as unknown as { dataLayer: Array<Record<string, unknown>> }).dataLayer;
    expect(layer[layer.length - 1]).toMatchObject({ event: "form_submission" });
  });

  it("records a capped, deduplicated, query-free journey", () => {
    recordJourneyStep("/?utm_source=x");
    recordJourneyStep("/");
    recordJourneyStep("/agentes-ia#top");
    recordJourneyStep("/booking");
    expect(getJourney()).toEqual(["/", "/agentes-ia", "/booking"]);
    expect(getJourneyOrigin()).toBe("/");
    for (let i = 0; i < 30; i++) recordJourneyStep(`/p${i}`);
    expect(getJourney().length).toBeLessThanOrEqual(20);
    expect(getJourneyOrigin()).toBe("/p10");
  });

  it("debug mode is param-gated (silent by default)", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      trackEvent({ name: "page_view", path: "/", title: "t" });
      expect(info).not.toHaveBeenCalled();
      expect(getAnalyticsDebugLog()).toHaveLength(0);
      window.history.replaceState({}, "", "/?gb_debug=analytics");
      analytics.trackScrollDepth("homepage", 25, "/");
      expect(info).toHaveBeenCalled();
      expect(getAnalyticsDebugLog().length).toBeGreaterThan(0);
    } finally {
      info.mockRestore();
      window.history.replaceState({}, "", "/");
    }
  });

  it("new helpers emit taxonomy-shaped events", () => {    const seen: CustomEvent[] = [];
    const listener = (e: Event) => seen.push(e as CustomEvent);
    window.addEventListener("lovable_analytics", listener);
    try {
      analytics.trackScrollDepth("homepage", 50, "/");
      analytics.trackOutbound("phone", "footer");
      analytics.trackFormStep("booking", "start");
      analytics.trackProduct("qook", "click", "homepage_products");
      const names = seen.map((e) => e.detail.name);
      expect(names).toEqual(["scroll_depth", "outbound_click", "form_step", "product_interaction"]);
      expect(seen[0].detail).toMatchObject({ category: "engagement", label: "homepage_50" });
      expect(seen[1].detail).toMatchObject({ category: "outbound", label: "phone_footer" });
      expect(seen[2].detail).toMatchObject({ category: "booking", label: "booking_start" });
      expect(seen[3].detail).toMatchObject({ category: "products", label: "qook_click" });
    } finally {
      window.removeEventListener("lovable_analytics", listener);
    }
  });
});

describe("R20.1 — instrumentation coverage", () => {
  it("PageTracker records the journey on every route change", () => {
    const app = read("src/App.tsx");
    expect(app).toContain("recordJourneyStep(location.pathname)");
  });

  it("ScrollDepth mounts on the seven measured pages", () => {
    const pages: Array<[string, string]> = [
      ["src/pages/Index.tsx", "homepage"],
      ["src/pages/AgentesIA.tsx", "ai_agents"],
      ["src/pages/IntegracoesErpCrm.tsx", "automation"],
      ["src/pages/DesenvolvimentoSaaS.tsx", "software"],
      ["src/pages/MarketingDigital.tsx", "growth"],
      ["src/pages/Portfolio.tsx", "portfolio"],
      ["src/pages/Products.tsx", "products"],
    ];
    for (const [file, location] of pages) {
      const src = read(file);
      expect(src, `${file} ScrollDepth`).toContain(`<ScrollDepth location="${location}" />`);
    }
  });

  it("booking + contact wire the full lifecycle (start/submit/abandon, no PII)", () => {
    for (const [file, form] of [["src/pages/Booking.tsx", "booking"], ["src/pages/Contact.tsx", "contact"]] as const) {
      const src = read(file);
      expect(src, `${file} start`).toContain(`trackFormStep('${form}', 'start')`);
      expect(src, `${file} submit`).toContain(`trackFormStep('${form}', 'submit'`);
      expect(src, `${file} abandon`).toContain(`trackFormStep('${form}', 'abandon'`);
      expect(src, `${file} journey`).toContain("getJourneyOrigin()");
    }
    // explicit PII absence in analytics payloads (library scrub is the
    // backstop; the product edge-function calls legitimately carry lead data)
    for (const file of ["src/pages/Booking.tsx", "src/components/ConsultantContactForm.tsx"]) {
      const src = read(file);
      for (const match of src.matchAll(/analytics\.track(?:Form|Booking)\([\s\S]{0,400}/g)) {
        const block = match[0];
        expect(block, `${file} analytics payload must not carry email`).not.toMatch(/\bemail\s*:/);
        expect(block, `${file} analytics payload must not carry phone`).not.toMatch(/\bphone\s*:/);
      }
    }
  });

  it("product clicks are tracked on every card surface", () => {
    const surfaces: Array<[string, string]> = [
      ["src/pages/Index.tsx", "homepage_products"],
      ["src/pages/Products.tsx", "products_hub"],
      ["src/pages/Portfolio.tsx", "portfolio_proof"],
      ["src/pages/AgentesIA.tsx", "ai_proof"],
      ["src/pages/IntegracoesErpCrm.tsx", "automation_proof"],
      ["src/pages/DesenvolvimentoSaaS.tsx", "software_proof"],
      ["src/pages/MarketingDigital.tsx", "growth_proof"],
      ["src/pages/Services.tsx", "services_products"],
      ["src/components/Header.tsx", "header_products"],
      ["src/components/Footer.tsx", "footer_products"],
    ];
    for (const [file, location] of surfaces) {
      expect(read(file), `${file} product click`).toContain(`'click', '${location}'`);
    }
    expect(read("src/components/pillars/PillarLanding.tsx")).toContain("pillar_${pillar.id}_proof");
  });

  it("audit-modal intent fires per source on premium pages", () => {
    expect(read("src/components/CommercialAuditModal.tsx")).toContain("trackingSource");
    for (const [file, source] of [
      ["src/pages/Index.tsx", "homepage"],
      ["src/pages/AgentesIA.tsx", "ai_agents"],
      ["src/pages/IntegracoesErpCrm.tsx", "automation"],
      ["src/pages/DesenvolvimentoSaaS.tsx", "software"],
      ["src/pages/MarketingDigital.tsx", "growth"],
      ["src/pages/Portfolio.tsx", "portfolio"],
    ] as const) {
      expect(read(file), `${file} intent source`).toContain(`trackingSource="${source}"`);
    }
  });

  it("outbound phone/email clicks are tracked (WhatsApp keeps its own event)", () => {
    expect(read("src/components/Footer.tsx")).toContain("trackOutbound('phone', 'footer')");
    expect(read("src/components/Footer.tsx")).toContain("trackOutbound('email', 'footer')");
    expect(read("src/pages/Contact.tsx")).toContain("trackOutbound('email', 'contact_channels')");
    expect(read("src/components/BlogShareContact.tsx")).toContain("trackOutbound('email', 'blog_author')");
    expect(read("src/pages/AgenciaLocal.tsx")).toContain("trackOutbound('phone', 'agencia_local')");
  });
});

describe("R20.17 — conversion attribution (UTMs + touches)", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.history.replaceState({}, "", "/");
  });

  it("stamps conversion events with session UTMs", () => {
    const seen: CustomEvent[] = [];
    const listener = (e: Event) => seen.push(e as CustomEvent);
    window.addEventListener("lovable_analytics", listener);
    try {
      window.history.replaceState({}, "", "/?utm_source=google&utm_medium=cpc&utm_campaign=q1");
      analytics.trackForm("booking", "booking_form_success", { meeting_type: "x" });
      analytics.trackBooking("booking", "booking_success", {});
      const form = seen.find((e) => e.detail.name === "form_submission");
      const booking = seen.find((e) => e.detail.name === "schedule_appointment");
      for (const detail of [form?.detail, booking?.detail]) {
        expect(detail?.data).toMatchObject({
          utms: { utm_source: "google", utm_medium: "cpc", utm_campaign: "q1" },
        });
      }
      // Caller payload preserved alongside UTMs, PII still scrubbed.
      expect(form?.detail.data).toMatchObject({ meeting_type: "x" });
    } finally {
      window.removeEventListener("lovable_analytics", listener);
      window.history.replaceState({}, "", "/");
    }
  });

  it("falls back to inferred UTMs when the URL carries none", () => {
    const seen: CustomEvent[] = [];
    const listener = (e: Event) => seen.push(e as CustomEvent);
    window.addEventListener("lovable_analytics", listener);
    try {
      analytics.trackBooking("booking", "booking_success", {});
      const booking = seen.find((e) => e.detail.name === "schedule_appointment");
      expect(booking?.detail.data.utms.utm_source).toBe("direct");
    } finally {
      window.removeEventListener("lovable_analytics", listener);
    }
  });

  it("stamps assessment lead_capture with UTMs, other lifecycle events stay lean", () => {
    const seen: CustomEvent[] = [];
    const listener = (e: Event) => seen.push(e as CustomEvent);
    window.addEventListener("lovable_analytics", listener);
    try {
      window.history.replaceState({}, "", "/?utm_source=linkedin&utm_medium=social");
      analytics.trackAssessment("ai-readiness", "start");
      analytics.trackAssessment("ai-readiness", "lead_capture", { score: 80 });
      const start = seen.find((e) => e.detail.name === "assessment_start");
      const capture = seen.find((e) => e.detail.name === "assessment_lead_capture");
      expect(start?.detail.data).not.toHaveProperty("utms");
      expect(capture?.detail.data).toMatchObject({
        utms: { utm_source: "linkedin", utm_medium: "social" },
        score: 80,
      });
    } finally {
      window.removeEventListener("lovable_analytics", listener);
      window.history.replaceState({}, "", "/");
    }
  });
});
