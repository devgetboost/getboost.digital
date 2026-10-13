/**
 * R20.11 — Performance helpers (Fases 15, 16, 17).
 *
 * Pure computation over MEASURED data — build artifacts and Core Web Vitals
 * field samples. No DOM, no storage, no network: the same helpers run in CI
 * against `reports/performance-audit.json` and later against a real-user
 * monitoring export, so budgets are enforced before dashboards exist.
 *
 * Nothing here invents a number. Missing data yields `null`, never a guess.
 */

// ---------------------------------------------------------------------------
// Input contracts
// ---------------------------------------------------------------------------

export interface BundleAudit {
  /** Method that produced the numbers (documented, never implied). */
  method?: string;
  rollup: {
    chunks: number;
    totalBytes: number;
    entryJsBytes: number;
    entryJsGzipEstimate?: number;
    entryCssBytes?: number;
  };
  lazyBoundaries?: number;
  shipped?: {
    /** Bytes the browser must fetch before first paint (entry + preloads). */
    criticalBytes?: number;
    deferredBytes?: number;
    criticalPackages?: Array<{ name: string; bytes: number }>;
    largestModules?: Array<{ name: string; bytes: number }>;
  } | null;
}

export type VitalName = 'LCP' | 'CLS' | 'INP' | 'TTFB' | 'FCP';

export interface VitalSample {
  name: VitalName;
  /** Milliseconds, except CLS which is a unitless score. */
  value: number;
  route?: string;
}

export interface AssetEntry {
  path: string;
  bytes: number;
  /** Image dimensions when known. */
  width?: number;
  height?: number;
  format?: string;
}

// ---------------------------------------------------------------------------
// Fase 3 — Core Web Vitals thresholds (Google's published budgets)
// ---------------------------------------------------------------------------

/** "Good" thresholds; anything above fails the gate. */
export const VITAL_THRESHOLDS: Record<VitalName, number> = {
  LCP: 2500,
  CLS: 0.1,
  INP: 200,
  TTFB: 800,
  FCP: 1800,
};

/** "Needs improvement" thresholds; above this (but below "good") is a warning. */
export const VITAL_WARNING: Record<VitalName, number> = {
  LCP: 4000,
  CLS: 0.25,
  INP: 500,
  TTFB: 1800,
  FCP: 3000,
};

export type VitalRating = 'GOOD' | 'NEEDS_IMPROVEMENT' | 'POOR' | 'NO_DATA';

export const rateVital = (name: VitalName, value: number | null): VitalRating => {
  if (value === null || !Number.isFinite(value)) return 'NO_DATA';
  if (value <= VITAL_THRESHOLDS[name]) return 'GOOD';
  if (value <= VITAL_WARNING[name]) return 'NEEDS_IMPROVEMENT';
  return 'POOR';
};

// ---------------------------------------------------------------------------
// Fase 3 — vitals summary
// ---------------------------------------------------------------------------

export interface VitalSummaryEntry {
  name: VitalName;
  /** p75 across samples — the percentile Google scores on. */
  p75: number | null;
  median: number | null;
  samples: number;
  rating: VitalRating;
}

const percentile = (sorted: number[], p: number): number | null => {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const rank = (p / 100) * (sorted.length - 1);
  const low = Math.floor(rank);
  const high = Math.ceil(rank);
  if (low === high) return sorted[low];
  return sorted[low] + (sorted[high] - sorted[low]) * (rank - low);
};

export const getVitalsSummary = (samples: VitalSample[]): VitalSummaryEntry[] => {
  const names: VitalName[] = ['LCP', 'INP', 'CLS', 'TTFB', 'FCP'];
  return names.map((name) => {
    const values = samples
      .filter((sample) => sample.name === name && Number.isFinite(sample.value))
      .map((sample) => sample.value)
      .sort((a, b) => a - b);
    const p75 = percentile(values, 75);
    const median = percentile(values, 50);
    return {
      name,
      p75: p75 === null ? null : Math.round(p75 * 1000) / 1000,
      median: median === null ? null : Math.round(median * 1000) / 1000,
      samples: values.length,
      rating: rateVital(name, p75),
    };
  });
};

// ---------------------------------------------------------------------------
// Fase 4/5 — bundle stats + route splitting
// ---------------------------------------------------------------------------

export interface BundleStats {
  /** Lazy import boundaries found in the router. */
  lazyBoundaries: number;
  chunkCount: number;
  entryJsBytes: number;
  entryJsGzipEstimate: number | null;
  entryCssBytes: number;
  totalBytes: number;
  /** Share of shipped JS deferred out of the entry, 0–1. */
  deferredShare: number | null;
  /** Packages over the per-package budget, worst first. */
  heavyPackages: Array<{ name: string; bytes: number }>;
  /** First-party bytes in the critical path. */
  appBytes: number | null;
  /** Third-party bytes in the critical path (everything that is not app). */
  vendorBytes: number | null;
  /** Vendor packages above the per-package budget, for aggregation. */
  largestVendorPackages: Array<{ name: string; bytes: number }>;
}

export const BUDGETS = {
  /** Entry JS (raw, pre-compression). */
  entryJsBytes: 600 * 1024,
  /** Entry CSS (raw). */
  entryCssBytes: 200 * 1024,
  /** Any single vendor package inside the entry chunk. */
  packageBytes: 200 * 1024,
  /**
   * Aggregate third-party budget for the critical path. Per-package budgets
   * alone miss split stacks: the Supabase client is ~112 kB spread over seven
   * packages, none of which trips a per-package limit on its own.
   */
  vendorBytes: 350 * 1024,
} as const;

export const getBundleStats = (audit: BundleAudit): BundleStats => {
  const entryBytes = audit.shipped?.criticalBytes ?? null;
  const lazyBytes = audit.shipped?.deferredBytes ?? null;
  const deferredShare =
    entryBytes !== null && lazyBytes !== null && entryBytes + lazyBytes > 0
      ? Math.round((lazyBytes / (entryBytes + lazyBytes)) * 1000) / 1000
      : null;
  const packages = audit.shipped?.criticalPackages ?? null;
  const vendor = packages ? packages.filter((entry) => entry.name !== 'app') : null;
  return {
    lazyBoundaries: audit.lazyBoundaries ?? 0,
    chunkCount: audit.rollup.chunks,
    entryJsBytes: audit.rollup.entryJsBytes,
    entryJsGzipEstimate: audit.rollup.entryJsGzipEstimate ?? null,
    entryCssBytes: audit.rollup.entryCssBytes ?? 0,
    totalBytes: audit.rollup.totalBytes,
    deferredShare,
    heavyPackages: (packages ?? [])
      .filter((entry) => entry.bytes > BUDGETS.packageBytes)
      .map((entry) => ({ name: entry.name, bytes: entry.bytes })),
    appBytes: packages
      ? packages.filter((entry) => entry.name === 'app').reduce((sum, entry) => sum + entry.bytes, 0)
      : null,
    vendorBytes: vendor ? vendor.reduce((sum, entry) => sum + entry.bytes, 0) : null,
    largestVendorPackages: vendor
      ? [...vendor].sort((a, b) => b.bytes - a.bytes).slice(0, 5)
      : [],
  };
};

// ---------------------------------------------------------------------------
// Fase 6/7 — assets
// ---------------------------------------------------------------------------

export interface AssetInsight {
  path: string;
  bytes: number;
  /** Over the per-asset budget. */
  oversized: boolean;
  /** A raster asset that would benefit from modern formats. */
  modernFormatOpportunity: boolean;
}

/** Anything above this is a candidate for resizing/format conversion. */
export const ASSET_BUDGET_BYTES = 250 * 1024;

const MODERN_FORMATS = ['webp', 'avif'];

export const getAssetInsights = (assets: AssetEntry[]): AssetInsight[] =>
  assets
    .map((asset) => {
      const format = asset.format ?? asset.path.split('.').pop()?.toLowerCase() ?? '';
      return {
        path: asset.path,
        bytes: asset.bytes,
        oversized: asset.bytes > ASSET_BUDGET_BYTES,
        modernFormatOpportunity: ['jpg', 'jpeg', 'png'].includes(format) && !MODERN_FORMATS.includes(format),
      };
    })
    .sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));

// ---------------------------------------------------------------------------
// Fase 14 — analytics overhead
// ---------------------------------------------------------------------------

export interface AnalyticsOverhead {
  /** Bytes of instrumentation shipped, measured from source. */
  instrumentationBytes: number;
  /** Share of the entry chunk, 0–1. */
  entryShare: number | null;
  rating: 'LOW' | 'MODERATE' | 'HIGH';
}

/** Above this the instrumentation is judged to threaten LCP/INP. */
export const ANALYTICS_BUDGET_BYTES = 150 * 1024;

export const getAnalyticsOverhead = (
  instrumentationBytes: number,
  entryJsBytes: number,
): AnalyticsOverhead => {
  const share = entryJsBytes > 0 ? Math.round((instrumentationBytes / entryJsBytes) * 1000) / 1000 : null;
  const rating: AnalyticsOverhead['rating'] =
    instrumentationBytes > ANALYTICS_BUDGET_BYTES ? 'HIGH' : instrumentationBytes > ANALYTICS_BUDGET_BYTES / 2 ? 'MODERATE' : 'LOW';
  return { instrumentationBytes, entryShare: share, rating };
};

// ---------------------------------------------------------------------------
// Fase 16 — performance score + optimization opportunities
// ---------------------------------------------------------------------------

export interface PerformanceScore {
  /** 0–100 composite across the four Lighthouse categories. */
  score: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  /** Categories below target, with the gap that must be justified. */
  gaps: Array<{ category: string; score: number; target: number }>;
}

export const SCORE_TARGETS = {
  performance: 90,
  accessibility: 95,
  bestPractices: 95,
  seo: 95,
} as const;

export const getPerformanceScore = (input: {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}): PerformanceScore => {
  const scores = {
    performance: input.performance,
    accessibility: input.accessibility,
    bestPractices: input.bestPractices,
    seo: input.seo,
  };
  const score =
    Math.round((Object.values(scores).reduce((sum, value) => sum + value, 0) / 4) * 100) / 100;
  const gaps = (Object.keys(scores) as Array<keyof typeof SCORE_TARGETS>)
    .filter((category) => scores[category] < SCORE_TARGETS[category])
    .map((category) => ({
      category,
      score: scores[category],
      target: SCORE_TARGETS[category],
    }));
  return { score, ...scores, gaps };
};

export type OpportunityKind = 'BUNDLE' | 'ASSET' | 'VITAL' | 'ROUTE' | 'THIRD_PARTY';

export interface OptimizationOpportunity {
  kind: OpportunityKind;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  /** The measured number that triggered it. */
  evidence: string;
  /** What to do — a recommendation, never an automatic change. */
  recommendation: string;
}

/**
 * Fase 15/16 — every opportunity cites the measurement that produced it.
 * No speculative advice: a rule fires only on real, above-budget data.
 */
export const getOptimizationOpportunities = (
  input: {
    bundle: BundleStats;
    vitals: VitalSummaryEntry[];
    assets?: AssetInsight[];
    analytics?: AnalyticsOverhead;
  },
): OptimizationOpportunity[] => {
  const out: OptimizationOpportunity[] = [];

  if (input.bundle.entryJsBytes > BUDGETS.entryJsBytes) {
    out.push({
      kind: 'BUNDLE',
      severity: 'HIGH',
      title: 'Entry JavaScript above budget',
      evidence: `${input.bundle.entryJsBytes} B raw (budget ${BUDGETS.entryJsBytes} B)`,
      recommendation: 'Move first-party code behind lazy boundaries or split the offending package out of the entry chunk.',
    });
  }
  if (input.bundle.entryCssBytes > BUDGETS.entryCssBytes) {
    out.push({
      kind: 'BUNDLE',
      severity: 'MEDIUM',
      title: 'Entry CSS above budget',
      evidence: `${input.bundle.entryCssBytes} B raw (budget ${BUDGETS.entryCssBytes} B)`,
      recommendation: 'Audit utility classes emitted for routes no visitor reaches first (admin surfaces inflate the single stylesheet).',
    });
  }
  if (input.bundle.vendorBytes !== null && input.bundle.vendorBytes > BUDGETS.vendorBytes) {
    const top = input.bundle.largestVendorPackages
      .slice(0, 3)
      .map((entry) => `${entry.name} ${Math.round(entry.bytes / 1024)} kB`)
      .join(', ');
    out.push({
      kind: 'THIRD_PARTY',
      severity: 'HIGH',
      title: 'Third-party code dominates the critical path',
      evidence: `${input.bundle.vendorBytes} B of vendor code (budget ${BUDGETS.vendorBytes} B); largest: ${top}`,
      recommendation:
        'Defer the stack behind first paint (auth/data clients load after the shell renders) or verify each package is needed before interaction.',
    });
  }
  for (const heavy of input.bundle.heavyPackages) {
    out.push({
      kind: 'BUNDLE',
      severity: 'MEDIUM',
      title: `Heavy package in the critical path: ${heavy.name}`,
      evidence: `${heavy.bytes} B in the entry chunk (budget ${BUDGETS.packageBytes} B)`,
      recommendation: 'Defer this dependency behind the interaction that needs it, or verify it is genuinely required at first paint.',
    });
  }
  if (input.bundle.deferredShare !== null && input.bundle.deferredShare < 0.5) {
    out.push({
      kind: 'ROUTE',
      severity: 'MEDIUM',
      title: 'Little code is deferred out of the entry',
      evidence: `${Math.round((input.bundle.deferredShare ?? 0) * 100)}% of shipped JS is lazy`,
      recommendation: 'Audit eager imports in the app shell; route components should stay behind lazy boundaries.',
    });
  }
  for (const vital of input.vitals) {
    if (vital.rating === 'POOR' || vital.rating === 'NEEDS_IMPROVEMENT') {
      out.push({
        kind: 'VITAL',
        severity: vital.rating === 'POOR' ? 'HIGH' : 'MEDIUM',
        title: `${vital.name} is ${vital.rating.replace('_', ' ').toLowerCase()}`,
        evidence: `p75 ${vital.p75} (good ≤ ${VITAL_THRESHOLDS[vital.name]}, poor > ${VITAL_WARNING[vital.name]})`,
        recommendation:
          vital.name === 'CLS'
            ? 'Reserve space for dynamic blocks (images, embeds, async sections) to remove layout shift.'
            : 'Reduce critical-path work: defer non-essential scripts and compress the largest transferred assets.',
      });
    }
  }
  for (const asset of (input.assets ?? []).slice(0, 10)) {
    if (asset.oversized) {
      out.push({
        kind: 'ASSET',
        severity: asset.bytes > ASSET_BUDGET_BYTES * 2 ? 'HIGH' : 'MEDIUM',
        title: `Oversized asset: ${asset.path}`,
        evidence: `${asset.bytes} B (budget ${ASSET_BUDGET_BYTES} B)`,
        recommendation: 'Resize to the largest rendered dimension and serve an AVIF/WebP variant.',
      });
    }
  }
  if (input.analytics && input.analytics.rating === 'HIGH') {
    out.push({
      kind: 'THIRD_PARTY',
      severity: 'HIGH',
      title: 'Instrumentation payload above budget',
      evidence: `${input.analytics.instrumentationBytes} B (budget ${ANALYTICS_BUDGET_BYTES} B)`,
      recommendation: 'Move the intelligence modules behind dynamic imports: they are only read in debug or export contexts.',
    });
  }

  const severityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return out.sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.title.localeCompare(b.title));
};

// ---------------------------------------------------------------------------
// Fase 17 — R20.12 readiness
// ---------------------------------------------------------------------------

export interface DashboardReadiness {
  ready: boolean;
  /** Each R20 layer that must stay cheap when a dashboard reads it. */
  layers: Array<{ layer: string; bytes: number; deferred: boolean }>;
  totalBytes: number;
  /** Share of intelligence code that is lazy-loaded. */
  deferredShare: number;
}

/**
 * The dashboard in R20.12 reads analytics, demand, CRM and sales layers.
 * They are pure computation — safe to import — but only needed at export or
 * debug time, so the dashboard must import them dynamically to keep INP flat.
 */
export const getDashboardReadiness = (
  layers: Array<{ layer: string; bytes: number; deferred: boolean }>,
): DashboardReadiness => {
  const totalBytes = layers.reduce((sum, layer) => sum + layer.bytes, 0);
  const deferredBytes = layers.filter((layer) => layer.deferred).reduce((sum, layer) => sum + layer.bytes, 0);
  return {
    ready: layers.length > 0 && totalBytes > 0,
    layers,
    totalBytes,
    deferredShare: totalBytes > 0 ? Math.round((deferredBytes / totalBytes) * 1000) / 1000 : 0,
  };
};
