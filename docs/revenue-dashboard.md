# Revenue Dashboard — R20.12

The command centre. One dataset in, every view out: traffic, leads,
qualification, opportunities, products, pipeline and the next commercial
action per lead.

No backend, no external CRM, no automation, no autonomous AI, and no change
to any public page. Most importantly: **no invented number**. With no dataset
loaded the dashboard shows zeros and says so.

## 1. Where the data comes from

Analytics events live in the browser's session buffer (100 events, gone on
refresh). That is not a business record, so the dashboard never reads it as
one. It reads an **exported dataset**: paste a GA4/GTM/warehouse export as
JSON (array, `{events:[…]}` or `{data:[…]}`) and every panel recomputes from
scratch. Nothing is uploaded — the import happens in the page, and the raw
JSON never leaves the browser.

The alternative — wiring a real backend — is explicitly out of scope and
would also require the platform decisions the operator has not made yet.

## 2. Architecture (Fase 1)

`src/lib/dashboard-data.ts` is the only data layer; the page never computes
anything. Nine isolated panels, each responsible for one domain:

| Panel | Consumes |
|---|---|
| Executive | R20.1, R20.2, R20.8, R20.9 |
| Marketing | R20.1, R20.2 (funnel, CTAs, landings, scroll) |
| Lead Magnets | R20.4 (`getAssessmentStats`) |
| SEO | R20.6 landing network coverage and clusters |
| Cases | R20.7 (`getCaseIntelligence`) |
| Products | R20.8 demand, validation, ranking |
| CRM | R20.9 tiers, pipeline, conversion |
| Sales | R20.10 actions, hot leads, priority bands |
| Revenue | consolidation + the eight approval answers |

`buildDashboardData(dataset)` composes all of them from the R20.1 event
stream. The layer is pure — the same dataset always produces the same view.

## 3. KPIs (Fase 2)

Tráfego · Interesse · Leads · Qualificados · Oportunidades · Reuniões, plus
top pages, top CTAs, top products and top assessments. Every KPI is an event
count from the imported dataset; none is extrapolated.

## 4. Alert engine (Fase 12)

Visual only — nothing fires, nothing sends. Each alert carries the measured
evidence that triggered it:

`no-data` · `no-leads` · `low-conversion` · `no-opportunities` ·
`no-demand` · `low-seo-coverage` · `mostly-waiting`

Sorted CRITICAL → WARNING → INFO. With no dataset the only alert is
`no-data` (INFO): the dashboard never manufactures a problem.

## 5. Executive insights (Fase 13)

Derived from the same numbers, each with evidence: top landing, top case,
top product, biggest opportunity, biggest bottleneck (no opportunities /
excess nurture) and the leading pillar.

## 6. UI (Fase 14)

Built on the frozen R18.8 token layer (`gb-*` surfaces, chips, display type,
grid overlay) with the R18.9 fade-up reveal. Rankings are CSS bars — **no
chart library** — which keeps the R20.11 bundle budget intact and avoids
recharts on an internal page.

## 7. Route and access (Fase 15)

`/dashboard`, lazy-loaded and wrapped in the existing
`RequireRoles anyOf={['admin','collaborator']}` guard. No market twin, not
listed in the header, footer, sitemap or landing network, and `noIndex` on
its SEO block. CI asserts all of that.

## 8. Performance (Fase 16)

The route is a 45.1 kB lazy chunk and is **not** in the visitor critical
path (verified by `scripts/audit-critical-path.mjs`; the performance suite
asserts it). The critical path moved 523.3 → 524.7 kB — the +1.4 kB is the
route registration in `App.tsx`, which is the cost of having the page.

## 9. Two upstream bugs the dashboard exposed

Building the panels surfaced defects in earlier waves, both fixed here:

1. **R20.8 product demand missed every assessment-captured lead.** The
   funnel matched a `lead_capture` event name that the R20.4 engine never
   emits; the real name is `assessment_lead_capture`. Product funnels
   therefore showed zero leads for assessment traffic.
2. **Executive KPI read a field that does not exist** (`funnel.bookings`),
   rendering "Reuniões" as `undefined` instead of a count.

Both were caught by the new tests, not by inspection.

## 10. Revenue attribution import (R20.18)

The same paste-box also accepts commercial rows. A dataset may carry:

```json
{
  "events": [ /* R20.1 analytics events */ ],
  "opportunities": [
    {
      "opportunity_id": "crm-123",
      "lead_id": "lead_180pwnw",
      "crm_id": "opp-crm-9",
      "source": "google", "medium": "cpc", "campaign": "q1",
      "landing_page": "/ai-agentes-imobiliario",
      "service_interest": "AI", "product_interest": "qook",
      "case_interest": null,
      "proposal_value": 5000, "won_value": 4500,
      "close_date": "2026-09-15", "status": "won"
    }
  ],
  "revenue_events": [
    { "opportunity_id": "crm-123", "lead_id": "lead_180pwnw", "stage": "won", "value": 4500, "occurred_at": "2026-09-15T10:12:00Z" }
  ]
}
```

Rules enforced by `src/lib/revenue-attribution.ts`:

- `lead_id` is the browser's pseudonymous `lead_<hash>`; a row without one is
  still counted commercially but reports `null` attribution instead of
  borrowing another lead's journey.
- `status` is one of `open`, `proposal_sent`, `negotiation`, `won`, `lost`.
  A `won` row without `won_value` **and** `close_date` is rejected, not
  repaired.
- `revenue_events` is optional; when imported, every opportunity whose
  current stage has no ledger row is flagged `MISSING_WRITEBACK`.
- With no `opportunities[]` key the revenue attribution panels stay null and
  the panel shows an empty state — never a zero dressed up as a result.

The Revenue panel then shows revenue, pipeline, lost value, average deal,
win rate, the executive scorecard, the full commercial funnel with floored
conversion rates, and revenue by source, medium, campaign, landing page,
product, service, case study and channel, plus the data-quality issues.

## 11. Limitations

- No live data path: numbers appear only after an export is imported.
- Sample floors are inherited (conversion rate needs ≥ 5 leads, CTR ≥ 100
  views); below them the UI shows `—`, not a fabricated rate.
- Event-proxy semantics throughout (R20.2): counts, never people.
- Lead-level panels depend on journeys being present in the export.
- (R20.18 resolved) Revenue was previously counts only; it is now money,
  but exclusively from the imported CRM rows described in §10.

## 12. Remaining gaps

- No persistence: reloading the page clears the imported dataset (a
  deliberate choice — the dashboard must not become a local data store).
- No comparison between periods; a single dataset has no baseline.
- No export of the computed panels (only the raw dataset round-trips), so
  reporting still needs the R20.3 / R20.8 computation outside the browser.
- `PROPOSAL` and `CUSTOMER` CRM stages remain empty by construction (R20.9);
  R20.18 covers them through the imported opportunity instead.
- Deal values only exist inside the imported dataset; there is no live CRM
  connection, so the dashboard is a report surface, not a system of record.
