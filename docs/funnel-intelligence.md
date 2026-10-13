# Funnel Intelligence — R20.2

Pure computation over R20.1 events (`src/lib/funnel-intelligence.ts`).
No DOM, no storage, no network, no PII. Feeds on event arrays from any
source: the debug ring buffer, `dataLayer`, or a future warehouse export.

## Official funnel model V1

```
VISIT → PAGE (page_view) → PILLAR (pillar page_view)
  → CTA (cta_click) → INTENT (audit_open) → FORM (start/submit)
  → SUBMIT (form_submission / schedule_appointment)
```

Stage mapping (code: `getFunnelStats`):
| Stage | Events counted |
|---|---|
| views | `page_view` |
| cta | `cta_click` (all) |
| intent | `cta_click` with label `audit_open` |
| start | `form_step` labels ending `_start` |
| submit | `form_step` labels ending `_submit` |
| success | `form_submission` + `schedule_appointment` |

## Attribution

`attributeJourney(steps)` → `{ origin, lastPage, lastPillar,
pillarTouched, length }`. Pillar resolved per path (`pillarForPath`):
`/agentes-ia` → ai, `/solucoes/integracoes-erp-crm` → automation,
`/solucoes/desenvolvimento-software` → software,
`/solucoes/marketing-digital` → growth (market prefixes tolerated).
A conversion counts for the pillar **last touched** in its journey.
Journeys come from R20.1 success payloads (`data.journey`) via
`extractJourneys`. Paths only — never query strings, never PII.

## Rankings

`rankBy` = frequency desc, ties alphabetical (deterministic).
- `getTopPages`: `page_view` → path.
- `getTopCTAs`: `cta_click` (+ audit_open) → `category.label`.
- `getTopProducts`: `product_interaction` → `data.product`.
- `getTopJourneys`: journeys → `a → b → c`.

## Leak detection

`detectLeaks(stats)` walks views → cta → intent → start → submit →
success; each leak = `{ from, to, rate (to/from, null on zero
denominator), loss (from − to) }`, sorted by absolute loss desc — the
first item is the biggest opportunity.

## Form intelligence

`getFormStats(events, form)` → starts, submits, successes, abandons,
errors; `completionRate = successes/starts`, `abandonRate =
abandons/starts` (null without starts). Errors = `form_submission`
labels containing `error`.

## Scroll intelligence

`getScrollStats(events)` groups `scroll_depth` by location (label
prefix), counts p25/50/75/100, and names the `weakestZone` (largest
inter-threshold drop with a non-zero denominator, e.g. `50→75`).

## Pillar performance

`getPillarStats(events, conversionJourneys)` per pillar: views (pillar
page_views), depth50/100 (pillar scroll locations), ctaClicks
(`ai_*`/`automation_*`/`software_*`/`growth_*` categories, excluding
`audit_open` which is counted separately as intent), intents
(`audit_open` with the pillar's scroll location as category),
conversions (journeys last touching the pillar).

## Debug report (internal, `?gb_debug=analytics` only)

`getIntelligenceReport(events, journeys?)` → top page/CTA/journey/
product + funnel + biggest leak. Auto-printed on every conversion
event; also callable as `window.__gbFunnelReport()` in debug mode.

## Limitações (read before quoting a number)

1. **No user identity** (no cookies, no ids): every rate is an
   EVENT-based proxy, not a person-based rate. `completionRate` =
   successes ÷ starts (events), not "x% of people".
2. Abandon fires on pagehide/unmount without submit — tab closes count
   even if the user returns later in a new page view.
3. Scroll thresholds fire once per page load; back-navigation restarts.
4. Journeys cap at 20 steps; only successful conversions carry them
   (abandoned paths are invisible to journey ranking).
5. Debug ring buffer holds the last 100 events in memory only.
