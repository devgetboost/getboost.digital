# R21.1B — Platform Verification Runbook

Every command below requires operator access that this environment does not
have. Each step states **what to run**, **what PASS looks like**, and **what
to do if it fails**. Run them top to bottom; nothing here needs a code change.

Legend: **[LOCAL]** verified in this repository · **[OPERATOR]** needs your
platform credentials.

---

## B1 — Resend (email delivery)

The code path is `supabase/functions/_shared/email-provider.ts`
(`RESEND_API_URL = https://api.resend.com/emails`, key name `RESEND_API_KEY`).

| # | Step | PASS |
|---|---|---|
| B1.1 | **[OPERATOR]** Resend dashboard → Domains → `getboost.digital` | status **Verified** |
| B1.2 | **[OPERATOR]** Resend dashboard → Domains → DNS records | SPF, DKIM and DMARC records all present and valid (green) |
| B1.3 | **[OPERATOR]** Supabase → Project Settings → Edge Functions → Secrets | `RESEND_API_KEY` present for **prod** *and* **staging** |
| B1.4 | **[OPERATOR]** `curl -s https://api.resend.com/domains -H "Authorization: Bearer $RESEND_API_KEY"` | returns your domain with `status: "verified"` |
| B1.5 | **[OPERATOR]** Send a test email from Resend to your own inbox | arrives; SPF/DKIM/DMARC pass in the message headers |

**If B1.2 fails:** add the missing DNS record at the registrar and wait for
propagation (up to 24 h for DMARC alignment). Nothing in the app needs to change.

---

## B2 — Email webhook secret + sender re-key

`supabase/functions/auth-email-hook/index.ts` verifies an HMAC signature and
accepts **two** keys: `EMAIL_WEBHOOK_SECRET` (current) and `LOVABLE_API_KEY`
(legacy fallback).

> **Risk found in this wave:** because the fallback is accepted, the endpoint
> authenticates even when `EMAIL_WEBHOOK_SECRET` is *unset*. Do not read
> "the webhook works" as "the secret is configured" — check explicitly.

| # | Step | PASS |
|---|---|---|
| B2.1 | **[OPERATOR]** Edge Functions secrets | `EMAIL_WEBHOOK_SECRET` set (not only the legacy key) |
| B2.2 | **[OPERATOR]** Re-key the sender to use that secret | request `Authorization: Bearer <EMAIL_WEBHOOK_SECRET>` |
| B2.3 | **[OPERATOR]** Send a webhook with a wrong/absent bearer | HTTP **401** `{"error":"Unauthorized"}` |
| B2.4 | **[OPERATOR]** Send a webhook with the correct bearer | HTTP **200**, HTML rendered |
| B2.5 | **[OPERATOR]** Confirm both secrets are unset on staging before a negative test | 401 on staging too |

**After B2.2 passes**, the `LOVABLE_API_KEY` fallback can be deleted from
`auth-email-hook` and `handle-email-suppression`. That deletion is a code
change — out of scope for R21.1B, flagged for the next wave.

---

## B3 — Cron schedules

| # | Step | PASS |
|---|---|---|
| B3.1 | **[OPERATOR]** Supabase → Database → Extensions / `pg_cron` | `cron.schedule` jobs visible in `cron.job` |
| B3.2 | **[OPERATOR]** `select jobname, schedule, active from cron.job order by jobname;` | three jobs **active**: `process-email-queue`, `admin-tasks-sla`, `agentic-scenario-cron` |
| B3.3 | **[OPERATOR]** `select jobid, runid, status from cron.job_run_details order by start_time desc limit 20;` | recent runs `succeeded`, not `failed` |
| B3.4 | **[OPERATOR]** Insert a test row into the email queue, wait one interval, confirm it drains | row processed and marked sent |

**If B3.2 is empty:** the schedules were never created. Create them from the
Supabase SQL editor with the documented function URLs.

---

## B4 — Backups

| # | Step | PASS |
|---|---|---|
| B4.1 | **[OPERATOR]** Supabase → Database → Backups → take a backup now | timestamp recorded |
| B4.2 | **[OPERATOR]** Download it and compute a checksum (`shasum -a 256`) | checksum recorded in `docs/release-rollback.md` |
| B4.3 | **[OPERATOR]** Back up the `public-media` and `private-assets` buckets | file list + checksum recorded |
| B4.4 | **[OPERATOR]** Restore the DB backup into a scratch project | restore completes; row counts match |
| B4.5 | **[OPERATOR]** Record the last-good frontend deployment id and functions deployment ids | written in `docs/release-rollback.md` |

**B4.4 is the one that matters.** An untested backup is a hypothesis.

---

## B5 / B7 — SPA rewrite and host behaviour

**[LOCAL]** the mechanism is verified: `node scripts/verify-spa-rewrite.mjs`
→ 23/23 routes pass under host emulation. What remains is host configuration.

| # | Step | PASS |
|---|---|---|
| B5.1 | **[OPERATOR]** `node scripts/verify-spa-rewrite.mjs --base https://<staging-host>` | 23 passed · 0 failed |
| B7.1 | **[OPERATOR]** same against `https://getboost.digital` | 23 passed · 0 failed |
| B7.2 | **[OPERATOR]** Open a deep link (`/ai-agentes-clinicas`), hard-refresh | same page renders, URL unchanged |
| B7.3 | **[OPERATOR]** Open `/br/qook` and `/en/ai-agentes-clinicas` | market twins render |
| B7.4 | **[OPERATOR]** Request a genuinely missing path (`/does-not-exist-xyz`) | the site boots (404 document), not a host error page |

**If B5.1 fails on staging:** the host is not serving `404.html` for unknown
paths. Configure the error-document rewrite, then re-run.

---

## B6 — `admin_tasks`: decision

**Recommendation: ADOPT.** Evidence from the repository:

| Evidence | Detail |
|---|---|
| Written by | `supabase/functions/whatsapp-assistant-reply` inserts rows |
| Read/written by | `supabase/functions/admin-tasks-sla` reads, patches SLA state |
| Referenced by any UI | **no** — zero references in `src/` |
| Required by B3 | the `admin-tasks-sla` cron exists to service it |

Retiring the table would break an active write path. So: adopt, and set
`ADMIN_TASKS_BACKUP_USER_ID` so unassigned tasks still have an owner.

> **Operational risk to accept knowingly:** `admin_tasks` is an active queue
> with **no operator surface**. The SLA cron manages tasks nobody can see. It
> is not a release blocker, but it is blind work.

| # | Step | PASS |
|---|---|---|
| B6.1 | **[OPERATOR]** `select count(*), min(created_at) from admin_tasks;` | table exists; volume understood |
| B6.2 | **[OPERATOR]** Set `ADMIN_TASKS_BACKUP_USER_ID` on the function | unset assignments fall back to an owner |
| B6.3 | Record the decision | this section, marked ADOPTED |

---

## B8 — Rollback rehearsal

| # | Step | PASS |
|---|---|---|
| B8.1 | **[OPERATOR]** Deploy RC1 to **staging** | staging serves the new build |
| B8.2 | **[OPERATOR]** Deploy the previous known-good build | staging is back on the old build |
| B8.3 | **[OPERATOR]** Run the smoke script (`docs/production-release-readiness.md` §14) | passes on the restored build |
| B8.4 | **[OPERATOR]** Re-deploy RC1, then re-run the smoke script | passes on the new build |
| B8.5 | **[OPERATOR]** Fill in the rollback table in `docs/release-rollback.md` | no `_fill_` left; doc marked VERIFIED |

Rollback is a frontend redeploy with no migration, so B8.1–B8.4 should take
minutes. If they take longer, the "previous deployment" is ambiguous and the
procedure must be rewritten before promoting.

## B10 — Revenue writeback (R20.18, dashboard-only gate)

| # | Step | PASS |
|---|---|---|
| B10.1 | **[OPERATOR]** Back up production (B4) — the staged migration creates two tables | backup checksum recorded |
| B10.2 | **[OPERATOR]** Review `supabase/migrations_next/20261009_revenue_attribution.sql` | `opportunities` + `revenue_events`, RLS admin-only, no anon policies |
| B10.3 | **[OPERATOR]** Apply it to production (`supabase db push` with the file staged, or the SQL editor) | `select count(*) from public.opportunities` returns 0, not an error |
| B10.4 | **[OPERATOR]** Promote the file into `supabase/migrations/` and record the timestamp in the migration log | chain gate (`clean-v1-migrations.test.ts`) updated per repo policy |
| B10.5 | **[OPERATOR]** Set `REVENUE_WEBHOOK_SECRET` on the function: `supabase secrets set REVENUE_WEBHOOK_SECRET=<random 32+ chars>` | secret present, value stored only in the platform |
| B10.6 | **[OPERATOR]** Call the endpoint with no `Authorization` header | `401` |
| B10.7 | **[OPERATOR]** Create a `won` stage change with `opportunity_id`, `lead_id`, `deal_stage: "won"`, `deal_value`, `close_date` | `200 {ok:true}` and one row in `revenue_events` |
| B10.8 | **[OPERATOR]** Replay the exact same call | `200 {replay:true}` and still **one** row (idempotent) |
| B10.9 | **[OPERATOR]** Send `won` without `deal_value` | `400` (database rejects it as well) |
| B10.10 | **[OPERATOR]** Paste a dataset with `opportunities[]` into `/dashboard` | revenue panels render real numbers; without it they show the empty state |

B10 does not gate any public page. Until B10.3 and B10.5 are done the
revenue panels stay in empty state — which is the designed behaviour, not a
failure.

---

## Order of execution

```
B4 (backup)  ──────────────┐  must be first: everything else depends on it
B6 (decision, config only) │
B1 → B2 (email path)       │
B3 (crons)                 │
B5 → B7 (host behaviour)   │
B8 (rehearsal, last) ──────┘  needs the deployable candidate
```

After all eight pass, RC1 is deployable and `docs/production-release-readiness.md`
§11 flips to READY without any further code change. B10 is independent and
affects only the R20.18 revenue panels.
