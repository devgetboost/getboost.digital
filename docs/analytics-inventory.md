# Analytics Inventory — R20.1 (Single Source of Truth)

Mechanism (unchanged): `trackEvent()` dispatches a `lovable_analytics`
CustomEvent + pushes to `window.dataLayer` (GTM/GA4/Meta/Hotjar/Clarity
all consume these — nothing was renamed, nothing breaks). R20.1 is
strictly additive, except two PII removals (marked **[PRIVACY]**).

Privacy rule: analytics payloads NEVER carry personal data (emails,
phones, messages, form contents, company). Enforced twice — explicitly
at the two historical call sites AND automatically by
`scrubAnalyticsData()` at dispatch + CRM-forward time. Lead data travels
through the edge functions (product path), not through analytics.

Debug mode: append `?gb_debug=analytics` to any URL for verbose
console output + `getAnalyticsDebugLog()` ring buffer. Param-gated,
zero production impact.

## Event taxonomy V1

Shape: `{ name, category, label, funnel_stage?, data? }`.
Existing `category.label` pairs are canonical (downstream dashboards
depend on them). New events follow `category_action_location`.

### Navigation & engagement

| Event | Origin | Payload | Objective |
|---|---|---|---|
| `page_view` | App PageTracker (every route) | path, title | page performance |
| `cta_click` navigation.header_booking/login | Header | — | header conversion |
| `cta_click` hero.hero_booking/solutions | Homepage hero | — | hero conversion |
| `cta_click` {ai,automation,software,growth}_{hero,cta}.* | Pillar pages | — | pillar conversion |
| `cta_click` portfolio.* | Portfolio (hero/mid/final) | — | proof conversion |
| `cta_click` sobre_nos.* | Sobre Nós | — | institutional conversion |
| `cta_click` services.service_card_* | Services cards | — | service interest |
| `cta_click` blog.share_* | Blog share | post_slug | share intent |
| `cta_click` social.* | Footer social | — | social exit |
| `cta_click` *audit_open | CommercialAuditModal (+source) | — | booking intent |
| `cta_click` chat_widget.* | Chat widget | — | chat engagement |
| `scroll_depth` engagement.{loc}_{25,50,75,100} | ScrollDepth ×7 pages | depth, path | engagement depth |

### Forms (lifecycle: start → submit → success/error, abandon on exit)

| Event | Origin | Payload | Objective |
|---|---|---|---|
| `form_step` booking_start/submit/abandon | Booking.tsx | origin | funnel drop-off |
| `form_step` contact_start/submit/abandon | Contact.tsx | origin | funnel drop-off |
| `schedule_appointment` booking.booking_success | Booking submit | meeting_*, language, journey, origin | meetings |
| `form_submission` booking/contact/demo/newsletter/… | Forms | non-PII only | conversions |
| `generate_lead` (auto on *success) | trackForm | — | GA4 conversion |

Funnel attribution: `recordJourneyStep()` (PageTracker) keeps the last
20 paths (no query strings, no PII) in sessionStorage; `journey` +
`origin` ride on booking/contact success payloads → "which path
generated this meeting".

### Products (Qook, Motivae, Alojify, Pikto, Trackfy, Safely + platforms)

| Event | Origin | Payload | Objective |
|---|---|---|---|
| `product_interaction` {slug}_click | 13 card surfaces (homepage, hub, portfolio, 4 pillar proofs, shared pillar proof, header ×2, footer, services) | product, action, location | which product gets attention |
| page views on /produtos + landings | PageTracker | path | product views |

Institutional platforms (no landing page) have no click event by design.

### Outbound (standardized; WhatsApp keeps its dedicated event)

| Event | Origin | Objective |
|---|---|---|
| `outbound_click` phone_* | Footer, Contact channels, AgenciaLocal | call intent |
| `outbound_click` email_* | Footer, Contact channels, BlogShareContact ×3, AgenciaLocal, privacy/cookie policies | email intent |
| `whatsapp_click` (dedicated + CRM forward) | Contact, WhatsApp surfaces, chat | WhatsApp conversion |

Admin-area mailtos excluded (internal tool, not acquisition).

### New in R20.1 vs reused

- NEW: `scroll_depth`, `outbound_click`, `form_step`,
  `product_interaction`, `{page}_audit_open`, journey recording,
  `?gb_debug=analytics`, `scrubAnalyticsData`, lifecycle wiring.
- REUSED (untouched names/shapes): every pre-existing event above.
- **[PRIVACY]** REMOVED from payloads: `email`/`phone`/`company` in
  booking success; `email` in consultor success (library scrub is the
  backstop).

## Gaps remaining (documented, not blockers)

- `progress` step fires on Booking wizard step transitions only;
  field-level milestones (50% complete) deferred — needs form-schema
  coupling, out of instrumentation scope.
- Demo + newsletter + consultor forms have submit/success only (no
  start/abandon) — lower funnel value, same pattern applies if needed.
- Admin/authenticated-area events intentionally out of scope.
- No server-side revenue attribution (needs CRM join on click_id —
  the id is now present on every conversion forward).
