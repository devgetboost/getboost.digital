# Lead Magnet System — R20.4

Capture demand before visitors bounce: anonymous visitors → assessed
visitors → identified leads → commercial opportunities — without
depending on Booking/Contact. Value first (score is free), lead gate
only unlocks the full analysis.

## Types (`src/lib/lead-magnets.ts`)

| Assessment | Category | Questions | Result |
|---|---|---|---|
| `ai-readiness` | AI | 5 | Básico / Intermédio / Avançado |
| `automation-audit` | Automation | 5 | same tiers |
| `software-readiness` | Software | 5 | same tiers |
| `growth-score` | Growth | 5 | same tiers |
| `operations-score` | Digital Operations | 8 (2/pillar) | same tiers + per-pillar breakdown |

## Scores

Every option awards 0–2 points. `percentage = round(total/max·100)`.
Tiers: <40 Básico, <70 Intermédio, ≥70 Avançado (`tierForPercentage`).
`pillarBreakdown` averages tagged questions per pillar (operations).
`validateAssessment` enforces shape (3 options, points 0–2, tier copy,
3 opportunities). Result copy is interpretive guidance — never measured
metrics, never promises.

## Flows

`LeadMagnetModal` state machine: `picker → intro → quiz → score →
lead → analysis`. Progress bar + question counter in quiz; score shows
immediately (free); lead form (name/email/company + explicit consent)
unlocks analysis + opportunities + next steps (booking/demo links).
`LeadMagnetHost` (mounted once in App) + `openLeadMagnet(id?)` global
event (`gb:open-lead-magnet`) — no prop drilling, no routes.

Entry points (defined): Homepage, AI, Automation, Software, Growth,
Portfolio, Products (documented for future wiring — non-intrusive rule:
explicit CTA only, never popups/timers). Wired: Insights tools grid
(native fit) + global event API.

## Tracking (R20.1 taxonomy)

Event names (fixed): `assessment_start`, `assessment_progress`,
`assessment_complete`, `assessment_lead_capture`, `assessment_result_view`.

`analytics.trackAssessment(id, event, data)` → `assessment_{event}`
with category `lead_magnet`, label `{id}_{event}`: start, progress
(per answer: answered/total), complete (score+tier), lead_capture
(score+tier — never contact PII), result_view. Funnel: `getAssessmentStats`
(R20.2 module) answers per-assessment starts/completes/leads/results +
completion/capture rates. CRO: generic `rankBy` covers top assessments;
`getQuickWins` consumes the same shapes.

## CRM readiness (structure only — no CRM integration yet)

`captureLead({ source: 'lead-magnet:<id>', name, email, company,
service_interest: <category>, market, locale, consent: { marketing:
true }, legacy: { assessment, score, tier } })`. Minimal capture
(name/email/company), explicit consent checkbox, no silent capture.
Score/tier travel structured in `metadata.legacy` for future CRM mapping.

## Copy framework

Headline (question) → benefit (value + time) → CTA → result (score +
tier + analysis + opportunities + next steps). Example: "Descobre o
potencial de IA do teu negócio em menos de 3 minutos."

## Limitações

- No server-side assessment storage (answers live in component state;
  only the lead + score persist via lead-capture).
- No A/B on assessment variants yet (use R20.3 experiment scaffolding).
- Tiers are self-reported maturity heuristics, not audits — copy says so.
- One entry point wired (Insights); six defined for later.
