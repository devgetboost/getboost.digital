# Revenue Attribution Engine — R20.18

Closes the commercial loop. The website already tracked
visitor → lead → qualified lead → meeting; this wave carries the rest of
the lifecycle — meeting → proposal → negotiation → won/lost — and answers,
per page, product, service, channel and campaign, **how much revenue each
one produced**.

Still no backend integration, no CRM provider, no automation, no
autonomous agent, no ML and no new dependency. Money enters the system only
through an operator-initiated import, and the layer refuses to invent a
single euro.

---

## 1. Commercial pipeline audit (Phase 1)

| Stage | Visibility before | Visibility now | Source |
|---|---|---|---|
| Visitor | ✅ analytics | ✅ | browser events |
| Lead | ✅ CRM records | ✅ | `crm-qualification` |
| Qualified lead | ✅ tiering | ✅ | `lead-score` |
| Meeting | ✅ booked signal | ✅ | booking events |
| Proposal | ❌ | ✅ imported opportunity | CRM export |
| Negotiation | ❌ | ✅ imported opportunity | CRM export |
| Won | ❌ | ✅ imported opportunity | CRM export |
| Lost | ❌ | ✅ imported opportunity | CRM export |

Ownership of the invisible stages sits outside the website by design: they
are recorded in the operator's CRM. The website's job is to receive them,
join them to the journey that produced them, and never fabricate the gap.

## 2. Revenue data model (Phase 2)

`src/lib/revenue-attribution.ts` holds the canonical entities.

* **Lead** — `lead_id`, `source`, `medium`, `campaign`, `landing_page`,
  `service_interest`, `product_interest`. Browser identity stays
  pseudonymous (`lead_<hash>`, a deterministic signature of the visited paths).
* **Opportunity** — `opportunity_id`, `lead_id`, `crm_id`, `source`,
  `medium`, `campaign`, `landing_page`, `service_interest`,
  `product_interest`, `case_interest`, `proposal_value`, `won_value`,
  `close_date`, `status` (`open` → `proposal_sent` → `negotiation` →
  `won` / `lost`).
* **Revenue event** — the append-only ledger: `opportunity_id`, `lead_id`,
  `stage`, `value`, `occurred_at`. Every euro is traceable to a transition.
* **Revenue attribution** — all three models per deal: `first_page`,
  `first_source`, `last_source`, `meeting_source`, `revenue_source`,
  `multi_touch`.

`normalizeOpportunity` rejects rows it cannot trust (won without value or
close date, unknown stage, negative money) instead of repairing them.

Persistence: `supabase/migrations_next/20261009_revenue_attribution.sql`
(staged, **not** in the frozen Clean V1 chain) creates `opportunities` and
`revenue_events` with RLS admin-only, indexes for the attribution hot paths
and database-level constraints that reject a `won` row without a value and
close date. The migration contract is enforced by
`src/tests/revenue-migration.test.ts`.

## 3. CRM writeback (Phase 3)

`supabase/functions/revenue-writeback/` receives stage changes from the
operator/CRM:

```
POST /functions/v1/revenue-writeback
Authorization: Bearer <REVENUE_WEBHOOK_SECRET>
{ "opportunity_id", "lead_id", "crm_id", "deal_stage", "deal_value", "close_date" }
```

Behaviour:

* 401 without the secret (constant-time compare), 413 on oversized bodies,
  429 on bursts, 400 on any invalid stage, negative value or `won` without
  value + close date.
* Linkage check: the opportunity must belong to the given `lead_id` (409).
* Idempotent per (opportunity, stage, day): a replay returns the existing
  event instead of duplicating a deal.
* Appends to `revenue_events` **and** advances the opportunity.

The browser never writes these tables; RLS denies anonymous and
authenticated callers, exactly like `leads` and `bookings`.

**Operator action (blocker B9)**: set `REVENUE_WEBHOOK_SECRET`, apply the
staged migration after backup, and configure the CRM to call the endpoint.

## 4. Attribution methodology (Phase 4)

| Model | Definition |
|---|---|
| First touch | first page of the journey and the CRM `source` that opened it |
| Last touch | last journey step before the close (fallback: CRM `source`) |
| Multi touch | the ordered, de-duplicated journey |
| Meeting source | the last touch at or before the `/booking` step |
| Revenue source | the CRM `source` of the opportunity |

Nulls are used wherever the data is absent — a deal with no matching lead
reports `null` instead of borrowing another lead's journey.

## 5. Revenue dashboard (Phase 5)

`DashboardData.revenue.attribution` is built only when the imported dataset
carries `opportunities[]`. The Revenue panel then renders: revenue, pipeline,
lost value, average deal, win rate, an executive scorecard, the commercial
funnel, and revenue by source, medium, campaign, landing page, product,
service, case study and channel. With no import it renders an honest empty
state.

## 6. Commercial funnel (Phase 6)

`getCommercialFunnel` counts Visitors → Leads → Qualified → Meetings →
Proposals → Negotiations → Won → Lost and a conversion rate between each
pair. A rate is only computed above a five-unit floor on the previous stage;
below it the rate is `null`, never a fake percentage.

## 7 & 8. Product and service attribution

Products are sliced from `product_interest` and services from
`service_interest`, with a landing-page → service map and a pillar fallback
(`/agentes-ia` → AI, `/solucoes/*` → its pillar). Views, CTA clicks, demos,
meetings and opportunities continue to come from the R20.8 demand engine.

A case study is only credited when the journey actually reached the page
that case links to (`caseFromJourney`), or when the operator filled
`case_interest` on the row. Sector, product name and vibes are never
attribution.

## 9. Source ROI (Phase 9)

`getSourceRoi` ranks sources by revenue and deals. **ROI multiples are only
computed when spend is supplied** (`spendBySource`); with no spend the
field is `null` — the report never estimates ad spend.

## 10. Executive scorecard (Phase 10)

`getExecutiveScorecard` produces traffic, leads, meetings, proposals, won
deals, pipeline €, revenue €, average deal €, win rate, growth vs the
previous period, and the top source, product, service and case.

## 11. Data quality gates (Phase 11)

`checkRevenueQuality` flags, per row: duplicate opportunity, revenue
without source, proposal without lead, customer without browser
attribution, orphan stage, missing value and missing writeback. Each issue
carries the row id and a human-readable rule; nothing is auto-repaired —
the operator fixes the CRM.

## 12. Remaining blind spots

* **Web→revenue linkage depends on the CRM stamping `lead_id`.** The
  browser lead id is pseudonymous; joining a CRM row to a journey requires
  the operator to carry `metadata.lead_ref` (or match on source + landing +
  date). Until then, attribution falls back to the CRM's own source fields
  and the dashboard says so.
* **No revenue value in any public claim** — none is implied anywhere on the
  site by this wave.
* **ROI needs spend** from the ad platforms, which are not connected.
* The staged migration must be applied and the writeback secret set before
  any real deal can flow; until then the dashboard stays in empty state.
* Meeting→Proposal→Negotiation transitions remain CRM-side facts; the
  website only stores what the operator sends.
