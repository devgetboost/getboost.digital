# CRO Foundation — R20.3

Methodology, formulas, scores and interpretation for conversion work.
Implementation: `src/lib/cro-foundation.ts` (pure, no PII, no side
effects). Source data: R20.1 events via `src/lib/funnel-intelligence.ts`.

## Leak severity (getTopLeaks)

Stage conversion rate `r = to/from`:
| rate | severity |
|---|---|
| r < 0.10 | CRÍTICO |
| r < 0.25 | ALTO |
| r < 0.50 | MÉDIO |
| r ≥ 0.50 | BAIXO |
| null (no denominator traffic) | BAIXO (no proven loss) |

Sorted by absolute loss desc — fix the first item first.

## CTA performance (getCTAPerformance)

`score = 60·(clicks/maxClicks) + 25·isIntent + 15·isBookingCTA`,
rounded to 1 decimal. `isIntent` = `audit_open` label; `isBookingCTA`
= label contains booking/contact/demo/audit. `getBestCTA`/`getWorstCTA`
= extremes (null without CTAs). Page-level contribution
(`getPageContribution`) = share of converting journeys touching the
page — journey-level, since no identity join exists.

## Pillar ranking (getPillarRanking)

Ordered by conversions → ctaClicks → alpha. Per pillar: `ctaRate =
ctaClicks/views`, `bookingRate = intents/views`, `submitRate =
conversions/views` (null without views). `getBestPillar` = first.

## Product stats (getProductStats)

Per catalog slug (R19.8 registry): views (landing page_views incl.
/br /en twins), clicks, interest (reserved counter), bookingContribution
(share of converting journeys touching the product page; null without
journeys). Sorted by clicks → views → slug.

## Form hypotheses (getFormHypotheses)

Deterministic rules: no-starts → CTA invisibility; abandonRate > 0.4 →
friction; completionRate < 0.3 → validation review; errors > 0 →
format hints; else healthy-monitor. Starting points, not diagnoses.

## Scroll insights (getScrollInsights)

`consumed = p100/p25` (null without p25); weakest zone from R20.2;
implication names the placement fix (move/repeat conversion above it).

## Quick wins (getQuickWins)

Rules: biggest leak (impact by severity 5/4/3, effort 2) + non-healthy
form hypotheses (impact 4, effort 3). `priority = impact/effort`,
ordered priority → impact → area, top 5. Strings only — recommendations,
never automatic changes.

## Conversion score (getConversionScore)

`score = 100 · Σ(value·weight)/Σ(weights)` over available components:
ctaRate 25, intentRate 20, submitRate 25, scrollCompletion 15,
journeyQuality 15 (share of converting journeys touching a pillar).
Missing components excluded with renormalized weights; `coverage` =
components with data (x/5). All ratios capped at 1.

## Experiments (createExperiment/decideExperiment/suggestExperiment)

Drafts only: `{ id, hypothesis, page, primaryMetric, variants: [A, B],
status: 'draft' }`. Decisions immutable (`decided` + winner +
evidence). `suggestExperiment` converts a QuickWin to a draft a human
must approve before anything runs. Nothing here executes tests.

## Interpretação

- Score < 30: funil sem dados ou quebrado — instrumentar primeiro.
- Score 30–60: perdas claras — atacar o top leak + quick win #1.
- Score > 60 com coverage < 5: bom mas cego — expandir medição.
- Winner/loser por volume; desconfiar de amostras < 30 eventos.

## Limitações

Event-based proxies throughout (no identity): rates are event ratios,
not person rates. CTA↔conversion joins impossible at CTA granularity
(page-level contribution instead). Journeys exist only for conversions.
Institutional platforms show zero views/clicks by design (no pages).
