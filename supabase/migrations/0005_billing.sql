-- Migration: billing state for the single Pentriq monthly plan.
-- Stripe is not wired yet; these columns are the only state Stripe webhooks
-- will need to write later. Safe to re-run.
alter table public.businesses
  add column if not exists subscription_status text not null default 'trialing',
  add column if not exists trial_ends_at timestamptz not null default (now() + interval '14 days'),
  add column if not exists current_period_end timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text;

alter table public.businesses drop constraint if exists businesses_subscription_status_check;
alter table public.businesses add constraint businesses_subscription_status_check
  check (subscription_status in ('trialing','active','past_due','canceled'));
