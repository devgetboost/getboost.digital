# GETBOOST WEBSITE 2027 — Release Plan (R1C10)

Status: preparation. No schema change, no migration, no production contact.
Validation at plan time: `tsc` 0 errors · `vite build` exit 0 · **34 files / 455 tests green**.

## 1. Legacy table retirement plan

### Drop immediately after backup (zero code references)

| Table | Verified |
|---|---|
| `blog_posts` | 0 refs in `src` (excl. tests) |
| `projects` | 0 refs |
| `services` | 0 refs |
| `blog_categories` | 0 refs |
| `resources` | 0 refs |

Also droppable: the retired storage buckets `avatars`, `blog-images`,
`hero-banners`, `podcast-audio`, `whatsapp-media` (zero storage-API refs;
a test scans for them). Dead code already deleted in Wave 7
(`src/pages/Admin.tsx`, `src/data/blog.ts`, `src/data/portfolio.ts`).

Drop order: buckets last (rows may still render absolute pre-migration URLs
until re-saved; dropping a bucket breaks those renders). Tables first,
buckets second, each behind its own backup.

### Keep — live features with no Clean V1 counterpart (Wave 8 scope)

| Table | Consumers | Notes |
|---|---|---|
| `lead_tags`, `lead_tag_assignments` | AdminLeads/Inbox/CampaignNew/Automation | needs successor design |
| `client_services/subscriptions/invoices`, `support_tickets` | AdminClients + `/cliente/*` | needs successor design |
| `booking_settings` | Booking availability form | needs successor design |
| `admin_calendar_blocks` | InboxCalendar | needs successor design |
| `booking_reschedule_history` | Booking reschedule writes | append-only; keep writing |
| `email_deletion_audit` | InboxMail audit view | superseded by `admin_audit_log` for new events |

Each is locked by `src/tests/legacy-cleanup.test.ts`: the inventory fails if a
listed table loses all references without being removed from the list, and
fails if a new legacy reference appears.

## 2. External integrations audit

### Browser-invoked (publishable key; session JWT attached automatically)

`lead-capture`, `booking-request`, `newsletter-subscribe` (public, no JWT),
`send-transactional-email` (JWT), `notify-booking`, `route-solucao-lead`,
`commercial-audit`, `audit-request-access`, `seo-analyzer`, `content-ideas`,
`chat-assistant`, `digital-audit`, `create-client` + `admin-audit` (both verify
`has_role('admin')` server-side), `brevo-proxy`, `send-campaign`,
`social-media-*`, `email-*`, `agentic-*`, `resend-audit-report`,
`telegram-send-test`, `whatsapp-proxy` / `whatsapp-trigger-dispatch` /
`whatsapp-concierge-*` (raw fetch), `meta-oauth` (raw fetch).

### Platform-triggered, no browser caller (correct — do not "fix")

Webhooks: `campaign-webhook` (Brevo, `CAMPAIGN_WEBHOOK_SECRET`),
`meta-webhook` (`META_VERIFY_TOKEN`), `handle-email-suppression` (Mailgun).
Tracking pixels: `email-track-open/click`. Queues/cron:
`process-email-queue`, `admin-tasks-sla`, `agentic-scenario-cron`
(no in-repo scheduler found — **confirm platform cron config before release**).
Auth hook: `auth-email-hook`. Templates: `booking-ics`,
`preview-transactional-email`. `test-campaign-webhook`,
`client-automation-analyze` (no caller found — confirm or remove pre-release).

### Secrets (all server-side; none in the repo)

`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY` (49/48/13
functions) plus provider keys: `LOVABLE_API_KEY` (AI, 18 functions),
`BREVO_API_KEY`, `META_APP_ID/SECRET`, social keys (TikTok/LinkedIn/X),
`TELEGRAM_BOT_TOKEN`, `EMAIL_CREDENTIAL_ENCRYPTION_KEY`,
`CRM_WEBHOOK_URL`, `AGENTIC_*`, `ADMIN_TASKS_BACKUP_USER_ID`.
**Pre-release: verify every one is set in the production function
environment** — a missing key fails at request time, not deploy time.

### verify_jwt posture

Public lead/booking/newsletter/webhook functions are intentionally
`verify_jwt = false` (documented in their headers). Everything admin-gated
re-verifies via `has_role('admin')` in-code. No change needed; do not "harden"
public capture paths with JWT — anonymous visitors have none.

## 3. pt-BR readiness

Code-complete: `MARKETS = ['PT','BR','INTL']`, `/br` routing, `pt-BR` locale
tags, hreflang `pt-BR`, market-scoped reads with explicit fallback, BR switcher
option. **Content work remaining (not code):** no `pt-BR` translation resource
exists (`src/i18n/locales/` has `pt/en/es` only — BR renders the `pt` UI, which
is correct European-Portuguese copy, not Brazilian), and no BR localizations
exist in content tables (fallback serves PT content with a "not yet translated"
notice). Release may ship with fallback; real pt-BR copy is a content task.

## 4. Sitemap strategy

`scripts/generate-sitemap.js` emits per-market alternates (`pt-PT` bare,
`pt-BR` `/br`, `en` `/en`, `x-default` → PT) — structurally correct. Content
slugs (`serviceSlugs`, `blogSlugs`, `portfolioSlugs`, `resourceIds`) are still
hardcoded and already stale. **Do not query Postgres from the SPA build.**
Recommended: a CI job with a read-only service key that dumps published
`(market, slug, updated_at)` per content group to a JSON manifest the script
already knows how to consume — or defer to post-release (SEO impact only, no
functional impact). The `/demo` query-param sitemap block still emits legacy
`pt` hreflang; align it when the manifest lands.

## 5. Booking meeting-link strategy

`public.bookings` has no `metadata` column by design (Wave 6 corrected the
Wave 5 function that assumed one). The per-booking Jitsi room is client-minted
and unrecoverable from the DB; the confirmation email sent at booking time is
the only record. Admin surfaces show schedule + status, not the join link.
**Recommended:** deterministic room naming (`getboost-<booking-id8>`) for new
bookings so the link is derivable, plus a future migration adding
`bookings.metadata jsonb` if richer per-booking state is ever needed. Until
then: do not re-add link persistence anywhere — there is nowhere to put it.

## 6. Production promotion checklist

1. Full backup of production (database + auth + storage objects).
2. Confirm production schema equals the Clean V1 chain (3 migrations, 15
   tables, 2 buckets) — read-only verify, same as the R1B3M inventory.
3. Set every function secret in the production environment (see §2 list).
4. Confirm platform cron for `process-email-queue` / `admin-tasks-sla` /
   `agentic-scenario-cron`; confirm webhook URLs/secrets for Brevo + Meta.
5. Set `verify_jwt = false` on the three public capture functions +
   `admin-audit` JWT behavior unchanged; keep admin functions JWT-gated.
6. Deploy edge functions, then the frontend build.
7. Smoke: anonymous lead/booking/newsletter submit (staging first, then prod);
   admin login + content publish + audit row appears; `/br` + `/en` render;
   sitemap regenerates.
8. Drop the 5 retired tables + 5 retired buckets **only after** steps 1–7 pass.

## 7. Final QA plan

- Auth: login/logout per role; wrong-role redirect; role-less session → login
  (no silent sign-out); expired session on a guarded page.
- Commercial: each of the 12 lead forms submits with auditor check on
  `metadata.legacy`; booking create + email-proof reschedule; newsletter
  double-submit → `already_subscribed`; resubscribe stays out of scope.
- Content: publish in PT only → BR shows fallback notice, INTL shows fallback;
  publish BR → notice clears; draft localization never leaks anonymously.
- Markets: `/br` + `/en` render; `/es/*` → `/en/*`; switcher preserves
  path/query/hash; canonical always bare-PT; hreflang triple on every page.
- Admin: CRUD per content group incl. slug-collision message; status toggle
  publishes parent + localization together; audit rows appear for each action.
- Storage: avatar/hero/product/podcast uploads land in `public-media`;
  WhatsApp media in `private-assets` with working signed URLs.

## 8. Final E2E plan

Playwright (config exists, `playwright.config.ts`): seed staging with synthetic
fixtures only — never customer data. Scenarios mirror §7 end-to-end against
staging: (1) anonymous visitor submits each commercial form; (2) admin logs in,
publishes content in PT, checks public render + audit trail; (3) market switch
PT→BR→INTL with fallback assertions; (4) reschedule flow with email proof;
(5) storage upload → public render. Assert RLS negatively too: anonymous direct
`leads` insert must be denied (the migration test already asserts the policy;
E2E replays it live).

## 9. Release gate

`src/tests/release-gate.test.ts` encodes the gate. Release is GO only when:

- `tsc` 0 errors, `vite build` exit 0, full suite green (incl. gate test),
- zero admin refs to the 5 retired tables,
- zero retired-bucket storage calls,
- 3 Clean V1 migrations, 15 tables, 2 buckets (verified read-only),
- every production function secret set,
- backup complete.

Any single failure → NO-GO. No partial releases.
