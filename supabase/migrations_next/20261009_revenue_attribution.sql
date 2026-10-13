-- Revenue Attribution — staged migration (NOT in the active chain).
--
-- Status: STAGED FOR OPERATOR REVIEW. Do NOT place this file in
-- `supabase/migrations/`: the R20.5 chain gate (`clean-v1-migrations.test.ts`)
-- freezes that directory at the 15-table Clean V1 baseline. Apply manually
-- with `supabase db push` (or the dashboard SQL editor) AFTER backup, then
-- promote this file into the versioned chain per the repo's migration policy.
--
-- Depends on: 2026100810000 (set_updated_at(), has_role()), 20261008100001 (leads).
--
-- Model: opportunities carry the commercial state machine; revenue_events is
-- an append-only ledger so every euro is traceable to a stage transition.
-- The browser NEVER writes here (RLS: admin-only, like leads/bookings).
-- Sole writer: the `revenue-writeback` edge function (service role +
-- REVENUE_WEBHOOK_SECRET), invoked by the operator/CRM on stage changes.

-- ---------------------------------------------------------- opportunities
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete restrict,
  title text not null,
  service_interest text,
  product_interest text,
  landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  first_touch text,
  last_touch text,
  stage text not null default 'open'
    check (stage in ('open', 'proposal_sent', 'negotiation', 'won', 'lost')),
  proposal_value numeric(12, 2),
  won_value numeric(12, 2),
  close_date date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint opportunities_values_non_negative
    check (proposal_value is null or proposal_value >= 0),
  constraint opportunities_won_non_negative
    check (won_value is null or won_value >= 0),
  -- A closed stage requires the facts that make revenue readable.
  constraint opportunities_won_requires_facts
    check (stage <> 'won' or (won_value is not null and close_date is not null)),
  constraint opportunities_lost_requires_date
    check (stage <> 'lost' or close_date is not null)
);
create index opportunities_lead_id_idx on public.opportunities (lead_id);
create index opportunities_stage_updated_idx on public.opportunities (stage, updated_at desc);
create index opportunities_close_date_idx on public.opportunities (close_date) where close_date is not null;

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function public.set_updated_at();

-- -------------------------------------------------------- revenue_events
create table public.revenue_events (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete restrict,
  lead_id uuid not null references public.leads (id) on delete restrict,
  stage text not null
    check (stage in ('open', 'proposal_sent', 'negotiation', 'won', 'lost')),
  value numeric(12, 2),
  occurred_at timestamptz not null default now(),
  note text,
  created_at timestamptz not null default now(),
  constraint revenue_events_value_non_negative
    check (value is null or value >= 0),
  -- A won event without a value is a data-quality failure, rejected here.
  constraint revenue_events_won_requires_value
    check (stage <> 'won' or value is not null)
);
create index revenue_events_opportunity_idx on public.revenue_events (opportunity_id, occurred_at);
create index revenue_events_stage_occurred_idx on public.revenue_events (stage, occurred_at desc);

-- ------------------------------------------------------------------- RLS
-- Admin + service role only; no anon/authenticated policies (mirrors leads).
alter table public.opportunities enable row level security;
alter table public.revenue_events enable row level security;

create policy "opportunities_admin_all"
  on public.opportunities for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "revenue_events_admin_all"
  on public.revenue_events for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
