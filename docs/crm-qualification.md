# CRM Qualification — R20.9

Lead → interest → intent → qualification → opportunity → pipeline, computed
from observed behavior. No external CRM is integrated, no sales automation,
no email sending, no public UX change. The only surface touched is one
analytics enrichment: the lead-magnet capture now attaches the journey it
already records (paths only), exactly as booking and contact already do.

## 1. CRM model (Fase 1)

`LEAD → QUALIFIED → OPPORTUNITY → PROPOSAL → CUSTOMER`.

| Tier | Stage |
|---|---|
| HOT | OPPORTUNITY |
| WARM | QUALIFIED |
| COLD / NURTURE | LEAD |

## 2. Lead signal engine (Fase 2)

A **lead unit** is a conversion event carrying a recorded journey
(`data.journey`, visited paths only). That is the only scoreable population:
a visitor who left no contact and no journey cannot be qualified, and
inventing an identity to do so would break the zero-PII rule.

Signals unified from the R20.x layers: landing views, case views, pillar
views, product views, product interest, assessment id/score/tier, lead
capture, booking, contact, and surface depth. Multiple conversions in one
journey collapse into a single lead unit with merged signals — booking
after an assessment capture is one lead, not two.

**Lead identity** is `lead_<hash>`: an FNV-1a hash of the path signature.
Same journey → same id. No cookie, no fingerprint, no identity.

## 3. Lead score engine (Fase 3)

| Component | Weight | Signal |
|---|---|---|
| Interest | 0.20 | distinct landing/case/pillar surfaces (ceiling 5) |
| Intent | 0.30 | assessment completion + percentage + tier; bookings ≥ 80 |
| Engagement | 0.15 | surface depth + journey length |
| Product | 0.15 | product-fit strength (Fase 9) |
| Demand | 0.20 | the product's R20.8 demand score |

Log-free, monotonic, saturating at 5 surfaces. Weights sum to 1 (CI-enforced).

## 4. Qualification tiers (Fase 4)

Ordered rules, first match wins, each with a written reason:

| Rule | Tier | Condition |
|---|---|---|
| `hot_booked_qualified` | HOT | booked AND intent ≥ 70 |
| `hot_advanced_assessment` | HOT | tier `avancado` AND score ≥ 70 |
| `warm_assessment` | WARM | assessment completed AND score ≥ 35 |
| `warm_engaged` | WARM | captured AND depth ≥ 2 AND score ≥ 25 |
| `nurture_captured` | NURTURE | captured without intent |
| `nurture_interest` | NURTURE | fallback |

Intent-based thresholds (not composite) so a booked meeting stays hot even
before product demand data exists.

## 5. Product qualification (Fase 5)

`getProductQualification` counts leads, qualified leads and opportunities per
product. Each lead counts **once, under its best-fit product**, so the
totals stay additive. Opportunity rate only above 5 leads.

## 6. Assessment qualification (Fase 6)

Per R20.4 engine: leads, HOT/WARM/NURTURE split, average score and
opportunity rate. Only assessments that actually captured leads appear.

## 7. Product fit engine (Fase 9)

Explicit rules, points and reasons — no ML, no guessing:

| Rule | Points |
|---|---|
| visited the product's own landing | 40 |
| assessment engine matches the product | 35 |
| visited a pillar that delivers it | 25 |
| visited an intent landing that lists it | 20 |
| read the product case study | 15 |
| declared interest | 10 |

Ties break on signal provenance: an explicit `data.product` stamp outranks a
product merely mentioned on a visited landing (stamps are recorded first).

## 8. Opportunity engine (Fase 10)

`NO_SIGNAL → EARLY → PROMISING → QUALIFIED → OPPORTUNITY`, derived only from
observed signals (booking, contact, assessment tier/score, capture, depth).
No estimation: every class names the signal that produced it.

## 9. Follow-up readiness (Fase 15)

`BOOK_CALL · SEND_PROPOSAL · NURTURE · WAIT` — recommendations only. Nothing
in this module sends, books or emails anything.

## 10. Pipeline analytics (Fase 12)

Leads, qualified, opportunities, conversion rate (≥ 5 leads), tier /
opportunity / stage / action distributions and product distribution. No UI —
R20.12 renders it.

## 11. CRM data contract (Fase 11)

Canonical record: `leadId · source · product · qualification · opportunity ·
stage · score · productFits · signals · recommendedAction · journey`.
`validateCrmRecord()` is the export gate — it rejects non-contract fields,
PII-shaped keys, out-of-range scores, weights that don't sum to 1,
stage/tier mismatches, journey steps carrying query strings, and intent
scores with no assessment or booking to justify them.

## 12. Priority queue (Fase 14)

Deterministic: score desc → opportunity class → tier → `leadId` asc. Same
input, same order, every run.

## 13. Attribution (Fase 13)

Landing → case → pillar → assessment → lead → qualification preserved per
lead, read from the same signals that produced the score.

## 14. Quality gates (Fase 16)

- No PII: the qualification output contains no contact field, and journey
  steps are paths without query strings.
- No hidden scoring: every component is a named rule with a reason; the
  validator rejects an intent score with no supporting signal.
- No magic heuristics: rules are ordered, documented and enumerated.
- No machine learning: pure functions, no DOM, no storage, no network.

## Limitations

- Scores are behavioral proxies, not predicted revenue.
- Only journeys that reach a conversion can be qualified; anonymous
  browsing above the fold is not a lead.
- Booking/contact attribution requires the journey payload; without it the
  lead exists with fewer signals rather than with invented ones.
- Demand (20%) is zero until real product demand data accumulates, which
  temporarily dampens composite scores — tiers deliberately avoid depending
  on it.
- One lead unit per journey signature: repeat visits with a different path
  become a different unit. Cross-session stitching needs the CRM `click_id`.

## Gaps carried forward

- No CRM integration (by design): the contract is what one must satisfy.
- `PROPOSAL` and `CUSTOMER` stages are declared but never produced — no
  source of truth exists yet for them.
- Follow-up actions are recommendations only; R20.10 AI Sales Layer is the
  wave that may consume them.
