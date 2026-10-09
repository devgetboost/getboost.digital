# GETBOOST WEBSITE 2027 — Rollback Procedure (DRAFT, UNVERIFIED)

> Created during the production GO/NO-GO audit. Every step below requires
> operator platform access and **has not been executed or verified**.
> Do not treat this as tested until a staging restore rehearsal passes.

## Preconditions

- The pre-promotion backup from release-plan §6 step 1 exists and its
  location, timestamp and checksum are recorded here:

  | Artifact | Location | Timestamp (UTC) | Checksum | Verified by |
  |---|---|---|---|---|
  | Database backup | _fill_ | _fill_ | _fill_ | _fill_ |
  | Auth backup (users) | _fill_ | _fill_ | _fill_ | _fill_ |
  | Storage backup (`public-media`, `private-assets`) | _fill_ | _fill_ | _fill_ | _fill_ |
  | Previous frontend build | _fill_ (hosting deploy history) | _fill_ | n/a | _fill_ |
  | Previous functions deployment | _fill_ (Supabase deploy history) | _fill_ | n/a | _fill_ |

- Know the last-good frontend deployment ID and functions deployment IDs
  **before** promoting, so "previous" is unambiguous on the day.

## Rollback decision

Roll back when any of these hold after promotion:

- smoke checklist (§7 of release-plan) fails on more than one item and the
  cause is not a single known config value fixable in < 15 minutes;
- anonymous lead/booking/newsletter capture is broken in production;
- admin login or content publish is broken in production;
- error rate / 5xx on edge functions spikes versus the pre-promotion baseline.

## Ordered steps

### 1. Stop the bleeding (minutes)

1. Redeploy the **previous frontend build** from hosting deploy history.
2. If an edge function is the cause, redeploy the **previous functions
   deployment** from Supabase deploy history (functions deploy independently
   of the frontend — prefer this over a full rollback when the frontend is
   healthy).

### 2. Restore database (only if data-plane damage is confirmed)

1. Confirm the failure is in stored data, not code (a code-only failure must
   never trigger a data restore — restores destroy rows written since backup).
2. Export rows written since the backup timestamp (`leads`, `bookings`,
   `newsletter_subscribers`, `admin_audit_log` filtered by `created_at` /
   `occurred_at`) to a holding file for triage.
3. Restore the database backup to production.
4. Re-verify schema read-only: 3 Clean V1 migrations, 15 tables, RLS intact.
5. Triage the holding file: re-apply legitimate rows if and only if they pass
   Clean V1 constraints.

### 3. Restore storage (only if objects were damaged)

1. Restore `public-media` and `private-assets` from the storage backup.
2. Spot-check: one avatar path, one case-study hero, one product logo resolve
   via `getPublicUrl`; one WhatsApp signed URL generates.

### 4. Restore functions (if step 1.2 was insufficient)

1. Redeploy the recorded previous functions deployment.
2. Re-confirm `verify_jwt = false` on `lead-capture`, `booking-request`,
   `newsletter-subscribe`; admin functions JWT-gated.

### 5. Validation after rollback

Re-run the full smoke checklist (release-plan §7). Rollback is complete only
when every item passes **and** the validation trio is green on the restored
tree: `tsc` 0 errors, `vite build` exit 0, full suite green. Record:

| Check | Result | Time (UTC) | By |
|---|---|---|---|
| Smoke checklist | _fill_ | _fill_ | _fill_ |
| tsc / build / tests | _fill_ | _fill_ | _fill_ |

## Post-rollback

- Freeze further promotions until the failure's root cause is documented.
- File the root cause next to this document (what broke, why the gate missed
  it, what gate assertion would have caught it).
