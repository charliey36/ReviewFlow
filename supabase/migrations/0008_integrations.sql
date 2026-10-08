-- Integrations foundation. Service visits reuse the existing `visits` table
-- (visited_at = service date, price = amount spent). Safe to re-run.
alter table public.customers
  add column if not exists total_spend numeric not null default 0,
  add column if not exists visit_count integer not null default 0;

-- One API key per business. Only a SHA-256 hash is stored; the plaintext key
-- is shown once at generation. RLS on with no policies = server (service role) only.
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses (id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.api_keys enable row level security;
