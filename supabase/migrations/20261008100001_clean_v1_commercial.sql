-- Clean Database V1 — 02/03 commercial (leads, bookings)
-- Anonymous direct writes are DENIED by default (no anon policies).
-- Intended write path: Browser -> Edge Function (validation, anti-abuse,
-- market/locale stamping) -> service/server authority -> database.

-- ---------------------------------------------------------------- leads
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  country text,
  source text not null,
  landing_page text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  service_interest text,
  message text,
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'converted', 'closed', 'spam')),
  consent_privacy_at timestamptz not null,
  consent_marketing boolean not null default false,
  marketing_consent_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index leads_status_created_idx on public.leads (status, created_at desc);
create index leads_market_created_idx on public.leads (market, created_at desc);

create trigger leads_set_updated_at
  before update on public.leads
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  name text not null,
  email text not null,
  company text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  timezone text not null,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'completed', 'cancelled', 'no_show')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint bookings_sane_window check (end_at > start_at)
);
create index bookings_lead_id_idx on public.bookings (lead_id);
create index bookings_status_start_idx on public.bookings (status, start_at);

create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- RLS (admin + service role only; no anon/authenticated policies)
alter table public.leads enable row level security;
alter table public.bookings enable row level security;

create policy "leads_admin_all"
  on public.leads for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "bookings_admin_all"
  on public.bookings for all
  to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
