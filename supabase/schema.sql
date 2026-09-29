-- ReviewFlow MVP schema
-- Run this in the Supabase SQL editor (or via `supabase db push` with this file
-- in supabase/migrations) on a fresh project.

-- ---------------------------------------------------------------------------
-- businesses
-- One row per authenticated user (owner_id = auth.users.id). Holds the
-- settings shown on the Settings page.
-- ---------------------------------------------------------------------------
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'My Business',
  google_review_url text not null default '',
  delay_hours numeric not null default 2,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create index if not exists customers_business_id_idx on public.customers (business_id);

-- ---------------------------------------------------------------------------
-- review_requests
-- One row per customer, created at the same time as the customer, with a
-- computed send_at time. The scheduled job flips status pending -> sent.
-- ---------------------------------------------------------------------------
create table if not exists public.review_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  send_at timestamptz not null,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists review_requests_business_id_idx on public.review_requests (business_id);
create index if not exists review_requests_status_send_at_idx on public.review_requests (status, send_at);

-- ---------------------------------------------------------------------------
-- click_events
-- One row per click on the tracked review link inside an email.
-- ---------------------------------------------------------------------------
create table if not exists public.click_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  review_request_id uuid not null references public.review_requests (id) on delete cascade,
  clicked_at timestamptz not null default now()
);

create index if not exists click_events_business_id_idx on public.click_events (business_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- Each business owner can only see/manage their own rows. The scheduled email
-- job and the public click-tracking redirect run with the service role key,
-- which bypasses RLS by design (needed since click tracking is hit by an
-- unauthenticated visitor from their email client).
-- ---------------------------------------------------------------------------
alter table public.businesses enable row level security;
alter table public.customers enable row level security;
alter table public.review_requests enable row level security;
alter table public.click_events enable row level security;

drop policy if exists "Owner can manage own business" on public.businesses;
create policy "Owner can manage own business"
  on public.businesses
  for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop policy if exists "Owner can manage own customers" on public.customers;
create policy "Owner can manage own customers"
  on public.customers
  for all
  using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  )
  with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

drop policy if exists "Owner can manage own review requests" on public.review_requests;
create policy "Owner can manage own review requests"
  on public.review_requests
  for all
  using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  )
  with check (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

drop policy if exists "Owner can view own click events" on public.click_events;
create policy "Owner can view own click events"
  on public.click_events
  for select
  using (
    business_id in (select id from public.businesses where owner_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Keep businesses.updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists businesses_set_updated_at on public.businesses;
create trigger businesses_set_updated_at
  before update on public.businesses
  for each row
  execute function public.set_updated_at();
