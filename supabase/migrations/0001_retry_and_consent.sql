-- Migration: failed-send retry support + unsubscribe/consent.
-- Safe to run against an existing ReviewFlow database that was created from
-- an earlier version of schema.sql. All changes are additive; nothing is
-- dropped. Run this once in the Supabase SQL editor (or via `supabase db
-- push`) on any project that predates this migration.

-- ---------------------------------------------------------------------------
-- customers.unsubscribed_at
-- ---------------------------------------------------------------------------
alter table public.customers
  add column if not exists unsubscribed_at timestamptz;

-- ---------------------------------------------------------------------------
-- review_requests: retry support
-- ---------------------------------------------------------------------------
alter table public.review_requests
  add column if not exists attempts integer not null default 0,
  add column if not exists max_attempts integer not null default 5,
  add column if not exists next_attempt_at timestamptz,
  add column if not exists last_error text;

-- Allow a 'cancelled' status (used when a customer unsubscribes before their
-- pending request is sent) alongside the existing pending/sent/failed.
alter table public.review_requests
  drop constraint if exists review_requests_status_check;

alter table public.review_requests
  add constraint review_requests_status_check
  check (status in ('pending', 'sent', 'failed', 'cancelled'));

create index if not exists review_requests_status_next_attempt_idx
  on public.review_requests (status, next_attempt_at);
