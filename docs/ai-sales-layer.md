# AI Sales Layer — R20.10

Intelligence becomes action guidance. Despite the release name there is **no
artificial intelligence in this layer**: no model, no inference, no external
provider, no autonomous agent. "AI" here means an explicit, auditable
decision engine over facts the platform already observed. Nothing executes —
no email, no outreach, no CRM write, no lead contact.

## 1. Sales model (Fase 1)

`LEAD → QUALIFIED → OPPORTUNITY → SALES_ACTION → PIPELINE_STAGE`, with four
commercial actions: `BOOK_CALL · SEND_PROPOSAL · NURTURE · WAIT`.

## 2. Action engine (Fases 2, 3)

Ordered rules, first match wins. Proposal readiness outranks the generic
tier because a booked meeting always does:

| # | Rule | Action |
|---|---|---|
| 1 | `proposal_booked` — booked + OPPORTUNITY | SEND_PROPOSAL |
| 2 | `proposal_ready` — every proposal gate passed | SEND_PROPOSAL |
| 3 | `book_call_hot` — tier HOT | BOOK_CALL |
| 4 | `wait_no_signal` — opportunity NO_SIGNAL | WAIT |
| 5 | `nurture_warm` — tier WARM | NURTURE |
| 6 | `nurture_interest` — fallback | NURTURE |

Each recommendation carries: action, rule id, reason, the signals the rule
actually read, the score it saw, the benefit, the risk of ignoring it, and
the playbook to follow.

## 3. Opportunity prioritization (Fase 4)

Six named bands over observable facts — `HIGHEST`, `HIGH`, `MEDIUM`, `LOW`:
booked + intent, hot-lead points ≥ 65, assessed + score ≥ 35, fit ≥ 60 +
score ≥ 30, score ≥ 15, residual. Ties break on score → intent → hot
points → `leadId`, so the order never shifts between runs.

## 4. Next best action (Fases 5, 14)

`getNextBestAction(record)` answers what to do, why, what it gains and what
ignoring it costs. `validateRecommendation()` fails CI on a missing rule,
reason, benefit, risk or playbook mismatch — explainability is enforced, not
aspirational.

## 5. Hot lead engine (Fase 8)

Explicit points, no ML: booking 40 · advanced assessment 25 · assessment 15 ·
contact 10 · product interest 10 · CRM score ≥ 50 → 20.

## 6. Nurture engine (Fase 9)

A nurture candidate showed interest but not enough intent: no meeting, no
advanced assessment, intent < 70. Recommendation only — the engine sends
nothing.

## 7. Proposal readiness (Fase 10)

Five named gates, all must pass: meeting or advanced assessment · score ≥ 45
· intent ≥ 70 · product fit ≥ 40 · surface depth ≥ 2. The engine returns a
verdict with the failing gates named; it never generates a proposal.

## 8. Product sales intelligence (Fase 6)

Per product: volume, qualified, opportunities, R20.8 demand score, average
lead score, recommended-action split and its playbook. Each lead counts once,
under its best-fit product.

## 9. Playbooks (Fases 11, 12)

Sales playbooks per action (steps, `appliesWhen`, `stopWhen`) — guidance,
never generated commercial copy. Product playbooks are **derived**: anchor
pillar, qualification engine, landing route, proof case and dossier gaps,
all read from existing registries.

## 10. Sales analytics (Fases 12, 13)

Recommended calls, proposals, nurture leads, waiting leads, hot leads,
opportunity distribution, priority distribution and action coverage.

## 11. R20.12 preparation (Fase 17)

`buildSalesDashboardRows()` returns ordered rows (order, priority, score,
action, rule, product, booked, generatedAt) — data only, no UI.

## 12. Quality gates (Fase 16)

CI strips comments and asserts the three modules contain no provider SDK
(OpenAI/Anthropic/Gemini), no network call, no storage/browser API, no mail
or CRM integration and no ML runtime. Reproducibility (same input → same
output) and PII-free recommendations are asserted too.

## Relationship with R20.9

R20.9's `recommendedAction` is the generic CRM follow-up hint. This layer is
the **commercial authority**: it re-derives the action from the qualification
tier and opportunity class using the sales policy above. Where the two
differ (R20.9 sends WARM to `BOOK_CALL`; the sales engine sends WARM to
`NURTURE`), the sales layer wins and the difference is deliberate.

## Limitations

- Recommendations are behavioural proxies, not predicted revenue.
- Only leads that left a journey (R20.9) can be scored.
- Demand contributes 0 until real product demand data accumulates, which
  temporarily dampens composite scores — the action rules avoid depending
  on it.
- Playbooks are structural guidance; no commercial copy is generated, and no
  outreach message is ever produced.
- `WAIT` deliberately spends nothing on a lead; if a lead's only signal is a
  landing read, the engine will not escalate it.

## Gaps carried forward

- No execution path by design: R20.12/operational tooling must consume the
  recommendations through an explicit human decision.
- Product playbooks inherit every missing dossier field (4 of 8 products).
- Hot-lead points and the priority bands are fixed constants; they have not
  been calibrated against closed revenue, because no CRM reports exist yet.
