-- Onboarding completion flag + one-time email notification flags. Safe to re-run.
alter table public.businesses
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists welcome_email_sent_at timestamptz,
  add column if not exists campaign_email_sent_at timestamptz,
  add column if not exists trial_ending_email_sent_at timestamptz;
