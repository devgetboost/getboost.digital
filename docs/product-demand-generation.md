# Product Demand Generation — R20.8

Product management stops being a matter of perception: every answer comes
from the R20.1 event stream, computed by pure functions. No page, product,
claim or metric was invented, and no frozen surface was touched (homepage,
premium pages, pillars, design/motion system, SEO foundation, landing
network and case studies are unchanged).

## 1. Product demand framework (Fase 1)

`Produto → View → Interest → Assessment → Lead → Booking → Meeting`
(`PRODUCT_DEMAND_STAGES`). Each product gets the same seven-stage funnel,
whatever its maturity.

## 2. Landing audit (Fase 5) — derived, never declared

| Product | Landing | Route |
|---|---|---|
| Qook, Motivae, Pikto, Trackfy | LANDING_EXISTS | `/qook`, `/motivae`, `/pikto`, `/trackfy` |
| Alojify, Safely, Descobre Quem Tu És, Guia Cities | LANDING_MISSING | none (institutional by R19.8 contract) |

`getProductLandingAudit(resolvableRoutes)` classifies from the route table —
a product whose route stops resolving flips to LANDING_MISSING. No product
ever gains a route here.

## 3. Product score engine (Fase 3)

Composite 0–100 from five normalized sub-scores, log-scaled so a single
viral day cannot dominate:

| Component | Weight | Source |
|---|---|---|
| Awareness | 0.20 | product view volume |
| Interest | 0.25 | interest + click interactions |
| Intent | 0.20 | assessment opens |
| Lead generation | 0.20 | leads captured |
| Commercial potential | 0.15 | bookings + meetings |

Weights live in `DEFAULT_SCORE_WEIGHTS` and sum to 1 (CI-enforced).

## 4. Demand ranking (Fase 4)

`getDemandRanking` → top interest, top leads, top meetings, top potential,
top conversion. Ties break deterministically (alphabetical), conversion
rates only above a 100-view floor.

## 5. Product CRO (Fase 9)

`getProductCROInsights` reports the leakiest stage (steepest drop above a
20-event floor) and the intent strength (deepest stage reached).

## 6. Attribution (Fase 15)

`getProductAttribution` reads the recorded journey: last landing path, pillar
route and case detail path (`/portfolio/<slug>`) seen before the product
route, plus the assessment id when stamped. A case only attributes to a
product when the case slug IS the product slug — never a guess.

## 7. Validation (Fase 16)

| Class | Rule |
|---|---|
| VALIDATED | leads AND (booking or meeting) |
| PROMISING | leads without revenue signal |
| EARLY SIGNAL | interest or views only |
| NO SIGNAL | catalog presence only |

## 8. Opportunity engine (Fase 17)

Recommendations only — `CREATE_LANDING`, `EXPAND_SEO`, `CREATE_CASE`,
`EXPAND_ASSESSMENT`, `INVEST_ACQUISITION`, `VALIDATE_MVP` — sorted by
priority, deterministic, never executed. Products without a landing always
receive a CREATE_LANDING recommendation.

## 9. Waitlist engine (Fase 6)

Reusable flow `NOT_JOINED → WAITLISTED → CAPTURED → AVAILABLE` for the four
products with no landing page (Alojify, Safely, Guia Cities, Descobre Quem
Tu És). It creates no page and no product: it emits state, PII-free
tracking payloads and per-product stats, and an operator chooses where the
capture surface lives.

## 10. Tracking taxonomy (Fase 7)

Official names `product_view | product_click | product_interest |
product_assessment | product_waitlist | product_lead | product_booking`
travel as `data.action` under the existing `product_interaction` event —
the event name is never renamed, so downstream GA4/GTM/CRM reports keep
working. New helpers: `trackProduct` (widened action union),
`trackWaitlist`, `trackProductDemand`.

## 11. Product lead magnets (Fase 10)

The brief asks for six product-specific instruments (Restaurant Readiness,
Personal Growth Assessment, …). Those do not exist in the R20.4 engine and
authoring them is content creation, not demand generation, so each product
maps to the closest REAL engine via `PRODUCT_ASSESSMENT`, with a written
rationale per product:

| Product | Engine | Rationale |
|---|---|---|
| Qook | operations-score | operação de restaurante (POS, mesas, pedidos) |
| Motivae | growth-score | retenção de talento é crescimento de equipa |
| Alojify | operations-score | gestão de alojamento é operação |
| Pikto | software-readiness | maturidade para adotar um SaaS de criação |
| Trackfy | automation-audit | rastreamento de frota é integração + automação |
| Safely | operations-score | segurança operacional apoia-se em processos |
| Descobre Quem Tu És | operations-score | maturidade operacional de quem procura |
| Guia Cities | growth-score | guia de cidades é canal de aquisição |

When brand-authored product instruments exist, only `assessmentId` changes.

## 12. Positioning dossiers (Fase 11)

Fields come exclusively from the catalog record (ICP/market ← `category`,
value ← `tagline`, problem ← `description`, state ← `status`). Alojify,
Safely and both platforms report the unsupported fields as
`missingFields` instead of receiving invented positioning; the primary
channel is derived (`landing` / `case` / `waitlist`).

## 13. Dashboard + CRM layers (Fases 12, 13)

`getDemandDashboard` returns per-product demand/interest/lead/meeting/
conversion scores plus the validation class — data only, no UI (R20.12
renders it). `getCrmOpportunitySignals` returns product → stage
(INTEREST/LEAD/MEETING) + score + ISO timestamp records for a future CRM
integration.

## 14. Product network (Fase 14)

`getProductNetwork` connects each product to its cases (R20.7), pillars
(pillar dataset), landings (R20.6 network) and assessment engine — the
Authority layer extended, all derived.

## Limitations

- Event-proxy counts (never person counts), inherited from R20.2.
- Bookings and meetings attribute through the recorded journey; without a
  journey the conversion stays unattributed rather than guessed.
- Rates only above documented floors (20 events per step, 100 views).
- Scores are relative to the observed maximum in the same event set —
  they rank products against each other, they are not absolute market
  share.
- Dossiers inherit every catalog field that is still empty (4 of 8
  products).

## Gaps carried forward

- No product-specific assessments exist yet (see §11).
- Waitlist capture has no UI surface: the engine is ready, the operator
  decides where the form lives (and whether Alojify/Safely get a real
  landing first — `CREATE_LANDING` is recommended for both).
- Product demand is measured on the routes that exist; institutional
  products can only show waitlist interest until they have a page.
