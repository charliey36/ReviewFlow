-- DEMO ONLY: simulates a company's own job/booking database that ReviewFlow
-- syncs from. Add a row in the Supabase Table Editor; the sync imports it.
-- business_id defaults to the Charlie test organisation.
create table if not exists public.demo_company_records (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null default '0b057a54-9825-4707-acb1-783b69224622'
    references public.businesses (id) on delete cascade,
  customer_name text not null,
  email text not null,
  phone text,
  amount_spent numeric not null default 0,
  service_date date not null default current_date,
  created_at timestamptz not null default now(),
  synced_at timestamptz
);
alter table public.demo_company_records enable row level security; -- server-only

-- Sample rows (appear in ReviewFlow after the first sync)
insert into public.demo_company_records (customer_name, email, phone, amount_spent, service_date) values
  ('Alice Walker', 'alice.walker@example.com', '07700900001', 120, current_date - 2),
  ('Bob Henderson', 'bob.henderson@example.com', '07700900002', 85.5, current_date - 10);
