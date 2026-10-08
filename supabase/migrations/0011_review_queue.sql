-- Review queue: imported customers wait as 'queued' messages until the owner sends them.
-- Safe to re-run.
alter table public.messages drop constraint if exists messages_status_check;
alter table public.messages add constraint messages_status_check
  check (status in ('queued', 'pending', 'sent', 'failed', 'cancelled'));

-- The service visit a queued review request is about (shown in the queue).
alter table public.messages add column if not exists visit_id uuid references public.visits (id) on delete set null;
