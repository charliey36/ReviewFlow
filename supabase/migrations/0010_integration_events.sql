-- Log of requests received by the integrations endpoint (for the "Recent events" list). Safe to re-run.
create table if not exists public.integration_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  source text not null default 'api' check (source in ('api', 'test')),
  endpoint text not null,
  status text not null check (status in ('imported', 'updated', 'duplicate', 'failed')),
  message text not null,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists integration_events_business_created_idx
  on public.integration_events (business_id, created_at desc);
alter table public.integration_events enable row level security; -- server-only (service role)
