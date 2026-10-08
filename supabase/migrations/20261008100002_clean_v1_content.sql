-- Clean Database V1 — 03/03 content, work, products, newsletter, governance, storage
-- Localization pattern: entry table + per-market localization rows.
-- Market-exclusive content is valid (a single localization row).
-- Slugs are unique per market. Public reads expose published rows only.

-- ---------------------------------------------------------------- authors (editorial identity, NOT auth users)
create table public.content_authors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_title text,
  avatar_path text,
  bio text,
  social_links jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger content_authors_set_updated_at
  before update on public.content_authors
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- categories (key + per-market localizations)
create table public.content_categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger content_categories_set_updated_at
  before update on public.content_categories
  for each row execute function public.set_updated_at();

create table public.content_category_localizations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.content_categories (id) on delete cascade,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_category_market unique (category_id, market),
  constraint uq_category_market_slug unique (market, slug)
);
create index ccl_category_idx on public.content_category_localizations (category_id);

create trigger content_category_localizations_set_updated_at
  before update on public.content_category_localizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- insights entries + localizations
create table public.content_entries (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in ('insight', 'guide')),
  primary_market text not null check (primary_market in ('PT', 'BR', 'INTL')),
  author_id uuid references public.content_authors (id) on delete set null,
  category_id uuid references public.content_categories (id) on delete set null,
  cover_media_path text,
  featured boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index content_entries_status_published_idx
  on public.content_entries (primary_market, published_at desc)
  where status = 'published';

create trigger content_entries_set_updated_at
  before update on public.content_entries
  for each row execute function public.set_updated_at();

create table public.content_localizations (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.content_entries (id) on delete cascade,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  title text not null,
  slug text not null,
  excerpt text,
  body jsonb,
  seo_title text,
  seo_description text,
  og_image_path text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_entry_market unique (entry_id, market),
  constraint uq_content_market_slug unique (market, slug)
);
create index content_localizations_entry_idx on public.content_localizations (entry_id);
create index content_localizations_published_idx
  on public.content_localizations (market, published_at desc)
  where status = 'published';

create trigger content_localizations_set_updated_at
  before update on public.content_localizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- case studies + localizations
create table public.case_studies (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  industry text,
  featured boolean not null default false,
  capabilities text[] not null default '{}',
  technologies text[] not null default '{}',
  hero_media_path text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger case_studies_set_updated_at
  before update on public.case_studies
  for each row execute function public.set_updated_at();

create table public.case_study_localizations (
  id uuid primary key default gen_random_uuid(),
  case_study_id uuid not null references public.case_studies (id) on delete cascade,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  title text not null,
  slug text not null,
  summary text,
  challenge text,
  strategy text,
  solution text,
  results jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_case_market unique (case_study_id, market),
  constraint uq_case_market_slug unique (market, slug)
);
create index case_study_localizations_case_idx on public.case_study_localizations (case_study_id);

create trigger case_study_localizations_set_updated_at
  before update on public.case_study_localizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- products + localizations
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  featured boolean not null default false,
  logo_path text,
  hero_media_path text,
  capabilities text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_localizations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  slug text not null,
  tagline text,
  description text,
  seo_title text,
  seo_description text,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_product_market unique (product_id, market),
  constraint uq_product_market_slug unique (market, slug)
);
create index product_localizations_product_idx on public.product_localizations (product_id);

create trigger product_localizations_set_updated_at
  before update on public.product_localizations
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- newsletter (website owns consent; provider owns delivery)
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  market text not null check (market in ('PT', 'BR', 'INTL')),
  locale text not null,
  source text,
  status text not null default 'subscribed'
    check (status in ('subscribed', 'unsubscribed', 'bounced')),
  consent_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
-- Case-insensitive email uniqueness (expression indexes cannot live in table constraints).
create unique index uq_subscriber_email on public.newsletter_subscribers (lower(email));

create trigger newsletter_subscribers_set_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- admin audit (who/what/which/when; no snapshots, no secrets)
create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index admin_audit_log_occurred_idx on public.admin_audit_log (occurred_at desc);

-- ---------------------------------------------------------------- RLS
alter table public.content_authors enable row level security;
alter table public.content_categories enable row level security;
alter table public.content_category_localizations enable row level security;
alter table public.content_entries enable row level security;
alter table public.content_localizations enable row level security;
alter table public.case_studies enable row level security;
alter table public.case_study_localizations enable row level security;
alter table public.products enable row level security;
alter table public.product_localizations enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.admin_audit_log enable row level security;

-- Public reads: published rows only (localizations require a published parent).
create policy "content_public_read" on public.content_authors
  for select using (true);
create policy "categories_public_read" on public.content_categories
  for select using (true);
create policy "category_localizations_public_read" on public.content_category_localizations
  for select using (true);

create policy "entries_public_read" on public.content_entries
  for select using (status = 'published');

create policy "entry_localizations_public_read" on public.content_localizations
  for select using (
    status = 'published'
    and exists (
      select 1 from public.content_entries e
      where e.id = entry_id and e.status = 'published'
    )
  );

create policy "cases_public_read" on public.case_studies
  for select using (status = 'published');

create policy "case_localizations_public_read" on public.case_study_localizations
  for select using (
    status = 'published'
    and exists (
      select 1 from public.case_studies c
      where c.id = case_study_id and c.status = 'published'
    )
  );

create policy "products_public_read" on public.products
  for select using (status = 'published');

create policy "product_localizations_public_read" on public.product_localizations
  for select using (
    status = 'published'
    and exists (
      select 1 from public.products p
      where p.id = product_id and p.status = 'published'
    )
  );

-- Admin management for all content/commercial/governance tables in this file.
create policy "content_admin_all" on public.content_authors
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "categories_admin_all" on public.content_categories
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "category_localizations_admin_all" on public.content_category_localizations
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "entries_admin_all" on public.content_entries
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "entry_localizations_admin_all" on public.content_localizations
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "cases_admin_all" on public.case_studies
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "case_localizations_admin_all" on public.case_study_localizations
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "products_admin_all" on public.products
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "product_localizations_admin_all" on public.product_localizations
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));
create policy "subscribers_admin_all" on public.newsletter_subscribers
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Audit log: admin read only; writes via service role (Edge functions).
create policy "audit_admin_select" on public.admin_audit_log
  for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- ---------------------------------------------------------------- storage buckets (deterministic per environment)
insert into storage.buckets (id, name, public)
values ('public-media', 'public-media', true),
       ('private-assets', 'private-assets', false)
on conflict (id) do nothing;

create policy "public_media_public_read"
  on storage.objects for select
  using (bucket_id = 'public-media');

create policy "public_media_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'public-media' and public.has_role(auth.uid(), 'admin'));

create policy "public_media_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'public-media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'public-media' and public.has_role(auth.uid(), 'admin'));

create policy "public_media_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'public-media' and public.has_role(auth.uid(), 'admin'));

create policy "private_assets_admin_all"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'private-assets' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'private-assets' and public.has_role(auth.uid(), 'admin'));
