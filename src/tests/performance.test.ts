import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import {
  ANALYTICS_BUDGET_BYTES,
  ASSET_BUDGET_BYTES,
  BUDGETS,
  SCORE_TARGETS,
  VITAL_THRESHOLDS,
  VITAL_WARNING,
  getAnalyticsOverhead,
  getAssetInsights,
  getBundleStats,
  getDashboardReadiness,
  getOptimizationOpportunities,
  getPerformanceScore,
  getVitalsSummary,
  rateVital,
  type BundleAudit,
  type VitalSample,
} from "../lib/performance";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf-8");
const readIfExists = (rel: string): string | null => (existsSync(join(root, rel)) ? read(rel) : null);

const VITE = read("vite.config.ts");
const HTML = read("index.html");
const MAIN = read("src/main.tsx");
const APP = read("src/App.tsx");
const AUDIT_SCRIPT = read("scripts/audit-critical-path.mjs");
const AUDIT_REPORT = readIfExists("reports/performance-audit.json");

/**
 * R20.11 — Performance guards.
 * Configuration gates (always run) plus measurement-layer behaviour.
 * Artifact assertions run only when a build exists, so the suite is valid
 * both before and after `vite build`.
 */
describe("R20.11 — Core Web Vitals model (Fases 2, 3)", () => {
  it("rates every vital against the published thresholds", () => {
    expect(VITAL_THRESHOLDS).toEqual({ LCP: 2500, CLS: 0.1, INP: 200, TTFB: 800, FCP: 1800 });
    for (const [name, good] of Object.entries(VITAL_THRESHOLDS)) {
      const key = name as keyof typeof VITAL_THRESHOLDS;
      expect(rateVital(key, good), name).toBe("GOOD");
      expect(rateVital(key, good + 0.001), name).toBe("NEEDS_IMPROVEMENT");
      expect(rateVital(key, VITAL_WARNING[key] + 0.001), name).toBe("POOR");
    }
  });

  it("reports NO_DATA instead of guessing", () => {
    expect(rateVital("LCP", null)).toBe("NO_DATA");
    expect(rateVital("CLS", Number.NaN)).toBe("NO_DATA");
    const summary = getVitalsSummary([]);
    expect(summary).toHaveLength(5);
    for (const entry of summary) {
      expect(entry.p75).toBeNull();
      expect(entry.rating).toBe("NO_DATA");
      expect(entry.samples).toBe(0);
    }
  });

  it("summarises samples at p75 and median", () => {
    const samples: VitalSample[] = [
      { name: 'LCP', value: 1200 },
      { name: 'LCP', value: 1800 },
      { name: 'LCP', value: 2200 },
      { name: 'LCP', value: 2600 },
      { name: 'CLS', value: 0.05 },
      { name: 'CLS', value: 0.02 },
    ];
    const summary = getVitalsSummary(samples);
    const lcp = summary.find((entry) => entry.name === 'LCP');
    const cls = summary.find((entry) => entry.name === 'CLS');
    expect(lcp?.samples).toBe(4);
    expect(lcp?.p75).toBe(2300);
    expect(lcp?.median).toBe(2000);
    expect(lcp?.rating).toBe("GOOD"); // p75 2300 ≤ 2500
    expect(cls?.p75).toBeLessThanOrEqual(0.1);
    expect(summary.find((entry) => entry.name === 'INP')?.rating).toBe("NO_DATA");
  });
});

describe("R20.11 — bundle analysis (Fases 4, 5)", () => {
  const audit = (over: Partial<BundleAudit> = {}): BundleAudit => ({
    rollup: { chunks: 260, totalBytes: 5_200_000, entryJsBytes: 500_000, entryJsGzipEstimate: 152_000, entryCssBytes: 170_000 },
    lazyBoundaries: 144,
    shipped: {
      criticalBytes: 520_000,
      deferredBytes: 2_000_000,
      criticalPackages: [
        { name: "motion-dom", bytes: 95_000 },
        { name: "@supabase/supabase-js", bytes: 112_000 },
        { name: "app", bytes: 52_000 },
      ],
    },
    ...over,
  });

  it("computes bundle stats and the deferred share", () => {
    const stats = getBundleStats(audit());
    expect(stats.chunkCount).toBe(260);
    expect(stats.lazyBoundaries).toBe(144);
    expect(stats.entryJsBytes).toBe(500_000);
    expect(stats.entryCssBytes).toBe(170_000);
    expect(stats.deferredShare).toBeCloseTo(0.794, 2);
    expect(stats.heavyPackages).toEqual([]);
    // Aggregate rule catches what per-package limits miss.
    expect(stats.appBytes).toBe(52_000);
    expect(stats.vendorBytes).toBe(207_000);
    expect(stats.largestVendorPackages[0].name).toBe("@supabase/supabase-js");
  });

  it("degrades honestly when attribution is unavailable", () => {
    const stats = getBundleStats({ rollup: { chunks: 10, totalBytes: 100, entryJsBytes: 90 } });
    expect(stats.deferredShare).toBeNull();
    expect(stats.heavyPackages).toEqual([]);
    expect(stats.vendorBytes).toBeNull();
    expect(stats.appBytes).toBeNull();
    expect(stats.entryCssBytes).toBe(0);
  });

  it("keeps the documented budgets", () => {
    expect(BUDGETS.entryJsBytes).toBe(600 * 1024);
    expect(BUDGETS.entryCssBytes).toBe(200 * 1024);
    expect(BUDGETS.packageBytes).toBe(200 * 1024);
    expect(BUDGETS.vendorBytes).toBe(350 * 1024);
    expect(ASSET_BUDGET_BYTES).toBe(250 * 1024);
  });
});

describe("R20.11 — assets (Fases 6, 7)", () => {
  it("flags oversized rasters and modern-format opportunities", () => {
    const insights = getAssetInsights([
      { path: "public/og-image.jpg", bytes: 120_000 },
      { path: "public/images/blog/huge.jpg", bytes: 940_000 },
      { path: "public/images/blog/ok.webp", bytes: 80_000 },
    ]);
    expect(insights[0].path).toBe("public/images/blog/huge.jpg");
    expect(insights[0].oversized).toBe(true);
    expect(insights[0].modernFormatOpportunity).toBe(true);
    expect(insights.find((i) => i.path.endsWith(".webp"))?.modernFormatOpportunity).toBe(false);
  });
});

describe("R20.11 — analytics overhead (Fase 14)", () => {
  it("grades the instrumentation payload", () => {
    expect(getAnalyticsOverhead(60_000, 500_000).rating).toBe("LOW");
    expect(getAnalyticsOverhead(120_000, 500_000).rating).toBe("MODERATE");
    expect(getAnalyticsOverhead(ANALYTICS_BUDGET_BYTES + 1, 500_000).rating).toBe("HIGH");
    expect(getAnalyticsOverhead(100_000, 500_000).entryShare).toBe(0.2);
    expect(getAnalyticsOverhead(100_000, 0).entryShare).toBeNull();
  });

  it("keeps the intelligence modules out of page components", () => {
    // R20.1–R20.10 modules are pure and only read at export/debug time, so
    // they must never be imported by a page component.
    for (const page of ["src/pages/Index.tsx", "src/pages/Products.tsx", "src/pages/Booking.tsx"]) {
      const source = read(page);
      for (const module of ["product-intelligence", "crm-qualification", "sales-intelligence", "case-intelligence"]) {
        expect(source, `${page} imports ${module}`).not.toContain(module);
      }
    }
  });
});

describe("R20.11 — optimization opportunities (Fases 15, 16)", () => {
  const bundle = getBundleStats({
    rollup: { chunks: 260, totalBytes: 5_200_000, entryJsBytes: 700_000, entryCssBytes: 240_000 },
    lazyBoundaries: 144,
    shipped: {
      criticalBytes: 700_000,
      deferredBytes: 300_000,
      criticalPackages: [{ name: "motion-dom", bytes: 300_000 }, { name: "app", bytes: 60_000 }],
    },
  });

  it("fires only on measured breaches, each citing its evidence", () => {
    const opportunities = getOptimizationOpportunities({
      bundle,
      vitals: getVitalsSummary([{ name: 'LCP', value: 5200 }, { name: 'CLS', value: 0.02 }]),
      assets: getAssetInsights([{ path: "public/huge.jpg", bytes: 900_000 }]),
      analytics: getAnalyticsOverhead(400_000, 700_000),
    });
    const kinds = opportunities.map((o) => o.kind);
    expect(kinds).toContain("BUNDLE");
    expect(kinds).toContain("VITAL");
    expect(kinds).toContain("ASSET");
    expect(kinds).toContain("THIRD_PARTY");
    expect(kinds).toContain("ROUTE");
    for (const opportunity of opportunities) {
      expect(opportunity.evidence.length, opportunity.title).toBeGreaterThan(5);
      expect(opportunity.recommendation.length, opportunity.title).toBeGreaterThan(20);
    }
    // HIGH severity first.
    expect(opportunities[0].severity).toBe("HIGH");
  });

  it("stays silent when every measurement is inside budget", () => {
    const healthy = getBundleStats({
      rollup: { chunks: 260, totalBytes: 5_200_000, entryJsBytes: 400_000, entryCssBytes: 150_000 },
      lazyBoundaries: 144,
      shipped: { criticalBytes: 400_000, deferredBytes: 2_500_000, criticalPackages: [{ name: "app", bytes: 50_000 }] },
    });
    expect(
      getOptimizationOpportunities({
        bundle: healthy,
        vitals: getVitalsSummary([{ name: 'LCP', value: 1800 }, { name: 'INP', value: 120 }]),
        analytics: getAnalyticsOverhead(50_000, 400_000),
      }),
    ).toEqual([]);
  });

  it("scores the four categories and justifies gaps", () => {
    const score = getPerformanceScore({ performance: 92, accessibility: 96, bestPractices: 94, seo: 100 });
    expect(score.score).toBeCloseTo(95.5, 1);
    expect(score.gaps).toEqual([{ category: "bestPractices", score: 94, target: SCORE_TARGETS.bestPractices }]);
    expect(SCORE_TARGETS).toEqual({ performance: 90, accessibility: 95, bestPractices: 95, seo: 95 });
    const failing = getPerformanceScore({ performance: 60, accessibility: 70, bestPractices: 80, seo: 90 });
    expect(failing.gaps).toHaveLength(4);
  });
});

describe("R20.11 — R20.12 readiness (Fase 17)", () => {
  it("measures the dashboard payload layers", () => {
    const readiness = getDashboardReadiness([
      { layer: "analytics", bytes: 18_000, deferred: true },
      { layer: "funnel-intelligence", bytes: 12_000, deferred: true },
      { layer: "product-intelligence", bytes: 20_000, deferred: true },
      { layer: "crm-qualification", bytes: 16_000, deferred: true },
      { layer: "sales-intelligence", bytes: 14_000, deferred: true },
    ]);
    expect(readiness.ready).toBe(true);
    expect(readiness.totalBytes).toBe(80_000);
    expect(readiness.deferredShare).toBe(1);
    expect(readiness.layers).toHaveLength(5);
  });

  it("reports an empty layer set as not ready", () => {
    expect(getDashboardReadiness([]).ready).toBe(false);
    expect(getDashboardReadiness([]).deferredShare).toBe(0);
  });
});

describe("R20.11 — configuration gates (Fases 5, 7, 8)", () => {
  it("splits vendor code out of the entry chunk", () => {
    expect(VITE).toContain("manualChunks");
    expect(VITE).toContain('"vendor-motion"');
    expect(VITE).toContain('"vendor-react"');
    // No catch-all chunk: it would force every lazy route to download the union.
    expect(VITE).not.toContain('"vendor-misc"');
    // R22 review-gate: react, i18n, radix and floating-ui must co-locate —
    // splitting mutually-importing families into per-package chunks creates
    // circular chunk dependencies that crash the production bundle at load.
    expect(VITE).toContain('"vendor-ui"');
    expect(VITE).toContain("@radix-ui/");
    expect(VITE).toContain("@floating-ui/");
    expect(VITE).toContain("react-i18next");
  });

  it("links global CSS from HTML so it is discovered before first paint", () => {
    expect(HTML).toContain('<link rel="stylesheet" href="/src/index.css" />');
    expect(HTML).toContain('<link rel="stylesheet" href="/src/styles/design-system.css" />');
    expect(MAIN).not.toContain('import "./index.css"');
  });

  it("loads the font stylesheet without blocking the first paint", () => {
    expect(HTML).toContain('rel="preload" as="style"');
    expect(HTML).toContain("media=\"print\" onload=\"this.media='all'\"");
    expect(HTML).toContain("<noscript><link rel=\"stylesheet\" href=\"https://fonts.googleapis.com");
  });

  it("keeps every route component behind a lazy boundary", () => {
    const lazyBoundaries = [...APP.matchAll(/lazy\(\(\)\s*=>\s*import\(/g)].length;
    expect(lazyBoundaries).toBeGreaterThan(100);
    const eagerPages = [...APP.matchAll(/^import\s+(\w+)\s+from\s+"\.\/pages\//gm)].map((m) => m[1]);
    // Exactly one eager page: the homepage, deliberately inlined for LCP.
    expect(eagerPages).toEqual(["Index"]);
  });

  it("ships the audit tool that produced the baseline", () => {
    expect(AUDIT_SCRIPT).toContain("attributeChunk");
    expect(AUDIT_SCRIPT).toContain("modulepreload");
    expect(AUDIT_SCRIPT).toContain("criticalAssetNames");
  });

  it("records a real measured baseline when one is committed", () => {
    if (!AUDIT_REPORT) return; // no audit committed yet — nothing to validate
    const report = JSON.parse(AUDIT_REPORT) as {
      method?: string;
      rollup: { chunks: number; totalBytes: number; entryJsBytes: number };
      shipped?: { criticalBytes?: number; criticalPackages?: Array<{ name: string; bytes: number }> };
      lazyBoundaries?: number;
    };
    expect(report.rollup.chunks).toBeGreaterThan(0);
    expect(report.rollup.entryJsBytes).toBeGreaterThan(0);
    // The optimisation this wave performed: the entry is inside budget.
    expect(report.rollup.entryJsBytes).toBeLessThanOrEqual(BUDGETS.entryJsBytes);
    if (report.shipped?.criticalBytes) {
      expect(report.shipped.criticalBytes).toBeGreaterThan(0);
    }
    expect(report.lazyBoundaries).toBeGreaterThan(100);
  });
});

describe("R20.11 — artifact gates (Fase 4)", () => {
  const distIndex = readIfExists("dist/index.html");

  it("the built HTML preloads the split chunks and links the stylesheet", () => {
    if (!distIndex) return; // suite runs before vite build in CI
    expect(distIndex).toContain('rel="modulepreload"');
    expect(distIndex).toMatch(/<link rel="stylesheet"[^>]+href="\/assets\/index-[^"]+\.css"/);
    const scripts = [...distIndex.matchAll(/<script[^>]+type="module"[^>]+src="\/assets\/([^"]+)"/g)];
    expect(scripts.length).toBe(1);
    const preloads = [...distIndex.matchAll(/rel="modulepreload"[^>]+href="\/assets\/([^"]+)"/g)].map((m) => m[1]);
    expect(preloads.length).toBeGreaterThan(1);
    expect(new Set(preloads).size).toBe(preloads.length); // no duplicate hints
  });
});
