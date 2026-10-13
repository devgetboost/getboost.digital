# Performance Optimization — R20.11

Measured first, then optimized. Every number below comes from
`scripts/audit-critical-path.mjs` run against a real build — shipped bytes
attributed per package through Rollup sourcemaps (segment-level, so it stays
accurate on a minified build). The committed baseline is
`reports/performance-audit.json`.

## 1. Baseline and improvements

| Measure | Before | After | Change |
|---|---|---|---|
| Entry JS chunk (raw) | 1 270.1 kB | 516.7 kB | **−59 %** |
| Entry JS (gzip est.) | 384.8 kB | 156.6 kB | **−59 %** |
| Critical path (attributed) | 1 270 kB, 1 chunk | 523.3 kB, 48 parallel chunks | **−59 %**, parallel |
| CSS discovery | via JS, after bundle execution | `<link rel="stylesheet">` in HTML | one round trip removed |
| Font stylesheet | render-blocking | `media="print"` + `onload` swap | first paint no longer waits on `fonts.googleapis.com` |
| Chunks emitted | 289 | 263 | vendor consolidation |
| Lazy boundaries | 144 | 144 | unchanged (already correct) |

## 2. What was actually done

1. **Vendor chunking** (`vite.config.ts`) — react, motion, i18n, supabase and
   UI primitives split into stable `vendor-*` chunks. Browsers download them
   in parallel with app code and keep them cached across deploys instead of
   invalidating on every first-party edit. Deliberately **no catch-all
   chunk**: forcing every remaining dependency together would make a single
   lazy route download the union of all of them.
2. **Global CSS linked from `index.html`** instead of imported by `main.tsx` —
   the preload scanner finds the stylesheet immediately instead of after the
   bundle executes. Cascade order (base layer, then the frozen token layer)
   is preserved and CI-guarded.
3. **Non-blocking font stylesheet** with a `<noscript>` fallback. Tradeoff: a
   brief fallback-font flash on very slow connections; `display=swap` already
   prevented invisible text.

## 3. Core Web Vitals model (Fase 3)

`src/lib/performance.ts` implements Google's published budgets (LCP 2500,
INP 200, CLS 0.1, TTFB 800, FCP 1800) with good / needs-improvement / poor
bands, p75 aggregation, and `NO_DATA` instead of a guess when no field data
exists yet. **No field data is available in this environment**, so the
vitals ratings in CI are structural, not measured — the layer is ready to run
against an RUM export.

## 4. Bundle analysis (Fases 1, 4, 9, 10)

Critical path = entry script + every chunk `index.html` preloads (48 chunks,
523.3 kB attributed). Composition:

| Package | Bytes | Note |
|---|---|---|
| motion-dom (+ framer-motion) | ~95 kB | frozen motion system; used at first paint |
| i18next | 44 kB | needed for first text render |
| @tanstack/query-core | 35 kB | data layer |
| sonner | 27 kB | global toaster, imported eagerly in App |
| **@supabase stack (7 packages)** | **112 kB** | **auth + data client, not needed for first paint** |
| app (first-party) | 52 kB | — |

Deferred: 1 984.3 kB across 34 packages (admin, charts, html2canvas, date-fns).

## 5. Assets (Fases 6, 7)

`getAssetInsights` flags anything over 250 kB and any JPEG/PNG that would
benefit from AVIF/WebP. Measured: 3.9 MB of raster assets in `public/`, with
`public/images/blog/ia-transformar-pequenas-empresas-portugal.jpg` at 940 kB
and `ia-marketing-atrair-clientes.jpg` at 743 kB — both above budget and
both on blog routes. No image was converted in this wave: re-encoding
changes binary assets that belong to the content owner.

## 6. Route splitting (Fase 5)

Already correct and CI-enforced: 144 lazy boundaries, with **exactly one**
eager page import (`Index.tsx`), deliberately inlined for LCP. The
performance suite fails if a second page is imported eagerly.

## 7. Analytics and intelligence overhead (Fases 13, 14, 17)

The R20.1–R20.10 modules are pure computation and are never imported by a
page component (CI-enforced), so the growth and sales stacks add nothing to
the critical path. Their total weight is ~80 kB across five modules, and they
are read only in debug/export contexts — R20.12 must import them
dynamically to keep INP flat (`getDashboardReadiness` measures this).

Scroll tracking (ScrollDepth) uses a throttled scroll listener with no
layout reads, so it does no work per frame beyond a threshold comparison.

## 8. Quality gates (Fase 16)

Budgets enforced in `src/lib/performance.ts`: entry JS 600 kB, entry CSS
200 kB, per-package 200 kB, aggregate vendor 350 kB, per-asset 250 kB.
Opportunities fire **only** on measured breaches and each cites the number
that produced it — no speculative advice.

Lighthouse targets (≥90 performance, ≥95 accessibility / best practices /
SEO) cannot be measured in this environment: no browser or Lighthouse
binary is available. `getPerformanceScore()` computes the composite and the
justified gaps so the first real run produces a pass/fail with reasons.

## 9. Remaining opportunities (ordered)

| # | Opportunity | Evidence | Severity |
|---|---|---|---|
| 1 | Defer the Supabase client | 112 kB (21 % of the critical path) across 7 packages, pulled eagerly by `AuthProvider` | HIGH |
| 2 | Third-party aggregate budget exceeded | 471.5 kB vendor vs 350 kB budget | HIGH |
| 3 | Convert the two oversized blog images | 940 kB and 743 kB | HIGH |
| 4 | Audit utility classes emitted for admin routes | 170 kB single stylesheet; Tailwind emits classes for every source file | MEDIUM |
| 5 | Lazy-mount the global toasters | `sonner` 27 kB + Radix layer in the critical path | MEDIUM |

Item 1 needs an auth change (session resolution would become async), so it
is documented rather than shipped in a performance wave.

## 10. Limitations

- No field data: LCP/CLS/INP/TTFB/FCP are modelled, not measured.
- Attribution covers JavaScript only; CSS and image payloads are audited by
  budget, not attributed per rule.
- Bundle numbers come from one build on one machine; gzip estimates use a
  0.303 ratio rather than actual compression.
- The audit reads `dist/`, so it must run after `vite build`.

## 11. R20.12 readiness

Analytics, funnel, product, CRM and sales layers are pure and importable
without side effects; the dashboard should load them via dynamic import.
No layer added by R20.11 sits on the visitor's critical path.
