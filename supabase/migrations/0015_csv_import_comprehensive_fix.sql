-- COMPREHENSIVE SCHEMA FIX: Ensure all required columns for CSV import exist
-- This migration ensures the database has all columns needed for the CSV import to work
-- Safe to run multiple times (uses IF NOT EXISTS)

-- 1. Ensure visit_id column exists on messages table
-- Required for linking review requests to the service visit
alter table public.messages add column if not exists visit_id uuid references public.visits (id) on delete set null;

-- 2. Ensure status check constraint includes 'queued' status
-- Required for manual review workflows (autoSend=false)
alter table public.messages drop constraint if exists messages_status_check;
alter table public.messages add constraint messages_status_check
  check (status in ('queued', 'pending', 'sent', 'failed', 'cancelled'));

-- 3. Create index on visit_id for performance if it doesn't exist
create index if not exists messages_visit_id_idx on public.messages (visit_id);
