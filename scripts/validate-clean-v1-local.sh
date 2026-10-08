#!/usr/bin/env bash
# Local Clean V1 validation (Phase D, R1B3F).
# Spins a scratch PostgreSQL cluster in $TMPDIR (never the repo, never remote),
# stubs the Supabase platform schemas (auth, storage) + roles, applies the
# Clean V1 chain, and asserts structural + behavioral (RLS) expectations.
# Usage: bash scripts/validate-clean-v1-local.sh
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
MIG="$REPO/supabase/migrations"
SCRATCH="$(mktemp -d "${TMPDIR:-/tmp}/cleanv1-XXXXXX")"
PGPORT=55443
PASS=0; FAIL=0

cleanup() { pg_ctl -D "$SCRATCH/pg" -m fast stop >/dev/null 2>&1 || true; rm -rf "$SCRATCH"; }
trap cleanup EXIT

ok()   { PASS=$((PASS+1)); echo "ok   - $1"; }
bad()  { FAIL=$((FAIL+1)); echo "FAIL - $1"; }
expect_eq() { # expect_eq <label> <actual> <expected>
  if [ "$2" = "$3" ]; then ok "$1"; else bad "$1 (got [$2] want [$3])"; fi
}
expect_ok() { # expect_ok <label> <psql-args...> -- succeeds
  if psql "$@" >/dev/null 2>&1; then ok "$1"; else bad "$1 (statement failed)"; fi
}
expect_denied() { # expect_denied <label> <sql> as role
  local label="$1" role="$2" sql="$3"
  if psql -h "$SCRATCH" -p "$PGPORT" -U postgres -d cleanv1 -v ON_ERROR_STOP=1 \
      -c "SET ROLE $role;" -c "SET request.jwt.claim.sub = '$SUB';" -c "$sql" >/dev/null 2>&1; then
    bad "$label (unexpectedly allowed for $role)"
  else
    ok "$label (denied for $role)"
  fi
}

echo "== init scratch postgres =="
initdb -D "$SCRATCH/pg" -U postgres >/dev/null 2>&1
pg_ctl -D "$SCRATCH/pg" -o "-p $PGPORT -k $SCRATCH -c listen_addresses=''" -l "$SCRATCH/log" start || (cat "$SCRATCH/log"; exit 1)
createdb -h "$SCRATCH" -p "$PGPORT" -U postgres cleanv1

PSQL="psql -h $SCRATCH -p $PGPORT -U postgres -d cleanv1 -v ON_ERROR_STOP=1 -q"

echo "== platform stubs (auth, storage, roles) =="
$PSQL <<'SQL'
CREATE SCHEMA auth;
CREATE TABLE auth.users (id uuid PRIMARY KEY);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
CREATE SCHEMA storage;
CREATE TABLE storage.buckets (id text PRIMARY KEY, name text, public boolean);
CREATE TABLE storage.objects (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), bucket_id text, name text);
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;
GRANT USAGE ON SCHEMA public TO anon, authenticated;
SQL

echo "== apply clean v1 chain =="
for f in "$MIG"/20261008*_clean_v1_*.sql; do
  echo "-- $f"
  $PSQL -f "$f"
done

echo "== structural assertions =="
TBL=$($PSQL -tAc "select count(*) from information_schema.tables where table_schema='public' and table_type='BASE TABLE';")
expect_eq "15 application tables" "$TBL" "15"
NORLS=$($PSQL -tAc "select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity and c.relname not in ('spatial_ref_sys');")
expect_eq "RLS enabled on all tables" "$NORLS" "0"
POL=$($PSQL -tAc "select count(*) from pg_policies where schemaname='public';")
echo "info - public policies: $POL"
TRG=$($PSQL -tAc "select count(*) from pg_trigger where not tgisinternal and tgname like '%_set_updated_at';")
expect_eq "updated_at triggers" "$TRG" "13"

echo "== ref gate (no hardcoded project refs/URLs) =="
if grep -rE "asqdfrzhakgnlfhnzfyu|wkziyskrcsfuepuqdctb|gdbxutbwgolftqmxnkbi|zwrrkbedbprgqtypglwm|jruylzhfobhjisnneyrj|[a-z0-9]{20}\.supabase\.co" "$MIG"/20261008*_clean_v1_*.sql; then
  bad "hardcoded refs found"
else
  ok "no hardcoded refs"
fi

echo "== platform grants (mirror supabase defaults; RLS restricts) =="
$PSQL -c "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;" \
      -c "GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;"

echo "== behavioral assertions =="
ADMIN="11111111-1111-1111-1111-111111111111"
USER="22222222-2222-2222-2222-222222222222"
$PSQL -c "INSERT INTO auth.users (id) VALUES ('$ADMIN'), ('$USER');" \
      -c "INSERT INTO public.user_roles (user_id, role) VALUES ('$ADMIN', 'admin');" \
      -c "INSERT INTO public.content_categories (id, key) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ai');" \
      -c "INSERT INTO public.content_category_localizations (category_id, market, locale, name, slug) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'PT', 'pt-PT', 'IA', 'ia');" \
      -c "INSERT INTO public.content_entries (id, content_type, primary_market, status, published_at) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'insight', 'PT', 'published', now()), ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'insight', 'PT', 'draft', NULL);" \
      -c "INSERT INTO public.content_localizations (entry_id, market, locale, title, slug, status, published_at) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PT', 'pt-PT', 'Pub', 'pub', 'published', now()), ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'BR', 'pt-BR', 'Pub BR', 'pub-br', 'published', now()), ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'PT', 'pt-PT', 'Draft', 'draft', 'draft', NULL);" \
      -c "INSERT INTO public.leads (name, email, market, locale, source, consent_privacy_at) VALUES ('L', 'lead@example.com', 'PT', 'pt-PT', 'contact', now());" \
      -c "INSERT INTO public.newsletter_subscribers (email, market, locale) VALUES ('Sub@Example.com', 'INTL', 'en');"

SUB="$USER"
ANON_ROWS=$($PSQL -tAc "SET ROLE anon; SELECT count(*) FROM public.content_localizations;")
expect_eq "anon sees only published localizations" "$ANON_ROWS" "2"
ANON_ENT=$($PSQL -tAc "SET ROLE anon; SELECT count(*) FROM public.content_entries;")
expect_eq "anon sees only published entries" "$ANON_ENT" "1"

expect_denied "anon insert lead" anon "INSERT INTO public.leads (name, email, market, locale, source, consent_privacy_at) VALUES ('X','x@x.com','PT','pt-PT','contact', now());"
expect_eq "anon reads zero leads" "$($PSQL -tAc "SET ROLE anon; SELECT count(*) FROM public.leads;")" "0"
expect_eq "anon reads zero bookings" "$($PSQL -tAc "SET ROLE anon; SELECT count(*) FROM public.bookings;")" "0"
expect_eq "anon reads zero subscribers" "$($PSQL -tAc "SET ROLE anon; SELECT count(*) FROM public.newsletter_subscribers;")" "0"
expect_denied "anon insert booking" anon "INSERT INTO public.bookings (name, email, market, locale, start_at, end_at, timezone) VALUES ('X','x@x.com','PT','pt-PT', now(), now() + interval '1 hour', 'Europe/Lisbon');"
expect_denied "authenticated insert lead" authenticated "INSERT INTO public.leads (name, email, market, locale, source, consent_privacy_at) VALUES ('Y','y@y.com','BR','pt-BR','contact', now());"
expect_eq "authenticated reads zero leads" "$($PSQL -tAc "SET ROLE authenticated; SET request.jwt.claim.sub = '$USER'; SELECT count(*) FROM public.leads;")" "0"
expect_denied "non-admin grants self admin" authenticated "INSERT INTO public.user_roles (user_id, role) VALUES ('$USER', 'admin');"

SUB="$ADMIN"
expect_ok "admin inserts lead" psql -h "$SCRATCH" -p "$PGPORT" -U postgres -d cleanv1 -v ON_ERROR_STOP=1 -q -c "SET ROLE authenticated;" -c "SET request.jwt.claim.sub = '$ADMIN';" -c "INSERT INTO public.leads (name, email, market, locale, source, consent_privacy_at) VALUES ('A','a@a.com','INTL','en','demo', now());"
ADMIN_SEES=$($PSQL -tAc "SET ROLE authenticated; SET request.jwt.claim.sub = '$ADMIN'; SELECT count(*) FROM public.leads;")
expect_eq "admin reads leads" "$ADMIN_SEES" "2"

DUP_SLUG=$($PSQL -tAc "INSERT INTO public.content_localizations (entry_id, market, locale, title, slug, status) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PT', 'pt-PT', 'Dup', 'pub', 'draft');" 2>&1 || echo DENIED)
[[ "$DUP_SLUG" == *DENIED* ]] && ok "market slug uniqueness enforced" || bad "market slug uniqueness"
DUP_MKT=$($PSQL -tAc "INSERT INTO public.content_localizations (entry_id, market, locale, title, slug, status) VALUES ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'PT', 'pt-PT', 'Dup2', 'dup2', 'draft');" 2>&1 || echo DENIED)
[[ "$DUP_MKT" == *DENIED* ]] && ok "entry+market uniqueness enforced" || bad "entry+market uniqueness"
DUP_MAIL=$($PSQL -tAc "INSERT INTO public.newsletter_subscribers (email, market, locale) VALUES ('sub@example.com', 'PT', 'pt-PT');" 2>&1 || echo DENIED)
[[ "$DUP_MAIL" == *DENIED* ]] && ok "newsletter email case-insensitive unique" || bad "newsletter email uniqueness"
BADWIN=$($PSQL -tAc "INSERT INTO public.bookings (name, email, market, locale, start_at, end_at, timezone) VALUES ('B','b@b.com','PT','pt-PT', now(), now(), 'Europe/Lisbon');" 2>&1 || echo DENIED)
[[ "$BADWIN" == *DENIED* ]] && ok "booking window check enforced" || bad "booking window check"
BADMKT=$($PSQL -tAc "INSERT INTO public.leads (name, email, market, locale, source, consent_privacy_at) VALUES ('M','m@m.com','ES','es','contact', now());" 2>&1 || echo DENIED)
[[ "$BADMKT" == *DENIED* ]] && ok "market check rejects unapproved codes" || bad "market check"

echo "== storage + trigger behavior =="
expect_eq "two buckets seeded" "$($PSQL -tAc "SELECT count(*) FROM storage.buckets WHERE id IN ('public-media','private-assets');")" "2"
expect_eq "no legacy buckets" "$($PSQL -tAc "SELECT count(*) FROM storage.buckets WHERE id NOT IN ('public-media','private-assets');")" "0"
$PSQL -tAc "UPDATE public.leads SET name='L2' WHERE email='lead@example.com';" >/dev/null
expect_eq "updated_at trigger fires" "$($PSQL -tAc "SELECT count(*) FROM public.leads WHERE email='lead@example.com' AND updated_at >= created_at;")" "1"
expect_eq "market-exclusive content allowed" "$($PSQL -tAc "INSERT INTO public.content_entries (id, content_type, primary_market, status) VALUES ('dddddddd-dddd-dddd-dddd-dddddddddddd','guide','BR','published') RETURNING id;" | wc -l | tr -d ' ')" "1"

echo "== result: PASS=$PASS FAIL=$FAIL =="
[ "$FAIL" = "0" ]
