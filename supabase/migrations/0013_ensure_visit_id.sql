-- Ensure visit_id column exists on messages table
-- This is a defensive migration in case the column was not created by earlier migrations
-- Safe to re-run (idempotent)

alter table public.messages add column if not exists visit_id uuid references public.visits (id) on delete set null;
