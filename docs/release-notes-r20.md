# GETBOOST 2027 — R20 Release Notes (RC1)

**Candidate:** R20-RC1 · **Branch:** `main` · **Base commit at audit:** `46a4f11`
**Scope:** R20.1 → R20.12 (analytics → dashboard), on top of Waves 2–3
(R18/R19: premium UI, navigation IA, pillars, product catalog).

This release contains **no backend, no CRM integration, no outbound
automation and no autonomous decision-making**. Everything shipped is either
presentation or pure computation over events the platform already emits.

---

## Executive summary

R20 turned a website into an instrumented platform: every strategic question
the business asks — which product draws demand, which lead is worth a call,
where the funnel leaks — is now answered by code from observed behaviour,
with every rule auditable and no number invented.

| Area | Before R20 | After R20 |
|---|---|---|
| Analytics | ad-hoc GTM events | scrubbed taxonomy, PII-free, debug-gated |
| Funnel | none | journeys, attribution, leak detection |
| CRO | none | CTA/pillar/scroll scoring, quick wins, experiments |
| Lead capture | contact form only | 5 transparent assessments, scoring, tiers |
| SEO | pages | keyword architecture, intent matrix, 10-landing satellite network |
| Proof | portfolio gallery | case framework, 6 commercial narratives, proof network |
| Products | catalogue | demand scores, validation classes, opportunity ranking |
| Leads | anonymous events | qualification tiers, product fit, CRM contract |
| Sales | none | next-best-action engine, explainable, recommendation-only |
| Performance | unmeasured | measured baseline, −59 % entry chunk, budgets in CI |
| Management | none | internal Revenue Dashboard (import-driven) |

---

## R20.1 — Analytics Foundation
Event taxonomy, centralised PII scrubbing (plus defence at every call site),
journey recording, booking/contact lifecycles, product interaction, debug
mode and a rolling funnel report.
→ `docs/analytics-inventory.md`

## R20.2 — Funnel Intelligence
Journey attribution (origin / last pillar / endpoint), rankings, funnel and
leak math, form and scroll statistics, per-pillar rollups.
→ `docs/funnel-intelligence.md`
**Known limit:** event-proxy counts, never person counts.

## R20.3 — CRO Foundation
Leak severity classification, CTA and pillar performance, product rollups,
scroll insights, quick-win detection, a composite conversion score and an
experiment model.
→ `docs/cro-foundation.md`

## R20.4 — Lead Magnet System
Five assessments with transparent 0–2 per-option scoring, tiers (<40 / <70 /
≥70), quiz → score → lead gate → analysis flow, CRM write with PII kept out
of analytics.
→ `docs/lead-magnet-system.md`

## R20.5 — SEO Foundation 2.0
Keyword architecture, search-intent matrix, topic authority map, content-gap
analysis, opportunity engine and the landing expansion roadmap.
→ `docs/seo-foundation-2.0.md`

## R20.6 — SEO Landing Expansion
Ten high-intent satellite landings on one data-driven template (AI verticals,
WhatsApp/CRM/ERP, SaaS/gestão, growth), FAQ + breadcrumb + WebPage schema,
internal linking V3, lead magnets mapped per pillar, full SEO gates.
→ `docs/seo-landing-expansion.md`
**Note:** the brief's keyword-research artefact did not exist in the repo;
selection follows the brief's prioritised slugs verbatim, recorded as the
de-facto opportunity set.

## R20.7 — Case Studies Premium
Official case framework (contexto → desafio → diagnóstico → solução →
implementação → resultado → próximos passos), premium case template with
conditional stages, authority layer v2, contextual assessment mapping, case
intelligence (interest / leads / scroll / meetings).
→ `docs/case-studies-premium.md`
**Rule honoured:** no invented client, metric, testimonial or number — every
narrative is content the site already shipped.

## R20.8 — Product Demand Generation
Official demand journey, per-product funnels, weighted 0–100 score engine,
rankings, landing audit, waitlist engine, product taxonomy, product playbooks,
attribution, validation classes (VALIDATED → NO_SIGNAL) and an
opportunity-recommendation engine.
→ `docs/product-demand-generation.md`

## R20.9 — CRM Qualification
CRM model and canonical data contract with an export validator, unified lead
signal engine, deterministic pseudonymous lead identity (`lead_<hash>`),
five-component lead score, transparent HOT/WARM/COLD/NURTURE rules, rule-based
product fit, opportunity classification, pipeline analytics and a
deterministic priority queue.
→ `docs/crm-qualification.md`

## R20.10 — AI Sales Layer
Sales model, action engine (BOOK_CALL / SEND_PROPOSAL / NURTURE / WAIT), next
best action with a full audit trail, opportunity prioritisation, hot-lead and
nurture engines, proposal readiness gates, sales + product playbooks, sales
analytics and R20.12 dashboard feeds.
→ `docs/ai-sales-layer.md`
**Name clarification:** there is no artificial intelligence in this layer —
no model, no inference, no provider. It is an explicit decision engine, and
CI proves it.

## R20.11 — Performance Optimization
Measurement first: a critical-path audit tool that attributes shipped bytes
per package through Rollup sourcemaps. Then three optimisations — vendor
chunking, global CSS linked from HTML, non-blocking font stylesheet — taking
the entry chunk from 1270 kB to 517 kB (−59 %). Budgets and opportunity
rules live in CI.
→ `docs/performance-optimization.md`, `reports/performance-audit.json`

## R20.12 — Revenue Dashboard
Import-driven executive dashboard with nine isolated panels (executive,
marketing, lead magnets, SEO, cases, products, CRM, sales, revenue), alert
engine, executive insights, top performers. Internal route, role-guarded,
not indexed, lazy-loaded and verified off the critical path.
→ `docs/revenue-dashboard.md`

## R20.13 — R20.17 — Positioning, proof, cases, conversion, growth
Title-per-page positioning, 44 objection blocks answered from on-page facts,
proof engine with unsupported claims removed, six shipped case narratives
distributed as proof strips, CTA and conversion attribution (UTMs, journey,
click id), 90-day growth operating system.
→ `docs/growth-operating-system.md`

## R20.18 — Revenue Attribution Engine
Canonical revenue entities (lead, opportunity, revenue event, attribution),
a secret-gated `revenue-writeback` edge function with an append-only ledger,
first/last/multi-touch attribution, a staged migration (`opportunities`,
`revenue_events`) kept outside the frozen Clean V1 chain, and the dashboard
panels that answer revenue by source, medium, campaign, landing page,
product, service, case study and channel — plus the commercial funnel, the
executive scorecard and the data-quality gates.
→ `docs/revenue-attribution.md`

---

## Bugs found and fixed by these waves

Integration surfaced defects that per-wave testing had not:

| Found by | Defect | Fix |
|---|---|---|
| R20.10 | test resolved the "warm" lead to the hot one (both carried an assessment id) | test helper scoped to non-booked |
| R20.12 | R20.8 product funnels matched `lead_capture`; the engine emits `assessment_lead_capture` — every assessment-captured lead was invisible in product demand | corrected event set |
| R20.12 | executive KPI read `funnel.bookings`, a field `FunnelStats` does not have → "Reuniões" rendered `undefined` | computed from events |
| R20.11 | audit attributed entry-chunk bytes only to `index-*.js`, missing every split vendor chunk | critical path now derived from `index.html` preloads |
| R21.1 | `/dashboard` and `/colaborador` were absent from `robots.txt` | added to `Disallow` |

---

## Validation state at RC1

| Gate | Result |
|---|---|
| `tsc --noEmit` | 0 errors |
| Test suite | 74 files / 930 tests green |
| `vite build` | success |
| Secrets in commit | none |
| Lockfiles | unchanged (no dependency drift) |

Validation re-run after R20.18 (revenue attribution): `tsc` 0 errors, 74
files / 930 tests green, `vite build` success, lockfiles unchanged. The
`opportunities` and `revenue_events` migration is **staged**
(`supabase/migrations_next/`) and not applied: `SAFE_FOR_PRODUCTION` stays
`NO` until the operator runs it and sets `REVENUE_WEBHOOK_SECRET`.

## Not in this release

No backend, no database migration, no CRM provider, no email sending, no
outreach automation, no autonomous agents, no new third-party dependency.
